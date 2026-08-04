import { describe, expect, it } from "vitest";
import {
  VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT,
  VOXY_AUTO_PUBLISH_READINESS_POLICY,
  assessVoxyShadowReadiness,
  calculateVoxyShadowReviewDueAt,
  evaluateVoxyAutoPublishCandidate,
  summarizeVoxyShadowEvidence,
  type VoxyAutoPublishCandidate,
  type VoxyAutoPublishPolicySnapshot,
  type VoxyShadowActivationThresholds,
  type VoxyShadowEvidenceRecord,
} from "@/features/voxyPublishing/autoPublishReadiness";

const APPROVED_POLICY: VoxyAutoPublishPolicySnapshot = {
  ...VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT,
  policySnapshotId: "voxy-shadow-policy-2026-08-21-approved",
  approvalStatus: "approved",
  approvedBy: "human-governance-reviewer",
  approvedAt: "2026-08-20T09:00:00.000Z",
};

function buildCandidate(
  overrides: Partial<VoxyAutoPublishCandidate> = {},
): VoxyAutoPublishCandidate {
  return {
    evaluationId: "evaluation-1",
    contentId: "voxy-update-1",
    contentRevisionId: "revision-1",
    contentRevisionHash: "sha256:revision-1",
    policySnapshotId: APPROVED_POLICY.policySnapshotId,
    contentClass: "project_update",
    language: "de",
    channel: "website",
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
    generatorPrincipalId: "generator-principal",
    reviewerPrincipalId: "reviewer-principal",
    reviewServiceAvailable: true,
    killSwitchProbe: {
      evidenceId: "kill-switch-probe-1",
      testedAt: "2026-08-21T10:00:00.000Z",
      passed: true,
    },
    rollbackDrill: {
      evidenceId: "rollback-drill-1",
      testedAt: "2026-08-21T10:00:00.000Z",
      passed: true,
    },
    idempotencyKey: "voxy:revision-1:website:de",
    reviewQueueStatus: "available",
    shadowStartedAt: "2026-08-21T09:00:00.000Z",
    evaluatedAt: "2026-08-22T09:00:00.000Z",
    ...overrides,
  };
}

function asEvidence(
  candidate: VoxyAutoPublishCandidate,
  overrides: Partial<VoxyShadowEvidenceRecord> = {},
): VoxyShadowEvidenceRecord {
  const evaluation = evaluateVoxyAutoPublishCandidate(
    candidate,
    APPROVED_POLICY,
  );
  return {
    ...evaluation,
    reviewedAt: "2026-08-22T10:00:00.000Z",
    humanDecision: "approved_as_is",
    humanCorrections: [],
    humanApprovedRevisionHash: evaluation.contentRevisionHash,
    technicalFailure: false,
    ...overrides,
  };
}

function thresholds(
  overrides: Partial<VoxyShadowActivationThresholds> = {},
): VoxyShadowActivationThresholds {
  return {
    minimumReviewedSamples: 1,
    minimumReviewedSamplesPerLanguage: 1,
    minimumReviewedSamplesPerChannel: 1,
    minimumReviewedSamplesPerContentClass: 1,
    maximumCriticalMisses: 0,
    minimumAgreementRate: 1,
    maximumTechnicalFailureRate: 0,
    requiredLanguages: ["de"],
    requiredChannels: ["website"],
    requiredContentClasses: ["project_update"],
    ...overrides,
  };
}

