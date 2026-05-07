import type {
  CreateConnectionSuggestion,
  CreateUnderstandingResult,
} from "@/features/create/intelligentFollowupContract";

type BuildCreateFollowupTargetHrefInput = {
  kind: CreateConnectionSuggestion["kind"];
  ctaHref: string;
  topics: CreateUnderstandingResult["topics"];
  statements: CreateUnderstandingResult["statements"];
  stance?: CreateConnectionSuggestion["suggestedStance"] | null;
  suggestionTitle?: string | null;
  suggestionHref?: string | null;
};

function mapStatementStance(
  stance: CreateUnderstandingResult["statements"][number]["stance"] | undefined,
): "pro" | "contra" | "open" {
  if (stance === "pro") return "pro";
  if (stance === "contra") return "contra";
  return "open";
}

function buildSwipesHref(params: {
  topic?: string | null;
  claim?: string | null;
  stance?: string | null;
}): string {
  const search = new URLSearchParams();
  if (params.topic) search.set("topic", params.topic);
  if (params.claim) search.set("claim", params.claim);
  if (params.stance) search.set("stance", params.stance);
  search.set("from", "create");
  return `/swipes?${search.toString()}`;
}

function buildDossierHref(topic?: string | null): string {
  const search = new URLSearchParams();
  if (topic) search.set("topic", topic);
  search.set("from", "create");
  return `/dossier?${search.toString()}`;
}

export function buildCreateFollowupTargetHref(input: BuildCreateFollowupTargetHrefInput): string {
  const primaryTopic = input.topics[0]?.label?.trim() || null;
  const primaryClaim =
    input.statements[0]?.text?.trim() || (input.suggestionTitle ? input.suggestionTitle.trim() : null);
  const statementStance = mapStatementStance(input.statements[0]?.stance);
  const seedStance =
    input.stance === "yes"
      ? "pro"
      : input.stance === "no"
        ? "contra"
        : input.stance === "abstain"
          ? "open"
          : statementStance;

  if (input.kind === "dossier") {
    return buildDossierHref(primaryTopic);
  }
  if (input.kind === "vote") {
    if (!primaryClaim) return buildDossierHref(primaryTopic);
    return buildSwipesHref({
      topic: primaryTopic,
      claim: primaryClaim,
      stance: seedStance,
    });
  }
  if (input.kind === "topic") {
    return buildDossierHref(primaryTopic);
  }
  if (input.kind === "new_anlassraum") {
    const search = new URLSearchParams();
    search.set("mode", "source");
    if (primaryTopic) search.set("seedTopic", primaryTopic);
    if (primaryClaim) search.set("seedClaim", primaryClaim);
    return `/create?${search.toString()}`;
  }
  if (input.kind === "anlassraum") {
    if (input.suggestionHref && input.suggestionHref.trim()) return input.suggestionHref.trim();
    return buildDossierHref(primaryTopic);
  }

  return input.ctaHref;
}

export function buildCreateFollowupPrimaryCtaHref(params: {
  ctaHref: string;
  topics: CreateUnderstandingResult["topics"];
  statements: CreateUnderstandingResult["statements"];
  suggestions: CreateConnectionSuggestion[];
}): string {
  const voteSuggestion = params.suggestions.find(
    (item) => item.kind === "vote" && (params.statements[0]?.text?.trim()?.length ?? 0) > 0,
  );
  const dossierSuggestion = params.suggestions.find((item) => item.kind === "dossier");
  const preferred = voteSuggestion ?? dossierSuggestion ?? null;
  if (!preferred) return params.ctaHref;
  return buildCreateFollowupTargetHref({
    kind: preferred.kind,
    ctaHref: params.ctaHref,
    topics: params.topics,
    statements: params.statements,
    stance: preferred.suggestedStance ?? null,
    suggestionTitle: preferred.title,
    suggestionHref: preferred.href ?? null,
  });
}
