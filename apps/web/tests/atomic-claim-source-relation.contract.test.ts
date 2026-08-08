import { describe, expect, it } from "vitest";

import {
  CLAIM_SOURCE_RELATION_TYPES,
  countIndependentSupportFamilies,
  haveEquivalentAtomicClaimScope,
  relationCountsAsIndependentSupport,
  relationTargetsSameAtomicClaim,
  resolvePublicationClassification,
  sourceArtifactEligibleAsExternalEvidence,
  validateSynthesisReceipt,
  type AtomicClaim,
  type ClaimSourceRelation,
  type EvidenceAssessment,
  type SourceArtifact,
  type SourceSegment,
  type SynthesisReceipt,
} from "@features/analyze/atomicClaimSourceRelationContract";

const baseClaim: AtomicClaim = {
  id: "claim-1",
  type: "quantified_claim",
  text: "In der Stichprobe nennen 60 Prozent der Befragten Thema X.",
  originalLocale: "de",
  scope: {
    subject: "Befragte",
    predicate: "nennen",
    object: "Thema X",
    timeScope: "2026-Q2",
    jurisdictionScope: "Berlin",
    populationScope: "Stichprobe A",
    quantification: "60 Prozent",
  },
};

const baseSegment: SourceSegment = {
  id: "segment-1",
  sourceArtifactId: "source-1",
  locator: "S. 4",
  originalText: "60 Prozent der Befragten nennen Thema X.",
  readingView: null,
  contextBefore: "Methodik und Stichprobe werden unmittelbar davor beschrieben.",
  contextAfter: "Danach folgen Einschränkungen der Übertragbarkeit.",
  speaker: null,
  recognitionUncertainty: "none",
  segmentRefStatus: "bound",
  transcriptionStatus: "not_applicable",
  translationStatus: "original",
};

const baseRelation: ClaimSourceRelation = {
  id: "relation-1",
  claimId: baseClaim.id,
  sourceSegmentId: baseSegment.id,
  sourceFamilyId: "family-1",
  relationType: "supports_exactly",
  sourceIndependence: "independent",
  segmentRefStatus: "bound",
  translationOnly: false,
  reviewStatus: "reviewed",
};

const baseAssessment: EvidenceAssessment = {
  sourceSegmentFidelity: "high",
  speakerAttributionConfidence: "high",
  transcriptionConfidence: "not_applicable",
  claimEntailmentStrength: "strong",
  sourceReliabilityForClaim: "high",
  sourceIndependence: "verified",
  externalVerificationStatus: "verified",
  generalizabilityScope: "bounded",
  counterevidenceStatus: "none_found",
  freshnessStatus: "current",
  humanReviewStatus: "reviewed",
};

function buildReceipt(
  overrides: Partial<SynthesisReceipt> = {},
): SynthesisReceipt {
  return {
    caseId: "case-1",
    caseRevision: "rev-1",
    claimIds: [baseClaim.id],
    sourceSegmentIds: [baseSegment.id],
    relationIds: [baseRelation.id],
    sourceFamilies: [
      {
        sourceFamilyId: baseRelation.sourceFamilyId,
        independenceStatus: "independent",
      },
    ],
    counterevidenceIds: [],
    alternativeExplanationIds: [],
    omittedCounterevidenceIds: [],
    openEvidenceGaps: [],
    allowedPublicationClassification: "publishable_as_open_hypothesis",
    requestedPublicationClassification: "publishable_as_open_hypothesis",
    modelVersion: "fixture-model",
    promptVersion: "fixture-prompt",
    policyVersion: "atomic-claim-source-relation-v1",
    humanReviewRevision: "review-1",
    introducedClaimIds: [],
    promotedRelationIds: [],
    translationEvidenceSegmentIds: [],
    ...overrides,
  };
}

