import type { GovernanceActorRole } from "@features/trust/types";
import type { AnlassraumOwnerType } from "@features/anlassraum/types";
import type { JournalismCompanionContract } from "@features/anlassraum/journalismCompanionContract";
import type { JournalismTruthGuardrailsContract } from "@features/anlassraum/journalismGuardrails";
import type { RoomType } from "@features/trust/types";

export type JournalismRoleProfile =
  | "public_journalism_context"
  | "solo_journalist_creator"
  | "editorial_team"
  | "publisher_context";

export type JournalismRoleAction =
  | "view_open_dossier_context"
  | "attach_source_anchor_context"
  | "attach_companion_context"
  | "enable_embed_context"
  | "enable_qr_context"
  | "add_editorial_context_note"
  | "coordinate_review_context"
  | "manage_format_context";

export type JournalismRoleProfileContract = {
  sourceAnchorContext: boolean;
  actorRole: GovernanceActorRole | "unknown";
  ownerType: AnlassraumOwnerType | null;
  roomType: RoomType | null;
  roleProfile: JournalismRoleProfile;
  supportsSmallFormats: true;
  allowsSingleJournalistUsage: true;
  allowsPublisherContextWhenTransparent: true;
  allowedActions: readonly JournalismRoleAction[];
  reasonAuditRequiredActions: readonly JournalismRoleAction[];
  forbidsTruthPrivilege: true;
  forbidsPriorityPrivilege: true;
  forbidsFactcheckStatusDerivation: true;
  forbidsDossierStatusDerivation: true;
  forbidsEpistemicClosure: true;
  forbiddenInferences: readonly string[];
  allowedStrengths: readonly string[];
};

export type JournalismContractConsistency = {
  ok: boolean;
  issues: string[];
};

const ROLE_ACTIONS: Record<JournalismRoleProfile, readonly JournalismRoleAction[]> = {
  public_journalism_context: ["view_open_dossier_context"],
  solo_journalist_creator: [
    "view_open_dossier_context",
    "attach_source_anchor_context",
    "attach_companion_context",
    "enable_embed_context",
    "enable_qr_context",
    "add_editorial_context_note",
    "coordinate_review_context",
  ],
  editorial_team: [
    "view_open_dossier_context",
    "attach_source_anchor_context",
    "attach_companion_context",
    "enable_embed_context",
    "enable_qr_context",
    "add_editorial_context_note",
    "coordinate_review_context",
    "manage_format_context",
  ],
  publisher_context: [
    "view_open_dossier_context",
    "attach_source_anchor_context",
    "attach_companion_context",
    "enable_embed_context",
    "enable_qr_context",
    "add_editorial_context_note",
    "coordinate_review_context",
    "manage_format_context",
  ],
} as const;

const ROLE_AUDIT_REQUIRED_ACTIONS: readonly JournalismRoleAction[] = [
  "attach_source_anchor_context",
  "attach_companion_context",
  "enable_embed_context",
  "enable_qr_context",
  "add_editorial_context_note",
  "coordinate_review_context",
  "manage_format_context",
] as const;

export const JOURNALISM_ROLE_FORBIDDEN_INFERENCES = [
  "truth_status_from_journalism_role",
  "priority_rank_from_publisher_role",
  "factcheck_status_from_editorial_privilege",
  "dossier_status_from_publisher_privilege",
] as const;

export const JOURNALISM_ROLE_ALLOWED_STRENGTHS = [
  "editorial_team_context_for_open_dossiers",
  "small_format_and_regional_context_support",
  "publisher_context_with_transparent_workflow",
  "companion_embed_qr_connections_for_public_followup",
] as const;

const JOURNALISM_OWNER_TYPES = new Set<AnlassraumOwnerType>(["media", "editorial"]);

function normalizeActorRole(value: unknown): GovernanceActorRole | "unknown" {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "community" ||
    normalized === "editor" ||
    normalized === "reviewer" ||
    normalized === "admin" ||
    normalized === "institutional_actor" ||
    normalized === "editorial_actor"
  ) {
    return normalized;
  }
  return "unknown";
}

function normalizeOwnerType(value: unknown): AnlassraumOwnerType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "platform" ||
    normalized === "municipality" ||
    normalized === "government" ||
    normalized === "party" ||
    normalized === "organization" ||
    normalized === "association" ||
    normalized === "ngo" ||
    normalized === "company" ||
    normalized === "media" ||
    normalized === "initiative" ||
    normalized === "community" ||
    normalized === "editorial" ||
    normalized === "user" ||
    normalized === "system" ||
    normalized === "other"
  ) {
    return normalized;
  }
  return null;
}

