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
  "ministry",
  "agency",
  "school",
  "public_body",
  "ngo",
  "media",
  "company",
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
    countryCode: z.string().trim().min(2).max(3),
    primaryRegionId: z.string().trim().min(1),
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
    unitId: z.string().trim().min(1).nullable().optional(),
    roleLabel: z.string().trim().min(1),
    roleType: z.enum(ORGANIZATION_ROLE_TYPES),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    allowedActions: z.array(z.enum(ONBOARDING_ALLOWED_ACTIONS)).default([]),
    verifiedBy: z.string().trim().min(1).nullable().optional(),
    verifiedAt: z.string().datetime({ offset: true }).nullable().optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
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

export const OrganizationClaimSchema = z
  .object({
    id: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1).nullable().optional(),
    organizationName: z.string().trim().min(1),
    requestedRegionId: z.string().trim().min(1).nullable().optional(),
    requestedUnitName: z.string().trim().min(1).nullable().optional(),
    roleLabel: z.string().trim().min(1),
    workEmail: z.string().trim().email().nullable().optional(),
    website: z.string().trim().url().nullable().optional(),
    evidenceUrl: z.string().trim().url().nullable().optional(),
    referencePersonName: z.string().trim().min(1).nullable().optional(),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    selfDeclaredProfile: SelfDeclaredOrganizationProfileSchema,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type OrganizationClaim = z.infer<typeof OrganizationClaimSchema>;

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

export function parseSelfDeclaredOrganizationProfile(value: unknown): SelfDeclaredOrganizationProfile {
  return SelfDeclaredOrganizationProfileSchema.parse(value);
}

export function allowedActionsForVerificationStatus(
  status: VerificationStatus,
): OnboardingAllowedAction[] {
  switch (status) {
    case "email_verified":
      return [
        "create_region_draft",
        "create_dossier_draft",
        "create_anlassraum_draft",
        "attach_signal_to_dossier",
        "submit_for_review",
      ];
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
    primaryRegionId:
      input.requestedRegionId ??
      slugify(profile.regionLevel2Name ?? profile.regionLevel1Name ?? profile.countryName),
    website: profile.website ?? null,
    verificationStatus: "unverified",
    createdByUserId: input.userId,
  });

  const unit =
    profile.unitName || profile.departmentName || profile.locationName
      ? parseOrganizationUnit({
          id: input.unitId ?? `${input.organizationId}-unit-${slugify(profile.unitName ?? profile.departmentName ?? profile.locationName ?? "unit")}`,
          organizationId: organization.id,
          name: profile.unitName ?? profile.departmentName ?? profile.locationName ?? "Unit",
          type: profile.unitName ? "unit" : profile.departmentName ? "department" : "location",
          parentUnitId: null,
          jurisdictionTags: [
            profile.departmentName,
            profile.unitName,
            profile.locationName,
            profile.regionLevel2Name,
          ].filter(Boolean),
          verificationStatus: "unverified",
        })
      : null;

  const claim = parseOrganizationClaim({
    id: input.claimId,
    userId: input.userId,
    organizationId: organization.id,
    organizationName: organization.name,
    requestedRegionId: input.requestedRegionId ?? organization.primaryRegionId,
    requestedUnitName: unit?.name ?? null,
    roleLabel: profile.roleLabel,
    workEmail: profile.workEmail ?? null,
    website: profile.website ?? null,
    evidenceUrl: profile.evidenceUrl ?? null,
    referencePersonName: profile.referencePersonName ?? null,
    verificationStatus: "pending_review",
    selfDeclaredProfile: profile,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });

  const membership = parseOrganizationMembership({
    id: input.membershipId,
    userId: input.userId,
    organizationId: organization.id,
    unitId: unit?.id ?? null,
    roleLabel: profile.roleLabel,
    roleType: profile.roleType,
    verificationStatus: "pending_review",
    allowedActions: [],
    verifiedBy: null,
    verifiedAt: null,
    expiresAt: null,
  });

  return {
    claim,
    organization,
    unit,
    membership,
  };
}
