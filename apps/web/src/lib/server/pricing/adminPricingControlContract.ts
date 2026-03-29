import { z } from "zod";

export const PRICING_SEGMENTS = [
  "public_free",
  "civic_creator",
  "media_creator",
  "team_organization",
  "municipality_public",
  "enterprise_sonderfall",
] as const;

export const CREATOR_TYPES = ["civic", "media", "publisher_agency"] as const;
export const VERIFICATION_STATUSES = ["unverified", "pending", "verified", "rejected"] as const;
export const PRICING_PLAN_KINDS = [
  "public_core",
  "professional_creator",
  "professional_team",
  "professional_municipality",
  "enterprise_special",
] as const;
export const INSTITUTION_TYPES = ["none", "municipality", "public_institution", "public_carrier"] as const;
export const OVERRIDE_TYPES = [
  "none",
  "manual_segment",
  "manual_plan",
  "manual_fee_rule",
  "manual_cap_policy",
  "manual_special_offer",
] as const;
export const SPECIAL_OFFER_STATUSES = ["none", "scheduled", "active", "expired"] as const;
export const PILOT_STATUSES = ["none", "pilot", "sunset"] as const;
export const FEE_RULE_TYPES = ["none", "standard", "funding_take_supplement", "municipal_verified_corridor"] as const;
export const CAP_POLICY_TYPES = [
  "none",
  "default_caps",
  "protected_civic_corridor",
  "municipal_corridor",
  "custom_capped",
] as const;
export const POLICY_SOURCES = ["policy_default", "admin_override", "pilot_program"] as const;
export const EXPLAINABILITY_FACTORS = [
  "segment",
  "plan",
  "verification_status",
  "creator_type",
  "institution_status",
  "funding_fee_rule",
  "cap_policy",
  "special_offer_status",
  "pilot_status",
  "policy_source",
  "override_reason",
] as const;
export const PRICING_CONTROL_AUDIT_EVENT_TYPES = [
  "policy_evaluated",
  "override_changed",
  "special_offer_changed",
  "pilot_status_changed",
  "fee_rule_changed",
  "cap_policy_changed",
] as const;
export const PRICING_CONTROL_TARGET_KINDS = [
  "account",
  "workspace",
  "organization",
  "institution",
  "global_policy",
] as const;
export const PRICING_CONTROL_ACTOR_KINDS = ["system", "admin_user", "service_worker"] as const;
export const PRICING_CONTROL_CHANGED_FIELDS = [
  "segment",
  "creatorType",
  "verificationStatus",
  "pricingPlanKind",
  "institutionType",
  "publicEntityFlag",
  "feeRuleType",
  "capPolicyType",
  "overrideType",
  "specialOfferStatus",
  "pilotStatus",
  "source",
] as const;
export const PRICING_CONTROL_REASON_REQUIRED_FIELDS = [
  "segment",
  "creatorType",
  "verificationStatus",
  "pricingPlanKind",
  "institutionType",
  "publicEntityFlag",
  "feeRuleType",
  "capPolicyType",
  "overrideType",
  "specialOfferStatus",
  "pilotStatus",
] as const;
export const PRICING_CONTROL_KPI_WINDOWS = ["daily", "weekly", "monthly", "rolling_30d"] as const;

const ExplainabilityBlockSchema = z.object({
  factors: z.array(z.enum(EXPLAINABILITY_FACTORS)).min(1),
  note: z.string().trim().min(1).max(500),
});

const ExplainabilitySchema = z
  .object({
    segment: ExplainabilityBlockSchema,
    plan: ExplainabilityBlockSchema,
    fee: ExplainabilityBlockSchema,
    specialStatus: ExplainabilityBlockSchema,
  })
  .strict();

const AuditScopeSchema = z
  .object({
    targetKind: z.enum(PRICING_CONTROL_TARGET_KINDS),
    targetId: z.string().trim().min(1).max(160).nullable().default(null),
    segment: z.enum(PRICING_SEGMENTS).nullable().default(null),
    pricingPlanKind: z.enum(PRICING_PLAN_KINDS).nullable().default(null),
  })
  .strict();

const AuditActorSchema = z
  .object({
    actorId: z.string().trim().min(1).max(160),
    actorKind: z.enum(PRICING_CONTROL_ACTOR_KINDS),
  })
  .strict();

