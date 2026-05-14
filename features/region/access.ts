import {
  allowedActionsForVerificationStatus,
  type VerificationStatus,
  type OnboardingAllowedAction,
  type Organization,
  type OrganizationMembership,
} from "./organizationOnboarding";

export const REGION_ALLOWED_ACTIONS = [
  "read_region_dashboard",
  "review_region_signal",
  "create_region_draft",
  "attach_signal_to_dossier",
  "create_dossier_draft",
  "create_anlassraum_draft",
  "submit_for_review",
  "approve_publication",
  "manage_organization_members",
] as const;

export type RegionAllowedAction = (typeof REGION_ALLOWED_ACTIONS)[number];

export type OrganizationAccessContext = {
  organizationIds: string[];
  primaryOrganizationId: string | null;
  paidDashboardEntitlement: "placeholder_not_enforced" | "granted" | "missing";
  entitlementSource: "contract_placeholder";
};

export type RegionAccessAuthoritySource =
  | "admin_fallback"
  | "verified_membership"
  | "unverified_hint_only";

export type RegionAccessContext = {
  userId: string | null;
  actorRole: string;
  isAdmin: boolean;
  authoritySource: RegionAccessAuthoritySource;
  adminFallback: boolean;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  roles: string[];
  hintedRegionIds: string[];
  verifiedRegionIds: string[];
  scopedRegionIds: string[];
  organization: OrganizationAccessContext;
  allowedActions: RegionAllowedAction[];
};

type RegionAccessContextInput = {
  userId?: string | null;
  actorRole?: string | null;
  isAdmin?: boolean;
  roles?: string[] | null;
  scopedRegionIds?: string[] | null;
  organizationIds?: string[] | null;
  paidDashboardEntitlement?: OrganizationAccessContext["paidDashboardEntitlement"];
  memberships?: OrganizationMembership[] | null;
  organizations?: Organization[] | null;
};

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function membershipIsActive(membership: OrganizationMembership): boolean {
  if (membership.revokedAt) return false;
  if (membership.expiresAt && Date.parse(membership.expiresAt) <= Date.now()) return false;
  return true;
}

function extractScopedRegionIds(roles: string[]): string[] {
  const scoped = roles.flatMap((role) => {
    const normalized = String(role || "").trim().toLowerCase();
    if (!normalized) return [];
    if (normalized.startsWith("region_staff:")) return [normalized.slice("region_staff:".length)];
    if (normalized.startsWith("region_access:")) return [normalized.slice("region_access:".length)];
    if (normalized.startsWith("region_dashboard:")) return [normalized.slice("region_dashboard:".length)];
    return [];
  });
  return uniqueNonEmpty(scoped);
}

function defaultAllowedActions(input: { isAdmin: boolean }): RegionAllowedAction[] {
  if (input.isAdmin) return [...REGION_ALLOWED_ACTIONS];
  return [];
}

function mergeAllowedActions(
  defaults: RegionAllowedAction[],
  memberships: OrganizationMembership[],
): RegionAllowedAction[] {
  const granted = memberships.flatMap((membership) => {
    if (!membershipIsActive(membership)) return [];
    const explicit = Array.isArray(membership.allowedActions) ? membership.allowedActions : [];
    return explicit.length > 0
      ? explicit
      : allowedActionsForVerificationStatus(membership.verificationStatus);
  });
  return uniqueNonEmpty([...defaults, ...granted]) as RegionAllowedAction[];
}

function deriveScopedRegionIdsFromMemberships(
  memberships: OrganizationMembership[],
  organizations: Organization[],
): string[] {
  const orgMap = new Map(organizations.map((organization) => [organization.id, organization]));
  return uniqueNonEmpty(
    memberships.flatMap((membership) => {
      if (!membershipIsActive(membership)) return [];
      if (membership.regionId) return [membership.regionId];
      const organization = orgMap.get(membership.organizationId);
      if (!organization) return [];
      return organization.primaryRegionId ? [organization.primaryRegionId] : [];
    }),
  );
}

function deriveVerifiedRegionIdsFromMemberships(
  memberships: OrganizationMembership[],
  organizations: Organization[],
): string[] {
  const orgMap = new Map(organizations.map((organization) => [organization.id, organization]));
  return uniqueNonEmpty(
    memberships.flatMap((membership) => {
      if (
        !membershipIsActive(membership) ||
        membership.verificationStatus !== "organization_verified" &&
        membership.verificationStatus !== "unit_verified" &&
        membership.verificationStatus !== "publication_approved"
      ) {
        return [];
      }
      if (membership.regionId) return [membership.regionId];
      const organization = orgMap.get(membership.organizationId);
      if (!organization) return [];
      return organization.primaryRegionId ? [organization.primaryRegionId] : [];
    }),
  );
}

