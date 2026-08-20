/**
 * E150-Orchestrator für Beitragsanalyse
 *
 * Aufgabe:
 * - Mehrere LLM-Provider (später OpenAI, Anthropic, Mistral, Gemini …) parallel
 *   ansprechen
 * - Ergebnisse als AnalyzeCandidates einsammeln
 * - bestes Ergebnis nach Score auswählen
 * - Fallbacks / Timeouts / Fehler sauber kapseln
 *
 * analyzeContribution validiert anschließend das JSON – dieser Orchestrator
 * liefert „nur“ Roh-JSON-Text zurück (plus Meta-Informationen).
 */

import { recordAiTelemetry } from "@features/ai/telemetry";
import { logAiUsage } from "@core/telemetry/aiUsage";
import type { AiErrorKind, AiPipelineName } from "@core/telemetry/aiUsageTypes";
import { callOpenAI as askOpenAI } from "@features/ai/providers/openai";
import {
  callAnthropic as askAnthropic,
} from "@features/ai/providers/anthropic";
import { anthropicProbe } from "./providers/anthropic";
import { callMistral as askMistral } from "@features/ai/providers/mistral";
import { callGemini as askGemini } from "@features/ai/providers/gemini";
import { callAriLLM as askAri } from "@features/ai/providers/ari_llm";
import { healthScore, type ProviderId } from "@features/ai/orchestrator_health";
import { PROVIDER_CAPABILITIES, providerSupports } from "./e150/providers";
import {
  flattenRoleProviders,
  getJourneyProfile,
  type E150JourneyKey,
  type E150JourneyProfile,
  type E150Lane,
} from "./e150/journeyProfiles";
import {
  computeDisagreementConfidence,
  type E150ConfidenceMeta,
  type E150DisagreementMeta,
} from "./e150/disagreementConfidence";
import type {
  ResearchUsed,
  VerificationMode,
} from "./e150/verificationContract";
import { AnalyzeResultSchema, type AnalyzeResult } from "@features/analyze/schemas";
import { extractJsonCandidate, parseJsonLoose } from "@features/analyze/llmJson";
import {
  getAiRuntimePolicy,
  getAiRuntimeProfile,
  resolveAiRuntimeProviderMissingReason,
  type AiRuntimeProviderName,
} from "@features/ai/aiRuntimePolicy";

/* ------------------------------------------------------------------------- */
/* Typen                                                                     */
/* ------------------------------------------------------------------------- */

export type E150ProviderName = "openai" | "anthropic" | "mistral" | "gemini" | "ari";

type ProviderCallArgs = {
  prompt: string;
  signal: AbortSignal;
  maxTokens: number;
};

type ProviderCallResult = {
  text: string;
  modelName?: string;
  tokensIn?: number;
  tokensOut?: number;
  costEur?: number;
  strictJson?: boolean;
  formatUsed?: "json_schema" | "json_object";
  didFallback?: boolean;
  openaiErrorCode?: string | null;
  openaiErrorMessage?: string | null;
};

export type E150OrchestratorArgs = {
  systemPrompt: string;
  userPrompt: string;
  journey?: E150JourneyKey;
  journeyProfile?: E150JourneyProfile;
  locale?: string | null;
  audienceRole?: AudienceRole;
  maxClaims?: number;
  maxTokens?: number;
  /**
   * Optional äußeres AbortSignal (z.B. Budget oder Request-Abbruch).
   * Wenn dies triggert, brechen laufende Provider-Aufrufe ab.
   */
  outerSignal?: AbortSignal;
  /**
   * Optional Validierung des Rohtexts (nach Sanitisierung).
   * Bei false/Fehler wird der Provider als BAD_JSON gewertet.
   */
  validateRaw?: (rawText: string) => boolean;
  requiredCapability?: ProviderProfile["capabilities"][number];
  validationMode?: "analyze_schema" | "json_only";
  /**
   * Gesamt-Timeout pro Provider (ms). Ohne Angabe wird
   * OPENAI_TIMEOUT_MS bzw. ein Default genutzt.
   */
  timeoutMs?: number;
  telemetry?: {
    runId?: string | null;
    jobId?: string | null;
    operationId?: string | null;
    operationType?: string | null;
    requestId?: string | null;
    dossierId?: string | null;
    organizationId?: string | null;
    userId?: string | null;
    tenantId?: string | null;
    region?: string | null;
    pipeline?: AiPipelineName;
  };
};

export type AudienceRole = "citizen" | "staff" | "institution";

type ProviderRole =
  | "structure"
  | "context"
  | "questions"
  | "knots"
  | "mixed";

type ProviderProfile = {
  name: E150ProviderName;
  label: string;
  role: ProviderRole;
  weight: number;
  maxTokens: number;
  timeoutMs: number;
  enabled: () => boolean;
  disabledReason?: () => string | null;
  call: (args: ProviderCallArgs) => Promise<ProviderCallResult>;
  metricId?: ProviderId;
  promptHint?: string;
  capabilities: ("core_analysis" | "impact" | "responsibility" | "report" | "search")[];
  strictJson?: boolean;
  probe?: () => Promise<ProbeResult>;
};

type ProviderHealthState = "healthy" | "degraded" | "unknown" | "down";

type CancelReason =
  | "budget_abort"
  | "outer_abort"
  | "aborted_before_start"
  | "probe_blocked";

type ProviderSuccess = {
  ok: true;
  provider: E150ProviderName;
  rawText: string;
  durationMs: number;
  modelName?: string;
  tokensIn?: number;
  tokensOut?: number;
  costEur?: number;
  strictJson?: boolean;
  parsed?: AnalyzeResult;
  attempt: 1 | 2;
  formatUsed?: "json_schema" | "json_object";
  didFallback?: boolean;
  openaiErrorCode?: string | null;
  openaiErrorMessage?: string | null;
};

type ProviderFailure = {
  ok: false;
  provider: E150ProviderName;
  error: string;
  durationMs: number;
  errorKind: AiErrorKind;
  httpStatus?: number | null;
  errorMessageShort?: string;
  providerErrorCode?: string | null;
  attempt?: 1 | 2;
  modelName?: string;
  cancelReason?: CancelReason | null;
  formatUsed?: "json_schema" | "json_object";
  didFallback?: boolean;
  openaiErrorCode?: string | null;
  openaiErrorMessage?: string | null;
  parseError?: string | null;
  schemaError?: string | null;
  schemaPath?: string | null;
  rawExcerpt?: string | null;
};

type ProviderResult = ProviderSuccess | ProviderFailure;
type ProbeResult = {
  provider: E150ProviderName;
  ok: boolean;
  errorKind: AiErrorKind | null;
  status?: number | null;
  durationMs: number;
  checkedAt: number;
  modelKnown?: boolean;
};

export type E150OrchestratorCandidate = {
  provider: E150ProviderName;
  rawText: string;
  score: number;
  durationMs: number;
  modelName?: string;
  tokensIn?: number;
  tokensOut?: number;
  costEur?: number;
  parsed?: AnalyzeResult;
};

export type ProviderMatrixEntry = {
  provider: E150ProviderName;
  state: "running" | "ok" | "failed" | "cancelled" | "skipped" | "disabled";
  attempt?: number | null;
  errorKind?: AiErrorKind | null;
  status?: number | null;
  durationMs?: number | null;
  model?: string | null;
  reason?: string | null;
  errorMessage?: string | null;
  providerErrorCode?: string | null;
  formatUsed?: "json_schema" | "json_object" | null;
  didFallback?: boolean | null;
  openaiErrorCode?: string | null;
  openaiErrorMessage?: string | null;
  parseError?: string | null;
  schemaError?: string | null;
  schemaPath?: string | null;
  rawExcerpt?: string | null;
};

export type E150OrchestratorMeta = {
  usedProviders: E150ProviderName[];
  failedProviders: {
    provider: E150ProviderName;
    error: string;
    errorKind?: AiErrorKind;
    httpStatus?: number | null;
    errorMessageShort?: string;
    providerErrorCode?: string | null;
  }[];
  timings: Record<E150ProviderName, number | null>;
  disabledProviders: { provider: E150ProviderName; reason: string }[];
  skippedProviders: { provider: E150ProviderName; reason: string }[];
  probes?: { provider: E150ProviderName; ok: boolean; errorKind: AiErrorKind | null; durationMs: number }[];
  providerMatrix?: ProviderMatrixEntry[];
  journeyProfile?: E150JourneyKey;
  lane?: E150Lane;
  roleProviderMapping?: {
    primary: Record<string, readonly E150ProviderName[]>;
    secondary: Record<string, readonly E150ProviderName[]>;
    fallback: readonly E150ProviderName[];
    openAiRoles: readonly ("fallback" | "presentation_pass")[];
  };
  fallbackUsed?: boolean;
  disagreement?: E150DisagreementMeta;
  confidence?: E150ConfidenceMeta;
  verificationMode?: VerificationMode;
  researchUsed?: ResearchUsed;
  sealEligible?: boolean;
  sealGranted?: boolean;
};

