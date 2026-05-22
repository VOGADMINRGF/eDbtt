import { z } from "zod";

export const VERIFICATION_STATUSES = [
  "unverified",
  "pending_review",
  "email_verified",
  "organization_verified",
  "unit_verified",
  "publication_approved",
  "rejected",
  "revoked",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ADMINISTRATIVE_REGION_TYPES = [
  "country",
  "state",
  "province",
  "canton",
  "municipality",
  "district",
  "county",
  "neighborhood",
  "custom",
] as const;

export type AdministrativeRegionType = (typeof ADMINISTRATIVE_REGION_TYPES)[number];

export const ORGANIZATION_TYPES = [
  "public_administration",
  "municipality",
  "district_office",
  "city_administration",
  "county_administration",
  "ministry",
  "agency",
  "school",
  "public_body",
  "association",
  "ngo",
  "civic_initiative",
  "foundation",
  "media",
  "company",
  "research_institution",
  "custom",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_UNIT_TYPES = [
  "department",
  "office",
  "division",
  "unit",
  "team",
  "location",
  "custom",
] as const;

export type OrganizationUnitType = (typeof ORGANIZATION_UNIT_TYPES)[number];

export const ORGANIZATION_ROLE_TYPES = [
  "staff",
  "lead",
  "admin",
  "communications",
  "participation_officer",
  "external_contractor",
  "custom",
] as const;

export type OrganizationRoleType = (typeof ORGANIZATION_ROLE_TYPES)[number];

export const ONBOARDING_ALLOWED_ACTIONS = [
  "read_region_dashboard",
  "review_region_signal",
  "create_region_draft",
  "create_dossier_draft",
  "create_anlassraum_draft",
  "attach_signal_to_dossier",
  "submit_for_review",
  "approve_publication",
  "manage_organization_members",
] as const;

export type OnboardingAllowedAction = (typeof ONBOARDING_ALLOWED_ACTIONS)[number];

const ExternalIdSchema = z.record(z.string().trim().min(1), z.string().trim().min(1));

export const OptionalLocationSchema = z
  .object({
    label: z.string().trim().min(1).nullable().optional(),
    name: z.string().trim().min(1),
  })
  .strict();

export type OptionalLocation = z.infer<typeof OptionalLocationSchema>;

export const AdministrativeRegionSchema = z
  .object({
    id: z.string().trim().min(1),
    countryCode: z.string().trim().min(2).max(3),
    name: z.string().trim().min(1),
    type: z.enum(ADMINISTRATIVE_REGION_TYPES),
    parentRegionId: z.string().trim().min(1).nullable().optional(),
    externalIds: ExternalIdSchema.optional(),
  })
  .strict();

export type AdministrativeRegion = z.infer<typeof AdministrativeRegionSchema>;

export const OrganizationSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    type: z.enum(ORGANIZATION_TYPES),
    countryCode: z.string().trim().min(2).max(3).nullable().optional(),
    primaryRegionId: z.string().trim().min(1).nullable().optional(),
    website: z.string().trim().url().nullable().optional(),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    createdByUserId: z.string().trim().min(1).nullable(),
  })
  .strict();

export type Organization = z.infer<typeof OrganizationSchema>;

export const OrganizationUnitSchema = z
  .object({
    id: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    type: z.enum(ORGANIZATION_UNIT_TYPES),
    parentUnitId: z.string().trim().min(1).nullable().optional(),
    jurisdictionTags: z.array(z.string().trim().min(1)).default([]),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
  })
  .strict();

export type OrganizationUnit = z.infer<typeof OrganizationUnitSchema>;

