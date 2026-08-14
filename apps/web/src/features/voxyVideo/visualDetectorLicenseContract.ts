export const VOXY_VISUAL_DETECTOR_MODE = "local_self_hosted" as const;

export const VOXY_VISUAL_DETECTOR_PREFERRED_CANDIDATE = {
  id: "mediapipe_tasks_hand_landmarker",
  frameworkLicense: "Apache-2.0",
  modelLicenseStatus: "license_review_required",
  externalServiceRequired: false,
  productionEvidenceAllowed: false,
} as const;

export type VoxyDetectorLicenseStatus =
  | "license_review_required"
  | "license_approved"
  | "license_rejected";

export type VoxyDetectorLicenseMatrix = {
  codeLicenseApproved: boolean;
  modelWeightsLicenseApproved: boolean;
  transitiveDependenciesApproved: boolean;
  attributionNoticesApproved: boolean;
};

export function getVoxyDetectorLicenseStatus(
  matrix: VoxyDetectorLicenseMatrix,
): VoxyDetectorLicenseStatus {
  return Object.values(matrix).every(Boolean)
    ? "license_approved"
    : "license_review_required";
}

export function canUseVoxyDetectorForProductionEvidence(input: {
  matrix: VoxyDetectorLicenseMatrix;
  localExecution: boolean;
  modelHash: string | null;
  runtimeVersion: string | null;
}): boolean {
  if (!input.localExecution) return false;
  if (getVoxyDetectorLicenseStatus(input.matrix) !== "license_approved") {
    return false;
  }
  if (!input.modelHash?.trim()) return false;
  if (!input.runtimeVersion?.trim()) return false;
  return true;
}

export type VoxyHandDetectionEvidence = {
  hand: "left" | "right";
  visible: boolean;
  landmarkCount: number;
  confidence: number;
  fingerCount: number | null;
  detectorId: string;
  runtimeVersion: string;
  modelSha256: string;
};

export function isUsableVoxyHandDetectionEvidence(
  evidence: VoxyHandDetectionEvidence,
): boolean {
  if (!evidence.visible) return evidence.fingerCount === null;
  if (evidence.landmarkCount !== 21) return false;
  if (evidence.confidence < 0.5) return false;
  if (!evidence.detectorId.trim()) return false;
  if (!evidence.runtimeVersion.trim()) return false;
  if (!/^[a-f0-9]{64}$/i.test(evidence.modelSha256)) return false;
  return evidence.fingerCount !== null;
}
