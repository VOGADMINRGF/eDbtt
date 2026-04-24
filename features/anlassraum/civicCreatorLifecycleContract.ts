import { z } from "zod";
import type {
  CivicCreatorRepresentationContract,
  CivicCreatorWorkLevel,
  CivicCreatorWorkProfile,
  RepresentationLevel,
} from "@features/anlassraum/civicCreatorRepresentationContract";

export const CIVIC_CREATOR_LIFECYCLE_STATUSES = [
  "initiated",
  "open_followup",
  "accompanied",
  "dossier_linked",
  "companion_active",
  "stream_active",
  "paused",
  "closed_context",
  "archived",
] as const;

export type CivicCreatorLifecycleStatus = (typeof CIVIC_CREATOR_LIFECYCLE_STATUSES)[number];

type LifecycleContextScope = "anlassraum_followup" | "dossier_followup" | "closed_or_archived";

const BASE_TRANSITIONS: Record<CivicCreatorLifecycleStatus, readonly CivicCreatorLifecycleStatus[]> = {
  initiated: ["open_followup", "accompanied", "paused", "closed_context"],
  open_followup: ["accompanied", "dossier_linked", "paused", "closed_context"],
  accompanied: ["dossier_linked", "companion_active", "paused", "closed_context"],
  dossier_linked: ["companion_active", "stream_active", "paused", "closed_context"],
  companion_active: ["stream_active", "dossier_linked", "paused", "closed_context"],
  stream_active: ["companion_active", "dossier_linked", "paused", "closed_context"],
  paused: [
    "open_followup",
    "accompanied",
    "dossier_linked",
    "companion_active",
    "stream_active",
    "closed_context",
  ],
  closed_context: ["archived"],
  archived: [],
} as const;

const CivicCreatorLifecycleSchema = z
  .object({
    workProfile: z.string().trim().min(1).max(80),
    workLevel: z.string().trim().min(1).max(80),
    currentStatus: z.enum(CIVIC_CREATOR_LIFECYCLE_STATUSES),
    previousStatus: z.enum(CIVIC_CREATOR_LIFECYCLE_STATUSES).nullable(),
    lifecycleContextScope: z.enum(["anlassraum_followup", "dossier_followup", "closed_or_archived"]),
    allowedTransitions: z.array(z.enum(CIVIC_CREATOR_LIFECYCLE_STATUSES)),
    blockedTransitions: z.array(z.enum(CIVIC_CREATOR_LIFECYCLE_STATUSES)),
    representationAxes: z
      .object({
        topic: z.string().trim().min(1).max(40),
        region: z.string().trim().min(1).max(40),
        separatedAxes: z.literal(true),
        forbidsCrossAxisShortcut: z.literal(true),
      })
      .strict(),
    capabilities: z
      .object({
        allowsOnlyParticipation: z.boolean(),
        allowsAnlassraumHosting: z.boolean(),
        allowsDossierCompanionCuration: z.boolean(),
        allowsCompanionEmbedQrUsage: z.boolean(),
        allowsStreamCompanionUsage: z.boolean(),
      })
      .strict(),
    explainability: z
      .object({
        reasonRequiredForTransitions: z.literal(true),
        auditFieldsRequired: z.tuple([
          z.literal("currentStatus"),
          z.literal("previousStatus"),
          z.literal("targetStatus"),
          z.literal("changedBy"),
          z.literal("changedAt"),
          z.literal("source"),
        ]),
      })
      .strict(),
    guardrails: z
      .object({
        keepsAnlassraumInitiable: z.literal(true),
        keepsDossierAsOpenKnowledgeCore: z.literal(true),
        keepsCompanionAsFormatNotTruth: z.literal(true),
        keepsStreamAsFormatNotTruth: z.literal(true),
        keepsTopicRegionSeparated: z.literal(true),
        forbidsTruthPrivilege: z.literal(true),
        forbidsPriorityPrivilege: z.literal(true),
        forbidsVotingPrivilege: z.literal(true),
        forbidsFactStatusPrivilege: z.literal(true),
        forbidsRepresentationPriorityShortcut: z.literal(true),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const allowedTransitions = Array.isArray(value.allowedTransitions) ? value.allowedTransitions : [];

    if (value.currentStatus === "archived" && allowedTransitions.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedTransitions"],
        message: "archived_status_must_not_allow_outgoing_transitions",
      });
    }

    if (
      value.capabilities.allowsOnlyParticipation &&
      (allowedTransitions.includes("dossier_linked") ||
        allowedTransitions.includes("companion_active") ||
        allowedTransitions.includes("stream_active"))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedTransitions"],
        message: "participation_only_profile_must_not_gain_dossier_or_stream_lifecycle_transitions",
      });
    }

    if (
      value.currentStatus === "stream_active" &&
      !value.capabilities.allowsStreamCompanionUsage
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentStatus"],
        message: "stream_active_requires_stream_capability",
      });
    }

    if (
      value.currentStatus === "companion_active" &&
      !value.capabilities.allowsCompanionEmbedQrUsage
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentStatus"],
        message: "companion_active_requires_companion_capability",
      });
    }
  });

