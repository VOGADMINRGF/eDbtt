import type { CreateIntent } from "@/features/create/intentFlows";
import type { CreatePlannerResult } from "@/features/create/createPlanner";
import type {
  CreateConnectionSuggestion,
  CreateUnderstandingResult,
} from "@/features/create/intelligentFollowupContract";

type BuildCreateConnectionSuggestionsInput = {
  text: string;
  intent?: CreateIntent;
  understanding: CreateUnderstandingResult;
  planner?: CreatePlannerResult | null;
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

function isVoteableClaim(params: {
  statement: CreateUnderstandingResult["statements"][number];
  sourceText: string;
}): boolean {
  const statementText = params.statement.text.toLowerCase();
  if (params.statement.kind === "question" || params.statement.kind === "option") return true;
  if (params.statement.kind === "demand") {
    return /soll|sollen|muss|müssen|option|prioris|abstimm|entscheid|beschluss|ja\/nein/.test(statementText);
  }
  return shouldSuggestVote(`${params.sourceText} ${params.statement.text}`);
}

function hasExplicitOfficeholderTopic(lowered: string): boolean {
  return /\bamtstr[aä]ger\b|\bpolitiker\b|\bmandatstr[aä]ger\b|\bminister\b|\babgeordnete?\b|\bpolitische [aä]mter\b/.test(lowered);
}

function resolvePlannerTopic(planner?: CreatePlannerResult | null): string | null {
  const topic = String(planner?.plannerTopic ?? "").trim();
  return topic || null;
}

function resolveHumanConnectionTitle(topics: Array<{ label: string }>, planner?: CreatePlannerResult | null): string {
  const plannerTopic = resolvePlannerTopic(planner);
  if (plannerTopic) return plannerTopic;
  const lowered = topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (
    /kommunale priorit[aä]ten und zielkonflikte|wohnen|verkehr|klima|bildung|migration\/integration|sicherheit\/rechtsstaat|gesundheit\/pflege|kommunale finanzen|bürgerbeteiligung/.test(
      lowered,
    )
  ) {
    return "Kommunale Prioritäten und Zielkonflikte";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /qualifikation|verantwort|sanktion/.test(lowered)) {
    return "Politische Verantwortung und Mindestanforderungen für Amtsträger";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /sanktion|kontroll|mandat/.test(lowered)) {
    return "Sanktionen und Kontrolle öffentlicher Mandate";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /gesetz|gesetzgebung/.test(lowered)) {
    return "Gesetzgebung und Verantwortung im Amt";
  }
  return "Neues öffentliches Thema";
}

function resolveDossierSuggestionTitle(topics: Array<{ label: string }>, planner?: CreatePlannerResult | null): string {
  const plannerTopic = resolvePlannerTopic(planner);
  if (plannerTopic) return plannerTopic;
  const lowered = topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (
    /kommunale priorit[aä]ten und zielkonflikte|wohnen|verkehr|klima|bildung|migration\/integration|sicherheit\/rechtsstaat|gesundheit\/pflege|kommunale finanzen|bürgerbeteiligung/.test(
      lowered,
    )
  ) {
    return "Kommunale Prioritäten und Zielkonflikte";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /verantwort|mandat|qualifikation|sanktion/.test(lowered)) {
    return "Politische Verantwortung öffentlicher Mandate";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /sanktion|qualifikation/.test(lowered)) {
    return "Sanktionen und Qualifikation politischer Ämter";
  }
  return resolveHumanConnectionTitle(topics, planner);
}

function resolveNewAnlassraumTitle(topics: Array<{ label: string }>, planner?: CreatePlannerResult | null): string {
  const plannerTopic = resolvePlannerTopic(planner);
  if (plannerTopic) return plannerTopic;
  const lowered = topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (
    /kommunale priorit[aä]ten und zielkonflikte|wohnen|verkehr|klima|bildung|migration|integration|sicherheit|rechtsstaat|pflege|kommunale finanzen|bürgerbeteiligung/.test(
      lowered,
    )
  ) {
    return "Kommunale Prioritäten und Zielkonflikte";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /sanktion|qualifikation/.test(lowered)) {
    return "Sanktionen und Qualifikation politischer Ämter";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /gesetz|gesetzgebung/.test(lowered)) {
    return "Gesetzgebung und Verantwortung im Amt";
  }
  return resolveHumanConnectionTitle(topics, planner);
}

function resolveVoteSuggestionTitle(params: {
  topics: Array<{ label: string }>;
  planner?: CreatePlannerResult | null;
  statementText?: string | null;
}): string {
  const plannerQuestion = params.planner?.plannerOpenQuestions[1] ?? params.planner?.openQuestions[1] ?? null;
  if (plannerQuestion) return plannerQuestion;
  const lowered = params.topics.map((topic) => topic.label.toLowerCase()).join(" ");
  if (/kommunale priorit[aä]ten und zielkonflikte/.test(lowered)) {
    return "Welche kommunalen Prioritäten sollen zuerst bearbeitet werden?";
  }
  if (hasExplicitOfficeholderTopic(lowered) && /qualifikation|sanktion/.test(lowered)) {
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
  const plannerReadyForStructuredHandoff = input.planner
    ? input.planner.qualityStatus === "specific"
    : true;
  const topics = input.understanding.topics.slice(0, 3);
  const topStatement = input.understanding.statements[0];
  const primaryTopic = topics[0]?.label ?? null;
  const primaryClaim = topStatement?.text?.trim() || null;
  const mappedStance = topStatement ? mapVoteStance(topStatement.stance) : null;

  if (!plannerReadyForStructuredHandoff) {
    suggestions.push({
      id: "new_anlassraum:clarify-first",
      kind: "new_anlassraum",
      title: "Thema zuerst bestätigen",
      reason: "Die Einordnung ist noch zu allgemein. Dossier-, Anlassraum- oder Beteiligungsanschlüsse bleiben bis zur Bestätigung gesperrt.",
      confidence: "low",
      href: input.intent === "check" ? "/create?intent=check" : "/create?intent=contribute",
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
    return suggestions;
  }

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
      title: resolveDossierSuggestionTitle(topics, input.planner),
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

  if (topStatement && primaryClaim && isVoteableClaim({ statement: topStatement, sourceText: input.text })) {
    suggestions.push({
      id: `vote:${topStatement.id}`,
      kind: "vote",
      title: resolveVoteSuggestionTitle({ topics, planner: input.planner, statementText: topStatement.text }),
      reason: "Die Aussage eignet sich als klare Entscheidungsoption oder Abstimmungsfrage im Themenkontext.",
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
    const fallbackTitle = resolveNewAnlassraumTitle(topics, input.planner);
    suggestions.push({
      id: "new_anlassraum:auto",
      kind: "new_anlassraum",
      title: fallbackTitle,
      reason: "Noch kein vollständig passender nächster Schritt ist sicher genug.",
      confidence: input.understanding.confidence === "high" ? "medium" : "low",
      href: input.intent === "check" ? "/create?intent=check" : "/create?intent=contribute",
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: mappedStance,
      requiresConfirmation: true,
    });
  }

  return suggestions.slice(0, maxSuggestions);
}
