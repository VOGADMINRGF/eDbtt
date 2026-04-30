import { z } from "zod";
import type { SocialCarouselOutput } from "./socialCarousel";

export const SOCIAL_DISTRIBUTION_CHANNELS = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube_shorts",
  "x_twitter",
  "mastodon",
  "bluesky",
  "whatsapp_channel",
  "telegram",
  "website_embed",
] as const;

export const SOCIAL_DISTRIBUTION_MODES = [
  "disabled",
  "draft_only",
  "review_required",
  "scheduled",
  "realtime_allowed",
] as const;

export const SOCIAL_DISTRIBUTION_STATUSES = [
  "draft",
  "needs_review",
  "approved",
  "scheduled",
  "ready_to_publish",
  "published",
  "blocked",
  "failed",
] as const;

export const SOCIAL_CONNECTOR_STATUSES = [
  "not_configured",
  "configured",
  "disabled_by_policy",
  "requires_review",
  "available_later",
] as const;

export const SOCIAL_SCHEDULE_MODES = [
  "manual",
  "suggested_window",
  "scheduled_at",
  "immediate_after_review",
] as const;

export type SocialDistributionChannel = (typeof SOCIAL_DISTRIBUTION_CHANNELS)[number];
export type SocialDistributionMode = (typeof SOCIAL_DISTRIBUTION_MODES)[number];
export type SocialDistributionStatus = (typeof SOCIAL_DISTRIBUTION_STATUSES)[number];
export type SocialConnectorStatus = (typeof SOCIAL_CONNECTOR_STATUSES)[number];
export type SocialScheduleMode = (typeof SOCIAL_SCHEDULE_MODES)[number];

export type SocialPublishingPolicy = {
  mode: SocialDistributionMode;
  canSchedule: boolean;
  canRealtimePublish: boolean;
  requiresManualReview: boolean;
  autoPublishEnabled: false;
  externalApisEnabled: false;
};

export type SocialDistributionTarget = {
  channel: SocialDistributionChannel;
  label: string;
  connectorStatus: SocialConnectorStatus;
  selected: boolean;
  suggested: boolean;
  note: string;
};

export type SocialDistributionPlan = {
  dossierId: string;
  packageId: string;
  mode: SocialDistributionMode;
  status: SocialDistributionStatus;
  scheduleMode: SocialScheduleMode;
  scheduleModes: SocialScheduleMode[];
  selectedChannels: SocialDistributionChannel[];
  suggestedChannels: SocialDistributionChannel[];
  targets: SocialDistributionTarget[];
  selectedCount: number;
  suggestedPostText: string;
  suggestedHashtags: string[];
  suggestedPostingWindows: string[];
  suggestedChannelFit: string[];
  regionalContext: string;
  participationQuestion: string;
  publicationStatus: "draft_review_required";
  canAutoPublish: false;
  policy: SocialPublishingPolicy;
  automationHint: string;
  publishActionEnabled: false;
};

const SocialPublishingPolicySchema = z
  .object({
    mode: z.enum(SOCIAL_DISTRIBUTION_MODES),
    canSchedule: z.boolean(),
    canRealtimePublish: z.boolean(),
    requiresManualReview: z.boolean(),
    autoPublishEnabled: z.literal(false),
    externalApisEnabled: z.literal(false),
  })
  .strict();

const SocialDistributionTargetSchema = z
  .object({
    channel: z.enum(SOCIAL_DISTRIBUTION_CHANNELS),
    label: z.string().trim().min(1),
    connectorStatus: z.enum(SOCIAL_CONNECTOR_STATUSES),
    selected: z.boolean(),
    suggested: z.boolean(),
    note: z.string().trim().min(1),
  })
  .strict();

export const SocialDistributionPlanSchema = z
  .object({
    dossierId: z.string().trim().min(1),
    packageId: z.string().trim().min(1),
    mode: z.enum(SOCIAL_DISTRIBUTION_MODES),
    status: z.enum(SOCIAL_DISTRIBUTION_STATUSES),
    scheduleMode: z.enum(SOCIAL_SCHEDULE_MODES),
    scheduleModes: z.array(z.enum(SOCIAL_SCHEDULE_MODES)).min(1),
    selectedChannels: z.array(z.enum(SOCIAL_DISTRIBUTION_CHANNELS)),
    suggestedChannels: z.array(z.enum(SOCIAL_DISTRIBUTION_CHANNELS)).min(1),
    targets: z.array(SocialDistributionTargetSchema).length(11),
    selectedCount: z.number().int().min(0).max(11),
    suggestedPostText: z.string().trim().min(1),
    suggestedHashtags: z.array(z.string().trim().min(2)).min(1),
    suggestedPostingWindows: z.array(z.string().trim().min(1)).min(1),
    suggestedChannelFit: z.array(z.string().trim().min(1)).min(1),
    regionalContext: z.string().trim().min(1),
    participationQuestion: z.string().trim().min(1),
    publicationStatus: z.literal("draft_review_required"),
    canAutoPublish: z.literal(false),
    policy: SocialPublishingPolicySchema,
    automationHint: z.string().trim().min(1),
    publishActionEnabled: z.literal(false),
  })
  .strict();

