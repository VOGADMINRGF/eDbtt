import { z } from "zod";
import {
  ANLASSRAUM_OWNER_TYPES,
  type AnlassraumOwnerType,
} from "@features/anlassraum/types";
import {
  GOVERNANCE_ACTOR_ROLES,
  ROOM_TYPES,
  type GovernanceActorRole,
  type RoomType,
} from "@features/trust/types";

export const ORG_CONTEXT_PROFILES = [
  "none",
  "association",
  "company",
  "media_house",
  "institutional_organization",
  "team_organization",
] as const;

export const ORG_ATTACHMENT_MODES = [
  "none",
  "anlassraum_primary",
  "anlassraum_with_dossier_context",
] as const;

export const ORG_CONTEXT_RELATIONSHIPS = [
  "unscoped",
  "owner_scoped",
  "actor_scoped",
  "mixed_scoped",
] as const;

export const ORG_PRICING_SEGMENT_HINTS = [
  "public_free",
  "civic_creator",
  "media_creator",
  "team_organization",
  "municipality_public",
] as const;

export const ORG_FUNDING_SCOPE_HINTS = ["anlassraum", "dossier_adjacent"] as const;

const OrgContextAttachmentSchema = z
  .object({
    orgContextEnabled: z.boolean(),
    ownerType: z.enum(ANLASSRAUM_OWNER_TYPES).nullable(),
    roomType: z.enum(ROOM_TYPES).nullable(),
    actorRole: z.union([z.enum(GOVERNANCE_ACTOR_ROLES), z.literal("unknown")]),
    orgContextProfile: z.enum(ORG_CONTEXT_PROFILES),
    attachmentMode: z.enum(ORG_ATTACHMENT_MODES),
    contextRelationship: z.enum(ORG_CONTEXT_RELATIONSHIPS),
    orgOwnerId: z.string().trim().min(1).max(160).nullable(),
    anlassraumId: z.string().trim().min(1).max(80).nullable(),
    dossierId: z.string().trim().min(1).max(80).nullable(),
    compatibility: z
      .object({
        supportsJournalismContext: z.boolean(),
        supportsMunicipalContext: z.boolean(),
        supportsTeamContext: z.boolean(),
        pricingSegmentHints: z.array(z.enum(ORG_PRICING_SEGMENT_HINTS)).min(1),
        fundingScopeHints: z.array(z.enum(ORG_FUNDING_SCOPE_HINTS)).min(1),
      })
      .strict(),
    explainability: z
      .object({
        reasonRequired: z.literal(true),
        auditFieldsRequired: z.tuple([
          z.literal("orgContextProfile"),
          z.literal("attachmentMode"),
          z.literal("orgOwnerId"),
          z.literal("anlassraumId"),
          z.literal("dossierId"),
          z.literal("changedBy"),
          z.literal("changedAt"),
          z.literal("source"),
        ]),
      })
      .strict(),
    guardrails: z
      .object({
        keepsAnlassraumAsCore: z.literal(true),
        keepsDossierAsUpperContext: z.literal(true),
        forbidsParallelDomain: z.literal(true),
        forbidsTruthPrivilege: z.literal(true),
        forbidsPriorityPrivilege: z.literal(true),
        forbidsVotingPrivilege: z.literal(true),
        forbidsFactStatusPrivilege: z.literal(true),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.orgContextEnabled) {
      if (value.orgContextProfile === "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["orgContextProfile"],
          message: "enabled_org_context_requires_non_none_profile",
        });
      }
      if (!value.orgOwnerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["orgOwnerId"],
          message: "enabled_org_context_requires_org_owner_id",
        });
      }
      if (!value.anlassraumId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["anlassraumId"],
          message: "enabled_org_context_requires_anlassraum_id",
        });
      }
      if (value.attachmentMode === "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attachmentMode"],
          message: "enabled_org_context_requires_attachment_mode",
        });
      }
    } else {
      if (value.orgContextProfile !== "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["orgContextProfile"],
          message: "disabled_org_context_must_use_none_profile",
        });
      }
      if (value.attachmentMode !== "none") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attachmentMode"],
          message: "disabled_org_context_must_use_none_attachment_mode",
        });
      }
    }

    if (value.attachmentMode === "anlassraum_with_dossier_context" && !value.dossierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dossierId"],
        message: "dossier_context_attachment_requires_dossier_id",
      });
    }

    if (value.compatibility.supportsMunicipalContext && value.orgContextProfile !== "institutional_organization") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compatibility", "supportsMunicipalContext"],
        message: "municipal_support_requires_institutional_org_profile",
      });
    }

    if (
      value.orgContextProfile === "institutional_organization" &&
      !value.compatibility.pricingSegmentHints.includes("municipality_public")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compatibility", "pricingSegmentHints"],
        message: "institutional_org_profile_requires_municipality_segment_hint",
      });
    }
  });

