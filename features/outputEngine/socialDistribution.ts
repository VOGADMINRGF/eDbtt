import { z } from "zod";
import type { MasterPost } from "./masterPost";
import type { SocialCarouselOutput } from "./socialCarousel";
import {
  REGION_PUBLICATION_VISIBILITY_STATES,
  type RegionPublicationVisibilityState,
} from "@features/region/publicationRiskLadder";
import {
  SOCIAL_DISTRIBUTION_V1_STATUSES,
  type SocialDistributionV1Status,
} from "./socialDistributionStatusContract";

export const SOCIAL_DISTRIBUTION_CHANNELS = [
  "website_update",
  "newsletter_draft",
  "embed_snippet",
  "qr_asset",
  "linkedin_draft",
  "x_draft",
  "mastodon_draft",
  "instagram_asset",
  "press_note",
] as const;

export const SOCIAL_DISTRIBUTION_MODES = [
  "draft_only",
  "review_required",
  "scheduled",
  "realtime_allowed",
] as const;

export const SOCIAL_DISTRIBUTION_STATUSES = SOCIAL_DISTRIBUTION_V1_STATUSES;

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
export type SocialDistributionStatus = SocialDistributionV1Status;
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
  visibilityState: RegionPublicationVisibilityState;
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
  "draft_created",
  "asset_generated",
  "needs_review",
  "review_requested",
  "approved",
  "queued",
  "scheduled_ready",
  "exported",
  "copied",
  "archived",
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
  visibilityState: RegionPublicationVisibilityState;
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
    visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES),
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
    visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES),
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
  website_update: "Website-Update",
  newsletter_draft: "Newsletter-Entwurf",
  embed_snippet: "Embed-Snippet",
  qr_asset: "QR-Asset",
  linkedin_draft: "LinkedIn-Entwurf",
  x_draft: "X-Entwurf",
  mastodon_draft: "Mastodon-Entwurf",
  instagram_asset: "Instagram-Asset",
  press_note: "Pressenotiz",
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
  if (
    channel === "website_update" ||
    channel === "embed_snippet" ||
    channel === "qr_asset" ||
    channel === "newsletter_draft" ||
    channel === "press_note"
  ) {
    return "internal_available";
  }

  if (channel === "instagram_asset") {
    return "requires_review";
  }

  if (!policy.externalApisEnabled) return "disabled_by_policy";
  return "configured";
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
  if (!selected) return "draft_created";
  if (connectorStatus === "requires_review") return "needs_review";
  if (connectorStatus === "disabled_by_policy" || connectorStatus === "not_connected") {
    return "needs_review";
  }
  return "asset_generated";
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
      id: "version_website_update",
      channel: "website_update",
      title: "Website-Update",
      postType: "Kurztext + Dossier-Link",
      excerpt: compact(masterPost.body, 190),
      detail: "Sachlicher Update-Text für öffentliche Web-Einbettung im Review-first-Pfad.",
    },
    {
      id: "version_instagram",
      channel: "instagram_asset",
      title: "Instagram-Asset",
      postType: "Caption + Carousel-Outline",
      excerpt: compact(carouselOutput.suggestedPostText, 180),
      detail: `Carousel: ${slideOutline}. ${hashtagLine}`,
    },
    {
      id: "version_linkedin",
      channel: "linkedin_draft",
      title: "LinkedIn-Entwurf",
      postType: "Professioneller Sachpost",
      excerpt: compact(masterPost.body, 210),
      detail: "Fokus auf Quellenlage, Übertragbarkeit, offene Fragen und umsetzbare Optionen.",
    },
    {
      id: "version_x",
      channel: "x_draft",
      title: "X-Entwurf",
      postType: "Kurzpost-Entwurf",
      excerpt: compact(`${masterPost.hook} ${masterPost.cta}`, 150),
      detail: "Kurzformat mit Dossier-Link und klarer Review-Hinweispflicht.",
    },
    {
      id: "version_mastodon",
      channel: "mastodon_draft",
      title: "Mastodon-Entwurf",
      postType: "Kurzpost-Entwurf",
      excerpt: compact(`${masterPost.hook} ${masterPost.participationQuestion}`, 150),
      detail: "Kurzformat mit Kontext, Link und ehrlichem Review-Hinweis.",
    },
    {
      id: "version_newsletter",
      channel: "newsletter_draft",
      title: "Newsletter-Entwurf",
      postType: "Briefing",
      excerpt: compact(masterPost.body, 200),
      detail: "Kurzbriefing mit Quellenlage, offenen Fragen und Entscheidungsoptionen.",
    },
    {
      id: "version_press_note",
      channel: "press_note",
      title: "Pressenotiz",
      postType: "Kurznotiz",
      excerpt: compact(masterPost.body, 190),
      detail: "Kurznotiz mit Kontext, Limitierungen und Verweis auf den Review-Stand.",
    },
    {
      id: "version_embed",
      channel: "embed_snippet",
      title: "Embed-Snippet",
      postType: "Einbettung + Teaser",
      excerpt: compact(masterPost.title, 150),
      detail: "Interne Einbettung für Website- oder Dossier-Module ohne externes Posting.",
    },
    {
      id: "version_print",
      channel: "qr_asset",
      title: "QR-Asset",
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
    visibilityState: input.plan.visibilityState,
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

  const safeSuggestions: SocialDistributionChannel[] = [
    "website_update",
    "newsletter_draft",
    "embed_snippet",
    "qr_asset",
  ];
  const defaultSelected = options?.selectedChannels?.length
    ? options.selectedChannels
    : ["website_update", "newsletter_draft", "qr_asset"];

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
  const status: SocialDistributionStatus =
    masterPost.reviewStatus === "approved" ? "approved" : "needs_review";

  const plan: SocialDistributionPlan = {
    dossierId: masterPost.dossierId,
    packageId: masterPost.packageId,
    visibilityState: masterPost.visibilityState,
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
      "Kein Auto-Publish und keine externe API-Verteilung im v1-Pfad.",
      "Kanalentwürfe bleiben review-first und werden nur manuell veröffentlicht.",
    ],
    channelVersions: buildChannelVersions({
      masterPost,
      carouselOutput,
      hashtags,
    }),
  };

  return SocialDistributionPlanSchema.parse(plan);
}
