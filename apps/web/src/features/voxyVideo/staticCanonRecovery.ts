export const VOXY_STATIC_CANON_RECOVERY_SCHEMA_VERSION =
  "voxy-static-canon-recovery-v1" as const;

export const VOXY_REJECTED_MOTION_HEAD =
  "7f0ad050e4079b823c3bb6c7b2ef5fc991b662cb" as const;

export const VOXY_STATIC_CANON_BOARDS = [
  {
    id: "CANON-01",
    repositoryPath:
      "apps/web/public/brands/voxy/references/canon/CANON-01-character-development-board.png",
    sha256: "e58f4f5a6b23d8da6ccd81d979057f1b6f8ce8ae22eeba7032a2fb417a2c8bcc",
    width: 1491,
    height: 1055,
    role: "character_development",
  },
  {
    id: "CANON-02",
    repositoryPath:
      "apps/web/public/brands/voxy/references/canon/CANON-02-character-overview-board.png",
    sha256: "e881e2c0e698f70eeb71ed78a021c5ef6bab8d37d52277e00a08e2f7ed9a8fe7",
    width: 1672,
    height: 941,
    role: "character_overview",
  },
  {
    id: "CANON-03",
    repositoryPath:
      "apps/web/public/brands/voxy/references/canon/CANON-03-broadcast-layout-teal.png",
    sha256: "479caf603da577009318beda49b4e0dc61f79c70e6bdb9fed820d448767aaded",
    width: 1672,
    height: 941,
    role: "broadcast_layout_teal",
  },
  {
    id: "CANON-04",
    repositoryPath:
      "apps/web/public/brands/voxy/references/canon/CANON-04-broadcast-layout-blue.png",
    sha256: "8ec3927f2871b210f46468f56a2845811c89dbb971c11bf086de7446ac0efff8",
    width: 1672,
    height: 941,
    role: "broadcast_layout_blue",
  },
] as const;

export const VOXY_STATIC_CANON_PIXEL_SOURCE =
  VOXY_STATIC_CANON_BOARDS[3];

export const VOXY_STATIC_CANON_NATIVE_ASSETS = {
  wordmark:
    "apps/web/public/brands/voxy/overlays/voxy-wordmark.svg",
} as const;

export type VoxyStaticCanonCandidateId =
  | "candidate-a-canon"
  | "candidate-b-broadcast"
  | "candidate-c-editorial";

export type VoxyStaticCanonCandidate = Readonly<{
  id: VoxyStaticCanonCandidateId;
  fileName: `${VoxyStaticCanonCandidateId}.png`;
  mode: "canon_fidelity" | "broadcast" | "editorial";
  label: string;
  camera: Readonly<{
    scale: number;
    translateX: number;
    translateY: number;
  }>;
  rightPanelWidth: number;
  characterPixelSource: typeof VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath;
  knownDeviations: readonly string[];
}>;

export const VOXY_STATIC_CANON_CANDIDATES = [
  {
    id: "candidate-a-canon",
    fileName: "candidate-a-canon.png",
    mode: "canon_fidelity",
    label: "A · CANON FIDELITY",
    camera: { scale: 1, translateX: 0, translateY: 0 },
    rightPanelWidth: 550,
    characterPixelSource: VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
    knownDeviations: [
      "flattened_canon_board_source_not_layered_3d_scene",
      "generated_board_typography_covered_by_native_review_zones",
    ],
  },
  {
    id: "candidate-b-broadcast",
    fileName: "candidate-b-broadcast.png",
    mode: "broadcast",
    label: "B · BROADCAST",
    camera: { scale: 1.035, translateX: -18, translateY: 5 },
    rightPanelWidth: 500,
    characterPixelSource: VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
    knownDeviations: [
      "camera_crop_tighter_than_canon_04",
      "broadcast_status_graphics_are_native_review_placeholders",
    ],
  },
  {
    id: "candidate-c-editorial",
    fileName: "candidate-c-editorial.png",
    mode: "editorial",
    label: "C · EDITORIAL",
    camera: { scale: 1.02, translateX: -72, translateY: 2 },
    rightPanelWidth: 690,
    characterPixelSource: VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
    knownDeviations: [
      "camera_shift_creates_larger_native_editorial_content_zone",
      "editorial_fields_are_empty_review_zones_not_final_copy",
    ],
  },
] as const satisfies readonly VoxyStaticCanonCandidate[];