function resolveUsageCorrelationFields(telemetry?: E150OrchestratorArgs["telemetry"]) {
  return {
    runId: telemetry?.runId ?? null,
    jobId: telemetry?.jobId ?? null,
    operationId: telemetry?.operationId ?? null,
    operationType: telemetry?.operationType ?? null,
    requestId: telemetry?.requestId ?? null,
    dossierId: telemetry?.dossierId ?? null,
    organizationId: telemetry?.organizationId ?? null,
  };
}

/**
 * Rückgabe des Orchestrators.
 *
 * `rawText` bleibt für Legacy-Aufrufer erhalten und zeigt auf
 * `best.rawText`.
 */
export type E150OrchestratorResult = {
  /** @deprecated – Alias für best.rawText, für Legacy-Aufrufer beibehalten. */
  rawText: string;
  best: E150OrchestratorCandidate;
  candidates: E150OrchestratorCandidate[];
  meta: E150OrchestratorMeta;
};

export class OrchestratorNoProviderError extends Error {
  code = "NO_ANALYZE_PROVIDER";
  meta?: { disabled?: { provider: E150ProviderName; reason: string }[]; skipped?: { provider: E150ProviderName; reason: string }[]; providerMatrix?: ProviderMatrixEntry[] };
  constructor(message: string, meta?: OrchestratorNoProviderError["meta"]) {
    super(message);
    this.name = "OrchestratorNoProviderError";
    this.meta = meta;
  }
}

export class OrchestratorAllFailedError extends Error {
  code = "ANALYZE_PROVIDER_FAILED";
  meta?: OrchestratorNoProviderError["meta"] & {
    failedProviders?: E150OrchestratorMeta["failedProviders"];
  };
  constructor(message: string, meta?: OrchestratorAllFailedError["meta"]) {
    super(message);
    this.name = "OrchestratorAllFailedError";
    this.meta = meta;
  }
}

/* ------------------------------------------------------------------------- */
/* Konfiguration                                                             */
/* ------------------------------------------------------------------------- */

function mapErrorToKind(error: unknown): AiErrorKind {
  if (!error) return "UNKNOWN";
  if ((error as any)?.errorKind === "CANCELLED") return "CANCELLED";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as any).message ?? "")
      : typeof error === "string"
        ? error
        : "";

  const status = typeof (error as any)?.status === "number" ? (error as any).status : null;
  if ((error as any)?.name === "AbortError" || /timed out|timeout/i.test(message)) {
    return "TIMEOUT";
  }
  if (status === 404 || /model/i.test(message) && /404/.test(message)) return "MODEL_NOT_FOUND";
  if (status === 429) return "RATE_LIMIT";
  if (status === 402) return "UNAUTHORIZED";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 400 && /api key|token/i.test(message)) return "INVALID_API_KEY";
  if (/api key/i.test(message) || /invalid token/i.test(message)) return "INVALID_API_KEY";
  if (status === 400 && /response_format|json_object not supported/i.test(message)) return "INTERNAL";
  if (/context_length|maximum context length|too long/i.test(message)) return "INTERNAL";
  if (/json/i.test(message) || /zod/i.test(message) || /parse/i.test(message)) return "BAD_JSON";
  return status ? "INTERNAL" : "UNKNOWN";
}

function extractProviderErrorCode(error: unknown): string | null {
  const err = error as any;
  const fromCode = typeof err?.code === "string" ? err.code : null;
  if (fromCode) return fromCode;

  const fromMetaCode = typeof err?.meta?.code === "string" ? err.meta.code : null;
  if (fromMetaCode) return fromMetaCode;

  const fromMetaType = typeof err?.meta?.type === "string" ? err.meta.type : null;
  if (fromMetaType) return fromMetaType;

  const fromPayloadCode = typeof err?.payload?.error?.code === "string" ? err.payload.error.code : null;
  if (fromPayloadCode) return fromPayloadCode;

  const fromPayloadType = typeof err?.payload?.error?.type === "string" ? err.payload.error.type : null;
  if (fromPayloadType) return fromPayloadType;

  return null;
}

function safeProviderErrorCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9_.-]{2,80}$/.test(trimmed)) return null;
  return trimmed;
}

function safeTelemetryLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9_.:-]{1,120}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeProviderBoundaryReason(params: {
  reason?: unknown;
  errorKind?: AiErrorKind | null;
  cancelReason?: CancelReason | null;
  providerErrorCode?: string | null;
}): string {
  const rawReason = typeof params.reason === "string" ? params.reason.trim().toLowerCase() : "";
  if (params.cancelReason === "budget_abort" || rawReason === "budget_abort") return "budget_abort";
  if (rawReason === "blocked_by_runtime_policy") return "blocked_by_runtime_policy";
  if (rawReason === "not_in_journey_plan") return "not_in_journey_plan";
  if (rawReason === "fallback_not_needed") return "fallback_not_needed";
  if (
    rawReason.includes("missing ") &&
    (rawReason.includes("api_key") ||
      rawReason.includes("base_url") ||
      rawReason.includes("api_url") ||
      rawReason.includes("ari_url"))
  ) {
    return "missing_credentials";
  }
  if (rawReason === "provider_disabled" || rawReason.includes("disabled")) return "provider_disabled";

  switch (params.errorKind) {
    case "TIMEOUT":
      return "timeout";
    case "RATE_LIMIT":
      return "rate_limit";
    case "UNAUTHORIZED":
    case "INVALID_API_KEY":
      return "unauthorized";
    case "MODEL_NOT_FOUND":
      return "model_not_found";
    case "BAD_JSON":
      return "invalid_response";
    default:
      break;
  }

  const code = safeProviderErrorCode(params.providerErrorCode);
  if (code === "BAD_JSON" || code === "SCHEMA_INVALID" || code === "INVALID_AI_RESPONSE") {
    return "invalid_response";
  }
  if (code === "MODEL_NOT_FOUND") return "model_not_found";
  if (code === "INVALID_API_KEY") return "unauthorized";

  if (rawReason.includes("timeout") || rawReason.includes("timed out")) return "timeout";
  if (rawReason.includes("rate limit") || rawReason.includes("429")) return "rate_limit";
  if (
    rawReason.includes("unauthorized") ||
    rawReason.includes("forbidden") ||
    rawReason.includes("401") ||
    rawReason.includes("403") ||
    rawReason.includes("invalid api key")
  ) {
    return "unauthorized";
  }
  if (
    rawReason.includes("model_not_found") ||
    rawReason.includes("modell nicht gefunden") ||
    (rawReason.includes("model") && rawReason.includes("not found"))
  ) {
    return "model_not_found";
  }
  if (
    rawReason.includes("bad_json") ||
    rawReason.includes("schema") ||
    rawReason.includes("parse") ||
    rawReason.includes("invalid_response")
  ) {
    return "invalid_response";
  }
  return "provider_failed";
}

function providerProbeTtlMs(): number {
  const raw = Number(process.env.PROVIDER_PROBE_TTL_MS ?? 60_000);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60_000;
}

const PROVIDER_PROBE_DISABLE_SHORT_MS = 60_000;
const PROVIDER_PROBE_DISABLE_LONG_MS = 10 * 60_000;

