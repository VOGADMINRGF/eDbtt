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
import {
  createInMemoryContentReleaseWorkbenchRepo,
  setContentReleaseWorkbenchRepoForTests,
} from "@features/contentReleaseWorkbench";
import {
  createInMemoryPersistedCreateHandoffRepo,
  setPersistedCreateHandoffRepoForTests,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  createInMemoryReviewQueueOperationRepo,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";

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

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

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
    setContentReleaseWorkbenchRepoForTests(createInMemoryContentReleaseWorkbenchRepo());
    setPersistedCreateHandoffRepoForTests(createInMemoryPersistedCreateHandoffRepo());
    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
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
    expect(html).toContain("Starte mit deiner Organisation, deiner Region oder deinem Wirkraum.");
    expect(html).toContain("Geführter Einstieg für deine Organisation");
    expect(html).toContain("Organisation vervollständigen");
    expect(html).toContain("Region auswählen");
    expect(html).toContain("Noch keine Freischaltung aktiv.");
    expect(html).toContain("Operations-Persistenz");
    expect(html).toContain("Content-Release-Persistenz");
    expect(html).toContain("Audit-Verlauf");
    expect(html).toContain("In-Memory-Fallback");
    expect(html).toContain("Noch keine regionale Startlage vorbereitet.");
    expect(html).toContain("Noch keine offenen Reviews.");
    expect(html).not.toContain("Notiz speichern");
    expect(html).toContain("Hohe Priorität");
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
    setPersistedCreateHandoffRepoForTests(
      createInMemoryPersistedCreateHandoffRepo({
        records: [
          {
            schemaVersion: "create_handoff_review_item.v1",
            id: "create-handoff-dashboard-1",
            source: "create",
            sourceText: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
            plannerResult: {
              source: "heuristic_fallback",
              plannerSource: "heuristic_fallback",
              plannerProvider: "none",
              plannerRole: "planner_only",
              plannerTopic: "Schulsanierung im Bezirk",
              plannerCore: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
              plannerScope: ["district"],
              plannerStance: "open",
              plannerClusters: ["Bildung"],
              plannerOpenQuestions: ["Welche Standorte haben Priorität?"],
              shortSummary: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
              topicCandidates: ["Schulsanierung"],
              clusterCandidates: ["Bildung"],
              scopeCandidates: ["district"],
              stance: "open",
              openQuestions: ["Welche Standorte haben Priorität?"],
              graphSearchTerms: ["Schulsanierung Reinickendorf"],
              materialSignals: [],
              recommendedLane: "standard",
              providerPlan: {
                lane: "standard",
                plannerProvider: "none",
                plannerRole: "planner_only",
                structureProvider: "mistral",
                summaryProvider: "claude",
                researchUsed: "none",
                researchProvider: null,
                deepSearchUsed: false,
                graphMatch: "after_structure",
              },
              permissions: {
                nonMutative: true,
                canPublish: false,
                canSave: false,
                canMerge: false,
                canDeepSearch: false,
              },
              plannerDegraded: false,
              degradedReason: null,
              plannerDegradedReason: null,
              qualityStatus: "specific",
              qualityIssues: [],
              providerCallAttempted: false,
              providerCallSucceeded: false,
              plannerDebug: {
                attemptedProvider: null,
                usedProvider: "none",
                providerAvailable: false,
                rawPayloadValid: true,
                rawTextValid: true,
                normalizedPayloadValid: true,
                qualityGatePassed: true,
              },
            },
            graphMatches: {
              stage: "after_structure",
              prepared: true,
              requiresConfirmation: true,
              searchTerms: ["Schulsanierung Reinickendorf"],
              matches: [],
              matchedTopics: ["Schulsanierung"],
              matchedDossiers: [],
              matchedClaims: [],
              matchedAnlassraeume: [],
              matchedVotes: [],
              shouldCreateNewTopic: true,
            },
            selectedAction: "create_dossier",
            claims: [
              {
                id: "claim-1",
                text: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
                kind: "factual_claim",
                factcheckEligible: true,
                sourceRefs: ["source-text"],
              },
            ],
            arguments: [],
            openQuestions: [
              {
                id: "question-1",
                question: "Welche Standorte haben Priorität?",
                requiredBeforePublish: true,
              },
            ],
            sourceGrounding: [],
            topicSeed: {
              topicKey: "schulsanierung-im-bezirk",
              topicLabel: "Schulsanierung im Bezirk",
              jurisdiction: "kommune",
              themenradarSourceType: "create_intake",
            },
            resumeHref: "/create?resume=create_handoff&handoffId=create-handoff-dashboard-1",
            reviewState: "ready_for_confirmation",
            visibilityState: "internal_review",
            requiresConfirmation: true,
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noAutomaticOfficialResponse: true,
            noAutoFinalization: true,
            createdByUserId: "user-1",
            regionId: "bezirk-berlin-reinickendorf",
            organizationId: "org-reinickendorf-1",
            dossierId: null,
            anlassraumId: null,
            createdAt: "2026-05-19T08:00:00.000Z",
            updatedAt: "2026-05-19T08:00:00.000Z",
          },
        ],
      }),
    );
    setContentReleaseWorkbenchRepoForTests(
      createInMemoryContentReleaseWorkbenchRepo({
        records: [
          {
            id: "content-release-dossier-create-handoff-dashboard-1",
            sourceKind: "create_handoff",
            sourceResultId: "create-handoff-dashboard-1",
            sourceReviewItemId: "create_handoff:create-handoff-dashboard-1",
            regionId: "bezirk-berlin-reinickendorf",
            targetType: "dossier",
            targetId: "create-handoff-dossier-1",
            title: "Schulsanierung im Bezirk",
            summary: "Bewusst vorbereiteter veröffentlichbarer Arbeitsstand.",
            previewHref: "/dossier/create-handoff-dossier-1/studio",
            publicHref: "/dossier/create-handoff-dossier-1",
            visibilityState: "public_unverified",
            createdByUserId: "user-1",
            createdAt: "2026-05-19T08:05:00.000Z",
            updatedByUserId: "user-1",
            updatedAt: "2026-05-19T08:06:00.000Z",
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noSocialPublishing: true,
            noAutomaticOfficialResponse: true,
            noAutoFinalization: true,
            revokable: true,
            archivable: true,
          },
        ],
      }),
    );

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
    expect(html).toContain("Erste Schritte");
    expect(html).toContain("Quelle auswerten");
    expect(html).toContain("Beispiel-Snapshot laden");
    expect(html).toContain("Review Queue öffnen");
    expect(html).toContain("Dossier vorbereiten");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Sichtbarkeit vorbereiten");
    expect(html).toContain("Veröffentlichbare Inhalte");
    expect(html).toContain("Sichtbare Inhalte");
    expect(html).toContain("Meine Review-Aufgaben");
    expect(html).toContain("Operations-Persistenz");
    expect(html).toContain("Content-Release-Persistenz");
    expect(html).toContain("Audit-Verlauf");
    expect(html).toContain("Öffentliche URL");
    expect(html).toContain("Share-Link");
    expect(html).toContain("Dort wird Sichtbarkeit auch wieder zurückgenommen oder archiviert");
    expect(html).toContain("Diese Aktion betrifft nur den Arbeitsstand deiner Organisation.");
    expect(html).toContain("Notiz speichern");
    expect(html).toContain("In Prüfung setzen");
    expect(html).toContain("Bereit markieren");
    expect(html).toContain("Offen");
    expect(html).toContain("Mittlere Priorität");
    expect(html).toContain("Sanierung von Schulen im Bezirk");
    expect(html).toContain("Bildung &amp; Schulinfrastruktur Reinickendorf");
    expect(html).toContain("Keine automatische Veröffentlichung");
    expect(html).toContain("keine automatische amtliche Freigabe");
  });

  it("marks operator mode explicitly when the global admin context is used", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      email: "admin@example.org",
      roles: ["admin"],
      sessionValid: true,
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);

    const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());

    expect(html).toContain("Betreiber-Modus aktiv.");
    expect(html).toContain("`/admin` bleibt Betreiberbereich");
    expect(html).toContain("Globaler Betreiberkontext.");
  });
});
