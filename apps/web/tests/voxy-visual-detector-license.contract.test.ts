import { describe, expect, it } from "vitest";
import {
  canUseVoxyDetectorForProductionEvidence,
  getVoxyDetectorLicenseStatus,
  isUsableVoxyHandDetectionEvidence,
  VOXY_VISUAL_DETECTOR_MODE,
  VOXY_VISUAL_DETECTOR_PREFERRED_CANDIDATE,
} from "@/features/voxyVideo/visualDetectorLicenseContract";

const approvedMatrix = {
  codeLicenseApproved: true,
  modelWeightsLicenseApproved: true,
  transitiveDependenciesApproved: true,
  attributionNoticesApproved: true,
};

describe("Voxy visual detector license contract", () => {
  it("keeps the detector path local and fail-closed by default", () => {
    expect(VOXY_VISUAL_DETECTOR_MODE).toBe("local_self_hosted");
    expect(VOXY_VISUAL_DETECTOR_PREFERRED_CANDIDATE).toMatchObject({
      id: "mediapipe_tasks_hand_landmarker",
      frameworkLicense: "Apache-2.0",
      modelLicenseStatus: "license_review_required",
      externalServiceRequired: false,
      productionEvidenceAllowed: false,
    });
  });

  it("requires all four license dimensions before approval", () => {
    expect(getVoxyDetectorLicenseStatus(approvedMatrix)).toBe("license_approved");
    expect(
      getVoxyDetectorLicenseStatus({
        ...approvedMatrix,
        modelWeightsLicenseApproved: false,
      }),
    ).toBe("license_review_required");
  });

  it("requires local execution, model hash and runtime version", () => {
    expect(
      canUseVoxyDetectorForProductionEvidence({
        matrix: approvedMatrix,
        localExecution: true,
        modelHash: "a".repeat(64),
        runtimeVersion: "test-runtime",
      }),
    ).toBe(true);

    expect(
      canUseVoxyDetectorForProductionEvidence({
        matrix: approvedMatrix,
        localExecution: false,
        modelHash: "a".repeat(64),
        runtimeVersion: "test-runtime",
      }),
    ).toBe(false);
  });

  it("requires real landmark evidence for a visible hand", () => {
    expect(
      isUsableVoxyHandDetectionEvidence({
        hand: "left",
        visible: true,
        landmarkCount: 21,
        confidence: 0.9,
        fingerCount: 5,
        detectorId: "detector-v1",
        runtimeVersion: "runtime-v1",
        modelSha256: "b".repeat(64),
      }),
    ).toBe(true);

    expect(
      isUsableVoxyHandDetectionEvidence({
        hand: "right",
        visible: true,
        landmarkCount: 20,
        confidence: 0.9,
        fingerCount: 5,
        detectorId: "detector-v1",
        runtimeVersion: "runtime-v1",
        modelSha256: "b".repeat(64),
      }),
    ).toBe(false);
  });
});