function openAiProbeBaseUrl(policy = getAiRuntimePolicy()): string {
  return (policy.openai.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
}

function getProviderProfiles(policy = getAiRuntimePolicy()): ProviderProfile[] {
  const fullContractProfile = getAiRuntimeProfile("fullContract", policy);

  return [
    {
      name: "openai",
      label: "OpenAI (E150 contrib analyzer)",
      role: "mixed",
      weight: 1,
      maxTokens: fullContractProfile.maxOutputTokens ?? policy.fullContractDefaultMaxOutputTokens,
      timeoutMs: fullContractProfile.timeoutMs,
      metricId: "openai",
      strictJson: true,
      promptHint:
        "Deliver a balanced mix of claims, context notes, questions, and knots while keeping everything grounded in the source text.",
      enabled: () => policy.openai.apiKeyPresent,
      disabledReason: () => resolveAiRuntimeProviderMissingReason("openai", policy),
      capabilities: [...(PROVIDER_CAPABILITIES.openai ?? [])],
      probe: async () => probeOpenAI(policy),
      call: async ({ prompt, signal, maxTokens }) => {
        const { text, model, tokensIn, tokensOut, formatUsed, didFallback, openaiErrorCode } = await askOpenAI({
          prompt,
          asJson: true,
          forceJsonFormat: true,
          preferJsonObject: true,
          model: policy.openai.model,
          maxOutputTokens: maxTokens,
          timeoutMs: fullContractProfile.timeoutMs,
          signal,
        });
        return {
          text,
          modelName: model ?? policy.openai.model,
          tokensIn,
          tokensOut,
          strictJson: true,
          formatUsed,
          didFallback,
          openaiErrorCode: openaiErrorCode ?? null,
          openaiErrorMessage: null,
        };
      },
    },
    {
      name: "anthropic",
      label: "Anthropic Claude",
      role: "context",
      weight: 0.9,
      maxTokens: fullContractProfile.maxOutputTokens ?? policy.fullContractDefaultMaxOutputTokens,
      timeoutMs: policy.providerTimeoutsMs.anthropic,
      metricId: "anthropic",
      strictJson: true,
      promptHint:
        "Extract rich background/context sections (facts, stakeholders, assumptions). Prioritize clarity and neutrality.",
      enabled: () => policy.anthropic.apiKeyPresent && !policy.anthropic.disabledExplicitly,
      disabledReason: () => resolveAiRuntimeProviderMissingReason("anthropic", policy),
      capabilities: [...(PROVIDER_CAPABILITIES.anthropic ?? [])],
      call: async ({ prompt, signal, maxTokens }) => {
        const { text, model, tokensIn, tokensOut } = await askAnthropic({
          prompt,
          model: policy.anthropic.model,
          maxOutputTokens: maxTokens,
          signal,
        });
        return {
          text,
          modelName: model ?? policy.anthropic.model,
          tokensIn,
          tokensOut,
          strictJson: true,
        };
      },
    },
    {
      name: "mistral",
      label: "Mistral Large",
      role: "structure",
      weight: 0.8,
      maxTokens: fullContractProfile.maxOutputTokens ?? policy.fullContractDefaultMaxOutputTokens,
      timeoutMs: policy.providerTimeoutsMs.mistral,
      metricId: "mistral",
      promptHint:
        "Split the text into concise, testable claims (max one assertion per claim). Highlight responsibilities/topics clearly.",
      enabled: () => policy.mistral.apiKeyPresent,
      disabledReason: () => resolveAiRuntimeProviderMissingReason("mistral", policy),
      capabilities: [...(PROVIDER_CAPABILITIES.mistral ?? [])],
      probe: async () =>
        probeHttp("mistral", "https://api.mistral.ai/v1/models", {
          headers: { authorization: `Bearer ${process.env.MISTRAL_API_KEY ?? ""}` },
        }),
      call: async ({ prompt, signal, maxTokens }) => {
        const { text, model, tokensIn, tokensOut } = await askMistral({
          prompt,
          model: policy.mistral.model,
          maxOutputTokens: maxTokens,
          signal,
        });
        return {
          text,
          modelName: model ?? policy.mistral.model,
          tokensIn,
          tokensOut,
        };
      },
    },
    {
      name: "gemini",
      label: "Gemini Pro",
      role: "questions",
      weight: 0.75,
      maxTokens: fullContractProfile.maxOutputTokens ?? policy.fullContractDefaultMaxOutputTokens,
      timeoutMs: policy.providerTimeoutsMs.gemini,
      metricId: "gemini",
      promptHint:
        "Focus on investigative, critical questions (finance, legal, impact). Each question must be grounded in the provided text.",
      enabled: () => policy.gemini.apiKeyPresent && !policy.gemini.disabledExplicitly,
      disabledReason: () => resolveAiRuntimeProviderMissingReason("gemini", policy),
      capabilities: [...(PROVIDER_CAPABILITIES.gemini ?? [])],
      probe: async () => probeGeminiNow(),
      call: async ({ prompt, signal, maxTokens }) => {
        const { text, model, tokensIn, tokensOut } = await askGemini({
          prompt,
          model: policy.gemini.model,
          maxOutputTokens: maxTokens,
          signal,
        });
        return {
          text,
          modelName: model ?? policy.gemini.model,
          tokensIn,
          tokensOut,
        };
      },
    },
    {
      name: "ari",
      label: "ARI",
      role: "mixed",
      weight: 0.85,
      maxTokens: fullContractProfile.maxOutputTokens ?? policy.fullContractDefaultMaxOutputTokens,
      timeoutMs: policy.providerTimeoutsMs.ari,
      metricId: "ari",
      strictJson: true,
      promptHint:
        "Return concise, strictly grounded analysis with clear claims, impacts, and responsibilities in JSON.",
      enabled: () => policy.ari.enabled,
      disabledReason: () => resolveAiRuntimeProviderMissingReason("ari", policy),
      capabilities: [...(PROVIDER_CAPABILITIES.ari ?? [])],
      call: async ({ prompt, signal, maxTokens }) => {
        const { text, model, tokensIn, tokensOut } = await askAri({
          prompt,
          asJson: true,
          model: policy.ari.model,
          maxOutputTokens: maxTokens,
          signal,
        });
        return {
          text,
          modelName: model ?? policy.ari.model,
          tokensIn,
          tokensOut,
          strictJson: true,
        };
      },
    },
  ];
}

function resolveProviderPool(
  requiredCapability: ProviderProfile["capabilities"][number] = "core_analysis",
): {
  catalog: ProviderProfile[];
  active: ProviderProfile[];
  disabled: { provider: E150ProviderName; reason: string }[];
  skipped: { provider: E150ProviderName; reason: string }[];
  probes: ProbeResult[];
} {
  const policy = getAiRuntimePolicy();
  const catalog = getProviderProfiles(policy);
  const disabled: { provider: E150ProviderName; reason: string }[] = [];
  const skipped: { provider: E150ProviderName; reason: string }[] = [];
  const probes: ProbeResult[] = [];

  const active = catalog.filter((profile) => {
    try {
      const enabled = profile.enabled();
      if (!enabled) {
        const reason = normalizeProviderBoundaryReason({
          reason: profile.disabledReason?.() ?? "disabled",
        });
        disabled.push({ provider: profile.name, reason });
        return false;
      }
      if (!providerSupports(profile.name, requiredCapability)) {
        skipped.push({
          provider: profile.name,
          reason: "not_in_journey_plan",
        });
        return false;
      }
      return true;
    } catch {
      disabled.push({ provider: profile.name, reason: "provider_disabled" });
      return false;
    }
  });

  return { catalog, active, disabled, skipped, probes };
}

/* ------------------------------------------------------------------------- */
/* Hilfsfunktionen                                                           */
/* ------------------------------------------------------------------------- */

function buildProviderMatrix(
  catalog: ProviderProfile[],
  outcomes: ProviderResult[],
  disabled: { provider: E150ProviderName; reason: string }[],
  skipped: { provider: E150ProviderName; reason: string }[],
  probes: ProbeResult[],
): ProviderMatrixEntry[] {
  const disabledSet = new Set(disabled.map((d) => d.provider));
  const skippedSet = new Set(skipped.map((s) => s.provider));
  const probeMap = new Map(probes.map((p) => [p.provider, p]));

  return catalog.map((p) => {
    const outcome = outcomes.find((o) => o.provider === p.name);
    const probe = probeMap.get(p.name);
    if (outcome && outcome.ok) {
      const o = outcome as ProviderSuccess;
      return {
        provider: p.name,
        state: "ok",
        attempt: o.attempt ?? null,
        errorKind: null,
        status: null,
        durationMs: o.durationMs,
        model: o.modelName ?? null,
        reason: null,
        errorMessage: null,
        providerErrorCode: null,
        formatUsed: o.formatUsed ?? null,
        didFallback: o.didFallback ?? null,
        openaiErrorCode: o.openaiErrorCode ?? null,
        openaiErrorMessage: null,
        parseError: null,
        schemaError: null,
        schemaPath: null,
        rawExcerpt: null,
      };
    }
    if (outcome && !outcome.ok) {
      const o = outcome as ProviderFailure;
      if (o.errorKind === "CANCELLED") {
        return {
          provider: p.name,
          state: "cancelled",
          attempt: o.attempt ?? null,
          errorKind: o.errorKind ?? null,
          status: o.httpStatus ?? null,
          durationMs: o.durationMs,
          model: o.modelName ?? null,
          reason: normalizeProviderBoundaryReason({
            reason: o.cancelReason ?? o.error ?? null,
            errorKind: o.errorKind,
            cancelReason: o.cancelReason ?? null,
            providerErrorCode: o.providerErrorCode ?? null,
          }),
          errorMessage: null,
          providerErrorCode: safeProviderErrorCode(o.providerErrorCode),
          formatUsed: o.formatUsed ?? null,
          didFallback: o.didFallback ?? null,
          openaiErrorCode: safeProviderErrorCode(o.openaiErrorCode),
          openaiErrorMessage: null,
          parseError: o.parseError ?? null,
          schemaError: o.schemaError ?? null,
          schemaPath: o.schemaPath ?? null,
          rawExcerpt: null,
        };
      }
    }
    if (outcome && !outcome.ok) {
      const o = outcome as ProviderFailure;
      return {
        provider: p.name,
        state: "failed",
        attempt: o.attempt ?? null,
        errorKind: o.errorKind ?? null,
        status: o.httpStatus ?? null,
        durationMs: o.durationMs,
        model: o.modelName ?? null,
        reason: normalizeProviderBoundaryReason({
          reason: o.cancelReason ?? o.error ?? null,
          errorKind: o.errorKind,
          cancelReason: o.cancelReason ?? null,
          providerErrorCode: o.providerErrorCode ?? null,
        }),
        errorMessage: null,
        providerErrorCode: safeProviderErrorCode(o.providerErrorCode),
        formatUsed: o.formatUsed ?? null,
        didFallback: o.didFallback ?? null,
        openaiErrorCode: safeProviderErrorCode(o.openaiErrorCode),
        openaiErrorMessage: null,
        parseError: o.parseError ?? null,
        schemaError: o.schemaError ?? null,
        schemaPath: o.schemaPath ?? null,
        rawExcerpt: null,
      };
    }
    if (disabledSet.has(p.name)) {
      return {
        provider: p.name,
        state: "disabled",
        errorKind: probe?.errorKind ?? null,
        status: probe?.status ?? null,
        model: null,
        reason: normalizeProviderBoundaryReason({
          reason: disabled.find((d) => d.provider === p.name)?.reason ?? null,
          errorKind: probe?.errorKind ?? null,
        }),
        errorMessage: null,
        providerErrorCode: null,
        parseError: null,
        schemaError: null,
        schemaPath: null,
        rawExcerpt: null,
      };
    }
    if (skippedSet.has(p.name)) {
      return {
        provider: p.name,
        state: "skipped",
        errorKind: probe?.errorKind ?? null,
        status: probe?.status ?? null,
        model: null,
        reason: normalizeProviderBoundaryReason({
          reason: skipped.find((s) => s.provider === p.name)?.reason ?? null,
          errorKind: probe?.errorKind ?? null,
        }),
        errorMessage: null,
        providerErrorCode: null,
        parseError: null,
        schemaError: null,
        schemaPath: null,
        rawExcerpt: null,
      };
    }
    return {
      provider: p.name,
      state: "running",
      errorKind: probe?.errorKind ?? null,
      status: probe?.status ?? null,
      model: null,
      reason: null,
      errorMessage: null,
      providerErrorCode: null,
      formatUsed: null,
      didFallback: null,
      openaiErrorCode: null,
      openaiErrorMessage: null,
      parseError: null,
      schemaError: null,
      schemaPath: null,
      rawExcerpt: null,
    };
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out nach ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const cleanup = () => {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      reject(abortError);
    };
    if (signal) {
      if (signal.aborted) {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", onAbort);
    }
  });
}

function mergeAbortSignals(
  signals: Array<AbortSignal | null | undefined>,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const cleanups: Array<() => void> = [];

  const abortFrom = (signal: AbortSignal) => {
    if (controller.signal.aborted) return;
    controller.abort(signal.reason ?? "outer_abort");
  };

  signals.forEach((signal) => {
    if (!signal) return;
    if (signal.aborted) {
      abortFrom(signal);
      return;
    }
    const handler = () => abortFrom(signal);
    signal.addEventListener("abort", handler);
    cleanups.push(() => signal.removeEventListener("abort", handler));
  });

  return {
    signal: controller.signal,
    cleanup: () => cleanups.forEach((fn) => fn()),
  };
}

function hedgeDelay(provider: E150ProviderName): number {
  switch (provider) {
    case "openai":
      return 0;
    case "mistral":
      return 1_200;
    case "anthropic":
    case "ari":
      return 2_400;
    default:
      return 2_400;
  }
}

function resolveProviderHealth(profile: ProviderProfile): {
  state: ProviderHealthState;
  score: number;
} {
  if (!profile.metricId) {
    return { state: "unknown", score: 0.5 };
  }

  const raw = clamp(healthScore(profile.metricId), 0, 1);

  if (raw >= 0.75) return { state: "healthy", score: raw };
  if (raw >= 0.45) return { state: "degraded", score: raw };
  if (raw > 0) return { state: "down", score: raw };
  return { state: "unknown", score: raw };
}

const probeCache = new Map<
  E150ProviderName,
  { result: ProbeResult; disabledUntil: number | null }
>();

async function probeHttp(
  provider: E150ProviderName,
  url: string,
  options: { headers?: Record<string, string> },
): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_000);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: options.headers ?? {},
      signal: controller.signal,
    });
    const durationMs = Date.now() - started;
    if (res.ok) {
      return { provider, ok: true, errorKind: null, status: res.status, durationMs, checkedAt: Date.now() };
    }
    let errorKind: AiErrorKind | null = "INTERNAL";
    if (res.status === 401 || res.status === 403) errorKind = "UNAUTHORIZED";
    else if (res.status === 404) errorKind = "MODEL_NOT_FOUND";
    else if (res.status === 429) errorKind = "RATE_LIMIT";
    return { provider, ok: false, errorKind, status: res.status, durationMs, checkedAt: Date.now() };
  } catch (err: any) {
    const durationMs = Date.now() - started;
    const errorKind: AiErrorKind =
      err?.name === "AbortError" ? "TIMEOUT" : "INTERNAL";
    return { provider, ok: false, errorKind, status: null, durationMs, checkedAt: Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}


async function probeGeminiNow(): Promise<ProbeResult> {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  const provider: E150ProviderName = "gemini";
  if (!key) {
    return { provider, ok: false, errorKind: "INVALID_API_KEY", status: 0, durationMs: 0, checkedAt: Date.now() };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_000);
  const started = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    const durationMs = Date.now() - started;
    if (res.ok) {
      return { provider, ok: true, errorKind: null, status: res.status, durationMs, checkedAt: Date.now() };
    }
    // Gemini often returns 400 for invalid keys
    const errorKind: AiErrorKind =
      res.status === 401 || res.status === 403
        ? "UNAUTHORIZED"
        : res.status === 400
          ? "INVALID_API_KEY"
          : res.status === 429
            ? "RATE_LIMIT"
            : "INTERNAL";
    return { provider, ok: false, errorKind, status: res.status, durationMs, checkedAt: Date.now() };
  } catch (err: any) {
    const durationMs = Date.now() - started;
    const kind = mapErrorToKind(err);
    return { provider, ok: false, errorKind: kind, status: (err?.status as number | undefined) ?? null, durationMs, checkedAt: Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}
async function probeOpenAI(policy = getAiRuntimePolicy()): Promise<ProbeResult> {
  const mode = (process.env.PROVIDER_PROBE_MODE ?? "light").toLowerCase();
  const baseUrl = openAiProbeBaseUrl(policy);
  if (mode !== "deep") {
    const res = await probeHttp("openai", `${baseUrl}/models`, {
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}` },
    });
    return { ...res, provider: "openai" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_000);
  const started = Date.now();
  try {
    const res = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        model: policy.openai.model,
        max_output_tokens: 1,
        input: [{ role: "user", content: "ping" }],
        text: { format: { type: "json_object" } },
      }),
      signal: controller.signal,
    });
    const durationMs = Date.now() - started;
    if (res.ok) {
      return { provider: "openai", ok: true, errorKind: null, status: res.status, durationMs, checkedAt: Date.now(), modelKnown: true };
    }
    let errorKind: AiErrorKind | null = "INTERNAL";
    if (res.status === 401 || res.status === 403) errorKind = "UNAUTHORIZED";
    else if (res.status === 429) errorKind = "RATE_LIMIT";
    return { provider: "openai", ok: false, errorKind, status: res.status, durationMs, checkedAt: Date.now(), modelKnown: true };
  } catch (err: any) {
    const durationMs = Date.now() - started;
    const errorKind: AiErrorKind =
      err?.name === "AbortError" ? "TIMEOUT" : "INTERNAL";
    return { provider: "openai", ok: false, errorKind, status: null, durationMs, checkedAt: Date.now(), modelKnown: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function runProviderProbeCached(
  profile: ProviderProfile,
  telemetry?: E150OrchestratorArgs["telemetry"],
): Promise<ProbeResult | null> {
  if (!profile.probe) return null;
  const cached = probeCache.get(profile.name);
  const now = Date.now();
  if (cached && cached.result.checkedAt + providerProbeTtlMs() > now) {
    if (cached.disabledUntil && cached.disabledUntil > now) {
      return cached.result;
    }
    return cached.result;
  }
  const res = await profile.probe().catch(() => ({
    ok: false,
    errorKind: "INTERNAL" as AiErrorKind,
    status: null,
    durationMs: 0,
    checkedAt: Date.now(),
    provider: profile.name,
  }));
  const resultWithProvider = { ...res, provider: res.provider ?? profile.name };

  const disableDuration =
    resultWithProvider.ok
      ? null
      : resultWithProvider.errorKind === "UNAUTHORIZED" || resultWithProvider.errorKind === "INVALID_API_KEY"
        ? PROVIDER_PROBE_DISABLE_LONG_MS
        : PROVIDER_PROBE_DISABLE_SHORT_MS;

  const disabledUntil = disableDuration ? now + disableDuration : null;
  probeCache.set(profile.name, { result: resultWithProvider, disabledUntil });

  logAiUsage({
    createdAt: new Date(),
    provider: profile.name,
    model: "probe",
    pipeline: "provider_probe",
    ...resolveUsageCorrelationFields(telemetry),
    userId: telemetry?.userId ?? null,
    tenantId: telemetry?.tenantId ?? null,
    region: telemetry?.region ?? null,
    locale: telemetry?.region ?? null,
    tokensInput: 0,
    tokensOutput: 0,
    costEur: 0,
    durationMs: resultWithProvider.durationMs,
    success: resultWithProvider.ok,
    errorKind: resultWithProvider.errorKind ?? null,
    strictJson: false,
  }).catch(() => {});

  return resultWithProvider;
}

function scoreCandidate(
  provider: ProviderProfile,
  rawText: string,
  durationMs: number,
): number {
  // Simple Heuristik:
  // - gültiges JSON wird höher gewichtet
  // - kürzere Laufzeit leicht bevorzugt
  let jsonOk = false;
  try {
    JSON.parse(rawText);
    jsonOk = true;
  } catch {
    // egal – analyzeContribution wird später strikt validieren
  }

  const base = provider.weight;
  const jsonBonus = jsonOk ? 0.5 : 0;
  const speedBonus =
    durationMs > 0 ? Math.min(0.5, Math.max(0, 8_000 - durationMs) / 8_000) : 0;
  const { state, score } = resolveProviderHealth(provider);
  const healthBoost = score * 0.25;
  const healthPenalty = state === "down" ? 0.3 : state === "degraded" ? 0.1 : 0;

  return base + jsonBonus + speedBonus + healthBoost - healthPenalty;
}

async function runProvider(
  profile: ProviderProfile,
  args: E150OrchestratorArgs,
): Promise<ProviderResult> {
  if (args.outerSignal?.aborted) {
    const reason = (args.outerSignal.reason as CancelReason | undefined) ?? "outer_abort";
    return {
      ok: false,
      provider: profile.name,
      error: `cancelled: ${reason}`,
      durationMs: 0,
      errorKind: "CANCELLED",
      cancelReason: reason,
      attempt: 1,
    };
  }

  const started = Date.now();
  const baseMaxTokens = Math.min(args.maxTokens ?? profile.maxTokens, profile.maxTokens);
  const baseTimeoutMs = args.timeoutMs ?? profile.timeoutMs;
  const prompt = buildPrompt(
    args.systemPrompt,
    args.userPrompt,
    profile,
    args.audienceRole,
    args.locale,
  );
  const outerSignal = args.outerSignal;
  let attemptAbortReason: CancelReason | "timeout" | null = null;

  const runAttempt = async (
    maxTokens: number,
    timeoutMs: number,
    attempt: 1 | 2,
    opts?: { disableJsonFormat?: boolean },
  ) => {
    attemptAbortReason = null;
    const controller = new AbortController();
    const outerAbortHandler = () => {
      attemptAbortReason =
        (outerSignal?.reason as CancelReason | undefined) ??
        attemptAbortReason ??
        "outer_abort";
      controller.abort(outerSignal?.reason);
    };

    if (outerSignal) {
      if (outerSignal.aborted) {
        outerAbortHandler();
      } else {
        outerSignal.addEventListener("abort", outerAbortHandler);
      }
    }

    const timeout = setTimeout(() => {
      attemptAbortReason = attemptAbortReason ?? "timeout";
      controller.abort();
    }, timeoutMs);
    try {
      const callPromise = profile.call({
        prompt: opts?.disableJsonFormat
          ? `${prompt}\n\nJSON only. No extra keys. No input echo.`
          : prompt,
        signal: controller.signal,
        maxTokens,
      });
      const result = await withTimeout(callPromise, timeoutMs + 1_000, profile.label);
      const strictJson = result.strictJson ?? profile.strictJson ?? false;
      return {
        ok: true as const,
        result,
        durationMs: Date.now() - started,
        strictJson,
        attempt,
      };
    } finally {
      clearTimeout(timeout);
      if (outerSignal && outerAbortHandler) {
        outerSignal.removeEventListener("abort", outerAbortHandler);
      }
    }
  };

  const allowedRetryKinds: AiErrorKind[] = ["TIMEOUT", "RATE_LIMIT", "INTERNAL", "BAD_JSON"];
  let lastError: any = null;
  let lastKind: AiErrorKind = "UNKNOWN";

  for (let attempt = 0; attempt < 2; attempt++) {
    const maxTokens =
      attempt === 0 || profile.name === "openai"
        ? baseMaxTokens
        : Math.min(900, Math.max(1, Math.floor(baseMaxTokens * 0.75)));
    const timeoutMs = attempt === 0 ? baseTimeoutMs : baseTimeoutMs + 5_000;
    const disableJsonFormat =
      profile.name === "openai" && attempt === 1 && lastKind === "INTERNAL";
    try {
      const {
        result,
        durationMs,
        strictJson,
        attempt: attemptIndex,
      } = await runAttempt(
        maxTokens,
        timeoutMs,
        (attempt + 1) as 1 | 2,
        { disableJsonFormat },
      );
      return {
        ok: true,
        provider: profile.name,
        rawText: result.text,
        durationMs,
        modelName: result.modelName,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        costEur: result.costEur,
        strictJson,
        attempt: attemptIndex,
        formatUsed: result.formatUsed,
        didFallback: result.didFallback,
        openaiErrorCode: result.openaiErrorCode,
        openaiErrorMessage: result.openaiErrorMessage,
      };
    } catch (err: any) {
      lastError = err;
      const abortReason =
        attemptAbortReason && attemptAbortReason !== "timeout"
          ? attemptAbortReason
          : null;
      lastKind = abortReason ? "CANCELLED" : mapErrorToKind(err);
      const shouldRetry =
        attempt === 0 && allowedRetryKinds.includes(lastKind) && !abortReason;
      if (shouldRetry) continue;

      const durationMs = Date.now() - started;
      const providerErrorCode = safeProviderErrorCode(extractProviderErrorCode(err));
      const reasonCode = normalizeProviderBoundaryReason({
        reason: abortReason ?? err?.message ?? null,
        errorKind: lastKind,
        cancelReason: abortReason,
        providerErrorCode,
      });
      return {
        ok: false,
        provider: profile.name,
        error: reasonCode,
        durationMs,
        errorKind: lastKind,
        httpStatus: typeof err?.status === "number" ? err.status : null,
        errorMessageShort: undefined,
        providerErrorCode,
        attempt: (attempt + 1) as 1 | 2,
        modelName: (err as any)?.meta?.model ?? undefined,
        cancelReason: abortReason,
      };
    }
  }

  const durationMs = Date.now() - started;
  const providerErrorCode = safeProviderErrorCode(extractProviderErrorCode(lastError));
  return {
    ok: false,
    provider: profile.name,
    error: normalizeProviderBoundaryReason({
      reason: lastError?.message ?? null,
      errorKind: lastKind,
      providerErrorCode,
    }),
    durationMs,
    errorKind: lastKind,
    httpStatus: typeof lastError?.status === "number" ? lastError.status : null,
    errorMessageShort: undefined,
    providerErrorCode,
    attempt: 2,
  };
}

function buildPrompt(
  system: string | undefined,
  user: string | undefined,
  profile: ProviderProfile,
  audienceRole?: AudienceRole,
  locale?: string | null,
): string {
  const sections: string[] = [];
  if (system?.trim()) sections.push(system.trim());
  const roleGuidance = buildRoleGuidance(profile.role, profile.promptHint);
  if (roleGuidance) sections.push("", roleGuidance);
  const audienceGuidance = buildAudienceGuidance(audienceRole, locale);
  if (audienceGuidance) sections.push("", audienceGuidance);
  if (user?.trim()) sections.push("", user.trim());
  sections.push("", "Return ONLY valid JSON (RFC8259). No Markdown, no commentary.");
  sections.push(
    "Output must start with '{' and end with '}'. No trailing commas. Include all required keys; use null or [] when unsure.",
  );
  return sections.join("\n");
}

function buildRoleGuidance(role: ProviderRole, promptHint?: string): string | null {
  if (promptHint) return promptHint;
  switch (role) {
    case "structure":
      return [
        "Focus on extracting atomic, testable claims.",
        "Ensure each claim contains one responsibility/topic so voting later is possible.",
      ].join(" ");
    case "context":
      return [
        "Prioritize contextual notes that explain background, stakeholders, facts.",
        "Highlight contradictions or missing data only if grounded in the source.",
      ].join(" ");
    case "questions":
      return [
        "Surface critical questions citizens should ask (finance, legal, impact).",
        "Avoid opinionated language; keep questions concise.",
      ].join(" ");
    case "knots":
      return [
        "Identify conflict knots / trade-offs.",
        "Each knot should name the tension and describe it in 1-2 sentences.",
      ].join(" ");
    default:
      return null;
  }
}

function buildAudienceGuidance(
  audienceRole?: AudienceRole,
  locale?: string | null,
): string | null {
  if (!audienceRole) return null;
  const localeHint = locale ? `Locale: ${locale}. Use language appropriate for this locale.` : null;
  const roleGuidance =
    audienceRole === "citizen"
      ? "Audience: citizen. Use clear, plain language and avoid jargon."
      : audienceRole === "staff"
        ? "Audience: staff. Use precise operational language and focus on verifiable facts."
        : "Audience: institution. Use formal tone and emphasize legal/financial implications.";
  return localeHint ? `${roleGuidance} ${localeHint}` : roleGuidance;
}

/* ------------------------------------------------------------------------- */
/* Öffentliche API                                                           */
/* ------------------------------------------------------------------------- */

const LIMITS = {
  claims: 10,
  notes: 6,
  questions: 5,
  knots: 5,
  eventualities: 8,
  consequences: 8,
  responsibilities: 8,
  reportList: 7,
};

function sanitizeJsonText(raw: string): string {
  let text = raw?.trim?.() ?? "";
  if (text.startsWith("```")) {
    const firstNewline = text.indexOf("\n");
    if (firstNewline !== -1) text = text.slice(firstNewline + 1);
    const lastFence = text.lastIndexOf("```");
    if (lastFence !== -1) text = text.slice(0, lastFence);
    text = text.trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1);
  }
  return text;
}

function repairJsonText(raw: string): string {
  let text = raw ?? "";
  // Replace smart quotes with ASCII quotes.
  text = text.replace(/[\u201C\u201D]/g, "\"").replace(/[\u2018\u2019]/g, "'");
  // Remove trailing commas before } or ].
  text = text.replace(/,\s*([}\]])/g, "$1");
  return text;
}