export type OrgContextProfile = (typeof ORG_CONTEXT_PROFILES)[number];
export type OrgAttachmentMode = (typeof ORG_ATTACHMENT_MODES)[number];
export type OrgContextRelationship = (typeof ORG_CONTEXT_RELATIONSHIPS)[number];
export type OrgContextAttachmentContract = z.infer<typeof OrgContextAttachmentSchema>;
export type OrgContextAttachmentParseResult =
  | { ok: true; value: OrgContextAttachmentContract }
  | { ok: false; error: string; issues: string[] };

export type OrgContextAttachmentConsistency = {
  ok: boolean;
  issues: string[];
};

const ORG_CONTEXT_OWNER_TYPES = new Set<AnlassraumOwnerType>([
  "organization",
  "association",
  "ngo",
  "company",
  "media",
  "editorial",
  "municipality",
  "government",
  "initiative",
  "party",
]);

const INSTITUTIONAL_ACTOR_ROLES = new Set<GovernanceActorRole>([
  "admin",
  "institutional_actor",
  "editorial_actor",
]);

function normalizeOwnerType(value: unknown): AnlassraumOwnerType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (ANLASSRAUM_OWNER_TYPES.includes(normalized as AnlassraumOwnerType)) {
    return normalized as AnlassraumOwnerType;
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

function normalizeActorRole(value: unknown): GovernanceActorRole | "unknown" {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  if (GOVERNANCE_ACTOR_ROLES.includes(normalized as GovernanceActorRole)) {
    return normalized as GovernanceActorRole;
  }
  return "unknown";
}

function normalizeContextId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function resolveOrgContextProfile(input: {
  orgContextEnabled: boolean;
  ownerType: AnlassraumOwnerType | null;
  roomType: RoomType | null;
}): OrgContextProfile {
  if (!input.orgContextEnabled || !input.ownerType) return "none";
  switch (input.ownerType) {
    case "association":
    case "ngo":
    case "party":
      return "association";
    case "company":
      return "company";
    case "media":
    case "editorial":
      return "media_house";
    case "municipality":
    case "government":
      return "institutional_organization";
    case "organization":
      return input.roomType === "official" ? "institutional_organization" : "team_organization";
    default:
      return "team_organization";
  }
}

function resolvePricingSegmentHints(profile: OrgContextProfile): readonly (typeof ORG_PRICING_SEGMENT_HINTS)[number][] {
  switch (profile) {
    case "none":
      return ["public_free"];
    case "association":
    case "company":
    case "team_organization":
      return ["team_organization", "civic_creator"];
    case "media_house":
      return ["media_creator", "team_organization"];
    case "institutional_organization":
      return ["municipality_public", "team_organization"];
  }
}

function resolveFundingScopeHints(attachmentMode: OrgAttachmentMode): readonly (typeof ORG_FUNDING_SCOPE_HINTS)[number][] {
  if (attachmentMode === "anlassraum_with_dossier_context") {
    return ["anlassraum", "dossier_adjacent"];
  }
  return ["anlassraum"];
}

function resolveContextRelationship(input: {
  orgContextEnabled: boolean;
  actorRole: GovernanceActorRole | "unknown";
  orgOwnerId: string | null;
}): OrgContextRelationship {
  if (!input.orgContextEnabled) return "unscoped";
  const actorScoped = input.actorRole !== "unknown" && INSTITUTIONAL_ACTOR_ROLES.has(input.actorRole);
  if (actorScoped && input.orgOwnerId) return "mixed_scoped";
  if (actorScoped) return "actor_scoped";
  if (input.orgOwnerId) return "owner_scoped";
  return "unscoped";
}

export function resolveOrgContextAttachmentContract(input: {
  ownerType: unknown;
  roomType: unknown;
  actorRole: unknown;
  ownerId?: unknown;
  anlassraumId?: unknown;
  dossierId?: unknown;
}): OrgContextAttachmentContract {
  const ownerType = normalizeOwnerType(input.ownerType);
  const roomType = normalizeRoomType(input.roomType);
  const actorRole = normalizeActorRole(input.actorRole);
  const orgOwnerId = normalizeContextId(input.ownerId);
  const anlassraumId = normalizeContextId(input.anlassraumId);
  const dossierId = normalizeContextId(input.dossierId);
  const orgContextEnabled = Boolean(ownerType && ORG_CONTEXT_OWNER_TYPES.has(ownerType) && orgOwnerId);
  const orgContextProfile = resolveOrgContextProfile({
    orgContextEnabled,
    ownerType,
    roomType,
  });
  const attachmentMode: OrgAttachmentMode = !orgContextEnabled
    ? "none"
    : dossierId
      ? "anlassraum_with_dossier_context"
      : "anlassraum_primary";

  const contract = OrgContextAttachmentSchema.parse({
    orgContextEnabled,
    ownerType,
    roomType,
    actorRole,
    orgContextProfile,
    attachmentMode,
    contextRelationship: resolveContextRelationship({
      orgContextEnabled,
      actorRole,
      orgOwnerId,
    }),
    orgOwnerId,
    anlassraumId,
    dossierId,
    compatibility: {
      supportsJournalismContext:
        orgContextProfile === "media_house" || orgContextProfile === "team_organization",
      supportsMunicipalContext: orgContextProfile === "institutional_organization",
      supportsTeamContext: orgContextProfile !== "none",
      pricingSegmentHints: resolvePricingSegmentHints(orgContextProfile),
      fundingScopeHints: resolveFundingScopeHints(attachmentMode),
    },
    explainability: {
      reasonRequired: true,
      auditFieldsRequired: [
        "orgContextProfile",
        "attachmentMode",
        "orgOwnerId",
        "anlassraumId",
        "dossierId",
        "changedBy",
        "changedAt",
        "source",
      ],
    },
    guardrails: {
      keepsAnlassraumAsCore: true,
      keepsDossierAsUpperContext: true,
      forbidsParallelDomain: true,
      forbidsTruthPrivilege: true,
      forbidsPriorityPrivilege: true,
      forbidsVotingPrivilege: true,
      forbidsFactStatusPrivilege: true,
    },
  });
  return contract;
}

export function parseOrgContextAttachmentContract(input: unknown): OrgContextAttachmentParseResult {
  const parsed = OrgContextAttachmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_org_context_attachment_contract",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}:${issue.message}`),
    };
  }
  return { ok: true, value: parsed.data };
}

