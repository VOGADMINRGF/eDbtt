import { z } from "zod";
import { MARKETING_DATA_QUALITY_VALUES } from "../campaignControl/contracts";

export const MARKETING_ASSISTANT_SCOPE_VALUES = ["portfolio", "campaign", "insights"] as const;
export const MARKETING_ASSISTANT_ACTION_VALUES = [
  "review_content",
  "inspect_campaign",
  "inspect_measurement",
  "inspect_distribution",
  "improve_data_basis",
] as const;

const idSchema = z.string().trim().min(1).max(160);

export const MarketingAssistantEvidenceSchema = z
  .object({
    key: idSchema,
    labelDe: z.string().trim().min(1).max(200),
    labelEn: z.string().trim().min(1).max(200),
    value: z.string().trim().min(1).max(500),
    quality: z.enum(MARKETING_DATA_QUALITY_VALUES),
  })
  .strict();

export const MarketingAssistantActionSchema = z
  .object({
    id: idSchema,
    kind: z.enum(MARKETING_ASSISTANT_ACTION_VALUES),
    priority: z.number().int().min(1).max(3),
    titleDe: z.string().trim().min(1).max(200),
    titleEn: z.string().trim().min(1).max(200),
    rationaleDe: z.string().trim().min(1).max(800),
    rationaleEn: z.string().trim().min(1).max(800),
    href: z.string().trim().startsWith("/admin/").max(500),
    quality: z.enum(MARKETING_DATA_QUALITY_VALUES),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const MarketingAssistantReadModelSchema = z
  .object({
    generatedAt: z.string().datetime({ offset: true }),
    scope: z.enum(MARKETING_ASSISTANT_SCOPE_VALUES),
    campaignId: idSchema.nullable(),
    headlineDe: z.string().trim().min(1).max(300),
    headlineEn: z.string().trim().min(1).max(300),
    bodyDe: z.string().trim().min(1).max(2000),
    bodyEn: z.string().trim().min(1).max(2000),
    dataQuality: z.enum(MARKETING_DATA_QUALITY_VALUES),
    confidence: z.number().min(0).max(1),
    evidence: z.array(MarketingAssistantEvidenceSchema).min(1).max(6),
    missingDataDe: z.array(z.string().trim().min(1).max(300)).max(6),
    missingDataEn: z.array(z.string().trim().min(1).max(300)).max(6),
    actions: z.array(MarketingAssistantActionSchema).max(3),
    automationAllowed: z.literal(false),
  })
  .strict()
  .superRefine((model, context) => {
    const priorities = model.actions.map((action) => action.priority);
    if (new Set(priorities).size !== priorities.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "assistant action priorities must be unique",
        path: ["actions"],
      });
    }
  });

export type MarketingAssistantEvidence = z.infer<typeof MarketingAssistantEvidenceSchema>;
export type MarketingAssistantAction = z.infer<typeof MarketingAssistantActionSchema>;
export type MarketingAssistantReadModel = z.infer<typeof MarketingAssistantReadModelSchema>;
export type MarketingAssistantScope = MarketingAssistantReadModel["scope"];
