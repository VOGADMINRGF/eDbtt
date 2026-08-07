import type { AnalyzeResult } from "@features/analyze/schemas";
import {
  buildAtomicClaimEvidenceHandoff,
  type AtomicClaimEvidenceHandoff,
} from "@features/analyze/atomicClaimSourceRelationAdapter";
import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";

export type CreateAnalyzeAtomicEvidenceProjection = {
  runId: string;
  inputRef: string;
  evidence: AtomicClaimEvidenceHandoff;
  requiresHumanReview: true;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
  noAutoPublish: true;
};

/**
 * Additive Create adapter. It does not mutate CreateAnalyzeResponse and does
 * not reinterpret legacy confidence/sourceSupport fields as evidence.
 */
export function buildCreateAnalyzeAtomicEvidenceProjection(params: {
  createAnalyze: Pick<CreateAnalyzeResponse, "runId" | "inputRef">;
  analyze: Pick<AnalyzeResult, "language" | "claims">;
}): CreateAnalyzeAtomicEvidenceProjection {
  return {
    runId: params.createAnalyze.runId,
    inputRef: params.createAnalyze.inputRef,
    evidence: buildAtomicClaimEvidenceHandoff(params.analyze),
    requiresHumanReview: true,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
    noAutoPublish: true,
  };
}
