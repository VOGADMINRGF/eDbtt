import { z } from "zod";
import type { MasterPost } from "./masterPost";
import type { SocialCarouselOutput } from "./socialCarousel";

export const SOCIAL_DISTRIBUTION_CHANNELS = [
  "website_embed",
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
  "newsletter",
  "qr_print",
] as const;

export const SOCIAL_DISTRIBUTION_MODES = [
  "draft_only",
  "review_required",
  "scheduled",
  "realtime_allowed",
] as const;

export const SOCIAL_DISTRIBUTION_STATUSES = [
  "draft",
  "review_required",
  "ready_for_schedule",
  "scheduled",
  "prepared",
  "export_ready",
] as const;

export const SOCIAL_CONNECTOR_STATUSES = [
  "internal_available",
  "not_connected",
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
  externalApisEnabled: false;
  autoPublishEnabled: false;
  canSchedule: boolean;
  canRealtimePublish: false;
  requiresManualReview: boolean;
};

export type SocialDistributionTarget = {
  channel: SocialDistributionChannel;
  label: string;
  connectorStatus: SocialConnectorStatus;
  selected: boolean;
  suggested: boolean;
  distributionStatus: SocialDistributionStatus;
  nextAction: string;
  scheduleModes: SocialScheduleMode[];
  suggestedWindow: string;
  postText: string;
  hashtags: string[];
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
  channelFit: string[];
  regionalContext: string;
  participationQuestion: string;
  backlinkTarget: string;
  publicationStatus: "draft_review_required";
  canAutoPublish: false;
  canRealtimePublish: false;
  externalApisUsed: false;
  publishActionEnabled: false;
  policy: SocialPublishingPolicy;
  policyHints: string[];
};

const SocialPublishingPolicySchema = z
  .object({
    externalApisEnabled: z.literal(false),
    autoPublishEnabled: z.literal(false),
    canSchedule: z.boolean(),
    canRealtimePublish: z.literal(false),
    requiresManualReview: z.boolean(),
  })
  .strict();

const SocialDistributionTargetSchema = z
  .object({
    channel: z.enum(SOCIAL_DISTRIBUTION_CHANNELS),
    label: z.string().trim().min(1),
    connectorStatus: z.enum(SOCIAL_CONNECTOR_STATUSES),
    selected: z.boolean(),
    suggested: z.boolean(),
    distributionStatus: z.enum(SOCIAL_DISTRIBUTION_STATUSES),
    nextAction: z.string().trim().min(1),
    scheduleModes: z.array(z.enum(SOCIAL_SCHEDULE_MODES)).min(1),
    suggestedWindow: z.string().trim().min(1),
    postText: z.string().trim().min(1),
    hashtags: z.array(z.string().trim().min(2)).min(1),
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
    targets: z.array(SocialDistributionTargetSchema).length(SOCIAL_DISTRIBUTION_CHANNELS.length),
    selectedCount: z.number().int().min(0),
    suggestedPostText: z.string().trim().min(1),
    suggestedHashtags: z.array(z.string().trim().min(2)).min(1),
    suggestedPostingWindows: z.array(z.string().trim().min(1)).min(1),
    channelFit: z.array(z.string().trim().min(1)).min(1),
    regionalContext: z.string().trim().min(1),
    participationQuestion: z.string().trim().min(1),
    backlinkTarget: z.string().trim().min(1),
    publicationStatus: z.literal("draft_review_required"),
    canAutoPublish: z.literal(false),
    canRealtimePublish: z.literal(false),
    externalApisUsed: z.literal(false),
    publishActionEnabled: z.literal(false),
    policy: SocialPublishingPolicySchema,
    policyHints: z.array(z.string().trim().min(1)).min(1),
  })
  .strict();

const CHANNEL_LABELS: Record<SocialDistributionChannel, string> = {
  website_embed: "Website / Dossier-Post",
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
  newsletter: "Newsletter",
  qr_print: "QR / Print",
};

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

export function getSocialPublishingPolicy(): SocialPublishingPolicy {
  const canSchedule = envFlag("SOCIAL_DISTRIBUTION_ENABLED", false)
    ? true
    : envFlag("SOCIAL_REQUIRE_REVIEW", true);

  return SocialPublishingPolicySchema.parse({
    externalApisEnabled: false,
    autoPublishEnabled: false,
    canSchedule,
    canRealtimePublish: false,
    requiresManualReview: envFlag("SOCIAL_REQUIRE_REVIEW", true),
  });
}

