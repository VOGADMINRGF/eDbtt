import { describe, expect, it } from "vitest";
import {
  canUseVoxyDetectorForProductionEvidence,
  getVoxyDetectorLicenseStatus,
  isUsableVoxyHandDetectionEvidence,
  VOXY_VISUAL_DETECTOR_MODE,
  VOXY_VISUAL_DETECTOR_PREFERRED_CANDIDATE,
  VOXY_VISUAL_DETECTOR_SELECTED,
  VOXY_VISUAL_HAND_MINIMUM_CONFIDENCE,
  type VoxyDetectorLicenseMatrix,
} from "@/features/voxyVideo/visualDetectorLicenseContract";
import { VoxyVisualHandDetector } from "@/features/voxyVideo/voxyVisualHandDetector";

const HASH = "b".repeat(64);
const approvedMatrix: VoxyDetectorLicenseMatrix = {
  codeLicenseApproved: true,
  codeLicenseEvidence: "first-party code",
  modelWeightsLicenseApproved: true,
  modelWeightsLicenseEvidence: "not applicable: no weights",
  transitiveDependenciesApproved: true,
  transitiveDependenciesEvidence: "dependency-free detector core",
  attributionNoticesApproved: true,
  attributionNoticesEvidence: "no detector-specific third-party material",
};

function rasterHand(input: {
  uprightFingerCount: number;
  includeThumb: boolean;
  offsetX?: number;
}) {
  const width = 180;
  const height = 180;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    rgba[offset] = 2;
    rgba[offset + 1] = 7;
    rgba[offset + 2] = 24;
    rgba[offset + 3] = 255;
  }
  const drawRect = (x: number, y: number, rectWidth: number, rectHeight: number) => {
    for (let pixelY = y; pixelY < y + rectHeight; pixelY += 1) {
      for (let pixelX = x; pixelX < x + rectWidth; pixelX += 1) {
        if (pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height) {
          continue;
        }
        const offset = (pixelY * width + pixelX) * 4;
        rgba[offset] = 244;
        rgba[offset + 1] = 245;
        rgba[offset + 2] = 248;
        rgba[offset + 3] = 255;
      }
    }
  };
  const offsetX = input.offsetX ?? 0;
  for (let index = 0; index < input.uprightFingerCount; index += 1) {
    drawRect(62 + index * 17 + offsetX, 42, 13, 58);
  }
  if (input.includeThumb) drawRect(27 + offsetX, 98, 43, 14);
  if (input.uprightFingerCount > 0) drawRect(48 + offsetX, 88, 100, 60);
  return {
    width,
    height,
    rgba,
    inputPath: "fixture://local-raster-hand.png",
    inputSha256: HASH,
  };
}

function detector() {
  return new VoxyVisualHandDetector({ modelSha256: HASH });
}

describe("Voxy visual detector license contract", () => {
  it("keeps MediaPipe unshipped until model, dependency, notice and network terms are proven", () => {
    expect(VOXY_VISUAL_DETECTOR_MODE).toBe("local_self_hosted");
    expect(VOXY_VISUAL_DETECTOR_PREFERRED_CANDIDATE).toMatchObject({
      id: "mediapipe_tasks_hand_landmarker",
      frameworkLicense: "Apache-2.0",
      modelLicenseStatus: "license_review_required",
      productionEvidenceAllowed: false,
    });
    expect(VOXY_VISUAL_DETECTOR_PREFERRED_CANDIDATE.blockers).toContain(
      "concrete_hand_landmarker_task_weights_license_not_authoritatively_documented",
    );
  });

  it("selects a local dependency-free detector without model weights or network egress", () => {
    expect(VOXY_VISUAL_DETECTOR_SELECTED).toMatchObject({
      id: "voxy_raster_silhouette_hand_landmarker",
      modelKind: "weightless_algorithmic_profile",
      externalServiceRequired: false,
      runtimeNetworkRequired: false,
      productionEvidenceAllowed: true,
    });
    expect(
      getVoxyDetectorLicenseStatus(VOXY_VISUAL_DETECTOR_SELECTED.licenseMatrix),
    ).toBe("license_approved");
  });

  it("requires all four separately evidenced license dimensions", () => {
    expect(getVoxyDetectorLicenseStatus(approvedMatrix)).toBe("license_approved");
    expect(
      getVoxyDetectorLicenseStatus({
        ...approvedMatrix,
        modelWeightsLicenseApproved: false,
        modelWeightsLicenseEvidence: "missing",
      }),
    ).toBe("license_review_required");
  });

  it("requires local execution, a SHA-256 model profile and runtime version", () => {
    expect(
      canUseVoxyDetectorForProductionEvidence({
        matrix: approvedMatrix,
        localExecution: true,
        modelHash: HASH,
        runtimeVersion: "test-runtime",
      }),
    ).toBe(true);
    expect(
      canUseVoxyDetectorForProductionEvidence({
        matrix: approvedMatrix,
        localExecution: false,
        modelHash: HASH,
        runtimeVersion: "test-runtime",
      }),
    ).toBe(false);
  });

  it("derives five fingers and 21 equivalent landmarks from raster pixels", () => {
    const evidence = detector().detect({
      hand: "left",
      image: rasterHand({ uprightFingerCount: 4, includeThumb: true }),
    });
    expect(evidence.detected).toBe(true);
    expect(evidence.fingerCount).toBe(5);
    expect(evidence.landmarkCount).toBe(21);
    expect(evidence.confidence).toBeGreaterThanOrEqual(
      VOXY_VISUAL_HAND_MINIMUM_CONFIDENCE,
    );
    expect(isUsableVoxyHandDetectionEvidence(evidence)).toBe(true);
  });

  it("fails closed on a real empty raster and a cropped low-confidence raster", () => {
    const missing = detector().detect({
      hand: "left",
      image: rasterHand({ uprightFingerCount: 0, includeThumb: false }),
    });
    const cropped = detector().detect({
      hand: "left",
      image: rasterHand({
        uprightFingerCount: 4,
        includeThumb: true,
        offsetX: -55,
      }),
    });
    expect(missing).toMatchObject({ detected: false, fingerCount: null });
    expect(cropped.detected).toBe(true);
    expect(cropped.confidence).toBeLessThan(VOXY_VISUAL_HAND_MINIMUM_CONFIDENCE);
    expect(cropped.fingerCount).toBeNull();
    expect(isUsableVoxyHandDetectionEvidence(cropped)).toBe(false);
  });

  it("detects four- and six-finger raster anatomy instead of defaulting to five", () => {
    const four = detector().detect({
      hand: "left",
      image: rasterHand({ uprightFingerCount: 3, includeThumb: true }),
    });
    const six = detector().detect({
      hand: "left",
      image: rasterHand({ uprightFingerCount: 5, includeThumb: true }),
    });
    expect(four.fingerCount).toBe(4);
    expect(four.landmarkCount).toBe(17);
    expect(six.fingerCount).toBe(6);
    expect(six.landmarkCount).toBe(25);
  });

  it("rejects damaged detector or model provenance", () => {
    const evidence = detector().detect({
      hand: "left",
      image: rasterHand({ uprightFingerCount: 4, includeThumb: true }),
    });
    expect(
      isUsableVoxyHandDetectionEvidence({
        ...evidence,
        modelSha256: "missing-model-provenance",
      }),
    ).toBe(false);
    expect(
      isUsableVoxyHandDetectionEvidence({
        ...evidence,
        detectorId: "",
      }),
    ).toBe(false);
  });
});
