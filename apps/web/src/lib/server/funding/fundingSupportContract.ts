import { z } from "zod";

export const FUNDING_SUPPORT_TYPES = [
  "money",
  "in_kind",
  "know_how",
  "volunteer_support",
  "planning_service",
  "moderation_contribution",
] as const;

export const FUNDING_SUPPORT_SCOPES = ["anlassraum", "dossier_adjacent"] as const;
export const FUNDING_BINDING_TYPES = ["earmarked", "open_use"] as const;
export const FUNDING_MATCHING_FRAMES = ["none", "enabling_fund", "community_contributions"] as const;
export const FUNDING_PROVIDER_ROLES = [
  "citizen",
  "initiative",
  "association",
  "company",
  "civic_creator",
  "media_creator",
  "organization",
  "institution",
  "municipality",
] as const;

const NonEmptyString = z.string().trim().min(1).max(500);

const VisibilitySchema = z
  .object({
    providerVisible: z.boolean(),
    roleVisible: z.boolean(),
    purposeVisible: z.boolean(),
    conditionsVisible: z.boolean(),
    expectedImpactVisible: z.boolean(),
  })
  .strict();

const CaptureGuardrailSchema = z
  .object({
    separatesFromSignal: z.literal(true),
    separatesFromFactStatus: z.literal(true),
    separatesFromVoting: z.literal(true),
    noLegitimationReplacement: z.literal(true),
  })
  .strict();

const FundingSupportContractSchema = z
  .object({
    supportType: z.enum(FUNDING_SUPPORT_TYPES),
    supportScope: z.enum(FUNDING_SUPPORT_SCOPES),
    matchingFrame: z.enum(FUNDING_MATCHING_FRAMES).default("none"),
    bindingType: z.enum(FUNDING_BINDING_TYPES),
    providerRole: z.enum(FUNDING_PROVIDER_ROLES),
    providerLabel: z.string().trim().min(1).max(160),
    anlassraumId: z.string().trim().min(1).max(80).nullable().default(null),
    dossierId: z.string().trim().min(1).max(80).nullable().default(null),
    purpose: NonEmptyString,
    conditions: z.string().trim().max(500).nullable().default(null),
    expectedImpact: z.string().trim().max(500).nullable().default(null),
    amountCents: z.number().int().positive().nullable().default(null),
    currency: z.string().trim().min(3).max(3).nullable().default(null),
    resourceDescription: z.string().trim().max(500).nullable().default(null),
    contextVisible: z.literal(true),
    openQuestionsVisible: z.literal(true),
    viabilityVisible: z.literal(true),
    transparency: VisibilitySchema,
    captureGuardrails: CaptureGuardrailSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.supportScope === "anlassraum" && !value.anlassraumId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anlassraumId"],
        message: "anlassraum_scope_requires_anlassraum_id",
      });
    }

    if (value.supportScope === "dossier_adjacent" && !value.dossierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dossierId"],
        message: "dossier_adjacent_scope_requires_dossier_id",
      });
    }

    if (value.supportType === "money") {
      if (!value.amountCents) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amountCents"],
          message: "money_support_requires_amount",
        });
      }
      if (!value.currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["currency"],
          message: "money_support_requires_currency",
        });
      }
    } else if (!value.resourceDescription) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resourceDescription"],
        message: "non_monetary_support_requires_resource_description",
      });
    }

    if (value.matchingFrame !== "none" && value.supportScope !== "anlassraum") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["matchingFrame"],
        message: "matching_frame_requires_anlassraum_scope",
      });
    }
  });

export type FundingSupportContract = z.infer<typeof FundingSupportContractSchema>;
export type FundingSupportParseResult =
  | { ok: true; value: FundingSupportContract }
  | { ok: false; error: string; issues: string[] };

export function parseFundingSupportContract(input: unknown): FundingSupportParseResult {
  const parsed = FundingSupportContractSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_funding_support_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return {
    ok: true,
    value: parsed.data,
  };
}

export function buildFundingSupportDisclosure(contract: FundingSupportContract) {
  return {
    supportType: contract.supportType,
    supportScope: contract.supportScope,
    matchingFrame: contract.matchingFrame,
    bindingType: contract.bindingType,
    providerRole: contract.providerRole,
    providerLabel: contract.providerLabel,
    targetAnlassraumId: contract.anlassraumId,
    targetDossierId: contract.dossierId,
    purpose: contract.purpose,
    conditions: contract.conditions,
    expectedImpact: contract.expectedImpact,
    amountCents: contract.amountCents,
    currency: contract.currency,
    resourceDescription: contract.resourceDescription,
  } as const;
}
