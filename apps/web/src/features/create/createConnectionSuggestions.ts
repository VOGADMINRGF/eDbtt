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
  return /abstimm|stimme|vot|entscheid|beschluss|ja\/nein/.test(normalized);
}

export function buildCreateConnectionSuggestions(
  input: BuildCreateConnectionSuggestionsInput,
): CreateConnectionSuggestion[] {
  const suggestions: CreateConnectionSuggestion[] = [];
  const maxSuggestions = Math.max(2, Math.min(8, input.maxSuggestions ?? 5));
  const topics = input.understanding.topics.slice(0, 2);
  const topStatement = input.understanding.statements[0];
  const strongestTopic = topics[0]?.label ?? "Themencluster";

  if (input.dossierId) {
    suggestions.push({
      id: `dossier:${input.dossierId}`,
      kind: "dossier",
      title: `Dossier ${input.dossierId}`,
      reason: "Ein vorhandener Dossier-Bezug ist bereits gesetzt.",
      confidence: "high",
      href: `/dossier/${encodeURIComponent(input.dossierId)}`,
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: topStatement ? mapVoteStance(topStatement.stance) : null,
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
      suggestedStance: topStatement ? mapVoteStance(topStatement.stance) : null,
      requiresConfirmation: true,
    });
  }

  if (topics.length > 0) {
    suggestions.push({
      id: `topic:${topics[0].id}`,
      kind: "topic",
      title: `Thema: ${topics[0].label}`,
      reason: "Thematische Nähe aus deinem Text erkannt.",
      confidence: topics[0].confidence,
      href: `/swipes?topic=${encodeURIComponent(topics[0].label)}`,
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: topStatement ? mapVoteStance(topStatement.stance) : null,
      requiresConfirmation: true,
    });
  }

  if (topStatement && shouldSuggestVote(input.text)) {
    suggestions.push({
      id: `vote:${topStatement.id}`,
      kind: "vote",
      title: `Mögliche Abstimmung: ${topStatement.text.slice(0, 72)}`,
      reason: "Im Text ist ein abstimmungsnaher Bezug erkennbar.",
      confidence: mapConfidence(topStatement.confidence === "high" ? 0.8 : topStatement.confidence === "medium" ? 0.55 : 0.3),
      href: "/swipes",
      suggestedContributionKind: topStatement.kind,
      suggestedStance: mapVoteStance(topStatement.stance),
      requiresConfirmation: true,
    });
  }

  if (suggestions.length < maxSuggestions) {
    suggestions.push({
      id: "new_anlassraum:auto",
      kind: "new_anlassraum",
      title: `Neuen Anlassraum zu ${strongestTopic} vorschlagen`,
      reason: "Kein vollständig passender Anschluss ist sicher genug.",
      confidence: input.understanding.confidence === "high" ? "medium" : "low",
      href: input.intent === "check" ? "/create?intent=check" : "/create?intent=contribute",
      suggestedContributionKind: input.understanding.categories[0]?.id ?? "hint",
      suggestedStance: topStatement ? mapVoteStance(topStatement.stance) : null,
      requiresConfirmation: true,
    });
  }

  return suggestions.slice(0, maxSuggestions);
}