export type CivicCreatorLifecycleContract = z.infer<typeof CivicCreatorLifecycleSchema>;
export type CivicCreatorLifecycleParseResult =
  | { ok: true; value: CivicCreatorLifecycleContract }
  | { ok: false; error: string; issues: string[] };

export type CivicCreatorLifecycleTransitionResult = {
  ok: boolean;
  fromStatus: CivicCreatorLifecycleStatus;
  toStatus: CivicCreatorLifecycleStatus | null;
  requiredReason: true;
  allowedTransitions: readonly CivicCreatorLifecycleStatus[];
  issues: string[];
};

export type CivicCreatorLifecycleConsistency = {
  ok: boolean;
  issues: string[];
};

function normalizeLifecycleStatus(value: unknown): CivicCreatorLifecycleStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (CIVIC_CREATOR_LIFECYCLE_STATUSES.includes(normalized as CivicCreatorLifecycleStatus)) {
    return normalized as CivicCreatorLifecycleStatus;
  }
  return null;
}

function resolveLifecycleScope(status: CivicCreatorLifecycleStatus): LifecycleContextScope {
  if (status === "dossier_linked" || status === "companion_active" || status === "stream_active") {
    return "dossier_followup";
  }
  if (status === "closed_context" || status === "archived") {
    return "closed_or_archived";
  }
  return "anlassraum_followup";
}

function canTransitionTo(
  target: CivicCreatorLifecycleStatus,
  representationContract: CivicCreatorRepresentationContract,
): boolean {
  if (representationContract.allowsOnlyParticipation) {
    return (
      target === "open_followup" ||
      target === "paused" ||
      target === "closed_context" ||
      target === "archived"
    );
  }

  if (target === "accompanied") {
    return (
      representationContract.allowsAnlassraumHosting ||
      representationContract.allowsAnlassraumContinuation
    );
  }
  if (target === "dossier_linked") {
    return representationContract.allowsDossierCompanionCuration;
  }
  if (target === "companion_active") {
    return representationContract.allowsCompanionEmbedQrUsage;
  }
  if (target === "stream_active") {
    return representationContract.allowsStreamCompanionUsage;
  }
  return true;
}

function resolveAllowedTransitions(
  currentStatus: CivicCreatorLifecycleStatus,
  representationContract: CivicCreatorRepresentationContract,
): CivicCreatorLifecycleStatus[] {
  const base = BASE_TRANSITIONS[currentStatus];
  return base.filter((target) => canTransitionTo(target, representationContract));
}

function resolveBlockedTransitions(
  currentStatus: CivicCreatorLifecycleStatus,
  allowedTransitions: readonly CivicCreatorLifecycleStatus[],
): CivicCreatorLifecycleStatus[] {
  return CIVIC_CREATOR_LIFECYCLE_STATUSES.filter(
    (candidate) => candidate !== currentStatus && !allowedTransitions.includes(candidate),
  );
}

export function resolveCivicCreatorLifecycleContract(input: {
  representationContract: CivicCreatorRepresentationContract;
  currentStatus?: unknown;
  previousStatus?: unknown;
}): CivicCreatorLifecycleContract {
  const currentStatus = normalizeLifecycleStatus(input.currentStatus) ?? "initiated";
  const previousStatus = normalizeLifecycleStatus(input.previousStatus);
  const allowedTransitions = resolveAllowedTransitions(currentStatus, input.representationContract);
  const blockedTransitions = resolveBlockedTransitions(currentStatus, allowedTransitions);

  return CivicCreatorLifecycleSchema.parse({
    workProfile: input.representationContract.workProfile,
    workLevel: input.representationContract.workLevel,
    currentStatus,
    previousStatus,
    lifecycleContextScope: resolveLifecycleScope(currentStatus),
    allowedTransitions,
    blockedTransitions,
    representationAxes: {
      topic: input.representationContract.representationAxes.topic,
      region: input.representationContract.representationAxes.region,
      separatedAxes: true,
      forbidsCrossAxisShortcut: true,
    },
    capabilities: {
      allowsOnlyParticipation: input.representationContract.allowsOnlyParticipation,
      allowsAnlassraumHosting:
        input.representationContract.allowsAnlassraumHosting ||
        input.representationContract.allowsAnlassraumContinuation,
      allowsDossierCompanionCuration: input.representationContract.allowsDossierCompanionCuration,
      allowsCompanionEmbedQrUsage: input.representationContract.allowsCompanionEmbedQrUsage,
      allowsStreamCompanionUsage: input.representationContract.allowsStreamCompanionUsage,
    },
    explainability: {
      reasonRequiredForTransitions: true,
      auditFieldsRequired: [
        "currentStatus",
        "previousStatus",
        "targetStatus",
        "changedBy",
        "changedAt",
        "source",
      ],
    },
    guardrails: {
      keepsAnlassraumInitiable: true,
      keepsDossierAsOpenKnowledgeCore: true,
      keepsCompanionAsFormatNotTruth: true,
      keepsStreamAsFormatNotTruth: true,
      keepsTopicRegionSeparated: true,
      forbidsTruthPrivilege: true,
      forbidsPriorityPrivilege: true,
      forbidsVotingPrivilege: true,
      forbidsFactStatusPrivilege: true,
      forbidsRepresentationPriorityShortcut: true,
    },
  });
}

