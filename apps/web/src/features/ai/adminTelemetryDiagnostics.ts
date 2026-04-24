import type { AiErrorKind } from "@core/telemetry/aiUsageTypes";
import type { E150ProviderName, ProviderMatrixEntry } from "@features/ai/orchestratorE150";

export const PROVIDER_ORDER: readonly E150ProviderName[] = [
  "openai",
  "anthropic",
  "mistral",
  "gemini",
  "ari",
];

export type SmokeMode = "provider_probe" | "runtime_smoke" | "full_contract";

export type DiagnosticStatus =
  | "ok"
  | "skipped"
  | "failed"
  | "degraded"
  | "config_missing";

export type JourneyDecision =
  | "selected"
  | "skipped"
  | "fallback_not_needed"
  | "not_in_plan"
  | "disabled"
  | "config_missing";

export type ProviderReachability = "reachable" | "down" | "unknown";
export type AdapterStatus = "ok" | "failed" | "not_started";
export type ParseStatus = "ok" | "failed" | "not_started";
export type SchemaStatus = "ok" | "failed" | "not_started";

export type ProviderDiagnostic = {
  provider: E150ProviderName;
  displayName: string;
  model: string | null;
  pipeline: "provider_probe" | "orchestrator_smoke";
  mode: SmokeMode;
  stage: "provider_probe" | "runtime" | "analyze_contract";
  status: DiagnosticStatus;
  errorKind: AiErrorKind | null;
  providerErrorCode: string | null;
  httpStatus: number | null;
  errorMessage: string | null;
  reason: string | null;
  validationMode: "none" | "json_only" | "analyze_schema";
  providerStatus: ProviderReachability;
  adapterStatus: AdapterStatus;
  parseStatus: ParseStatus;
  schemaStatus: SchemaStatus;
  parseError: string | null;
  schemaError: string | null;
  schemaPath: string | null;
  rawExcerpt: string | null;
  durationMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  fallbackUsed: boolean | null;
  fallbackReason: string | null;
  journeyDecision: JourneyDecision;
  rootCause: string;
  nextAction: string;
};

export function providerDisplayName(provider: E150ProviderName): string {
  switch (provider) {
    case "openai":
      return "GPT / OpenAI";
    case "anthropic":
      return "Anthropic";
    case "mistral":
      return "Mistral";
    case "gemini":
      return "Gemini";
    case "ari":
      return "ARI";
    default:
      return provider;
  }
}

export function defaultModelForProvider(provider: E150ProviderName): string {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
    case "anthropic":
      return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    case "mistral":
      return process.env.MISTRAL_MODEL ?? "mistral-large-latest";
    case "gemini":
      return process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    case "ari":
      return process.env.ARI_MODEL ?? "ari-main";
    default:
      return "unknown";
  }
}

export function sortProviderDiagnostics(rows: ProviderDiagnostic[]): ProviderDiagnostic[] {
  return [...rows].sort((left, right) => {
    const leftIndex = PROVIDER_ORDER.indexOf(left.provider);
    const rightIndex = PROVIDER_ORDER.indexOf(right.provider);
    return (leftIndex >= 0 ? leftIndex : 99) - (rightIndex >= 0 ? rightIndex : 99);
  });
}

function normalizeMessage(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeRawExcerpt(value: unknown, max = 500): string | null {
  if (value === null || value === undefined) return null;
  const base = typeof value === "string" ? value : JSON.stringify(value);
  if (!base) return null;
  let text = base;

  text = text.replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, "Bearer [redacted]");
  text = text.replace(/sk-[A-Za-z0-9_-]{20,}/g, "sk-[redacted]");
  text = text.replace(/(api[_-]?key\s*[=:]\s*)([^\s,;]+)/gi, "$1[redacted]");

  if (text.length > max) return `${text.slice(0, max)}...`;
  return text;
}

export function extractProviderErrorCode(error: unknown): string | null {
  const err = error as Record<string, any>;
  if (typeof err?.code === "string" && err.code) return err.code;
  if (typeof err?.meta?.code === "string" && err.meta.code) return err.meta.code;
  if (typeof err?.meta?.type === "string" && err.meta.type) return err.meta.type;
  if (typeof err?.payload?.error?.code === "string" && err.payload.error.code) {
    return err.payload.error.code;
  }
  if (typeof err?.payload?.error?.status === "string" && err.payload.error.status) {
    return err.payload.error.status;
  }
  return null;
}

export function mapErrorToKind(error: unknown): AiErrorKind {
  if (!error) return "UNKNOWN";
  if ((error as any)?.errorKind === "CANCELLED") return "CANCELLED";

  const message =
    normalizeMessage((error as any)?.message) ||
    (typeof error === "string" ? error : "");
  const status =
    typeof (error as any)?.status === "number"
      ? (error as any).status
      : typeof (error as any)?.httpStatus === "number"
        ? (error as any).httpStatus
        : null;

  if ((error as any)?.name === "AbortError" || /timed out|timeout/i.test(message)) {
    return "TIMEOUT";
  }
  if (status === 404 || (/model/i.test(message) && /404/.test(message))) return "MODEL_NOT_FOUND";
  if (status === 429) return "RATE_LIMIT";
  if (status === 401 || status === 403 || /unauthorized|forbidden|invalid token/i.test(message)) {
    return "UNAUTHORIZED";
  }
  if (
    status === 400 && /api key|token/i.test(message) ||
    /api key|invalid api key|invalid_api_key/i.test(message)
  ) {
    return "INVALID_API_KEY";
  }
  if (/json|schema|parse|zod/i.test(message)) return "BAD_JSON";
  return status ? "INTERNAL" : "UNKNOWN";
}

