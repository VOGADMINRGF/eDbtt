import {
  VOXY_STATIC_CANON_BOARDS,
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
  comparison: {
    candidate: "motion_v2_current_jacket";
    reference: "canon_04_same_camera_without_reconstructed_character_marks";
  };
  brandQa: {
    evidenceMethod: "human_visual_review_plus_asset_provenance_no_ocr_claim";
    lapelPin: {
      expectedText: "VOG";
      expectedVisibleMarkCount: 1;
      visibleMarkCount: 1;
      machineRecognizedText: null;
      status: "failed";
      reason: "asset_text_is_vog_but_position_size_angle_and_integration_are_human_rejected";
    };
    pocketMark: {
      expectedText: "eDebatte";
      expectedVisibleMarkCount: 1;
      visibleMarkCount: 2;
      badgePresent: false;
      secondLinePresent: true;
      machineRecognizedText: null;
      status: "failed";
      reason: "native_overlay_and_baked_canon_mark_create_duplicate_or_second_line_visual_evidence";
    };
  };
  jacketCanonGate: {
    passed: false;
    lapelPin: "failed";
    pocketMark: "failed";
    texturePreserved: false;
    pocketGeometryPreserved: false;
    visualIntegration: "failed";
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
    comparison: {
      candidate: "motion_v2_current_jacket",
      reference: "canon_04_same_camera_without_reconstructed_character_marks",
    },
    brandQa: {
      evidenceMethod: "human_visual_review_plus_asset_provenance_no_ocr_claim",
      lapelPin: {
        expectedText: "VOG",
        expectedVisibleMarkCount: 1,
        visibleMarkCount: 1,
        machineRecognizedText: null,
        status: "failed",
        reason:
          "asset_text_is_vog_but_position_size_angle_and_integration_are_human_rejected",
      },
      pocketMark: {
        expectedText: "eDebatte",
        expectedVisibleMarkCount: 1,
        visibleMarkCount: 2,
        badgePresent: false,
        secondLinePresent: true,
        machineRecognizedText: null,
        status: "failed",
        reason:
          "native_overlay_and_baked_canon_mark_create_duplicate_or_second_line_visual_evidence",
      },
    },
    jacketCanonGate: {
      passed: false,
      lapelPin: "failed",
      pocketMark: "failed",
      texturePreserved: false,
      pocketGeometryPreserved: false,
      visualIntegration: "failed",
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
      "human_visual_review_plus_asset_provenance_no_ocr_claim" ||
    plan.brandQa.lapelPin.expectedText !== "VOG" ||
    plan.brandQa.lapelPin.expectedVisibleMarkCount !== 1 ||
    plan.brandQa.lapelPin.machineRecognizedText !== null ||
    plan.brandQa.lapelPin.status !== "failed" ||
    plan.brandQa.pocketMark.expectedText !== "eDebatte" ||
    plan.brandQa.pocketMark.expectedVisibleMarkCount !== 1 ||
    plan.brandQa.pocketMark.visibleMarkCount !== 2 ||
    plan.brandQa.pocketMark.badgePresent !== false ||
    plan.brandQa.pocketMark.secondLinePresent !== true ||
    plan.brandQa.pocketMark.machineRecognizedText !== null ||
    plan.brandQa.pocketMark.status !== "failed"
  ) {
    errors.push("brand_qa_must_reflect_rejected_visual_evidence");
  }
  if (
    plan.jacketCanonGate.passed !== false ||
    plan.jacketCanonGate.lapelPin !== "failed" ||
    plan.jacketCanonGate.pocketMark !== "failed" ||
    plan.jacketCanonGate.texturePreserved !== false ||
    plan.jacketCanonGate.pocketGeometryPreserved !== false ||
    plan.jacketCanonGate.visualIntegration !== "failed"
  ) {
    errors.push("jacket_gate_must_fail_closed");
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
