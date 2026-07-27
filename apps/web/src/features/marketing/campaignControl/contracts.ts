import { z } from "zod";

export const MARKETING_SEGMENT_VALUES = ["b2c", "b2b", "b2g"] as const;
export const MARKETING_REACH_SCOPE_VALUES = [
  "local",
  "regional",
  "national",
  "international",
] as const;
export const MARKETING_PROMOTION_VALUES = ["organic", "paid", "mixed"] as const;
export const MARKETING_CONTROL_CHANNEL_VALUES = [
  "edebatte",
  "website",
  "download",
  "email",
  "newsletter",
  "instagram",
  "instagram_reels",
  "instagram_story",
  "linkedin",
  "facebook",
  "facebook_story",
  "tiktok",
  "youtube_shorts",
  "youtube",
  "press",
  "meta_ads",
  "linkedin_ads",
  "google_ads",
] as const;
export const MARKETING_METRIC_SOURCE_VALUES = [
  "internal",
  "social",
  "email",
  "download",
  "ads",
  "manual",
] as const;
export const MARKETING_DATA_QUALITY_VALUES = [
  "verified",
  "partial",
  "estimated",
  "stale",
  "missing",
  "rejected",
] as const;
export const MARKETING_METRIC_KEY_VALUES = [
  "reach",
  "impressions",
  "views",
  "watch_time_seconds",
  "completion_rate",
  "likes",
  "comments",
  "shares",
  "saves",
  "profile_views",
  "link_clicks",
  "email_sent",
  "email_delivered",
  "email_opens",
  "email_clicks",
  "email_replies",
  "email_unsubscribes",
  "downloads",
  "landing_page_views",
  "product_actions_started",
  "product_actions_completed",
  "registrations",
  "qualified_inquiries",
  "conversions",
  "spend_cents",
  "cpm_cents",
  "cpc_cents",
  "ctr",
  "frequency",
] as const;

const idSchema = z.string().trim().min(1).max(120);
const keySchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const isoDateSchema = z.string().datetime({ offset: true });

export const MarketingCampaignControlProfileSchema = z
  .object({
    campaignId: idSchema,
    primarySegment: z.enum(MARKETING_SEGMENT_VALUES),
    segments: z.array(z.enum(MARKETING_SEGMENT_VALUES)).min(1),
    audienceLabels: z.array(z.string().trim().min(1).max(160)).min(1),
    regionKeys: z.array(keySchema).min(1),
    reachScopes: z.array(z.enum(MARKETING_REACH_SCOPE_VALUES)).min(1),
    locales: z.array(z.string().trim().min(2).max(35)).min(1),
    promotion: z.enum(MARKETING_PROMOTION_VALUES),
    plannedChannels: z.array(z.enum(MARKETING_CONTROL_CHANNEL_VALUES)).min(1),
    objective: z.string().trim().min(1).max(1000),
    primaryKpi: z.enum(MARKETING_METRIC_KEY_VALUES),
    secondaryKpis: z.array(z.enum(MARKETING_METRIC_KEY_VALUES)).max(4),
    reportingWindow: z
      .object({
        startsAt: isoDateSchema.nullable(),
        endsAt: isoDateSchema.nullable(),
      })
      .strict(),
  })
  .strict()
  .superRefine((profile, context) => {
    if (!profile.segments.includes(profile.primarySegment)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "primarySegment must be included in segments",
        path: ["primarySegment"],
      });
    }
    if (new Set(profile.segments).size !== profile.segments.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "segments must be unique",
        path: ["segments"],
      });
    }
    if (profile.secondaryKpis.includes(profile.primaryKpi)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "primaryKpi must not be repeated in secondaryKpis",
        path: ["secondaryKpis"],
      });
    }
  });

export const MarketingMetricSnapshotSchema = z
  .object({
    id: idSchema,
    campaignId: idSchema,
    contentId: idSchema.nullable(),
    distributionRecordId: idSchema.nullable(),
    sourceKind: z.enum(MARKETING_METRIC_SOURCE_VALUES),
    providerKey: keySchema,
    sourceRef: z.string().trim().min(1).max(500),
    quality: z.enum(MARKETING_DATA_QUALITY_VALUES),
    channel: z.enum(MARKETING_CONTROL_CHANNEL_VALUES),
    segment: z.enum(MARKETING_SEGMENT_VALUES),
    regionKey: keySchema,
    reachScope: z.enum(MARKETING_REACH_SCOPE_VALUES),
    locale: z.string().trim().min(2).max(35),
    promotion: z.enum(MARKETING_PROMOTION_VALUES),
    periodStart: isoDateSchema,
    periodEnd: isoDateSchema,
    capturedAt: isoDateSchema,
    attribution: z.enum(["direct", "platform_reported", "campaign_link", "directional", "none"]),
    confidence: z.number().min(0).max(1),
    values: z.partialRecord(z.enum(MARKETING_METRIC_KEY_VALUES), z.number().nonnegative()),
  })
  .strict()
  .superRefine((snapshot, context) => {
    if (Object.keys(snapshot.values).length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "metric snapshot requires at least one value",
        path: ["values"],
      });
    }
    if (Date.parse(snapshot.periodEnd) < Date.parse(snapshot.periodStart)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "periodEnd must not precede periodStart",
        path: ["periodEnd"],
      });
    }
  });

export const MarketingCampaignControlProfilesSchema = z.array(MarketingCampaignControlProfileSchema);
export const MarketingMetricSnapshotsSchema = z.array(MarketingMetricSnapshotSchema);

export type MarketingSegment = (typeof MARKETING_SEGMENT_VALUES)[number];
export type MarketingReachScope = (typeof MARKETING_REACH_SCOPE_VALUES)[number];
export type MarketingPromotion = (typeof MARKETING_PROMOTION_VALUES)[number];
export type MarketingControlChannel = (typeof MARKETING_CONTROL_CHANNEL_VALUES)[number];
export type MarketingMetricSource = (typeof MARKETING_METRIC_SOURCE_VALUES)[number];
export type MarketingDataQuality = (typeof MARKETING_DATA_QUALITY_VALUES)[number];
export type MarketingMetricKey = (typeof MARKETING_METRIC_KEY_VALUES)[number];
export type MarketingCampaignControlProfile = z.infer<typeof MarketingCampaignControlProfileSchema>;
export type MarketingMetricSnapshot = z.infer<typeof MarketingMetricSnapshotSchema>;
