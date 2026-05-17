import { beforeEach, describe, expect, it } from "vitest";
import {
  buildOrganizationDashboardReadModel,
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  createInMemoryRegionSignalDraftPersistence,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
  setRegionSignalDraftPersistenceForTests,
  type Organization,
  type OrganizationClaim,
  type OrganizationMembership,
  type RegionSignalDraftRecord,
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
    userId: "user-1",
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
    createdAt: "2026-05-17T08:00:00.000Z",
    updatedAt: "2026-05-17T08:00:00.000Z",
    verifiedBy: "admin-1",
    verifiedAt: "2026-05-17T08:00:00.000Z",
    expiresAt: null,
    revokedAt: null,
    noAutoAuthority: true,
    ...overrides,
  };
}

function claim(
  overrides: Partial<OrganizationClaim> = {},
): OrganizationClaim {
  return {
    id: "claim-1",
    userId: "user-1",
    organizationId: null,
    organizationName: "Verein Bildungsdialog",
    organizationType: "association",
    regionId: "bezirk-berlin-reinickendorf",
    countryCode: "DE",
    unitName: "Vorstand",
    roleLabel: "Koordination",
    optionalLocation: null,
    evidence: {
      emailDomain: null,
      website: "https://bildungsdialog.example",
      note: "Bitte prüfen",
    },
    verificationStatus: "pending_review",
    selfDeclaredProfile: null,
    createdAt: "2026-05-17T08:00:00.000Z",
    updatedAt: "2026-05-17T08:00:00.000Z",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    source: "self_declared",
    noAutoAuthority: true,
    ...overrides,
  };
}

function dossierDraftRecord(): RegionSignalDraftRecord {
  return {
    id: "draft-record-dossier-1",
    uniqueKey: "region-signal-draft:bezirk-berlin-reinickendorf:dossier:signal-1",
    signalId: "signal-1",
    regionId: "bezirk-berlin-reinickendorf",
    draftId: "dossier-draft-1",
    draftType: "dossier",
    title: "Sanierung von Schulen im Bezirk",
    summary: "Reviewpflichtiger Dossier-Entwurf zur Schulinfrastruktur.",
    reviewStatus: "needs_review",
    createdByUserId: "user-1",
    createdByRole: "participation_officer",
    authoritySource: "verified_membership",
    adminFallback: false,
    relatedSignalIds: ["signal-1"],
    relatedTopics: ["Bildung & Schulinfrastruktur"],
    relatedPlaces: ["Reinickendorf"],
    linkedTopicClusterIds: ["bildung-schulinfrastruktur"],
    openQuestions: ["Welche Standorte haben Priorität?"],
    guardrails: {
      noAutoPublish: true,
      noAutoVote: true,
      noAutoMandate: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
      reviewRequired: true,
    },
    provenance: {
      sourceSignalId: "signal-1",
      sourceRegionId: "bezirk-berlin-reinickendorf",
      createdFrom: "region_signal",
      sourceReviewStatus: "accepted",
      pilotFixture: true,
      notProductionData: true,
      notRealNews: true,
    },
    targetStatus: "draft",
    targetVisibility: "non_public",
    backingStore: "dossiers",
    createdAt: "2026-05-17T08:00:00.000Z",
    updatedAt: "2026-05-17T08:00:00.000Z",
  };
}

function anlassraumDraftRecord(): RegionSignalDraftRecord {
  return {
    ...dossierDraftRecord(),
    id: "draft-record-anlassraum-1",
    uniqueKey: "region-signal-draft:bezirk-berlin-reinickendorf:anlassraum:signal-2",
    signalId: "signal-2",
    draftId: "65f000000000000000000444",
    draftType: "anlassraum",
    title: "Bildung & Schulinfrastruktur Reinickendorf",
    summary: "Reviewpflichtiger Anlassraum-Entwurf für den öffentlichen Gesprächsraum.",
    relatedSignalIds: ["signal-2"],
    backingStore: "anlassraum",
  };
}

