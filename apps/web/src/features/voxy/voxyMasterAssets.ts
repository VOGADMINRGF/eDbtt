import type { VoxyVideoFormat } from "@/features/voxyVideo/modernCharacterContracts";

export const VOXY_MASTER_BASE_PATH = "/brands/voxy" as const;
export const VOXY_MASTER_MANIFEST_PATH = `${VOXY_MASTER_BASE_PATH}/manifest.json` as const;
export const VOXY_LEGACY_BASE_PATH = "/brand/voxy" as const;

export const VOXY_MASTER_QUALITY_PROFILES = {
  review: {
    fps: 24,
    dimensions: {
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 720, height: 1280 },
      "1:1": { width: 1080, height: 1080 },
    },
  },
  production: {
    fps: 30,
    dimensions: {
      "16:9": { width: 3840, height: 2160 },
      "9:16": { width: 2160, height: 3840 },
      "1:1": { width: 2160, height: 2160 },
    },
  },
  marketing8k: {
    fps: 30,
    dimensions: {
      "16:9": { width: 7680, height: 4320 },
      "9:16": { width: 4320, height: 7680 },
      "1:1": { width: 4320, height: 4320 },
    },
  },
} as const;

export type VoxyMasterQualityProfile = keyof typeof VOXY_MASTER_QUALITY_PROFILES;

export const VOXY_MASTER_ASSETS = {
  characters: {
    sitting: `${VOXY_MASTER_BASE_PATH}/characters/voxy-sitting-master.svg`,
    standing: `${VOXY_MASTER_BASE_PATH}/characters/voxy-standing-master.svg`,
    gesturing: `${VOXY_MASTER_BASE_PATH}/characters/voxy-gesturing-master.svg`,
  },
  studio: {
    "16:9": `${VOXY_MASTER_BASE_PATH}/studio/voxy-studio-background-16x9.svg`,
    "9:16": `${VOXY_MASTER_BASE_PATH}/studio/voxy-studio-background-9x16.svg`,
    "1:1": `${VOXY_MASTER_BASE_PATH}/studio/voxy-studio-background-1x1.svg`,
  },
  marketing: {
    "16:9": `${VOXY_MASTER_BASE_PATH}/marketing/voxy-studio-marketing-master-16x9.svg`,
    "9:16": `${VOXY_MASTER_BASE_PATH}/marketing/voxy-studio-marketing-master-9x16.svg`,
    "1:1": `${VOXY_MASTER_BASE_PATH}/marketing/voxy-studio-marketing-master-1x1.svg`,
  },
  templates: {
    "16:9": `${VOXY_MASTER_BASE_PATH}/templates/voxy-broadcast-template-16x9.svg`,
    "9:16": `${VOXY_MASTER_BASE_PATH}/templates/voxy-broadcast-template-9x16.svg`,
    "1:1": `${VOXY_MASTER_BASE_PATH}/templates/voxy-broadcast-template-1x1.svg`,
  },
  overlays: {
    vogPin: `${VOXY_MASTER_BASE_PATH}/overlays/vog-pin.svg`,
    edebattePocketMark: `${VOXY_MASTER_BASE_PATH}/overlays/edebatte-pocket-mark.svg`,
    voxyWordmark: `${VOXY_MASTER_BASE_PATH}/overlays/voxy-wordmark.svg`,
    jarvisWaveform: `${VOXY_MASTER_BASE_PATH}/overlays/jarvis-waveform.svg`,
  },
} as const;

export const VOXY_MASTER_GUARDRAILS = {
  exactVisibleFingerCountPerHand: 5,
  vogPinRequired: true,
  edebattePocketMarkRequired: true,
  waveformBehindCharacter: true,
  waveformMayOverlapLogo: false,
  dynamicTextBakedIntoCharacterAsset: false,
  lipSyncRequired: false,
  reviewRequired: true,
  autoPublish: false,
} as const;

export function resolveVoxyMasterDimensions(
  format: VoxyVideoFormat,
  profile: VoxyMasterQualityProfile = "production",
): { width: number; height: number; fps: number } {
  const selected = VOXY_MASTER_QUALITY_PROFILES[profile];
  return {
    ...selected.dimensions[format],
    fps: selected.fps,
  };
}

export function resolveVoxyStudioAsset(format: VoxyVideoFormat): string {
  return VOXY_MASTER_ASSETS.studio[format];
}

export function resolveVoxyMarketingAsset(format: VoxyVideoFormat): string {
  return VOXY_MASTER_ASSETS.marketing[format];
}

export function resolveVoxyBroadcastTemplate(format: VoxyVideoFormat): string {
  return VOXY_MASTER_ASSETS.templates[format];
}
