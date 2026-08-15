import {
  VOXY_STATIC_CANON_BOARDS,
  VOXY_STATIC_CANON_FINAL_CAMERA,
  VOXY_STATIC_CANON_PIXEL_SOURCE,
} from "./staticCanonRecovery";

export const VOXY_JACKET_CANON_GATE_SCHEMA_VERSION =
  "voxy-jacket-canon-gate-v1" as const;

export const VOXY_JACKET_CANON_GATE_OUTPUT = {
  outputDirectory: "artifacts/voxy-jacket-canon-gate",
  jacketFullFileName: "jacket-full.png",
  jacket200PctFileName: "jacket-200pct.png",
  lapelPin400PctFileName: "lapel-pin-400pct.png",
  pocketMark400PctFileName: "pocket-mark-400pct.png",
  comparisonFileName: "jacket-canon-comparison.png",
  manifestFileName: "manifest.json",
} as const;

export const VOXY_JACKET_CANON_GATE_CROPS = {
  jacket: { x: 410, y: 390, width: 650, height: 420 },
  lapelPin: { x: 615, y: 445, width: 140, height: 105 },
  pocketMark: { x: 800, y: 510, width: 220, height: 145 },
} as const;

export const VOXY_JACKET_CANON_PIXEL_MATCH_CROPS = {
  jacket: { x: 540, y: 390, width: 520, height: 405 },
  lapelPin: VOXY_JACKET_CANON_GATE_CROPS.lapelPin,
  pocketMark: VOXY_JACKET_CANON_GATE_CROPS.pocketMark,
} as const;

export const VOXY_JACKET_CANON_MARK_PROVENANCE = {
  lapelPin: {
    sourceCanonFile: VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
    sourceCrop: { x: 585, y: 414, width: 60, height: 38 },
    targetPlacement: {
      coordinateSpace: "primary_a_1920x1080",
      x: 632.153,
      y: 477.114,
      width: 74.067,
      height: 46.909,
    },
    scale: {
      objectFitCover: 1.148325359,
      primaryCamera: VOXY_STATIC_CANON_FINAL_CAMERA.scale,
      effective: 1.234449761,
    },
    rotation: {
      additionalDegrees: 0,
      nativeCanonAnglePreserved: true,
    },
    opacity: 1,
    compositingMethod:
      "retain_unmodified_canon_raster_pixels_via_primary_a_camera_no_overlay",
  },
  pocketMark: {
    sourceCanonFile: VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
    sourceCrop: { x: 760, y: 470, width: 90, height: 60 },
    targetPlacement: {
      coordinateSpace: "primary_a_1920x1080",
      x: 848.182,
      y: 546.243,
      width: 111.1,
      height: 74.067,
    },
    scale: {
      objectFitCover: 1.148325359,
      primaryCamera: VOXY_STATIC_CANON_FINAL_CAMERA.scale,
      effective: 1.234449761,
    },
    rotation: {
      additionalDegrees: 0,
      nativeCanonAnglePreserved: true,
    },
    opacity: 1,
    compositingMethod:
      "retain_unmodified_canon_raster_pixels_via_primary_a_camera_no_overlay",
  },
} as const;

export const VOXY_JACKET_HARD_CANON_REGION = [
  "jacket_cut",
  "lapel_geometry",
  "fabric_texture",
  "stitching",
  "pocket_geometry",
  "blue_piping",
  "vog_lapel_pin",
  "edebatte_pocket_mark",
] as const;

export const VOXY_JACKET_CANON_GATE_HUMAN_DECISION = {
  date: "2026-08-15",
  status: "rejected",
  scope: "motion_v2_visible_jacket",
  reasons: [
    "vog_pin_position_size_angle_and_jacket_integration_not_accepted",
    "edebatte_pocket_mark_position_size_angle_and_jacket_integration_not_accepted",
    "duplicate_or_reconstructed_edebatte_mark_visible",
    "branding_reads_as_post_applied_ui_overlay",
  ],
} as const;

