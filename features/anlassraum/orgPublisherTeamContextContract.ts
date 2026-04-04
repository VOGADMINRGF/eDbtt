import { z } from "zod";
import type { AnlassraumOwnerType } from "@features/anlassraum/types";
import type { GovernanceActorRole, RoomType } from "@features/trust/types";
import type { OrgContextProfile } from "@features/anlassraum/orgContextAttachmentContract";
import type { JournalismRoleProfile } from "@features/anlassraum/journalismRoleProfileContract";
import type { CivicCreatorWorkProfile } from "@features/anlassraum/civicCreatorRepresentationContract";
import type { CivicCreatorLifecycleStatus } from "@features/anlassraum/civicCreatorLifecycleContract";

export const ORG_PUBLISHER_CONTEXT_TYPES = [
  "org_context",
  "publisher_context",
  "editorial_team_context",
  "association_context",
  "civic_collective_context",
] as const;

type OrgPublisherContextType = (typeof ORG_PUBLISHER_CONTEXT_TYPES)[number];

const OrgPublisherTeamContextSchema = z
  .object({
    ownerType: z.string().trim().min(1).max(80).nullable(),
    roomType: z.string().trim().min(1).max(80).nullable(),
    actorRole: z.string().trim().min(1).max(80),
    orgContextProfile: z.string().trim().min(1).max(80),
    journalismRoleProfile: z.string().trim().min(1).max(80),
    civicWorkProfile: z.string().trim().min(1).max(80),
    lifecycleStatus: z.string().trim().min(1).max(80),
    primaryContext: z.enum(ORG_PUBLISHER_CONTEXT_TYPES),
    activeContexts: z.array(z.enum(ORG_PUBLISHER_CONTEXT_TYPES)).min(1),
    allowedBindings: z
      .object({
        anlassraum: z.literal(true),
        dossier: z.boolean(),
        companion: z.boolean(),
        stream: z.boolean(),
      })
      .strict(),
    visibility: z
      .object({
        contextVisible: z.literal(true),
        carrierVisible: z.literal(true),
        responsibilityVisible: z.literal(true),
      })
      .strict(),
    separation: z
      .object({
        topicRepresentation: z.string().trim().min(1).max(40),
        regionRepresentation: z.string().trim().min(1).max(40),
        separatedAxes: z.literal(true),
        forbidsCrossAxisShortcut: z.literal(true),
      })
      .strict(),
    compatibility: z
      .object({
        supportsSoloActors: z.literal(true),
        supportsSmallCreators: z.literal(true),
        supportsRegionalMedia: z.literal(true),
        supportsEditorialTeams: z.literal(true),
        supportsAssociations: z.literal(true),
        supportsInstitutionalOrgs: z.literal(true),
      })
      .strict(),
    guardrails: z
      .object({
        keepsAnlassraumOpen: z.literal(true),
        keepsDossierAsUpperContext: z.literal(true),
        keepsOrgContextAsCarrierNotTruth: z.literal(true),
        keepsPublisherContextAsFormatNotPriority: z.literal(true),
        keepsThemeRegionSeparated: z.literal(true),
        forbidsTruthPrivilege: z.literal(true),
        forbidsPriorityPrivilege: z.literal(true),
        forbidsVotingPrivilege: z.literal(true),
        forbidsFactStatusPrivilege: z.literal(true),
        forbidsOrgAsThemeOwnership: z.literal(true),
        forbidsOrgAsRegionOwnership: z.literal(true),
        forbidsPublisherAsDossierHoheit: z.literal(true),
        forbidsTeamAsPriorityAutomatism: z.literal(true),
      })
      .strict(),
    forbiddenShortcuts: z
      .tuple([
        z.literal("org_context_is_not_truth"),
        z.literal("org_context_is_not_priority"),
        z.literal("publisher_context_is_not_dossier_hoheit"),
        z.literal("team_context_is_not_priority_automation"),
        z.literal("org_context_is_not_theme_or_region_ownership"),
      ]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.activeContexts.includes(value.primaryContext)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeContexts"],
        message: "primary_context_must_be_part_of_active_contexts",
      });
    }

    const uniqueCount = new Set(value.activeContexts).size;
    if (uniqueCount !== value.activeContexts.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeContexts"],
        message: "active_contexts_must_not_contain_duplicates",
      });
    }

    if (
      value.activeContexts.includes("publisher_context") &&
      (value.activeContexts.includes("association_context") ||
        value.activeContexts.includes("civic_collective_context"))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeContexts"],
        message: "publisher_context_must_not_mix_with_association_or_civic_collective_context",
      });
    }

    if (
      (value.lifecycleStatus === "companion_active" || value.lifecycleStatus === "stream_active") &&
      !value.allowedBindings.companion
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowedBindings", "companion"],
        message: "companion_or_stream_lifecycle_requires_companion_binding",
      });
    }
  });