function resolveConnectorStatus(
  channel: SocialDistributionChannel,
  policy: SocialPublishingPolicy,
): SocialConnectorStatus {
  if (channel === "website_embed" || channel === "qr_print") return "internal_available";

  if (channel === "newsletter") {
    if (!policy.externalApisEnabled) return "not_connected";
    return "configured";
  }

  if (!policy.externalApisEnabled) return "disabled_by_policy";
  return "not_connected";
}

function resolveNextAction(status: SocialConnectorStatus): string {
  if (status === "internal_available") return "Internen Entwurf prüfen und planen";
  if (status === "configured") return "Kanaltext prüfen und Planung übernehmen";
  if (status === "requires_review") return "Review abschließen";
  if (status === "available_later") return "Später aktivieren";
  if (status === "disabled_by_policy") return "Nur Export/Kopieren möglich";
  return "Kanalverbindung vorbereiten";
}

function resolveDistributionStatus(
  selected: boolean,
  connectorStatus: SocialConnectorStatus,
): SocialDistributionStatus {
  if (!selected) return "draft";
  if (connectorStatus === "internal_available") return "ready_for_schedule";
  if (connectorStatus === "disabled_by_policy" || connectorStatus === "not_connected") return "export_ready";
  if (connectorStatus === "requires_review") return "review_required";
  return "ready_for_schedule";
}

function hashtagStrings(masterPost: MasterPost): string[] {
  return masterPost.suggestedHashtags.map((entry) => entry.tag);
}

export function buildSocialDistributionPlan(
  masterPost: MasterPost,
  carouselOutput: SocialCarouselOutput,
  options?: {
    policy?: SocialPublishingPolicy;
    scheduleMode?: SocialScheduleMode;
    selectedChannels?: SocialDistributionChannel[];
  },
): SocialDistributionPlan {
  const policy = options?.policy ?? getSocialPublishingPolicy();
  const scheduleModes: SocialScheduleMode[] = [
    "manual",
    "suggested_window",
    "scheduled_at",
    "immediate_after_review",
  ];
  const scheduleMode = options?.scheduleMode ?? "suggested_window";

  const safeSuggestions: SocialDistributionChannel[] = ["website_embed", "linkedin"];
  const defaultSelected = options?.selectedChannels?.length
    ? options.selectedChannels
    : ["website_embed", "linkedin", "qr_print"];

  const postText = masterPost.body;
  const hashtags = hashtagStrings(masterPost);
  const suggestedWindow = masterPost.suggestedPostingWindows[0]?.window ?? "Mo-Fr 08:00-10:00";

  const targets: SocialDistributionTarget[] = SOCIAL_DISTRIBUTION_CHANNELS.map((channel) => {
    const connectorStatus = resolveConnectorStatus(channel, policy);
    const selected = defaultSelected.includes(channel);

    return {
      channel,
      label: CHANNEL_LABELS[channel],
      connectorStatus,
      selected,
      suggested: safeSuggestions.includes(channel),
      distributionStatus: resolveDistributionStatus(selected, connectorStatus),
      nextAction: resolveNextAction(connectorStatus),
      scheduleModes,
      suggestedWindow,
      postText,
      hashtags,
    };
  });

  const selectedChannels = targets.filter((target) => target.selected).map((target) => target.channel);
  const status: SocialDistributionStatus = masterPost.reviewStatus === "approved" ? "ready_for_schedule" : "review_required";

  const plan: SocialDistributionPlan = {
    dossierId: masterPost.dossierId,
    packageId: masterPost.packageId,
    mode: "review_required",
    status,
    scheduleMode,
    scheduleModes,
    selectedChannels,
    suggestedChannels: safeSuggestions,
    targets,
    selectedCount: selectedChannels.length,
    suggestedPostText: carouselOutput.suggestedPostText,
    suggestedHashtags: hashtags,
    suggestedPostingWindows: masterPost.suggestedPostingWindows.map((entry) => entry.window),
    channelFit: masterPost.channelFit.map((entry) => entry.channel),
    regionalContext: masterPost.regionalContext,
    participationQuestion: masterPost.participationQuestion,
    backlinkTarget: masterPost.backlinkTarget,
    publicationStatus: "draft_review_required",
    canAutoPublish: false,
    canRealtimePublish: false,
    externalApisUsed: false,
    publishActionEnabled: false,
    policy,
    policyHints: [
      "Echtzeit-Veröffentlichung ist aktuell deaktiviert.",
      "Automatisierung erst nach Admin-Freigabe.",
    ],
  };

  return SocialDistributionPlanSchema.parse(plan);
}