const CHANNEL_LABELS: Record<SocialDistributionChannel, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
  x_twitter: "X / Twitter",
  mastodon: "Mastodon",
  bluesky: "Bluesky",
  whatsapp_channel: "WhatsApp Channel",
  telegram: "Telegram",
  website_embed: "Website Embed",
};

const SUGGESTED_CHANNELS: SocialDistributionChannel[] = [
  "website_embed",
  "linkedin",
  "instagram",
];

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

export function getSocialPublishingPolicy(): SocialPublishingPolicy {
  const distributionEnabled = envFlag("SOCIAL_DISTRIBUTION_ENABLED", false);
  const canSchedule = envFlag("SOCIAL_SCHEDULE_ENABLED", true);
  const requiresManualReview = envFlag("SOCIAL_REQUIRE_REVIEW", true);

  return SocialPublishingPolicySchema.parse({
    mode: distributionEnabled ? "review_required" : "draft_only",
    canSchedule,
    canRealtimePublish: false,
    requiresManualReview,
    autoPublishEnabled: false,
    externalApisEnabled: false,
  });
}

function channelNote(status: SocialConnectorStatus): string {
  if (status === "configured") return "Verbunden";
  if (status === "disabled_by_policy") return "Per Admin deaktiviert";
  if (status === "requires_review") return "Review erforderlich";
  if (status === "available_later") return "Später verfügbar";
  return "Noch nicht verbunden";
}

export function buildSocialDistributionPlan(
  carouselOutput: SocialCarouselOutput,
  options?: {
    policy?: SocialPublishingPolicy;
    scheduleMode?: SocialScheduleMode;
  },
): SocialDistributionPlan {
  const policy = options?.policy ?? getSocialPublishingPolicy();
  const scheduleMode = options?.scheduleMode ?? "suggested_window";

  const targets: SocialDistributionTarget[] = SOCIAL_DISTRIBUTION_CHANNELS.map((channel) => {
    const suggested = SUGGESTED_CHANNELS.includes(channel);

    let connectorStatus: SocialConnectorStatus = "not_configured";
    if (channel === "website_embed") connectorStatus = "configured";
    if (channel !== "website_embed" && !policy.externalApisEnabled) {
      connectorStatus = "disabled_by_policy";
    }

    const selected = channel === "website_embed";

    return {
      channel,
      label: CHANNEL_LABELS[channel],
      connectorStatus,
      selected,
      suggested,
      note: channelNote(connectorStatus),
    };
  });

  const selectedChannels = targets.filter((target) => target.selected).map((target) => target.channel);
  const status: SocialDistributionStatus =
    carouselOutput.reviewStatus === "draft" || carouselOutput.reviewStatus === "needs_review"
      ? "needs_review"
      : "approved";

  const plan: SocialDistributionPlan = {
    dossierId: carouselOutput.dossierId,
    packageId: carouselOutput.packageId,
    mode: policy.mode,
    status,
    scheduleMode,
    scheduleModes: ["manual", "suggested_window", "scheduled_at", "immediate_after_review"],
    selectedChannels,
    suggestedChannels: SUGGESTED_CHANNELS,
    targets,
    selectedCount: selectedChannels.length,
    suggestedPostText: carouselOutput.suggestedPostText,
    suggestedHashtags: carouselOutput.suggestedHashtags,
    suggestedPostingWindows: carouselOutput.suggestedPostingWindows,
    suggestedChannelFit: carouselOutput.suggestedChannelFit,
    regionalContext: carouselOutput.regionalContext,
    participationQuestion: carouselOutput.participationQuestion,
    publicationStatus: "draft_review_required",
    canAutoPublish: false,
    policy,
    automationHint: "Automatisierung erst nach Admin-Freigabe.",
    publishActionEnabled: false,
  };

  return SocialDistributionPlanSchema.parse(plan);
}