function tryParseJson<T = any>(raw: string): { ok: true; value: T } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    // ignore
  }

  try {
    const repaired = repairJsonText(raw);
    if (repaired !== raw) {
      return { ok: true, value: JSON.parse(repaired) };
    }
  } catch {
    // ignore
  }
  return { ok: false };
}

function clampAnalysis(data: any): AnalyzeResult {
  const isObj = (v: any): v is Record<string, any> => !!v && typeof v === "object";
  const isStr = (v: any): v is string => typeof v === "string";

  const clampStr = (val: unknown, n: number): string[] =>
    Array.isArray(val) ? val.filter(isStr).slice(0, n) : [];

  const clampObj = <T extends object>(val: unknown, n: number): T[] =>
    Array.isArray(val) ? (val.filter(isObj).slice(0, n) as T[]) : [];

  const reportIn = isObj(data?.report) ? data.report : {};
  const factsIn = isObj(reportIn.facts) ? reportIn.facts : {};

  const report: AnalyzeResult["report"] = {
    summary: isStr(reportIn.summary) ? reportIn.summary : null,
    keyConflicts: clampStr(reportIn.keyConflicts, LIMITS.reportList),
    facts: {
      local: clampStr(factsIn.local, LIMITS.reportList),
      international: clampStr(factsIn.international, LIMITS.reportList),
    },
    openQuestions: clampStr(reportIn.openQuestions, LIMITS.reportList),
    takeaways: clampStr(reportIn.takeaways, LIMITS.reportList),
  };

  const consIn = isObj(data?.consequences) ? data.consequences : {};
  const consequences: AnalyzeResult["consequences"] = {
    consequences: clampObj(consIn.consequences, LIMITS.consequences),
    responsibilities: clampObj(consIn.responsibilities, LIMITS.responsibilities),
  };

  return {
    mode: "E150",
    sourceText: isStr(data?.sourceText) ? data.sourceText : null,
    language: isStr(data?.language) ? data.language : "de",
    claims: clampObj(data?.claims, LIMITS.claims),
    notes: clampObj(data?.notes, LIMITS.notes),
    questions: clampObj(data?.questions, LIMITS.questions),
    knots: clampObj(data?.knots, LIMITS.knots),
    consequences,
    responsibilityPaths: Array.isArray(data?.responsibilityPaths) ? data.responsibilityPaths : [],
    decisionTrees: Array.isArray(data?.decisionTrees) ? data.decisionTrees : [],
    eventualities: clampObj(data?.eventualities, LIMITS.eventualities),
    impactAndResponsibility: isObj(data?.impactAndResponsibility)
      ? data.impactAndResponsibility
      : { impacts: [], responsibleActors: [] },
    report,
  } as AnalyzeResult;
}

