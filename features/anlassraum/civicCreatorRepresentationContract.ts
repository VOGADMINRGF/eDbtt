import { z } from "zod";
import {
  ANLASSRAUM_ORIGIN_TYPES,
  ANLASSRAUM_OWNER_TYPES,
  type AnlassraumOriginType,
  type AnlassraumOwnerType,
} from "@features/anlassraum/types";
import {
  GOVERNANCE_ACTOR_ROLES,
  ROOM_TYPES,
  type GovernanceActorRole,
  type RoomType,
} from "@features/trust/types";

export const CIVIC_CREATOR_WORK_PROFILES = [
  "civic_participant",
  "anlassraum_host",
  "creator_format_host",
  "editorial_dossier_host",
  "publisher_team_context",
  "org_context_actor",
] as const;

export const CIVIC_CREATOR_WORK_LEVELS = [
  "participation_only",
  "anlassraum_hosting",
  "format_companion",
  "dossier_companion",
  "organization_followup",
] as const;

export const REPRESENTATION_LEVELS = ["none", "context_visible", "context_curator"] as const;

export const CIVIC_CREATOR_ROLE_ACTIONS = [
  "participate_publicly",
  "open_anlassraum",
  "host_anlassraum_context",
  "continue_anlassraum_context",
  "publish_format_context",
  "use_companion_context",
  "use_embed_context",
  "use_qr_context",
  "curate_dossier_context",
  "manage_publisher_team_context",
  "add_org_context_note",
] as const;

const CIVIC_CREATOR_AUDIT_REQUIRED_ACTIONS = [
  "open_anlassraum",
  "host_anlassraum_context",
  "continue_anlassraum_context",
  "publish_format_context",
  "use_companion_context",
  "use_embed_context",
  "use_qr_context",
  "curate_dossier_context",
  "manage_publisher_team_context",
  "add_org_context_note",
] as const;

const CivicCreatorRepresentationSchema = z
  .object({
    actorRole: z.union([z.enum(GOVERNANCE_ACTOR_ROLES), z.literal("unknown")]),
    ownerType: z.enum(ANLASSRAUM_OWNER_TYPES).nullable(),
    originType: z.enum(ANLASSRAUM_ORIGIN_TYPES).nullable(),
    roomType: z.enum(ROOM_TYPES).nullable(),
    workProfile: z.enum(CIVIC_CREATOR_WORK_PROFILES),
    workLevel: z.enum(CIVIC_CREATOR_WORK_LEVELS),
    allowsAnlassraumOpen: z.boolean(),
    allowsAnlassraumHosting: z.boolean(),
    allowsAnlassraumContinuation: z.boolean(),
    allowsDossierCompanionCuration: z.boolean(),
    allowsCompanionEmbedQrUsage: z.boolean(),
    allowsStreamCompanionUsage: z.boolean(),
    allowsOnlyParticipation: z.boolean(),
    representationAxes: z
      .object({
        topic: z.enum(REPRESENTATION_LEVELS),
        region: z.enum(REPRESENTATION_LEVELS),
        separatedAxes: z.literal(true),
        forbidsCrossAxisShortcut: z.literal(true),
      })
      .strict(),
    compatibility: z
      .object({
        supportsSmallFormats: z.literal(true),
        supportsSoloCreators: z.literal(true),
        supportsRegionalMedia: z.literal(true),
        supportsPublisherTeams: z.literal(true),
        supportsOrganizationContexts: z.literal(true),
      })
      .strict(),
    allowedActions: z.array(z.enum(CIVIC_CREATOR_ROLE_ACTIONS)),
    reasonAuditRequiredActions: z.array(z.enum(CIVIC_CREATOR_ROLE_ACTIONS)),
    explainability: z
      .object({
        reasonRequired: z.literal(true),
        auditFieldsRequired: z.tuple([
          z.literal("workProfile"),
          z.literal("workLevel"),
          z.literal("topicRepresentation"),
          z.literal("regionRepresentation"),
          z.literal("changedBy"),
          z.literal("changedAt"),
          z.literal("source"),
        ]),
      })
      .strict(),
    guardrails: z
      .object({
        keepsAnlassraumInitiable: z.literal(true),
        keepsDossierAsUpperContext: z.literal(true),
        keepsCompanionBoundToOpenDossierCore: z.literal(true),
        forbidsTruthPrivilege: z.literal(true),
        forbidsPriorityPrivilege: z.literal(true),
        forbidsVotingPrivilege: z.literal(true),
        forbidsFactStatusPrivilege: z.literal(true),
        forbidsReachPrivilege: z.literal(true),
        forbidsParallelDomain: z.literal(true),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.allowsOnlyParticipation) {
      if (
        value.allowsAnlassraumOpen ||
        value.allowsAnlassraumHosting ||
        value.allowsAnlassraumContinuation ||
        value.allowsDossierCompanionCuration ||
        value.allowsCompanionEmbedQrUsage ||
        value.allowsStreamCompanionUsage
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allowsOnlyParticipation"],
          message: "participation_only_profile_must_not_enable_host_or_companion_actions",
        });
      }
      if (value.workLevel !== "participation_only") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["workLevel"],
          message: "participation_only_profile_requires_participation_only_level",
        });
      }
    }

    if (value.allowsDossierCompanionCuration && !value.allowsCompanionEmbedQrUsage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowsDossierCompanionCuration"],
        message: "dossier_companion_curation_requires_companion_embed_qr_capability",
      });
    }

    if (value.representationAxes.topic !== "none" && value.representationAxes.region !== "none") {
      if (!value.representationAxes.separatedAxes || !value.representationAxes.forbidsCrossAxisShortcut) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["representationAxes"],
          message: "topic_and_region_representation_requires_strict_axis_separation",
        });
      }
    }
  });

