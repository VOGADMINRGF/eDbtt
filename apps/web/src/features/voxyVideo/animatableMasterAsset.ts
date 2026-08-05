import type {
  VoxyCharacterMotion,
  VoxyVideoFormat,
} from "./modernCharacterContracts";

export const VOXY_ANIMATABLE_MASTER_VERSION =
  "voxy-animatable-master-v1" as const;

export const VOXY_MASTER_LAYER_IDS = [
  "studio-background",
  "studio-screens",
  "jarvis-waveform",
  "desk",
  "microphone",
  "body",
  "left-arm",
  "right-arm",
  "left-hand-five-fingers",
  "right-hand-five-fingers",
  "head",
  "left-eye",
  "right-eye",
  "left-eyelid",
  "right-eyelid",
  "left-brow",
  "right-brow",
  "mouth-neutral",
  "headphones",
  "vog-pin",
  "edebatte-pocket",
  "character-shadow",
  "logo-zone",
] as const;

export type VoxyMasterLayerId = (typeof VOXY_MASTER_LAYER_IDS)[number];

export type VoxyMasterTheme = "edebatte" | "vog_member";

export type VoxyMasterPivot = {
  x: number;
  y: number;
};

export type VoxyMasterLayer = {
  id: VoxyMasterLayerId;
  kind:
    | "background"
    | "signal"
    | "foreground"
    | "prop"
    | "character"
    | "anatomy"
    | "expression"
    | "branding"
    | "shadow";
  sourcePath: string;
  zIndex: number;
  independent: true;
  pivot: VoxyMasterPivot | null;
  digitCount: 5 | null;
  required: true;
};

export type VoxyAnimatableMasterAsset = {
  id: string;
  version: typeof VOXY_ANIMATABLE_MASTER_VERSION;
  canvas: {
    width: 1600;
    height: 1600;
    coordinateSystem: "svg_viewbox_top_left";
  };
  theme: VoxyMasterTheme;
  colors: {
    primary: string;
    accent: string;
    jacket: string;
  };
  layers: VoxyMasterLayer[];
  motionLimits: {
    headRotationDegrees: { min: -4; max: 4 };
    bodyRotationDegrees: { min: -2; max: 2 };
    headTranslationPercent: { min: -1.5; max: 1.5 };
    armRotationDegrees: { min: -18; max: 18 };
    blinkDurationMs: { min: 90; max: 180 };
    cameraScale: { min: 1; max: 1.06 };
  };
  cropSafeFormats: VoxyVideoFormat[];
  lipSync: false;
  visemes: false;
  humanApprovalRequired: true;
};

export type VoxyMasterLayerTransform = {
  layerId: VoxyMasterLayerId;
  rotateDegrees: number;
  translateXPercent: number;
  translateYPercent: number;
  scale: number;
  opacity: number;
};

export type VoxyMasterMotionFrame = {
  motion: VoxyCharacterMotion;
  timeMs: number;
  transforms: VoxyMasterLayerTransform[];
  blinkDurationMs: number | null;
};

export type VoxyAnimatableMasterValidation = {
  ok: boolean;
  errors: string[];
};

const THEME_COLORS: Readonly<
  Record<VoxyMasterTheme, VoxyAnimatableMasterAsset["colors"]>
> = {
  edebatte: {
    primary: "#0B5FFF",
    accent: "#57B8FF",
    jacket: "#0A2A66",
  },
  vog_member: {
    primary: "#16D7C7",
    accent: "#2A7CFF",
    jacket: "linear-gradient(135deg,#16D7C7 0%,#2A7CFF 100%)",
  },
};

const PIVOTS: Partial<Record<VoxyMasterLayerId, VoxyMasterPivot>> = {
  body: { x: 800, y: 1120 },
  "left-arm": { x: 520, y: 980 },
  "right-arm": { x: 1080, y: 980 },
  "left-hand-five-fingers": { x: 620, y: 1410 },
  "right-hand-five-fingers": { x: 980, y: 1410 },
  head: { x: 800, y: 680 },
  "left-eye": { x: 748, y: 650 },
  "right-eye": { x: 852, y: 650 },
  "left-eyelid": { x: 748, y: 650 },
  "right-eyelid": { x: 852, y: 650 },
  "left-brow": { x: 748, y: 610 },
  "right-brow": { x: 852, y: 610 },
  "mouth-neutral": { x: 800, y: 760 },
};

