import { z } from "zod";

export const OUTPUT_FORMATS = [
  "web_article",
  "short_briefing",
  "social_carousel",
  "reel_script",
  "voiceover_text",
  "podcast_script",
  "qr_poster",
  "citizen_letter",
  "administrative_note",
  "mandate_summary",
] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export const OUTPUT_REVIEW_STATUSES = [
  "draft",
  "needs_review",
  "approved",
  "rejected",
  "published",
  "archived",
] as const;

export type OutputReviewStatus = (typeof OUTPUT_REVIEW_STATUSES)[number];
export type ReviewStatus = OutputReviewStatus;

export const DISTRIBUTION_CHANNELS = [
  "web",
  "social",
  "audio",
  "print",
  "mail",
  "internal",
] as const;

export type DistributionChannel = (typeof DISTRIBUTION_CHANNELS)[number];

export const OUTPUT_AUDIENCES = [
  "general_public",
  "citizens",
  "journalists",
  "administration",
  "mandate_holders",
  "mixed",
] as const;

export type OutputAudience = (typeof OUTPUT_AUDIENCES)[number];

export const OUTPUT_COMPLETENESS_STATUSES = ["complete", "needs_input"] as const;

export type OutputCompletenessStatus = (typeof OUTPUT_COMPLETENESS_STATUSES)[number];

export const SOURCE_STATE_STATUSES = ["sufficient", "missing"] as const;

export type SourceStateStatus = (typeof SOURCE_STATE_STATUSES)[number];

export const QR_CODE_TARGET_TYPES = ["dossier", "review", "distribution"] as const;

export type QRCodeTargetType = (typeof QR_CODE_TARGET_TYPES)[number];

export const SourceTraceSchema = z
  .object({
    sourceId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    url: z.string().trim().url(),
    claimRefs: z.array(z.string().trim().min(1)).default([]),
    note: z.string().trim().min(1).nullable().default(null),
  })
  .strict();

export type SourceTrace = z.infer<typeof SourceTraceSchema>;

export const OutputCTASchema = z
  .object({
    label: z.string().trim().min(1),
    action: z.enum(["open_dossier", "join_review", "open_options"]),
    target: z.string().trim().min(1),
  })
  .strict();

export type OutputCTA = z.infer<typeof OutputCTASchema>;

export const QRCodeTargetSchema = z
  .object({
    type: z.enum(QR_CODE_TARGET_TYPES),
    label: z.string().trim().min(1),
    target: z.string().trim().min(1),
  })
  .strict();

export type QRCodeTarget = z.infer<typeof QRCodeTargetSchema>;

export const DossierOutputSchema = z
  .object({
    format: z.enum(OUTPUT_FORMATS),
    channel: z.enum(DISTRIBUTION_CHANNELS),
    headline: z.string().trim().min(1),
    shortSummary: z.string().trim().min(1),
    structuredSummary: z.array(z.string().trim().min(1)).min(1),
    openQuestions: z.array(z.string().trim().min(1)).default([]),
    options: z.array(z.string().trim().min(1)).default([]),
    reviewStatus: z.enum(OUTPUT_REVIEW_STATUSES),
    completenessStatus: z.enum(OUTPUT_COMPLETENESS_STATUSES),
    mapperReady: z.literal(false),
  })
  .strict();

export type DossierOutput = z.infer<typeof DossierOutputSchema>;
export type DistributionOutput = DossierOutput;

export const SourceStateSchema = z
  .object({
    status: z.enum(SOURCE_STATE_STATUSES),
    sourceCount: z.number().int().nonnegative(),
    traces: z.array(SourceTraceSchema),
    notes: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export type SourceState = z.infer<typeof SourceStateSchema>;

export const OutputPackageSchema = z
  .object({
    packageId: z.string().trim().min(1),
    dossierId: z.string().trim().min(1),
    generatedAt: z.string().datetime({ offset: true }),
    reviewStatus: z.enum(OUTPUT_REVIEW_STATUSES),
    completenessStatus: z.enum(OUTPUT_COMPLETENESS_STATUSES),
    audience: z.enum(OUTPUT_AUDIENCES),
    title: z.string().trim().min(1),
    shortSummary: z.string().trim().min(1),
    structuredSummary: z.array(z.string().trim().min(1)).min(1),
    sourceState: SourceStateSchema,
    sourceTraces: z.array(SourceTraceSchema),
    openQuestions: z.array(z.string().trim().min(1)),
    options: z.array(z.string().trim().min(1)),
    needsInputMarkers: z.array(z.string().trim().min(1)),
    cta: OutputCTASchema,
    dossierBacklinkTarget: z.string().trim().min(1),
    qrCodeTarget: QRCodeTargetSchema,
    distributionOutputs: z.array(DossierOutputSchema).min(1),
    autoPublish: z.literal(false),
  })
  .strict();

export type OutputPackage = z.infer<typeof OutputPackageSchema>;