type ValidateCandidateSuccess = {
  ok: true;
  jsonText: string;
  parsed: AnalyzeResult;
};

type ValidateCandidateFailure = {
  ok: false;
  reason: "BAD_JSON" | "SCHEMA_INVALID";
  errorKind: AiErrorKind;
  providerErrorCode: "BAD_JSON" | "SCHEMA_INVALID";
  errorMessage: string;
  parseError?: string | null;
  schemaError?: string | null;
  schemaPath?: string | null;
  rawExcerpt?: string | null;
};

function normalizeCandidateJson(
  rawText: string,
): { ok: true; value: unknown; jsonText: string; rawExcerpt: string } | { ok: false; parseError: string; rawExcerpt: string | null } {
  const candidate = extractJsonCandidate(rawText) ?? sanitizeJsonText(rawText);
  const cleaned = candidate?.trim() ?? "";
  if (!cleaned) {
    return { ok: false, parseError: "no_json_object_found", rawExcerpt: sanitizeJsonText(rawText).slice(0, 500) || null };
  }
  const parsed = tryParseJson(cleaned);
  if (!parsed.ok) {
    return {
      ok: false,
      parseError: "json_parse_failed",
      rawExcerpt: cleaned.slice(0, 500),
    };
  }
  return {
    ok: true,
    value: parsed.value,
    jsonText: JSON.stringify(parsed.value),
    rawExcerpt: cleaned.slice(0, 500),
  };
}

