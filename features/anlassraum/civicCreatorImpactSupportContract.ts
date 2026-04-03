import { z } from "zod";
import type { CivicCreatorLifecycleContract } from "@features/anlassraum/civicCreatorLifecycleContract";
import type { CivicCreatorRepresentationContract } from "@features/anlassraum/civicCreatorRepresentationContract";

export const CIVIC_IMPACT_SUPPORT_TYPES = [
  "participation_support",
  "context_support",
  "format_support",
  "followup_support",
  "regional_visibility_support",
  "documentation_support",
] as const;

export const CIVIC_IMPACT_CONTEXTS = [
  "participation_visible",
  "context_followup_visible",
  "dossier_followup_visible",
  "companion_context_visible",
  "stream_context_visible",
  "regional_visibility_noted",
  "documentation_trace",
] as const;

const CivicImpactSupportSchema = z
  .object({
    lifecycleStatus: z.string().trim().min(1).max(80),
    workProfile: z.string().trim().min(1).max(80),
    workLevel: z.string().trim().min(1).max(80),
    supportTypes: z.array(z.enum(CIVIC_IMPACT_SUPPORT_TYPES)).min(1),
    impactContexts: z.array(z.enum(CIVIC_IMPACT_CONTEXTS)).min(1),
    visibility: z
      .object({
        publicCoreVisible: z.literal(true),
        supportVisibleAsContext: z.literal(true),
        impactVisibleAsTrace: z.literal(true),
      })
      .strict(),
    explainability: z
      .object({
        reasonRequired: z.literal(true),
        auditFieldsRequired: z.tuple([
          z.literal("lifecycleStatus"),
          z.literal("supportType"),
          z.literal("impactContext"),
          z.literal("changedBy"),
          z.literal("changedAt"),
          z.literal("source"),
        ]),
      })
      .strict(),
    guardrails: z
      .object({
        keepsAnlassraumOpen: z.literal(true),
        keepsDossierAsUpperContext: z.literal(true),
        keepsCompanionAsFormatNotTruth: z.literal(true),
        keepsStreamAsFormatNotTruth: z.literal(true),
        keepsSupportNonMonetaryByDefault: z.literal(true),
        keepsTopicRegionSeparated: z.literal(true),
        forbidsTruthPrivilege: z.literal(true),
        forbidsPriorityPrivilege: z.literal(true),
        forbidsVotingPrivilege: z.literal(true),
        forbidsFactStatusPrivilege: z.literal(true),
        forbidsAgendaMonopoly: z.literal(true),
        forbidsRankingBoostFromSupport: z.literal(true),
      })
      .strict(),
    forbiddenMeanings: z
      .tuple([
        z.literal("support_is_not_truth"),
        z.literal("support_is_not_priority"),
        z.literal("support_is_not_vote_weight"),
        z.literal("support_is_not_fact_status"),
        z.literal("support_is_not_institutional_hoheit"),
      ]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      (value.lifecycleStatus === "initiated" || value.lifecycleStatus === "open_followup") &&
      (value.supportTypes.includes("format_support") || value.supportTypes.includes("followup_support"))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supportTypes"],
        message: "early_lifecycle_must_not_enable_format_or_followup_support",
      });
    }

    if (
      (value.lifecycleStatus === "closed_context" || value.lifecycleStatus === "archived") &&
      value.supportTypes.some((support) => support !== "documentation_support")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supportTypes"],
        message: "closed_or_archived_lifecycle_must_only_keep_documentation_support",
      });
    }
  });

export type CivicImpactSupportType = (typeof CIVIC_IMPACT_SUPPORT_TYPES)[number];
export type CivicImpactContext = (typeof CIVIC_IMPACT_CONTEXTS)[number];
export type CivicCreatorImpactSupportContract = z.infer<typeof CivicImpactSupportSchema>;
export type CivicCreatorImpactSupportParseResult =
  | { ok: true; value: CivicCreatorImpactSupportContract }
  | { ok: false; error: string; issues: string[] };

