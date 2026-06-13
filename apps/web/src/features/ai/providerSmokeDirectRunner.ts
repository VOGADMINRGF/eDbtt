import { AnalyzeResultSchema } from "@features/analyze/schemas";
import { extractJsonCandidate } from "@features/analyze/llmJson";
import type { E150ProviderName } from "@features/ai/orchestratorE150";
import { callOpenAI } from "@features/ai/providers/openai";
import { callAnthropic } from "@features/ai/providers/anthropic";
import { callMistral } from "@features/ai/providers/mistral";
import { callGemini } from "@features/ai/providers/gemini";
import {
  defaultModelForProvider,
  deriveNextAction,
  deriveProviderStatus,
  deriveRootCause,
  extractProviderErrorCode,
  getProviderContractCapabilities,
  isAccountBlockedErrorCode,
  isNonRepairableContractErrorCode,
  isRepairableContractErrorCode,
  mapErrorToKind,
  providerDisplayName,
  sanitizeRawExcerpt,
  type ProviderDiagnostic,
} from "@/features/ai/adminTelemetryDiagnostics";
import { estimateAiRunCost } from "@/features/ai/aiCostTelemetry";

const FULL_SAMPLE_TEXT =
  "In unserer Stadt soll ein autofreier Sonntag pro Monat eingefuehrt werden, um die Luftqualitaet zu verbessern und den OePNV zu staerken.";
const RUNTIME_SYSTEM_PROMPT =
  "You are the E150 runtime smoke-tester. Return strict RFC8259 JSON with keys: ok (true), ping ('OK'), providerNote (short string).";
const RUNTIME_USER_PROMPT =
  "Runtime probe for admin orchestrator smoke. Respond only with the required JSON object.";
const DIRECT_PROBE_PROMPT =
  "Return only valid JSON: {\"ok\":true,\"ping\":\"pong\",\"provider\":\"<name>\"}. No markdown.";
const PROBE_TINY_MAX_OUTPUT_TOKENS = 96;
const RUNTIME_TINY_MAX_OUTPUT_TOKENS = 192;

const FULL_CONTRACT_PROMPT = [
  "Return exactly one top-level AnalyzeResult JSON object (RFC8259).",
  "Never return an array as top-level value.",
  "Never return only claims.",
  "Include all required top-level keys of AnalyzeResultSchema.",
  "report.facts.local and report.facts.international must always be arrays.",
  "If no facts are available return [] for both arrays.",
  "For consequence scopes never use local; use only local_short, local_long, national, global, systemic.",
  "No markdown. No explanations. JSON object only.",
].join(" ");

export type DirectFullContractRunOptions = {
  mode?: "full" | "full-lite";
  maxOutputTokens?: number | null;
  disableRepair?: boolean;
};

type RouteFullInternal = (
  provider: E150ProviderName,
  options?: DirectFullContractRunOptions,
) => Promise<ProviderDiagnostic>;

declare global {
   
  var __EDEBATTE_ROUTE_DIRECT_FULL_PROVIDER__: RouteFullInternal | undefined;
}

const OPENAI_SMOKE_DEFAULT_MODEL = "gpt-4.1-mini";

function openAiSmokeModel(): string {
  return process.env.OPENAI_SMOKE_MODEL || OPENAI_SMOKE_DEFAULT_MODEL;
}

