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
import * as regionFeatures from "@features/region";
import {
  createInMemoryContentReleaseWorkbenchRepo,
  setContentReleaseWorkbenchRepoForTests,
} from "@features/contentReleaseWorkbench";
import {
  createInMemoryPersistedCreateHandoffRepo,
  setPersistedCreateHandoffRepoForTests,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  createInMemoryFactcheckWorkflowRepo,
  setFactcheckWorkflowRepoForTests,
} from "@features/factcheck/db";
import {
  createInMemorySocialDistributionRepo,
  setSocialDistributionRepoForTests,
} from "@features/outputEngine/socialDistributionRuntime";
import {
  createInMemoryReviewQueueOperationRepo,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";
import { setMembershipDirectoryRepositoryForTests } from "@/lib/server/auth/runtimeAdapters";
import { setPricingOrderContractsRuntimeRepoForTests } from "@features/pricing/orderContractsRuntime";

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

function buildOperatorDashboardReadModel() {
  return {
    organization: {
      primaryOrganizationId: null,
      name: null,
      organizations: [],
      roleLabel: null,
      isOperatorMode: true,
    },
    organizationType: null,
    verificationStatus: "admin_fallback",
    membershipStatus: {
      totalMemberships: 0,
      verifiedMemberships: 0,
      pendingClaims: 0,
      highestVerificationStatus: "admin_fallback",
    },
    directorySummary: {
      sourceOfTruth: "session",
      confidence: "admin_fallback",
      runtimeMarker: "demo_or_test_runtime",
      productionTruth: false,
      auditBacked: false,
      verificationStatus: "verified",
    },
    provisioningSummary: {
      currentStatus: "none",
      latestRequest: null,
      requests: [],
      operatorReviewRequired: false,
      nextStepTitle: "Sicherer Antragseinstieg",
      nextStepBody: "Ohne bestätigte Organisation bleiben Organisationsrouten schreibgeschützt.",
      storeLabel: "Persistenter Claim-Store",
      productionTruth: true,
    },
    contractSummary: {
      currentContractStatus: "none",
      billingStatus: "none",
      sourceOfTruth: "fixture_demo",
      confidence: "limited",
      runtimeMarker: "demo_or_test_runtime",
      productionTruth: false,
      auditBacked: false,
      planAssignment: null,
      accessProvisioningDecision: "none",
      operatorDecisionRequired: true,
      nextStepTitle: "Vertrag ausstehend",
      nextStepBody:
        "Ohne bewussten Betreiber-Vertragsprozess werden keine produktiven Arbeitszugänge als aktiv ausgegeben.",
      storeLabel: "Demo-/Test-Fallback",
      records: [],
    },
    partnerPackageSummary: {
      currentStatus: "none",
      statusLabel: "Kein Projektpaket aktiv",
      currentType: null,
      typeLabel: null,
      sourceOfTruth: "fixture_demo",
      confidence: "limited",
      runtimeMarker: "demo_or_test_runtime",
      productionTruth: false,
      auditBacked: false,
      enabledScopes: [],
      reportingState: null,
      reportingLabel: null,
      transparency: null,
      transparencyRoleLabel: null,
      nextStepTitle: "Kein Projektpaket aktiv",
      nextStepBody:
        "Projektpakete werden erst nach bewusster Betreiberentscheidung, passendem Vertrag und auditierbarer Transparenz als aktiv geführt.",
      storeLabel: "In-Memory-/Test-Fallback",
      items: [],
      guardrails: {
        noOperatorRights: true,
        noPublicOfficial: true,
        noPublicationApproved: true,
        noSourceWeightInfluence: true,
        noVoteOutcomeInfluence: true,
        noFactcheckSealInfluence: true,
      },
    },
    regionSummary: [],
    entitlementSummary: {
      currentStatus: "none",
      state: "fehlt",
      hasActiveEntitlement: false,
      hasTrialEntitlement: false,
      hasMissingEntitlement: true,
      hasExpiredEntitlement: false,
      planLabels: [],
      organizationIds: [],
      grants: [],
      operatorDecisionRequired: false,
      billingPending: false,
      nextStepTitle: "Kein freigegebener Arbeitszugang",
      nextStepBody: "Ohne bestätigte Freischaltung bleiben Schreibpfade gesperrt.",
      storeLabel: "Persistente Entitlement-Runtime",
      productionTruth: true,
      guardrails: {
        noPaymentClaim: true,
        noCheckout: true,
      },
    },
    allowedActions: [],
    pendingOrganizationClaims: [],
    verifiedMemberships: [],
    firstRun: {
      intro: "Betreiberkontext zeigt denselben Arbeitsstand ohne Org-Membership-Auflösung.",
      steps: [],
    },
    openReviewItems: [],
    reviewQueueSummary: {
      total: 0,
      highPriorityCount: 0,
      readyCount: 0,
      blockedCount: 0,
      byOperationalStatus: [],
    },
    reviewQueueOperationsPersistence: null,
    contentReleasePersistence: null,
    recentUnifiedAuditTrail: [],
    regionalStartingPoints: [],
    dossierDrafts: [],
    anlassraumDrafts: [],
    participationSignals: [],
    socialDistributionSummary: {
      currentState: "not_enabled",
      statusLabel: "Keine Verteilentwürfe aktiv",
      nextStepTitle: "Review-first Verteilung startet erst nach Freigabe",
      nextStepBody:
        "Social Publishing bleibt im v1-Pfad kanalweiser Entwurf mit Review, Audit und manuellem Published-Marking.",
      storeLabel: "In-Memory-/Test-Fallback",
      productionTruth: false,
      reviewRequired: true,
      items: [],
    },
    publishSummary: {
      totalPrepared: 0,
      visibleCount: 0,
      shareableCount: 0,
      archivedCount: 0,
      items: [],
    },
    nextActions: [],
    guardrails: {
      noAutoOfficialClaim: true,
      noAutoPublish: true,
      noAutoDossierFinalization: true,
      noAutoAnlassraumFinalization: true,
      reviewRequiredForOfficialStatus: true,
    },
  } as const;
}

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
    setFactcheckWorkflowRepoForTests(createInMemoryFactcheckWorkflowRepo());
    setSocialDistributionRepoForTests(createInMemorySocialDistributionRepo());
    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
    setMembershipDirectoryRepositoryForTests(null);
    setPricingOrderContractsRuntimeRepoForTests({
      async listPricingOrdersForOrganization() {
        return [];
      },
    });
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
            provisioningRequest: {
              organizationKind: "association",
              status: "submitted",
              latestDecision: "submit",
              source: "self_service",
              requestedRegionId: "bezirk-berlin-reinickendorf",
              requestedRegionLabel: "Berlin Reinickendorf",
              applicantName: "Mara Beispiel",
              applicantEmail: "mara@bildungsdialog.example",
              responsiblePersonName: "Mara Beispiel",
              responsiblePersonEmail: "mara@bildungsdialog.example",
              requestedRoleLabel: "Koordination",
              note: "Bitte prüfen",
              submittedAt: "2026-05-17T08:00:00.000Z",
              decidedAt: null,
              decidedBy: null,
            },
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
    expect(html).toContain("Vertrag &amp; Billing");
    expect(html).toContain("Vertrag ausstehend");
    expect(html).toContain("Es wird kein externer Checkout behauptet");
    expect(html).toContain("Verifikationsstatus");
    expect(html).toContain("Directory-Wahrheit");
    expect(html).toContain("Demo- oder Testwahrheit");
    expect(html).toContain("Nicht als produktive Membership-Wahrheit werten");
    expect(html).toContain("Confidence:");
    expect(html).toContain("Onboarding-Status");
    expect(html).toContain("Betreiberprüfung läuft");
    expect(html).toContain("Anträge laufen derzeit auf lokalem oder In-Memory-Fallback");
    expect(html).toContain("Antragsteller: Mara Beispiel");
    expect(html).toContain("Schnell starten");
    expect(html).toContain("Aufgaben zuerst, nicht Module");
    expect(html).toContain("Ich will etwas beitragen");
    expect(html).toContain("Ich will Themen anschauen");
    expect(html).toContain("Ich will einen Anlassraum/Event erstellen");
    expect(html).toContain("Ich prüfe meine Organisation");
    expect(html).toContain("Freischaltung nötig");
    expect(html).toContain("/account/organization");
    expect(html).toContain("Material &amp; Uploads");
    expect(html).toContain("Organisation noch nicht verifiziert");
    expect(html).toContain("Produktiver Workflow");
    expect(html).toContain("Noch gesperrt");
    expect(html).toContain("kein automatischer Gemini-/DeepSearch-/Research-Lauf");
    expect(html).toContain("Organisation noch nicht verifiziert");
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
            intakeClassification: "free_text",
            createdByUserId: "user-1",
            regionId: "bezirk-berlin-reinickendorf",
            organizationId: "org-reinickendorf-1",
            dossierId: null,
            anlassraumId: null,
            requestScope: {
              organizationId: "org-reinickendorf-1",
              organizationLabel: "Bezirksamt Reinickendorf",
              membershipStatus: "verified",
              organizationRole: "reviewer",
              roleLabel: "Beteiligung",
              regionIds: ["bezirk-berlin-reinickendorf"],
              primaryRegionId: "bezirk-berlin-reinickendorf",
              isOperatorMode: false,
              operatorModeLabel: null,
              sourceOfTruth: "operator_verified_directory",
              confidence: "high",
            },
            accessDecision: {
              status: "allowed",
              reason: "allowed",
              title: "Produktiver Handoff ist freigeschaltet",
              body: "Membership, Vertrag, Billing-Status und Entitlements erlauben diesen review-first Organisations-Handoff.",
              requiredEntitlementScopes: ["review_queue", "content_release", "dossier_studio"],
              missingEntitlementScopes: [],
              requiredActions: ["create_dossier_draft", "submit_for_review"],
              missingActions: [],
              contractStatus: "active",
              billingStatus: "operator_verified_contract",
              entitlementStatus: "granted",
            },
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
    expect(html).toContain("Schnell starten");
    expect(html).toContain("Aufgaben zuerst, nicht Module");
    expect(html).toContain("Ich will etwas beitragen");
    expect(html).toContain("Ich will Themen anschauen");
    expect(html).toContain("Ich will einen Anlassraum/Event erstellen");
    expect(html).toContain("Ich öffne meinen Arbeitsbereich");
    expect(html).toContain("Produktiver Pfad");
    expect(html).toContain("Quelle/Material einreichen");
    expect(html).toContain("Freigaben prüfen");
    expect(html).toContain("/create?intent=contribute&amp;mode=source");
    expect(html).toContain("/account/organization/dashboard#aufgaben");
    expect(html).toContain("Erste Schritte");
    expect(html).toContain("Material &amp; Uploads");
    expect(html).toContain("Material-Intake bereit");
    expect(html).toContain("Material bewusst einreichen");
    expect(html).toContain("Kein automatisches NotebookLM");
    expect(html).toContain("Quellen &amp; Snapshots");
    expect(html).toContain("Quelle beantragen oder testen");
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
    const readModelSpy = vi
      .spyOn(regionFeatures, "buildOrganizationDashboardReadModel")
      .mockResolvedValue(buildOperatorDashboardReadModel() as never);
    setMembershipDirectoryRepositoryForTests({
      async listMembershipDirectoryForActor() {
        throw new Error("operator dashboard must not resolve membership directory");
      },
      async resolveRegionAccess() {
        throw new Error("operator dashboard must not resolve region access");
      },
    });

    try {
      const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());

      expect(html).toContain("Betreiber-Modus aktiv.");
      expect(html).toContain("`/admin` bleibt Betreiberbereich");
      expect(html).toContain("Globaler Betreiberkontext.");
      expect(html).toContain("Betreiberkontext");
    } finally {
      readModelSpy.mockRestore();
    }
  });

  it("shows an honest directory blocker when the external directory is still pending", async () => {
    const readModelSpy = vi.spyOn(regionFeatures, "buildOrganizationDashboardReadModel");
    readModelSpy.mockResolvedValue({
      ...buildOperatorDashboardReadModel(),
      organization: {
        primaryOrganizationId: null,
        name: null,
        organizations: [],
        roleLabel: null,
        isOperatorMode: false,
      },
      verificationStatus: "none",
      membershipStatus: {
        totalMemberships: 0,
        verifiedMemberships: 0,
        pendingClaims: 0,
        highestVerificationStatus: "none",
      },
      directorySummary: {
        sourceOfTruth: "external_directory_pending",
        confidence: "limited",
        runtimeMarker: "external_directory_pending",
        productionTruth: false,
        auditBacked: false,
        verificationStatus: "none",
      },
    } as any);

    try {
      const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());

      expect(html).toContain("Externe Directory-Anbindung ausstehend");
      expect(html).toContain("Directory-Anbindung fehlt");
      expect(html).toContain("spätere externe Directory-Anbindung bleibt optional");
    } finally {
      readModelSpy.mockRestore();
    }
  });

  it("renders contract and billing states honestly for organizations", async () => {
    const readModelSpy = vi.spyOn(regionFeatures, "buildOrganizationDashboardReadModel");
    readModelSpy.mockResolvedValue({
      ...buildOperatorDashboardReadModel(),
      organization: {
        primaryOrganizationId: "org-reinickendorf-1",
        name: "Bezirksamt Reinickendorf",
        organizations: [],
        roleLabel: "Beteiligung",
        isOperatorMode: false,
      },
      contractSummary: {
        currentContractStatus: "limited",
        billingStatus: "grace_period",
        sourceOfTruth: "operator_verified_contract",
        confidence: "high",
        runtimeMarker: "production_runtime",
        productionTruth: true,
        auditBacked: true,
        planAssignment: {
          planId: "kommune-aktivierung",
          planLabel: "Kommune Aktivierung",
          scopes: ["organization_dashboard", "region_cockpit"],
        },
        accessProvisioningDecision: "grace",
        operatorDecisionRequired: false,
        nextStepTitle: "Grace Period",
        nextStepBody:
          "Der Zugang bleibt vorübergehend begrenzt sichtbar. Schreibende Produktzugänge bleiben auf definierte Basisscopes reduziert.",
        storeLabel: "Persistenter Betreiber-Vertragsprozess",
        records: [],
      },
      entitlementSummary: {
        ...buildOperatorDashboardReadModel().entitlementSummary,
        currentStatus: "limited",
        state: "eingeschränkt",
        hasTrialEntitlement: true,
        hasMissingEntitlement: false,
        planLabels: ["Kommune Aktivierung"],
        grants: [
          {
            id: "org-reinickendorf-1:region_cockpit",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            regionId: "bezirk-berlin-reinickendorf",
            scope: "region_cockpit",
            status: "limited",
            latestDecision: "limit",
            source: "paid_dashboard_entitlement",
            linkedEntitlementId: "entitlement-1",
            linkedPlanLabel: "Kommune Aktivierung",
            note: "Dieser Scope bleibt in der Grace Period aktiv.",
            billingPending: false,
            productionTruth: true,
            accessEnabled: true,
            noAutoPublicationApproved: true,
            noAutoPublicOfficial: true,
            noAutoPublish: true,
            auditEvents: [],
            updatedAt: "2026-05-23T12:00:00.000Z",
          },
          {
            id: "org-reinickendorf-1:review_queue",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            regionId: "bezirk-berlin-reinickendorf",
            scope: "review_queue",
            status: "limited",
            latestDecision: "limit",
            source: "paid_dashboard_entitlement",
            linkedEntitlementId: "entitlement-1",
            linkedPlanLabel: "Kommune Aktivierung",
            note: "Dieser Scope ist im aktuellen Vertragsstatus bewusst nicht aktiv.",
            billingPending: false,
            productionTruth: true,
            accessEnabled: false,
            noAutoPublicationApproved: true,
            noAutoPublicOfficial: true,
            noAutoPublish: true,
            auditEvents: [],
            updatedAt: "2026-05-23T12:00:00.000Z",
          },
        ],
        operatorDecisionRequired: false,
        nextStepTitle: "Grace Period",
        nextStepBody:
          "Der Zugang bleibt vorübergehend begrenzt sichtbar. Schreibende Produktzugänge bleiben auf definierte Basisscopes reduziert.",
        storeLabel: "Persistente Entitlement-Runtime",
        productionTruth: true,
      },
    } as any);

    try {
      const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());
      expect(html).toContain("Grace Period");
      expect(html).toContain("Zugriff eingeschränkt");
      expect(html).toContain("Betreiber-verifizierter Vertragsprozess");
      expect(html).toContain("Dieser Scope ist sichtbar, aber im aktuellen Vertrags- oder Billing-Status nicht aktiv.");
      expect(html).toContain("Audit-Hinweis: Vertrags-, Billing- und Plan-Entscheidungen bleiben persistent und auditierbar.");
    } finally {
      readModelSpy.mockRestore();
    }
  });

  it("renders social distribution states honestly without auto-publish language", async () => {
    const readModelSpy = vi.spyOn(regionFeatures, "buildOrganizationDashboardReadModel");
    readModelSpy.mockResolvedValue({
      ...buildOperatorDashboardReadModel(),
      socialDistributionSummary: {
        currentState: "review_required",
        statusLabel: "Review erforderlich",
        nextStepTitle: "Review und Kanalentscheidung stehen an",
        nextStepBody:
          "Freigabe heißt nicht veröffentlicht. `approved` und `published_manual` bleiben getrennt, auditierbar und ohne externes API-Posting.",
        storeLabel: "Persistente Distribution-Runtime",
        productionTruth: true,
        reviewRequired: true,
        items: [
          {
            id: "social-dist-1",
            title: "Eigener Verteilentwurf",
            status: "review_required",
            statusLabel: "Review erforderlich",
            channels: ["website_update", "newsletter_draft"],
            sourceState: "approved_context",
            sourceVisibilityState: "public_reviewed",
            approvalRequired: true,
            sealGranted: false,
            updatedAt: "2026-05-24T09:00:00.000Z",
          },
        ],
      },
    } as any);

    try {
      const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());
      expect(html).toContain("Social &amp; Distribution");
      expect(html).toContain("Persistente Distribution-Runtime");
      expect(html).toContain("Review erforderlich");
      expect(html).toContain("Freigegebener Kontext");
      expect(html).toContain("Kein Auto-Publish");
      expect(html).toContain("Kein Siegel ohne explizite Freigabe.");
      expect(html).not.toContain("Jetzt veröffentlichen");
    } finally {
      readModelSpy.mockRestore();
    }
  });

  it("renders partner package transparency and reporting honestly", async () => {
    const readModelSpy = vi.spyOn(regionFeatures, "buildOrganizationDashboardReadModel");
    readModelSpy.mockResolvedValue({
      ...buildOperatorDashboardReadModel(),
      contractSummary: {
        ...buildOperatorDashboardReadModel().contractSummary,
        currentContractStatus: "active",
        billingStatus: "operator_verified_contract",
        sourceOfTruth: "operator_verified_contract",
        confidence: "high",
        runtimeMarker: "production_runtime",
        productionTruth: true,
        auditBacked: true,
      },
      partnerPackageSummary: {
        currentStatus: "reporting_required",
        statusLabel: "Reporting erforderlich",
        currentType: "foundation_program",
        typeLabel: "Stiftungsprogramm",
        sourceOfTruth: "operator_verified_contract",
        confidence: "high",
        runtimeMarker: "production_runtime",
        productionTruth: true,
        auditBacked: true,
        enabledScopes: ["dossier_studio", "social_distribution", "reporting_export"],
        reportingState: "review_required",
        reportingLabel: "Reporting prüfen",
        transparency: {
          partnerName: "Stiftung Beispielstadt",
          role: "foerderer",
          label: "Förderhinweis im Projektraum",
          transparencyNote:
            "Förderung trägt den Arbeitsraum, beeinflusst aber weder Quellengewichtung noch Ergebnisdarstellung.",
          sourceReference: "CON-FOUNDATION-2026-01",
          shownToUsers: true,
          shownToAdmins: true,
          noSourceWeightInfluence: true,
          noVoteOutcomeInfluence: true,
          noFactcheckSealInfluence: true,
          noAutoOfficial: true,
          noAutoPublicationApproved: true,
        },
        transparencyRoleLabel: "Förderer",
        nextStepTitle: "Reporting erforderlich",
        nextStepBody:
          "Das Paket verlangt einen nachvollziehbaren Reporting- oder Exportschritt. Es werden keine Live-Analytics oder Ergebnisgewichte behauptet.",
        storeLabel: "Persistenter Betreiber-Vertrags- und Paketprozess",
        items: [
          {
            id: "pkg-foundation-1",
            type: "foundation_program",
            typeLabel: "Stiftungsprogramm",
            status: "reporting_required",
            statusLabel: "Reporting erforderlich",
            sourceOfTruth: "operator_verified_contract",
            productionTruth: true,
            auditBacked: true,
            scopes: ["dossier_studio", "social_distribution", "reporting_export"],
            scopeLabels: ["Dossier Studio", "Social Distribution", "Reporting / Export"],
            enabledScopes: ["dossier_studio", "social_distribution", "reporting_export"],
            reportingState: "review_required",
            reportingLabel: "Reporting prüfen",
            transparency: {
              partnerName: "Stiftung Beispielstadt",
              role: "foerderer",
              label: "Förderhinweis im Projektraum",
              transparencyNote:
                "Förderung trägt den Arbeitsraum, beeinflusst aber weder Quellengewichtung noch Ergebnisdarstellung.",
              sourceReference: "CON-FOUNDATION-2026-01",
              shownToUsers: true,
              shownToAdmins: true,
              noSourceWeightInfluence: true,
              noVoteOutcomeInfluence: true,
              noFactcheckSealInfluence: true,
              noAutoOfficial: true,
              noAutoPublicationApproved: true,
            },
            transparencyRoleLabel: "Förderer",
            auditEvents: [],
            createdAt: "2026-05-24T09:00:00.000Z",
            updatedAt: "2026-05-24T09:15:00.000Z",
          },
        ],
        guardrails: {
          noOperatorRights: true,
          noPublicOfficial: true,
          noPublicationApproved: true,
          noSourceWeightInfluence: true,
          noVoteOutcomeInfluence: true,
          noFactcheckSealInfluence: true,
        },
      },
    } as any);

    try {
      const html = renderToStaticMarkup(await AccountOrganizationDashboardPage());
      expect(html).toContain("Partner- &amp; Projektpaket");
      expect(html).toContain("Reporting erforderlich");
      expect(html).toContain("Stiftungsprogramm");
      expect(html).toContain("Förderhinweis im Projektraum");
      expect(html).toContain("Freigeschaltete Leistungen: Dossier Studio, Social Distribution, Reporting / Export");
      expect(html).toContain("setzen nie `public_official`");
      expect(html).not.toContain("automatisch veröffentlicht");
    } finally {
      readModelSpy.mockRestore();
    }
  });
});
