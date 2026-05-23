import type { E150ProviderName } from "@features/ai/orchestratorE150";
import type { ProviderDiagnostic } from "@/features/ai/adminTelemetryDiagnostics";
import {
  buildResearchProviderRegistry,
  resolveResearchEntitlements,
  type ResearchProviderId,
} from "@/features/ai/researchProviderRegistry";

export type OrchestrationLane =
  | "fast_draft"
  | "standard_analyze"
  | "material_grounding"
  | "dossier_enrichment"
  | "sealed_factcheck"
  | "premium_deep_research";

export type ProviderRole =
  | "strict_primary"
  | "draft_analysis"
  | "editorial_perspective"
  | "fallback_draft"
  | "optional_large_context"
  | "optional_multimodal"
  | "optional_draft"
  | "research"
  | "research_discovery"
  | "search"
  | "premium_deep_research"
  | "arbiter";

export type ProviderRoleId = E150ProviderName | "perplexity" | "openai_deep_research";

export type ProviderRoleMatrixEntry = {
  provider: ProviderRoleId;
  roles: ProviderRole[];
  analyzeProvider: boolean;
  strictPrimaryCandidate: boolean;
  optionalOnly: boolean;
  notes: string[];
};

export type LaneRoutingPolicy = {
  lane: OrchestrationLane;
  primaryAnalyzeCandidates: ProviderRoleId[];
  draftFallbackCandidates: ProviderRoleId[];
  optionalCandidates: ProviderRoleId[];
  researchCandidates: Array<Extract<ResearchProviderId, "perplexity" | "ari" | "openai_deep_research">>;
  researchRequired: boolean;
  requiredCredits: Array<"search_credit" | "deep_research_credit">;
};

export type OperationalProviderRoutingSummary = {
  selectedLane: OrchestrationLane;
  primaryAnalyzeProvider: ProviderRoleId | null;
  draftFallbackProviders: ProviderRoleId[];
  optionalProviders: ProviderRoleId[];
  researchProviders: ProviderRoleId[];
  blockedProviders: ProviderRoleId[];
  productionEligible: boolean;
  researchRequired: boolean;
  selectedResearchProvider: ResearchProviderId | null;
  availableResearchProviders: ResearchProviderId[];
  blockedResearchProviders: Array<{ provider: ResearchProviderId; reason: string | null }>;
  researchProviderAvailable: boolean;
  researchCreditRequired: boolean;
  researchCreditSatisfied: boolean;
  researchDisabledReason: string | null;
  standardAnalyzeUnaffected: boolean;
  safeToRunStandardAnalyze: boolean;
  safeToRunSealedFactcheck: boolean;
  safeToRunPremiumDeepResearch: boolean;
  nextResearchAction: string;
  nextAction: string;
};

export const PROVIDER_ROLE_MATRIX: readonly ProviderRoleMatrixEntry[] = [
  {
    provider: "openai",
    roles: ["strict_primary", "draft_analysis"],
    analyzeProvider: true,
    strictPrimaryCandidate: true,
    optionalOnly: false,
    notes: ["Strict primary for standard analyze when strict_ok."],
  },
  {
    provider: "anthropic",
    roles: ["editorial_perspective", "draft_analysis"],
    analyzeProvider: true,
    strictPrimaryCandidate: false,
    optionalOnly: false,
    notes: ["Draft fallback/editorial perspective; not strict primary."],
  },
  {
    provider: "mistral",
    roles: ["fallback_draft", "draft_analysis"],
    analyzeProvider: true,
    strictPrimaryCandidate: false,
    optionalOnly: false,
    notes: ["Fallback draft provider; not strict primary."],
  },
  {
    provider: "gemini",
    roles: ["optional_large_context", "optional_multimodal", "optional_draft", "research"],
    analyzeProvider: false,
    strictPrimaryCandidate: false,
    optionalOnly: true,
    notes: ["Optional provider; can support research/material grounding but is not strict primary."],
  },
  {
    provider: "perplexity",
    roles: ["research_discovery", "search"],
    analyzeProvider: false,
    strictPrimaryCandidate: false,
    optionalOnly: true,
    notes: ["Research/search only. Never strict analyze provider."],
  },
  {
    provider: "ari",
    roles: ["premium_deep_research", "arbiter"],
    analyzeProvider: false,
    strictPrimaryCandidate: false,
    optionalOnly: true,
    notes: ["Optional premium deep research/arbiter. Never default analyze provider."],
  },
  {
    provider: "openai_deep_research",
    roles: ["premium_deep_research"],
    analyzeProvider: false,
    strictPrimaryCandidate: false,
    optionalOnly: true,
    notes: ["Optional premium deep research fallback. Never default analyze provider."],
  },
];