beforeEach(() => {
  setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
  setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
  setRegionDataRepoForTests(createInMemoryRegionDataRepo());
  setParticipationSignalReviewRuntimeRepoForTests(
    createInMemoryParticipationSignalReviewRuntimeRepo(),
  );
  setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
});

describe("organization dashboard readmodel", () => {
  it("keeps pending claims visible but hides internal foreign region data for unverified users", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        claims: [claim()],
      }),
    );

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.pendingOrganizationClaims).toHaveLength(1);
    expect(readModel.regionSummary).toEqual([
      expect.objectContaining({
        regionId: "bezirk-berlin-reinickendorf",
        source: "organization_claim",
        dashboardAccess: false,
      }),
    ]);
    expect(readModel.regionalStartingPoints).toEqual([]);
    expect(readModel.openReviewItems).toEqual([]);
    expect(readModel.entitlementSummary.state).toBe("fehlt");
  });

  it("shows own region summary for verified memberships even without active freischaltung", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [organization],
        memberships: [membership()],
      }),
    );

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.verificationStatus).toBe("unit_verified");
    expect(readModel.regionSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          source: "verified_membership",
        }),
      ]),
    );
    expect(readModel.entitlementSummary.state).toBe("fehlt");
  });

  it("shows KI-vorqualifizierte Startlage when verified membership and freischaltung exist", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [organization],
        memberships: [membership()],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-1",
            organizationId: organization.id,
            organizationName: organization.name,
            organizationType: organization.type,
            regionId: organization.primaryRegionId,
            unitId: "unit-1",
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "organization_unit",
            validFrom: "2026-05-17T08:00:00.000Z",
            validUntil: null,
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
              usersUsed: 1,
              factcheckCreditsUsed: 0,
            },
            createdAt: "2026-05-17T08:00:00.000Z",
            updatedAt: "2026-05-17T08:00:00.000Z",
            createdBy: "admin-1",
            source: "admin_grant",
            noAutoBilling: true,
            noAutoCharge: true,
          },
        ],
      }),
    );

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.entitlementSummary.state).toBe("aktiv");
    expect(readModel.regionalStartingPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          regionId: "bezirk-berlin-reinickendorf",
          topicClusters: expect.arrayContaining(["Bildung & Schulinfrastruktur Reinickendorf"]),
        }),
      ]),
    );
    expect(readModel.participationSignals.some((item) => item.regionId === "bezirk-berlin-reinickendorf")).toBe(true);
  });

  it("lists dossier and anlassraum drafts as reviewpflichtig work items", async () => {
    const persistence = createInMemoryRegionSignalDraftPersistence();
    setRegionSignalDraftPersistenceForTests(persistence);
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [organization],
        memberships: [membership()],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-2",
            organizationId: organization.id,
            organizationName: organization.name,
            organizationType: organization.type,
            regionId: organization.primaryRegionId,
            unitId: "unit-1",
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "organization_unit",
            validFrom: "2026-05-17T08:00:00.000Z",
            validUntil: null,
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
              usersUsed: 1,
              factcheckCreditsUsed: 0,
            },
            createdAt: "2026-05-17T08:00:00.000Z",
            updatedAt: "2026-05-17T08:00:00.000Z",
            createdBy: "admin-1",
            source: "admin_grant",
            noAutoBilling: true,
            noAutoCharge: true,
          },
        ],
      }),
    );
    await persistence.saveRecord(dossierDraftRecord());
    await persistence.saveRecord(anlassraumDraftRecord());

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.dossierDrafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Sanierung von Schulen im Bezirk",
          reviewStatus: "needs_review",
        }),
      ]),
    );
    expect(readModel.anlassraumDrafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Bildung & Schulinfrastruktur Reinickendorf",
          reviewStatus: "needs_review",
        }),
      ]),
    );
  });
});