export type CivicCreatorWorkProfile = (typeof CIVIC_CREATOR_WORK_PROFILES)[number];
export type CivicCreatorWorkLevel = (typeof CIVIC_CREATOR_WORK_LEVELS)[number];
export type RepresentationLevel = (typeof REPRESENTATION_LEVELS)[number];
export type CivicCreatorRoleAction = (typeof CIVIC_CREATOR_ROLE_ACTIONS)[number];
export type CivicCreatorRepresentationContract = z.infer<typeof CivicCreatorRepresentationSchema>;

export type CivicCreatorRepresentationParseResult =
  | { ok: true; value: CivicCreatorRepresentationContract }
  | { ok: false; error: string; issues: string[] };

export type CivicCreatorRepresentationConsistency = {
  ok: boolean;
  issues: string[];
};

function normalizeActorRole(value: unknown): GovernanceActorRole | "unknown" {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  if (GOVERNANCE_ACTOR_ROLES.includes(normalized as GovernanceActorRole)) {
    return normalized as GovernanceActorRole;
  }
  return "unknown";
}

function normalizeOwnerType(value: unknown): AnlassraumOwnerType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (ANLASSRAUM_OWNER_TYPES.includes(normalized as AnlassraumOwnerType)) {
    return normalized as AnlassraumOwnerType;
  }
  return null;
}

function normalizeOriginType(value: unknown): AnlassraumOriginType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (ANLASSRAUM_ORIGIN_TYPES.includes(normalized as AnlassraumOriginType)) {
    return normalized as AnlassraumOriginType;
  }
  return null;
}

function normalizeRoomType(value: unknown): RoomType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (ROOM_TYPES.includes(normalized as RoomType)) {
    return normalized as RoomType;
  }
  return null;
}

function resolveWorkProfile(input: {
  actorRole: GovernanceActorRole | "unknown";
  ownerType: AnlassraumOwnerType | null;
  roomType: RoomType | null;
  originType: AnlassraumOriginType | null;
}): CivicCreatorWorkProfile {
  const editorialContext = input.ownerType === "media" || input.ownerType === "editorial";
  const organizationContext =
    input.ownerType === "organization" ||
    input.ownerType === "association" ||
    input.ownerType === "ngo" ||
    input.ownerType === "company" ||
    input.ownerType === "municipality" ||
    input.ownerType === "government";

  if (input.actorRole === "editorial_actor" && editorialContext && input.roomType === "editorial") {
    return "publisher_team_context";
  }
  if (input.actorRole === "editorial_actor" || (editorialContext && input.originType === "source_anchor")) {
    return "editorial_dossier_host";
  }
  if (organizationContext && (input.roomType === "official" || input.roomType === "internal")) {
    return "org_context_actor";
  }
  if (input.actorRole === "editor" || input.actorRole === "reviewer") {
    return "creator_format_host";
  }
  if (input.actorRole === "admin" || input.actorRole === "institutional_actor" || input.actorRole === "community") {
    return "anlassraum_host";
  }
  return "civic_participant";
}

