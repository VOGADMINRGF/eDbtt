import {
  parseCreateAnalyzeBoundarySnapshot,
} from "@/features/create/analyzeBoundaryContract";
import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";
import type { SourceGroundingAudit } from "@features/analyze/sourceGroundingContract";

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
  sourceGrounding: SourceGroundingAudit | null;
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

function asRiskLevel(value: unknown): "low" | "medium" | "high" | null {
  if (value === "low" || value === "medium" || value === "high") return value;
  return null;
}

function asSourceTaskType(value: unknown): "analyze" | "media" | "guided" | null {
  if (value === "analyze" || value === "media" || value === "guided") return value;
  return null;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function normalizeSourceGroundingAudit(value: unknown): SourceGroundingAudit | null {
  if (!isRecord(value)) return null;
  const taskType = asSourceTaskType(value.taskType);
  const sourceInventory = isRecord(value.sourceInventory) ? value.sourceInventory : null;
  const documentGroundingPass = isRecord(value.documentGroundingPass) ? value.documentGroundingPass : null;
  const externalContextPass = isRecord(value.externalContextPass) ? value.externalContextPass : null;
  const synthesis = isRecord(value.synthesis) ? value.synthesis : null;
  const contradictionAudit = isRecord(value.contradictionAudit) ? value.contradictionAudit : null;
  const noSourceBluffing = isRecord(value.noSourceBluffing) ? value.noSourceBluffing : null;

  const contextRotRisk = asRiskLevel(documentGroundingPass?.contextRotRisk);
  const policy = externalContextPass?.policy === "supplement_only" ? "supplement_only" : null;

  if (
    !taskType ||
    !sourceInventory ||
    !documentGroundingPass ||
    !externalContextPass ||
    !synthesis ||
    !contradictionAudit ||
    !noSourceBluffing ||
    !contextRotRisk ||
    !policy
  ) {
    return null;
  }

  return {
    taskType,
    sourceInventory: {
      total: typeof sourceInventory.total === "number" ? sourceInventory.total : 0,
      uploadDocuments:
        typeof sourceInventory.uploadDocuments === "number" ? sourceInventory.uploadDocuments : 0,
      webReferences:
        typeof sourceInventory.webReferences === "number" ? sourceInventory.webReferences : 0,
      freeNotes: typeof sourceInventory.freeNotes === "number" ? sourceInventory.freeNotes : 0,
    },
    documentGroundingPass: {
      required: Boolean(documentGroundingPass.required),
      documentsWithText:
        typeof documentGroundingPass.documentsWithText === "number"
          ? documentGroundingPass.documentsWithText
          : 0,
      startCoverage: Boolean(documentGroundingPass.startCoverage),
      middleCoverage: Boolean(documentGroundingPass.middleCoverage),
      endCoverage: Boolean(documentGroundingPass.endCoverage),
      contextRotRisk,
    },
    externalContextPass: {
      webReferences:
        typeof externalContextPass.webReferences === "number" ? externalContextPass.webReferences : 0,
      policy,
    },
    synthesis: {
      documentGroundedClaims:
        typeof synthesis.documentGroundedClaims === "number" ? synthesis.documentGroundedClaims : 0,
      webGroundedClaims: typeof synthesis.webGroundedClaims === "number" ? synthesis.webGroundedClaims : 0,
      inferredClaims: typeof synthesis.inferredClaims === "number" ? synthesis.inferredClaims : 0,
      openClaims: typeof synthesis.openClaims === "number" ? synthesis.openClaims : 0,
    },
    contradictionAudit: {
      contradictionSignals: normalizeStringList(contradictionAudit.contradictionSignals),
      hasSignal: Boolean(contradictionAudit.hasSignal),
    },
    noSourceBluffing: {
      passed: Boolean(noSourceBluffing.passed),
      reason: typeof noSourceBluffing.reason === "string" ? noSourceBluffing.reason : null,
    },
    requiresManualReview: Boolean(value.requiresManualReview),
  };
}

export function parseCreateAnalyzeEnvelope(value: unknown): ParsedCreateAnalyzeEnvelope {
  const root = isRecord(value) ? value : {};
  const meta = isRecord(root.meta) ? root.meta : {};
  const createAnalyze = parseCreateAnalyzeBoundarySnapshot(root.createAnalyze);
  const providerMatrix = resolveProviderMatrixForCreateAnalyze({
    createAnalyze,
    meta,
  });
  const sourceGrounding = normalizeSourceGroundingAudit(meta.sourceGrounding);

  return {
    createAnalyze,
    providerMatrix,
    degraded: Boolean(root.degraded) || createAnalyze?.matchSourceState === "degraded",
    fallback: Boolean(root.fallback),
    sourceGrounding,
  };
}