export const LANE_ROUTING_POLICY: readonly LaneRoutingPolicy[] = [
  {
    lane: "fast_draft",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari", "openai_deep_research"],
    researchRequired: false,
    requiredCredits: [],
  },
  {
    lane: "standard_analyze",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari", "openai_deep_research"],
    researchRequired: false,
    requiredCredits: [],
  },
  {
    lane: "dossier_enrichment",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari", "openai_deep_research"],
    researchRequired: false,
    requiredCredits: [],
  },
  {
    lane: "material_grounding",
    primaryAnalyzeCandidates: ["mistral", "anthropic"],
    draftFallbackCandidates: [],
    optionalCandidates: [],
    researchCandidates: [],
    researchRequired: false,
    requiredCredits: [],
  },
  {
    lane: "sealed_factcheck",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari", "openai_deep_research"],
    researchRequired: true,
    requiredCredits: ["search_credit"],
  },
  {
    lane: "premium_deep_research",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["ari", "openai_deep_research", "perplexity"],
    researchRequired: true,
    requiredCredits: ["deep_research_credit"],
  },
];

function findLanePolicy(lane: OrchestrationLane): LaneRoutingPolicy {
  return LANE_ROUTING_POLICY.find((entry) => entry.lane === lane) ?? LANE_ROUTING_POLICY[1];
}

function isBlocked(row: ProviderDiagnostic | undefined): boolean {
  if (!row) return false;
  if (row.finalContractStatus === "blocked") return true;
  if (row.status === "config_missing") return true;
  if (row.providerErrorCode === "CONFIG_MISSING") return true;
  return false;
}

function byProvider(rows: ProviderDiagnostic[]): Map<E150ProviderName, ProviderDiagnostic> {
  const out = new Map<E150ProviderName, ProviderDiagnostic>();
  for (const row of rows) out.set(row.provider, row);
  return out;
}

function hasStrictOk(row: ProviderDiagnostic | undefined): boolean {
  return row?.finalContractStatus === "strict_ok";
}

function hasDraftFallback(row: ProviderDiagnostic | undefined): boolean {
  return row?.finalContractStatus === "built_valid" || row?.finalContractStatus === "strict_ok";
}

function isResearchProviderEligibleForLane(
  provider: ResearchProviderId,
  lane: OrchestrationLane,
): boolean {
  if (provider === "disabled") return false;
  if (lane === "premium_deep_research") return provider === "ari" || provider === "openai_deep_research";
  if (lane === "sealed_factcheck") return provider === "perplexity" || provider === "ari" || provider === "openai_deep_research";
  if (lane === "dossier_enrichment") return provider === "perplexity";
  return false;
}

function resolveResearchCreditSatisfied(policy: LaneRoutingPolicy): boolean {
  const entitlements = resolveResearchEntitlements();
  if (policy.requiredCredits.length === 0) return true;
  if (entitlements.premiumResearchOverride) return true;
  return policy.requiredCredits.every((credit) => {
    if (credit === "search_credit") return entitlements.searchCredit;
    if (credit === "deep_research_credit") return entitlements.deepResearchCredit;
    return false;
  });
}

function toProviderRoleId(provider: ResearchProviderId): ProviderRoleId | null {
  if (provider === "perplexity") return "perplexity";
  if (provider === "ari") return "ari";
  if (provider === "openai_deep_research") return "openai_deep_research";
  return null;
}

function buildResearchDecision(params: { lane: OrchestrationLane; policy: LaneRoutingPolicy }) {
  const registry = buildResearchProviderRegistry();
  const candidateProviders = registry.activeProviders.filter((entry) =>
    params.policy.researchCandidates.includes(
      entry.provider as Extract<ResearchProviderId, "perplexity" | "ari" | "openai_deep_research">,
    ),
  );

  const eligibleProviders = candidateProviders.filter(
    (entry) =>
      isResearchProviderEligibleForLane(entry.provider, params.lane),
  );

  const availableEligible = eligibleProviders.filter((entry) => entry.availability === "available");
  const availableCandidates = candidateProviders.filter((entry) => entry.availability === "available");
  const selectedResearchProvider = availableEligible[0]?.provider ?? null;
  const researchProviderAvailable = availableEligible.length > 0;

  const researchCreditRequired = params.policy.requiredCredits.length > 0;
  const researchCreditSatisfied = resolveResearchCreditSatisfied(params.policy);

  let researchDisabledReason: string | null = null;
  if (params.policy.researchRequired && !researchProviderAvailable) {
    researchDisabledReason = "no_research_provider_available";
  } else if (researchCreditRequired && !researchCreditSatisfied) {
    researchDisabledReason = "missing_research_credit";
  }

  const safeToRunStandardAnalyze = true;
  const safeToRunSealedFactcheck = Boolean(
    availableCandidates.some((entry) => isResearchProviderEligibleForLane(entry.provider, "sealed_factcheck")) &&
      researchCreditSatisfied,
  );
  const safeToRunPremiumDeepResearch = Boolean(
    availableCandidates.some((entry) => isResearchProviderEligibleForLane(entry.provider, "premium_deep_research")) &&
      researchCreditSatisfied,
  );

  let nextResearchAction = "Keine Aktion";
  if (params.lane === "standard_analyze") {
    nextResearchAction = "Standard Analyze bleibt ohne externen Research-Provider lauffähig.";
  } else if (params.policy.researchRequired && !researchProviderAvailable) {
    nextResearchAction = "Research-Provider fehlt oder ist deaktiviert; Perplexity/ARI/OpenAI Deep Research Konfiguration prüfen.";
  } else if (researchCreditRequired && !researchCreditSatisfied) {
    nextResearchAction = "Benötigte Research-Credits oder premium_research_override fehlen.";
  } else if (selectedResearchProvider) {
    nextResearchAction = `Research-Provider ${selectedResearchProvider} ist für den Lane-Pfad verfügbar.`;
  }

  return {
    selectedResearchProvider,
    researchProviderAvailable,
    availableResearchProviders: availableCandidates.map((entry) => entry.provider),
    blockedResearchProviders: candidateProviders
      .filter((entry) => entry.availability !== "available")
      .map((entry) => ({ provider: entry.provider, reason: entry.reason })),
    researchCreditRequired,
    researchCreditSatisfied,
    researchDisabledReason,
    standardAnalyzeUnaffected: true,
    safeToRunStandardAnalyze,
    safeToRunSealedFactcheck,
    safeToRunPremiumDeepResearch,
    nextResearchAction,
  };
}