function normalizeRoomType(value: unknown): RoomType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "public" ||
    normalized === "community" ||
    normalized === "official" ||
    normalized === "editorial" ||
    normalized === "internal" ||
    normalized === "hybrid"
  ) {
    return normalized;
  }
  return null;
}

function resolveRoleProfile(input: {
  actorRole: GovernanceActorRole | "unknown";
  ownerType: AnlassraumOwnerType | null;
  roomType: RoomType | null;
}): JournalismRoleProfile {
  const journalismActor = input.actorRole === "editorial_actor" || input.actorRole === "admin";
  if (!journalismActor) return "public_journalism_context";

  const journalismOwner = input.ownerType ? JOURNALISM_OWNER_TYPES.has(input.ownerType) : false;
  if (input.actorRole === "admin" && !journalismOwner) return "public_journalism_context";
  if (journalismOwner && input.roomType === "editorial") return "publisher_context";
  if (journalismOwner) return "editorial_team";
  return "solo_journalist_creator";
}

export function resolveJournalismRoleProfileContract(input: {
  originType: unknown;
  actorRole: unknown;
  ownerType: unknown;
  roomType: unknown;
}): JournalismRoleProfileContract {
  const actorRole = normalizeActorRole(input.actorRole);
  const ownerType = normalizeOwnerType(input.ownerType);
  const roomType = normalizeRoomType(input.roomType);
  const sourceAnchorContext =
    typeof input.originType === "string" &&
    input.originType.trim().toLowerCase().replace("-", "_") === "source_anchor";
  const roleProfile = resolveRoleProfile({
    actorRole,
    ownerType,
    roomType,
  });

  return {
    sourceAnchorContext,
    actorRole,
    ownerType,
    roomType,
    roleProfile,
    supportsSmallFormats: true,
    allowsSingleJournalistUsage: true,
    allowsPublisherContextWhenTransparent: true,
    allowedActions: ROLE_ACTIONS[roleProfile],
    reasonAuditRequiredActions: ROLE_AUDIT_REQUIRED_ACTIONS.filter((action) =>
      ROLE_ACTIONS[roleProfile].includes(action),
    ),
    forbidsTruthPrivilege: true,
    forbidsPriorityPrivilege: true,
    forbidsFactcheckStatusDerivation: true,
    forbidsDossierStatusDerivation: true,
    forbidsEpistemicClosure: true,
    forbiddenInferences: JOURNALISM_ROLE_FORBIDDEN_INFERENCES,
    allowedStrengths: JOURNALISM_ROLE_ALLOWED_STRENGTHS,
  };
}

export function validateJournalismContractConsistency(input: {
  truthGuardrails: JournalismTruthGuardrailsContract;
  companionContract: JournalismCompanionContract;
  roleProfileContract: JournalismRoleProfileContract;
}): JournalismContractConsistency {
  const issues: string[] = [];
  const { truthGuardrails, companionContract, roleProfileContract } = input;

  if (!truthGuardrails.deniesTruthPrivilege || !companionContract.forbidsTruthPrivilege || !roleProfileContract.forbidsTruthPrivilege) {
    issues.push("truth_privilege_must_be_denied_across_all_journalism_contract_layers");
  }
  if (
    !truthGuardrails.deniesPriorityPrivilege ||
    !companionContract.forbidsPriorityPrivilege ||
    !roleProfileContract.forbidsPriorityPrivilege
  ) {
    issues.push("priority_privilege_must_be_denied_across_all_journalism_contract_layers");
  }
  if (truthGuardrails.sourceAnchorContext !== companionContract.sourceAnchorContext) {
    issues.push("source_anchor_context_mismatch_between_truth_and_companion_contract");
  }
  if (truthGuardrails.sourceAnchorContext !== roleProfileContract.sourceAnchorContext) {
    issues.push("source_anchor_context_mismatch_between_truth_and_role_profile_contract");
  }
  if (companionContract.publicConnection && !companionContract.channels.includes("open_dossier_companion")) {
    issues.push("public_companion_connection_requires_open_dossier_companion_channel");
  }
  if (roleProfileContract.roleProfile === "public_journalism_context" &&
      roleProfileContract.allowedActions.includes("manage_format_context")) {
    issues.push("public_journalism_context_cannot_manage_editorial_or_publisher_format_context");
  }
  if (companionContract.companionSurface === "restricted_context" && companionContract.allowsQrConnection) {
    issues.push("restricted_context_must_not_enable_qr_connection");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
