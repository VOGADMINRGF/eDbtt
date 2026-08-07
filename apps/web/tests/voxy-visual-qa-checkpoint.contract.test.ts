import { describe, expect, it } from "vitest";
import {
  applyPersistedVoxyVisualQaReviewDecision,
  buildVoxyVisualQaCheckpoint,
  buildVoxyVisualQaSnapshot,
  getVoxyVisualQaEvidenceKey,
  getVoxyVisualQaReviewDecisionGateId,
  validateVoxyVisualQaCheckpoint,
  VOXY_VISUAL_QA_REGIONS,
} from "@/features/voxyVideo/visualQaCheckpoint";

const HASH = "a".repeat(64);
const HEAD = "307a2b7e7cdb15e62eefb4e9b5348817cb83a201";

function regions() {
  return VOXY_VISUAL_QA_REGIONS.map((region) => ({
    region,
    capturePath: `artifacts/${region}.png`,
    captureSha256: HASH,
    sharpnessScore: 0.5,
    haloDetected: false,
    cropped: false,
    typographyOverflow: false,
    notes: [],
  }));
}

function snapshot(format: "16:9" | "9:16" | "1:1", commitSha = HEAD) {
  return buildVoxyVisualQaSnapshot({
    format,
    assetPath: `/brands/voxy/templates/voxy-broadcast-template-${format.replace(":", "x")}.svg`,
    assetVersion: "test-v1",
    commitSha,
    fullCapturePath: `artifacts/${format}-surface.png`,
    fullCaptureSha256: HASH,
    regions: regions(),
    poses: [{ poseId: "standing_master", leftHandVisible: true, rightHandVisible: true, leftFingerCount: 5, rightFingerCount: 5 }],
  });
}

function pendingCheckpoint() {
  return buildVoxyVisualQaCheckpoint({
    snapshots: [snapshot("16:9"), snapshot("9:16"), snapshot("1:1")],
    revision: 4,
  });
}

describe("Voxy 200 percent visual QA checkpoint", () => {
  it("requires one real hashed capture set for all three 200-percent formats", () => {
    const checkpoint = pendingCheckpoint();
    const evidence = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(evidence.automatedPassed).toBe(true);
    expect(evidence.productionEligible).toBe(false);
    expect(evidence.evidenceCommitSha).toBe(HEAD);
    expect(checkpoint.snapshots.map((item) => item.zoomPercent)).toEqual([200, 200, 200]);
  });

  it("creates deterministic evidence for identical capture revisions", () => {
    expect(getVoxyVisualQaEvidenceKey(pendingCheckpoint())).toBe(getVoxyVisualQaEvidenceKey(pendingCheckpoint()));
  });

  it("accepts approval only from a persistent decision bound to exact head, revision and evidence", () => {
    const pending = pendingCheckpoint();
    const evidenceKey = getVoxyVisualQaEvidenceKey(pending);
    const decisionGateId = getVoxyVisualQaReviewDecisionGateId({
      commitSha: HEAD,
      evidenceKey,
      revision: pending.humanReview.revision,
    });
    const approved = applyPersistedVoxyVisualQaReviewDecision(pending, {
      decisionRecordId: "voxy-render-preview-review-decision:abc123",
      decisionGateId,
      decisionType: "mark_review_ready",
      persistedAt: "2026-08-07T18:00:00.000Z",
      persistedBy: "human-reviewer",
      persistenceMode: "persistent_primary",
    });
    const result = validateVoxyVisualQaCheckpoint(approved);
    expect(result.automatedPassed).toBe(true);
    expect(result.productionEligible).toBe(true);
    expect(result.reviewedCommitSha).toBe(HEAD);
    expect(result.requiredDecisionGateId).toBe(decisionGateId);
  });

  it("rejects a stale persisted decision gate", () => {
    const checkpoint = applyPersistedVoxyVisualQaReviewDecision(pendingCheckpoint(), {
      decisionRecordId: "voxy-render-preview-review-decision:stale",
      decisionGateId: "voxy-visual-qa:stale:r4:stale-evidence",
      decisionType: "mark_review_ready",
      persistedAt: "2026-08-07T18:00:00.000Z",
      persistedBy: "human-reviewer",
      persistenceMode: "persistent_primary",
    });
    const result = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(result.productionEligible).toBe(false);
    expect(checkpoint.humanReview.status).toBe("pending");
  });

  it("cannot become production eligible from metadata-only approval fields", () => {
    const checkpoint = pendingCheckpoint();
    checkpoint.humanReview.status = "approved";
    checkpoint.humanReview.reviewerId = "human-reviewer";
    checkpoint.humanReview.reviewedAt = "2026-08-07T18:00:00.000Z";
    checkpoint.humanReview.approvedCommitSha = HEAD;
    checkpoint.humanReview.approvedEvidenceKey = getVoxyVisualQaEvidenceKey(checkpoint);
    const result = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(result.productionEligible).toBe(false);
    expect(result.errors).toContain("human_review_persistence_revision_or_evidence_mismatch");
  });

  it("maps persisted revision requests and rejects without approving", () => {
    const pending = pendingCheckpoint();
    const gate = getVoxyVisualQaReviewDecisionGateId({
      commitSha: HEAD,
      evidenceKey: getVoxyVisualQaEvidenceKey(pending),
      revision: 4,
    });
    const needsChanges = applyPersistedVoxyVisualQaReviewDecision(pending, {
      decisionRecordId: "voxy-render-preview-review-decision:revision",
      decisionGateId: gate,
      decisionType: "request_revision",
      persistedAt: "2026-08-07T18:00:00.000Z",
      persistedBy: "human-reviewer",
      persistenceMode: "persistent_primary",
    });
    expect(needsChanges.humanReview.status).toBe("needs_changes");
    expect(validateVoxyVisualQaCheckpoint(needsChanges).productionEligible).toBe(false);
  });

  it("fails closed for four- or six-finger poses", () => {
    const checkpoint = pendingCheckpoint();
    checkpoint.snapshots[0].poses[0] = { ...checkpoint.snapshots[0].poses[0], leftFingerCount: 4, rightFingerCount: 6 };
    const evidence = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(evidence.errors).toContain("left_hand_finger_count_invalid:16:9:standing_master");
    expect(evidence.errors).toContain("right_hand_finger_count_invalid:16:9:standing_master");
  });

  it("fails for blur, halo, crop and typography overflow signals", () => {
    const checkpoint = pendingCheckpoint();
    const face = checkpoint.snapshots[1].regions.find((region) => region.region === "face_eyes");
    if (!face) throw new Error("face_eyes region missing");
    face.sharpnessScore = 0;
    face.haloDetected = true;
    face.cropped = true;
    face.typographyOverflow = true;
    const evidence = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(evidence.errors).toContain("visual_region_blurry:9:16:face_eyes");
    expect(evidence.errors).toContain("visual_region_halo:9:16:face_eyes");
    expect(evidence.errors).toContain("visual_region_cropped:9:16:face_eyes");
    expect(evidence.errors).toContain("visual_region_typography_overflow:9:16:face_eyes");
  });

  it("rejects mixed commit revisions", () => {
    const checkpoint = buildVoxyVisualQaCheckpoint({
      snapshots: [snapshot("16:9"), snapshot("9:16", "different-head"), snapshot("1:1")],
    });
    expect(validateVoxyVisualQaCheckpoint(checkpoint).errors).toContain("snapshot_revision_mismatch");
  });
});