export function defaultLaneForSmokeMode(
  mode: "provider_probe" | "runtime_smoke" | "full_contract",
): OrchestrationLane {
  if (mode === "provider_probe") return "fast_draft";
  if (mode === "runtime_smoke") return "fast_draft";
  return "standard_analyze";
}

export function resolveOperationalProviderRoutingSummary(params: {
  lane: OrchestrationLane;
  rows: ProviderDiagnostic[];
  directContractRows?: ProviderDiagnostic[];
}): OperationalProviderRoutingSummary {
  const policy = findLanePolicy(params.lane);
  const evaluationRows =
    Array.isArray(params.directContractRows) && params.directContractRows.length > 0
      ? params.directContractRows
      : params.rows;
  const providerMap = byProvider(evaluationRows);

  const openaiRow = providerMap.get("openai");
  const primaryAnalyzeProvider = hasStrictOk(openaiRow) ? "openai" : null;

  const draftFallbackProviders = policy.draftFallbackCandidates.filter((provider) =>
    provider === "anthropic" || provider === "mistral" ? hasDraftFallback(providerMap.get(provider)) : false,
  );
  const optionalProviders = policy.optionalCandidates.filter((provider) => provider !== "perplexity");
  const researchProviders = policy.researchCandidates
    .map((provider) => toProviderRoleId(provider))
    .filter((provider): provider is ProviderRoleId => provider !== null);
  const blockedProviders = (["openai", "anthropic", "mistral", "gemini", "ari"] as const).filter((provider) =>
    isBlocked(providerMap.get(provider)),
  );

  const baseAnalyzeEligible = Boolean(primaryAnalyzeProvider) || draftFallbackProviders.length > 0;
  const researchRequired = policy.researchRequired;
  const researchDecision = buildResearchDecision({ lane: params.lane, policy });
  const researchEligible =
    !researchRequired || (researchDecision.researchProviderAvailable && researchDecision.researchCreditSatisfied);
  const productionEligible = baseAnalyzeEligible && researchEligible;

  let nextAction = "Keine Aktion";
  if (!baseAnalyzeEligible) {
    nextAction =
      "OpenAI strict_primary stabilisieren oder Anthropic/Mistral als built_valid/strict fallback herstellen.";
  } else if (researchRequired && !researchDecision.researchProviderAvailable) {
    nextAction = "Research-Provider fehlt: Perplexity/ARI/OpenAI Deep Research Verfügbarkeit und ENV prüfen.";
  } else if (researchRequired && !researchDecision.researchCreditSatisfied) {
    nextAction = "Research-Credits fehlen: search_credit/deep_research_credit oder premium_research_override prüfen.";
  } else if (!primaryAnalyzeProvider && draftFallbackProviders.length > 0) {
    nextAction = "Standard läuft über Draft-Fallback; OpenAI strict_primary weiter härten.";
  }

  return {
    selectedLane: params.lane,
    primaryAnalyzeProvider,
    draftFallbackProviders,
    optionalProviders,
    researchProviders,
    blockedProviders,
    productionEligible,
    researchRequired,
    selectedResearchProvider: researchDecision.selectedResearchProvider,
    availableResearchProviders: researchDecision.availableResearchProviders,
    blockedResearchProviders: researchDecision.blockedResearchProviders,
    researchProviderAvailable: researchDecision.researchProviderAvailable,
    researchCreditRequired: researchDecision.researchCreditRequired,
    researchCreditSatisfied: researchDecision.researchCreditSatisfied,
    researchDisabledReason: researchDecision.researchDisabledReason,
    standardAnalyzeUnaffected: researchDecision.standardAnalyzeUnaffected,
    safeToRunStandardAnalyze: researchDecision.safeToRunStandardAnalyze,
    safeToRunSealedFactcheck: researchDecision.safeToRunSealedFactcheck,
    safeToRunPremiumDeepResearch: researchDecision.safeToRunPremiumDeepResearch,
    nextResearchAction: researchDecision.nextResearchAction,
    nextAction,
  };
}
