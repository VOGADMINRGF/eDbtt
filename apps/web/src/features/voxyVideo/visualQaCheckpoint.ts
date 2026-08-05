import type { VoxyVideoFormat } from "./modernCharacterContracts";

export const VOXY_VISUAL_QA_CHECKPOINT_VERSION =
  "voxy-visual-qa-checkpoint-v1" as const;

export const VOXY_VISUAL_QA_REGIONS = [
  "face_eyes",
  "left_hand",
  "right_hand",
  "vog_pin",
  "edebatte_pocket_mark",
  "logo_zone",
  "microphone_edge",
  "waveform",
  "lower_third",
  "caption_safe_zone",
] as const;

export type VoxyVisualQaRegion = (typeof VOXY_VISUAL_QA_REGIONS)[number];

export type VoxyVisualQaReviewStatus =
  | "pending"
  | "approved"
  | "needs_changes"
  | "rejected";

export type VoxyVisualQaRegionResult = {
  region: VoxyVisualQaRegion;
  sharpnessScore: number;
  haloDetected: boolean;
  cropped: boolean;
  typographyOverflow: boolean;
  notes: string[];
};

export type VoxyVisualQaPoseResult = {
  poseId: string;
  leftHandVisible: boolean;
  rightHandVisible: boolean;
  leftFingerCount: number | null;
  rightFingerCount: number | null;
};

export type VoxyVisualQaSnapshot = {
  format: VoxyVideoFormat;
  width: number;
  height: number;
  zoomPercent: 200;
  assetPath: string;
  assetVersion: string;
  commitSha: string;
  regions: VoxyVisualQaRegionResult[];
  poses: VoxyVisualQaPoseResult[];
  waveformBehindCharacter: boolean;
  waveformOverlapsLogo: boolean;
};

export type VoxyVisualQaCheckpoint = {
  id: string;
  version: typeof VOXY_VISUAL_QA_CHECKPOINT_VERSION;
  snapshots: VoxyVisualQaSnapshot[];
  humanReview: {
    required: true;
    status: VoxyVisualQaReviewStatus;
    reviewerId: string | null;
    reviewedAt: string | null;
    revision: number;
  };
  tolerancePolicy: {
    minimumSharpnessScore: number;
    silentToleranceIncreaseAllowed: false;
  };
  autoApprove: false;
  autoPublish: false;
};

export type VoxyVisualQaEvidence = {
  checkpointId: string;
  evidenceKey: string;
  automatedPassed: boolean;
  productionEligible: boolean;
  errors: string[];
  reviewedRevision: number | null;
};

const FORMAT_DIMENSIONS: Readonly<
  Record<VoxyVideoFormat, { width: number; height: number }>
> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
};

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildVoxyVisualQaSnapshot(input: {
  format: VoxyVideoFormat;
  assetPath: string;
  assetVersion: string;
  commitSha: string;
  regions?: VoxyVisualQaRegionResult[];
  poses?: VoxyVisualQaPoseResult[];
}): VoxyVisualQaSnapshot {
  const dimensions = FORMAT_DIMENSIONS[input.format];
  return {
    format: input.format,
    width: dimensions.width,
    height: dimensions.height,
    zoomPercent: 200,
    assetPath: input.assetPath,
    assetVersion: input.assetVersion,
    commitSha: input.commitSha,
    regions:
      input.regions ??
      VOXY_VISUAL_QA_REGIONS.map((region) => ({
        region,
        sharpnessScore: 1,
        haloDetected: false,
        cropped: false,
        typographyOverflow: false,
        notes: [],
      })),
    poses:
      input.poses ??
      [
        {
          poseId: "neutral_idle",
          leftHandVisible: true,
          rightHandVisible: true,
          leftFingerCount: 5,
          rightFingerCount: 5,
        },
      ],
    waveformBehindCharacter: true,
    waveformOverlapsLogo: false,
  };
}

export function buildVoxyVisualQaCheckpoint(input: {
  snapshots: VoxyVisualQaSnapshot[];
  reviewStatus?: VoxyVisualQaReviewStatus;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  revision?: number;
  minimumSharpnessScore?: number;
}): VoxyVisualQaCheckpoint {
  const revision = input.revision ?? 1;
  return {
    id: `voxy-visual-qa-r${revision}`,
    version: VOXY_VISUAL_QA_CHECKPOINT_VERSION,
    snapshots: input.snapshots,
    humanReview: {
      required: true,
      status: input.reviewStatus ?? "pending",
      reviewerId: input.reviewerId ?? null,
      reviewedAt: input.reviewedAt ?? null,
      revision,
    },
    tolerancePolicy: {
      minimumSharpnessScore: input.minimumSharpnessScore ?? 0.92,
      silentToleranceIncreaseAllowed: false,
    },
    autoApprove: false,
    autoPublish: false,
  };
}

