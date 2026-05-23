import type {
  Organization,
  OrganizationMembership,
  RegionAccessContext,
} from "@features/region";
import {
  isVerificationAuditBacked,
  normalizeDirectoryVerificationStatus,
} from "@features/region";

export type RequestScopeSourceOfTruth =
  | "session"
  | "persistent_membership_store"
  | "operator_verified_directory"
  | "external_directory_integrated"
  | "external_directory_pending"
  | "fixture_demo";

export type RequestScopeConfidence = "high" | "admin_fallback" | "limited";

export type RequestScopeRuntimeMarker =
  | "production_runtime"
  | "demo_or_test_runtime"
  | "external_directory_pending";

export type MembershipStatus =
  | "none"
  | "pending"
  | "evidence_required"
  | "operator_review_required"
  | "verified"
  | "limited"
  | "suspended"
  | "revoked";

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

export type MembershipDirectorySummary = {
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
  auditBacked: boolean;
  productionTruth: boolean;
  membershipStatus: MembershipStatus;
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
  if (
    membership.revokedAt ||
    membership.verificationStatus === "revoked" ||
    membership.verificationStatus === "rejected"
  ) {
    return "revoked";
  }
  if (
    isMembershipExpired(membership) ||
    membership.verificationStatus === "suspended"
  ) {
    return "suspended";
  }
  return normalizeDirectoryVerificationStatus({
    verificationStatus: membership.verificationStatus,
    revokedAt: membership.revokedAt ?? null,
    expiresAt: membership.expiresAt ?? null,
  });
}

export function membershipStatusRank(status: MembershipStatus): number {
  switch (status) {
    case "verified":
      return 60;
    case "limited":
      return 50;
    case "operator_review_required":
      return 40;
    case "pending":
      return 35;
    case "evidence_required":
      return 30;
    case "suspended":
      return 20;
    case "revoked":
      return 10;
    case "none":
    default:
      return 0;
  }
}

export function mapMembershipToOrganizationRole(
  membership: OrganizationMembership | null | undefined,
): OrganizationMembershipRole | null {
  if (!membership) return null;
  if (
    normalizeMembershipStatus(membership) === "revoked" ||
    normalizeMembershipStatus(membership) === "suspended" ||
    normalizeMembershipStatus(membership) === "evidence_required" ||
    normalizeMembershipStatus(membership) === "operator_review_required" ||
    normalizeMembershipStatus(membership) === "pending"
  ) {
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
      return status === "pending" ||
        status === "evidence_required" ||
        status === "operator_review_required" ||
        status === "verified" ||
        status === "limited"
        ? [membership.organizationId]
        : [];
    }),
  );
}

export function collectVerifiedOrganizationIds(
  memberships: OrganizationMembership[],
): string[] {
  return uniqueNonEmpty(
    memberships.flatMap((membership) =>
      normalizeMembershipStatus(membership) === "verified" ||
      normalizeMembershipStatus(membership) === "limited"
        ? [membership.organizationId]
        : [],
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

export function isMembershipAuditBacked(
  membership: OrganizationMembership | null | undefined,
): boolean {
  if (!membership) return false;
  return isVerificationAuditBacked({
    verifiedBy: membership.verifiedBy,
    verifiedAt: membership.verifiedAt,
    revokedAt: membership.revokedAt,
  });
}

export function buildMembershipDirectorySummary(
  record: MembershipDirectoryRuntimeRecord,
): MembershipDirectorySummary {
  const primaryMembership = pickPrimaryMembership(record.memberships);
  const auditBacked = record.memberships.some((membership) =>
    isMembershipAuditBacked(membership),
  );
  const sourceOfTruth =
    record.runtimeMarker === "demo_or_test_runtime" || record.sourceOfTruth === "fixture_demo"
      ? "fixture_demo"
      : record.sourceOfTruth === "external_directory_integrated" ||
          record.sourceOfTruth === "external_directory_pending"
        ? record.sourceOfTruth
        : auditBacked
          ? "operator_verified_directory"
          : record.sourceOfTruth;

  return {
    sourceOfTruth,
    confidence: record.confidence,
    runtimeMarker: record.runtimeMarker,
    auditBacked,
    productionTruth: isProductionMembershipTruth({
      sourceOfTruth,
      auditBacked,
      membershipStatus: normalizeMembershipStatus(primaryMembership),
    }),
    membershipStatus: normalizeMembershipStatus(primaryMembership),
  };
}

export function isProductionMembershipTruth(input: {
  sourceOfTruth: RequestScopeSourceOfTruth;
  auditBacked?: boolean;
  membershipStatus?: MembershipStatus;
}): boolean {
  if (input.sourceOfTruth === "fixture_demo") return false;
  if (input.sourceOfTruth === "external_directory_pending") return false;
  if (input.sourceOfTruth === "operator_verified_directory") return true;
  if (input.sourceOfTruth === "external_directory_integrated") return true;
  if (input.sourceOfTruth === "persistent_membership_store") {
    return Boolean(input.auditBacked);
  }
  return false;
}

export function sourceOfTruthLabel(sourceOfTruth: RequestScopeSourceOfTruth): string {
  switch (sourceOfTruth) {
    case "operator_verified_directory":
      return "Betreiber-verifiziertes Directory";
    case "external_directory_integrated":
      return "Externe Directory-Integration";
    case "persistent_membership_store":
      return "Persistenter Membership-Store";
    case "external_directory_pending":
      return "Externe Directory-Anbindung ausstehend";
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
      return "Freigeschaltet";
    case "limited":
      return "Eingeschränkt";
    case "evidence_required":
      return "Nachweis einreichen";
    case "operator_review_required":
      return "Betreiberprüfung läuft";
    case "pending":
      return "Prüfung läuft";
    case "suspended":
      return "Gesperrt";
    case "revoked":
      return "Widerrufen";
    case "none":
    default:
      return "Kein Membership-Kontext";
  }
}
