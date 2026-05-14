export type ResearchProviderId =
  | "ari"
  | "perplexity"
  | "tavily"
  | "brave"
  | "serper"
  | "custom"
  | "openai_deep_research"
  | "disabled";

export type ResearchProviderRole =
  | "graph_context"
  | "research_discovery"
  | "premium_deep_research"
  | "report_provider"
  | "arbiter"
  | "future_optional";

export type ResearchProviderAvailability =
  | "available"
  | "blocked"
  | "disabled"
  | "offline"
  | "config_missing";

export type ResearchCreditKey = "search_credit" | "deep_research_credit";

export type ResearchQuery = {
  query: string;
  locale?: string | null;
  maxResults?: number | null;
  lane?: string | null;
};

export type ResearchResult = {
  title: string;
  url: string;
  snippet: string;
  sourceName: string;
  publishedAt?: string | null;
  retrievedAt: string;
  confidence?: number | null;
  sourceQuality?: number | null;
  provider: Exclude<ResearchProviderId, "disabled">;
};

export type ResearchReport = {
  provider: Exclude<ResearchProviderId, "disabled">;
  query: string;
  retrievedAt: string;
  items: ResearchResult[];
};

export type ResearchProbeResult = {
  provider: Exclude<ResearchProviderId, "disabled">;
  ok: boolean;
  availability: ResearchProviderAvailability;
  reason: string | null;
};

export type ResearchProviderStatus = {
  provider: ResearchProviderId;
  role: ResearchProviderRole;
  availability: ResearchProviderAvailability;
  disabled: boolean;
  offline: boolean;
  reason: string | null;
  costKnown: boolean;
  pricingSource: string;
  supportsSearch: boolean;
  supportsDeepResearch: boolean;
  supportsReports: boolean;
  requiresCredit: boolean;
  requiresExplicitLane: boolean;
};

export type ResearchProviderRegistry = {
  providerOrder: ResearchProviderId[];
  defaultProvider: Exclude<ResearchProviderId, "disabled"> | null;
  activeProviders: ResearchProviderStatus[];
  availableProviders: ResearchProviderStatus[];
  blockedProviders: ResearchProviderStatus[];
};

export type ResearchEntitlements = {
  searchCredit: boolean;
  deepResearchCredit: boolean;
  dossierBoost: boolean;
  premiumResearchOverride: boolean;
};

function parseBool(value: string | undefined, fallback = false): boolean {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no") return false;
  return fallback;
}

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function resolvePerplexityStatus(): ResearchProviderStatus {
  const explicitlyEnabled = parseBool(process.env.PERPLEXITY_DISABLED, true) === false;
  const hasKey = hasValue(process.env.PERPLEXITY_API_KEY);
  const hasBase = hasValue(process.env.PERPLEXITY_BASE_URL);

  if (!explicitlyEnabled) {
    return {
      provider: "perplexity",
      role: "research_discovery",
      availability: "disabled",
      disabled: true,
      offline: false,
      reason: "disabled_by_env",
      costKnown: false,
      pricingSource: "unknown",
      supportsSearch: true,
      supportsDeepResearch: false,
      supportsReports: false,
      requiresCredit: true,
      requiresExplicitLane: false,
    };
  }

  if (!hasKey) {
    return {
      provider: "perplexity",
      role: "research_discovery",
      availability: "config_missing",
      disabled: false,
      offline: false,
      reason: "missing_perplexity_api_key",
      costKnown: false,
      pricingSource: "unknown",
      supportsSearch: true,
      supportsDeepResearch: false,
      supportsReports: false,
      requiresCredit: true,
      requiresExplicitLane: false,
    };
  }

  if (!hasBase) {
    return {
      provider: "perplexity",
      role: "research_discovery",
      availability: "config_missing",
      disabled: false,
      offline: false,
      reason: "missing_perplexity_base_url",
      costKnown: false,
      pricingSource: "unknown",
      supportsSearch: true,
      supportsDeepResearch: false,
      supportsReports: false,
      requiresCredit: true,
      requiresExplicitLane: false,
    };
  }

  return {
    provider: "perplexity",
    role: "research_discovery",
    availability: "available",
    disabled: false,
    offline: false,
    reason: null,
    costKnown: false,
    pricingSource: "unknown",
    supportsSearch: true,
    supportsDeepResearch: false,
    supportsReports: false,
    requiresCredit: true,
    requiresExplicitLane: false,
  };
}

function resolveAriStatus(): ResearchProviderStatus {
  const enabled = parseBool(process.env.ARI_RESEARCH_ENABLED, false);
  const hasBase =
    hasValue(process.env.ARI_BASE_URL) ||
    hasValue(process.env.ARI_URL) ||
    hasValue(process.env.ARI_API_URL) ||
    hasValue(process.env.YOUCOM_ARI_API_URL);
  const hasKey = hasValue(process.env.ARI_API_KEY) || hasValue(process.env.YOUCOM_ARI_API_KEY);

  if (!enabled) {
    return {
      provider: "ari",
      role: "premium_deep_research",
      availability: "disabled",
      disabled: true,
      offline: false,
      reason: "premium_not_enabled",
      costKnown: false,
      pricingSource: "unknown",
      supportsSearch: false,
      supportsDeepResearch: true,
      supportsReports: true,
      requiresCredit: true,
      requiresExplicitLane: true,
    };
  }

  if (!hasBase || !hasKey) {
    return {
      provider: "ari",
      role: "premium_deep_research",
      availability: "config_missing",
      disabled: false,
      offline: false,
      reason: "missing_ari_config",
      costKnown: false,
      pricingSource: "unknown",
      supportsSearch: false,
      supportsDeepResearch: true,
      supportsReports: true,
      requiresCredit: true,
      requiresExplicitLane: true,
    };
  }

  return {
    provider: "ari",
    role: "premium_deep_research",
    availability: "available",
    disabled: false,
    offline: false,
    reason: null,
    costKnown: false,
    pricingSource: "unknown",
    supportsSearch: false,
    supportsDeepResearch: true,
    supportsReports: true,
    requiresCredit: true,
    requiresExplicitLane: true,
  };
}