export type CivicCreatorImpactSupportConsistency = {
  ok: boolean;
  issues: string[];
};

const SUPPORT_TYPES_BY_LIFECYCLE: Record<string, readonly CivicImpactSupportType[]> = {
  initiated: ["participation_support", "documentation_support"],
  open_followup: ["participation_support", "context_support", "documentation_support"],
  accompanied: [
    "participation_support",
    "context_support",
    "followup_support",
    "documentation_support",
  ],
  dossier_linked: [
    "context_support",
    "format_support",
    "followup_support",
    "regional_visibility_support",
    "documentation_support",
  ],
  companion_active: [
    "context_support",
    "format_support",
    "followup_support",
    "regional_visibility_support",
    "documentation_support",
  ],
  stream_active: [
    "context_support",
    "format_support",
    "followup_support",
    "regional_visibility_support",
    "documentation_support",
  ],
  paused: ["context_support", "documentation_support"],
  closed_context: ["documentation_support"],
  archived: ["documentation_support"],
};

function filterSupportByCapabilities(
  supportTypes: readonly CivicImpactSupportType[],
  representationContract: CivicCreatorRepresentationContract,
): CivicImpactSupportType[] {
  return supportTypes.filter((supportType) => {
    if (supportType === "format_support") {
      return (
        representationContract.allowsCompanionEmbedQrUsage ||
        representationContract.allowsStreamCompanionUsage
      );
    }
    if (supportType === "followup_support") {
      return (
        representationContract.allowsAnlassraumContinuation ||
        representationContract.allowsDossierCompanionCuration
      );
    }
    if (supportType === "regional_visibility_support") {
      return representationContract.representationAxes.region !== "none";
    }
    return true;
  });
}

function deriveImpactContexts(input: {
  lifecycleStatus: string;
  supportTypes: readonly CivicImpactSupportType[];
}): CivicImpactContext[] {
  const contexts = new Set<CivicImpactContext>(["documentation_trace"]);
  if (input.supportTypes.includes("participation_support")) {
    contexts.add("participation_visible");
  }
  if (input.supportTypes.includes("context_support")) {
    contexts.add("context_followup_visible");
  }
  if (input.supportTypes.includes("followup_support") || input.lifecycleStatus === "dossier_linked") {
    contexts.add("dossier_followup_visible");
  }
  if (input.lifecycleStatus === "companion_active" && input.supportTypes.includes("format_support")) {
    contexts.add("companion_context_visible");
  }
  if (input.lifecycleStatus === "stream_active" && input.supportTypes.includes("format_support")) {
    contexts.add("stream_context_visible");
  }
  if (input.supportTypes.includes("regional_visibility_support")) {
    contexts.add("regional_visibility_noted");
  }
  return Array.from(contexts);
}

export function resolveCivicCreatorImpactSupportContract(input: {
  lifecycleContract: CivicCreatorLifecycleContract;
  representationContract: CivicCreatorRepresentationContract;
}): CivicCreatorImpactSupportContract {
  const lifecycleStatus = input.lifecycleContract.currentStatus;
  const supportCandidates =
    SUPPORT_TYPES_BY_LIFECYCLE[lifecycleStatus] ?? SUPPORT_TYPES_BY_LIFECYCLE.initiated;
  const supportTypes = filterSupportByCapabilities(
    supportCandidates,
    input.representationContract,
  );
  const impactContexts = deriveImpactContexts({
    lifecycleStatus,
    supportTypes,
  });

  return CivicImpactSupportSchema.parse({
    lifecycleStatus,
    workProfile: input.lifecycleContract.workProfile,
    workLevel: input.lifecycleContract.workLevel,
    supportTypes,
    impactContexts,
    visibility: {
      publicCoreVisible: true,
      supportVisibleAsContext: true,
      impactVisibleAsTrace: true,
    },
    explainability: {
      reasonRequired: true,
      auditFieldsRequired: [
        "lifecycleStatus",
        "supportType",
        "impactContext",
        "changedBy",
        "changedAt",
        "source",
      ],
    },
    guardrails: {
      keepsAnlassraumOpen: true,
      keepsDossierAsUpperContext: true,
      keepsCompanionAsFormatNotTruth: true,
      keepsStreamAsFormatNotTruth: true,
      keepsSupportNonMonetaryByDefault: true,
      keepsTopicRegionSeparated: true,
      forbidsTruthPrivilege: true,
      forbidsPriorityPrivilege: true,
      forbidsVotingPrivilege: true,
      forbidsFactStatusPrivilege: true,
      forbidsAgendaMonopoly: true,
      forbidsRankingBoostFromSupport: true,
    },
    forbiddenMeanings: [
      "support_is_not_truth",
      "support_is_not_priority",
      "support_is_not_vote_weight",
      "support_is_not_fact_status",
      "support_is_not_institutional_hoheit",
    ],
  });
}