function resolveWorkLevel(profile: CivicCreatorWorkProfile): CivicCreatorWorkLevel {
  switch (profile) {
    case "civic_participant":
      return "participation_only";
    case "anlassraum_host":
      return "anlassraum_hosting";
    case "creator_format_host":
      return "format_companion";
    case "editorial_dossier_host":
    case "publisher_team_context":
      return "dossier_companion";
    case "org_context_actor":
      return "organization_followup";
  }
}

function resolveRepresentationAxes(input: {
  profile: CivicCreatorWorkProfile;
  ownerType: AnlassraumOwnerType | null;
  roomType: RoomType | null;
}): { topic: RepresentationLevel; region: RepresentationLevel } {
  const topic: RepresentationLevel =
    input.profile === "civic_participant"
      ? "none"
      : input.profile === "anlassraum_host" || input.profile === "org_context_actor"
        ? "context_visible"
        : "context_curator";

  const institutionalContext =
    input.ownerType === "municipality" ||
    input.ownerType === "government" ||
    input.roomType === "official" ||
    input.profile === "org_context_actor";
  const region: RepresentationLevel = institutionalContext ? "context_visible" : "none";

  return { topic, region };
}

function resolveAllowedActions(profile: CivicCreatorWorkProfile): readonly CivicCreatorRoleAction[] {
  switch (profile) {
    case "civic_participant":
      return ["participate_publicly"];
    case "anlassraum_host":
      return [
        "participate_publicly",
        "open_anlassraum",
        "host_anlassraum_context",
        "continue_anlassraum_context",
      ];
    case "creator_format_host":
      return [
        "participate_publicly",
        "open_anlassraum",
        "host_anlassraum_context",
        "continue_anlassraum_context",
        "publish_format_context",
        "use_companion_context",
        "use_embed_context",
        "use_qr_context",
      ];
    case "editorial_dossier_host":
      return [
        "participate_publicly",
        "open_anlassraum",
        "host_anlassraum_context",
        "continue_anlassraum_context",
        "publish_format_context",
        "use_companion_context",
        "use_embed_context",
        "use_qr_context",
        "curate_dossier_context",
      ];
    case "publisher_team_context":
      return [
        "participate_publicly",
        "open_anlassraum",
        "host_anlassraum_context",
        "continue_anlassraum_context",
        "publish_format_context",
        "use_companion_context",
        "use_embed_context",
        "use_qr_context",
        "curate_dossier_context",
        "manage_publisher_team_context",
      ];
    case "org_context_actor":
      return [
        "participate_publicly",
        "open_anlassraum",
        "host_anlassraum_context",
        "continue_anlassraum_context",
        "add_org_context_note",
      ];
  }
}