export function resolveJourneyDecision(
  entryState: ProviderMatrixEntry["state"] | "probe",
  reason: string | null,
): JourneyDecision {
  const reasonText = normalizeMessage(reason).toLowerCase();
  if (entryState === "probe") return "selected";
  if (entryState === "skipped") {
    if (reasonText.includes("not_in_journey_plan")) return "not_in_plan";
    if (reasonText.includes("fallback_not_needed")) return "fallback_not_needed";
    return "skipped";
  }
  if (entryState === "disabled") {
    if (looksConfigMissing(reason)) return "config_missing";
    return "disabled";
  }
  return "selected";
}

export function looksConfigMissing(reason: string | null | undefined): boolean {
  const text = normalizeMessage(reason).toLowerCase();
  if (!text) return false;
  return (
    text.includes("api key fehlt") ||
    text.includes("ungultig") ||
    text.includes("ungueltig") ||
    text.includes("basis-url fehlt") ||
    text.includes("config") ||
    text.includes("missing") ||
    text.includes("disabled_by_env")
  );
}

export function deriveProviderStatus(kind: AiErrorKind | null, status: DiagnosticStatus): ProviderReachability {
  if (status === "ok") return "reachable";
  if (!kind) return "unknown";
  if (kind === "TIMEOUT" || kind === "INTERNAL" || kind === "RATE_LIMIT") return "unknown";
  if (kind === "BAD_JSON") return "reachable";
  if (kind === "MODEL_NOT_FOUND" || kind === "UNAUTHORIZED" || kind === "INVALID_API_KEY") return "down";
  return "unknown";
}

export function deriveRootCause(row: Pick<
  ProviderDiagnostic,
  | "status"
  | "journeyDecision"
  | "errorKind"
  | "parseStatus"
  | "schemaStatus"
  | "providerErrorCode"
  | "providerStatus"
>): string {
  if (row.status === "ok") return "OK";
  if (row.status === "config_missing" || row.journeyDecision === "config_missing") return "CONFIG_MISSING";
  if (row.journeyDecision === "not_in_plan") return "NOT_IN_JOURNEY_PLAN";
  if (row.errorKind === "MODEL_NOT_FOUND") return "MODEL_NOT_FOUND";
  if (row.providerErrorCode === "OPENAI_EMPTY_OUTPUT") return "OPENAI_EMPTY_OUTPUT";
  if (row.errorKind === "TIMEOUT") return "TIMEOUT";
  if (row.errorKind === "BAD_JSON" && row.parseStatus === "failed") return "BAD_JSON";
  if (row.schemaStatus === "failed") return "SCHEMA_FAILED";
  if (row.errorKind === "UNAUTHORIZED" || row.errorKind === "INVALID_API_KEY") return "AUTH_FAILED";
  if (row.providerStatus === "down") return "PROVIDER_DOWN";
  return "RUNTIME_FAILED";
}

export function deriveNextAction(row: Pick<
  ProviderDiagnostic,
  | "status"
  | "journeyDecision"
  | "errorKind"
  | "providerStatus"
  | "parseStatus"
  | "schemaStatus"
  | "providerErrorCode"
>): string {
  if (row.status === "ok") return "Keine Aktion";
  if (row.status === "config_missing" || row.journeyDecision === "config_missing") {
    return "ENV pruefen.";
  }
  if (row.journeyDecision === "not_in_plan") {
    return "Provider ist nicht Teil dieses Orchestrator-Plans; Direktprobe nutzen.";
  }
  if (row.errorKind === "MODEL_NOT_FOUND") {
    return "Modellname/Fallback aktualisieren.";
  }
  if (row.providerErrorCode === "OPENAI_EMPTY_OUTPUT") {
    return "Reasoning/output format pruefen.";
  }
  if (row.errorKind === "TIMEOUT") {
    return "Timeout/latency/provider degradation pruefen.";
  }
  if (row.errorKind === "BAD_JSON" && row.providerStatus === "reachable") {
    return "Provider erreichbar; Analyze-/JSON-Contract pruefen.";
  }
  if (row.parseStatus === "failed") {
    return "JSON-Parser und Adapter-Output pruefen.";
  }
  if (row.schemaStatus === "failed") {
    return "Schema-Contract und Pflichtfelder pruefen.";
  }
  if (row.errorKind === "UNAUTHORIZED" || row.errorKind === "INVALID_API_KEY") {
    return "API-Key/Berechtigung pruefen.";
  }
  return "Adapter-/Runtime-Logs pruefen.";
}