export function parseCivicCreatorImpactSupportContract(
  input: unknown,
): CivicCreatorImpactSupportParseResult {
  const parsed = CivicImpactSupportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_civic_creator_impact_support_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function validateCivicCreatorImpactSupportConsistency(input: {
  supportContract: CivicCreatorImpactSupportContract;
  lifecycleContract: CivicCreatorLifecycleContract;
  representationContract: CivicCreatorRepresentationContract;
  journalismRoleProfile?: unknown;
  orgContextProfile?: unknown;
}): CivicCreatorImpactSupportConsistency {
  const issues: string[] = [];
  const { supportContract, lifecycleContract, representationContract } = input;

  if (supportContract.lifecycleStatus !== lifecycleContract.currentStatus) {
    issues.push("support_contract_lifecycle_status_must_match_lifecycle_contract_status");
  }

  if (
    supportContract.supportTypes.includes("regional_visibility_support") &&
    representationContract.representationAxes.region === "none"
  ) {
    issues.push("regional_visibility_support_requires_region_representation_axis");
  }

  if (
    supportContract.supportTypes.includes("format_support") &&
    !(
      representationContract.allowsCompanionEmbedQrUsage ||
      representationContract.allowsStreamCompanionUsage
    )
  ) {
    issues.push("format_support_requires_companion_or_stream_capability");
  }

  if (
    (supportContract.lifecycleStatus === "initiated" ||
      supportContract.lifecycleStatus === "open_followup") &&
    supportContract.supportTypes.includes("followup_support")
  ) {
    issues.push("followup_support_requires_at_least_accompanied_lifecycle");
  }

  if (
    supportContract.lifecycleStatus === "stream_active" &&
    typeof input.orgContextProfile === "string" &&
    input.orgContextProfile.trim().toLowerCase() === "institutional_organization"
  ) {
    issues.push("institutional_organization_context_must_not_use_stream_active_support_mode");
  }

  if (
    supportContract.lifecycleStatus === "stream_active" &&
    typeof input.journalismRoleProfile === "string" &&
    input.journalismRoleProfile.trim().toLowerCase() === "public_journalism_context"
  ) {
    issues.push("public_journalism_context_must_not_use_stream_active_support_mode");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function buildCivicCreatorImpactSupportBaseline(input: {
  lifecycleContract: CivicCreatorLifecycleContract;
  representationContract: CivicCreatorRepresentationContract;
}): CivicCreatorImpactSupportContract {
  return resolveCivicCreatorImpactSupportContract(input);
}

export function buildCivicCreatorImpactSupportDisclosure(contract: CivicCreatorImpactSupportContract) {
  return {
    lifecycleStatus: contract.lifecycleStatus,
    workProfile: contract.workProfile,
    workLevel: contract.workLevel,
    supportTypes: contract.supportTypes,
    impactContexts: contract.impactContexts,
  } as const;
}
