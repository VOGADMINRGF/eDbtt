import {
  VOXY_CHARACTER_EXPRESSIONS,
  VOXY_CHARACTER_MOTIONS,
  type VoxyCharacterExpression,
  type VoxyCharacterMotion,
  type VoxyVideoFormat,
} from "./modernCharacterContracts";
import {
  VOXY_MASTER_ASSETS,
  resolveVoxyBroadcastTemplate,
  resolveVoxyStudioAsset,
} from "@/features/voxy/voxyMasterAssets";

export const VOXY_CHARACTER_MOTION_FIXTURE_VERSION =
  "voxy-character-motion-fixture-v2" as const;

export const VOXY_CHARACTER_MOTION_FIXTURE_SCENE_KINDS = [
  "opening",
  "source_update",
  "contrast",
  "open_question",
  "closing",
] as const;

export type VoxyCharacterMotionFixtureSceneKind =
  (typeof VOXY_CHARACTER_MOTION_FIXTURE_SCENE_KINDS)[number];

export type VoxyCharacterMotionFixtureScene = {
  id: string;
  kind: VoxyCharacterMotionFixtureSceneKind;
  startMs: number;
  endMs: number;
  motion: VoxyCharacterMotion;
  expression: VoxyCharacterExpression;
  kicker: string;
  headline: string;
  detail: string;
  sourceIds: string[];
};

export type VoxyCharacterMotionFixturePlan = {
  id: string;
  version: typeof VOXY_CHARACTER_MOTION_FIXTURE_VERSION;
  title: string;
  format: VoxyVideoFormat;
  width: number;
  height: number;
  fps: 24;
  durationMs: number;
  locale: string;
  originalLanguage: string;
  outputLanguage: string;
  studioAssetPath: string;
  characterAssetPath: string;
  templateAssetPath: string;
  sourceDisclosure: string;
  mascotDisclosure: "Voxy ist eine digitale Moderatorfigur.";
  editorialMode: "facts_updates_only";
  politicalInterpretationAllowed: false;
  recommendationsAllowed: false;
  reviewRequired: true;
  autoPublish: false;
  lipSync: false;
  anatomyContract: {
    visibleFingerCountPerHand: 5;
    vogPinRequired: true;
    edebattePocketMarkRequired: true;
  };
  waveformContract: {
    canonicalAssetPath: string;
    position: "behind_character";
    mayOverlapLogo: false;
  };
  scenes: VoxyCharacterMotionFixtureScene[];
};

export type VoxyCharacterMotionFixtureValidation = {
  ok: boolean;
  errors: string[];
};

const FORMAT_DIMENSIONS: Readonly<
  Record<VoxyVideoFormat, { width: number; height: number }>
> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
};

export function getVoxyFixtureDimensions(
  format: VoxyVideoFormat,
): { width: number; height: number } {
  return { ...FORMAT_DIMENSIONS[format] };
}

export function buildVoxyCharacterMotionFixturePlan(
  format: VoxyVideoFormat = "16:9",
): VoxyCharacterMotionFixturePlan {
  const { width, height } = getVoxyFixtureDimensions(format);

  return {
    id: `voxy-character-motion-fixture-${format.replace(":", "x")}-v2`,
    version: VOXY_CHARACTER_MOTION_FIXTURE_VERSION,
    title: "Voxy Kurzupdate · Character Motion Fixture",
    format,
    width,
    height,
    fps: 24,
    durationMs: 8_000,
    locale: "de-DE",
    originalLanguage: "de",
    outputLanguage: "de",
    studioAssetPath: resolveVoxyStudioAsset(format),
    characterAssetPath: VOXY_MASTER_ASSETS.characters.sitting,
    templateAssetPath: resolveVoxyBroadcastTemplate(format),
    sourceDisclosure: "Quellenstand: redaktionell zu prüfen · Fixture-Daten",
    mascotDisclosure: "Voxy ist eine digitale Moderatorfigur.",
    editorialMode: "facts_updates_only",
    politicalInterpretationAllowed: false,
    recommendationsAllowed: false,
    reviewRequired: true,
    autoPublish: false,
    lipSync: false,
    anatomyContract: {
      visibleFingerCountPerHand: 5,
      vogPinRequired: true,
      edebattePocketMarkRequired: true,
    },
    waveformContract: {
      canonicalAssetPath: VOXY_MASTER_ASSETS.overlays.jarvisWaveform,
      position: "behind_character",
      mayOverlapLogo: false,
    },
    scenes: [
      { id: "opening", kind: "opening", startMs: 0, endMs: 1_500, motion: "neutral_idle", expression: "attentive", kicker: "KURZUPDATE", headline: "Was hat sich verändert?", detail: "Fakten, Quellen und offene Punkte – ohne politische Wertung.", sourceIds: [] },
      { id: "source-update", kind: "source_update", startMs: 1_500, endMs: 3_200, motion: "highlighting_source", expression: "serious", kicker: "QUELLENSTAND", headline: "Was ist neu belegt?", detail: "Drei Primärquellen wurden im Fixture zusammengeführt.", sourceIds: ["fixture-source-1", "fixture-source-2", "fixture-source-3"] },
      { id: "contrast", kind: "contrast", startMs: 3_200, endMs: 4_700, motion: "showing_contrast", expression: "thoughtful", kicker: "GEGENPOSITION", headline: "Welche Einordnung widerspricht?", detail: "Eine belastbare Gegenposition bleibt sichtbar.", sourceIds: ["fixture-counter-source-1"] },
      { id: "open-question", kind: "open_question", startMs: 4_700, endMs: 6_300, motion: "questioning", expression: "thoughtful", kicker: "OFFENE FRAGE", headline: "Was ist noch ungeklärt?", detail: "Unsicherheit wird benannt statt mit Interpretation gefüllt.", sourceIds: [] },
      { id: "closing", kind: "closing", startMs: 6_300, endMs: 8_000, motion: "inviting_participation", expression: "friendly", kicker: "VOXY", headline: "Spricht über Quellen – nicht über Lippen.", detail: "Keine Veröffentlichung ohne redaktionelle Freigabe.", sourceIds: [] },
    ],
  };
}