export function evaluateCivicCreatorLifecycleTransition(input: {
  representationContract: CivicCreatorRepresentationContract;
  fromStatus: unknown;
  toStatus: unknown;
}): CivicCreatorLifecycleTransitionResult {
  const fromStatus = normalizeLifecycleStatus(input.fromStatus) ?? "initiated";
  const toStatus = normalizeLifecycleStatus(input.toStatus);
  const allowedTransitions = resolveAllowedTransitions(fromStatus, input.representationContract);
  const issues: string[] = [];

  if (!toStatus) {
    issues.push("invalid_target_status");
  } else if (!allowedTransitions.includes(toStatus)) {
    issues.push("transition_not_allowed_for_profile_or_capabilities");
  }

  if (!input.representationContract.guardrails.keepsCompanionBoundToOpenDossierCore) {
    issues.push("companion_must_stay_bound_to_open_dossier_core");
  }
  if (
    !input.representationContract.guardrails.forbidsTruthPrivilege ||
    !input.representationContract.guardrails.forbidsPriorityPrivilege ||
    !input.representationContract.guardrails.forbidsVotingPrivilege ||
    !input.representationContract.guardrails.forbidsFactStatusPrivilege
  ) {
    issues.push("representation_guardrails_must_forbid_truth_priority_voting_fact_privileges");
  }

  return {
    ok: issues.length === 0,
    fromStatus,
    toStatus,
    requiredReason: true,
    allowedTransitions,
    issues,
  };
}

export function parseCivicCreatorLifecycleContract(
  input: unknown,
): CivicCreatorLifecycleParseResult {
  const parsed = CivicCreatorLifecycleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_civic_creator_lifecycle_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function validateCivicCreatorLifecycleConsistency(input: {
  lifecycleContract: CivicCreatorLifecycleContract;
  representationContract: CivicCreatorRepresentationContract;
  journalismRoleProfile?: unknown;
  orgContextProfile?: unknown;
  municipalInstitutionalContext?: boolean;
}): CivicCreatorLifecycleConsistency {
  const issues: string[] = [];
  const { lifecycleContract, representationContract } = input;

  if (
    lifecycleContract.currentStatus === "dossier_linked" &&
    !representationContract.allowsDossierCompanionCuration
  ) {
    issues.push("dossier_linked_status_requires_dossier_companion_curation_capability");
  }
  if (
    lifecycleContract.currentStatus === "companion_active" &&
    !representationContract.allowsCompanionEmbedQrUsage
  ) {
    issues.push("companion_active_status_requires_companion_capability");
  }
  if (
    lifecycleContract.currentStatus === "stream_active" &&
    !representationContract.allowsStreamCompanionUsage
  ) {
    issues.push("stream_active_status_requires_stream_capability");
  }
  if (
    lifecycleContract.representationAxes.topic === "none" &&
    lifecycleContract.representationAxes.region !== "none"
  ) {
    issues.push("region_visibility_without_topic_visibility_creates_axis_shortcut");
  }

  if (typeof input.journalismRoleProfile === "string") {
    const journalismRoleProfile = input.journalismRoleProfile.trim().toLowerCase();
    if (journalismRoleProfile === "public_journalism_context" && lifecycleContract.currentStatus === "stream_active") {
      issues.push("public_journalism_context_must_not_enter_stream_active_status");
    }
  }

  if (typeof input.orgContextProfile === "string") {
    const orgContextProfile = input.orgContextProfile.trim().toLowerCase();
    if (orgContextProfile === "institutional_organization" && lifecycleContract.currentStatus === "stream_active") {
      issues.push("institutional_org_context_must_not_be_stream_active");
    }
  }

  if (
    input.municipalInstitutionalContext &&
    lifecycleContract.currentStatus === "stream_active"
  ) {
    issues.push("municipal_institutional_context_must_not_enable_stream_active_lifecycle");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function buildCivicCreatorLifecycleBaseline(input: {
  representationContract: CivicCreatorRepresentationContract;
}): CivicCreatorLifecycleContract {
  return resolveCivicCreatorLifecycleContract({
    representationContract: input.representationContract,
    currentStatus: "initiated",
    previousStatus: null,
  });
}

export function buildCivicCreatorLifecycleDisclosure(contract: CivicCreatorLifecycleContract) {
  return {
    workProfile: contract.workProfile as CivicCreatorWorkProfile,
    workLevel: contract.workLevel as CivicCreatorWorkLevel,
    currentStatus: contract.currentStatus,
    previousStatus: contract.previousStatus,
    lifecycleContextScope: contract.lifecycleContextScope,
    allowedTransitions: contract.allowedTransitions,
    blockedTransitions: contract.blockedTransitions,
    topicRepresentation: contract.representationAxes.topic as RepresentationLevel,
    regionRepresentation: contract.representationAxes.region as RepresentationLevel,
  } as const;
}
