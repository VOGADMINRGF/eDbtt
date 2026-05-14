import { describe, expect, it } from "vitest";
import {
  createInMemoryRegionEntitlementRuntimeRepo,
  type Organization,
  type OrganizationMembership,
} from "@features/region";

const organization: Organization = {
  id: "org-reinickendorf-1",
  name: "Bezirksamt Reinickendorf",
  type: "district_office",
  countryCode: "DE",
  primaryRegionId: "bezirk-berlin-reinickendorf",
  website: "https://reinickendorf.example",
  verificationStatus: "organization_verified",
  createdByUserId: "admin-1",
};

function membership(
  overrides: Partial<OrganizationMembership> = {},
): OrganizationMembership {
  return {
    id: "membership-1",
    userId: "staff-1",
    organizationId: organization.id,
    organizationName: organization.name,
    organizationType: organization.type,
    regionId: organization.primaryRegionId,
    unitId: "unit-1",
    unitName: "Beteiligung",
    optionalLocation: null,
    roleLabel: "Beteiligung",
    roleType: "participation_officer",
    verificationStatus: "unit_verified",
    allowedActions: [
      "read_region_dashboard",
      "review_region_signal",
      "create_region_draft",
      "create_dossier_draft",
      "create_anlassraum_draft",
    ],
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    verifiedBy: "admin-1",
    verifiedAt: "2026-05-14T00:00:00.000Z",
    expiresAt: null,
    revokedAt: null,
    noAutoAuthority: true,
    ...overrides,
  };
}

function repoWithStatus(status: "trial" | "active" | "inactive" | "past_due" | "suspended" | "cancelled" | "expired" | "revoked") {
  return createInMemoryRegionEntitlementRuntimeRepo({
    entitlements: [
      {
        id: `entitlement-${status}`,
        organizationId: organization.id,
        organizationName: organization.name,
        organizationType: organization.type,
        regionId: organization.primaryRegionId,
        unitId: "unit-1",
        planId: "kommune-aktivierung",
        planLabel: "Kommune Aktivierung",
        status,
        scope: "organization_unit",
        validFrom: "2026-05-14T00:00:00.000Z",
        validUntil: status === "expired" ? "2026-05-13T00:00:00.000Z" : null,
        limits: {
          maxRegions: 1,
          maxDossiers: 10,
          maxAnlassraeume: 10,
          maxSignalsPerMonth: 100,
          maxDraftsPerMonth: 10,
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
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z",
        createdBy: "admin-1",
        source: "admin_grant",
        noAutoBilling: true,
        noAutoCharge: true,
      },
    ],
  });
}

describe("paid entitlements contract", () => {
  it("allows active and trial entitlements only with verified memberships", async () => {
    const activeRepo = repoWithStatus("active");
    const trialRepo = repoWithStatus("trial");

    await expect(
      activeRepo.checkRegionDashboardEntitlement({
        memberships: [membership()],
        organizations: [organization],
        regionId: "bezirk-berlin-reinickendorf",
      }),
    ).resolves.toMatchObject({
      allowed: true,
      reason: "active",
      guardrails: { noAutoBilling: true, noAutoCharge: true },
    });
    await expect(
      trialRepo.checkRegionDashboardEntitlement({
        memberships: [membership()],
        organizations: [organization],
        regionId: "bezirk-berlin-reinickendorf",
      }),
    ).resolves.toMatchObject({
      allowed: true,
      reason: "trial",
    });
    await expect(
      activeRepo.checkRegionDashboardEntitlement({
        memberships: [membership({ verificationStatus: "pending_review", allowedActions: [] })],
        organizations: [organization],
        regionId: "bezirk-berlin-reinickendorf",
      }),
    ).resolves.toMatchObject({
      allowed: false,
      reason: "membership_not_verified",
    });
  });

  it("blocks missing, expired, suspended, revoked and past_due entitlements", async () => {
    const inputs = [
      ["inactive", "missing_entitlement"],
      ["expired", "expired"],
      ["suspended", "suspended"],
      ["revoked", "expired"],
      ["past_due", "past_due"],
    ] as const;

    for (const [status, reason] of inputs) {
      const repo = repoWithStatus(status);
      await expect(
        repo.checkRegionDashboardEntitlement({
          memberships: [membership()],
          organizations: [organization],
          regionId: "bezirk-berlin-reinickendorf",
        }),
      ).resolves.toMatchObject({
        allowed: false,
        reason,
      });
    }
  });

  it("blocks over-limit draft checks and keeps noAutoBilling/noAutoCharge true", async () => {
    const repo = createInMemoryRegionEntitlementRuntimeRepo({
      entitlements: [
        {
          id: "entitlement-over-limit",
          organizationId: organization.id,
          organizationName: organization.name,
          organizationType: organization.type,
          regionId: organization.primaryRegionId,
          unitId: "unit-1",
          planId: "kommune-aktivierung",
          planLabel: "Kommune Aktivierung",
          status: "active",
          scope: "organization_unit",
          validFrom: "2026-05-14T00:00:00.000Z",
          validUntil: null,
          limits: {
            maxRegions: 1,
            maxDossiers: 1,
            maxAnlassraeume: 1,
            maxSignalsPerMonth: 100,
            maxDraftsPerMonth: 1,
            maxUsers: 10,
            factcheckCredits: 0,
          },
          usage: {
            regionsUsed: 0,
            dossiersUsed: 1,
            anlassraeumeUsed: 0,
            signalsThisMonth: 0,
            draftsThisMonth: 1,
            usersUsed: 0,
            factcheckCreditsUsed: 0,
          },
          createdAt: "2026-05-14T00:00:00.000Z",
          updatedAt: "2026-05-14T00:00:00.000Z",
          createdBy: "admin-1",
          source: "admin_grant",
          noAutoBilling: true,
          noAutoCharge: true,
        },
      ],
    });

    await expect(
      repo.checkSignalDraftEntitlement({
        memberships: [membership()],
        organizations: [organization],
        regionId: "bezirk-berlin-reinickendorf",
        draftTarget: "dossier",
      }),
    ).resolves.toMatchObject({
      allowed: false,
      reason: "over_limit",
      guardrails: {
        noAutoBilling: true,
        noAutoCharge: true,
        noAutoPublish: true,
        requiresVerifiedMembership: true,
      },
    });
  });
});
