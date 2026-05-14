import { describe, expect, it } from "vitest";
import {
  buildRegionAccessContext,
  canApprovePublication,
  canCreateAnlassraumDraft,
  canCreateDossierDraft,
  canManageOrganizationMembers,
  canReadRegionDashboard,
  canReviewRegionSignal,
  createPendingClaimBundle,
  parseOrganization,
  parseOrganizationMembership,
  parseSelfDeclaredOrganizationProfile,
  type EntitlementCheckResult,
  type Organization,
  type OrganizationMembership,
} from "@features/region";

function buildOrganization(overrides: Partial<Organization> = {}): Organization {
  return parseOrganization({
    id: "org-reinickendorf-1",
    name: "Bezirksamt Reinickendorf",
    type: "district_office",
    countryCode: "DE",
    primaryRegionId: "bezirk-berlin-reinickendorf",
    website: "https://reinickendorf.example",
    verificationStatus: "organization_verified",
    createdByUserId: "user-1",
    ...overrides,
  });
}

function buildMembership(overrides: Partial<OrganizationMembership> = {}): OrganizationMembership {
  return parseOrganizationMembership({
    id: "membership-1",
    userId: "user-1",
    organizationId: "org-reinickendorf-1",
    organizationName: "Bezirksamt Reinickendorf",
    organizationType: "district_office",
    regionId: "bezirk-berlin-reinickendorf",
    unitId: null,
    unitName: null,
    optionalLocation: null,
    roleLabel: "Sachbearbeitung",
    roleType: "staff",
    verificationStatus: "pending_review",
    allowedActions: [],
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    verifiedBy: null,
    verifiedAt: null,
    expiresAt: null,
    revokedAt: null,
    noAutoAuthority: true,
    ...overrides,
  });
}

function buildEntitlementCheck(
  overrides: Partial<EntitlementCheckResult> = {},
): EntitlementCheckResult {
  return {
    allowed: true,
    reason: "active",
    entitlementId: "entitlement-1",
    status: "active",
    planId: "kommune-aktivierung",
    planLabel: "Kommune Aktivierung",
    scope: "region",
    source: "admin_grant",
    limits: {
      maxRegions: 1,
      maxDossiers: 10,
      maxAnlassraeume: 10,
      maxSignalsPerMonth: 100,
      maxDraftsPerMonth: 25,
      maxUsers: 10,
      factcheckCredits: 0,
    },
    usage: {
      regionsUsed: 0,
      dossiersUsed: 0,
      anlassraeumeUsed: 0,
      signalsThisMonth: 0,
      draftsThisMonth: 0,
      usersUsed: 0,
      factcheckCreditsUsed: 0,
    },
    guardrails: {
      noAutoBilling: true,
      noAutoCharge: true,
      noAutoPublish: true,
      requiresVerifiedMembership: true,
    },
    ...overrides,
  };
}