const LAYER_KINDS: Record<VoxyMasterLayerId, VoxyMasterLayer["kind"]> = {
  "studio-background": "background",
  "studio-screens": "background",
  "jarvis-waveform": "signal",
  desk: "foreground",
  microphone: "prop",
  body: "character",
  "left-arm": "character",
  "right-arm": "character",
  "left-hand-five-fingers": "anatomy",
  "right-hand-five-fingers": "anatomy",
  head: "character",
  "left-eye": "expression",
  "right-eye": "expression",
  "left-eyelid": "expression",
  "right-eyelid": "expression",
  "left-brow": "expression",
  "right-brow": "expression",
  "mouth-neutral": "expression",
  headphones: "prop",
  "vog-pin": "branding",
  "edebatte-pocket": "branding",
  "character-shadow": "shadow",
  "logo-zone": "branding",
};

function canonicalLayerPath(id: VoxyMasterLayerId): string {
  return `/brands/voxy/rig/layers/${id}.svg`;
}

export function buildVoxyAnimatableMasterAsset(
  theme: VoxyMasterTheme,
): VoxyAnimatableMasterAsset {
  return {
    id: `voxy-layered-master-${theme}-v1`,
    version: VOXY_ANIMATABLE_MASTER_VERSION,
    canvas: {
      width: 1600,
      height: 1600,
      coordinateSystem: "svg_viewbox_top_left",
    },
    theme,
    colors: { ...THEME_COLORS[theme] },
    layers: VOXY_MASTER_LAYER_IDS.map((id, index) => ({
      id,
      kind: LAYER_KINDS[id],
      sourcePath: canonicalLayerPath(id),
      zIndex: index,
      independent: true,
      pivot: PIVOTS[id] ? { ...PIVOTS[id] } : null,
      digitCount:
        id === "left-hand-five-fingers" || id === "right-hand-five-fingers"
          ? 5
          : null,
      required: true,
    })),
    motionLimits: {
      headRotationDegrees: { min: -4, max: 4 },
      bodyRotationDegrees: { min: -2, max: 2 },
      headTranslationPercent: { min: -1.5, max: 1.5 },
      armRotationDegrees: { min: -18, max: 18 },
      blinkDurationMs: { min: 90, max: 180 },
      cameraScale: { min: 1, max: 1.06 },
    },
    cropSafeFormats: ["16:9", "9:16", "1:1"],
    lipSync: false,
    visemes: false,
    humanApprovalRequired: true,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildVoxyMasterMotionFrame(input: {
  master: VoxyAnimatableMasterAsset;
  motion: VoxyCharacterMotion;
  timeMs: number;
}): VoxyMasterMotionFrame {
  const phase = (Math.max(0, input.timeMs) % 2_000) / 2_000;
  const wave = Math.sin(phase * Math.PI * 2);
  const motionStrength =
    input.motion === "neutral_idle" || input.motion === "listening" ? 0.35 : 1;
  const headRotation = clamp(
    wave * 3 * motionStrength,
    input.master.motionLimits.headRotationDegrees.min,
    input.master.motionLimits.headRotationDegrees.max,
  );
  const armRotation = clamp(
    wave * 14 * motionStrength,
    input.master.motionLimits.armRotationDegrees.min,
    input.master.motionLimits.armRotationDegrees.max,
  );

  const transforms: VoxyMasterLayerTransform[] = [
    {
      layerId: "head",
      rotateDegrees: headRotation,
      translateXPercent: clamp(
        wave * 0.8,
        input.master.motionLimits.headTranslationPercent.min,
        input.master.motionLimits.headTranslationPercent.max,
      ),
      translateYPercent: 0,
      scale: 1,
      opacity: 1,
    },
    {
      layerId: "left-arm",
      rotateDegrees: input.motion === "highlighting_source" ? -armRotation : armRotation / 2,
      translateXPercent: 0,
      translateYPercent: 0,
      scale: 1,
      opacity: 1,
    },
    {
      layerId: "right-arm",
      rotateDegrees: input.motion === "showing_contrast" ? -armRotation : armRotation,
      translateXPercent: 0,
      translateYPercent: 0,
      scale: 1,
      opacity: 1,
    },
    {
      layerId: "left-eyelid",
      rotateDegrees: 0,
      translateXPercent: 0,
      translateYPercent: 0,
      scale: 1,
      opacity: phase > 0.48 && phase < 0.56 ? 1 : 0,
    },
    {
      layerId: "right-eyelid",
      rotateDegrees: 0,
      translateXPercent: 0,
      translateYPercent: 0,
      scale: 1,
      opacity: phase > 0.48 && phase < 0.56 ? 1 : 0,
    },
  ];

  return {
    motion: input.motion,
    timeMs: Math.max(0, input.timeMs),
    transforms,
    blinkDurationMs:
      phase > 0.48 && phase < 0.56
        ? input.master.motionLimits.blinkDurationMs.min
        : null,
  };
}

export function validateVoxyAnimatableMasterAsset(
  master: VoxyAnimatableMasterAsset,
): VoxyAnimatableMasterValidation {
  const errors: string[] = [];

  if (master.version !== VOXY_ANIMATABLE_MASTER_VERSION) {
    errors.push("unsupported_animatable_master_version");
  }
  if (master.lipSync !== false || master.visemes !== false) {
    errors.push("lip_sync_and_visemes_must_remain_disabled");
  }
  if (master.humanApprovalRequired !== true) {
    errors.push("human_approval_required");
  }
  if (master.cropSafeFormats.join("|") !== "16:9|9:16|1:1") {
    errors.push("crop_safe_formats_incomplete");
  }
  const layerIds = new Set<VoxyMasterLayerId>();
  for (const layer of master.layers) {
    if (layerIds.has(layer.id)) errors.push(`duplicate_layer:${layer.id}`);
    layerIds.add(layer.id);
    if (layer.independent !== true || layer.required !== true) {
      errors.push(`layer_not_independent_or_required:${layer.id}`);
    }
    if (!layer.sourcePath.startsWith("/brands/voxy/rig/layers/")) {
      errors.push(`layer_path_not_canonical:${layer.id}`);
    }
    if (
      (layer.kind === "character" ||
        layer.kind === "anatomy" ||
        layer.kind === "expression") &&
      layer.pivot === null
    ) {
      errors.push(`pivot_missing:${layer.id}`);
    }
    if (layer.kind === "anatomy" && layer.digitCount !== 5) {
      errors.push(`five_finger_contract_broken:${layer.id}`);
    }
  }

  for (const requiredLayer of VOXY_MASTER_LAYER_IDS) {
    if (!layerIds.has(requiredLayer)) errors.push(`required_layer_missing:${requiredLayer}`);
  }

  const waveform = master.layers.find((layer) => layer.id === "jarvis-waveform");
  const body = master.layers.find((layer) => layer.id === "body");
  const logo = master.layers.find((layer) => layer.id === "logo-zone");
  if (!waveform || !body || waveform.zIndex >= body.zIndex) {
    errors.push("waveform_must_remain_behind_character");
  }
  if (!logo || logo.sourcePath === waveform?.sourcePath) {
    errors.push("waveform_and_logo_must_be_separate_layers");
  }
  if (master.theme === "edebatte" && master.colors.primary !== "#0B5FFF") {
    errors.push("edebatte_theme_primary_invalid");
  }
  if (
    master.theme === "vog_member" &&
    (!master.colors.jacket.includes("#16D7C7") ||
      !master.colors.jacket.includes("#2A7CFF"))
  ) {
    errors.push("vog_member_gradient_invalid");
  }

  return { ok: errors.length === 0, errors };
}
