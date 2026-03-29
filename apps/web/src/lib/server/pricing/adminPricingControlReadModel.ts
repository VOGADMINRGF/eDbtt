import {
  parseAdminPricingControlAuditEventContract,
  parseAdminPricingControlKpiSnapshotContract,
  parseAdminPricingControlPolicyContract,
  type AdminPricingControlAuditEventContract,
  type AdminPricingControlKpiSnapshotContract,
  type AdminPricingControlPolicyContract,
} from "@/lib/server/pricing/adminPricingControlContract";

export type AdminPricingControlReadModelInput = {
  policy: unknown;
  latestAuditEvent?: unknown;
  kpiSnapshot?: unknown;
  sourceOfTruthHints?: string[];
};

export type AdminPricingControlReadModel = {
  currentSegment: AdminPricingControlPolicyContract["segment"];
  currentPlanKind: AdminPricingControlPolicyContract["pricingPlanKind"];
  verificationStatus: AdminPricingControlPolicyContract["verificationStatus"];
  creatorType: AdminPricingControlPolicyContract["creatorType"];
  institutionStatus: {
    institutionType: AdminPricingControlPolicyContract["institutionType"];
    publicEntityFlag: boolean;
    verifiedInstitutionalPath: boolean;
  };
  currentFeeRule: AdminPricingControlPolicyContract["feeRuleType"];
  currentCapPolicy: AdminPricingControlPolicyContract["capPolicyType"];
  activeOverrides: {
    overrideType: AdminPricingControlPolicyContract["overrideType"];
    specialOfferStatus: AdminPricingControlPolicyContract["specialOfferStatus"];
    pilotStatus: AdminPricingControlPolicyContract["pilotStatus"];
    hasActiveOverride: boolean;
  };
  explainabilityItems: Array<{
    dimension: "segment" | "plan" | "fee" | "specialStatus";
    factors: string[];
    note: string;
  }>;
  explainabilitySummary: string[];
  auditState: {
    status: "present" | "absent" | "invalid";
    eventType: AdminPricingControlAuditEventContract["eventType"] | null;
    changedFields: string[];
    reason: string | null;
    issues: string[];
  };
  kpiSummary: {
    status: "present" | "absent" | "invalid";
    window: AdminPricingControlKpiSnapshotContract["window"] | null;
    snapshotAt: string | null;
    usageTotals: {
      professionalLayerUsage: number;
      reviewUsage: number;
      factcheckUsage: number;
      exportUsage: number;
      embedUsage: number;
      qrUsage: number;
    } | null;
    fundingTotals: {
      fundingVolume: number;
      fundingFeeRevenue: number;
    } | null;
    conversionTotals: {
      freeToCreator: number;
      creatorToTeam: number;
      teamToOrganization: number;
    } | null;
    issues: string[];
  };
  sourceOfTruth: {
    policySource: AdminPricingControlPolicyContract["source"];
    sourceOfTruthHints: string[];
    resolutionState: "resolved";
  };
  guardrails: {
    forbiddenPricingAxes: readonly string[];
    rewardStyleMechanicsBlocked: readonly string[];
  };
};

export type AdminPricingControlReadModelResult =
  | { ok: true; value: AdminPricingControlReadModel }
  | { ok: false; error: "invalid_pricing_control_readmodel_policy"; issues: string[] };

const FORBIDDEN_PRICING_AXES = [
  "truth_status",
  "fact_status",
  "signal_height",
  "vote_result",
  "debate_outcome",
] as const;

const REWARD_STYLE_MECHANICS_BLOCKED = [
  "community_points",
  "credits",
  "tokens",
  "earn_to_participate",
] as const;

function buildExplainabilityItems(contract: AdminPricingControlPolicyContract) {
  return [
    {
      dimension: "segment" as const,
      factors: [...contract.explainability.segment.factors],
      note: contract.explainability.segment.note,
    },
    {
      dimension: "plan" as const,
      factors: [...contract.explainability.plan.factors],
      note: contract.explainability.plan.note,
    },
    {
      dimension: "fee" as const,
      factors: [...contract.explainability.fee.factors],
      note: contract.explainability.fee.note,
    },
    {
      dimension: "specialStatus" as const,
      factors: [...contract.explainability.specialStatus.factors],
      note: contract.explainability.specialStatus.note,
    },
  ];
}