export const OrganizationMembershipSchema = z
  .object({
    id: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    organizationName: z.string().trim().min(1),
    organizationType: z.enum(ORGANIZATION_TYPES),
    regionId: z.string().trim().min(1).nullable().optional(),
    unitId: z.string().trim().min(1).nullable().optional(),
    unitName: z.string().trim().min(1).nullable().optional(),
    optionalLocation: OptionalLocationSchema.nullable().optional(),
    roleLabel: z.string().trim().min(1),
    roleType: z.enum(ORGANIZATION_ROLE_TYPES),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    allowedActions: z.array(z.enum(ONBOARDING_ALLOWED_ACTIONS)).default([]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    verifiedBy: z.string().trim().min(1).nullable().optional(),
    verifiedAt: z.string().datetime({ offset: true }).nullable().optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
    revokedAt: z.string().datetime({ offset: true }).nullable().optional(),
    noAutoAuthority: z.literal(true),
  })
  .strict();

export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;

export const SelfDeclaredOrganizationProfileSchema = z
  .object({
    countryCode: z.string().trim().min(2).max(3),
    countryName: z.string().trim().min(1),
    administrativeUnitLabel: z.string().trim().min(1).nullable().optional(),
    administrativeUnitName: z.string().trim().min(1).nullable().optional(),
    regionLevel1Label: z.string().trim().min(1).nullable().optional(),
    regionLevel1Name: z.string().trim().min(1).nullable().optional(),
    regionLevel2Label: z.string().trim().min(1).nullable().optional(),
    regionLevel2Name: z.string().trim().min(1).nullable().optional(),
    regionLevel3Label: z.string().trim().min(1).nullable().optional(),
    regionLevel3Name: z.string().trim().min(1).nullable().optional(),
    organizationName: z.string().trim().min(1),
    organizationType: z.enum(ORGANIZATION_TYPES).default("public_administration"),
    locationLabel: z.string().trim().min(1).nullable().optional(),
    locationName: z.string().trim().min(1).nullable().optional(),
    departmentName: z.string().trim().min(1).nullable().optional(),
    unitName: z.string().trim().min(1).nullable().optional(),
    roleLabel: z.string().trim().min(1),
    roleType: z.enum(ORGANIZATION_ROLE_TYPES).default("staff"),
    workEmail: z.string().trim().email().nullable().optional(),
    website: z.string().trim().url().nullable().optional(),
    evidenceUrl: z.string().trim().url().nullable().optional(),
    referencePersonName: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export type SelfDeclaredOrganizationProfile = z.infer<typeof SelfDeclaredOrganizationProfileSchema>;

export const OrganizationClaimEvidenceSchema = z
  .object({
    emailDomain: z.string().trim().min(1).nullable().optional(),
    website: z.string().trim().url().nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export type OrganizationClaimEvidence = z.infer<typeof OrganizationClaimEvidenceSchema>;

export const ORGANIZATION_CLAIM_SOURCES = [
  "self_declared",
  "admin_created",
  "invite",
  "migration",
  "fixture",
] as const;

export type OrganizationClaimSource = (typeof ORGANIZATION_CLAIM_SOURCES)[number];

export const ORGANIZATION_PROVISIONING_KINDS = [
  "administration",
  "municipality",
  "district",
  "association",
  "carrier",
  "media_partner",
  "civic_group",
  "other",
] as const;

export type OrganizationProvisioningKind =
  (typeof ORGANIZATION_PROVISIONING_KINDS)[number];

export const ORGANIZATION_PROVISIONING_STATUSES = [
  "draft",
  "submitted",
  "verification_required",
  "operator_review_required",
  "approved",
  "rejected",
  "suspended",
] as const;

export type OrganizationProvisioningStatus =
  (typeof ORGANIZATION_PROVISIONING_STATUSES)[number];

export const ORGANIZATION_PROVISIONING_DECISIONS = [
  "save_draft",
  "submit",
  "request_verification",
  "approve",
  "reject",
  "suspend",
] as const;

export type OrganizationProvisioningDecision =
  (typeof ORGANIZATION_PROVISIONING_DECISIONS)[number];

export const ORGANIZATION_PROVISIONING_SOURCES = [
  "self_service",
  "operator_created",
  "migration",
  "fixture",
] as const;

export type OrganizationProvisioningSource =
  (typeof ORGANIZATION_PROVISIONING_SOURCES)[number];

export const OrganizationProvisioningRequestSchema = z
  .object({
    organizationKind: z.enum(ORGANIZATION_PROVISIONING_KINDS),
    status: z.enum(ORGANIZATION_PROVISIONING_STATUSES),
    latestDecision: z
      .enum(ORGANIZATION_PROVISIONING_DECISIONS)
      .nullable()
      .optional(),
    source: z.enum(ORGANIZATION_PROVISIONING_SOURCES),
    requestedRegionId: z.string().trim().min(1).nullable().optional(),
    requestedRegionLabel: z.string().trim().min(1).nullable().optional(),
    applicantName: z.string().trim().min(1).nullable().optional(),
    applicantEmail: z.string().trim().email().nullable().optional(),
    responsiblePersonName: z.string().trim().min(1).nullable().optional(),
    responsiblePersonEmail: z.string().trim().email().nullable().optional(),
    requestedRoleLabel: z.string().trim().min(1).nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
    submittedAt: z.string().datetime({ offset: true }).nullable().optional(),
    decidedAt: z.string().datetime({ offset: true }).nullable().optional(),
    decidedBy: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export type OrganizationProvisioningRequest = z.infer<
  typeof OrganizationProvisioningRequestSchema
>;

export const OrganizationClaimSchema = z
  .object({
    id: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1).nullable().optional(),
    organizationName: z.string().trim().min(1),
    organizationType: z.enum(ORGANIZATION_TYPES),
    regionId: z.string().trim().min(1).nullable().optional(),
    countryCode: z.string().trim().min(2).max(3).nullable().optional(),
    unitName: z.string().trim().min(1).nullable().optional(),
    roleLabel: z.string().trim().min(1).nullable().optional(),
    optionalLocation: OptionalLocationSchema.nullable().optional(),
    evidence: OrganizationClaimEvidenceSchema,
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    provisioningRequest: OrganizationProvisioningRequestSchema.nullable().optional(),
    selfDeclaredProfile: SelfDeclaredOrganizationProfileSchema.nullable().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    reviewedBy: z.string().trim().min(1).nullable().optional(),
    reviewedAt: z.string().datetime({ offset: true }).nullable().optional(),
    rejectionReason: z.string().trim().min(1).nullable().optional(),
    source: z.enum(ORGANIZATION_CLAIM_SOURCES),
    noAutoAuthority: z.literal(true),
  })
  .strict();

export type OrganizationClaim = z.infer<typeof OrganizationClaimSchema>;

export const VERIFICATION_REVIEW_DECISIONS = [
  "approve_organization",
  "approve_unit",
  "approve_publication",
  "reject",
  "revoke",
  "needs_more_information",
] as const;

export type VerificationReviewDecision = (typeof VERIFICATION_REVIEW_DECISIONS)[number];

export const VerificationReviewSchema = z
  .object({
    id: z.string().trim().min(1),
    claimId: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    decision: z.enum(VERIFICATION_REVIEW_DECISIONS),
    previousStatus: z.enum(VERIFICATION_STATUSES),
    nextStatus: z.enum(VERIFICATION_STATUSES),
    allowedActions: z.array(z.enum(ONBOARDING_ALLOWED_ACTIONS)).default([]),
    note: z.string().trim().min(1).nullable().optional(),
    reviewedBy: z.string().trim().min(1),
    reviewedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type VerificationReview = z.infer<typeof VerificationReviewSchema>;

export const MEMBERSHIP_AUDIT_EVENT_TYPES = [
  "claim_created",
  "claim_reviewed",
  "membership_created",
  "membership_updated",
  "membership_revoked",
] as const;

export type MembershipAuditEventType = (typeof MEMBERSHIP_AUDIT_EVENT_TYPES)[number];

export const MembershipAuditEventSchema = z
  .object({
    id: z.string().trim().min(1),
    membershipId: z.string().trim().min(1).nullable().optional(),
    claimId: z.string().trim().min(1).nullable().optional(),
    userId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1).nullable().optional(),
    regionId: z.string().trim().min(1).nullable().optional(),
    eventType: z.enum(MEMBERSHIP_AUDIT_EVENT_TYPES),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    note: z.string().trim().min(1).nullable().optional(),
    createdBy: z.string().trim().min(1),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type MembershipAuditEvent = z.infer<typeof MembershipAuditEventSchema>;

export function parseAdministrativeRegion(value: unknown): AdministrativeRegion {
  return AdministrativeRegionSchema.parse(value);
}

export function parseOrganization(value: unknown): Organization {
  return OrganizationSchema.parse(value);
}

export function parseOrganizationUnit(value: unknown): OrganizationUnit {
  return OrganizationUnitSchema.parse(value);
}

export function parseOrganizationMembership(value: unknown): OrganizationMembership {
  return OrganizationMembershipSchema.parse(value);
}

export function parseOrganizationClaim(value: unknown): OrganizationClaim {
  return OrganizationClaimSchema.parse(value);
}

export function parseOrganizationProvisioningRequest(
  value: unknown,
): OrganizationProvisioningRequest {
  return OrganizationProvisioningRequestSchema.parse(value);
}

export function parseOptionalLocation(value: unknown): OptionalLocation {
  return OptionalLocationSchema.parse(value);
}

export function parseSelfDeclaredOrganizationProfile(value: unknown): SelfDeclaredOrganizationProfile {
  return SelfDeclaredOrganizationProfileSchema.parse(value);
}

export function parseVerificationReview(value: unknown): VerificationReview {
  return VerificationReviewSchema.parse(value);
}

export function parseMembershipAuditEvent(value: unknown): MembershipAuditEvent {
  return MembershipAuditEventSchema.parse(value);
}

export function allowedActionsForVerificationStatus(
  status: VerificationStatus,
): OnboardingAllowedAction[] {
  switch (status) {
    case "organization_verified":
      return [
        "read_region_dashboard",
      ];
    case "unit_verified":
      return [
        "read_region_dashboard",
        "review_region_signal",
        "create_region_draft",
        "create_dossier_draft",
        "create_anlassraum_draft",
        "attach_signal_to_dossier",
        "submit_for_review",
      ];
    case "publication_approved":
      return [...ONBOARDING_ALLOWED_ACTIONS];
    default:
      return [];
  }
}

export function mapProvisioningKindToOrganizationType(
  kind: OrganizationProvisioningKind,
): OrganizationType {
  switch (kind) {
    case "administration":
      return "public_administration";
    case "municipality":
      return "municipality";
    case "district":
      return "district_office";
    case "association":
      return "association";
    case "carrier":
      return "association";
    case "media_partner":
      return "media";
    case "civic_group":
      return "civic_initiative";
    case "other":
    default:
      return "custom";
  }
}

export function mapOrganizationTypeToProvisioningKind(
  type: OrganizationType,
): OrganizationProvisioningKind {
  switch (type) {
    case "public_administration":
    case "city_administration":
    case "county_administration":
    case "ministry":
    case "agency":
    case "public_body":
    case "school":
      return "administration";
    case "municipality":
      return "municipality";
    case "district_office":
      return "district";
    case "association":
    case "ngo":
    case "foundation":
      return "association";
    case "media":
      return "media_partner";
    case "civic_initiative":
      return "civic_group";
    case "company":
    case "research_institution":
    case "custom":
    default:
      return "other";
  }
}

export function mapClaimSourceToProvisioningSource(
  source: OrganizationClaimSource,
): OrganizationProvisioningSource {
  switch (source) {
    case "admin_created":
    case "invite":
      return "operator_created";
    case "migration":
      return "migration";
    case "fixture":
      return "fixture";
    case "self_declared":
    default:
      return "self_service";
  }
}

export function inferProvisioningStatusFromVerificationStatus(
  status: VerificationStatus,
): OrganizationProvisioningStatus {
  switch (status) {
    case "organization_verified":
    case "unit_verified":
    case "publication_approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "revoked":
      return "suspended";
    case "email_verified":
      return "verification_required";
    case "pending_review":
      return "submitted";
    case "unverified":
    default:
      return "draft";
  }
}

export function inferProvisioningRequestFromClaim(
  claim: OrganizationClaim,
): OrganizationProvisioningRequest {
  const request = claim.provisioningRequest;
  if (request) return parseOrganizationProvisioningRequest(request);
  return parseOrganizationProvisioningRequest({
    organizationKind: mapOrganizationTypeToProvisioningKind(claim.organizationType),
    status: inferProvisioningStatusFromVerificationStatus(claim.verificationStatus),
    latestDecision: null,
    source: mapClaimSourceToProvisioningSource(claim.source),
    requestedRegionId: claim.regionId ?? null,
    requestedRegionLabel: claim.optionalLocation?.label ?? null,
    applicantName: claim.selfDeclaredProfile?.referencePersonName ?? null,
    applicantEmail: null,
    responsiblePersonName: claim.selfDeclaredProfile?.referencePersonName ?? null,
    responsiblePersonEmail: null,
    requestedRoleLabel: claim.roleLabel ?? null,
    note: claim.evidence.note ?? null,
    submittedAt:
      claim.verificationStatus === "pending_review" ||
      claim.verificationStatus === "email_verified" ||
      claim.verificationStatus === "organization_verified" ||
      claim.verificationStatus === "unit_verified" ||
      claim.verificationStatus === "publication_approved"
        ? claim.createdAt
        : null,
    decidedAt: claim.reviewedAt ?? null,
    decidedBy: claim.reviewedBy ?? null,
  });
}

export function provisioningRequestReadyForOperatorReview(
  request: OrganizationProvisioningRequest,
): boolean {
  return Boolean(
    request.applicantName?.trim() &&
      request.requestedRegionId?.trim() &&
      request.requestedRoleLabel?.trim(),
  );
}

export function resolveProvisioningRequestStatus(
  claim: OrganizationClaim,
): OrganizationProvisioningStatus {
  const request = inferProvisioningRequestFromClaim(claim);
  if (
    request.status === "submitted" &&
    provisioningRequestReadyForOperatorReview(request)
  ) {
    return "operator_review_required";
  }
  return request.status;
}

function extractEmailDomain(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  const parts = raw.split("@");
  return parts.length === 2 && parts[1] ? parts[1] : null;
}

function slugify(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createPendingClaimBundle(input: {
  claimId: string;
  membershipId: string;
  organizationId: string;
  unitId?: string | null;
  userId: string;
  requestedRegionId?: string | null;
  createdAt: string;
  profile: SelfDeclaredOrganizationProfile;
}): {
  claim: OrganizationClaim;
  organization: Organization;
  unit: OrganizationUnit | null;
  membership: OrganizationMembership;
} {
  const profile = parseSelfDeclaredOrganizationProfile(input.profile);
  const organization = parseOrganization({
    id: input.organizationId,
    name: profile.organizationName,
    type: profile.organizationType,
    countryCode: profile.countryCode,
    primaryRegionId: input.requestedRegionId ??
      (slugify(profile.regionLevel2Name ?? profile.regionLevel1Name ?? profile.countryName) || null),
    website: profile.website ?? null,
    verificationStatus: "unverified",
    createdByUserId: input.userId,
  });

  const unit =
    profile.unitName || profile.departmentName
      ? parseOrganizationUnit({
          id:
            input.unitId ??
            `${input.organizationId}-unit-${slugify(profile.unitName ?? profile.departmentName ?? "unit")}`,
          organizationId: organization.id,
          name: profile.unitName ?? profile.departmentName ?? "Unit",
          type: profile.unitName ? "unit" : "department",
          parentUnitId: null,
          jurisdictionTags: [
            profile.departmentName,
            profile.unitName,
            profile.regionLevel2Name,
          ].filter(Boolean),
          verificationStatus: "unverified",
        })
      : null;

  const optionalLocation =
    profile.locationName && profile.locationName.trim().length > 0
      ? parseOptionalLocation({
          label: profile.locationLabel ?? null,
          name: profile.locationName,
        })
      : null;

  const claim = parseOrganizationClaim({
    id: input.claimId,
    userId: input.userId,
    organizationId: organization.id,
    organizationName: organization.name,
    organizationType: organization.type,
    regionId: input.requestedRegionId ?? organization.primaryRegionId ?? null,
    countryCode: profile.countryCode,
    unitName: unit?.name ?? null,
    roleLabel: profile.roleLabel,
    optionalLocation,
    evidence: {
      emailDomain: extractEmailDomain(profile.workEmail),
      website: profile.website ?? null,
      note: profile.referencePersonName ?? null,
    },
    verificationStatus: "pending_review",
    selfDeclaredProfile: profile,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    source: "fixture",
    noAutoAuthority: true,
  });

  const membership = parseOrganizationMembership({
    id: input.membershipId,
    userId: input.userId,
    organizationId: organization.id,
    organizationName: organization.name,
    organizationType: organization.type,
    regionId: input.requestedRegionId ?? organization.primaryRegionId ?? null,
    unitId: unit?.id ?? null,
    unitName: unit?.name ?? null,
    optionalLocation,
    roleLabel: profile.roleLabel,
    roleType: profile.roleType,
    verificationStatus: "pending_review",
    allowedActions: [],
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    verifiedBy: null,
    verifiedAt: null,
    expiresAt: null,
    revokedAt: null,
    noAutoAuthority: true,
  });

  return {
    claim,
    organization,
    unit,
    membership,
  };
}