const AuditExplainabilitySchema = z
  .object({
    factors: z.array(z.enum(EXPLAINABILITY_FACTORS)).min(1),
    summary: z.string().trim().min(1).max(500),
  })
  .strict();

const AdminPricingControlAuditEventSchema = z
  .object({
    eventType: z.enum(PRICING_CONTROL_AUDIT_EVENT_TYPES),
    eventAt: z.coerce.date(),
    scope: AuditScopeSchema,
    actor: AuditActorSchema,
    source: z.enum(POLICY_SOURCES),
    changedFields: z.array(z.enum(PRICING_CONTROL_CHANGED_FIELDS)).default([]),
    reason: z.string().trim().min(1).max(500).nullable().default(null),
    explainability: AuditExplainabilitySchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const isMutationEvent = value.eventType !== "policy_evaluated";
    if (isMutationEvent && value.changedFields.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["changedFields"],
        message: "changed_fields_required_for_mutation_event",
      });
    }

    const requiresReason = value.changedFields.some((field) =>
      PRICING_CONTROL_REASON_REQUIRED_FIELDS.includes(
        field as (typeof PRICING_CONTROL_REASON_REQUIRED_FIELDS)[number],
      ),
    );
    if ((isMutationEvent || requiresReason) && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason_required_for_mutation_event",
      });
    }

    if (isMutationEvent && value.source === "policy_default") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["source"],
        message: "mutation_event_requires_non_default_source",
      });
    }

    if (value.scope.targetKind === "global_policy" && value.scope.targetId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scope", "targetId"],
        message: "global_policy_target_must_not_have_target_id",
      });
    }
  });

const NonNegativeIntSchema = z.number().int().min(0);

const AdminPricingControlKpiSnapshotSchema = z
  .object({
    snapshotAt: z.coerce.date(),
    window: z.enum(PRICING_CONTROL_KPI_WINDOWS),
    activeAnlassraeume: NonNegativeIntSchema,
    activeDossiers: NonNegativeIntSchema,
    professionalLayerUsage: NonNegativeIntSchema,
    fundingVolume: NonNegativeIntSchema,
    fundingFeeRevenue: NonNegativeIntSchema,
    exportUsage: NonNegativeIntSchema,
    embedUsage: NonNegativeIntSchema,
    qrUsage: NonNegativeIntSchema,
    reviewUsage: NonNegativeIntSchema,
    factcheckUsage: NonNegativeIntSchema,
    conversionFreeToCreator: NonNegativeIntSchema,
    conversionCreatorToTeam: NonNegativeIntSchema,
    conversionTeamToOrganization: NonNegativeIntSchema,
    specialsUsage: NonNegativeIntSchema,
    pilotUsage: NonNegativeIntSchema,
    overrideUsage: NonNegativeIntSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.fundingFeeRevenue > value.fundingVolume) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fundingFeeRevenue"],
        message: "funding_fee_revenue_cannot_exceed_funding_volume",
      });
    }
  });