export function validateOrgContextAttachmentConsistency(input: {
  contract: OrgContextAttachmentContract;
  journalismRoleProfile?: unknown;
  municipalInstitutionalContext?: boolean;
  pricingSegment?: unknown;
  fundingSupportScope?: unknown;
}): OrgContextAttachmentConsistency {
  const issues: string[] = [];
  const { contract } = input;

  if (contract.orgContextEnabled && !ORG_CONTEXT_OWNER_TYPES.has(contract.ownerType ?? "other")) {
    issues.push("org_context_owner_type_must_be_organization_like");
  }

  if (
    typeof input.journalismRoleProfile === "string" &&
    (input.journalismRoleProfile.includes("editorial") || input.journalismRoleProfile.includes("publisher")) &&
    !contract.compatibility.supportsJournalismContext
  ) {
    issues.push("journalism_profile_requires_journalism_compatible_org_context");
  }

  if (input.municipalInstitutionalContext && !contract.compatibility.supportsMunicipalContext) {
    issues.push("institutional_context_requires_institutional_org_profile");
  }

  if (typeof input.pricingSegment === "string") {
    const pricingSegment = input.pricingSegment.trim().toLowerCase();
    if (!contract.compatibility.pricingSegmentHints.includes(pricingSegment as (typeof ORG_PRICING_SEGMENT_HINTS)[number])) {
      issues.push("pricing_segment_not_in_org_context_hints");
    }
  }

  if (typeof input.fundingSupportScope === "string") {
    const fundingScope = input.fundingSupportScope.trim().toLowerCase();
    if (!contract.compatibility.fundingScopeHints.includes(fundingScope as (typeof ORG_FUNDING_SCOPE_HINTS)[number])) {
      issues.push("funding_scope_not_in_org_context_hints");
    }
    if (fundingScope === "dossier_adjacent" && !contract.dossierId) {
      issues.push("dossier_adjacent_funding_scope_requires_dossier_context");
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function buildOrgContextAttachmentBaseline(input: {
  ownerType: unknown;
  roomType: unknown;
  actorRole: unknown;
  ownerId?: unknown;
  anlassraumId?: unknown;
  dossierId?: unknown;
}): OrgContextAttachmentContract {
  return resolveOrgContextAttachmentContract(input);
}
