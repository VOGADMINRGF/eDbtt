import type { NextRequest } from "next/server";
import { mapUserRolesToGovernanceRole } from "@features/trust/gates";
import type { GovernanceActorRole } from "@features/trust/types";
import {
  type Organization,
  type OrganizationMembership,
  type RegionAccessContext as PersistedRegionAccessContext,
} from "@features/region";
import type { SessionUser } from "./sessionUser";
import {
  collectCurrentOrganizationIds,
  collectVerifiedOrganizationIds,
  hasPublicationVisibilityAccess,
  hasVerifiedMembershipWriteAccess,
  type MembershipStatus,
  type OrganizationMembershipRole,
  pickPrimaryMembership,
  mapMembershipToOrganizationRole,
  normalizeMembershipStatus,
  type RequestScopeConfidence,
  type RequestScopeRuntimeMarker,
  type RequestScopeSourceOfTruth,
} from "./membershipDirectoryRepository";
import { userIsAdminDashboard } from "./roles";
import {
  getAuthProviderRuntimeAdapter,
  getMembershipDirectoryRepository,
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
  verifiedOrganizationIds: string[];
  membershipId: string | null;
  membershipStatus: MembershipStatus;
  memberships: OrganizationMembership[];
  organizations: Organization[];
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export type OrganizationRoleContext = {
  organizationRole: OrganizationMembershipRole | null;
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

function deriveMembershipStatus(
  isOperatorMode: boolean,
  memberships: OrganizationMembership[],
) : MembershipStatus {
  if (isOperatorMode) return "verified";
  const primaryMembership = pickPrimaryMembership(memberships);
  return normalizeMembershipStatus(primaryMembership);
}

function deriveGovernanceRole(input: {
  roles: string[];
  isOperatorMode: boolean;
  membershipStatus: MembershipStatus;
}): GovernanceActorRole | null {
  if (input.isOperatorMode) return "admin";
  const mapped = mapUserRolesToGovernanceRole(input.roles);
  if (mapped === "reviewer" || mapped === "editorial_actor" || mapped === "institutional_actor") {
    return mapped;
  }
  if (input.membershipStatus === "verified") {
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
      verifiedOrganizationIds: [],
      membershipId: null,
      membershipStatus: "verified",
      memberships: [],
      organizations: [],
      sourceOfTruth: input.actorSourceOfTruth,
      confidence: "admin_fallback",
      runtimeMarker: input.actorRuntimeMarker,
    };
  }

  try {
    const resolved = await getMembershipDirectoryRepository().listMembershipDirectoryForActor(input.actorId);
    const memberships = resolved.memberships;
    const organizations = resolved.organizations;
    const primaryMembership = pickPrimaryMembership(memberships);
    const membershipStatus = deriveMembershipStatus(false, memberships);
    const organizationIds = collectCurrentOrganizationIds(memberships);
    const verifiedOrganizationIds = collectVerifiedOrganizationIds(memberships);
    return {
      organizationId:
        membershipStatus === "pending" || membershipStatus === "verified"
          ? primaryMembership?.organizationId ?? null
          : null,
      organizationIds,
      verifiedOrganizationIds,
      membershipId: primaryMembership?.id ?? null,
      membershipStatus,
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
      verifiedOrganizationIds: [],
      membershipId: null,
      membershipStatus: "none",
      memberships: [],
      organizations: [],
      sourceOfTruth: "external_directory_pending",
      confidence: "limited",
      runtimeMarker: "external_directory_pending",
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
      organizationRole: "operator",
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
      organizationRole: mapMembershipToOrganizationRole(primaryMembership),
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
    sourceOfTruth: "external_directory_pending",
    confidence: "limited",
    runtimeMarker: "external_directory_pending",
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
  return getMembershipDirectoryRepository().resolveRegionAccess(input);
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
      organizationIds: organizationMembership.verifiedOrganizationIds,
      regionId: options.regionId ?? null,
    });
    const regionAccess = regionAccessResolved.regionAccess;
    const organizationSourceOfTruth =
      organizationMembership.sourceOfTruth === "external_directory_pending"
        ? "external_directory_pending"
        : organizationMembership.organizationId || organizationMembership.organizationIds.length > 0
        ? organizationMembership.sourceOfTruth
        : regionAccess.organization.primaryOrganizationId
          ? regionAccessResolved.sourceOfTruth
          : organizationMembership.sourceOfTruth !== actor.sourceOfTruth
            ? organizationMembership.sourceOfTruth
            : actor.sourceOfTruth;
    const topLevelConfidence = isOperatorMode
      ? "admin_fallback"
      : organizationMembership.organizationIds.length > 0 ||
          organizationMembership.sourceOfTruth === "external_directory_pending"
        ? organizationMembership.confidence
        : actor.confidence;
    const topLevelRuntimeMarker =
      organizationMembership.organizationIds.length > 0 ||
        organizationMembership.sourceOfTruth === "external_directory_pending"
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

export function requestScopeCanWriteOrganizationRoutes(
  scopeContext: Pick<
    RequestScopeContext,
    "membershipStatus" | "organizationRole" | "isOperatorMode" | "sourceOfTruth"
  >,
): boolean {
  return hasVerifiedMembershipWriteAccess({
    membershipStatus: scopeContext.membershipStatus,
    organizationRole: scopeContext.organizationRole,
    isOperatorMode: scopeContext.isOperatorMode,
    sourceOfTruth: scopeContext.sourceOfTruth,
  });
}

export function requestScopeCanManageOrganizationVisibility(
  scopeContext: Pick<
    RequestScopeContext,
    "membershipStatus" | "organizationRole" | "isOperatorMode" | "sourceOfTruth"
  >,
): boolean {
  return hasPublicationVisibilityAccess({
    membershipStatus: scopeContext.membershipStatus,
    organizationRole: scopeContext.organizationRole,
    isOperatorMode: scopeContext.isOperatorMode,
    sourceOfTruth: scopeContext.sourceOfTruth,
  });
}
