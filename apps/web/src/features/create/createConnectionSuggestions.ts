import type { CreateIntent } from "@/features/create/intentFlows";
import type {
  CreateConnectionSuggestion,
  CreateUnderstandingResult,
} from "@/features/create/intelligentFollowupContract";

type BuildCreateConnectionSuggestionsInput = {
  text: string;
  intent?: CreateIntent;
  understanding: CreateUnderstandingResult;
  anlassraumId?: string | null;
  dossierId?: string | null;
  maxSuggestions?: number;
};

function buildSeededSwipesHref(params: {
  topic?: string | null;
  claim?: string | null;
  stance?: CreateConnectionSuggestion["suggestedStance"];
}): string {
  const search = new URLSearchParams();
  if (params.topic) search.set("topic", params.topic);
  if (params.claim) search.set("claim", params.claim);
  if (params.stance) search.set("stance", params.stance);
  search.set("from", "create");
  return `/swipes?${search.toString()}`;
}

function buildSeededDossierHref(topic?: string | null): string {
  const search = new URLSearchParams();
  if (topic) search.set("topic", topic);
  search.set("from", "create");
  return `/dossier?${search.toString()}`;
}

function mapConfidence(score: number): "low" | "medium" | "high" {
  if (score >= 0.72) return "high";
  if (score >= 0.42) return "medium";
  return "low";
}

function mapVoteStance(value: CreateUnderstandingResult["statements"][number]["stance"]): CreateConnectionSuggestion["suggestedStance"] {
  if (value === "pro") return "yes";
  if (value === "contra") return "no";
  if (value === "mixed") return "abstain";
  return "open";
}

function shouldSuggestVote(text: string): boolean {
  const normalized = text.toLowerCase();
  return /abstimm|stimme|vot|entscheid|beschluss|ja\/nein|option b|option c|option [a-z]/.test(normalized);
}

function resolveHumanConnectionTitle(topics: Array<{ label: string }>): string {
  const lowered = topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (/verantwort|amtstr[aä]ger|qualifikation/.test(lowered)) {
    return "Politische Verantwortung und Mindestanforderungen für Amtsträger";
  }
  if (/sanktion|kontroll|mandat/.test(lowered)) {
    return "Sanktionen und Kontrolle öffentlicher Mandate";
  }
  if (/gesetz|gesetzgebung/.test(lowered)) {
    return "Gesetzgebung und Verantwortung im Amt";
  }
  return "Politische Verantwortung und Mindestanforderungen für Amtsträger";
}

function resolveDossierSuggestionTitle(topics: Array<{ label: string }>): string {
  const lowered = topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (/verantwort|amtstr[aä]ger|mandat/.test(lowered)) {
    return "Politische Verantwortung öffentlicher Mandate";
  }
  if (/sanktion|qualifikation/.test(lowered)) {
    return "Sanktionen und Qualifikation politischer Ämter";
  }
  return resolveHumanConnectionTitle(topics);
}

function resolveNewAnlassraumTitle(topics: Array<{ label: string }>): string {
  const lowered = topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (/sanktion|qualifikation|amtstr[aä]ger/.test(lowered)) {
    return "Sanktionen und Qualifikation politischer Ämter";
  }
  if (/gesetz|gesetzgebung/.test(lowered)) {
    return "Gesetzgebung und Verantwortung im Amt";
  }
  return resolveHumanConnectionTitle(topics);
}

function resolveVoteSuggestionTitle(params: {
  topics: Array<{ label: string }>;
  statementText?: string | null;
}): string {
  const lowered = params.topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (/amtstr[aä]ger|qualifikation|sanktion/.test(lowered)) {
    return "Mindestanforderungen und Konsequenzen für Amtsträger";
  }
  const statement = String(params.statementText ?? "").trim();
  if (!statement) return "Mögliche Abstimmung aus deinem Beitrag";
  return statement.length > 84 ? `${statement.slice(0, 81)}...` : statement;
}

export function buildCreateConnectionSuggestions(
  input: BuildCreateConnectionSuggestionsInput,
): CreateConnectionSuggestion[] {
  const suggestions: CreateConnectionSuggestion[] = [];
  const maxSuggestions = Math.max(2, Math.min(8, input.maxSuggestions ?? 5));
  const topics = input.understanding.topics.slice(0, 3);
  const topStatement = input.understanding.statements[0];
  const primaryTopic = topics[0]?.label ?? null;
  const primaryClaim = topStatement?.text?.trim() || null;
  const mappedStance = topStatement ? mapVoteStance(topStatement.stance) : null;

  if (input.dossierId) {
    suggestions.push({
      id: `dossier:${input.dossierId}`,
      kind: "dossier",
      title: `Dossier ${input.dossierId}`,
      reason: "Ein vorhandener Dossier-Bezug ist bereits gesetzt.",
      confidence: "high",
      href: `/dossier/${encodeURIComponent(input.dossierId)}`,
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
  } else {
    suggestions.push({
      id: "dossier:auto",
      kind: "dossier",
      title: resolveDossierSuggestionTitle(topics),
      reason: "Themen und Zuständigkeiten aus deinem Beitrag passen zu einem Dossier-Weiterlauf.",
      confidence: input.understanding.confidence,
      href: buildSeededDossierHref(primaryTopic),
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
  }

  if (input.anlassraumId) {
    suggestions.push({
      id: `anlassraum:${input.anlassraumId}`,
      kind: "anlassraum",
      title: `Anlassraum ${input.anlassraumId}`,
      reason: "Der Beitrag wurde mit einem bestehenden Anlassraum gestartet.",
      confidence: "high",
      href: `/runden?view=active&anlassraumId=${encodeURIComponent(input.anlassraumId)}`,
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
  }

  if (topics.length > 0) {
    const topicalTitle = resolveHumanConnectionTitle(topics);
    suggestions.push({
      id: `topic:${topics[0].id}`,
      kind: "topic",
      title: topicalTitle,
      reason: "Unterthema im Dossier-Kontext aus deinem Beitrag erkannt.",
      confidence: topics[0].confidence,
      href: buildSeededDossierHref(topics[0].label),
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
  }

  if (
    topStatement &&
    primaryClaim &&
    (shouldSuggestVote(input.text) ||
      topStatement.kind === "demand" ||
      topStatement.kind === "option" ||
      topStatement.kind === "question")
  ) {
    suggestions.push({
      id: `vote:${topStatement.id}`,
      kind: "vote",
      title: resolveVoteSuggestionTitle({ topics, statementText: topStatement.text }),
      reason: "Die Aussage eignet sich als abstimmbarer Claim zur Einordnung im Themenkontext.",
      confidence: mapConfidence(topStatement.confidence === "high" ? 0.8 : topStatement.confidence === "medium" ? 0.55 : 0.3),
      href: buildSeededSwipesHref({
        topic: primaryTopic,
        claim: primaryClaim,
        stance: mappedStance,
      }),
      suggestedContributionKind: topStatement.kind,
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
  }

  if (suggestions.length < maxSuggestions) {
    const fallbackTitle = resolveNewAnlassraumTitle(topics);
    suggestions.push({
      id: "new_anlassraum:auto",
      kind: "new_anlassraum",
      title: fallbackTitle,
      reason: "Kein vollständig passender Anschluss ist sicher genug.",
      confidence: input.understanding.confidence === "high" ? "medium" : "low",
      href: input.intent === "check" ? "/create?intent=check" : "/create?intent=contribute",
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
  }

  return suggestions.slice(0, maxSuggestions);
}
