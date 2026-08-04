import { describe, expect, it } from "vitest";
import {
  VOXY_AUTO_PUBLISH_READINESS_POLICY,
  assessVoxyShadowReadiness,
  calculateVoxyShadowReviewDueAt,
  evaluateVoxyAutoPublishCandidate,
  summarizeVoxyShadowEvidence,
  type VoxyAutoPublishCandidate,
  type VoxyShadowEvidenceRecord,
} from "@/features/voxyPublishing/autoPublishReadiness";

function buildCandidate(
  overrides: Partial<VoxyAutoPublishCandidate> = {},
): VoxyAutoPublishCandidate {
  return {
    contentId: "voxy-update-1",
    contentClass: "project_update",
    language: "de",
    channel: "website",
    allowedLanguages: ["de", "en"],
    allowedChannels: ["website", "linkedin"],
    sourceCoverage: "verified",
    factualityStatus: "verified",
    translationConsistency: "not_applicable",
    policyFlags: [],
    technicalValidation: {
      renderComplete: true,
      fileIntegrity: true,
      captionsValid: true,
      brandingValid: true,
      accessibilityValid: true,
      formatValid: true,
    },
    generatorModelVersion: "generator-v1",
    reviewModelVersion: "reviewer-v1",
    promptVersion: "prompt-v1",
    reviewServiceAvailable: true,
    generatorAndReviewerIndependent: true,
    killSwitchAvailable: true,
    rollbackAvailable: true,
    idempotencyVerified: true,
    humanReviewAvailable: true,
    shadowStartedAt: "2026-08-21T09:00:00.000Z",
    humanDecision: "pending",
    humanCorrections: [],
    ...overrides,
  };
}

function asEvidence(
  candidate: VoxyAutoPublishCandidate,
  overrides: Partial<VoxyShadowEvidenceRecord> = {},
): VoxyShadowEvidenceRecord {
  return {
    ...evaluateVoxyAutoPublishCandidate(candidate),
    reviewedAt: "2026-08-22T09:00:00.000Z",
    technicalFailure: false,
    ...overrides,
  };
}