function openAiSmokeTimeoutMs(): number {
  const raw = Number(process.env.OPENAI_SMOKE_TIMEOUT_MS ?? 30_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

function openAiSmokeMaxOutputTokens(): number {
  const raw = Number(process.env.OPENAI_SMOKE_MAX_OUTPUT_TOKENS ?? 2_200);
  return Number.isFinite(raw) && raw > 0 ? raw : 2_200;
}

function configMissingReason(provider: E150ProviderName): string | null {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY ? null : "missing OPENAI_API_KEY";
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY ? null : "missing ANTHROPIC_API_KEY";
    case "mistral":
      return process.env.MISTRAL_API_KEY ? null : "missing MISTRAL_API_KEY";
    case "gemini":
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
        ? null
        : "missing GEMINI_API_KEY / GOOGLE_API_KEY";
    default:
      return "unsupported provider";
  }
}

function buildRow(
  provider: E150ProviderName,
  mode: ProviderDiagnostic["mode"],
  stage: ProviderDiagnostic["stage"],
  partial: Partial<ProviderDiagnostic>,
): ProviderDiagnostic {
  const capabilities = getProviderContractCapabilities(provider);
  const model = partial.model ?? defaultModelForProvider(provider);
  const tokensIn = typeof partial.tokensIn === "number" ? partial.tokensIn : null;
  const tokensOut = typeof partial.tokensOut === "number" ? partial.tokensOut : null;
  const costEstimate = estimateAiRunCost({
    provider,
    model,
    tokensIn,
    tokensOut,
  });
  const smokeMode: ProviderDiagnostic["smokeMode"] =
    mode === "provider_probe" ? "probe" : mode === "runtime_smoke" ? "runtime" : "full";
  const runCostGroup: ProviderDiagnostic["runCostGroup"] =
    smokeMode === "probe" || smokeMode === "runtime" ? "tiny" : "full";
  const budgetProfile: ProviderDiagnostic["budgetProfile"] =
    smokeMode === "probe" ? "probe_tiny" : smokeMode === "runtime" ? "runtime_tiny" : "full_default";
  const row: ProviderDiagnostic = {
    provider,
    displayName: providerDisplayName(provider),
    model,
    pipeline: "provider_probe",
    mode,
    stage,
    status: partial.status ?? "failed",
    errorKind: partial.errorKind ?? null,
    providerErrorCode: partial.providerErrorCode ?? null,
    httpStatus: partial.httpStatus ?? null,
    errorMessage: partial.errorMessage ?? null,
    reason: partial.reason ?? null,
    validationMode: partial.validationMode ?? "none",
    providerStatus: partial.providerStatus ?? deriveProviderStatus(partial.errorKind ?? null, partial.status ?? "failed"),
    adapterStatus: partial.adapterStatus ?? "not_started",
    parseStatus: partial.parseStatus ?? "not_started",
    schemaStatus: partial.schemaStatus ?? "not_started",
    parseError: partial.parseError ?? null,
    schemaError: partial.schemaError ?? null,
    schemaPath: partial.schemaPath ?? null,
    rawExcerpt: sanitizeRawExcerpt(partial.rawExcerpt ?? partial.errorMessage ?? null),
    durationMs: partial.durationMs ?? null,
    tokensIn,
    tokensOut,
    estimatedCostUsd: costEstimate.estimatedCostUsd,
    estimatedCostEur: costEstimate.estimatedCostEur,
    costKnown: costEstimate.costKnown,
    pricingSource: costEstimate.pricingSource,
    costReason: costEstimate.reason,
    runCostGroup,
    smokeMode,
    budgetProfile,
    fallbackUsed: partial.fallbackUsed ?? null,
    fallbackReason: partial.fallbackReason ?? null,
    journeyDecision: partial.journeyDecision ?? "selected",
    strictStatus: partial.strictStatus ?? "not_started",
    strictProviderErrorCode: partial.strictProviderErrorCode ?? null,
    strictSchemaPath: partial.strictSchemaPath ?? null,
    repairAttempted: partial.repairAttempted ?? false,
    repairStatus: partial.repairStatus ?? "not_attempted",
    repairProviderErrorCode: partial.repairProviderErrorCode ?? null,
    repairSchemaPath: partial.repairSchemaPath ?? null,
    repairReason: partial.repairReason ?? null,
    repairUsed: partial.repairUsed ?? false,
    directStrictStatus: partial.directStrictStatus ?? "not_started",
    draftStatus: partial.draftStatus ?? "not_attempted",
    envelopeBuildStatus: partial.envelopeBuildStatus ?? "not_attempted",
    finalSchemaStatus: partial.finalSchemaStatus ?? "not_started",
    finalContractStatus: partial.finalContractStatus ?? "not_started",
    buildWarnings: partial.buildWarnings ?? [],
    filledDefaults: partial.filledDefaults ?? [],
    missingContainers: partial.missingContainers ?? [],
    normalizedEnumWarnings: partial.normalizedEnumWarnings ?? [],
    generatedIds: partial.generatedIds ?? [],
    nativeStrategy: capabilities.nativeStrategy,
    preferredContractStrategy: capabilities.preferredContractStrategy,
    providerStrategy: capabilities.preferredContractStrategy,
    fallbackStrategy: capabilities.fallbackStrategy,
    supportsStrictJsonSchema: capabilities.supportsStrictJsonSchema,
    supportsJsonObjectMode: capabilities.supportsJsonObjectMode,
    supportsPromptEnvelope: capabilities.supportsPromptEnvelope,
    supportsRepairAttempt: capabilities.supportsRepairAttempt,
    canBeUsedAsRepairProvider: capabilities.canBeUsedAsRepairProvider,
    knownBlockers: capabilities.knownBlockers,
    nonRepairableErrorCodes: capabilities.nonRepairableErrorCodes,
    diagnosticNotes: partial.diagnosticNotes ?? capabilities.diagnosticNotes,
    formatUsed: partial.formatUsed ?? null,
    didFallback: partial.didFallback ?? null,
    timeoutMs: partial.timeoutMs ?? null,
    maxOutputTokens: partial.maxOutputTokens ?? null,
    openaiErrorCode: partial.openaiErrorCode ?? null,
    openaiErrorMessage: partial.openaiErrorMessage ?? null,
    selectedSmokeModel: partial.selectedSmokeModel ?? null,
    smokeModelEnvPresent: partial.smokeModelEnvPresent ?? null,
    effectiveModel: partial.effectiveModel ?? null,
    openAiSmokeModelMismatch: partial.openAiSmokeModelMismatch ?? null,
    rootCause: "",
    nextAction: "",
  };
  row.rootCause = deriveRootCause(row);
  row.nextAction = deriveNextAction(row);
  return row;
}

function cleanJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) cleaned = cleaned.slice(firstNewline + 1);
    const lastFence = cleaned.lastIndexOf("```");
    if (lastFence !== -1) cleaned = cleaned.slice(0, lastFence);
    cleaned = cleaned.trim();
  }
  return cleaned;
}