const ContractSchema = z
  .object({
    segment: z.enum(PRICING_SEGMENTS),
    creatorType: z.enum(CREATOR_TYPES),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    pricingPlanKind: z.enum(PRICING_PLAN_KINDS),
    institutionType: z.enum(INSTITUTION_TYPES).default("none"),
    publicEntityFlag: z.boolean().default(false),
    feeRuleType: z.enum(FEE_RULE_TYPES),
    capPolicyType: z.enum(CAP_POLICY_TYPES),
    overrideType: z.enum(OVERRIDE_TYPES).default("none"),
    specialOfferStatus: z.enum(SPECIAL_OFFER_STATUSES).default("none"),
    pilotStatus: z.enum(PILOT_STATUSES).default("none"),
    reason: z.string().trim().min(1).max(500).nullish(),
    changedBy: z.string().trim().min(1).max(160).nullish(),
    changedAt: z.coerce.date().nullish(),
    source: z.enum(POLICY_SOURCES).default("policy_default"),
    explainability: ExplainabilitySchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const creatorBySegment: Record<(typeof PRICING_SEGMENTS)[number], (typeof CREATOR_TYPES)[number]> = {
      public_free: "civic",
      civic_creator: "civic",
      media_creator: "media",
      team_organization: "publisher_agency",
      municipality_public: "publisher_agency",
      enterprise_sonderfall: "publisher_agency",
    };
    if (value.creatorType !== creatorBySegment[value.segment]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creatorType"],
        message: "creator_type_incompatible_with_segment",
      });
    }

    const planBySegment: Record<(typeof PRICING_SEGMENTS)[number], (typeof PRICING_PLAN_KINDS)[number]> = {
      public_free: "public_core",
      civic_creator: "professional_creator",
      media_creator: "professional_creator",
      team_organization: "professional_team",
      municipality_public: "professional_municipality",
      enterprise_sonderfall: "enterprise_special",
    };
    if (value.pricingPlanKind !== planBySegment[value.segment]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pricingPlanKind"],
        message: "plan_kind_incompatible_with_segment",
      });
    }

    if (value.segment === "municipality_public") {
      if (value.verificationStatus !== "verified") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["verificationStatus"],
          message: "municipality_requires_verified_status",
        });
      }
      if (value.institutionType === "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["institutionType"],
          message: "municipality_requires_institution_type",
        });
      }
      if (!value.publicEntityFlag) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publicEntityFlag"],
          message: "municipality_requires_public_entity_flag",
        });
      }
    }

    if (value.segment === "public_free") {
      if (value.feeRuleType !== "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["feeRuleType"],
          message: "public_core_cannot_have_fee_rule",
        });
      }
      if (value.capPolicyType !== "none" && value.capPolicyType !== "default_caps") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capPolicyType"],
          message: "public_core_invalid_cap_policy",
        });
      }
    }

    const hasMutableDecision =
      value.overrideType !== "none" || value.specialOfferStatus !== "none" || value.pilotStatus !== "none";
    if (hasMutableDecision) {
      if (!value.reason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reason"],
          message: "reason_required_for_override_or_special",
        });
      }
      if (!value.changedBy) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["changedBy"],
          message: "changed_by_required_for_override_or_special",
        });
      }
      if (!value.changedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["changedAt"],
          message: "changed_at_required_for_override_or_special",
        });
      }
      if (value.source === "policy_default") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["source"],
          message: "source_must_reflect_override_or_special",
        });
      }
    }
  });

export type AdminPricingControlPolicyContract = z.infer<typeof ContractSchema>;

export type AdminPricingControlParseResult =
  | { ok: true; value: AdminPricingControlPolicyContract }
  | { ok: false; error: string; issues: string[] };
export type AdminPricingControlAuditEventContract = z.infer<typeof AdminPricingControlAuditEventSchema>;
export type AdminPricingControlKpiSnapshotContract = z.infer<typeof AdminPricingControlKpiSnapshotSchema>;
export type AdminPricingControlAuditEventParseResult =
  | { ok: true; value: AdminPricingControlAuditEventContract }
  | { ok: false; error: string; issues: string[] };
export type AdminPricingControlKpiSnapshotParseResult =
  | { ok: true; value: AdminPricingControlKpiSnapshotContract }
  | { ok: false; error: string; issues: string[] };

export function parseAdminPricingControlPolicyContract(input: unknown): AdminPricingControlParseResult {
  const parsed = ContractSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_admin_pricing_control_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function buildAdminPricingControlAuditFields(contract: AdminPricingControlPolicyContract) {
  return {
    pricingSegment: contract.segment,
    pricingPlanKind: contract.pricingPlanKind,
    pricingCreatorType: contract.creatorType,
    pricingVerificationStatus: contract.verificationStatus,
    pricingInstitutionType: contract.institutionType,
    pricingPublicEntity: contract.publicEntityFlag,
    pricingFeeRuleType: contract.feeRuleType,
    pricingCapPolicyType: contract.capPolicyType,
    pricingOverrideType: contract.overrideType,
    pricingSpecialOfferStatus: contract.specialOfferStatus,
    pricingPilotStatus: contract.pilotStatus,
    pricingPolicySource: contract.source,
    pricingOverrideReason: contract.reason ?? null,
    pricingChangedBy: contract.changedBy ?? null,
    pricingChangedAt: contract.changedAt ? contract.changedAt.toISOString() : null,
  } as const;
}

export function parseAdminPricingControlAuditEventContract(
  input: unknown,
): AdminPricingControlAuditEventParseResult {
  const parsed = AdminPricingControlAuditEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_admin_pricing_control_audit_event_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function parseAdminPricingControlKpiSnapshotContract(
  input: unknown,
): AdminPricingControlKpiSnapshotParseResult {
  const parsed = AdminPricingControlKpiSnapshotSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_admin_pricing_control_kpi_snapshot_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}