export function resolveCivicCreatorRepresentationContract(input: {
  actorRole: unknown;
  ownerType: unknown;
  originType: unknown;
  roomType: unknown;
}): CivicCreatorRepresentationContract {
  const actorRole = normalizeActorRole(input.actorRole);
  const ownerType = normalizeOwnerType(input.ownerType);
  const originType = normalizeOriginType(input.originType);
  const roomType = normalizeRoomType(input.roomType);
  const workProfile = resolveWorkProfile({
    actorRole,
    ownerType,
    roomType,
    originType,
  });
  const workLevel = resolveWorkLevel(workProfile);
  const allowedActions = resolveAllowedActions(workProfile);
  const representationAxes = resolveRepresentationAxes({
    profile: workProfile,
    ownerType,
    roomType,
  });

  return CivicCreatorRepresentationSchema.parse({
    actorRole,
    ownerType,
    originType,
    roomType,
    workProfile,
    workLevel,
    allowsAnlassraumOpen: allowedActions.includes("open_anlassraum"),
    allowsAnlassraumHosting: allowedActions.includes("host_anlassraum_context"),
    allowsAnlassraumContinuation: allowedActions.includes("continue_anlassraum_context"),
    allowsDossierCompanionCuration: allowedActions.includes("curate_dossier_context"),
    allowsCompanionEmbedQrUsage:
      allowedActions.includes("use_companion_context") &&
      allowedActions.includes("use_embed_context") &&
      allowedActions.includes("use_qr_context"),
    allowsStreamCompanionUsage:
      allowedActions.includes("use_companion_context") || allowedActions.includes("publish_format_context"),
    allowsOnlyParticipation: workProfile === "civic_participant",
    representationAxes: {
      topic: representationAxes.topic,
      region: representationAxes.region,
      separatedAxes: true,
      forbidsCrossAxisShortcut: true,
    },
    compatibility: {
      supportsSmallFormats: true,
      supportsSoloCreators: true,
      supportsRegionalMedia: true,
      supportsPublisherTeams: true,
      supportsOrganizationContexts: true,
    },
    allowedActions,
    reasonAuditRequiredActions: CIVIC_CREATOR_AUDIT_REQUIRED_ACTIONS.filter((action) =>
      allowedActions.includes(action),
    ),
    explainability: {
      reasonRequired: true,
      auditFieldsRequired: [
        "workProfile",
        "workLevel",
        "topicRepresentation",
        "regionRepresentation",
        "changedBy",
        "changedAt",
        "source",
      ],
    },
    guardrails: {
      keepsAnlassraumInitiable: true,
      keepsDossierAsUpperContext: true,
      keepsCompanionBoundToOpenDossierCore: true,
      forbidsTruthPrivilege: true,
      forbidsPriorityPrivilege: true,
      forbidsVotingPrivilege: true,
      forbidsFactStatusPrivilege: true,
      forbidsReachPrivilege: true,
      forbidsParallelDomain: true,
    },
  });
}

export function parseCivicCreatorRepresentationContract(
  input: unknown,
): CivicCreatorRepresentationParseResult {
  const parsed = CivicCreatorRepresentationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_civic_creator_representation_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function validateCivicCreatorRepresentationConsistency(input: {
  contract: CivicCreatorRepresentationContract;
  journalismRoleProfile?: unknown;
  orgContextProfile?: unknown;
  municipalInstitutionalContext?: boolean;
}): CivicCreatorRepresentationConsistency {
  const issues: string[] = [];
  const { contract } = input;

  if (
    !contract.guardrails.forbidsTruthPrivilege ||
    !contract.guardrails.forbidsPriorityPrivilege ||
    !contract.guardrails.forbidsVotingPrivilege ||
    !contract.guardrails.forbidsFactStatusPrivilege
  ) {
    issues.push("civic_creator_representation_must_forbid_truth_priority_voting_fact_privileges");
  }

  if (typeof input.journalismRoleProfile === "string") {
    const role = input.journalismRoleProfile.trim().toLowerCase();
    const editorialRole = role.includes("editorial") || role.includes("publisher");
    if (editorialRole && !contract.allowedActions.includes("use_companion_context")) {
      issues.push("editorial_or_publisher_role_requires_companion_capability");
    }
  }

  if (typeof input.orgContextProfile === "string") {
    const orgProfile = input.orgContextProfile.trim().toLowerCase();
    const organizationLike = orgProfile !== "none";
    if (organizationLike && contract.workProfile === "civic_participant") {
      issues.push("organization_context_must_not_collapse_to_participation_only_profile");
    }
  }

  if (input.municipalInstitutionalContext && contract.representationAxes.region === "none") {
    issues.push("municipal_institutional_context_requires_region_representation_visibility");
  }

  if (
    contract.representationAxes.topic === "none" &&
    contract.representationAxes.region === "context_curator"
  ) {
    issues.push("region_curation_without_topic_visibility_creates_axis_shortcut");
  }

  if (
    contract.allowsDossierCompanionCuration &&
    !contract.guardrails.keepsCompanionBoundToOpenDossierCore
  ) {
    issues.push("dossier_companion_curation_requires_open_dossier_binding_guardrail");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function buildCivicCreatorRepresentationBaseline(input: {
  actorRole: unknown;
  ownerType: unknown;
  originType: unknown;
  roomType: unknown;
}): CivicCreatorRepresentationContract {
  return resolveCivicCreatorRepresentationContract(input);
}
