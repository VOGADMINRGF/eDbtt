export type AiCoreProviderName = "openai" | "anthropic" | "mistral" | "gemini";

type EnvMap = Record<string, string | undefined>;

const CORE_PROVIDER_ALLOWLIST = ["openai", "anthropic", "mistral", "gemini"] as const;
const DEFAULT_PROVIDER_ORDER: AiCoreProviderName[] = ["openai", "anthropic", "mistral", "gemini"];
const OPENAI_DEFAULT_MODEL = "gpt-5";
const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MISTRAL_DEFAULT_MODEL = "mistral-large-latest";
const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
const OPENAI_TRACE_DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_FAST_DEFAULT_MODEL = "gpt-4o-mini";
const CREATE_PLANNER_MAX_OUTPUT_TOKENS = 1_200;
const FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS = 2_600;
const FULL_CONTRACT_LITE_MAX_OUTPUT_TOKENS = 1_200;
const DIRECT_PROBE_MAX_OUTPUT_TOKENS = 96;
const DIRECT_RUNTIME_MAX_OUTPUT_TOKENS = 192;

export class AiRuntimePolicyError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_PROVIDER"
      | "EMPTY_PROVIDER_ORDER"
      | "INVALID_INTEGER"
      | "INVALID_NUMBER"
      | "OUT_OF_RANGE",
    readonly envVar?: string,
  ) {
    super(message);
    this.name = "AiRuntimePolicyError";
  }
}

export type AiRuntimePolicy = {
  providerOrder: AiCoreProviderName[];
  maxProviders: number;
  enabledProviders: AiCoreProviderName[];
  defaultTimeoutMs: number;
  providerTimeoutsMs: Record<AiCoreProviderName, number>;
  plannerTimeoutMs: number;
  plannerMaxOutputTokens: number;
  smokeTimeoutMs: number;
  smokeMaxOutputTokens: number;
  fullContractDefaultMaxOutputTokens: number;
  fullContractLiteMaxOutputTokens: number;
  directProbeMaxOutputTokens: number;
  directRuntimeMaxOutputTokens: number;
  maxOutputTokens: number;
  budgetMs: number;
  telemetryBufferMax: number;
  circuitBreaker: {
    minRequests: number;
    failRateThreshold: number;
    openMsBase: number;
    openMsMax: number;
    halfOpenMs: number;
  };
  openai: {
    apiKeyPresent: boolean;
    baseUrl: string | null;
    model: string;
    plannerModelCandidates: string[];
    smokeModelCandidates: string[];
    traceModel: string;
    fastModel: string;
  };
  anthropic: {
    apiKeyPresent: boolean;
    model: string;
  };
  mistral: {
    apiKeyPresent: boolean;
    model: string;
  };
  gemini: {
    apiKeyPresent: boolean;
    model: string;
  };
  research: {
    searchCreditAvailable: boolean;
    deepResearchCreditAvailable: boolean;
    dossierBoostAvailable: boolean;
    premiumResearchOverride: boolean;
    gateEnabled: boolean;
    requiresConfirmation: boolean;
    requestedModel: string | null;
    effectiveModel: string | null;
    timeoutMs: number;
    deepResearchEnabled: boolean;
  };
  social: {
    distributionEnabled: boolean;
    autoPublishEnabled: false;
    realtimePublishEnabled: false;
    requireReview: true;
    scheduleEnabled: boolean;
  };
  loggingMode: "metadata_only" | "disabled";
};

function readEnv(env: EnvMap, key: string): string | undefined {
  const value = env[key];
  if (typeof value !== "string") return undefined;
  return value;
}

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function readTrimmed(env: EnvMap, key: string): string | undefined {
  const value = readEnv(env, key);
  if (!hasValue(value)) return undefined;
  return value?.trim();
}

function parseBooleanish(value: string | undefined, fallback: boolean): boolean {
  if (!hasValue(value)) return fallback;
  const normalized = value!.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no") return false;
  return fallback;
}

function readPositiveInteger(
  env: EnvMap,
  key: string,
  options: { defaultValue: number; min: number; max: number },
): number {
  const raw = readTrimmed(env, key);
  if (!raw) return options.defaultValue;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new AiRuntimePolicyError(`${key} must be a positive integer`, "INVALID_INTEGER", key);
  }
  if (parsed < options.min || parsed > options.max) {
    throw new AiRuntimePolicyError(
      `${key} must be between ${options.min} and ${options.max}`,
      "OUT_OF_RANGE",
      key,
    );
  }
  return parsed;
}