function resolveHighestVerificationStatus(
  isAdmin: boolean,
  memberships: OrganizationMembership[],
): VerificationStatus | "none" | "admin_fallback" {
  if (isAdmin) return "admin_fallback";
  const precedence: VerificationStatus[] = [
    "publication_approved",
    "unit_verified",
    "organization_verified",
    "email_verified",
    "pending_review",
    "unverified",
    "rejected",
    "revoked",
  ];

  for (const status of precedence) {
    if (memberships.some((membership) => membership.verificationStatus === status)) return status;
  }
  return "none";
}

export function buildOrganizationAccessContext(input: {
  organizationIds?: string[] | null;
  paidDashboardEntitlement?: OrganizationAccessContext["paidDashboardEntitlement"];
} = {}): OrganizationAccessContext {
  const organizationIds = uniqueNonEmpty(input.organizationIds ?? []);
  return {
    organizationIds,
    primaryOrganizationId: organizationIds[0] ?? null,
    paidDashboardEntitlement: input.paidDashboardEntitlement ?? "placeholder_not_enforced",
    entitlementSource: "contract_placeholder",
  };
}

export function buildRegionAccessContext(input: RegionAccessContextInput = {}): RegionAccessContext {
  const roles = uniqueNonEmpty(input.roles ?? []).map((role) => role.toLowerCase());
  const isAdmin = Boolean(input.isAdmin || roles.includes("admin"));
  const memberships = Array.isArray(input.memberships) ? input.memberships : [];
  const organizations = Array.isArray(input.organizations) ? input.organizations : [];
  const hintedRegionIds = uniqueNonEmpty([
    ...(input.scopedRegionIds ?? []),
    ...extractScopedRegionIds(roles),
  ]);
  const membershipScopedRegionIds = deriveScopedRegionIdsFromMemberships(memberships, organizations);
  const verifiedRegionIds = deriveVerifiedRegionIdsFromMemberships(memberships, organizations);
  const scopedRegionIds = uniqueNonEmpty([
    ...hintedRegionIds,
    ...membershipScopedRegionIds,
  ]);
  const allowedActions = mergeAllowedActions(
    defaultAllowedActions({ isAdmin }),
    memberships,
  );
  const authoritySource: RegionAccessAuthoritySource = isAdmin
    ? "admin_fallback"
    : verifiedRegionIds.length > 0
      ? "verified_membership"
      : "unverified_hint_only";
  const verificationStatus = resolveHighestVerificationStatus(isAdmin, memberships);

  return {
    userId: input.userId ?? null,
    actorRole: String(input.actorRole ?? (isAdmin ? "admin" : scopedRegionIds.length > 0 ? "region_staff" : "unknown")),
    isAdmin,
    authoritySource,
    adminFallback: isAdmin,
    verificationStatus,
    roles,
    hintedRegionIds,
    verifiedRegionIds,
    scopedRegionIds,
    organization: buildOrganizationAccessContext({
      organizationIds: input.organizationIds,
      paidDashboardEntitlement: input.paidDashboardEntitlement,
    }),
    allowedActions,
  };
}

function contextCanAccessRegion(context: RegionAccessContext, regionId: string): boolean {
  if (context.isAdmin) return true;
  const target = String(regionId || "").trim().toLowerCase();
  return context.verifiedRegionIds.map((value) => value.toLowerCase()).includes(target);
}

function contextAllowsAction(
  context: RegionAccessContext,
  action: RegionAllowedAction,
  regionId: string,
): boolean {
  return contextCanAccessRegion(context, regionId) && context.allowedActions.includes(action);
}

export function canReadRegionDashboard(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "read_region_dashboard", regionId);
}

export function canReviewRegionSignal(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "review_region_signal", regionId);
}

export function canCreateRegionDraft(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "create_region_draft", regionId);
}

export function canAttachSignalToDossier(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "attach_signal_to_dossier", regionId);
}

export function canCreateDossierDraft(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "create_dossier_draft", regionId);
}

export function canCreateAnlassraumDraft(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "create_anlassraum_draft", regionId);
}

export function canSubmitForReview(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "submit_for_review", regionId);
}

export function canApprovePublication(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "approve_publication", regionId);
}

export function canManageOrganizationMembers(context: RegionAccessContext, regionId: string): boolean {
  return contextAllowsAction(context, "manage_organization_members", regionId);
}

export function supportsSelfDeclaredOrganizationClaimsAsVerifiedAccess(): false {
  return false;
}