function parseAnalyzeResult(
  rawText: string,
): ValidateCandidateSuccess | ValidateCandidateFailure {
  const normalized = normalizeCandidateJson(rawText);
  if (normalized.ok === false) {
    const loose = parseJsonLoose(rawText, AnalyzeResultSchema);
    if (loose.ok) {
      return {
        ok: true,
        jsonText: JSON.stringify(loose.value),
        parsed: clampAnalysis(loose.value),
      };
    }
    return {
      ok: false,
      reason: "BAD_JSON",
      errorKind: "BAD_JSON",
      providerErrorCode: "BAD_JSON",
      errorMessage: normalized.parseError,
      parseError: normalized.parseError,
      rawExcerpt: normalized.rawExcerpt,
    };
  }

  const validated = AnalyzeResultSchema.safeParse(normalized.value);
  if (validated.success) {
    return {
      ok: true,
      jsonText: JSON.stringify(validated.data),
      parsed: clampAnalysis(validated.data),
    };
  }

  const loose = parseJsonLoose(rawText, AnalyzeResultSchema);
  if (loose.ok) {
    return {
      ok: true,
      jsonText: JSON.stringify(loose.value),
      parsed: clampAnalysis(loose.value),
    };
  }

  const firstIssue = validated.error.issues[0];
  const schemaError = firstIssue?.message ?? "schema_validation_failed";
  const schemaPath = Array.isArray(firstIssue?.path) ? firstIssue.path.join(".") || "$" : "$";
  return {
    ok: false,
    reason: "SCHEMA_INVALID",
    errorKind: "INTERNAL",
    providerErrorCode: "SCHEMA_INVALID",
    errorMessage: schemaError,
    schemaError,
    schemaPath,
    rawExcerpt: normalized.rawExcerpt,
  };
}

function validateCandidate(
  rawText: string,
  validationMode: "analyze_schema" | "json_only" = "analyze_schema",
  validateRaw?: (raw: string) => boolean,
): ValidateCandidateSuccess | ValidateCandidateFailure {
  const cleaned = sanitizeJsonText(rawText);

  if (validateRaw) {
    try {
      const valid = validateRaw(cleaned);
      if (valid === false) {
        return {
          ok: false,
          reason: "BAD_JSON",
          errorKind: "BAD_JSON",
          providerErrorCode: "BAD_JSON",
          errorMessage: "validate_raw_failed",
          parseError: "validate_raw_failed",
          rawExcerpt: cleaned.slice(0, 500),
        };
      }
    } catch {
      return {
        ok: false,
        reason: "BAD_JSON",
        errorKind: "BAD_JSON",
        providerErrorCode: "BAD_JSON",
        errorMessage: "validate_raw_threw",
        parseError: "validate_raw_threw",
        rawExcerpt: cleaned.slice(0, 500),
      };
    }
  }

  if (validationMode === "json_only") {
    const normalized = normalizeCandidateJson(cleaned || rawText);
    if (normalized.ok === false) {
      return {
        ok: false,
        reason: "BAD_JSON",
        errorKind: "BAD_JSON",
        providerErrorCode: "BAD_JSON",
        errorMessage: normalized.parseError,
        parseError: normalized.parseError,
        rawExcerpt: normalized.rawExcerpt,
      };
    }
    return {
      ok: true,
      jsonText: normalized.jsonText,
      parsed: clampAnalysis(normalized.value),
    };
  }

  return parseAnalyzeResult(rawText);
}

async function runProviderProbe(
  provider: E150ProviderName,
  telemetry?: E150OrchestratorArgs["telemetry"],
): Promise<{ provider: E150ProviderName; ok: boolean; errorKind: AiErrorKind | null; durationMs: number } | null> {
  const started = Date.now();
  try {
    if (provider === "anthropic") {
      const res = await anthropicProbe();
      await logAiUsage({
        createdAt: new Date(),
        provider,
        model: "probe",
        pipeline: "provider_probe",
        ...resolveUsageCorrelationFields(telemetry),
        userId: telemetry?.userId ?? null,
        tenantId: telemetry?.tenantId ?? null,
        region: telemetry?.region ?? null,
        locale: telemetry?.region ?? null,
        tokensInput: 0,
        tokensOutput: 0,
        costEur: 0,
        durationMs: res.durationMs ?? Date.now() - started,
        success: res.ok,
        errorKind: res.errorKind ?? null,
        strictJson: false,
      }).catch(() => {});
      return {
        provider,
        ok: res.ok,
        errorKind: res.errorKind ?? null,
        durationMs: res.durationMs ?? Date.now() - started,
      };
    }
  } catch {
    await logAiUsage({
      createdAt: new Date(),
      provider,
      model: "probe",
      pipeline: "provider_probe",
      ...resolveUsageCorrelationFields(telemetry),
      userId: telemetry?.userId ?? null,
      tenantId: telemetry?.tenantId ?? null,
      region: telemetry?.region ?? null,
      locale: telemetry?.region ?? null,
      tokensInput: 0,
      tokensOutput: 0,
      costEur: 0,
      durationMs: Date.now() - started,
      success: false,
      errorKind: "INTERNAL",
      strictJson: false,
    }).catch(() => {});
  }
  return {
    provider,
    ok: false,
    errorKind: "INTERNAL",
    durationMs: Date.now() - started,
  };
}