describe("region access and organization onboarding contracts", () => {
  it("stores self-declared Reinickendorf administration data as pending instead of verified access", () => {
    const bundle = createPendingClaimBundle({
      claimId: "claim-reinickendorf-1",
      membershipId: "membership-reinickendorf-1",
      organizationId: "org-reinickendorf-1",
      userId: "user-1",
      requestedRegionId: "bezirk-berlin-reinickendorf",
      createdAt: "2026-05-14T00:00:00.000Z",
      profile: {
        countryCode: "DE",
        countryName: "Deutschland",
        regionLevel1Label: "Bundesland",
        regionLevel1Name: "Berlin",
        regionLevel2Label: "Bezirk",
        regionLevel2Name: "Reinickendorf",
        organizationName: "Bezirksamt Reinickendorf",
        locationLabel: "Standort",
        locationName: "Rathaus Reinickendorf",
        departmentName: "Abteilung 4",
        unitName: "Bauen und Wohnen",
        roleLabel: "Sachbearbeitung",
        roleType: "staff",
        workEmail: "poststelle@reinickendorf.example",
        website: "https://reinickendorf.example",
      },
    });

    expect(bundle.claim.verificationStatus).toBe("pending_review");
    expect(bundle.claim.noAutoAuthority).toBe(true);
    expect(bundle.membership.verificationStatus).toBe("pending_review");
    expect(bundle.membership.allowedActions).toEqual([]);
    expect(bundle.organization.verificationStatus).toBe("unverified");
  });

  it("does not grant dashboard access to pending self-declared staff", () => {
    const context = buildRegionAccessContext({
      actorRole: "institutional_actor",
      memberships: [buildMembership()],
      organizations: [buildOrganization()],
    });

    expect(canReadRegionDashboard(context, "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("does not grant official actions from a raw region role without verified membership", () => {
    const context = buildRegionAccessContext({
      actorRole: "institutional_actor",
      roles: ["region_staff:bezirk-berlin-reinickendorf"],
    });

    expect(context.hintedRegionIds).toEqual(["bezirk-berlin-reinickendorf"]);
    expect(context.verifiedRegionIds).toEqual([]);
    expect(context.authoritySource).toBe("unverified_hint_only");
    expect(canReadRegionDashboard(context, "bezirk-berlin-reinickendorf")).toBe(false);
    expect(canCreateDossierDraft(context, "bezirk-berlin-reinickendorf")).toBe(false);
    expect(canCreateAnlassraumDraft(context, "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("keeps email-verified memberships below dashboard level without organization or unit verification", () => {
    const context = buildRegionAccessContext({
      actorRole: "institutional_actor",
      memberships: [
        buildMembership({
          id: "membership-email-1",
          userId: "user-email-1",
          verificationStatus: "email_verified",
        }),
      ],
      organizations: [buildOrganization({ createdByUserId: "user-email-1" })],
    });

    expect(canReadRegionDashboard(context, "bezirk-berlin-reinickendorf")).toBe(false);
    expect(canCreateDossierDraft(context, "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("allows organization-verified memberships to read only their own region", () => {
    const context = buildRegionAccessContext({
      actorRole: "institutional_actor",
      memberships: [
        buildMembership({
          id: "membership-org-verified-1",
          userId: "user-org-1",
          roleLabel: "Kommunikation",
          roleType: "communications",
          verificationStatus: "organization_verified",
          allowedActions: ["read_region_dashboard"],
          verifiedBy: "admin-1",
          verifiedAt: "2026-05-14T00:00:00.000Z",
        }),
      ],
      organizations: [buildOrganization({ createdByUserId: "user-org-1" })],
      dashboardEntitlementCheck: buildEntitlementCheck(),
      dossierDraftEntitlementCheck: buildEntitlementCheck({
        allowed: false,
        reason: "missing_entitlement",
        entitlementId: null,
        status: null,
        planId: null,
        planLabel: null,
        scope: null,
        source: null,
        limits: null,
        usage: null,
      }),
      anlassraumDraftEntitlementCheck: buildEntitlementCheck({
        allowed: false,
        reason: "missing_entitlement",
        entitlementId: null,
        status: null,
        planId: null,
        planLabel: null,
        scope: null,
        source: null,
        limits: null,
        usage: null,
      }),
    });

    expect(canReadRegionDashboard(context, "bezirk-berlin-reinickendorf")).toBe(true);
    expect(canReadRegionDashboard(context, "bezirk-berlin-spandau")).toBe(false);
    expect(canCreateDossierDraft(context, "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("allows verified Reinickendorf staff only inside their own region", () => {
    const context = buildRegionAccessContext({
      actorRole: "institutional_actor",
      memberships: [
        buildMembership({
          id: "membership-verified-1",
          userId: "user-2",
          unitId: "unit-reinickendorf-1",
          unitName: "Beteiligung",
          roleLabel: "Beteiligung",
          roleType: "participation_officer",
          verificationStatus: "unit_verified",
          allowedActions: [
            "read_region_dashboard",
            "review_region_signal",
            "create_region_draft",
            "create_dossier_draft",
            "create_anlassraum_draft",
            "attach_signal_to_dossier",
            "submit_for_review",
          ],
          verifiedBy: "admin-1",
          verifiedAt: "2026-05-14T00:00:00.000Z",
        }),
      ],
      organizations: [buildOrganization({ createdByUserId: "user-2" })],
      dashboardEntitlementCheck: buildEntitlementCheck(),
      dossierDraftEntitlementCheck: buildEntitlementCheck(),
      anlassraumDraftEntitlementCheck: buildEntitlementCheck(),
    });

    expect(canReadRegionDashboard(context, "bezirk-berlin-reinickendorf")).toBe(true);
    expect(canCreateDossierDraft(context, "bezirk-berlin-reinickendorf")).toBe(true);
    expect(canReadRegionDashboard(context, "bezirk-berlin-spandau")).toBe(false);
    expect(canReadRegionDashboard(context, "bezirk-berlin-pankow")).toBe(false);
    expect(canReadRegionDashboard(context, "kommune-magdeburg")).toBe(false);
    expect(canReviewRegionSignal(context, "bezirk-berlin-reinickendorf")).toBe(true);
    expect(canCreateAnlassraumDraft(context, "bezirk-berlin-reinickendorf")).toBe(true);
    expect(canApprovePublication(context, "bezirk-berlin-reinickendorf")).toBe(false);
    expect(canManageOrganizationMembers(context, "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("grants publication approval only to publication-approved memberships", () => {
    const approved = buildRegionAccessContext({
      actorRole: "institutional_actor",
      memberships: [
        buildMembership({
          id: "membership-publication-1",
          userId: "user-pub-1",
          unitId: "unit-reinickendorf-1",
          unitName: "Leitung",
          roleLabel: "Leitung",
          roleType: "lead",
          verificationStatus: "publication_approved",
          allowedActions: [
            "read_region_dashboard",
            "review_region_signal",
            "create_region_draft",
            "create_dossier_draft",
            "create_anlassraum_draft",
            "attach_signal_to_dossier",
            "submit_for_review",
            "approve_publication",
            "manage_organization_members",
          ],
          verifiedBy: "admin-1",
          verifiedAt: "2026-05-14T00:00:00.000Z",
        }),
      ],
      organizations: [buildOrganization({ createdByUserId: "user-pub-1" })],
      dashboardEntitlementCheck: buildEntitlementCheck(),
      dossierDraftEntitlementCheck: buildEntitlementCheck(),
      anlassraumDraftEntitlementCheck: buildEntitlementCheck(),
    });
    const unitVerified = buildRegionAccessContext({
      actorRole: "institutional_actor",
      memberships: [
        buildMembership({
          id: "membership-unit-2",
          userId: "user-pub-2",
          unitId: "unit-reinickendorf-1",
          unitName: "Leitung",
          roleLabel: "Leitung",
          roleType: "lead",
          verificationStatus: "unit_verified",
          allowedActions: [
            "read_region_dashboard",
            "review_region_signal",
            "create_region_draft",
            "create_dossier_draft",
            "create_anlassraum_draft",
            "attach_signal_to_dossier",
            "submit_for_review",
          ],
          verifiedBy: "admin-1",
          verifiedAt: "2026-05-14T00:00:00.000Z",
        }),
      ],
      organizations: [buildOrganization({ createdByUserId: "user-pub-2" })],
      dashboardEntitlementCheck: buildEntitlementCheck(),
      dossierDraftEntitlementCheck: buildEntitlementCheck(),
      anlassraumDraftEntitlementCheck: buildEntitlementCheck(),
    });

    expect(canApprovePublication(approved, "bezirk-berlin-reinickendorf")).toBe(true);
    expect(canApprovePublication(unitVerified, "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("marks admin as explicit admin fallback", () => {
    const context = buildRegionAccessContext({
      actorRole: "admin",
      isAdmin: true,
      roles: ["admin", "region_staff:bezirk-berlin-reinickendorf"],
    });

    expect(context.adminFallback).toBe(true);
    expect(context.authoritySource).toBe("admin_fallback");
    expect(context.organization.paidDashboardEntitlement).toBe("admin_fallback");
    expect(canReadRegionDashboard(context, "bezirk-berlin-reinickendorf")).toBe(true);
    expect(canApprovePublication(context, "kommune-magdeburg")).toBe(true);
  });

  it("blocks verified memberships without paid entitlement from dashboard and draft actions", () => {
    const blockedEntitlement = buildEntitlementCheck({
      allowed: false,
      reason: "missing_entitlement",
      entitlementId: null,
      status: null,
      planId: null,
      planLabel: null,
      scope: null,
      source: null,
      limits: null,
      usage: null,
    });
    const context = buildRegionAccessContext({
      actorRole: "institutional_actor",
      memberships: [
        buildMembership({
          id: "membership-unit-no-entitlement",
          userId: "user-no-entitlement",
          unitId: "unit-1",
          unitName: "Beteiligung",
          verificationStatus: "unit_verified",
          allowedActions: [
            "read_region_dashboard",
            "review_region_signal",
            "create_region_draft",
            "create_dossier_draft",
            "create_anlassraum_draft",
          ],
          verifiedBy: "admin-1",
          verifiedAt: "2026-05-14T00:00:00.000Z",
        }),
      ],
      organizations: [buildOrganization({ createdByUserId: "user-no-entitlement" })],
      dashboardEntitlementCheck: blockedEntitlement,
      dossierDraftEntitlementCheck: blockedEntitlement,
      anlassraumDraftEntitlementCheck: blockedEntitlement,
    });

    expect(canReadRegionDashboard(context, "bezirk-berlin-reinickendorf")).toBe(false);
    expect(canCreateDossierDraft(context, "bezirk-berlin-reinickendorf")).toBe(false);
    expect(canCreateAnlassraumDraft(context, "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("keeps international onboarding flexible without German-only required fields", () => {
    const profile = parseSelfDeclaredOrganizationProfile({
      countryCode: "NL",
      countryName: "Netherlands",
      regionLevel1Label: "Province",
      regionLevel1Name: "Noord-Holland",
      regionLevel2Label: "Municipality",
      regionLevel2Name: "Amsterdam",
      organizationName: "Gemeente Amsterdam",
      organizationType: "municipality",
      departmentName: "Housing",
      unitName: "Public Participation Office",
      roleLabel: "Project Officer",
      roleType: "staff",
      workEmail: "project.officer@amsterdam.example",
    });

    expect(profile.organizationName).toBe("Gemeente Amsterdam");
    expect(profile.regionLevel2Name).toBe("Amsterdam");
    expect(profile.departmentName).toBe("Housing");
  });

  it("accepts missing optional location without escalating review needs", () => {
    const bundle = createPendingClaimBundle({
      claimId: "claim-no-location",
      membershipId: "membership-no-location",
      organizationId: "org-amsterdam-1",
      userId: "user-4",
      requestedRegionId: "municipality-amsterdam",
      createdAt: "2026-05-14T00:00:00.000Z",
      profile: {
        countryCode: "NL",
        countryName: "Netherlands",
        regionLevel1Name: "Noord-Holland",
        regionLevel2Name: "Amsterdam",
        organizationName: "Gemeente Amsterdam",
        organizationType: "municipality",
        departmentName: "Housing",
        unitName: "Public Participation Office",
        roleLabel: "Project Officer",
      },
    });

    expect(bundle.claim.verificationStatus).toBe("pending_review");
    expect(bundle.claim.optionalLocation).toBeNull();
    expect(bundle.unit?.name).toBe("Public Participation Office");
    expect(bundle.organization.verificationStatus).toBe("unverified");
  });

  it("treats Rathaus Reinickendorf as optional location input, not mandatory organization layer", () => {
    const bundle = createPendingClaimBundle({
      claimId: "claim-location-only",
      membershipId: "membership-location-only",
      organizationId: "org-reinickendorf-location",
      userId: "user-5",
      requestedRegionId: "bezirk-berlin-reinickendorf",
      createdAt: "2026-05-14T00:00:00.000Z",
      profile: {
        countryCode: "DE",
        countryName: "Deutschland",
        regionLevel1Name: "Berlin",
        regionLevel2Name: "Reinickendorf",
        organizationName: "Bezirksamt Reinickendorf",
        locationName: "Rathaus Reinickendorf",
        roleLabel: "Sachbearbeitung",
      },
    });

    expect(bundle.organization.name).toBe("Bezirksamt Reinickendorf");
    expect(bundle.unit).toBeNull();
    expect(bundle.claim.optionalLocation?.name).toBe("Rathaus Reinickendorf");
    expect(bundle.claim.verificationStatus).toBe("pending_review");
  });

  it("does not auto-verify free-text unit claims like Dezernat 4", () => {
    const bundle = createPendingClaimBundle({
      claimId: "claim-dezernat-4",
      membershipId: "membership-dezernat-4",
      organizationId: "org-reinickendorf-2",
      userId: "user-3",
      requestedRegionId: "bezirk-berlin-reinickendorf",
      createdAt: "2026-05-14T00:00:00.000Z",
      profile: {
        countryCode: "DE",
        countryName: "Deutschland",
        regionLevel1Name: "Berlin",
        regionLevel2Name: "Reinickendorf",
        organizationName: "Bezirksamt Reinickendorf",
        departmentName: "Dezernat 4",
        roleLabel: "Leitung",
        roleType: "lead",
      },
    });

    expect(bundle.unit?.name).toBe("Dezernat 4");
    expect(bundle.membership.verificationStatus).toBe("pending_review");
    expect(bundle.organization.verificationStatus).toBe("unverified");
  });
});