describe("atomic claim/source relation contract", () => {
  it("does not treat thematic similarity as support for the same atomic claim", () => {
    expect(relationTargetsSameAtomicClaim("thematically_related_only")).toBe(false);
    expect(
      relationCountsAsIndependentSupport({
        ...baseRelation,
        relationType: "thematically_related_only",
      }),
    ).toBe(false);
  });

  it("counts multiple agent runs on the same source family only once", () => {
    const relations: ClaimSourceRelation[] = [
      baseRelation,
      {
        ...baseRelation,
        id: "relation-2",
        sourceSegmentId: "segment-2",
      },
    ];

    expect(countIndependentSupportFamilies(relations)).toBe(1);
  });

  it("does not count a syndicated agency copy as a second independent family", () => {
    const relations: ClaimSourceRelation[] = [
      baseRelation,
      {
        ...baseRelation,
        id: "relation-2",
        sourceSegmentId: "segment-2",
        sourceFamilyId: "agency-family-1",
        sourceIndependence: "same_family",
      },
      {
        ...baseRelation,
        id: "relation-3",
        sourceSegmentId: "segment-3",
        sourceFamilyId: "agency-family-1",
        sourceIndependence: "same_family",
      },
    ];

    expect(countIndependentSupportFamilies(relations)).toBe(1);
  });

  it("never treats a model output or model derivative as primary external evidence", () => {
    const artifact: SourceArtifact = {
      id: "source-model-1",
      canonicalRef: "internal:model-output:fixture",
      sourceType: "model_output",
      publisherOrAuthor: "fixture-model",
      publishedAt: null,
      accessedAt: "2026-08-07T00:00:00.000Z",
      originalLocale: "de",
      sourceFamilyId: "family-model-1",
      contentHashOrRevision: "fixture-revision",
      lineageStatus: "model_derivative",
      rightsStatus: "known",
      retentionStatus: "allowed",
      accessStatus: "internal",
    };

    expect(sourceArtifactEligibleAsExternalEvidence(artifact)).toBe(false);
  });

  it("keeps personal experience publishable only as personal experience", () => {
    const claim: AtomicClaim = {
      ...baseClaim,
      type: "personal_experience",
      text: "Ich habe diesen Ablauf so erlebt.",
    };

    expect(
      resolvePublicationClassification({
        claim,
        relations: [{ ...baseRelation, claimId: claim.id }],
        sourceSegments: [baseSegment],
        assessment: baseAssessment,
      }),
    ).toBe("publishable_as_personal_experience");
  });

  it("keeps contradiction, counterexample, boundary case and alternative explanation distinct", () => {
    const required = [
      "contradicts_same_claim",
      "counterexample",
      "exception_or_boundary_case",
      "alternative_explanation",
    ];

    expect(new Set(required).size).toBe(4);
    for (const relationType of required) {
      expect(CLAIM_SOURCE_RELATION_TYPES).toContain(relationType);
    }
  });

  it("blocks an unreviewed automatic transcript from becoming a verified quote", () => {
    const claim: AtomicClaim = {
      ...baseClaim,
      type: "reported_speech",
      text: "Die Person sagte X.",
    };
    const segment: SourceSegment = {
      ...baseSegment,
      speaker: "Person A",
      recognitionUncertainty: "medium",
      transcriptionStatus: "automatic_unreviewed",
    };

    expect(
      resolvePublicationClassification({
        claim,
        relations: [
          {
            ...baseRelation,
            claimId: claim.id,
            relationType: "reported_by_source",
          },
        ],
        sourceSegments: [segment],
        assessment: {
          ...baseAssessment,
          transcriptionConfidence: "medium",
        },
      }),
    ).toBe("review_required");
  });

  it("rejects synthesis that promotes an open hypothesis to externally verified fact", () => {
    const result = validateSynthesisReceipt(
      buildReceipt({
        requestedPublicationClassification: "publishable_as_externally_verified_fact",
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("publication_classification_promotion_or_drift");
  });

  it("keeps counterevidence and alternative explanations explicitly visible in the receipt", () => {
    const receipt = buildReceipt({
      counterevidenceIds: ["counter-1"],
      alternativeExplanationIds: ["alternative-1"],
      omittedCounterevidenceIds: ["counter-2"],
      openEvidenceGaps: ["independent replication missing"],
    });

    expect(receipt.counterevidenceIds).toEqual(["counter-1"]);
    expect(receipt.alternativeExplanationIds).toEqual(["alternative-1"]);
    expect(receipt.omittedCounterevidenceIds).toEqual(["counter-2"]);
    expect(receipt.openEvidenceGaps).toEqual(["independent replication missing"]);
  });

  it("prevents corroboration when quantification differs", () => {
    const other: AtomicClaim = {
      ...baseClaim,
      id: "claim-2",
      scope: {
        ...baseClaim.scope,
        quantification: "80 Prozent",
      },
    };

    expect(haveEquivalentAtomicClaimScope(baseClaim, other)).toBe(false);
  });

  it("prevents exact support when subject, time or jurisdiction scope differs", () => {
    const changedClaims: AtomicClaim[] = [
      {
        ...baseClaim,
        id: "claim-subject",
        scope: { ...baseClaim.scope, subject: "Abgeordnete" },
      },
      {
        ...baseClaim,
        id: "claim-time",
        scope: { ...baseClaim.scope, timeScope: "2025-Q2" },
      },
      {
        ...baseClaim,
        id: "claim-jurisdiction",
        scope: { ...baseClaim.scope, jurisdictionScope: "Brandenburg" },
      },
    ];

    for (const claim of changedClaims) {
      expect(haveEquivalentAtomicClaimScope(baseClaim, claim)).toBe(false);
    }
  });

  it("never counts a translated reading view as evidence", () => {
    expect(
      relationCountsAsIndependentSupport({
        ...baseRelation,
        translationOnly: true,
      }),
    ).toBe(false);

    expect(
      resolvePublicationClassification({
        claim: baseClaim,
        relations: [{ ...baseRelation, translationOnly: true }],
        sourceSegments: [
          {
            ...baseSegment,
            readingView: "Translated reading view",
            translationStatus: "machine_reading_view",
          },
        ],
        assessment: baseAssessment,
      }),
    ).toBe("review_required");
  });

  it("fails closed when the source segment reference is missing", () => {
    expect(
      resolvePublicationClassification({
        claim: baseClaim,
        relations: [
          {
            ...baseRelation,
            segmentRefStatus: "missing",
          },
        ],
        sourceSegments: [baseSegment],
        assessment: baseAssessment,
      }),
    ).toBe("blocked_source_integrity");
  });

  it("allows externally verified fact wording only with reviewed exact independent support", () => {
    expect(
      resolvePublicationClassification({
        claim: baseClaim,
        relations: [baseRelation],
        sourceSegments: [baseSegment],
        assessment: baseAssessment,
      }),
    ).toBe("publishable_as_externally_verified_fact");

    expect(
      resolvePublicationClassification({
        claim: baseClaim,
        relations: [{ ...baseRelation, sourceIndependence: "unknown" }],
        sourceSegments: [baseSegment],
        assessment: baseAssessment,
      }),
    ).toBe("publishable_as_open_hypothesis");
  });

  it("rejects receipts that introduce claims, promote relations or use translation as evidence", () => {
    const result = validateSynthesisReceipt(
      buildReceipt({
        introducedClaimIds: ["invented-claim"],
        promotedRelationIds: ["relation-promoted"],
        translationEvidenceSegmentIds: ["translation-view-1"],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "synthesis_introduced_new_claims",
        "synthesis_promoted_relations",
        "translation_used_as_evidence",
      ]),
    );
  });
});
