import {
  parseCreateAnalyzeBoundarySnapshot,
} from "@/features/create/analyzeBoundaryContract";
import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";

export type CreateAnalyzeEnvelopeProviderMatrixEntry = {
  provider: string;
  state: "queued" | "running" | "ok" | "failed" | "cancelled" | "skipped" | "disabled";
  attempt?: number | null;
  errorKind?: string | null;
  status?: number | null;
  durationMs?: number | null;
  model?: string | null;
  reason?: string | null;
};

export type ParsedCreateAnalyzeEnvelope = {
  createAnalyze: CreateAnalyzeResponse | null;
  providerMatrix: CreateAnalyzeEnvelopeProviderMatrixEntry[];
  degraded: boolean;
  fallback: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeProviderMatrixEntry(
  value: unknown,
): CreateAnalyzeEnvelopeProviderMatrixEntry | null {
  if (!isRecord(value)) return null;
  if (typeof value.provider !== "string" || !value.provider.trim()) return null;
  if (
    value.state !== "queued" &&
    value.state !== "running" &&
    value.state !== "ok" &&
    value.state !== "failed" &&
    value.state !== "cancelled" &&
    value.state !== "skipped" &&
    value.state !== "disabled"
  ) {
    return null;
  }

  return {
    provider: value.provider,
    state: value.state,
    attempt: typeof value.attempt === "number" ? value.attempt : null,
    errorKind: typeof value.errorKind === "string" ? value.errorKind : null,
    status: typeof value.status === "number" ? value.status : null,
    durationMs: typeof value.durationMs === "number" ? value.durationMs : null,
    model: typeof value.model === "string" ? value.model : null,
    reason: typeof value.reason === "string" ? value.reason : null,
  };
}

function normalizeProviderMatrix(value: unknown): CreateAnalyzeEnvelopeProviderMatrixEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeProviderMatrixEntry).filter((entry): entry is CreateAnalyzeEnvelopeProviderMatrixEntry => Boolean(entry));
}

function resolveProviderMatrixForCreateAnalyze(params: {
  createAnalyze: CreateAnalyzeResponse | null;
  meta: unknown;
}): CreateAnalyzeEnvelopeProviderMatrixEntry[] {
  const meta = isRecord(params.meta) ? params.meta : null;
  if (!meta || !params.createAnalyze) return [];
  if (typeof meta.runId !== "string" || meta.runId !== params.createAnalyze.runId) return [];
  return normalizeProviderMatrix(meta.providerMatrix);
}

export function parseCreateAnalyzeEnvelope(value: unknown): ParsedCreateAnalyzeEnvelope {
  const root = isRecord(value) ? value : {};
  const createAnalyze = parseCreateAnalyzeBoundarySnapshot(root.createAnalyze);
  const providerMatrix = resolveProviderMatrixForCreateAnalyze({
    createAnalyze,
    meta: root.meta,
  });

  return {
    createAnalyze,
    providerMatrix,
    degraded: Boolean(root.degraded) || createAnalyze?.matchSourceState === "degraded",
    fallback: Boolean(root.fallback),
  };
}