function resolveAuditState(input: unknown): AdminPricingControlReadModel["auditState"] {
  if (typeof input === "undefined") {
    return {
      status: "absent",
      eventType: null,
      changedFields: [],
      reason: null,
      issues: [],
    };
  }
  const parsed = parseAdminPricingControlAuditEventContract(input);
  if (parsed.ok === false) {
    return {
      status: "invalid",
      eventType: null,
      changedFields: [],
      reason: null,
      issues: parsed.issues,
    };
  }
  return {
    status: "present",
    eventType: parsed.value.eventType,
    changedFields: parsed.value.changedFields,
    reason: parsed.value.reason ?? null,
    issues: [],
  };
}

function resolveKpiSummary(input: unknown): AdminPricingControlReadModel["kpiSummary"] {
  if (typeof input === "undefined") {
    return {
      status: "absent",
      window: null,
      snapshotAt: null,
      usageTotals: null,
      fundingTotals: null,
      conversionTotals: null,
      issues: [],
    };
  }
  const parsed = parseAdminPricingControlKpiSnapshotContract(input);
  if (parsed.ok === false) {
    return {
      status: "invalid",
      window: null,
      snapshotAt: null,
      usageTotals: null,
      fundingTotals: null,
      conversionTotals: null,
      issues: parsed.issues,
    };
  }
  const kpi = parsed.value;
  return {
    status: "present",
    window: kpi.window,
    snapshotAt: kpi.snapshotAt.toISOString(),
    usageTotals: {
      professionalLayerUsage: kpi.professionalLayerUsage,
      reviewUsage: kpi.reviewUsage,
      factcheckUsage: kpi.factcheckUsage,
      exportUsage: kpi.exportUsage,
      embedUsage: kpi.embedUsage,
      qrUsage: kpi.qrUsage,
    },
    fundingTotals: {
      fundingVolume: kpi.fundingVolume,
      fundingFeeRevenue: kpi.fundingFeeRevenue,
    },
    conversionTotals: {
      freeToCreator: kpi.conversionFreeToCreator,
      creatorToTeam: kpi.conversionCreatorToTeam,
      teamToOrganization: kpi.conversionTeamToOrganization,
    },
    issues: [],
  };
}

export function buildAdminPricingControlReadModel(
  input: AdminPricingControlReadModelInput,
): AdminPricingControlReadModelResult {
  const policyParsed = parseAdminPricingControlPolicyContract(input.policy);
  if (policyParsed.ok === false) {
    return {
      ok: false,
      error: "invalid_pricing_control_readmodel_policy",
      issues: policyParsed.issues,
    };
  }

  const policy = policyParsed.value;
  const explainabilityItems = buildExplainabilityItems(policy);
  const auditState = resolveAuditState(input.latestAuditEvent);
  const kpiSummary = resolveKpiSummary(input.kpiSnapshot);
  const hasActiveOverride =
    policy.overrideType !== "none" ||
    policy.specialOfferStatus !== "none" ||
    policy.pilotStatus !== "none";

  return {
    ok: true,
    value: {
      currentSegment: policy.segment,
      currentPlanKind: policy.pricingPlanKind,
      verificationStatus: policy.verificationStatus,
      creatorType: policy.creatorType,
      institutionStatus: {
        institutionType: policy.institutionType,
        publicEntityFlag: policy.publicEntityFlag,
        verifiedInstitutionalPath:
          policy.segment === "municipality_public" &&
          policy.verificationStatus === "verified" &&
          policy.publicEntityFlag,
      },
      currentFeeRule: policy.feeRuleType,
      currentCapPolicy: policy.capPolicyType,
      activeOverrides: {
        overrideType: policy.overrideType,
        specialOfferStatus: policy.specialOfferStatus,
        pilotStatus: policy.pilotStatus,
        hasActiveOverride,
      },
      explainabilityItems,
      explainabilitySummary: explainabilityItems.map((item) => item.note),
      auditState,
      kpiSummary,
      sourceOfTruth: {
        policySource: policy.source,
        sourceOfTruthHints: input.sourceOfTruthHints ?? [],
        resolutionState: "resolved",
      },
      guardrails: {
        forbiddenPricingAxes: FORBIDDEN_PRICING_AXES,
        rewardStyleMechanicsBlocked: REWARD_STYLE_MECHANICS_BLOCKED,
      },
    },
  };
}
