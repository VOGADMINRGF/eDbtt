import { describe, expect, it } from "vitest";
import {
  buildVoxyVisualQaCheckpoint,
  buildVoxyVisualQaSnapshot,
  validateVoxyVisualQaCheckpoint,
} from "@/features/voxyVideo/visualQaCheckpoint";

function buildApprovedCheckpoint() {
  const commitSha = "cd7672144ef195d8e85cb8c404b615c627500e41";
  return buildVoxyVisualQaCheckpoint({
    snapshots: ["16:9", "9:16", "1:1"].map((format) =>
      buildVoxyVisualQaSnapshot({
        format: format as "16:9" | "9:16" | "1:1",
        assetPath: `/brands/voxy/templates/voxy-broadcast-template-${format.replace(":", "x")}.svg`,
        assetVersion: "1.0.0",
        commitSha,
      }),
    ),
    reviewStatus: "approved",
    reviewerId: "editor-001",
    reviewedAt: "2026-08-05T20:00:00.000Z",
    revision: 3,
  });
}

describe("Voxy 200 percent visual QA checkpoint", () => {
  it("requires exactly one 200 percent snapshot for all three formats", () => {
    const checkpoint = buildApprovedCheckpoint();
    const evidence = validateVoxyVisualQaCheckpoint(checkpoint);

    expect(evidence.automatedPassed).toBe(true);
    expect(evidence.productionEligible).toBe(true);
    expect(evidence.reviewedRevision).toBe(3);
    expect(evidence.errors).toEqual([]);
    expect(checkpoint.snapshots.map((snapshot) => snapshot.zoomPercent)).toEqual([
      200,
      200,
      200,
    ]);
  });

  it("creates deterministic evidence for identical asset revisions", () => {
    const first = validateVoxyVisualQaCheckpoint(buildApprovedCheckpoint());
    const second = validateVoxyVisualQaCheckpoint(buildApprovedCheckpoint());
    expect(first.evidenceKey).toBe(second.evidenceKey);
  });

  it("fails closed for four- or six-finger poses", () => {
    const checkpoint = buildApprovedCheckpoint();
    checkpoint.snapshots[0].poses[0] = {
      ...checkpoint.snapshots[0].poses[0],
      leftFingerCount: 4,
      rightFingerCount: 6,
    };

    const evidence = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(evidence.automatedPassed).toBe(false);
    expect(evidence.errors).toContain(
      "left_hand_finger_count_invalid:16:9:neutral_idle",
    );
    expect(evidence.errors).toContain(
      "right_hand_finger_count_invalid:16:9:neutral_idle",
    );
  });

  it("fails for blur, halo, crop and typography overflow", () => {
    const checkpoint = buildApprovedCheckpoint();
    const face = checkpoint.snapshots[1].regions.find(
      (region) => region.region === "face_eyes",
    );
    if (!face) throw new Error("face_eyes region missing in fixture");
    face.sharpnessScore = 0.5;
    face.haloDetected = true;
    face.cropped = true;
    face.typographyOverflow = true;

    const evidence = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(evidence.errors).toContain("visual_region_blurry:9:16:face_eyes");
    expect(evidence.errors).toContain("visual_region_halo:9:16:face_eyes");
    expect(evidence.errors).toContain("visual_region_cropped:9:16:face_eyes");
    expect(evidence.errors).toContain(
      "visual_region_typography_overflow:9:16:face_eyes",
    );
  });

  it("rejects waveform overlap with the logo zone", () => {
    const checkpoint = buildApprovedCheckpoint();
    checkpoint.snapshots[2].waveformOverlapsLogo = true;

    expect(validateVoxyVisualQaCheckpoint(checkpoint).errors).toContain(
      "waveform_layout_invalid:1:1",
    );
  });

  it("never treats automated success as human approval", () => {
    const checkpoint = buildApprovedCheckpoint();
    checkpoint.humanReview = {
      ...checkpoint.humanReview,
      status: "pending",
      reviewerId: null,
      reviewedAt: null,
    };

    const evidence = validateVoxyVisualQaCheckpoint(checkpoint);
    expect(evidence.automatedPassed).toBe(true);
    expect(evidence.productionEligible).toBe(false);
    expect(evidence.reviewedRevision).toBeNull();
  });

  it("requires every defined review crop", () => {
    const checkpoint = buildApprovedCheckpoint();
    checkpoint.snapshots[0].regions = checkpoint.snapshots[0].regions.filter(
      (region) => region.region !== "vog_pin",
    );

    expect(validateVoxyVisualQaCheckpoint(checkpoint).errors).toContain(
      "visual_region_missing:16:9:vog_pin",
    );
  });
});
