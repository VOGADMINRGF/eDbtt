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
  channelVersions: SocialDistributionChannelVersion[];
};

export type SocialDistributionChannelVersion = {
  id: string;
  channel: SocialDistributionChannel;
  title: string;
  postType: string;
  excerpt: string;
  detail: string;
};

export const SOCIAL_DISTRIBUTION_DRAFT_STATUSES = [
  "draft_saved",
  "review_requested",
  "planned",
  "prepared_internal",
  "external_export_only",
] as const;

export type SocialDistributionDraftStatus =
  (typeof SOCIAL_DISTRIBUTION_DRAFT_STATUSES)[number];

export type SocialDistributionQueueItem = {
  id: string;
  channel: SocialDistributionChannel;
  label: string;
  recommendedWindow: string;
  status: SocialDistributionStatus;
  connectorStatus: SocialConnectorStatus;
  actionLabel: string;
};

export type SocialDistributionDraft = {
  draftId: string;
  dossierId: string;
  packageId: string;
  savedAt: string;
  status: SocialDistributionDraftStatus;
  scheduleMode: SocialScheduleMode;
  selectedChannels: SocialDistributionChannel[];
  reviewRequired: boolean;
  backlinkTarget: string;
  queue: SocialDistributionQueueItem[];
  notes: string[];
  externalPublish: false;
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

const SocialDistributionChannelVersionSchema = z
  .object({
    id: z.string().trim().min(1),
    channel: z.enum(SOCIAL_DISTRIBUTION_CHANNELS),
    title: z.string().trim().min(1),
    postType: z.string().trim().min(1),
    excerpt: z.string().trim().min(1),
    detail: z.string().trim().min(1),
  })
  .strict();

const SocialDistributionQueueItemSchema = z
  .object({
    id: z.string().trim().min(1),
    channel: z.enum(SOCIAL_DISTRIBUTION_CHANNELS),
    label: z.string().trim().min(1),
    recommendedWindow: z.string().trim().min(1),
    status: z.enum(SOCIAL_DISTRIBUTION_STATUSES),
    connectorStatus: z.enum(SOCIAL_CONNECTOR_STATUSES),
    actionLabel: z.string().trim().min(1),
  })
  .strict();

export const SocialDistributionDraftSchema = z
  .object({
    draftId: z.string().trim().min(1),
    dossierId: z.string().trim().min(1),
    packageId: z.string().trim().min(1),
    savedAt: z.string().datetime({ offset: true }),
    status: z.enum(SOCIAL_DISTRIBUTION_DRAFT_STATUSES),
    scheduleMode: z.enum(SOCIAL_SCHEDULE_MODES),
    selectedChannels: z.array(z.enum(SOCIAL_DISTRIBUTION_CHANNELS)).min(1),
    reviewRequired: z.boolean(),
    backlinkTarget: z.string().trim().min(1),
    queue: z.array(SocialDistributionQueueItemSchema).min(1),
    notes: z.array(z.string().trim().min(1)),
    externalPublish: z.literal(false),
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
    channelVersions: z.array(SocialDistributionChannelVersionSchema).min(5),
  })
  .strict();

const CHANNEL_LABELS: Record<SocialDistributionChannel, string> = {
  website_embed: "Website / Dossier-Post",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
  x_twitter: "X",
  mastodon: "Mastodon",
  bluesky: "Bluesky",
  whatsapp_channel: "WhatsApp-Kanal",
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

function stableKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function hashtagStrings(masterPost: MasterPost): string[] {
  return masterPost.suggestedHashtags.map((entry) => entry.tag);
}

function compact(input: string, max = 170): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function buildChannelVersions(input: {
  masterPost: MasterPost;
  carouselOutput: SocialCarouselOutput;
  hashtags: string[];
}): SocialDistributionChannelVersion[] {
  const { masterPost, carouselOutput, hashtags } = input;
  const hashtagLine = hashtags.join(" ");
  const slideOutline = carouselOutput.slides
    .map((slide) => slide.title)
    .slice(0, 6)
    .join(" · ");

  return [
    {
      id: "version_instagram",
      channel: "instagram",
      title: "Instagram",
      postType: "Caption + Carousel-Outline",
      excerpt: compact(carouselOutput.suggestedPostText, 180),
      detail: `Carousel: ${slideOutline}. ${hashtagLine}`,
    },
    {
      id: "version_tiktok",
      channel: "tiktok",
      title: "TikTok / Reels / YouTube Shorts",
      postType: "Hook + Szenenplan + Voiceover",
      excerpt: compact(masterPost.hook, 170),
      detail:
        "Szenenplan: 1) Leitfrage, 2) Anlass, 3) Belegt/Offen, 4) Optionen, 5) Beteiligung + Dossier-Link.",
    },
    {
      id: "version_linkedin",
      channel: "linkedin",
      title: "LinkedIn",
      postType: "Professioneller Sachpost",
      excerpt: compact(masterPost.body, 210),
      detail: "Fokus auf Quellenlage, Übertragbarkeit, offene Fragen und umsetzbare Optionen.",
    },
    {
      id: "version_facebook",
      channel: "facebook",
      title: "Facebook",
      postType: "Lokaler Community-Post",
      excerpt: compact(masterPost.participationQuestion, 180),
      detail: "Fokus auf lokale Betroffenheit und konkrete Hinweise aus der Bürgerschaft.",
    },
    {
      id: "version_micro",
      channel: "x_twitter",
      title: "X / Mastodon / Bluesky",
      postType: "Kurzpost",
      excerpt: compact(`${masterPost.hook} ${masterPost.cta}`, 150),
      detail: "Kurzformat mit Dossier-Link und klarer Review-Hinweispflicht.",
    },
    {
      id: "version_newsletter",
      channel: "newsletter",
      title: "Newsletter",
      postType: "Briefing",
      excerpt: compact(masterPost.body, 200),
      detail: "Kurzbriefing mit Quellenlage, offenen Fragen und Entscheidungsoptionen.",
    },
    {
      id: "version_print",
      channel: "qr_print",
      title: "QR / Print",
      postType: "Poster-/Handout-Text",
      excerpt: "Kurzfassung mit Beteiligungsfrage, QR-Ziel und Review-Hinweis.",
      detail: "Geeignet für Auslage, Veranstaltungsmaterial und Vor-Ort-Dialog.",
    },
  ];
}

export function buildSocialDistributionQueue(
  plan: SocialDistributionPlan,
  selectedChannels?: SocialDistributionChannel[],
): SocialDistributionQueueItem[] {
  const selectedSet = new Set(selectedChannels ?? plan.selectedChannels);
  const fallbackWindow = plan.suggestedPostingWindows[0] ?? "Mo-Fr 08:00-10:00";

  const queue = plan.targets
    .filter((target) => selectedSet.has(target.channel))
    .map((target, index) => ({
      id: `queue_${index + 1}_${target.channel}`,
      channel: target.channel,
      label: target.label,
      recommendedWindow: target.suggestedWindow || fallbackWindow,
      status: target.distributionStatus,
      connectorStatus: target.connectorStatus,
      actionLabel: target.nextAction,
    }));

  return queue;
}

export function buildSocialDistributionDraft(input: {
  plan: SocialDistributionPlan;
  selectedChannels?: SocialDistributionChannel[];
  scheduleMode: SocialScheduleMode;
  reviewRequired: boolean;
  status: SocialDistributionDraftStatus;
  savedAt?: string;
}): SocialDistributionDraft {
  const selectedChannels =
    input.selectedChannels && input.selectedChannels.length > 0
      ? input.selectedChannels
      : input.plan.selectedChannels;
  const queue = buildSocialDistributionQueue(input.plan, selectedChannels);
  const savedAt = (() => {
    if (!input.savedAt) return new Date().toISOString();
    const parsed = new Date(input.savedAt);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  })();

  const notes = [
    "Keine externe Live-Veröffentlichung.",
    input.reviewRequired
      ? "Review erforderlich vor externer Nutzung."
      : "Review-Status vorhanden, dennoch manuelle Freigabe beachten.",
  ];

  const draft: SocialDistributionDraft = {
    draftId: `distdraft_${stableKey([input.plan.packageId, savedAt, selectedChannels.join(",")].join("|"))}`,
    dossierId: input.plan.dossierId,
    packageId: input.plan.packageId,
    savedAt,
    status: input.status,
    scheduleMode: input.scheduleMode,
    selectedChannels,
    reviewRequired: input.reviewRequired,
    backlinkTarget: input.plan.backlinkTarget,
    queue,
    notes,
    externalPublish: false,
  };

  return SocialDistributionDraftSchema.parse(draft);
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
    channelVersions: buildChannelVersions({
      masterPost,
      carouselOutput,
      hashtags,
    }),
  };

  return SocialDistributionPlanSchema.parse(plan);
}
