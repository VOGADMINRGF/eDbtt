import { z } from "zod";

export const MARKETING_CONTENT_KIND_VALUES = [
  "social_post",
  "carousel",
  "story",
  "short_video",
  "video",
  "press_post",
  "newsletter",
] as const;

export const MARKETING_CONTENT_STATUS_VALUES = [
  "draft",
  "review_ready",
  "approved",
  "scheduled",
  "published",
  "paused",
  "archived",
] as const;

export const MARKETING_CONTENT_CHANNEL_VALUES = [
  "instagram",
  "instagram_reels",
  "instagram_story",
  "linkedin",
  "facebook",
  "facebook_story",
  "tiktok",
  "youtube_shorts",
  "youtube",
  "newsletter",
  "press",
] as const;

export const MARKETING_CONTENT_RESPONSIBILITY_VALUES = [
  "marketing",
  "editorial",
  "design",
  "video",
  "admin",
] as const;

const idSchema = z.string().trim().min(1).max(120);
const isoDateSchema = z.string().datetime({ offset: true });

export const MarketingContentOperationSchema = z
  .object({
    id: idSchema,
    campaignId: idSchema,
    assetId: idSchema,
    title: z.string().trim().min(1).max(180),
    kind: z.enum(MARKETING_CONTENT_KIND_VALUES),
    status: z.enum(MARKETING_CONTENT_STATUS_VALUES),
    locale: z.string().trim().min(2).max(35),
    originalLocale: z.string().trim().min(2).max(35),
    channels: z.array(z.enum(MARKETING_CONTENT_CHANNEL_VALUES)).min(1),
    captionDraft: z.string().trim().min(1).max(10_000).nullable(),
    scriptDraft: z.string().trim().min(1).max(20_000).nullable(),
    scheduledAt: isoDateSchema.nullable(),
    responsibleRole: z.enum(MARKETING_CONTENT_RESPONSIBILITY_VALUES),
    responsibleLabel: z.string().trim().min(1).max(160),
    cta: z
      .object({
        label: z.string().trim().min(1).max(120),
        url: z.string().url().nullable(),
        status: z.enum(["verified", "needs_routing_decision", "retired"]),
      })
      .strict(),
    review: z
      .object({
        required: z.literal(true),
        status: z.enum(["pending", "changes_requested", "approved"]),
        ref: z.string().trim().min(1).max(500).nullable(),
      })
      .strict(),
    distributionRecordIds: z.array(idSchema),
    nextAction: z
      .object({
        key: z.enum([
          "complete_content",
          "review_content",
          "approve_content",
          "schedule_content",
          "review_results",
        ]),
        labelDe: z.string().trim().min(1).max(240),
        labelEn: z.string().trim().min(1).max(240),
        href: z.string().trim().startsWith("/").max(500),
      })
      .strict(),
    autoPublishEligible: z.literal(false),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
  })
  .strict()
  .superRefine((item, context) => {
    if (!item.captionDraft && !item.scriptDraft) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "captionDraft or scriptDraft is required",
        path: ["captionDraft"],
      });
    }
    if (item.status === "scheduled" && !item.scheduledAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scheduled content requires scheduledAt",
        path: ["scheduledAt"],
      });
    }
    if (item.status !== "scheduled" && item.scheduledAt && item.status !== "published") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scheduledAt is only valid for scheduled or published content",
        path: ["scheduledAt"],
      });
    }
  });

export const MarketingContentOperationsSchema = z.array(MarketingContentOperationSchema);

export type MarketingContentOperation = z.infer<typeof MarketingContentOperationSchema>;
export type MarketingContentKind = MarketingContentOperation["kind"];
export type MarketingContentStatus = MarketingContentOperation["status"];
export type MarketingContentChannel = MarketingContentOperation["channels"][number];
