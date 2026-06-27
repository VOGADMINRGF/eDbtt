export const VOXY_PLANS = [
  "public",
  "member",
  "author_plus",
  "partner",
  "operator",
  "admin",
] as const;

export type VoxyPlan = (typeof VOXY_PLANS)[number];

export const VOXY_CAPABILITIES = [
  "topic_submit_public",
  "topic_submit_authenticated",
  "voxy_intake_light",
  "voxy_cocreation_full",
  "voxy_visual_brief_generate",
  "voxy_draft_export",
  "voxy_editorial_review",
  "voxy_publish_prepare",
  "voxy_campaign_manage",
] as const;

export type VoxyCapability = (typeof VOXY_CAPABILITIES)[number];

const VOXY_CAPABILITY_MATRIX: Record<VoxyPlan, readonly VoxyCapability[]> = {
  public: ["topic_submit_public"],
  member: ["topic_submit_public", "topic_submit_authenticated", "voxy_intake_light"],
  author_plus: [
    "topic_submit_public",
    "topic_submit_authenticated",
    "voxy_intake_light",
    "voxy_cocreation_full",
    "voxy_visual_brief_generate",
    "voxy_draft_export",
  ],
  partner: [
    "topic_submit_public",
    "topic_submit_authenticated",
    "voxy_intake_light",
    "voxy_cocreation_full",
    "voxy_visual_brief_generate",
    "voxy_draft_export",
    "voxy_campaign_manage",
  ],
  operator: [
    "topic_submit_public",
    "topic_submit_authenticated",
    "voxy_intake_light",
    "voxy_cocreation_full",
    "voxy_visual_brief_generate",
    "voxy_draft_export",
    "voxy_editorial_review",
    "voxy_publish_prepare",
    "voxy_campaign_manage",
  ],
  admin: VOXY_CAPABILITIES,
};

export class VoxyAccessError extends Error {
  readonly plan: VoxyPlan;
  readonly capability: VoxyCapability;

  constructor(plan: VoxyPlan, capability: VoxyCapability) {
    super(`Voxy plan "${plan}" does not grant capability "${capability}".`);
    this.name = "VoxyAccessError";
    this.plan = plan;
    this.capability = capability;
  }
}

export function getVoxyCapabilitiesForPlan(plan: VoxyPlan): VoxyCapability[] {
  return [...VOXY_CAPABILITY_MATRIX[plan]];
}

export function canUseVoxyCapability(
  plan: VoxyPlan,
  capability: VoxyCapability,
): boolean {
  return VOXY_CAPABILITY_MATRIX[plan].includes(capability);
}

export function assertVoxyAccess(
  plan: VoxyPlan,
  capability: VoxyCapability,
): true {
  if (!canUseVoxyCapability(plan, capability)) {
    throw new VoxyAccessError(plan, capability);
  }

  return true;
}