describe("Voxy auto-publish readiness", () => {
  it("keeps execution disabled and ships only a prepared policy snapshot", () => {
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
    expect(VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT.approvalStatus).toBe(
      "prepared",
    );
  });

  it("fails closed until a central policy snapshot is human-approved", () => {
    const candidate = buildCandidate({
      policySnapshotId:
        VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT.policySnapshotId,
    });
    const evaluation = evaluateVoxyAutoPublishCandidate(candidate);

    expect(evaluation.shadowDecision).toBe("would_block");
    expect(evaluation.blockers).toContain("policy_snapshot_not_approved");
    expect(evaluation.autoPublishExecutionAllowed).toBe(false);
  });

  it("adds 30 local calendar days and preserves wall time across DST", () => {
    expect(
      calculateVoxyShadowReviewDueAt(
        "2026-08-21T09:00:00.000Z",
        30,
        "Europe/Berlin",
      ),
    ).toBe("2026-09-20T09:00:00.000Z");

    expect(
      calculateVoxyShadowReviewDueAt(
        "2026-10-04T09:00:00.000Z",
        30,
        "Europe/Berlin",
      ),
    ).toBe("2026-11-03T10:00:00.000Z");
  });

  it("records a clean centrally allowlisted item as would_publish only", () => {
    const evaluation = evaluateVoxyAutoPublishCandidate(
      buildCandidate(),
      APPROVED_POLICY,
    );

    expect(evaluation.blockers).toEqual([]);
    expect(evaluation.qualityStatus).toBe("passed");
    expect(evaluation.riskLevel).toBe("green");
    expect(evaluation.autoPublishEligible).toBe(true);
    expect(evaluation.shadowDecision).toBe("would_publish");
    expect(evaluation.humanReviewRequired).toBe(true);
    expect(evaluation.autoPublishExecutionAllowed).toBe(false);
  });

  it("does not let a candidate grant itself a language or channel", () => {
    const evaluation = evaluateVoxyAutoPublishCandidate(
      buildCandidate({ language: "fr", channel: "youtube" }),
      APPROVED_POLICY,
    );

    expect(evaluation.blockers).toEqual(
      expect.arrayContaining([
        "language_not_allowlisted",
        "channel_not_allowlisted",
      ]),
    );
    expect(evaluation.autoPublishEligible).toBe(false);
  });

  it("rejects mismatched policy snapshots and future shadow starts", () => {
    const evaluation = evaluateVoxyAutoPublishCandidate(
      buildCandidate({
        policySnapshotId: "candidate-invented-policy",
        shadowStartedAt: "2026-08-23T09:00:00.000Z",
      }),
      APPROVED_POLICY,
    );

    expect(evaluation.blockers).toEqual(
      expect.arrayContaining([
        "policy_snapshot_mismatch",
        "shadow_start_in_future",
      ]),
    );
  });

  it("blocks sensitive political, legal and personal content classes", () => {
    for (const contentClass of [
      "public_policy_analysis",
      "legal",
      "personal_data",
    ] as const) {
      const evaluation = evaluateVoxyAutoPublishCandidate(
        buildCandidate({ contentClass }),
        APPROVED_POLICY,
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
      APPROVED_POLICY,
    );

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

  it("derives independence and operational readiness from evidence", () => {
    const evaluation = evaluateVoxyAutoPublishCandidate(
      buildCandidate({
        reviewerPrincipalId: "generator-principal",
        killSwitchProbe: {
          evidenceId: "stale-kill-switch",
          testedAt: "2026-06-01T09:00:00.000Z",
          passed: true,
        },
        rollbackDrill: null,
        idempotencyKey: null,
        reviewQueueStatus: "degraded",
      }),
      APPROVED_POLICY,
    );

    expect(evaluation.blockers).toEqual(
      expect.arrayContaining([
        "generator_reviewer_not_independent",
        "kill_switch_probe_invalid",
        "rollback_drill_invalid",
        "idempotency_key_missing",
        "review_queue_unavailable",
      ]),
    );
  });

  it("counts approval after changes as a critical miss, not agreement", () => {
    const record = asEvidence(buildCandidate(), {
      humanDecision: "approved_after_changes",
      humanCorrections: ["facts"],
      humanApprovedRevisionHash: "sha256:corrected-revision",
    });
    const summary = summarizeVoxyShadowEvidence([record]);

    expect(summary.approvedAfterChangesCount).toBe(1);
    expect(summary.agreementCount).toBe(0);
    expect(summary.criticalMissCount).toBe(1);
    expect(summary.correctionsByCategory.facts).toBe(1);
  });

  it("deduplicates the same content revision before calculating evidence", () => {
    const candidate = buildCandidate();
    const older = asEvidence(candidate, {
      reviewedAt: "2026-08-22T10:00:00.000Z",
      humanDecision: "changes_requested",
      humanApprovedRevisionHash: null,
    });
    const newer = asEvidence(candidate, {
      reviewedAt: "2026-08-22T11:00:00.000Z",
    });
    const summary = summarizeVoxyShadowEvidence([older, newer]);

    expect(summary.totalRecords).toBe(2);
    expect(summary.uniqueRecordCount).toBe(1);
    expect(summary.duplicateRecordCount).toBe(1);
    expect(summary.agreementCount).toBe(1);
  });

  it("requires evidence coverage per language, channel and content class", () => {
    const summary = summarizeVoxyShadowEvidence([
      asEvidence(buildCandidate()),
    ]);
    const assessment = assessVoxyShadowReadiness({
      shadowStartedAt: "2026-08-21T09:00:00.000Z",
      now: "2026-09-20T09:00:00.000Z",
      summary,
      thresholds: thresholds({
        requiredLanguages: ["de", "en"],
        requiredChannels: ["website", "linkedin"],
        requiredContentClasses: ["project_update", "published_result"],
      }),
    });

    expect(assessment.status).toBe("continue_shadow");
    expect(assessment.blockers).toEqual(
      expect.arrayContaining([
        "language_missing:en",
        "channel_missing:linkedin",
        "content_class_missing:published_result",
      ]),
    );
  });

  it("rejects invalid statistical thresholds", () => {
    const summary = summarizeVoxyShadowEvidence([
      asEvidence(buildCandidate()),
    ]);

    expect(() =>
      assessVoxyShadowReadiness({
        shadowStartedAt: "2026-08-21T09:00:00.000Z",
        now: "2026-09-20T09:00:00.000Z",
        summary,
        thresholds: thresholds({ minimumAgreementRate: 1.01 }),
      }),
    ).toThrow("invalid_shadow_thresholds");
  });

  it("cannot request an allowlist decision before the 30-day window", () => {
    const summary = summarizeVoxyShadowEvidence([
      asEvidence(buildCandidate()),
    ]);
    const assessment = assessVoxyShadowReadiness({
      shadowStartedAt: "2026-08-21T09:00:00.000Z",
      now: "2026-09-19T09:00:00.000Z",
      summary,
      thresholds: thresholds(),
    });

    expect(assessment.status).toBe("review_window_not_complete");
    expect(assessment.autoActivationAllowed).toBe(false);
    expect(assessment.globalAutoPublishAllowed).toBe(false);
  });

  it("only becomes eligible for a separate human allowlist decision", () => {
    const summary = summarizeVoxyShadowEvidence([
      asEvidence(buildCandidate()),
      asEvidence(
        buildCandidate({
          evaluationId: "evaluation-2",
          contentId: "voxy-update-2",
          contentRevisionId: "revision-2",
          contentRevisionHash: "sha256:revision-2",
          idempotencyKey: "voxy:revision-2:linkedin:en",
          channel: "linkedin",
          language: "en",
          contentClass: "published_result",
        }),
      ),
    ]);
    const assessment = assessVoxyShadowReadiness({
      shadowStartedAt: "2026-08-21T09:00:00.000Z",
      now: "2026-09-20T09:00:00.000Z",
      summary,
      thresholds: thresholds({
        minimumReviewedSamples: 2,
        requiredLanguages: ["de", "en"],
        requiredChannels: ["website", "linkedin"],
        requiredContentClasses: ["project_update", "published_result"],
      }),
    });

    expect(assessment.status).toBe(
      "eligible_for_human_allowlist_decision",
    );
    expect(assessment.blockers).toEqual([]);
    expect(assessment.autoActivationAllowed).toBe(false);
    expect(assessment.globalAutoPublishAllowed).toBe(false);
  });
});
