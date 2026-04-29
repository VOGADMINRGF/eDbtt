import type { E150ProviderName } from "@features/ai/orchestratorE150";
import type { ProviderDiagnostic } from "@/features/ai/adminTelemetryDiagnostics";

export type OrchestrationLane =
  | "fast_draft"
  | "standard_analyze"
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
  | "research_discovery"
  | "search"
  | "premium_deep_research"
  | "arbiter";

export type ProviderRoleId = E150ProviderName | "perplexity";

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
  researchCandidates: ProviderRoleId[];
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
    roles: ["optional_large_context", "optional_multimodal", "optional_draft"],
    analyzeProvider: false,
    strictPrimaryCandidate: false,
    optionalOnly: true,
    notes: ["Optional provider; not part of all-primary or strict primary."],
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
];

export const LANE_ROUTING_POLICY: readonly LaneRoutingPolicy[] = [
  {
    lane: "fast_draft",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari"],
    researchRequired: false,
    requiredCredits: [],
  },
  {
    lane: "standard_analyze",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari"],
    researchRequired: false,
    requiredCredits: [],
  },
  {
    lane: "dossier_enrichment",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari"],
    researchRequired: false,
    requiredCredits: [],
  },
  {
    lane: "sealed_factcheck",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["perplexity", "ari"],
    researchRequired: true,
    requiredCredits: ["search_credit"],
  },
  {
    lane: "premium_deep_research",
    primaryAnalyzeCandidates: ["openai"],
    draftFallbackCandidates: ["anthropic", "mistral"],
    optionalCandidates: ["gemini"],
    researchCandidates: ["ari", "perplexity"],
    researchRequired: true,
    requiredCredits: ["deep_research_credit"],
  },
];

function hasAnyValue(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => typeof value === "string" && value.trim().length > 0);
}

function ariConfigured(): boolean {
  return hasAnyValue(
    process.env.ARI_BASE_URL,
    process.env.ARI_URL,
    process.env.ARI_API_URL,
    process.env.YOUCOM_ARI_API_URL,
  ) && hasAnyValue(process.env.ARI_API_KEY, process.env.YOUCOM_ARI_API_KEY);
}

function perplexityConfigured(): boolean {
  const disabled = (process.env.PERPLEXITY_DISABLED ?? "0").toLowerCase();
  if (disabled === "1" || disabled === "true" || disabled === "yes") return false;
  const hasBase = hasAnyValue(process.env.PERPLEXITY_BASE_URL) || true;
  return hasBase && hasAnyValue(process.env.PERPLEXITY_API_KEY);
}

function hasSearchCredit(): boolean {
  const value = (process.env.SEARCH_CREDIT_AVAILABLE ?? "").toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function hasDeepResearchCredit(): boolean {
  const value = (process.env.DEEP_RESEARCH_CREDIT_AVAILABLE ?? "").toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

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

function byProvider(rows: ProviderDiagnostic[]): Map<ProviderRoleId, ProviderDiagnostic> {
  const out = new Map<ProviderRoleId, ProviderDiagnostic>();
  for (const row of rows) out.set(row.provider as ProviderRoleId, row);
  return out;
}

function hasStrictOk(row: ProviderDiagnostic | undefined): boolean {
  return row?.finalContractStatus === "strict_ok";
}

function hasDraftFallback(row: ProviderDiagnostic | undefined): boolean {
  return row?.finalContractStatus === "built_valid" || row?.finalContractStatus === "strict_ok";
}

function researchProviderAvailable(provider: ProviderRoleId): boolean {
  if (provider === "perplexity") return perplexityConfigured();
  if (provider === "ari") return ariConfigured();
  return false;
}

function requiredCreditsAvailable(requiredCredits: LaneRoutingPolicy["requiredCredits"]): boolean {
  if (requiredCredits.length === 0) return true;
  return requiredCredits.every((credit) => {
    if (credit === "search_credit") return hasSearchCredit();
    if (credit === "deep_research_credit") return hasDeepResearchCredit();
    return false;
  });
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
    hasDraftFallback(providerMap.get(provider)),
  );
  const optionalProviders = policy.optionalCandidates.filter((provider) => provider !== "perplexity");
  const researchProviders = policy.researchCandidates;
  const blockedProviders = PROVIDER_ROLE_MATRIX.map((entry) => entry.provider).filter((provider) =>
    isBlocked(providerMap.get(provider as ProviderRoleId)),
  );

  const baseAnalyzeEligible = Boolean(primaryAnalyzeProvider) || draftFallbackProviders.length > 0;
  const researchRequired = policy.researchRequired;
  const availableResearchProviders = researchProviders.filter((provider) => researchProviderAvailable(provider));
  const creditsOk = requiredCreditsAvailable(policy.requiredCredits);
  const researchEligible = !researchRequired || (availableResearchProviders.length > 0 && creditsOk);
  const productionEligible = baseAnalyzeEligible && researchEligible;

  let nextAction = "Keine Aktion";
  if (!baseAnalyzeEligible) {
    nextAction =
      "OpenAI strict_primary stabilisieren oder Anthropic/Mistral als built_valid/strict fallback herstellen.";
  } else if (researchRequired && availableResearchProviders.length === 0) {
    nextAction = "Research-Provider fehlt: Perplexity/ARI Verfügbarkeit und ENV prüfen.";
  } else if (researchRequired && !creditsOk) {
    nextAction = "Research-Credits fehlen: search_credit/deep_research_credit Entitlements prüfen.";
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
    nextAction,
  };
}