export function validateVoxyCharacterMotionFixturePlan(
  plan: VoxyCharacterMotionFixturePlan,
): VoxyCharacterMotionFixtureValidation {
  const errors: string[] = [];

  if (plan.version !== VOXY_CHARACTER_MOTION_FIXTURE_VERSION) errors.push("unsupported_fixture_version");
  if (plan.durationMs < 3_000 || plan.durationMs > 30_000) errors.push("fixture_duration_out_of_range");
  if (plan.fps !== 24) errors.push("fixture_fps_must_be_24");
  if (plan.reviewRequired !== true || plan.autoPublish !== false) errors.push("review_first_contract_broken");
  if (plan.lipSync !== false) errors.push("lip_sync_must_remain_disabled");
  if (plan.editorialMode !== "facts_updates_only" || plan.politicalInterpretationAllowed !== false || plan.recommendationsAllowed !== false) errors.push("editorial_neutrality_contract_broken");
  if (!plan.sourceDisclosure.trim()) errors.push("source_disclosure_missing");
  if (!plan.studioAssetPath.startsWith("/brands/voxy/")) errors.push("studio_asset_must_use_canonical_master_path");
  if (!plan.characterAssetPath.startsWith("/brands/voxy/")) errors.push("character_asset_must_use_canonical_master_path");
  if (plan.anatomyContract.visibleFingerCountPerHand !== 5) errors.push("five_finger_anatomy_contract_broken");
  if (plan.anatomyContract.vogPinRequired !== true || plan.anatomyContract.edebattePocketMarkRequired !== true) errors.push("character_brand_detail_contract_broken");
  if (plan.waveformContract.position !== "behind_character" || plan.waveformContract.mayOverlapLogo !== false) errors.push("waveform_layout_contract_broken");
  if (plan.scenes.length === 0) errors.push("fixture_scenes_missing");

  let expectedStart = 0;
  const sceneIds = new Set<string>();
  for (const scene of plan.scenes) {
    if (!scene.id.trim() || sceneIds.has(scene.id)) errors.push("scene_id_invalid_or_duplicate");
    sceneIds.add(scene.id);
    if (scene.startMs !== expectedStart) errors.push(`scene_timeline_gap_or_overlap:${scene.id}`);
    if (scene.endMs <= scene.startMs) errors.push(`scene_duration_invalid:${scene.id}`);
    if (!VOXY_CHARACTER_MOTIONS.includes(scene.motion)) errors.push(`scene_motion_invalid:${scene.id}`);
    if (!VOXY_CHARACTER_EXPRESSIONS.includes(scene.expression)) errors.push(`scene_expression_invalid:${scene.id}`);
    if (scene.kind === "source_update" && scene.sourceIds.length === 0) errors.push("source_update_requires_sources");
    if (scene.kind === "contrast" && scene.sourceIds.length === 0) errors.push("contrast_requires_source");
    expectedStart = scene.endMs;
  }

  if (expectedStart !== plan.durationMs) errors.push("fixture_timeline_does_not_match_duration");
  return { ok: errors.length === 0, errors };
}