export type VoxyStaticCanonRecoveryPlan = {
  schemaVersion: typeof VOXY_STATIC_CANON_RECOVERY_SCHEMA_VERSION;
  exactHeadSha: string;
  output: {
    width: 1920;
    height: 1080;
    comparisonWidth: 3200;
    comparisonHeight: 1800;
  };
  canonBoards: typeof VOXY_STATIC_CANON_BOARDS;
  candidates: typeof VOXY_STATIC_CANON_CANDIDATES;
  productionMethod: "local_playwright_raster_composition_over_canon_board";
  previousMotion: {
    exactHeadSha: typeof VOXY_REJECTED_MOTION_HEAD;
    humanVisualAcceptance: "rejected";
    usedAsVisualSource: false;
  };
  externalProviderUsed: false;
  externalUploadUsed: false;
  generativeRedrawUsed: false;
  humanVisualAcceptance: "pending";
  animationEligible: false;
  productionEligible: false;
  autoPublish: false;
};

export function buildVoxyStaticCanonRecoveryPlan(
  exactHeadSha: string,
): VoxyStaticCanonRecoveryPlan {
  return {
    schemaVersion: VOXY_STATIC_CANON_RECOVERY_SCHEMA_VERSION,
    exactHeadSha,
    output: {
      width: 1920,
      height: 1080,
      comparisonWidth: 3200,
      comparisonHeight: 1800,
    },
    canonBoards: VOXY_STATIC_CANON_BOARDS,
    candidates: VOXY_STATIC_CANON_CANDIDATES,
    productionMethod: "local_playwright_raster_composition_over_canon_board",
    previousMotion: {
      exactHeadSha: VOXY_REJECTED_MOTION_HEAD,
      humanVisualAcceptance: "rejected",
      usedAsVisualSource: false,
    },
    externalProviderUsed: false,
    externalUploadUsed: false,
    generativeRedrawUsed: false,
    humanVisualAcceptance: "pending",
    animationEligible: false,
    productionEligible: false,
    autoPublish: false,
  };
}

export function validateVoxyStaticCanonRecoveryPlan(
  plan: VoxyStaticCanonRecoveryPlan,
): string[] {
  const errors: string[] = [];
  if (!/^[0-9a-f]{40}$/.test(plan.exactHeadSha)) {
    errors.push("exact_head_sha_invalid");
  }
  if (plan.canonBoards.length !== 4) {
    errors.push("four_canon_boards_required");
  }
  if (
    plan.candidates.map((candidate) => candidate.fileName).join(",") !==
    "candidate-a-canon.png,candidate-b-broadcast.png,candidate-c-editorial.png"
  ) {
    errors.push("candidate_output_contract_invalid");
  }
  if (
    plan.candidates.some(
      (candidate) =>
        candidate.characterPixelSource !==
        VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
    )
  ) {
    errors.push("candidate_character_source_must_be_identical");
  }
  if (
    plan.previousMotion.humanVisualAcceptance !== "rejected" ||
    plan.previousMotion.usedAsVisualSource !== false
  ) {
    errors.push("rejected_motion_must_not_be_visual_source");
  }
  if (
    plan.externalProviderUsed !== false ||
    plan.externalUploadUsed !== false ||
    plan.generativeRedrawUsed !== false
  ) {
    errors.push("local_non_generative_contract_broken");
  }
  if (
    plan.humanVisualAcceptance !== "pending" ||
    plan.animationEligible !== false ||
    plan.productionEligible !== false ||
    plan.autoPublish !== false
  ) {
    errors.push("human_and_production_gates_must_fail_closed");
  }
  return errors;
}
