import type {
  Organization,
  OrganizationMembership,
  RegionAccessContext,
} from "@features/region";

export type RequestScopeSourceOfTruth =
  | "session"
  | "persistent_membership_store"
  | "external_directory_pending"
  | "fixture_demo";

export type RequestScopeConfidence = "high" | "admin_fallback" | "limited";

export type RequestScopeRuntimeMarker =
  | "production_runtime"
  | "demo_or_test_runtime"
  | "external_directory_pending";

export type MembershipStatus = "none" | "pending" | "verified" | "suspended" | "revoked";

export type OrganizationMembershipRole =
  | "owner"
  | "admin"
  | "editor"
  | "reviewer"
  | "viewer"
  | "publication_approved"
  | "operator";

export type MembershipDirectoryRuntimeRecord = {
  memberships: OrganizationMembership[];
  organizations: Organization[];
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export type RegionAccessRuntimeRecord = {
  regionAccess: RegionAccessContext;
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export interface MembershipDirectoryRepository {
  listMembershipDirectoryForActor(actorId: string): Promise<MembershipDirectoryRuntimeRecord>;
  resolveRegionAccess(input: {
    actorId: string;
    actorRole: string;
    isOperatorMode: boolean;
    roles: string[];
    organizationIds?: string[] | null;
    regionId?: string | null;
  }): Promise<RegionAccessRuntimeRecord>;
}

export type MembershipDirectoryAdapter = MembershipDirectoryRepository;

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

export function isMembershipExpired(membership: OrganizationMembership): boolean {
  return Boolean(membership.expiresAt && Date.parse(membership.expiresAt) <= Date.now());
}

export function normalizeMembershipStatus(
  membership: OrganizationMembership | null | undefined,
): MembershipStatus {
  if (!membership) return "none";
  if (membership.revokedAt || membership.verificationStatus === "revoked" || membership.verificationStatus === "rejected") {
    return "revoked";
  }
  if (isMembershipExpired(membership)) {
    return "suspended";
  }
  if (
    membership.verificationStatus === "organization_verified" ||
    membership.verificationStatus === "unit_verified" ||
    membership.verificationStatus === "publication_approved"
  ) {
    return "verified";
  }
  return "pending";
}

export function membershipStatusRank(status: MembershipStatus): number {
  switch (status) {
    case "verified":
      return 50;
    case "pending":
      return 40;
    case "suspended":
      return 30;
    case "revoked":
      return 20;
    case "none":
    default:
      return 0;
  }
}

export function mapMembershipToOrganizationRole(
  membership: OrganizationMembership | null | undefined,
): OrganizationMembershipRole | null {
  if (!membership) return null;
  if (normalizeMembershipStatus(membership) === "revoked" || normalizeMembershipStatus(membership) === "suspended") {
    return null;
  }
  if (
    membership.verificationStatus === "publication_approved" ||
    membership.allowedActions.includes("approve_publication")
  ) {
    return "publication_approved";
  }
  switch (membership.roleType) {
    case "lead":
      return "owner";
    case "admin":
      return "admin";
    case "communications":
      return "editor";
    case "participation_officer":
      return "reviewer";
    case "staff":
      return membership.allowedActions.includes("review_region_signal") ? "reviewer" : "editor";
    case "external_contractor":
      return "viewer";
    case "custom":
    default:
      return "viewer";
  }
}

export function organizationRolePriority(role: OrganizationMembershipRole | null): number {
  switch (role) {
    case "publication_approved":
      return 70;
    case "owner":
      return 60;
    case "admin":
      return 50;
    case "reviewer":
      return 40;
    case "editor":
      return 30;
    case "viewer":
      return 20;
    case "operator":
      return 99;
    default:
      return 0;
  }
}

export function pickPrimaryMembership(
  memberships: OrganizationMembership[],
): OrganizationMembership | null {
  if (memberships.length === 0) return null;
  return [...memberships].sort((left, right) => {
    const statusDelta =
      membershipStatusRank(normalizeMembershipStatus(right)) -
      membershipStatusRank(normalizeMembershipStatus(left));
    if (statusDelta !== 0) return statusDelta;
    const roleDelta =
      organizationRolePriority(mapMembershipToOrganizationRole(right)) -
      organizationRolePriority(mapMembershipToOrganizationRole(left));
    if (roleDelta !== 0) return roleDelta;
    return String(right.updatedAt).localeCompare(String(left.updatedAt));
  })[0] ?? null;
}

export function collectCurrentOrganizationIds(
  memberships: OrganizationMembership[],
): string[] {
  return uniqueNonEmpty(
    memberships.flatMap((membership) => {
      const status = normalizeMembershipStatus(membership);
      return status === "pending" || status === "verified" ? [membership.organizationId] : [];
    }),
  );
}

export function collectVerifiedOrganizationIds(
  memberships: OrganizationMembership[],
): string[] {
  return uniqueNonEmpty(
    memberships.flatMap((membership) =>
      normalizeMembershipStatus(membership) === "verified" ? [membership.organizationId] : [],
    ),
  );
}

export function hasVerifiedMembershipWriteAccess(input: {
  membershipStatus: MembershipStatus;
  organizationRole: OrganizationMembershipRole | null;
  isOperatorMode: boolean;
  sourceOfTruth?: RequestScopeSourceOfTruth | null;
}): boolean {
  if (input.isOperatorMode) return true;
  if (input.sourceOfTruth === "external_directory_pending") return false;
  if (input.membershipStatus !== "verified") return false;
  return (
    input.organizationRole === "owner" ||
    input.organizationRole === "admin" ||
    input.organizationRole === "editor" ||
    input.organizationRole === "reviewer" ||
    input.organizationRole === "publication_approved"
  );
}

export function hasPublicationVisibilityAccess(input: {
  membershipStatus: MembershipStatus;
  organizationRole: OrganizationMembershipRole | null;
  isOperatorMode: boolean;
  sourceOfTruth?: RequestScopeSourceOfTruth | null;
}): boolean {
  if (input.isOperatorMode) return true;
  if (input.sourceOfTruth === "external_directory_pending") return false;
  return input.membershipStatus === "verified" && input.organizationRole === "publication_approved";
}

export function isProductionMembershipTruth(sourceOfTruth: RequestScopeSourceOfTruth): boolean {
  return sourceOfTruth === "persistent_membership_store";
}

export function sourceOfTruthLabel(sourceOfTruth: RequestScopeSourceOfTruth): string {
  switch (sourceOfTruth) {
    case "persistent_membership_store":
      return "Persistenter Membership-Store";
    case "external_directory_pending":
      return "Directory-Anbindung ausstehend";
    case "fixture_demo":
      return "Demo- oder Testwahrheit";
    case "session":
    default:
      return "Session-Kontext";
  }
}

export function membershipStatusLabel(status: MembershipStatus): string {
  switch (status) {
    case "verified":
      return "Verifiziert";
    case "pending":
      return "In Prüfung";
    case "suspended":
      return "Ausgesetzt";
    case "revoked":
      return "Widerrufen";
    case "none":
    default:
      return "Kein Membership-Kontext";
  }
}