function validateProbePayload(rawText: string): { ok: boolean; parseStatus: ProviderDiagnostic["parseStatus"]; parseError: string | null } {
  const cleaned = (extractJsonCandidate(rawText || "") ?? cleanJson(rawText || "")).trim();
  if (!cleaned) {
    return { ok: false, parseStatus: "failed", parseError: "empty_output" };
  }
  const normalized = cleaned.trim().toLowerCase();
  if (normalized === "pong" || normalized === "ok") {
    return { ok: true, parseStatus: "not_started", parseError: null };
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      return { ok: true, parseStatus: "ok", parseError: null };
    }
    return { ok: false, parseStatus: "failed", parseError: "json_not_object" };
  } catch (error: any) {
    return { ok: false, parseStatus: "failed", parseError: error?.message ?? "json_parse_failed" };
  }
}

function normalizeErrorCode(input: {
  providerErrorCode: string | null | undefined;
  status?: number | null;
  message?: string | null;
}): string | null {
  const code = typeof input.providerErrorCode === "string" && input.providerErrorCode.trim().length > 0
    ? input.providerErrorCode.trim().toUpperCase()
    : null;
  const message = (input.message ?? "").toLowerCase();
  if (code) return code;
  if (input.status === 429 || message.includes("rate limit")) return "RATE_LIMIT";
  if (input.status === 402 || message.includes("payment required")) return "PAYMENT_REQUIRED";
  if (input.status === 401 || input.status === 403) return "UNAUTHORIZED";
  if (message.includes("timeout")) return "TIMEOUT";
  if (message.includes("resource_exhausted")) return "RESOURCE_EXHAUSTED";
  if (message.includes("unavailable")) return "UNAVAILABLE";
  if (message.includes("openai_empty_output")) return "OPENAI_EMPTY_OUTPUT";
  return null;
}

function isOpenAiSmokeModelMismatch(params: {
  selectedSmokeModel: string | null;
  effectiveModel: string | null;
  smokeModelEnvPresent: boolean;
}): boolean {
  if (!params.smokeModelEnvPresent) return false;
  if (!params.selectedSmokeModel || !params.effectiveModel) return false;
  return params.selectedSmokeModel.trim().toLowerCase() !== params.effectiveModel.trim().toLowerCase();
}

type FullValidation = {
  ok: boolean;
  parseStatus: ProviderDiagnostic["parseStatus"];
  schemaStatus: ProviderDiagnostic["schemaStatus"];
  providerErrorCode: string | null;
  errorMessage: string | null;
  schemaPath: string | null;
  rawExcerpt: string | null;
};

