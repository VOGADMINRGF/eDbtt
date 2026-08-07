import type { AnalyzeResult, StatementRecord } from "@features/analyze/schemas";
import type { AtomicClaim } from "@features/analyze/atomicClaimSourceRelationContract";

export const ATOMIC_CLAIM_EVIDENCE_HANDOFF_VERSION =
  "atomic_claim_source_relation_handoff.v1" as const;

export const ATOMIC_CLAIM_EVIDENCE_RELATION_STATES = [
  "no_claims",
  "unbound_requires_review",
  "bound_review_required",
  "bound_reviewed",
] as const;

export type AtomicClaimEvidenceRelationState =
  (typeof ATOMIC_CLAIM_EVIDENCE_RELATION_STATES)[number];

export type AtomicClaimEvidenceHandoff = {
  schemaVersion: typeof ATOMIC_CLAIM_EVIDENCE_HANDOFF_VERSION;
  sourceAnalyzeLanguage: string;
  atomicClaims: AtomicClaim[];
  sourceSegmentIds: string[];
  relationIds: string[];
  sourceFamilyIds: string[];
  unmappedAnalyzeClaimIds: string[];
  relationState: AtomicClaimEvidenceRelationState;
  requiresHumanReview: true;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
  noAutoPublish: true;
};

function mapStatementType(
  statementType: StatementRecord["statementType"],
): AtomicClaim["type"] | null {
  if (statementType === "fact") return "factual_claim";
  if (statementType === "interpretation") return "interpretation";
  if (statementType === "value") return "normative_position";
  if (statementType === "question") return null;
  return "non_checkable_opinion";
}

function toAtomicClaim(
  statement: StatementRecord,
  originalLocale: string,
): AtomicClaim | null {
  const type = mapStatementType(statement.statementType);
  if (!type) return null;

  return {
    id: statement.id,
    type,
    text: statement.text,
    originalLocale,
    scope: {
      subject: null,
      predicate: null,
      object: null,
      timeScope: null,
      jurisdictionScope: null,
      populationScope: null,
      quantification: null,
    },
  };
}

/**
 * Legacy-safe projection from the existing AnalyzeResult into the canonical
 * atomic-claim contract. It deliberately does not invent SourceSegments,
 * relations, source independence or publication eligibility.
 */
export function buildAtomicClaimEvidenceHandoff(
  analyze: Pick<AnalyzeResult, "language" | "claims">,
): AtomicClaimEvidenceHandoff {
  const atomicClaims: AtomicClaim[] = [];
  const unmappedAnalyzeClaimIds: string[] = [];

  for (const statement of analyze.claims) {
    const mapped = toAtomicClaim(statement, analyze.language);
    if (mapped) {
      atomicClaims.push(mapped);
    } else {
      unmappedAnalyzeClaimIds.push(statement.id);
    }
  }

  return {
    schemaVersion: ATOMIC_CLAIM_EVIDENCE_HANDOFF_VERSION,
    sourceAnalyzeLanguage: analyze.language,
    atomicClaims,
    sourceSegmentIds: [],
    relationIds: [],
    sourceFamilyIds: [],
    unmappedAnalyzeClaimIds,
    relationState:
      atomicClaims.length === 0 ? "no_claims" : "unbound_requires_review",
    requiresHumanReview: true,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
    noAutoPublish: true,
  };
}

export type AtomicClaimEvidenceHandoffSummary = {
  schemaVersion: typeof ATOMIC_CLAIM_EVIDENCE_HANDOFF_VERSION;
  atomicClaimIds: string[];
  sourceSegmentIds: string[];
  relationIds: string[];
  sourceFamilyIds: string[];
  unmappedAnalyzeClaimIds: string[];
  relationState: AtomicClaimEvidenceRelationState;
  requiresHumanReview: true;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
  noAutoPublish: true;
};

export function summarizeAtomicClaimEvidenceHandoff(
  handoff: AtomicClaimEvidenceHandoff,
): AtomicClaimEvidenceHandoffSummary {
  return {
    schemaVersion: handoff.schemaVersion,
    atomicClaimIds: handoff.atomicClaims.map((claim) => claim.id),
    sourceSegmentIds: [...handoff.sourceSegmentIds],
    relationIds: [...handoff.relationIds],
    sourceFamilyIds: [...handoff.sourceFamilyIds],
    unmappedAnalyzeClaimIds: [...handoff.unmappedAnalyzeClaimIds],
    relationState: handoff.relationState,
    requiresHumanReview: true,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
    noAutoPublish: true,
  };
}