function logProviderTelemetry(matrix: ProviderMatrixEntry[]) {
  matrix.forEach((entry) => {
    // eslint-disable-next-line no-console
    console.log("[analyze][telemetry]", {
      provider: entry.provider,
      state: entry.state,
      attempt: entry.attempt ?? null,
      errorKind: entry.errorKind ?? null,
      status: entry.status ?? null,
      durationMs: entry.durationMs ?? null,
      model: safeTelemetryLabel(entry.model) ?? null,
      reason:
        entry.reason !== null && entry.reason !== undefined
          ? normalizeProviderBoundaryReason({
              reason: entry.reason,
              errorKind: entry.errorKind ?? null,
              providerErrorCode: entry.providerErrorCode ?? null,
            })
          : null,
    });
  });
}

/**
 * Orchestriert die E150-Analyse über mehrere Provider.
 *
 * Journey-Profile bestimmen Primary/Secondary/Fallback-Rollen.
 * OpenAI bleibt im Zielmodell auf Fallback-/Presentation-Rollen begrenzt.
 */
export async function callE150Orchestrator(
  args: E150OrchestratorArgs,
): Promise<E150OrchestratorResult> {
  const capability = args.requiredCapability ?? "core_analysis";
  const policy = getAiRuntimePolicy();
  const journeyProfile = args.journeyProfile ?? getJourneyProfile(args.journey ?? "analyze");
  const { catalog, active: poolProfiles, disabled, skipped } = resolveProviderPool(capability);
  if (!poolProfiles.length) {
    const reason =
      disabled[0]?.reason || skipped[0]?.reason || "Kein aktiver Provider konfiguriert";
    throw new OrchestratorNoProviderError(
      `E150-Orchestrator: Kein aktiver Provider konfiguriert (${reason})`,
      { disabled, skipped },
    );
  }

  const probeResults = await Promise.all(
    poolProfiles.map((profile) =>
      runProviderProbeCached(profile, args.telemetry).catch(() => null),
    ),
  );

  // Decide which providers to keep without mutating during iteration
  const hardBlockKinds: AiErrorKind[] = ["UNAUTHORIZED", "INVALID_API_KEY", "MODEL_NOT_FOUND"];
  const decisions = poolProfiles.map((profile, idx) => ({
    profile,
    probe: probeResults[idx],
  }));

  const keptProfiles: ProviderProfile[] = [];

  decisions.forEach(({ profile, probe }) => {
    if (!probe || probe.ok) {
      keptProfiles.push(profile);
      return;
    }
    if (hardBlockKinds.includes(probe.errorKind ?? "UNKNOWN")) {
      const disabledUntil = probeCache.get(profile.name)?.disabledUntil ?? null;
      const reasonPrefix =
        disabledUntil && disabledUntil > Date.now()
          ? `probe block until ${new Date(disabledUntil).toISOString()}`
          : "probe failed";
      disabled.push({
        provider: profile.name,
        reason: normalizeProviderBoundaryReason({
          reason: probe.errorKind ? `${reasonPrefix} (${probe.errorKind})` : reasonPrefix,
          errorKind: probe.errorKind ?? null,
        }),
      });
      return;
    }
    // degrade but keep for TIMEOUT/INTERNAL/RATE_LIMIT/UNKNOWN
    keptProfiles.push(profile);
  });

  const profiles = keptProfiles;
  const runtimeExecutionOrder = policy.enabledRuntimeProviders.filter((provider): provider is E150ProviderName =>
    profiles.some((profile) => profile.name === provider),
  );
  const runtimeAllowedSet = new Set<E150ProviderName>(runtimeExecutionOrder);
  const activeByName = new Map(profiles.map((profile) => [profile.name, profile]));

  const primaryProviderNames = flattenRoleProviders(journeyProfile.primaryRoles);
  const secondaryProviderNames = flattenRoleProviders(journeyProfile.secondaryRoles).filter(
    (provider) => !primaryProviderNames.includes(provider),
  );
  const fallbackProviderNames = [...journeyProfile.fallbackProviders].filter(
    (provider, idx, list) =>
      list.indexOf(provider) === idx &&
      !primaryProviderNames.includes(provider) &&
      !secondaryProviderNames.includes(provider),
  );

  const toProfiles = (providers: E150ProviderName[]): ProviderProfile[] =>
    providers
      .filter((provider) => runtimeAllowedSet.has(provider))
      .sort((left, right) => runtimeExecutionOrder.indexOf(left) - runtimeExecutionOrder.indexOf(right))
      .map((provider) => activeByName.get(provider))
      .filter((profile): profile is ProviderProfile => Boolean(profile));

  const primaryProfiles = toProfiles(primaryProviderNames);
  const secondaryProfiles = toProfiles(secondaryProviderNames);
  const fallbackProfiles = toProfiles(fallbackProviderNames);

  const plannedProviders = new Set<E150ProviderName>([
    ...primaryProfiles.map((profile) => profile.name),
    ...secondaryProfiles.map((profile) => profile.name),
    ...fallbackProfiles.map((profile) => profile.name),
  ]);
  const dynamicSkipped: { provider: E150ProviderName; reason: string }[] = [];

  profiles.forEach((profile) => {
    if (!runtimeAllowedSet.has(profile.name)) {
      dynamicSkipped.push({
        provider: profile.name,
        reason: "blocked_by_runtime_policy",
      });
      return;
    }
    if (plannedProviders.has(profile.name)) return;
    dynamicSkipped.push({
      provider: profile.name,
      reason: "not_in_journey_plan",
    });
  });

  const runtimeAllowedProfiles = runtimeExecutionOrder
    .map((provider) => activeByName.get(provider))
    .filter((profile): profile is ProviderProfile => Boolean(profile));

  const executionPrimary =
    primaryProfiles.length > 0
      ? primaryProfiles
      : runtimeAllowedProfiles.filter((profile) => !fallbackProviderNames.includes(profile.name));
  const executionFallback = fallbackProfiles;

  if (executionPrimary.length === 0 && executionFallback.length === 0) {
    const reason =
      disabled[0]?.reason || skipped[0]?.reason || "Kein passender Journey-Provider aktiv";
    throw new OrchestratorNoProviderError(
      `E150-Orchestrator: Kein passender Journey-Provider aktiv (${reason})`,
      {
        disabled,
        skipped: [...skipped, ...dynamicSkipped],
      },
    );
  }

  const budgetController = new AbortController();
  const budgetTimer = setTimeout(
    () => budgetController.abort("budget_abort"),
    policy.orchestratorBudgetMs,
  );
  const mergedAbort = mergeAbortSignals([args.outerSignal, budgetController.signal]);

  const candidates: E150OrchestratorCandidate[] = [];
  const providerOutcomes: ProviderResult[] = [];
  const timings = Object.fromEntries(
    catalog.map((p) => [p.name, null]),
  ) as Record<E150ProviderName, number | null>;

  const failedProviders: E150OrchestratorMeta["failedProviders"] = [];
  const dynamicDisabled: { provider: E150ProviderName; reason: string }[] = [];
  const executedProviders: E150ProviderName[] = [];

  const registerFailure = (failure: ProviderFailure) => {
    providerOutcomes.push(failure);
    timings[failure.provider] = failure.durationMs ?? timings[failure.provider];
    if (failure.errorKind === "MODEL_NOT_FOUND") {
      dynamicDisabled.push({ provider: failure.provider, reason: "model_not_found" });
    } else {
      failedProviders.push({
        provider: failure.provider,
        error: normalizeProviderBoundaryReason({
          reason: failure.error,
          errorKind: failure.errorKind,
          cancelReason: failure.cancelReason ?? null,
          providerErrorCode: failure.providerErrorCode ?? null,
        }),
        errorKind: failure.errorKind,
        httpStatus: failure.httpStatus ?? null,
        errorMessageShort: undefined,
        providerErrorCode: safeProviderErrorCode(failure.providerErrorCode),
      });
    }
  };

  const validateAndNormalize = (
    profile: ProviderProfile,
    result: ProviderResult,
  ): Promise<{ outcome: ProviderResult; candidate?: E150OrchestratorCandidate }> => {
    if (!result.ok) {
      timings[result.provider] = result.durationMs ?? timings[result.provider];
      return Promise.resolve({ outcome: result });
    }

    const current = result as ProviderSuccess;
    const validation = validateCandidate(
      current.rawText,
      args.validationMode ?? "analyze_schema",
      args.validateRaw,
    );
    if (validation.ok === false) {
      const failure: ProviderFailure = {
        ok: false,
        provider: current.provider,
        error: normalizeProviderBoundaryReason({
          reason: validation.reason ?? validation.errorMessage,
          errorKind: validation.errorKind,
          providerErrorCode: validation.providerErrorCode,
        }),
        durationMs: current.durationMs,
        errorKind: validation.errorKind,
        attempt: current.attempt,
        errorMessageShort: undefined,
        providerErrorCode: safeProviderErrorCode(validation.providerErrorCode),
        formatUsed: current.formatUsed,
        didFallback: current.didFallback,
        openaiErrorCode: current.openaiErrorCode,
        openaiErrorMessage: null,
        parseError: validation.parseError ?? null,
        schemaError: validation.schemaError ?? null,
        schemaPath: validation.schemaPath ?? null,
        rawExcerpt: null,
      };
      return Promise.resolve({ outcome: failure });
    }

    const score = scoreCandidate(profile, validation.jsonText, current.durationMs);
    const success: ProviderSuccess = {
      ...current,
      rawText: validation.jsonText,
      parsed: validation.parsed,
    };
    const candidate: E150OrchestratorCandidate = {
      provider: current.provider,
      rawText: validation.jsonText,
      score,
      durationMs: current.durationMs,
      modelName: current.modelName,
      tokensIn: current.tokensIn,
      tokensOut: current.tokensOut,
      costEur: current.costEur,
      parsed: validation.parsed,
    };
    timings[current.provider] = current.durationMs;
    return Promise.resolve({ outcome: success, candidate });
  };

  const runPhase = async (
    phaseProfiles: ProviderProfile[],
    phaseLabel: "primary" | "secondary" | "fallback",
  ) => {
    if (phaseProfiles.length === 0) return;
    phaseProfiles.forEach((profile) => {
      if (!executedProviders.includes(profile.name)) executedProviders.push(profile.name);
    });

    const runs = phaseProfiles.map(async (profile) => {
      const baseResult = await runProvider(profile, {
        ...args,
        outerSignal: mergedAbort.signal,
      });
      const normalized = await validateAndNormalize(profile, baseResult);
      const { outcome, candidate } = normalized;
      if (outcome.ok && candidate) {
        providerOutcomes.push(outcome);
        candidates.push(candidate);
        return;
      }
      registerFailure(outcome as ProviderFailure);
    });
    await Promise.all(runs);

    if (phaseLabel !== "fallback") return;
  };

  await runPhase(executionPrimary, "primary");
  await runPhase(secondaryProfiles, "secondary");

  let fallbackExecuted = false;
  if (candidates.length === 0) {
    fallbackExecuted = true;
    await runPhase(executionFallback, "fallback");
  } else {
    executionFallback.forEach((profile) => {
      dynamicSkipped.push({
        provider: profile.name,
        reason: "fallback_not_needed",
      });
    });
  }

  clearTimeout(budgetTimer);
  mergedAbort.cleanup();

  const telemetryMeta = args.telemetry ?? {};
  const pipelineName: AiPipelineName =
    telemetryMeta.pipeline ?? "contribution_analyze";

  const profileByName = new Map(
    [...executionPrimary, ...secondaryProfiles, ...executionFallback].map((profile) => [
      profile.name,
      profile,
    ]),
  );
  const usageLogs = providerOutcomes.map((outcome) => {
    const success = outcome.ok ? (outcome as ProviderSuccess) : null;
    const failure = outcome.ok ? null : (outcome as ProviderFailure);
    const profile = profileByName.get(outcome.provider);

    return logAiUsage({
      createdAt: new Date(),
      provider: outcome.provider,
      model: success?.modelName ?? "unknown",
      pipeline: pipelineName,
      ...resolveUsageCorrelationFields(telemetryMeta),
      userId: telemetryMeta.userId ?? null,
      tenantId: telemetryMeta.tenantId ?? null,
      region: telemetryMeta.region ?? null,
      locale: args.locale ?? null,
      tokensInput: success?.tokensIn ?? 0,
      tokensOutput: success?.tokensOut ?? 0,
      costEur: success?.costEur ?? 0,
      durationMs: outcome.durationMs,
      success: Boolean(success),
      errorKind: failure?.errorKind ?? null,
      strictJson: success?.strictJson ?? profile?.strictJson ?? false,
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[E150] logAiUsage (provider outcome) failed", {
        code: safeProviderErrorCode((err as any)?.code) ?? null,
        status: typeof (err as any)?.status === "number" ? (err as any).status : null,
        name: safeTelemetryLabel((err as any)?.name) ?? null,
      });
    });
  });

  await Promise.all(usageLogs);

  const providerMatrix = buildProviderMatrix(
    catalog,
    providerOutcomes,
    [...disabled, ...dynamicDisabled],
    [...skipped, ...dynamicSkipped],
    probeResults.filter((p): p is ProbeResult => Boolean(p)),
  );

  if (!candidates.length) {
    const msg =
      budgetController.signal.aborted
        ? `E150-Orchestrator: Budget ${policy.orchestratorBudgetMs}ms erreicht.`
        : failedProviders.length === 1
          ? `E150-Orchestrator: Provider ${failedProviders[0].provider} fehlgeschlagen.`
          : "E150-Orchestrator: Alle Provider fehlgeschlagen.";
    throw new OrchestratorAllFailedError(msg, {
      disabled: [...disabled, ...dynamicDisabled],
      skipped: [...skipped, ...dynamicSkipped],
      failedProviders,
      providerMatrix,
    });
  }

  const fallbackSet = new Set(executionFallback.map((profile) => profile.name));
  const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);
  const nonFallbackBest = sortedCandidates.find(
    (candidate) => !fallbackSet.has(candidate.provider),
  );
  // "Best" only selects the least-bad draft-analysis candidate for downstream structuring.
  // It is explicitly not a truth, factcheck, or graph-promotion decision.
  const best = nonFallbackBest ?? sortedCandidates[0];
  const fallbackUsed = fallbackSet.has(best.provider);
  const successfulProviders = providerOutcomes
    .filter((outcome): outcome is ProviderSuccess => outcome.ok)
    .map((outcome) => outcome.provider);
  const failedProviderNames = providerOutcomes
    .filter((outcome): outcome is ProviderFailure => !outcome.ok)
    .map((outcome) => outcome.provider);
  const disagreementConfidence = computeDisagreementConfidence({
    primaryProviders: primaryProviderNames,
    independentProviderPool: [
      ...new Set([
        ...primaryProviderNames,
        ...secondaryProviderNames.filter((provider) => !fallbackProviderNames.includes(provider)),
      ]),
    ],
    successfulProviders,
    failedProviders: failedProviderNames,
    candidateScores: sortedCandidates.map((candidate) => ({
      provider: candidate.provider,
      score: candidate.score,
    })),
    bestProvider: best?.provider ?? null,
    fallbackProviders: fallbackProviderNames,
    fallbackUsed,
  });

  const telemetryEvents = providerOutcomes.map((outcome) => {
    const success = outcome.ok ? (outcome as ProviderSuccess) : null;
    const failure = outcome.ok ? null : (outcome as ProviderFailure);
    return recordAiTelemetry({
      task: "orchestrator:e150",
      pipeline: pipelineName,
      provider: outcome.provider,
      model: success?.modelName,
      success: outcome.ok,
      retries: 0,
      durationMs: outcome.durationMs,
      tokensIn: success?.tokensIn,
      tokensOut: success?.tokensOut,
      fallbackUsed: success ? fallbackSet.has(success.provider) : fallbackExecuted,
      errorKind: failure?.errorKind ?? null,
    }).catch(() => {});
  });
  await Promise.all(telemetryEvents);

  logProviderTelemetry(providerMatrix);

  return {
    rawText: best.rawText,
    best,
    candidates,
    meta: {
      usedProviders: executedProviders,
      failedProviders,
      timings,
      disabledProviders: [...disabled, ...dynamicDisabled],
      skippedProviders: [...skipped, ...dynamicSkipped],
      probes: probeResults.filter((p): p is ProbeResult => Boolean(p)),
      providerMatrix,
      journeyProfile: journeyProfile.journey,
      lane: journeyProfile.lane,
      roleProviderMapping: {
        primary: journeyProfile.primaryRoles as Record<string, readonly E150ProviderName[]>,
        secondary: journeyProfile.secondaryRoles as Record<string, readonly E150ProviderName[]>,
        fallback: journeyProfile.fallbackProviders as readonly E150ProviderName[],
        openAiRoles: journeyProfile.openAiRoles,
      },
      fallbackUsed,
      disagreement: disagreementConfidence.disagreement,
      confidence: disagreementConfidence.confidence,
      verificationMode: journeyProfile.verificationDefaults.verificationMode,
      researchUsed: journeyProfile.verificationDefaults.researchUsed,
      sealEligible: journeyProfile.verificationDefaults.sealEligible,
      sealGranted: journeyProfile.verificationDefaults.sealGranted,
    },
  };
}