function validateFullContract(rawText: string): FullValidation {
  const candidate = (extractJsonCandidate(rawText ?? "") ?? cleanJson(rawText ?? "")).trim();
  if (!candidate) {
    return {
      ok: false,
      parseStatus: "failed",
      schemaStatus: "not_started",
      providerErrorCode: "BAD_JSON",
      errorMessage: "no_json_object_found",
      schemaPath: null,
      rawExcerpt: sanitizeRawExcerpt(rawText),
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (error: any) {
    return {
      ok: false,
      parseStatus: "failed",
      schemaStatus: "not_started",
      providerErrorCode: "BAD_JSON",
      errorMessage: error?.message ?? "json_parse_failed",
      schemaPath: null,
      rawExcerpt: sanitizeRawExcerpt(candidate),
    };
  }

  if (Array.isArray(parsed)) {
    return {
      ok: false,
      parseStatus: "ok",
      schemaStatus: "failed",
      providerErrorCode: "TOP_LEVEL_ARRAY",
      errorMessage: "top_level_array_not_allowed",
      schemaPath: "$",
      rawExcerpt: sanitizeRawExcerpt(candidate),
    };
  }
  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      parseStatus: "ok",
      schemaStatus: "failed",
      providerErrorCode: "TOP_LEVEL_NOT_OBJECT",
      errorMessage: "top_level_not_object",
      schemaPath: "$",
      rawExcerpt: sanitizeRawExcerpt(candidate),
    };
  }

  const schema = AnalyzeResultSchema.safeParse(parsed);
  if (schema.success) {
    return {
      ok: true,
      parseStatus: "ok",
      schemaStatus: "ok",
      providerErrorCode: null,
      errorMessage: null,
      schemaPath: null,
      rawExcerpt: sanitizeRawExcerpt(candidate),
    };
  }
  const first = schema.error.issues[0];
  const path = Array.isArray(first?.path) ? first.path.join(".") || "$" : "$";
  return {
    ok: false,
    parseStatus: "ok",
    schemaStatus: "failed",
    providerErrorCode: "SCHEMA_INVALID",
    errorMessage: first?.message ?? "schema_invalid",
    schemaPath: path,
    rawExcerpt: sanitizeRawExcerpt(candidate),
  };
}

async function callProvider(params: {
  provider: E150ProviderName;
  prompt: string;
  maxOutputTokens: number;
  timeoutMs?: number;
  expectJson?: boolean;
}): Promise<{
  text: string;
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  formatUsed: "json_schema" | "json_object" | null;
  didFallback: boolean | null;
  openaiErrorCode: string | null;
  openaiErrorMessage: string | null;
}> {
  if (params.provider === "openai") {
    const result = await callOpenAI({
      prompt: params.prompt,
      asJson: true,
      forceJsonFormat: true,
      model: openAiSmokeModel(),
      maxOutputTokens: params.maxOutputTokens,
      timeoutMs: params.timeoutMs ?? openAiSmokeTimeoutMs(),
    });
    return {
      text: result.text,
      model: result.model ?? openAiSmokeModel(),
      tokensIn: result.tokensIn ?? null,
      tokensOut: result.tokensOut ?? null,
      formatUsed: result.formatUsed ?? null,
      didFallback: typeof result.didFallback === "boolean" ? result.didFallback : null,
      openaiErrorCode: result.openaiErrorCode ?? null,
      openaiErrorMessage: result.openaiErrorMessage ?? null,
    };
  }
  if (params.provider === "anthropic") {
    const result = await callAnthropic({
      prompt: params.prompt,
      maxOutputTokens: params.maxOutputTokens,
    });
    return {
      text: result.text,
      model: result.model ?? defaultModelForProvider(params.provider),
      tokensIn: result.tokensIn ?? null,
      tokensOut: result.tokensOut ?? null,
      formatUsed: null,
      didFallback: null,
      openaiErrorCode: null,
      openaiErrorMessage: null,
    };
  }
  if (params.provider === "gemini") {
    const result = await callGemini({
      prompt: params.prompt,
      maxOutputTokens: params.maxOutputTokens,
      expectJson: params.expectJson ?? true,
    });
    return {
      text: result.text,
      model: result.model ?? defaultModelForProvider(params.provider),
      tokensIn: result.tokensIn ?? null,
      tokensOut: result.tokensOut ?? null,
      formatUsed: "json_object",
      didFallback: null,
      openaiErrorCode: null,
      openaiErrorMessage: null,
    };
  }
  const result = await callMistral({
    prompt: params.prompt,
    maxOutputTokens: params.maxOutputTokens,
  });
  return {
    text: result.text,
    model: result.model ?? defaultModelForProvider(params.provider),
    tokensIn: result.tokensIn ?? null,
    tokensOut: result.tokensOut ?? null,
    formatUsed: "json_object",
    didFallback: null,
    openaiErrorCode: null,
    openaiErrorMessage: null,
  };
}