describe("Voxy auto-publish readiness", () => {
  it("keeps manual review and auto execution disabled by policy", () => {
    expect(VOXY_AUTO_PUBLISH_READINESS_POLICY.humanReviewRequired).toBe(true);
    expect(
      VOXY_AUTO_PUBLISH_READINESS_POLICY.autoPublishExecutionAllowed,
    ).toBe(false);
    expect(VOXY_AUTO_PUBLISH_READINESS_POLICY.autoActivationAllowed).toBe(
      false,
    );
    expect(
      VOXY_AUTO_PUBLISH_READINESS_POLICY.politicalViewpointScoringAllowed,
    ).toBe(false);
  });

  it("calculates the review date exactly 30 calendar days after shadow start", () => {
    expect(
      calculateVoxyShadowReviewDueAt("2026-08-21T09:00:00.000Z"),
    ).toBe("2026-09-20T09:00:00.000Z");
  });

  it("records a clean allowlisted item as would_publish but never executes it", () => {
    const evaluation = evaluateVoxyAutoPublishCandidate(buildCandidate());

    expect(evaluation.blockers).toEqual([]);
    expect(evaluation.qualityStatus).toBe("passed");
    expect(evaluation.riskLevel).toBe("green");
    expect(evaluation.autoPublishEligible).toBe(true);
    expect(evaluation.shadowDecision).toBe("would_publish");
    expect(evaluation.humanReviewRequired).toBe(true);
    expect(evaluation.autoPublishExecutionAllowed).toBe(false);
  });

  it("blocks sensitive political, legal and personal content classes", () => {
    for (const contentClass of ["public_policy_analysis", "legal", "personal_data"] as const) {
      const evaluation = evaluateVoxyAutoPublishCandidate(
        buildCandidate({ contentClass }),
      );

      expect(evaluation.autoPublishEligible).toBe(false);
      expect(evaluation.shadowDecision).toBe("would_block");
      expect(evaluation.blockers).toContain("sensitive_content_class");
      expect(evaluation.blockers).toContain("content_class_not_allowlisted");
    }
  });

  it("fails closed for source, translation and policy concerns", () => {
    const evaluation = evaluateVoxyAutoPublishCandidate(
      buildCandidate({
        sourceCoverage: "partial",
        factualityStatus: "contested",
        translationConsistency: "inconsistent",
        policyFlags: ["unconfirmed_allegation"],
      }),
    );

    expect(evaluation.autoPublishEligible).toBe(false);
    expect(evaluation.riskLevel).toBe("red");
    expect(evaluation.blockers).toEqual(
      expect.arrayContaining([
        "source_coverage_not_verified",
        "factuality_not_verified",
        "translation_inconsistent",
        "policy_flag_present",
      ]),
    );
  });

  it("requires independent review, version provenance, rollback and kill switch", () => {
    const evaluation = evaluateVoxyAutoPublishCandidate(
      buildCandidate({
        generatorModelVersion: null,
        reviewModelVersion: null,
        promptVersion: null,
        generatorAndReviewerIndependent: false,
        killSwitchAvailable: false,
        rollbackAvailable: false,
        idempotencyVerified: false,
      }),
    );

    expect(evaluation.blockers).toEqual(
      expect.arrayContaining([
        "generator_version_missing",
        "reviewer_version_missing",
        "prompt_version_missing",
        "generator_reviewer_not_independent",
        "kill_switch_unavailable",
        "rollback_unavailable",
        "idempotency_unverified",
      ]),
    );
    expect(evaluation.autoPublishExecutionAllowed).toBe(false);
  });

  it("summarizes human agreement, critical misses, overblocks and corrections", () => {
    const records: VoxyShadowEvidenceRecord[] = [
      asEvidence(buildCandidate({ humanDecision: "approved" }), {
        humanDecision: "approved",
      }),
      asEvidence(
        buildCandidate({
          contentId: "voxy-update-2",
          humanDecision: "changes_requested",
          humanCorrections: ["facts", "sources"],
        }),
        {
          humanDecision: "changes_requested",
          humanCorrections: ["facts", "sources"],
        },
      ),
      asEvidence(
        buildCandidate({
          contentId: "voxy-update-3",
          contentClass: "legal",
          humanDecision: "approved",
        }),
        { humanDecision: "approved", technicalFailure: true },
      ),
    ];

    const summary = summarizeVoxyShadowEvidence(records);

    expect(summary.totalRecords).toBe(3);
    expect(summary.totalHumanReviewed).toBe(3);
    expect(summary.agreementCount).toBe(1);
    expect(summary.criticalMissCount).toBe(1);
    expect(summary.overblockCount).toBe(1);
    expect(summary.technicalFailureCount).toBe(1);
    expect(summary.correctionsByCategory.facts).toBe(1);
    expect(summary.correctionsByCategory.sources).toBe(1);
  });

  it("cannot request an allowlist decision before the 30-day window", () => {
    const summary = summarizeVoxyShadowEvidence([
      asEvidence(buildCandidate({ humanDecision: "approved" }), {
        humanDecision: "approved",
      }),
    ]);

    const assessment = assessVoxyShadowReadiness({
      shadowStartedAt: "2026-08-21T09:00:00.000Z",
      now: "2026-09-19T09:00:00.000Z",
      summary,
      thresholds: {
        minimumReviewedSamples: 1,
        maximumCriticalMisses: 0,
        minimumAgreementRate: 1,
        maximumTechnicalFailureRate: 0,
        requiredLanguages: ["de"],
      },
    });

    expect(assessment.status).toBe("review_window_not_complete");
    expect(assessment.autoActivationAllowed).toBe(false);
    expect(assessment.globalAutoPublishAllowed).toBe(false);
  });

  it("only becomes eligible for a separate human allowlist decision", () => {
    const summary = summarizeVoxyShadowEvidence([
      asEvidence(buildCandidate({ humanDecision: "approved" }), {
        humanDecision: "approved",
      }),
      asEvidence(
        buildCandidate({
          contentId: "voxy-update-2",
          channel: "linkedin",
          language: "en",
          humanDecision: "approved",
        }),
        { humanDecision: "approved" },
      ),
    ]);

    const assessment = assessVoxyShadowReadiness({
      shadowStartedAt: "2026-08-21T09:00:00.000Z",
      now: "2026-09-20T09:00:00.000Z",
      summary,
      thresholds: {
        minimumReviewedSamples: 2,
        maximumCriticalMisses: 0,
        minimumAgreementRate: 1,
        maximumTechnicalFailureRate: 0,
        requiredLanguages: ["de", "en"],
      },
    });

    expect(assessment.status).toBe(
      "eligible_for_human_allowlist_decision",
    );
    expect(assessment.blockers).toEqual([]);
    expect(assessment.autoActivationAllowed).toBe(false);
    expect(assessment.globalAutoPublishAllowed).toBe(false);
  });
});
