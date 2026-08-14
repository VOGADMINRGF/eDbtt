export const VOXY_SELF_HOSTED_MOTION_STRATEGY = {
  id: "voxy-self-hosted-motion-v1",
  executionMode: "self_hosted",
  primaryRigEngine: "stretchy_studio_compatible",
  externalUploadAllowed: false,
  commercialSaasDefault: "disabled",
  providerCredentialsRequired: false,
  providerBudgetRequired: false,
  autoPublish: false,
  humanVisualAcceptanceRequired: true,
  lipSyncRequired: false,
  canonicalVisualSource:
    "apps/web/public/brand/voxy/voxy-podcast-stage.png",
  requiredFormats: ["16:9", "9:16", "1:1"],
  requiredMotionStates: [
    "neutral_idle",
    "listening",
    "explaining",
    "questioning",
    "highlighting_source",
    "showing_contrast",
    "inviting_participation",
  ],
  optionalLayers: {
    faceMotion: {
      preferredFamily: "liveportrait_compatible",
      productionAllowedOnlyWithCommerciallyCleanModelChain: true,
    },
    lipSync: {
      preferredFamily: "musetalk_compatible",
      enabledByDefault: false,
      productionAllowedOnlyAfterThirdPartyLicenseReview: true,
    },
  },
  fallback: {
    commercialProviderAllowed: true,
    automaticFallbackAllowed: false,
    requiresExplicitHumanDecision: true,
    requiresProviderPrivacyRetentionBudgetGates: true,
  },
} as const;

export type VoxySelfHostedMotionStrategy =
  typeof VOXY_SELF_HOSTED_MOTION_STRATEGY;

export function isVoxySelfHostedDefault(): boolean {
  return (
    VOXY_SELF_HOSTED_MOTION_STRATEGY.executionMode === "self_hosted" &&
    VOXY_SELF_HOSTED_MOTION_STRATEGY.commercialSaasDefault === "disabled" &&
    VOXY_SELF_HOSTED_MOTION_STRATEGY.externalUploadAllowed === false
  );
}