export async function runDirectProbeDiagnostic(provider: E150ProviderName): Promise<ProviderDiagnostic> {
  const isOpenAi = provider === "openai";
  const selectedSmokeModel = isOpenAi ? openAiSmokeModel() : null;
  const smokeModelEnvPresent = isOpenAi ? Boolean(process.env.OPENAI_SMOKE_MODEL) : null;
  const probeTimeoutMs = isOpenAi ? openAiSmokeTimeoutMs() : null;
  const missing = configMissingReason(provider);
  if (missing) {
    return buildRow(provider, "provider_probe", "provider_probe", {
      model: isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : defaultModelForProvider(provider),
      status: "config_missing",
      errorKind: "INVALID_API_KEY",
      providerErrorCode: "CONFIG_MISSING",
      errorMessage: missing,
      reason: missing,
      validationMode: "none",
      providerStatus: "unknown",
      adapterStatus: "not_started",
      journeyDecision: "config_missing",
      strictStatus: "blocked",
      directStrictStatus: "blocked",
      finalContractStatus: "blocked",
      timeoutMs: probeTimeoutMs,
      maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
      selectedSmokeModel,
      smokeModelEnvPresent,
      effectiveModel: isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : null,
      openAiSmokeModelMismatch: false,
    });
  }

  const started = Date.now();
  try {
    let result = await callProvider({
      provider,
      prompt: DIRECT_PROBE_PROMPT.replace("<name>", provider),
      maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
      timeoutMs: probeTimeoutMs ?? undefined,
      expectJson: provider === "gemini" ? true : undefined,
    });
    let validated = validateProbePayload(result.text);
    if (provider === "gemini" && !validated.ok) {
      result = await callProvider({
        provider,
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", provider),
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
        expectJson: false,
      });
      validated = validateProbePayload(result.text);
    }
    const effectiveModel = result.model ?? (isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : defaultModelForProvider(provider));
    const openAiSmokeModelMismatch =
      isOpenAi &&
      isOpenAiSmokeModelMismatch({
        selectedSmokeModel,
        effectiveModel,
        smokeModelEnvPresent: Boolean(smokeModelEnvPresent),
      });
    if (!validated.ok) {
      return buildRow(provider, "provider_probe", "provider_probe", {
        model: effectiveModel,
        status: "failed",
        errorKind: "BAD_JSON",
        providerErrorCode: "BAD_JSON",
        errorMessage: validated.parseError,
        reason: validated.parseError,
        validationMode: "none",
        providerStatus: "reachable",
        adapterStatus: "failed",
        parseStatus: validated.parseStatus,
        parseError: validated.parseError,
        rawExcerpt: result.text,
        durationMs: Date.now() - started,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        timeoutMs: probeTimeoutMs,
        maxOutputTokens: provider === "gemini" ? RUNTIME_TINY_MAX_OUTPUT_TOKENS : PROBE_TINY_MAX_OUTPUT_TOKENS,
        selectedSmokeModel,
        smokeModelEnvPresent,
        effectiveModel,
        openAiSmokeModelMismatch,
      });
    }
    return buildRow(provider, "provider_probe", "provider_probe", {
      model: effectiveModel,
      status: "ok",
      validationMode: "none",
      providerStatus: "reachable",
      adapterStatus: "ok",
      parseStatus: validated.parseStatus,
      rawExcerpt: result.text,
      durationMs: Date.now() - started,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      strictStatus: "ok",
      directStrictStatus: "ok",
      finalSchemaStatus: "ok",
      finalContractStatus: "strict_ok",
      timeoutMs: probeTimeoutMs,
      maxOutputTokens: provider === "gemini" ? RUNTIME_TINY_MAX_OUTPUT_TOKENS : PROBE_TINY_MAX_OUTPUT_TOKENS,
      selectedSmokeModel,
      smokeModelEnvPresent,
      effectiveModel,
      openAiSmokeModelMismatch,
    });
  } catch (error: any) {
    const errorKind = mapErrorToKind(error);
    const providerErrorCode = normalizeErrorCode({
      providerErrorCode: extractProviderErrorCode(error),
      status: typeof error?.status === "number" ? error.status : null,
      message: error?.message ?? null,
    });
    const effectiveModel =
      error?.meta?.model ??
      (isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : defaultModelForProvider(provider));
    const openAiSmokeModelMismatch =
      isOpenAi &&
      isOpenAiSmokeModelMismatch({
        selectedSmokeModel,
        effectiveModel,
        smokeModelEnvPresent: Boolean(smokeModelEnvPresent),
      });
    return buildRow(provider, "provider_probe", "provider_probe", {
      model: effectiveModel,
      status: "failed",
      errorKind,
      providerErrorCode,
      errorMessage: error?.message ?? "provider_probe_failed",
      reason: error?.message ?? "provider_probe_failed",
      validationMode: "none",
      providerStatus: deriveProviderStatus(errorKind, "failed"),
      adapterStatus: "failed",
      rawExcerpt: error?.payload ?? error?.message,
      durationMs: Date.now() - started,
      strictStatus: "failed",
      strictProviderErrorCode: providerErrorCode,
      directStrictStatus: "failed",
      finalContractStatus: isAccountBlockedErrorCode(providerErrorCode) ? "blocked" : "failed",
      timeoutMs: probeTimeoutMs,
      maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
      selectedSmokeModel,
      smokeModelEnvPresent,
      effectiveModel,
      openAiSmokeModelMismatch,
    });
  }
}

