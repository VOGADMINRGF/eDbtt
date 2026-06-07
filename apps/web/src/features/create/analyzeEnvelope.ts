import {
  parseCreateAnalyzeBoundarySnapshot,
} from "@/features/create/analyzeBoundaryContract";
import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";
import type { SourceGroundingAudit } from "@features/analyze/sourceGroundingContract";
import {
  deriveTruthGuardContract,
  deriveVerificationLabel,
  type SourceSupport,
  type TruthStatus,
  type ResearchUsed,
  type UserFacingVerificationLabel,
  type VerificationMode,
} from "@features/ai/e150/verificationContract";
import type { E150Lane } from "@features/ai/e150/journeyProfiles";

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
  verification: ParsedCreateAnalyzeVerification | null;
};

export type ParsedCreateAnalyzeVerification = {
  lane: E150Lane;
  verificationMode: VerificationMode;
  researchUsed: ResearchUsed;
  sealEligible: boolean;
  sealGranted: boolean;
  verificationLabel: UserFacingVerificationLabel;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  reviewRecommended: boolean;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
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
  const materialExtraction = isRecord(value.materialExtraction) ? value.materialExtraction : null;
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
      youtubeTranscripts:
        typeof sourceInventory.youtubeTranscripts === "number" ? sourceInventory.youtubeTranscripts : 0,
      pdfDocuments:
        typeof sourceInventory.pdfDocuments === "number" ? sourceInventory.pdfDocuments : 0,
      materialSummaries:
        typeof sourceInventory.materialSummaries === "number" ? sourceInventory.materialSummaries : 0,
    },
    materialExtraction: {
      total: typeof materialExtraction?.total === "number" ? materialExtraction.total : 0,
      complete: typeof materialExtraction?.complete === "number" ? materialExtraction.complete : 0,
      partial: typeof materialExtraction?.partial === "number" ? materialExtraction.partial : 0,
      none: typeof materialExtraction?.none === "number" ? materialExtraction.none : 0,
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

function asVerificationMode(value: unknown): VerificationMode | null {
  if (value === "none" || value === "precheck" || value === "sealed") return value;
  return null;
}

function asResearchUsed(value: unknown): ResearchUsed | null {
  if (
    value === "none" ||
    value === "lite" ||
    value === "gemini" ||
    value === "search" ||
    value === "deep_search"
  ) {
    return value;
  }
  return null;
}

function asVerificationLabel(value: unknown): UserFacingVerificationLabel | null {
  if (value === "analysiert" || value === "geprueft" || value === "verifiziert") return value;
  return null;
}

function asLane(value: unknown): E150Lane | null {
  if (value === "standard" || value === "sealed_factcheck" || value === "material_grounding") return value;
  return null;
}

function asTruthStatus(value: unknown): TruthStatus | null {
  if (
    value === "draft_analysis" ||
    value === "source_open" ||
    value === "source_grounded" ||
    value === "review_required" ||
    value === "factcheck_requested" ||
    value === "factcheck_passed" ||
    value === "sealed_verified"
  ) {
    return value;
  }
  return null;
}

function asSourceSupport(value: unknown): SourceSupport | null {
  if (
    value === "none" ||
    value === "open" ||
    value === "inferred" ||
    value === "partial" ||
    value === "sourced" ||
    value === "sealed"
  ) {
    return value;
  }
  return null;
}

function resolveCreateAnalyzeVerification(value: {
  root: Record<string, unknown>;
  meta: Record<string, unknown>;
}): ParsedCreateAnalyzeVerification | null {
  const verificationMode = asVerificationMode(
    value.root.verificationMode ?? value.meta.verificationMode,
  );
  const researchUsed = asResearchUsed(value.root.researchUsed ?? value.meta.researchUsed);
  const sealEligibleRaw = value.root.sealEligible ?? value.meta.sealEligible;
  const sealGrantedRaw = value.root.sealGranted ?? value.meta.sealGranted;
  const sealEligible = typeof sealEligibleRaw === "boolean" ? sealEligibleRaw : null;
  const sealGranted = typeof sealGrantedRaw === "boolean" ? sealGrantedRaw : null;
  const verificationLabel = asVerificationLabel(
    value.root.verificationLabel ?? value.meta.verificationLabel,
  );
  const lane = asLane(value.root.lane ?? value.meta.lane);
  const truthStatus = asTruthStatus(value.root.truthStatus ?? value.meta.truthStatus);
  const sourceSupport = asSourceSupport(value.root.sourceSupport ?? value.meta.sourceSupport);
  const sourceStatusRaw = value.root.sourceStatus ?? value.meta.sourceStatus;
  const sourceStatus = typeof sourceStatusRaw === "string" ? sourceStatusRaw : null;
  const reviewRecommendedRaw = value.root.reviewRecommended ?? value.meta.reviewRecommended;
  const reviewRecommended =
    typeof reviewRecommendedRaw === "boolean" ? reviewRecommendedRaw : null;

  if (
    !verificationMode &&
    !verificationLabel &&
    !researchUsed &&
    sealEligible === null &&
    sealGranted === null &&
    !truthStatus &&
    !sourceSupport &&
    !sourceStatus &&
    reviewRecommended === null
  ) {
    return null;
  }

  const inferredModeFromLabel: VerificationMode | null =
    verificationLabel === "analysiert"
      ? "none"
      : verificationLabel === "verifiziert"
        ? "sealed"
        : sealEligible === true
          ? "sealed"
          : "precheck";

  const resolvedVerificationMode = verificationMode ?? inferredModeFromLabel;
  if (!resolvedVerificationMode) return null;

  const resolvedSealGranted = sealGranted ?? verificationLabel === "verifiziert";
  const resolvedSealEligible =
    sealEligible ?? resolvedVerificationMode === "sealed";
  const resolvedResearchUsed =
    researchUsed ?? (resolvedVerificationMode === "sealed" ? "search" : "none");
  const resolvedLane = lane ?? "standard";
  const derivedTruthGuard = deriveTruthGuardContract({
    lane: resolvedLane,
    verificationMode: resolvedVerificationMode,
    sealGranted: resolvedSealGranted,
    sourceGrounding: normalizeSourceGroundingAudit(value.meta.sourceGrounding),
    reviewRecommended: reviewRecommended ?? undefined,
  });
  const truthGuard =
    truthStatus && sourceSupport && sourceStatus && reviewRecommended !== null
      ? {
          verificationLabel: verificationLabel ?? derivedTruthGuard.verificationLabel,
          truthStatus,
          sourceSupport,
          sourceStatus,
          reviewRecommended,
          noTruthPromotion: true as const,
          noAutoGraphPromotion: true as const,
        }
      : derivedTruthGuard;

  return {
    lane: resolvedLane,
    verificationMode: resolvedVerificationMode,
    researchUsed: resolvedResearchUsed,
    sealEligible: resolvedSealEligible,
    sealGranted: resolvedSealGranted,
    verificationLabel: truthGuard.verificationLabel,
    truthStatus: truthGuard.truthStatus,
    sourceSupport: truthGuard.sourceSupport,
    sourceStatus: truthGuard.sourceStatus,
    reviewRecommended: truthGuard.reviewRecommended,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
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
  const verification = resolveCreateAnalyzeVerification({
    root,
    meta,
  });

  return {
    createAnalyze,
    providerMatrix,
    degraded: Boolean(root.degraded) || createAnalyze?.matchSourceState === "degraded",
    fallback: Boolean(root.fallback),
    sourceGrounding,
    verification,
  };
}