export type OrgPublisherTeamContextContract = z.infer<typeof OrgPublisherTeamContextSchema>;
export type OrgPublisherTeamContextParseResult =
  | { ok: true; value: OrgPublisherTeamContextContract }
  | { ok: false; error: string; issues: string[] };

export type OrgPublisherTeamContextConsistency = {
  ok: boolean;
  issues: string[];
};

function includesContext(
  activeContexts: OrgPublisherContextType[],
  context: OrgPublisherContextType,
): boolean {
  return activeContexts.includes(context);
}

function resolveActiveContexts(input: {
  ownerType: AnlassraumOwnerType | null;
  orgContextProfile: OrgContextProfile | "none";
  journalismRoleProfile: JournalismRoleProfile | "public_journalism_context";
}): OrgPublisherContextType[] {
  const active = new Set<OrgPublisherContextType>();

  if (
    input.orgContextProfile === "team_organization" ||
    input.orgContextProfile === "company" ||
    input.orgContextProfile === "institutional_organization" ||
    input.orgContextProfile === "media_house"
  ) {
    active.add("org_context");
  }
  if (input.orgContextProfile === "association") {
    active.add("association_context");
    active.add("civic_collective_context");
  }

  if (input.journalismRoleProfile === "publisher_context") {
    active.add("publisher_context");
    active.add("editorial_team_context");
  } else if (input.journalismRoleProfile === "editorial_team") {
    active.add("editorial_team_context");
  }

  if (
    !active.size &&
    (input.ownerType === "community" ||
      input.ownerType === "initiative" ||
      input.ownerType === "association" ||
      input.ownerType === "ngo")
  ) {
    active.add("civic_collective_context");
  }

  if (!active.size) {
    active.add("org_context");
  }

  return Array.from(active);
}

function resolvePrimaryContext(activeContexts: readonly OrgPublisherContextType[]): OrgPublisherContextType {
  if (activeContexts.includes("publisher_context")) return "publisher_context";
  if (activeContexts.includes("editorial_team_context")) return "editorial_team_context";
  if (activeContexts.includes("association_context")) return "association_context";
  if (activeContexts.includes("org_context")) return "org_context";
  return "civic_collective_context";
}

