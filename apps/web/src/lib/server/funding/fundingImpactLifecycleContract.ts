import { z } from "zod";
import {
  FUNDING_MATCHING_FRAMES,
  FUNDING_SUPPORT_SCOPES,
  type FundingSupportContract,
} from "@/lib/server/funding/fundingSupportContract";

export const FUNDING_IMPACT_STATUSES = [
  "not_started",
  "in_progress",
  "partially_realized",
  "realized",
  "not_realized",
  "stopped",
] as const;

export const FUNDING_REFUNDING_STATUSES = [
  "none",
  "review_required",
  "pending",
  "reallocated",
  "refunded",
  "closed_without_refund",
] as const;

export const FUNDING_REFUNDING_REASON_TYPES = [
  "scope_change",
  "non_delivery",
  "partial_delivery",
  "governance_veto",
  "legal_blocker",
  "provider_withdrawal",
  "other",
] as const;

export const FUNDING_FOLLOWUP_STATUSES = [
  "none",
  "open",
  "in_review",
  "action_required",
  "resolved",
] as const;

const FundingImpactLifecycleSchema = z
  .object({
    supportScope: z.enum(FUNDING_SUPPORT_SCOPES),
    matchingFrame: z.enum(FUNDING_MATCHING_FRAMES),
    anlassraumId: z.string().trim().min(1).max(80).nullable().default(null),
    dossierId: z.string().trim().min(1).max(80).nullable().default(null),
    impactStatus: z.enum(FUNDING_IMPACT_STATUSES),
    impactReason: z.string().trim().max(500).nullable().default(null),
    followUpStatus: z.enum(FUNDING_FOLLOWUP_STATUSES).default("none"),
    refundingStatus: z.enum(FUNDING_REFUNDING_STATUSES).default("none"),
    refundingReasonType: z.enum(FUNDING_REFUNDING_REASON_TYPES).nullable().default(null),
    refundingReason: z.string().trim().max(500).nullable().default(null),
    transparency: z
      .object({
        impactVisible: z.literal(true),
        followUpVisible: z.literal(true),
        refundingVisible: z.literal(true),
        reasonVisible: z.literal(true),
      })
      .strict(),
    explainability: z
      .object({
        reasonRequired: z.boolean(),
        auditFieldsRequired: z
          .tuple([
            z.literal("impactStatus"),
            z.literal("followUpStatus"),
            z.literal("refundingStatus"),
            z.literal("reason"),
            z.literal("changedBy"),
            z.literal("changedAt"),
          ]),
      })
      .strict(),
    guardrails: z
      .object({
        keepsAnlassraumFirst: z.literal(true),
        keepsProjectBasedMatching: z.literal(true),
        separatesFromSignal: z.literal(true),
        separatesFromLegitimation: z.literal(true),
        separatesFromTruthAndFactStatus: z.literal(true),
        forbidsPersonalRewardLogic: z.literal(true),
        forbidsCaptureOverride: z.literal(true),
      })
      .strict(),
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

    if (value.matchingFrame !== "none" && value.supportScope !== "anlassraum") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["matchingFrame"],
        message: "matching_frame_requires_anlassraum_scope",
      });
    }

    const impactReasonRequired =
      value.impactStatus === "not_realized" || value.impactStatus === "stopped";
    if (impactReasonRequired && !value.impactReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["impactReason"],
        message: "impact_reason_required_for_non_realized_or_stopped",
      });
    }

    if (value.refundingStatus !== "none") {
      if (!value.refundingReasonType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["refundingReasonType"],
          message: "refunding_reason_type_required",
        });
      }
      if (!value.refundingReason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["refundingReason"],
          message: "refunding_reason_required",
        });
      }
    }

    if (value.refundingStatus === "none" && (value.refundingReasonType || value.refundingReason)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["refundingStatus"],
        message: "refunding_details_require_non_none_refunding_status",
      });
    }
  });

export type FundingImpactLifecycleContract = z.infer<typeof FundingImpactLifecycleSchema>;
export type FundingImpactLifecycleParseResult =
  | { ok: true; value: FundingImpactLifecycleContract }
  | { ok: false; error: string; issues: string[] };

export function parseFundingImpactLifecycleContract(input: unknown): FundingImpactLifecycleParseResult {
  const parsed = FundingImpactLifecycleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_funding_impact_lifecycle_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function buildFundingImpactLifecycleBaseline(input: {
  supportScope: FundingSupportContract["supportScope"];
  matchingFrame: FundingSupportContract["matchingFrame"];
  anlassraumId?: string | null;
  dossierId?: string | null;
}): FundingImpactLifecycleContract {
  const parsed = FundingImpactLifecycleSchema.parse({
    supportScope: input.supportScope,
    matchingFrame: input.matchingFrame,
    anlassraumId: input.anlassraumId ?? null,
    dossierId: input.dossierId ?? null,
    impactStatus: "not_started",
    impactReason: null,
    followUpStatus: "open",
    refundingStatus: "none",
    refundingReasonType: null,
    refundingReason: null,
    transparency: {
      impactVisible: true,
      followUpVisible: true,
      refundingVisible: true,
      reasonVisible: true,
    },
    explainability: {
      reasonRequired: false,
      auditFieldsRequired: [
        "impactStatus",
        "followUpStatus",
        "refundingStatus",
        "reason",
        "changedBy",
        "changedAt",
      ],
    },
    guardrails: {
      keepsAnlassraumFirst: true,
      keepsProjectBasedMatching: true,
      separatesFromSignal: true,
      separatesFromLegitimation: true,
      separatesFromTruthAndFactStatus: true,
      forbidsPersonalRewardLogic: true,
      forbidsCaptureOverride: true,
    },
  });
  return parsed;
}

export function buildFundingImpactLifecycleDisclosure(contract: FundingImpactLifecycleContract) {
  return {
    supportScope: contract.supportScope,
    matchingFrame: contract.matchingFrame,
    anlassraumId: contract.anlassraumId,
    dossierId: contract.dossierId,
    impactStatus: contract.impactStatus,
    impactReason: contract.impactReason,
    followUpStatus: contract.followUpStatus,
    refundingStatus: contract.refundingStatus,
    refundingReasonType: contract.refundingReasonType,
    refundingReason: contract.refundingReason,
  } as const;
}