function readUnitInterval(
  env: EnvMap,
  key: string,
  options: { defaultValue: number; min: number; max: number },
): number {
  const raw = readTrimmed(env, key);
  if (!raw) return options.defaultValue;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new AiRuntimePolicyError(`${key} must be a number`, "INVALID_NUMBER", key);
  }
  if (parsed < options.min || parsed > options.max) {
    throw new AiRuntimePolicyError(
      `${key} must be between ${options.min} and ${options.max}`,
      "OUT_OF_RANGE",
      key,
    );
  }
  return parsed;
}

function dedupe(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

function normalizeProviderOrder(env: EnvMap, maxProviders: number): AiCoreProviderName[] {
  const raw = readTrimmed(env, "AI_PROVIDER_ORDER");
  const tokens = raw ? raw.split(",").map((token) => token.trim().toLowerCase()) : DEFAULT_PROVIDER_ORDER;
  const out: AiCoreProviderName[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (!token) continue;
    if (!CORE_PROVIDER_ALLOWLIST.includes(token as AiCoreProviderName)) {
      throw new AiRuntimePolicyError(
        `Unknown provider '${token}' in AI_PROVIDER_ORDER`,
        "INVALID_PROVIDER",
        "AI_PROVIDER_ORDER",
      );
    }
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token as AiCoreProviderName);
  }

  if (out.length === 0) {
    throw new AiRuntimePolicyError(
      "AI_PROVIDER_ORDER produced an empty provider list",
      "EMPTY_PROVIDER_ORDER",
      "AI_PROVIDER_ORDER",
    );
  }

  return out.slice(0, maxProviders);
}

function hasProviderKey(env: EnvMap, provider: AiCoreProviderName): boolean {
  switch (provider) {
    case "openai":
      return hasValue(readEnv(env, "OPENAI_API_KEY"));
    case "anthropic":
      return hasValue(readEnv(env, "ANTHROPIC_API_KEY"));
    case "mistral":
      return hasValue(readEnv(env, "MISTRAL_API_KEY"));
    case "gemini":
      return hasValue(readEnv(env, "GEMINI_API_KEY")) || hasValue(readEnv(env, "GOOGLE_API_KEY"));
    default:
      return false;
  }
}

function enabledProviders(providerOrder: AiCoreProviderName[], env: EnvMap): AiCoreProviderName[] {
  return providerOrder.filter((provider) => hasProviderKey(env, provider));
}

export function resolveAiRuntimeProviderMissingReason(
  provider: AiCoreProviderName,
  policy = getAiRuntimePolicy(),
): string | null {
  if (policy.enabledProviders.includes(provider)) return null;
  switch (provider) {
    case "openai":
      return "missing OPENAI_API_KEY";
    case "anthropic":
      return "missing ANTHROPIC_API_KEY";
    case "mistral":
      return "missing MISTRAL_API_KEY";
    case "gemini":
      return "missing GEMINI_API_KEY / GOOGLE_API_KEY";
    default:
      return "unsupported provider";
  }
}