export function resolveOrgPublisherTeamContextContract(input: {
  ownerType: AnlassraumOwnerType | null;
  roomType: RoomType | null;
  actorRole: GovernanceActorRole | "unknown";
  orgContextProfile: OrgContextProfile | "none";
  journalismRoleProfile: JournalismRoleProfile | "public_journalism_context";
  civicWorkProfile: CivicCreatorWorkProfile;
  lifecycleStatus: CivicCreatorLifecycleStatus;
  topicRepresentation: string;
  regionRepresentation: string;
  allowsCompanionBinding: boolean;
  allowsStreamBinding: boolean;
  allowsDossierBinding: boolean;
}): OrgPublisherTeamContextContract {
  const activeContexts = resolveActiveContexts({
    ownerType: input.ownerType,
    orgContextProfile: input.orgContextProfile,
    journalismRoleProfile: input.journalismRoleProfile,
  });

  return OrgPublisherTeamContextSchema.parse({
    ownerType: input.ownerType,
    roomType: input.roomType,
    actorRole: input.actorRole,
    orgContextProfile: input.orgContextProfile,
    journalismRoleProfile: input.journalismRoleProfile,
    civicWorkProfile: input.civicWorkProfile,
    lifecycleStatus: input.lifecycleStatus,
    primaryContext: resolvePrimaryContext(activeContexts),
    activeContexts,
    allowedBindings: {
      anlassraum: true,
      dossier: input.allowsDossierBinding,
      companion: input.allowsCompanionBinding,
      stream: input.allowsStreamBinding,
    },
    visibility: {
      contextVisible: true,
      carrierVisible: true,
      responsibilityVisible: true,
    },
    separation: {
      topicRepresentation: input.topicRepresentation,
      regionRepresentation: input.regionRepresentation,
      separatedAxes: true,
      forbidsCrossAxisShortcut: true,
    },
    compatibility: {
      supportsSoloActors: true,
      supportsSmallCreators: true,
      supportsRegionalMedia: true,
      supportsEditorialTeams: true,
      supportsAssociations: true,
      supportsInstitutionalOrgs: true,
    },
    guardrails: {
      keepsAnlassraumOpen: true,
      keepsDossierAsUpperContext: true,
      keepsOrgContextAsCarrierNotTruth: true,
      keepsPublisherContextAsFormatNotPriority: true,
      keepsThemeRegionSeparated: true,
      forbidsTruthPrivilege: true,
      forbidsPriorityPrivilege: true,
      forbidsVotingPrivilege: true,
      forbidsFactStatusPrivilege: true,
      forbidsOrgAsThemeOwnership: true,
      forbidsOrgAsRegionOwnership: true,
      forbidsPublisherAsDossierHoheit: true,
      forbidsTeamAsPriorityAutomatism: true,
    },
    forbiddenShortcuts: [
      "org_context_is_not_truth",
      "org_context_is_not_priority",
      "publisher_context_is_not_dossier_hoheit",
      "team_context_is_not_priority_automation",
      "org_context_is_not_theme_or_region_ownership",
    ],
  });
}

export function parseOrgPublisherTeamContextContract(
  input: unknown,
): OrgPublisherTeamContextParseResult {
  const parsed = OrgPublisherTeamContextSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_org_publisher_team_context_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function validateOrgPublisherTeamContextConsistency(input: {
  contract: OrgPublisherTeamContextContract;
}): OrgPublisherTeamContextConsistency {
  const issues: string[] = [];
  const { contract } = input;

  if (
    includesContext(contract.activeContexts, "publisher_context") &&
    !(
      contract.journalismRoleProfile === "publisher_context" ||
      contract.journalismRoleProfile === "editorial_team"
    )
  ) {
    issues.push("publisher_context_requires_editorial_or_publisher_journalism_profile");
  }

  if (
    includesContext(contract.activeContexts, "association_context") &&
    contract.orgContextProfile !== "association"
  ) {
    issues.push("association_context_requires_association_org_context_profile");
  }

  if (
    includesContext(contract.activeContexts, "civic_collective_context") &&
    includesContext(contract.activeContexts, "publisher_context")
  ) {
    issues.push("civic_collective_context_must_not_mix_with_publisher_context");
  }

  if (
    contract.separation.topicRepresentation === "none" &&
    contract.separation.regionRepresentation !== "none"
  ) {
    issues.push("region_representation_without_topic_representation_creates_axis_shortcut");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function buildOrgPublisherTeamContextBaseline(input: {
  ownerType: AnlassraumOwnerType | null;
  roomType: RoomType | null;
  actorRole: GovernanceActorRole | "unknown";
  orgContextProfile: OrgContextProfile | "none";
  journalismRoleProfile: JournalismRoleProfile | "public_journalism_context";
  civicWorkProfile: CivicCreatorWorkProfile;
  lifecycleStatus: CivicCreatorLifecycleStatus;
  topicRepresentation: string;
  regionRepresentation: string;
  allowsCompanionBinding: boolean;
  allowsStreamBinding: boolean;
  allowsDossierBinding: boolean;
}): OrgPublisherTeamContextContract {
  return resolveOrgPublisherTeamContextContract(input);
}
