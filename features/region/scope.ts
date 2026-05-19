import type { RegionAccessContext } from "./access";

export type OrganizationScopeStatus =
  | "admin_fallback"
  | "verified_membership"
  | "pending_or_unverified";

export type OrganizationScopeContext = {
  mode: "global_operator" | "organization";
  userId: string | null;
  isAdmin: boolean;
  organizationIds: string[];
  primaryOrganizationId: string | null;
  status: OrganizationScopeStatus;
  operatorModeLabel: string | null;
};

export type RegionScopeContext = OrganizationScopeContext & {
  visibleRegionIds: string[];
  canApproveOfficial: boolean;
};

export type ReviewQueueScopeContext = RegionScopeContext & {
  governanceActorPresent: boolean;
};

export type OrganizationScopedResource = {
  organizationId?: string | null;
  ownerUserId?: string | null;
};

export type RegionScopedResource = OrganizationScopedResource & {
  regionId?: string | null;
};

export type ReviewQueueScopedResource = RegionScopedResource & {
  reviewAuthority?:
    | "standard_review"
    | "publication_approved_or_admin"
    | "apply_followup"
    | null;
};

type OrganizationScopeContextInput = {
  userId?: string | null;
  isAdmin?: boolean;
  organizationIds?: Array<string | null | undefined> | null;
  primaryOrganizationId?: string | null;
  status?: OrganizationScopeStatus | null;
};

type RegionScopeContextInput = OrganizationScopeContextInput & {
  visibleRegionIds?: Array<string | null | undefined> | null;
  canApproveOfficial?: boolean;
};

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function normalizeOrganizationScopeStatus(
  value: OrganizationScopeStatus | null | undefined,
  isAdmin: boolean,
): OrganizationScopeStatus {
  if (isAdmin) return "admin_fallback";
  if (value === "verified_membership") return value;
  return "pending_or_unverified";
}

export function buildOrganizationScopeContext(
  input: OrganizationScopeContextInput = {},
): OrganizationScopeContext {
  const isAdmin = Boolean(input.isAdmin);
  const organizationIds = uniqueNonEmpty(input.organizationIds ?? []);
  return {
    mode: isAdmin ? "global_operator" : "organization",
    userId: String(input.userId ?? "").trim() || null,
    isAdmin,
    organizationIds,
    primaryOrganizationId:
      String(input.primaryOrganizationId ?? "").trim() || organizationIds[0] || null,
    status: normalizeOrganizationScopeStatus(input.status, isAdmin),
    operatorModeLabel: isAdmin ? "Betreiber-Modus" : null,
  };
}

export function buildRegionScopeContext(
  input: RegionScopeContextInput = {},
): RegionScopeContext {
  const organizationScope = buildOrganizationScopeContext(input);
  return {
    ...organizationScope,
    visibleRegionIds: uniqueNonEmpty(input.visibleRegionIds ?? []),
    canApproveOfficial: organizationScope.isAdmin || Boolean(input.canApproveOfficial),
  };
}

export function buildReviewQueueScopeContext(
  input: RegionScopeContextInput & {
    governanceActorPresent?: boolean;
  } = {},
): ReviewQueueScopeContext {
  const regionScope = buildRegionScopeContext(input);
  return {
    ...regionScope,
    governanceActorPresent: Boolean(input.governanceActorPresent || regionScope.isAdmin),
  };
}

export function organizationScopeFromRegionAccessContext(
  accessContext: RegionAccessContext,
): OrganizationScopeContext {
  return buildOrganizationScopeContext({
    userId: accessContext.userId,
    isAdmin: accessContext.isAdmin,
    organizationIds: accessContext.organization.organizationIds,
    primaryOrganizationId: accessContext.organization.primaryOrganizationId,
    status:
      accessContext.isAdmin
        ? "admin_fallback"
        : accessContext.verifiedRegionIds.length > 0
          ? "verified_membership"
          : "pending_or_unverified",
  });
}

export function regionScopeFromRegionAccessContext(input: {
  accessContext: RegionAccessContext;
  canApproveOfficial?: boolean;
}): RegionScopeContext {
  return buildRegionScopeContext({
    userId: input.accessContext.userId,
    isAdmin: input.accessContext.isAdmin,
    organizationIds: input.accessContext.organization.organizationIds,
    primaryOrganizationId: input.accessContext.organization.primaryOrganizationId,
    visibleRegionIds: input.accessContext.verifiedRegionIds,
    canApproveOfficial:
      input.canApproveOfficial ??
      input.accessContext.allowedActions.includes("approve_publication"),
    status:
      input.accessContext.isAdmin
        ? "admin_fallback"
        : input.accessContext.verifiedRegionIds.length > 0
          ? "verified_membership"
          : "pending_or_unverified",
  });
}

export function canViewOrganizationResource(
  scope: OrganizationScopeContext,
  resource: OrganizationScopedResource,
): boolean {
  if (scope.isAdmin) return true;
  const ownerUserId = String(resource.ownerUserId ?? "").trim();
  if (ownerUserId && scope.userId && ownerUserId === scope.userId) return true;
  const organizationId = String(resource.organizationId ?? "").trim();
  if (!organizationId) return false;
  return scope.organizationIds.includes(organizationId);
}

export function canEditOrganizationResource(
  scope: OrganizationScopeContext,
  resource: OrganizationScopedResource,
): boolean {
  if (scope.isAdmin) return true;
  const ownerUserId = String(resource.ownerUserId ?? "").trim();
  if (ownerUserId && scope.userId && ownerUserId === scope.userId) return true;
  if (scope.status !== "verified_membership") return false;
  return canViewOrganizationResource(scope, resource);
}

export function canViewRegionResource(
  scope: RegionScopeContext,
  resource: RegionScopedResource,
): boolean {
  if (scope.isAdmin) return true;
  if (canViewOrganizationResource(scope, resource)) return true;
  const regionId = String(resource.regionId ?? "").trim();
  if (!regionId) return false;
  return scope.visibleRegionIds.includes(regionId);
}

export function canOperateReviewItem(
  scope: ReviewQueueScopeContext,
  resource: ReviewQueueScopedResource,
): boolean {
  if (!canViewRegionResource(scope, resource)) return false;
  if (scope.isAdmin) return true;
  if (resource.reviewAuthority === "publication_approved_or_admin") {
    return scope.canApproveOfficial;
  }
  if (resource.reviewAuthority === "apply_followup") {
    return canEditOrganizationResource(scope, resource);
  }
  const organizationId = String(resource.organizationId ?? "").trim();
  if (organizationId) return canEditOrganizationResource(scope, resource);
  return scope.status === "verified_membership";
}