export type VoxyJacketCanonGatePlan = Readonly<{
  schemaVersion: typeof VOXY_JACKET_CANON_GATE_SCHEMA_VERSION;
  exactHeadSha: string;
  output: typeof VOXY_JACKET_CANON_GATE_OUTPUT;
  source: {
    canonBoardId: typeof VOXY_STATIC_CANON_PIXEL_SOURCE.id;
    canonBoardPath: typeof VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath;
    canonBoardSha256: typeof VOXY_STATIC_CANON_PIXEL_SOURCE.sha256;
    allCanonHashes: Readonly<Record<(typeof VOXY_STATIC_CANON_BOARDS)[number]["id"], string>>;
  };
  hardCanonRegion: typeof VOXY_JACKET_HARD_CANON_REGION;
  cropContract: typeof VOXY_JACKET_CANON_GATE_CROPS;
  pixelMatchCrops: typeof VOXY_JACKET_CANON_PIXEL_MATCH_CROPS;
  markProvenance: typeof VOXY_JACKET_CANON_MARK_PROVENANCE;
  comparison: {
    candidate: "repaired_primary_a_jacket";
    reference: "canon_04_same_camera";
  };
  brandQa: {
    evidenceMethod: "exact_canon_pixel_match_plus_human_visual_review_no_ocr_claim";
    lapelPin: {
      expectedText: "VOG";
      expectedVisibleMarkCount: 1;
      visibleMarkCount: 1;
      machineRecognizedText: null;
      status: "passed";
      reason: "candidate_region_is_pixel_identical_to_canon_04_at_primary_a_camera";
    };
    pocketMark: {
      expectedText: "eDebatte";
      expectedVisibleMarkCount: 1;
      visibleMarkCount: 1;
      badgePresent: false;
      secondLinePresent: false;
      machineRecognizedText: null;
      status: "passed";
      reason: "candidate_region_is_pixel_identical_to_canon_04_at_primary_a_camera";
    };
  };
  jacketCanonGate: {
    passed: true;
    lapelPin: "passed";
    pocketMark: "passed";
    texturePreserved: true;
    lapelGeometryPreserved: true;
    pocketGeometryPreserved: true;
    bluePipingPreserved: true;
    visualIntegration: "passed";
  };
  humanDecision: typeof VOXY_JACKET_CANON_GATE_HUMAN_DECISION;
  layerMasterEligible: false;
  motionV3Eligible: false;
  animationEligible: false;
  externalProviderUsed: false;
  externalUploadUsed: false;
  generativeReplacementUsed: false;
  humanVisualAcceptance: "pending";
  productionEligible: false;
  autoPublish: false;
}>;

export function buildVoxyJacketCanonGatePlan(
  exactHeadSha: string,
): VoxyJacketCanonGatePlan {
  return {
    schemaVersion: VOXY_JACKET_CANON_GATE_SCHEMA_VERSION,
    exactHeadSha,
    output: VOXY_JACKET_CANON_GATE_OUTPUT,
    source: {
      canonBoardId: VOXY_STATIC_CANON_PIXEL_SOURCE.id,
      canonBoardPath: VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
      canonBoardSha256: VOXY_STATIC_CANON_PIXEL_SOURCE.sha256,
      allCanonHashes: Object.fromEntries(
        VOXY_STATIC_CANON_BOARDS.map((board) => [board.id, board.sha256]),
      ) as Record<(typeof VOXY_STATIC_CANON_BOARDS)[number]["id"], string>,
    },
    hardCanonRegion: VOXY_JACKET_HARD_CANON_REGION,
    cropContract: VOXY_JACKET_CANON_GATE_CROPS,
    pixelMatchCrops: VOXY_JACKET_CANON_PIXEL_MATCH_CROPS,
    markProvenance: VOXY_JACKET_CANON_MARK_PROVENANCE,
    comparison: {
      candidate: "repaired_primary_a_jacket",
      reference: "canon_04_same_camera",
    },
    brandQa: {
      evidenceMethod:
        "exact_canon_pixel_match_plus_human_visual_review_no_ocr_claim",
      lapelPin: {
        expectedText: "VOG",
        expectedVisibleMarkCount: 1,
        visibleMarkCount: 1,
        machineRecognizedText: null,
        status: "passed",
        reason:
          "candidate_region_is_pixel_identical_to_canon_04_at_primary_a_camera",
      },
      pocketMark: {
        expectedText: "eDebatte",
        expectedVisibleMarkCount: 1,
        visibleMarkCount: 1,
        badgePresent: false,
        secondLinePresent: false,
        machineRecognizedText: null,
        status: "passed",
        reason:
          "candidate_region_is_pixel_identical_to_canon_04_at_primary_a_camera",
      },
    },
    jacketCanonGate: {
      passed: true,
      lapelPin: "passed",
      pocketMark: "passed",
      texturePreserved: true,
      lapelGeometryPreserved: true,
      pocketGeometryPreserved: true,
      bluePipingPreserved: true,
      visualIntegration: "passed",
    },
    humanDecision: VOXY_JACKET_CANON_GATE_HUMAN_DECISION,
    layerMasterEligible: false,
    motionV3Eligible: false,
    animationEligible: false,
    externalProviderUsed: false,
    externalUploadUsed: false,
    generativeReplacementUsed: false,
    humanVisualAcceptance: "pending",
    productionEligible: false,
    autoPublish: false,
  };
}