export async function runDirectRuntimeDiagnostic(provider: E150ProviderName): Promise<ProviderDiagnostic> {
  const runtimePrompt = `${RUNTIME_SYSTEM_PROMPT}\n\n${RUNTIME_USER_PROMPT}`;
  return runDirectProbeDiagnosticWithPrompt(provider, runtimePrompt, "runtime_smoke", "runtime");
}

function runDirectProbeDiagnosticWithPrompt(
  provider: E150ProviderName,
  prompt: string,
  mode: ProviderDiagnostic["mode"],
  stage: ProviderDiagnostic["stage"],
): Promise<ProviderDiagnostic> {
  return (async () => {
    const isOpenAi = provider === "openai";
    const selectedSmokeModel = isOpenAi ? openAiSmokeModel() : null;
    const smokeModelEnvPresent = isOpenAi ? Boolean(process.env.OPENAI_SMOKE_MODEL) : null;
    const probeTimeoutMs = isOpenAi ? openAiSmokeTimeoutMs() : null;
    const missing = configMissingReason(provider);
    if (missing) {
      return buildRow(provider, mode, stage, {
        model: isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : defaultModelForProvider(provider),
        status: "config_missing",
        errorKind: "INVALID_API_KEY",
        providerErrorCode: "CONFIG_MISSING",
        errorMessage: missing,
        reason: missing,
        validationMode: "json_only",
        providerStatus: "unknown",
        adapterStatus: "not_started",
        journeyDecision: "config_missing",
        strictStatus: "blocked",
        directStrictStatus: "blocked",
        finalContractStatus: "blocked",
        timeoutMs: probeTimeoutMs,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
        selectedSmokeModel,
        smokeModelEnvPresent,
        effectiveModel: isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : null,
        openAiSmokeModelMismatch: false,
      });
    }

    const started = Date.now();
    try {
      let result = await callProvider({
        provider,
        prompt,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
        timeoutMs: probeTimeoutMs ?? undefined,
        expectJson: provider === "gemini" ? true : undefined,
      });
      let validated = validateProbePayload(result.text);
      if (provider === "gemini" && !validated.ok) {
        result = await callProvider({
          provider,
          prompt,
          maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
          expectJson: false,
        });
        validated = validateProbePayload(result.text);
      }
      const effectiveModel = result.model ?? (isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : defaultModelForProvider(provider));
      const openAiSmokeModelMismatch =
        isOpenAi &&
        isOpenAiSmokeModelMismatch({
          selectedSmokeModel,
          effectiveModel,
          smokeModelEnvPresent: Boolean(smokeModelEnvPresent),
        });
      if (!validated.ok) {
        return buildRow(provider, mode, stage, {
          model: effectiveModel,
          status: "failed",
          errorKind: "BAD_JSON",
          providerErrorCode: "BAD_JSON",
          errorMessage: validated.parseError,
          reason: validated.parseError,
          validationMode: "json_only",
          providerStatus: "reachable",
          adapterStatus: "failed",
          parseStatus: validated.parseStatus,
          parseError: validated.parseError,
          rawExcerpt: result.text,
          durationMs: Date.now() - started,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          strictStatus: "failed",
          strictProviderErrorCode: "BAD_JSON",
          directStrictStatus: "failed",
          finalContractStatus: "failed",
          timeoutMs: probeTimeoutMs,
          maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
          selectedSmokeModel,
          smokeModelEnvPresent,
          effectiveModel,
          openAiSmokeModelMismatch,
        });
      }

      return buildRow(provider, mode, stage, {
        model: effectiveModel,
        status: "ok",
        validationMode: "json_only",
        providerStatus: "reachable",
        adapterStatus: "ok",
        parseStatus: validated.parseStatus,
        rawExcerpt: result.text,
        durationMs: Date.now() - started,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        strictStatus: "ok",
        directStrictStatus: "ok",
        finalSchemaStatus: "ok",
        finalContractStatus: "strict_ok",
        timeoutMs: probeTimeoutMs,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
        selectedSmokeModel,
        smokeModelEnvPresent,
        effectiveModel,
        openAiSmokeModelMismatch,
      });
    } catch (error: any) {
      const errorKind = mapErrorToKind(error);
      const providerErrorCode = normalizeErrorCode({
        providerErrorCode: extractProviderErrorCode(error),
        status: typeof error?.status === "number" ? error.status : null,
        message: error?.message ?? null,
      });
      const effectiveModel =
        error?.meta?.model ??
        (isOpenAi ? selectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : defaultModelForProvider(provider));
      const openAiSmokeModelMismatch =
        isOpenAi &&
        isOpenAiSmokeModelMismatch({
          selectedSmokeModel,
          effectiveModel,
          smokeModelEnvPresent: Boolean(smokeModelEnvPresent),
        });
      return buildRow(provider, mode, stage, {
        model: effectiveModel,
        status: "failed",
        errorKind,
        providerErrorCode,
        errorMessage: error?.message ?? "provider_runtime_failed",
        reason: error?.message ?? "provider_runtime_failed",
        validationMode: "json_only",
        providerStatus: deriveProviderStatus(errorKind, "failed"),
        adapterStatus: "failed",
        rawExcerpt: error?.payload ?? error?.message,
        durationMs: Date.now() - started,
        strictStatus: "failed",
        strictProviderErrorCode: providerErrorCode,
        directStrictStatus: "failed",
        finalContractStatus: isAccountBlockedErrorCode(providerErrorCode) ? "blocked" : "failed",
        timeoutMs: probeTimeoutMs,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
        selectedSmokeModel,
        smokeModelEnvPresent,
        effectiveModel,
        openAiSmokeModelMismatch,
      });
    }
  })();
}

function buildFullRepairPrompt(raw: string, errorCode: string | null, schemaPath: string | null): string {
  return [
    "Convert the provider output into exactly one AnalyzeResult JSON object.",
    "No markdown. No explanations. No list output.",
    "The top-level value must be one object.",
    `strictErrorCode=${errorCode ?? "unknown"}`,
    `strictSchemaPath=${schemaPath ?? "$"}`,
    "Allowed consequence scopes: local_short, local_long, national, global, systemic. Never use local.",
    "report.facts.local and report.facts.international must always be arrays; use [] if unknown.",
    "Raw output:",
    raw.slice(0, 10000),
  ].join("\n");
}

export async function runDirectFullContractDiagnostic(
  provider: E150ProviderName,
  options?: DirectFullContractRunOptions,
): Promise<ProviderDiagnostic> {
  await import("@/app/api/admin/ai/orchestrator-smoke/route");
  const internal = globalThis.__EDEBATTE_ROUTE_DIRECT_FULL_PROVIDER__;
  if (!internal) {
    throw new Error("route_direct_full_provider_internal_missing");
  }
  return internal(provider, options);
}
