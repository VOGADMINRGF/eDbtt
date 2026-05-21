import type { NextRequest } from "next/server";
import { mapUserRolesToGovernanceRole } from "@features/trust/gates";
import type { GovernanceActorRole } from "@features/trust/types";
import {
  type Organization,
  type OrganizationMembership,
  type OrganizationRoleType,
  type RegionAccessContext as PersistedRegionAccessContext,
  type VerificationStatus,
} from "@features/region";
import type { SessionUser } from "./sessionUser";
import { userIsAdminDashboard } from "./roles";
import {
  getAuthProviderRuntimeAdapter,
  getMembershipDirectoryAdapter,
  type RequestScopeConfidence,
  type RequestScopeRuntimeMarker,
  type RequestScopeSourceOfTruth,
} from "./runtimeAdapters";

export type AuthenticatedActorContext = {
  actorId: string;
  actorType: "session_user";
  email: string | null;
  roles: string[];
  governanceRole: GovernanceActorRole | null;
  isOperatorMode: boolean;
  operatorModeLabel: string | null;
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export type OrganizationMembershipContext = {
  organizationId: string | null;
  organizationIds: string[];
  membershipId: string | null;
  membershipStatus: VerificationStatus | "none" | "admin_fallback";
  memberships: OrganizationMembership[];
  organizations: Organization[];
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export type OrganizationRoleContext = {
  organizationRole: OrganizationRoleType | "operator_admin" | null;
  roleLabel: string | null;
  membershipId: string | null;
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export type RequestScopeSourceBreakdown = {
  actor: RequestScopeSourceOfTruth;
  organization: RequestScopeSourceOfTruth;
  organizationRole: RequestScopeSourceOfTruth;
  regionAccess: RequestScopeSourceOfTruth;
};

export type RegionAccessContext = PersistedRegionAccessContext;

export type RequestScopeContext = {
  actorId: string;
  actorType: AuthenticatedActorContext["actorType"];
  email: string | null;
  organizationId: string | null;
  membershipStatus: OrganizationMembershipContext["membershipStatus"];
  organizationRole: OrganizationRoleContext["organizationRole"];
  regionIds: string[];
  isOperatorMode: boolean;
  operatorModeLabel: string | null;
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
  sourceBreakdown: RequestScopeSourceBreakdown;
  actor: AuthenticatedActorContext;
  organizationMembership: OrganizationMembershipContext;
  organizationRoleContext: OrganizationRoleContext;
  regionAccess: PersistedRegionAccessContext;
  regionAccessSourceOfTruth: RequestScopeSourceOfTruth;
  regionAccessConfidence: RequestScopeConfidence;
  regionAccessRuntimeMarker: RequestScopeRuntimeMarker;
  user: SessionUser;
};

type ResolveRequestScopeContextOptions = {
  regionId?: string | null;
  allowOperatorFallback?: boolean;
};

export type RequestScopeSummary = {
  organizationId: string | null;
  organizationLabel: string | null;
  membershipStatus: RequestScopeContext["membershipStatus"];
  organizationRole: RequestScopeContext["organizationRole"];
  roleLabel: string | null;
  regionIds: string[];
  primaryRegionId: string | null;
  isOperatorMode: boolean;
  operatorModeLabel: string | null;
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
  sourceBreakdown: RequestScopeSourceBreakdown;
};

type ResolveOrganizationMembershipInput = {
  actorId: string;
  isOperatorMode: boolean;
  actorSourceOfTruth: RequestScopeSourceOfTruth;
  actorRuntimeMarker: RequestScopeRuntimeMarker;
};

const VERIFIED_MEMBERSHIP_STATUSES = new Set<VerificationStatus>([
  "organization_verified",
  "unit_verified",
  "publication_approved",
]);

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function collectRoles(
  roles: SessionUser["roles"] | null | undefined,
  role: SessionUser["role"] | null | undefined,
): string[] {
  const direct = Array.isArray(roles)
    ? roles.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const fallback =
    typeof role === "string"
      ? role
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  return uniqueNonEmpty([...direct, ...fallback]).map((value) => value.toLowerCase());
}

function membershipIsActive(membership: OrganizationMembership): boolean {
  if (membership.revokedAt) return false;
  if (membership.expiresAt && Date.parse(membership.expiresAt) <= Date.now()) return false;
  return true;
}

function verificationRank(status: VerificationStatus | "none" | "admin_fallback") {
  switch (status) {
    case "publication_approved":
      return 7;
    case "unit_verified":
      return 6;
    case "organization_verified":
      return 5;
    case "email_verified":
      return 4;
    case "pending_review":
      return 3;
    case "unverified":
      return 2;
    case "rejected":
      return 1;
    case "revoked":
      return 0;
    case "admin_fallback":
      return 99;
    default:
      return -1;
  }
}

function organizationRolePriority(role: OrganizationRoleType) {
  switch (role) {
    case "admin":
      return 6;
    case "lead":
      return 5;
    case "communications":
      return 4;
    case "participation_officer":
      return 3;
    case "staff":
      return 2;
    case "external_contractor":
      return 1;
    case "custom":
    default:
      return 0;
  }
}

function pickPrimaryMembership(memberships: OrganizationMembership[]): OrganizationMembership | null {
  const active = memberships.filter(membershipIsActive);
  if (active.length === 0) return null;
  return [...active].sort((left, right) => {
    const verificationDelta =
      verificationRank(right.verificationStatus) - verificationRank(left.verificationStatus);
    if (verificationDelta !== 0) return verificationDelta;
    return organizationRolePriority(right.roleType) - organizationRolePriority(left.roleType);
  })[0] ?? null;
}

function deriveMembershipStatus(
  isOperatorMode: boolean,
  memberships: OrganizationMembership[],
): VerificationStatus | "none" | "admin_fallback" {
  if (isOperatorMode) return "admin_fallback";
  const primaryMembership = pickPrimaryMembership(memberships);
  return primaryMembership?.verificationStatus ?? "none";
}

function deriveGovernanceRole(input: {
  roles: string[];
  isOperatorMode: boolean;
  membershipStatus: VerificationStatus | "none" | "admin_fallback";
}): GovernanceActorRole | null {
  if (input.isOperatorMode) return "admin";
  const mapped = mapUserRolesToGovernanceRole(input.roles);
  if (mapped === "reviewer" || mapped === "editorial_actor" || mapped === "institutional_actor") {
    return mapped;
  }
  if (VERIFIED_MEMBERSHIP_STATUSES.has(input.membershipStatus as VerificationStatus)) {
    return "institutional_actor";
  }
  return null;
}

export async function resolveOrganizationMembershipForActor(
  input: ResolveOrganizationMembershipInput,
): Promise<OrganizationMembershipContext> {
  if (input.isOperatorMode) {
    return {
      organizationId: null,
      organizationIds: [],
      membershipId: null,
      membershipStatus: "admin_fallback",
      memberships: [],
      organizations: [],
      sourceOfTruth: input.actorSourceOfTruth,
      confidence: "admin_fallback",
      runtimeMarker: input.actorRuntimeMarker,
    };
  }

  try {
    const resolved = await getMembershipDirectoryAdapter().listMembershipDirectoryForActor(input.actorId);
    const memberships = resolved.memberships;
    const organizations = resolved.organizations;
    const primaryMembership = pickPrimaryMembership(memberships);
    return {
      organizationId: primaryMembership?.organizationId ?? null,
      organizationIds: uniqueNonEmpty(memberships.map((membership) => membership.organizationId)),
      membershipId: primaryMembership?.id ?? null,
      membershipStatus: deriveMembershipStatus(false, memberships),
      memberships,
      organizations,
      sourceOfTruth: resolved.sourceOfTruth,
      confidence: resolved.confidence,
      runtimeMarker: resolved.runtimeMarker,
    };
  } catch {
    return {
      organizationId: null,
      organizationIds: [],
      membershipId: null,
      membershipStatus: "none",
      memberships: [],
      organizations: [],
      sourceOfTruth: "external_provider_pending",
      confidence: "limited",
      runtimeMarker: "external_provider_pending",
    };
  }
}

export function mapSessionToOrganizationRole(input: {
  isOperatorMode: boolean;
  memberships: OrganizationMembership[];
  actorSourceOfTruth: RequestScopeSourceOfTruth;
  actorRuntimeMarker: RequestScopeRuntimeMarker;
  membershipSourceOfTruth: RequestScopeSourceOfTruth;
  membershipRuntimeMarker: RequestScopeRuntimeMarker;
}): OrganizationRoleContext {
  if (input.isOperatorMode) {
    return {
      organizationRole: "operator_admin",
      roleLabel: "Betreiber-Modus",
      membershipId: null,
      sourceOfTruth: input.actorSourceOfTruth,
      confidence: "admin_fallback",
      runtimeMarker: input.actorRuntimeMarker,
    };
  }
  const primaryMembership = pickPrimaryMembership(input.memberships);
  if (primaryMembership) {
    return {
      organizationRole: primaryMembership.roleType,
      roleLabel: primaryMembership.roleLabel,
      membershipId: primaryMembership.id,
      sourceOfTruth: input.membershipSourceOfTruth,
      confidence: "high",
      runtimeMarker: input.membershipRuntimeMarker,
    };
  }
  return {
    organizationRole: null,
    roleLabel: null,
    membershipId: null,
    sourceOfTruth: "external_provider_pending",
    confidence: "limited",
    runtimeMarker: "external_provider_pending",
  };
}

export async function resolveRegionAccessForOrganization(input: {
  actorId: string;
  actorRole: string;
  isOperatorMode: boolean;
  roles: string[];
  organizationIds?: string[] | null;
  regionId?: string | null;
}): Promise<{
  regionAccess: PersistedRegionAccessContext;
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
}> {
  return getMembershipDirectoryAdapter().resolveRegionAccess(input);
}

function buildRequestScopeContextFromUser(
  user: SessionUser | null,
  actorRuntime: Awaited<ReturnType<ReturnType<typeof getAuthProviderRuntimeAdapter>["getAuthenticatedActor"]>>,
  options: ResolveRequestScopeContextOptions = {},
): Promise<RequestScopeContext | null> {
  return (async () => {
    const actorId = user?._id?.toHexString?.() ?? "";
    if (!user || !user.sessionValid || !actorId) return null;

    const roles = collectRoles(user.roles, user.role);
    const allowOperatorFallback = options.allowOperatorFallback !== false;
    const isOperatorMode = allowOperatorFallback && userIsAdminDashboard(user);
    const organizationMembership = await resolveOrganizationMembershipForActor({
      actorId,
      isOperatorMode,
      actorSourceOfTruth: actorRuntime.sourceOfTruth,
      actorRuntimeMarker: actorRuntime.runtimeMarker,
    });
    const organizationRoleContext = mapSessionToOrganizationRole({
      isOperatorMode,
      memberships: organizationMembership.memberships,
      actorSourceOfTruth: actorRuntime.sourceOfTruth,
      actorRuntimeMarker: actorRuntime.runtimeMarker,
      membershipSourceOfTruth: organizationMembership.sourceOfTruth,
      membershipRuntimeMarker: organizationMembership.runtimeMarker,
    });
    const governanceRole = deriveGovernanceRole({
      roles,
      isOperatorMode,
      membershipStatus: organizationMembership.membershipStatus,
    });
    const actor: AuthenticatedActorContext = {
      actorId,
      actorType: "session_user",
      email: user.email?.trim() || null,
      roles,
      governanceRole,
      isOperatorMode,
      operatorModeLabel: isOperatorMode ? "Betreiber-Modus" : null,
      sourceOfTruth: actorRuntime.sourceOfTruth,
      confidence: isOperatorMode ? "admin_fallback" : actorRuntime.confidence,
      runtimeMarker: actorRuntime.runtimeMarker,
    };
    const actorRoleKey =
      governanceRole ??
      organizationRoleContext.organizationRole ??
      roles[0] ??
      "organization_member";
    const regionAccessResolved = await resolveRegionAccessForOrganization({
      actorId,
      actorRole: String(actorRoleKey),
      isOperatorMode,
      roles,
      organizationIds: organizationMembership.organizationIds,
      regionId: options.regionId ?? null,
    });
    const regionAccess = regionAccessResolved.regionAccess;
    const organizationSourceOfTruth =
      organizationMembership.organizationId || organizationMembership.organizationIds.length > 0
        ? organizationMembership.sourceOfTruth
        : regionAccess.organization.primaryOrganizationId
          ? regionAccessResolved.sourceOfTruth
          : actor.sourceOfTruth;
    const topLevelConfidence = isOperatorMode
      ? "admin_fallback"
      : organizationMembership.organizationIds.length > 0
        ? organizationMembership.confidence
        : actor.confidence;
    const topLevelRuntimeMarker =
      organizationMembership.organizationIds.length > 0
        ? organizationMembership.runtimeMarker
        : actor.runtimeMarker;

    return {
      actorId,
      actorType: actor.actorType,
      email: actor.email,
      organizationId:
        organizationMembership.organizationId ??
        regionAccess.organization.primaryOrganizationId ??
        null,
      membershipStatus: organizationMembership.membershipStatus,
      organizationRole: organizationRoleContext.organizationRole,
      regionIds: regionAccess.scopedRegionIds,
      isOperatorMode,
      operatorModeLabel: actor.operatorModeLabel,
      sourceOfTruth: organizationSourceOfTruth,
      confidence: topLevelConfidence,
      runtimeMarker: topLevelRuntimeMarker,
      sourceBreakdown: {
        actor: actor.sourceOfTruth,
        organization: organizationSourceOfTruth,
        organizationRole: organizationRoleContext.sourceOfTruth,
        regionAccess: regionAccessResolved.sourceOfTruth,
      },
      actor,
      organizationMembership,
      organizationRoleContext,
      regionAccess,
      regionAccessSourceOfTruth: regionAccessResolved.sourceOfTruth,
      regionAccessConfidence: regionAccessResolved.confidence,
      regionAccessRuntimeMarker: regionAccessResolved.runtimeMarker,
      user,
    };
  })();
}

export function summarizeRequestScopeContext(
  scopeContext: RequestScopeContext | null,
): RequestScopeSummary | null {
  if (!scopeContext) return null;
  const primaryOrganization =
    scopeContext.organizationMembership.organizations.find(
      (organization) => organization.id === scopeContext.organizationId,
    ) ??
    scopeContext.organizationMembership.organizations[0] ??
    null;
  const primaryMembership =
    scopeContext.organizationMembership.memberships.find(
      (membership) =>
        membership.id === scopeContext.organizationRoleContext.membershipId ||
        membership.organizationId === scopeContext.organizationId,
    ) ?? scopeContext.organizationMembership.memberships[0] ?? null;

  return {
    organizationId: scopeContext.organizationId,
    organizationLabel:
      primaryOrganization?.name?.trim() ||
      primaryMembership?.organizationName?.trim() ||
      null,
    membershipStatus: scopeContext.membershipStatus,
    organizationRole: scopeContext.organizationRole,
    roleLabel:
      scopeContext.organizationRoleContext.roleLabel?.trim() ||
      primaryMembership?.roleLabel?.trim() ||
      scopeContext.operatorModeLabel,
    regionIds: [...scopeContext.regionIds],
    primaryRegionId: scopeContext.regionIds[0] ?? null,
    isOperatorMode: scopeContext.isOperatorMode,
    operatorModeLabel: scopeContext.operatorModeLabel,
    sourceOfTruth: scopeContext.sourceOfTruth,
    confidence: scopeContext.confidence,
    runtimeMarker: scopeContext.runtimeMarker,
    sourceBreakdown: scopeContext.sourceBreakdown,
  };
}

export async function resolveCurrentRequestScopeContext(
  options: ResolveRequestScopeContextOptions = {},
): Promise<RequestScopeContext | null> {
  const actorRuntime = await getAuthProviderRuntimeAdapter().getAuthenticatedActor();
  return buildRequestScopeContextFromUser(actorRuntime.user, actorRuntime, options);
}

export async function resolveRequestScopeContext(
  request: NextRequest,
  options: ResolveRequestScopeContextOptions = {},
): Promise<RequestScopeContext | null> {
  const actorRuntime = await getAuthProviderRuntimeAdapter().getAuthenticatedActor(request);
  return buildRequestScopeContextFromUser(actorRuntime.user, actorRuntime, options);
}