export function validateVoxyVisualQaCheckpoint(
  checkpoint: VoxyVisualQaCheckpoint,
): VoxyVisualQaEvidence {
  const errors: string[] = [];

  if (checkpoint.version !== VOXY_VISUAL_QA_CHECKPOINT_VERSION) {
    errors.push("unsupported_visual_qa_checkpoint_version");
  }
  if (
    checkpoint.humanReview.required !== true ||
    checkpoint.autoApprove !== false ||
    checkpoint.autoPublish !== false
  ) {
    errors.push("human_review_contract_broken");
  }
  if (checkpoint.tolerancePolicy.silentToleranceIncreaseAllowed !== false) {
    errors.push("silent_tolerance_increase_forbidden");
  }

  const expectedFormats: VoxyVideoFormat[] = ["16:9", "9:16", "1:1"];
  for (const format of expectedFormats) {
    const matching = checkpoint.snapshots.filter(
      (snapshot) => snapshot.format === format,
    );
    if (matching.length !== 1) errors.push(`snapshot_format_missing_or_duplicate:${format}`);
  }

  for (const snapshot of checkpoint.snapshots) {
    if (snapshot.zoomPercent !== 200) {
      errors.push(`snapshot_zoom_must_be_200:${snapshot.format}`);
    }
    if (!snapshot.assetPath.startsWith("/brands/voxy/")) {
      errors.push(`snapshot_asset_path_not_canonical:${snapshot.format}`);
    }
    if (!snapshot.assetVersion.trim() || !snapshot.commitSha.trim()) {
      errors.push(`snapshot_provenance_missing:${snapshot.format}`);
    }
    const regions = new Map(snapshot.regions.map((result) => [result.region, result]));
    for (const requiredRegion of VOXY_VISUAL_QA_REGIONS) {
      const result = regions.get(requiredRegion);
      if (!result) {
        errors.push(`visual_region_missing:${snapshot.format}:${requiredRegion}`);
        continue;
      }
      if (result.sharpnessScore < checkpoint.tolerancePolicy.minimumSharpnessScore) {
        errors.push(`visual_region_blurry:${snapshot.format}:${requiredRegion}`);
      }
      if (result.haloDetected) {
        errors.push(`visual_region_halo:${snapshot.format}:${requiredRegion}`);
      }
      if (result.cropped) {
        errors.push(`visual_region_cropped:${snapshot.format}:${requiredRegion}`);
      }
      if (result.typographyOverflow) {
        errors.push(`visual_region_typography_overflow:${snapshot.format}:${requiredRegion}`);
      }
    }

    if (!snapshot.waveformBehindCharacter || snapshot.waveformOverlapsLogo) {
      errors.push(`waveform_layout_invalid:${snapshot.format}`);
    }

    for (const pose of snapshot.poses) {
      if (pose.leftHandVisible && pose.leftFingerCount !== 5) {
        errors.push(`left_hand_finger_count_invalid:${snapshot.format}:${pose.poseId}`);
      }
      if (pose.rightHandVisible && pose.rightFingerCount !== 5) {
        errors.push(`right_hand_finger_count_invalid:${snapshot.format}:${pose.poseId}`);
      }
    }
  }

  const automatedPassed = errors.length === 0;
  const humanApproved =
    checkpoint.humanReview.status === "approved" &&
    Boolean(checkpoint.humanReview.reviewerId?.trim()) &&
    Boolean(checkpoint.humanReview.reviewedAt?.trim());

  const evidenceSeed = checkpoint.snapshots
    .map(
      (snapshot) =>
        `${snapshot.format}:${snapshot.assetPath}:${snapshot.assetVersion}:${snapshot.commitSha}`,
    )
    .sort()
    .join("|");

  return {
    checkpointId: checkpoint.id,
    evidenceKey: `${checkpoint.version}:${stableHash(evidenceSeed)}`,
    automatedPassed,
    productionEligible: automatedPassed && humanApproved,
    errors,
    reviewedRevision: humanApproved ? checkpoint.humanReview.revision : null,
  };
}