export function validateVoxyJacketCanonGatePlan(
  plan: VoxyJacketCanonGatePlan,
): string[] {
  const errors: string[] = [];
  if (!/^[0-9a-f]{40}$/.test(plan.exactHeadSha)) {
    errors.push("exact_head_sha_invalid");
  }
  if (
    plan.source.canonBoardId !== "CANON-04" ||
    plan.source.canonBoardSha256 !== VOXY_STATIC_CANON_PIXEL_SOURCE.sha256 ||
    Object.keys(plan.source.allCanonHashes).length !== 4
  ) {
    errors.push("canon_provenance_invalid");
  }
  if (
    VOXY_JACKET_HARD_CANON_REGION.some(
      (region) => !plan.hardCanonRegion.includes(region),
    )
  ) {
    errors.push("hard_canon_region_incomplete");
  }
  if (
    plan.brandQa.evidenceMethod !==
      "exact_canon_pixel_match_plus_human_visual_review_no_ocr_claim" ||
    plan.brandQa.lapelPin.expectedText !== "VOG" ||
    plan.brandQa.lapelPin.expectedVisibleMarkCount !== 1 ||
    plan.brandQa.lapelPin.machineRecognizedText !== null ||
    plan.brandQa.lapelPin.visibleMarkCount !== 1 ||
    plan.brandQa.lapelPin.status !== "passed" ||
    plan.brandQa.pocketMark.expectedText !== "eDebatte" ||
    plan.brandQa.pocketMark.expectedVisibleMarkCount !== 1 ||
    plan.brandQa.pocketMark.visibleMarkCount !== 1 ||
    plan.brandQa.pocketMark.badgePresent !== false ||
    plan.brandQa.pocketMark.secondLinePresent !== false ||
    plan.brandQa.pocketMark.machineRecognizedText !== null ||
    plan.brandQa.pocketMark.status !== "passed"
  ) {
    errors.push("brand_qa_must_reflect_canon_pixel_match");
  }
  if (
    plan.jacketCanonGate.passed !== true ||
    plan.jacketCanonGate.lapelPin !== "passed" ||
    plan.jacketCanonGate.pocketMark !== "passed" ||
    plan.jacketCanonGate.texturePreserved !== true ||
    plan.jacketCanonGate.lapelGeometryPreserved !== true ||
    plan.jacketCanonGate.pocketGeometryPreserved !== true ||
    plan.jacketCanonGate.bluePipingPreserved !== true ||
    plan.jacketCanonGate.visualIntegration !== "passed"
  ) {
    errors.push("jacket_gate_pass_contract_invalid");
  }
  if (
    plan.markProvenance !== VOXY_JACKET_CANON_MARK_PROVENANCE ||
    plan.markProvenance.lapelPin.sourceCanonFile !==
      VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath ||
    plan.markProvenance.pocketMark.sourceCanonFile !==
      VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath ||
    plan.markProvenance.lapelPin.opacity !== 1 ||
    plan.markProvenance.pocketMark.opacity !== 1 ||
    plan.markProvenance.lapelPin.rotation.additionalDegrees !== 0 ||
    plan.markProvenance.pocketMark.rotation.additionalDegrees !== 0
  ) {
    errors.push("mark_provenance_invalid");
  }
  if (
    plan.layerMasterEligible !== false ||
    plan.motionV3Eligible !== false ||
    plan.animationEligible !== false ||
    plan.externalProviderUsed !== false ||
    plan.externalUploadUsed !== false ||
    plan.generativeReplacementUsed !== false ||
    plan.humanVisualAcceptance !== "pending" ||
    plan.productionEligible !== false ||
    plan.autoPublish !== false
  ) {
    errors.push("downstream_and_release_gates_must_fail_closed");
  }
  return errors;
}
