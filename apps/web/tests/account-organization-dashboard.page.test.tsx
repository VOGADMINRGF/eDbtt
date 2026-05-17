import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
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
} from "@features/region";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

import AccountOrganizationDashboardPage from "@/app/account/organization/dashboard/page";

describe("/account/organization/dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "user-1" },
      email: "kontakt@example.org",
      roles: ["user"],
      sessionValid: true,
    });
    mocks.userIsAdminDashboard.mockReturnValue(false);
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
    setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
  });

  it("renders pending organization claims with friendly empty states", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        claims: [
          {
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
            evidence: { emailDomain: null, website: "https://bildungsdialog.example", note: "Bitte prüfen" },
            verificationStatus: "pending_review",
            selfDeclaredProfile: null,
            createdAt: "2026-05-17T08:00:00.000Z",
            updatedAt: "2026-05-17T08:00:00.000Z",
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,
            source: "self_declared",
            noAutoAuthority: true,
          },
        ],
      }),
    );

    const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());

    expect(html).toContain("Organisationsbereich");
    expect(html).toContain("Hier sieht deine Organisation ihre Region, Freischaltung, offenen Aufgaben und vorbereiteten Themen.");
    expect(html).toContain("Noch keine Freischaltung aktiv.");
    expect(html).toContain("Noch keine regionale Startlage vorbereitet.");
    expect(html).toContain("Noch keine offenen Reviews.");
    expect(html).toContain("Noch keine Dossier-Entwürfe.");
    expect(html).toContain("Noch keine Anlassräume.");
    expect(html).toContain("Stelle zuerst einen Organisationsantrag oder warte auf Freigabe.");
    expect(html).not.toContain("Verwaltungscockpit Berlin Reinickendorf");
  });

  it("renders verified organization workspace with freischaltung, startlage and reviewpflichtige drafts", async () => {
    const persistence = createInMemoryRegionSignalDraftPersistence();
    setRegionSignalDraftPersistenceForTests(persistence);
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [
          {
            id: "org-reinickendorf-1",
            name: "Bezirksamt Reinickendorf",
            type: "district_office",
            countryCode: "DE",
            primaryRegionId: "bezirk-berlin-reinickendorf",
            website: "https://reinickendorf.example",
            verificationStatus: "organization_verified",
            createdByUserId: "admin-1",
          },
        ],
        memberships: [
          {
            id: "membership-1",
            userId: "user-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
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
          },
        ],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
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
    await persistence.saveRecord({
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
      visibilityState: "internal_review",
      backingStore: "dossiers",
      createdAt: "2026-05-17T08:00:00.000Z",
      updatedAt: "2026-05-17T08:00:00.000Z",
    });
    await persistence.saveRecord({
      id: "draft-record-anlassraum-1",
      uniqueKey: "region-signal-draft:bezirk-berlin-reinickendorf:anlassraum:signal-2",
      signalId: "signal-2",
      regionId: "bezirk-berlin-reinickendorf",
      draftId: "65f000000000000000000444",
      draftType: "anlassraum",
      title: "Bildung & Schulinfrastruktur Reinickendorf",
      summary: "Reviewpflichtiger Anlassraum-Entwurf für den öffentlichen Gesprächsraum.",
      reviewStatus: "needs_review",
      createdByUserId: "user-1",
      createdByRole: "participation_officer",
      authoritySource: "verified_membership",
      adminFallback: false,
      relatedSignalIds: ["signal-2"],
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
        sourceSignalId: "signal-2",
        sourceRegionId: "bezirk-berlin-reinickendorf",
        createdFrom: "region_signal",
        sourceReviewStatus: "accepted",
        pilotFixture: true,
        notProductionData: true,
        notRealNews: true,
      },
      targetStatus: "draft",
      visibilityState: "internal_review",
      backingStore: "anlassraum",
      createdAt: "2026-05-17T08:00:00.000Z",
      updatedAt: "2026-05-17T08:00:00.000Z",
    });

    const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());

    expect(html).toContain("Berlin Reinickendorf");
    expect(html).toContain("Aktiv");
    expect(html).toContain("KI-vorqualifizierte Startlage");
    expect(html).toContain("kuratierte Startlage");
    expect(html).toContain("Keine produktive Quelle verbunden");
    expect(html).toContain("Gewichtung vorbereitet");
    expect(html).toContain("reviewpflichtige Vorschläge");
    expect(html).toContain("Beteiligungssignale");
    expect(html).toContain("Aussage");
    expect(html).toContain("reviewpflichtig");
    expect(html).toContain("Sanierung von Schulen im Bezirk");
    expect(html).toContain("Bildung &amp; Schulinfrastruktur Reinickendorf");
    expect(html).toContain("Keine automatische Veröffentlichung");
    expect(html).toContain("keine automatische amtliche Freigabe");
  });
});