function resolveOpenAiDeepResearchStatus(): ResearchProviderStatus {
  const enabled = parseBool(
    process.env.E150_DEEPSEARCH_ENABLED ?? process.env.OPENAI_DEEP_RESEARCH_ENABLED,
    false,
  );
  const model =
    process.env.OPENAI_DEEPSEARCH_MODEL?.trim() ??
    process.env.OPENAI_DEEP_RESEARCH_MODEL?.trim() ??
    "";
  const hasApiKey = hasValue(process.env.OPENAI_API_KEY);

  if (!enabled) {
    return {
      provider: "openai_deep_research",
      role: "premium_deep_research",
      availability: "disabled",
      disabled: true,
      offline: false,
      reason: "premium_not_enabled",
      costKnown: false,
      pricingSource: "unknown",
      supportsSearch: false,
      supportsDeepResearch: true,
      supportsReports: true,
      requiresCredit: true,
      requiresExplicitLane: true,
    };
  }

  if (!hasApiKey || !model) {
    return {
      provider: "openai_deep_research",
      role: "premium_deep_research",
      availability: "config_missing",
      disabled: false,
      offline: false,
      reason: !hasApiKey ? "missing_openai_api_key" : "missing_openai_deep_research_model",
      costKnown: false,
      pricingSource: "unknown",
      supportsSearch: false,
      supportsDeepResearch: true,
      supportsReports: true,
      requiresCredit: true,
      requiresExplicitLane: true,
    };
  }

  return {
    provider: "openai_deep_research",
    role: "premium_deep_research",
    availability: "available",
    disabled: false,
    offline: false,
    reason: null,
    costKnown: false,
    pricingSource: "unknown",
    supportsSearch: false,
    supportsDeepResearch: true,
    supportsReports: true,
    requiresCredit: true,
    requiresExplicitLane: true,
  };
}

function resolveOfflineFutureProvider(
  provider: "tavily" | "brave" | "serper" | "custom",
): ResearchProviderStatus {
  return {
    provider,
    role: "future_optional",
    availability: "offline",
    disabled: false,
    offline: true,
    reason: "not_configured",
    costKnown: false,
    pricingSource: "unknown",
    supportsSearch: true,
    supportsDeepResearch: false,
    supportsReports: false,
    requiresCredit: true,
    requiresExplicitLane: true,
  };
}

export function resolveResearchEntitlements(): ResearchEntitlements {
  return {
    searchCredit: parseBool(process.env.SEARCH_CREDIT_AVAILABLE, false),
    deepResearchCredit: parseBool(process.env.DEEP_RESEARCH_CREDIT_AVAILABLE, false),
    dossierBoost: parseBool(process.env.DOSSIER_BOOST_AVAILABLE, false),
    premiumResearchOverride: parseBool(process.env.PREMIUM_RESEARCH_OVERRIDE, false),
  };
}

export function buildResearchProviderRegistry(): ResearchProviderRegistry {
  const activeProviders: ResearchProviderStatus[] = [
    resolvePerplexityStatus(),
    resolveAriStatus(),
    resolveOpenAiDeepResearchStatus(),
    resolveOfflineFutureProvider("tavily"),
    resolveOfflineFutureProvider("brave"),
    resolveOfflineFutureProvider("serper"),
    resolveOfflineFutureProvider("custom"),
  ];

  const availableProviders = activeProviders.filter(
    (entry): entry is ResearchProviderStatus & { provider: Exclude<ResearchProviderId, "disabled"> } =>
      entry.availability === "available" && entry.provider !== "disabled",
  );
  const blockedProviders = activeProviders.filter((entry) => entry.availability !== "available");

  return {
    providerOrder: [
      "perplexity",
      "ari",
      "openai_deep_research",
      "tavily",
      "brave",
      "serper",
      "custom",
    ],
    defaultProvider: availableProviders[0]?.provider ?? null,
    activeProviders,
    availableProviders,
    blockedProviders,
  };
}

export function normalizeResearchResult(
  provider: Exclude<ResearchProviderId, "disabled">,
  input: {
    title?: string | null;
    url?: string | null;
    snippet?: string | null;
    sourceName?: string | null;
    publishedAt?: string | null;
    confidence?: number | null;
    sourceQuality?: number | null;
  },
): ResearchResult {
  const nowIso = new Date().toISOString();
  return {
    title: (input.title ?? "").trim(),
    url: (input.url ?? "").trim(),
    snippet: (input.snippet ?? "").trim(),
    sourceName: (input.sourceName ?? provider).trim() || provider,
    publishedAt: input.publishedAt ?? null,
    retrievedAt: nowIso,
    confidence: typeof input.confidence === "number" ? input.confidence : null,
    sourceQuality: typeof input.sourceQuality === "number" ? input.sourceQuality : null,
    provider,
  };
}