export function getAiRuntimePolicyFromEnv(env: EnvMap = process.env): AiRuntimePolicy {
  const maxProviders = readPositiveInteger(env, "AI_MAX_PROVIDERS", {
    defaultValue: 4,
    min: 1,
    max: CORE_PROVIDER_ALLOWLIST.length,
  });
  const providerOrder = normalizeProviderOrder(env, maxProviders);
  const openaiModel = readTrimmed(env, "OPENAI_MODEL") ?? OPENAI_DEFAULT_MODEL;
  const anthropicModel = readTrimmed(env, "ANTHROPIC_MODEL") ?? ANTHROPIC_DEFAULT_MODEL;
  const mistralModel = readTrimmed(env, "MISTRAL_MODEL") ?? MISTRAL_DEFAULT_MODEL;
  const geminiModel = readTrimmed(env, "GEMINI_MODEL") ?? GEMINI_DEFAULT_MODEL;
  const defaultTimeoutMs = readPositiveInteger(env, "OPENAI_TIMEOUT_MS", {
    defaultValue: 18_000,
    min: 600,
    max: 60_000,
  });
  const smokeTimeoutMs = readPositiveInteger(env, "OPENAI_SMOKE_TIMEOUT_MS", {
    defaultValue: 30_000,
    min: 600,
    max: 45_000,
  });
  const smokeMaxOutputTokens = readPositiveInteger(env, "OPENAI_SMOKE_MAX_OUTPUT_TOKENS", {
    defaultValue: 2_200,
    min: 1,
    max: FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS,
  });
  const plannerTimeoutMs = readPositiveInteger(env, "CREATE_PLANNER_TIMEOUT_MS", {
    defaultValue: 10_000,
    min: 600,
    max: 10_000,
  });
  const budgetMs = readPositiveInteger(env, "AI_BUDGET_MS_DEFAULT", {
    defaultValue: 35_000,
    min: 1_000,
    max: 120_000,
  });
  const telemetryBufferMax = readPositiveInteger(env, "AI_TELEMETRY_BUFFER_MAX", {
    defaultValue: 1_000,
    min: 1,
    max: 10_000,
  });
  const circuitMinRequests = readPositiveInteger(env, "AI_CIRCUIT_MIN_REQUESTS", {
    defaultValue: 12,
    min: 1,
    max: 1_000,
  });
  const circuitOpenMsBase = readPositiveInteger(env, "AI_CIRCUIT_OPEN_MS_BASE", {
    defaultValue: 8_000,
    min: 500,
    max: 120_000,
  });
  const circuitOpenMsMax = readPositiveInteger(env, "AI_CIRCUIT_OPEN_MS_MAX", {
    defaultValue: 120_000,
    min: circuitOpenMsBase,
    max: 120_000,
  });
  const circuitHalfOpenMs = readPositiveInteger(env, "AI_CIRCUIT_HALFOPEN_MS", {
    defaultValue: 4_000,
    min: 250,
    max: 60_000,
  });
  const circuitFailRateThreshold = readUnitInterval(env, "AI_CIRCUIT_FAIL_RATE_THRESHOLD", {
    defaultValue: 0.35,
    min: 0.01,
    max: 1,
  });
  const researchGateEnabled = parseBooleanish(
    readEnv(env, "E150_DEEPSEARCH_ENABLED") ?? readEnv(env, "OPENAI_DEEP_RESEARCH_ENABLED"),
    false,
  );
  const deepResearchCreditAvailable = parseBooleanish(
    readEnv(env, "DEEP_RESEARCH_CREDIT_AVAILABLE"),
    false,
  );
  const premiumResearchOverride = parseBooleanish(
    readEnv(env, "PREMIUM_RESEARCH_OVERRIDE"),
    false,
  );
  const requestedDeepResearchModel =
    readTrimmed(env, "OPENAI_DEEPSEARCH_MODEL") ?? readTrimmed(env, "OPENAI_DEEP_RESEARCH_MODEL") ?? null;
  const researchTimeoutMs = readPositiveInteger(env, "OPENAI_DEEP_RESEARCH_TIMEOUT_MS", {
    defaultValue: 60_000,
    min: 1_000,
    max: 60_000,
  });
  const policy: AiRuntimePolicy = {
    providerOrder,
    maxProviders,
    enabledProviders: enabledProviders(providerOrder, env),
    defaultTimeoutMs,
    providerTimeoutsMs: {
      openai: defaultTimeoutMs,
      anthropic: readPositiveInteger(env, "ANTHROPIC_TIMEOUT_MS", {
        defaultValue: 22_000,
        min: 600,
        max: 60_000,
      }),
      mistral: readPositiveInteger(env, "MISTRAL_TIMEOUT_MS", {
        defaultValue: 18_000,
        min: 600,
        max: 60_000,
      }),
      gemini: readPositiveInteger(env, "GEMINI_TIMEOUT_MS", {
        defaultValue: 18_000,
        min: 600,
        max: 60_000,
      }),
    },
    plannerTimeoutMs,
    plannerMaxOutputTokens: CREATE_PLANNER_MAX_OUTPUT_TOKENS,
    smokeTimeoutMs,
    smokeMaxOutputTokens,
    fullContractDefaultMaxOutputTokens: FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS,
    fullContractLiteMaxOutputTokens: FULL_CONTRACT_LITE_MAX_OUTPUT_TOKENS,
    directProbeMaxOutputTokens: DIRECT_PROBE_MAX_OUTPUT_TOKENS,
    directRuntimeMaxOutputTokens: DIRECT_RUNTIME_MAX_OUTPUT_TOKENS,
    maxOutputTokens: FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS,
    budgetMs,
    telemetryBufferMax,
    circuitBreaker: {
      minRequests: circuitMinRequests,
      failRateThreshold: circuitFailRateThreshold,
      openMsBase: circuitOpenMsBase,
      openMsMax: circuitOpenMsMax,
      halfOpenMs: circuitHalfOpenMs,
    },
    openai: {
      apiKeyPresent: hasValue(readEnv(env, "OPENAI_API_KEY")),
      baseUrl: readTrimmed(env, "OPENAI_BASE_URL") ?? null,
      model: openaiModel,
      plannerModelCandidates: dedupe([readTrimmed(env, "OPENAI_PLANNER_MODEL"), openaiModel]),
      smokeModelCandidates: dedupe([readTrimmed(env, "OPENAI_SMOKE_MODEL"), openaiModel, OPENAI_DEFAULT_MODEL]),
      traceModel: readTrimmed(env, "OPENAI_TRACE_MODEL") ?? OPENAI_TRACE_DEFAULT_MODEL,
      fastModel: readTrimmed(env, "OPENAI_FAST_MODEL") ?? openaiModel ?? OPENAI_FAST_DEFAULT_MODEL,
    },
    anthropic: {
      apiKeyPresent: hasValue(readEnv(env, "ANTHROPIC_API_KEY")),
      model: anthropicModel,
    },
    mistral: {
      apiKeyPresent: hasValue(readEnv(env, "MISTRAL_API_KEY")),
      model: mistralModel,
    },
    gemini: {
      apiKeyPresent: hasProviderKey(env, "gemini"),
      model: geminiModel,
    },
    research: {
      searchCreditAvailable: parseBooleanish(readEnv(env, "SEARCH_CREDIT_AVAILABLE"), false),
      deepResearchCreditAvailable,
      dossierBoostAvailable: parseBooleanish(readEnv(env, "DOSSIER_BOOST_AVAILABLE"), false),
      premiumResearchOverride,
      gateEnabled: researchGateEnabled,
      requiresConfirmation: parseBooleanish(readEnv(env, "E150_DEEPSEARCH_REQUIRE_CONFIRMATION"), true),
      requestedModel: requestedDeepResearchModel,
      effectiveModel:
        researchGateEnabled && hasValue(readEnv(env, "OPENAI_API_KEY")) && requestedDeepResearchModel
          ? requestedDeepResearchModel
          : null,
      timeoutMs: researchTimeoutMs,
      deepResearchEnabled:
        researchGateEnabled &&
        hasValue(readEnv(env, "OPENAI_API_KEY")) &&
        Boolean(requestedDeepResearchModel) &&
        (deepResearchCreditAvailable || premiumResearchOverride),
    },
    social: {
      distributionEnabled: parseBooleanish(readEnv(env, "SOCIAL_DISTRIBUTION_ENABLED"), false),
      autoPublishEnabled: false,
      realtimePublishEnabled: false,
      requireReview: true,
      scheduleEnabled: parseBooleanish(readEnv(env, "SOCIAL_SCHEDULE_ENABLED"), true),
    },
    loggingMode: "metadata_only",
  };

  if (policy.openai.plannerModelCandidates.length === 0) {
    policy.openai.plannerModelCandidates.push(OPENAI_DEFAULT_MODEL);
  }
  if (policy.openai.smokeModelCandidates.length === 0) {
    policy.openai.smokeModelCandidates.push(OPENAI_DEFAULT_MODEL);
  }

  return policy;
}

export function getAiRuntimePolicy(): AiRuntimePolicy {
  return getAiRuntimePolicyFromEnv(process.env);
}

export function tryGetAiRuntimePolicyFromEnv(
  env: EnvMap = process.env,
): { ok: true; policy: AiRuntimePolicy } | { ok: false; error: AiRuntimePolicyError } {
  try {
    return { ok: true, policy: getAiRuntimePolicyFromEnv(env) };
  } catch (error) {
    if (error instanceof AiRuntimePolicyError) {
      return { ok: false, error };
    }
    throw error;
  }
}

export function tryGetAiRuntimePolicy() {
  return tryGetAiRuntimePolicyFromEnv(process.env);
}
