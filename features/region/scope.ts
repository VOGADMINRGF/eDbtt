import type { RegionAccessContext } from "./access";
import type { RegionAllowedAction } from "./access";
import type { VerificationStatus } from "./organizationOnboarding";

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

export const ORGANIZATION_MODERATION_ROLES = [
  "organization_verified",
  "unit_verified",
  "publication_approved",
  "admin_fallback",
] as const;

export type OrganizationModerationRole =
  (typeof ORGANIZATION_MODERATION_ROLES)[number];

export const ORGANIZATION_MODERATION_ACTIONS = [
  "add_note",
  "request_changes",
  "mark_in_review",
  "mark_ready",
  "archive",
  "block",
  "prepare_content_release",
  "make_content_visible",
  "archive_content",
  "view_audit_trail",
] as const;

export type OrganizationModerationAction =
  (typeof ORGANIZATION_MODERATION_ACTIONS)[number];

export type NonAdminModerationPermission = {
  role: OrganizationModerationRole | null;
  allowedActions: OrganizationModerationAction[];
  canOperateOwnReviewItem: boolean;
  canPrepareOwnContentRelease: boolean;
  canMakeOwnContentVisible: boolean;
  canArchiveOwnContent: boolean;
  canViewOwnAuditTrail: boolean;
  operatorModeLabel: string | null;
  scopeCopy: string;
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

function organizationModerationRoleFrom(input: {
  isAdmin: boolean;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
}): OrganizationModerationRole | null {
  if (input.isAdmin || input.verificationStatus === "admin_fallback") {
    return "admin_fallback";
  }
  if (
    input.verificationStatus === "organization_verified" ||
    input.verificationStatus === "unit_verified" ||
    input.verificationStatus === "publication_approved"
  ) {
    return input.verificationStatus;
  }
  return null;
}

function moderationActionsForRole(
  role: OrganizationModerationRole | null,
): OrganizationModerationAction[] {
  switch (role) {
    case "organization_verified":
      return ["add_note", "request_changes", "mark_in_review", "view_audit_trail"];
    case "unit_verified":
      return [
        "add_note",
        "request_changes",
        "mark_in_review",
        "mark_ready",
        "archive",
        "block",
        "prepare_content_release",
        "archive_content",
        "view_audit_trail",
      ];
    case "publication_approved":
      return [
        "add_note",
        "request_changes",
        "mark_in_review",
        "mark_ready",
        "archive",
        "block",
        "prepare_content_release",
        "make_content_visible",
        "archive_content",
        "view_audit_trail",
      ];
    case "admin_fallback":
      return [...ORGANIZATION_MODERATION_ACTIONS];
    default:
      return [];
  }
}

function canTouchOwnItem(
  scope: RegionScopeContext,
  resource: ReviewQueueScopedResource,
): boolean {
  return canViewRegionResource(scope, resource);
}

function ownReviewActionAllowed(input: {
  role: OrganizationModerationRole | null;
  resource: ReviewQueueScopedResource;
  action: Exclude<
    OrganizationModerationAction,
    "prepare_content_release" | "make_content_visible" | "archive_content" | "view_audit_trail"
  >;
}) {
  if (input.role === "admin_fallback") return true;
  if (!input.role) return false;
  if (input.resource.reviewAuthority === "publication_approved_or_admin") return false;
  return moderationActionsForRole(input.role).includes(input.action);
}

export function canOperateOwnReviewItem(input: {
  scope: RegionScopeContext;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  resource: ReviewQueueScopedResource;
  action?:
    | "add_note"
    | "request_changes"
    | "mark_in_review"
    | "mark_ready"
    | "archive"
    | "block";
}): boolean {
  const role = organizationModerationRoleFrom({
    isAdmin: input.scope.isAdmin,
    verificationStatus: input.verificationStatus,
  });
  if (!canTouchOwnItem(input.scope, input.resource)) return false;
  if (input.scope.isAdmin) return true;
  if (!role) return false;
  if (!input.action) {
    return (
      ownReviewActionAllowed({ role, resource: input.resource, action: "add_note" }) ||
      ownReviewActionAllowed({
        role,
        resource: input.resource,
        action: "request_changes",
      }) ||
      ownReviewActionAllowed({
        role,
        resource: input.resource,
        action: "mark_in_review",
      }) ||
      ownReviewActionAllowed({ role, resource: input.resource, action: "mark_ready" }) ||
      ownReviewActionAllowed({ role, resource: input.resource, action: "archive" }) ||
      ownReviewActionAllowed({ role, resource: input.resource, action: "block" })
    );
  }
  return ownReviewActionAllowed({
    role,
    resource: input.resource,
    action: input.action,
  });
}

export function canPrepareOwnContentRelease(input: {
  scope: RegionScopeContext;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  resource: ReviewQueueScopedResource;
  allowedActions?: RegionAllowedAction[];
}): boolean {
  if (!canTouchOwnItem(input.scope, input.resource)) return false;
  const role = organizationModerationRoleFrom({
    isAdmin: input.scope.isAdmin,
    verificationStatus: input.verificationStatus,
  });
  if (role === "admin_fallback") return true;
  if (role !== "unit_verified" && role !== "publication_approved") return false;
  const allowedActions = input.allowedActions ?? [];
  return (
    allowedActions.includes("create_dossier_draft") ||
    allowedActions.includes("create_anlassraum_draft") ||
    allowedActions.includes("submit_for_review")
  );
}

export function canMakeOwnContentVisible(input: {
  scope: RegionScopeContext;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  resource: ReviewQueueScopedResource;
  allowedActions?: RegionAllowedAction[];
}): boolean {
  if (!canTouchOwnItem(input.scope, input.resource)) return false;
  const role = organizationModerationRoleFrom({
    isAdmin: input.scope.isAdmin,
    verificationStatus: input.verificationStatus,
  });
  if (role === "admin_fallback") return true;
  if (role !== "publication_approved") return false;
  return (input.allowedActions ?? []).includes("approve_publication");
}

export function canArchiveOwnContent(input: {
  scope: RegionScopeContext;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  resource: ReviewQueueScopedResource;
}): boolean {
  if (!canTouchOwnItem(input.scope, input.resource)) return false;
  const role = organizationModerationRoleFrom({
    isAdmin: input.scope.isAdmin,
    verificationStatus: input.verificationStatus,
  });
  return role === "unit_verified" || role === "publication_approved" || role === "admin_fallback";
}

export function canViewOwnAuditTrail(input: {
  scope: RegionScopeContext;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  resource: ReviewQueueScopedResource;
}): boolean {
  if (!canTouchOwnItem(input.scope, input.resource)) return false;
  return Boolean(
    organizationModerationRoleFrom({
      isAdmin: input.scope.isAdmin,
      verificationStatus: input.verificationStatus,
    }),
  );
}

export function buildNonAdminModerationPermission(input: {
  scope: RegionScopeContext;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  allowedActions?: RegionAllowedAction[];
  resource: ReviewQueueScopedResource;
}): NonAdminModerationPermission {
  const role = organizationModerationRoleFrom({
    isAdmin: input.scope.isAdmin,
    verificationStatus: input.verificationStatus,
  });
  const allowedActions = moderationActionsForRole(role).filter((action) => {
    switch (action) {
      case "prepare_content_release":
        return canPrepareOwnContentRelease(input);
      case "make_content_visible":
        return canMakeOwnContentVisible(input);
      case "archive_content":
        return canArchiveOwnContent(input);
      case "view_audit_trail":
        return canViewOwnAuditTrail(input);
      case "add_note":
      case "request_changes":
      case "mark_in_review":
      case "mark_ready":
      case "archive":
      case "block":
        return canOperateOwnReviewItem({
          scope: input.scope,
          verificationStatus: input.verificationStatus,
          resource: input.resource,
          action,
        });
      default:
        return false;
    }
  });

  return {
    role,
    allowedActions,
    canOperateOwnReviewItem:
      canOperateOwnReviewItem({
        scope: input.scope,
        verificationStatus: input.verificationStatus,
        resource: input.resource,
      }),
    canPrepareOwnContentRelease: canPrepareOwnContentRelease(input),
    canMakeOwnContentVisible: canMakeOwnContentVisible(input),
    canArchiveOwnContent: canArchiveOwnContent(input),
    canViewOwnAuditTrail: canViewOwnAuditTrail(input),
    operatorModeLabel: input.scope.operatorModeLabel,
    scopeCopy: "Diese Aktion betrifft nur den Arbeitsstand deiner Organisation.",
  };
}
