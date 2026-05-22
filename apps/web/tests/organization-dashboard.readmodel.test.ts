import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryPersistedCreateHandoffRepo,
  setPersistedCreateHandoffRepoForTests,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  buildOrganizationDashboardReadModel,
  buildPersistedRegionAccessContext,
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  createInMemoryRegionSignalDraftPersistence,
  getRegionalAdminCockpitReadModel,
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
import {
  createInMemoryContentReleaseWorkbenchRepo,
  setContentReleaseWorkbenchRepoForTests,
} from "@features/contentReleaseWorkbench";
import {
  createInMemoryReviewQueueOperationRepo,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";

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
    visibilityState: "internal_review",
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
  setPersistedCreateHandoffRepoForTests(createInMemoryPersistedCreateHandoffRepo());
  setContentReleaseWorkbenchRepoForTests(createInMemoryContentReleaseWorkbenchRepo());
  setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
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
    expect(readModel.firstRun.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "organization",
          status: "needs_review",
        }),
        expect.objectContaining({
          id: "review",
          status: "needs_review",
        }),
        expect.objectContaining({
          id: "source",
          status: "needs_review",
        }),
      ]),
    );
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
    expect(readModel.firstRun.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "organization",
          status: "done",
        }),
        expect.objectContaining({
          id: "status",
          status: "available",
        }),
      ]),
    );
  });

  it("supports a generic municipality workspace without any Reinickendorf special casing", async () => {
    const municipality: Organization = {
      id: "org-beispielstadt-1",
      name: "Stadt Beispielstadt",
      type: "municipality",
      countryCode: "DE",
      primaryRegionId: "kommune-beispielstadt",
      website: "https://beispielstadt.example",
      verificationStatus: "organization_verified",
      createdByUserId: "admin-1",
    };
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [municipality],
        memberships: [
          membership({
            organizationId: municipality.id,
            organizationName: municipality.name,
            organizationType: municipality.type,
            regionId: municipality.primaryRegionId,
          }),
        ],
      }),
    );

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.organization.name).toBe("Stadt Beispielstadt");
    expect(readModel.organizationType).toBe("municipality");
    expect(readModel.regionSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          regionId: "kommune-beispielstadt",
          regionName: "Beispielstadt",
          source: "verified_membership",
        }),
      ]),
    );
  });

  it("supports media partners as their own scoped organization workspace without official release by default", async () => {
    const mediaPartner: Organization = {
      id: "org-media-1",
      name: "Lokalredaktion Mitte",
      type: "media",
      countryCode: "DE",
      primaryRegionId: "kommune-beispielstadt",
      website: "https://lokalredaktion.example",
      verificationStatus: "organization_verified",
      createdByUserId: "admin-1",
    };
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [mediaPartner],
        memberships: [
          membership({
            organizationId: mediaPartner.id,
            organizationName: mediaPartner.name,
            organizationType: mediaPartner.type,
            regionId: mediaPartner.primaryRegionId,
            roleLabel: "Redaktion",
            verificationStatus: "publication_approved",
            allowedActions: [
              "read_region_dashboard",
              "review_region_signal",
              "create_region_draft",
              "create_dossier_draft",
              "create_anlassraum_draft",
              "approve_publication",
            ],
          }),
        ],
      }),
    );

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.organization.name).toBe("Lokalredaktion Mitte");
    expect(readModel.organizationType).toBe("media");
    expect(readModel.allowedActions).toContain("approve_publication");
    expect(readModel.allowedActions).not.toContain("public_official");
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
          productiveSourceStatus: expect.stringContaining("Keine produktive Quelle verbunden"),
          curatedSourceStatus: expect.stringContaining("kuratierte"),
          manualSourceStatus: expect.stringContaining("manuelle"),
          weightingLabel: expect.stringContaining("Gewichtung vorbereitet"),
          reviewSuggestionCount: expect.any(Number),
        }),
      ]),
    );
    expect(readModel.participationSignals.some((item) => item.regionId === "bezirk-berlin-reinickendorf")).toBe(true);
    expect(readModel.firstRun.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "source",
          status: "available",
          ctas: expect.arrayContaining([
            expect.objectContaining({ label: "Quelle auswerten" }),
            expect.objectContaining({ label: "Beispiel-Snapshot laden" }),
          ]),
        }),
        expect.objectContaining({
          id: "review",
          status: "needs_review",
          ctas: expect.arrayContaining([
            expect.objectContaining({ label: "Review Queue öffnen" }),
          ]),
        }),
      ]),
    );
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
            } as any,
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
            organizationId: "org-reinickendorf-1",
            targetType: "dossier",
            targetId: "create-handoff-dossier-1",
            title: "Schulsanierung im Bezirk",
            summary: "Bewusst vorbereiteter veröffentlichbarer Arbeitsstand.",
            previewHref: "/dossier/create-handoff-dossier-1/studio",
            publicHref: "/dossier/create-handoff-dossier-1",
            topicPageData: null,
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
          {
            id: "content-release-topic-create-handoff-dashboard-1",
            sourceKind: "create_handoff",
            sourceResultId: "create-handoff-dashboard-1",
            sourceReviewItemId: "create_handoff:create-handoff-dashboard-1",
            regionId: "bezirk-berlin-reinickendorf",
            organizationId: "org-reinickendorf-1",
            targetType: "topic_page",
            targetId: "schulsanierung-im-bezirk-a1b2c3",
            title: "Schulsanierung im Bezirk",
            summary: "Leichter öffentlicher Themenpfad aus demselben Review-Arbeitsstand.",
            previewHref: "/topic/schulsanierung-im-bezirk-a1b2c3?previewTopicPage=1",
            publicHref: "/topic/schulsanierung-im-bezirk-a1b2c3",
            topicPageData: {
              title: "Schulsanierung im Bezirk",
              summary: "Leichter öffentlicher Themenpfad aus demselben Review-Arbeitsstand.",
              claimCandidates: [
                {
                  text: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
                  excerpt: null,
                },
              ],
              evidenceHints: [
                {
                  label: "Link 1",
                  url: "https://reinickendorf.example/aktuelles",
                  excerpt: null,
                },
              ],
              openQuestions: ["Welche Standorte haben Priorität?"],
              reviewStatus: "review_required",
            },
            visibilityState: "public_reviewed",
            createdByUserId: "user-1",
            createdAt: "2026-05-19T08:07:00.000Z",
            updatedByUserId: "user-1",
            updatedAt: "2026-05-19T08:08:00.000Z",
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
        auditEvents: [
          {
            id: "content-release-audit-1",
            recordId: "content-release-dossier-create-handoff-dashboard-1",
            sourceKind: "create_handoff",
            sourceResultId: "create-handoff-dashboard-1",
            targetType: "dossier",
            action: "visibility_made_public",
            byUserId: "user-1",
            note: "Bewusst sichtbar gemacht.",
            at: "2026-05-19T08:06:00.000Z",
          },
        ],
      }),
    );

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
    expect(readModel.openReviewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "region_signal_draft",
          title: "Sanierung von Schulen im Bezirk",
        }),
        expect.objectContaining({
          domain: "region_signal_draft",
          title: "Bildung & Schulinfrastruktur Reinickendorf",
        }),
        expect.objectContaining({
          domain: "create_handoff",
          title: "Schulsanierung im Bezirk · Dossier-Entwurf",
        }),
      ]),
    );
    expect(readModel.firstRun.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "dossier",
          status: "done",
          ctas: expect.arrayContaining([
            expect.objectContaining({ label: "Dossier vorbereiten" }),
          ]),
        }),
        expect.objectContaining({
          id: "anlassraum",
          status: "done",
          ctas: expect.arrayContaining([
            expect.objectContaining({ label: "Anlassraum vorbereiten" }),
          ]),
        }),
        expect.objectContaining({
          id: "visibility",
          ctas: expect.arrayContaining([
            expect.objectContaining({ label: "Sichtbarkeit vorbereiten" }),
          ]),
        }),
      ]),
    );
    expect(readModel.publishSummary).toMatchObject({
      totalPrepared: 2,
      visibleCount: 2,
      shareableCount: 2,
      archivedCount: 0,
    });
    expect(readModel.publishSummary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetType: "topic_page",
          targetLabel: "Öffentliche Themenseite",
          publicHref: "/topic/schulsanierung-im-bezirk-a1b2c3",
        }),
      ]),
    );
    expect(readModel.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "share_visible_content",
          label: "Öffentlichen Link teilen",
        }),
      ]),
    );
  });

  it("offers explicit official review only for publication-approved memberships", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [organization],
        memberships: [
          membership({
            verificationStatus: "publication_approved",
            allowedActions: [
              "read_region_dashboard",
              "review_region_signal",
              "create_region_draft",
              "create_dossier_draft",
              "create_anlassraum_draft",
              "approve_publication",
            ],
          }),
        ],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-3",
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

    expect(readModel.allowedActions).toContain("approve_publication");
    expect(readModel.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "review_official_release",
          label: "Amtliche Freigabe prüfen",
        }),
      ]),
    );
  });

  it("keeps allowed actions aligned between organization dashboard and region cockpit", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [organization],
        memberships: [
          membership({
            verificationStatus: "unit_verified",
            allowedActions: [
              "read_region_dashboard",
              "review_region_signal",
              "create_region_draft",
              "create_dossier_draft",
              "create_anlassraum_draft",
              "submit_for_review",
            ],
          }),
        ],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-allowed-actions",
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
    const accessContext = await buildPersistedRegionAccessContext({
      userId: "user-1",
      actorRole: "participation_officer",
      isAdmin: false,
      roles: ["user"],
      organizationIds: [organization.id],
      regionId: organization.primaryRegionId ?? "bezirk-berlin-reinickendorf",
    });
    const cockpit = await getRegionalAdminCockpitReadModel(
      organization.primaryRegionId ?? "bezirk-berlin-reinickendorf",
      { accessContext },
    );

    expect([...readModel.allowedActions].sort()).toEqual(
      [...cockpit.accessSummary.allowedActions].sort(),
    );
    expect(readModel.allowedActions).toEqual(
      expect.arrayContaining([
        "read_region_dashboard",
        "review_region_signal",
        "create_region_draft",
        "create_dossier_draft",
        "create_anlassraum_draft",
        "submit_for_review",
      ]),
    );
    expect(readModel.allowedActions).not.toContain("approve_publication");
    expect(cockpit.accessSummary.canCreateDossierDraft).toBe(true);
    expect(cockpit.accessSummary.canCreateAnlassraumDraft).toBe(true);
    expect(cockpit.accessSummary.allowedActions).not.toContain("approve_publication");
    expect(readModel.nextActions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "review_official_release",
        }),
      ]),
    );
  });

  it("reuses the persisted review-operations source in the organization scope", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [organization],
        memberships: [membership()],
      }),
    );

    const draftPersistence = createInMemoryRegionSignalDraftPersistence();
    await draftPersistence.saveRecord(dossierDraftRecord());
    setRegionSignalDraftPersistenceForTests(draftPersistence);

    setReviewQueueOperationRepoForTests(
      createInMemoryReviewQueueOperationRepo({
        records: [
          {
            itemId: "region_signal_draft:draft-record-dossier-1",
            operationalStatus: "in_review",
            assignedToUserId: "user-2",
            assignedByUserId: "user-1",
            assignedAt: "2026-05-19T10:00:00.000Z",
            noteCount: 1,
            latestNote: "Bitte zuerst offene Fragen priorisieren.",
            latestNoteAt: "2026-05-19T10:05:00.000Z",
            latestAction: "mark_in_review",
            latestActionAt: "2026-05-19T10:05:00.000Z",
            latestActionByUserId: "user-1",
            createdAt: "2026-05-19T10:00:00.000Z",
            updatedAt: "2026-05-19T10:05:00.000Z",
          },
        ],
        auditEvents: [
          {
            id: "review-queue-org-audit-1",
            itemId: "region_signal_draft:draft-record-dossier-1",
            action: "mark_in_review",
            byUserId: "user-1",
            at: "2026-05-19T10:05:00.000Z",
            note: "Bitte zuerst offene Fragen priorisieren.",
            previousOperationalStatus: "open",
            nextOperationalStatus: "in_review",
            previousAssignedToUserId: null,
            nextAssignedToUserId: "user-2",
          },
        ],
      }),
    );

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.reviewQueueOperationsPersistence).toMatchObject({
      mode: "in_memory_fallback",
      productionTruth: false,
    });
    expect(readModel.contentReleasePersistence).toMatchObject({
      mode: "in_memory_fallback",
      productionTruth: false,
    });
    expect(readModel.openReviewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "region_signal_draft:draft-record-dossier-1",
          assignedToUserId: "user-2",
          operationalStatus: "in_review",
          moderationPermission: expect.objectContaining({
            canOperateOwnReviewItem: true,
            canPrepareOwnContentRelease: true,
            canMakeOwnContentVisible: false,
            allowedActions: expect.arrayContaining([
              "add_note",
              "request_changes",
              "mark_in_review",
              "mark_ready",
            ]),
          }),
          latestNote: expect.objectContaining({
            text: "Bitte zuerst offene Fragen priorisieren.",
          }),
          activityTrail: expect.arrayContaining([
            expect.objectContaining({
              action: "mark_in_review",
              actionLabel: "In Review gesetzt",
            }),
          ]),
        }),
      ]),
    );
    expect(readModel.recentUnifiedAuditTrail).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "review_operation_applied",
          detail: "In Review gesetzt",
        }),
      ]),
    );
  });

  it("keeps organization-verified members on their own scope without ready or visibility powers", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [organization],
        memberships: [
          membership({
            verificationStatus: "organization_verified",
            allowedActions: ["read_region_dashboard", "review_region_signal"],
          }),
        ],
      }),
    );

    const draftPersistence = createInMemoryRegionSignalDraftPersistence();
    await draftPersistence.saveRecord(dossierDraftRecord());
    setRegionSignalDraftPersistenceForTests(draftPersistence);

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.openReviewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "region_signal_draft:draft-record-dossier-1",
          moderationPermission: expect.objectContaining({
            role: "organization_verified",
            canOperateOwnReviewItem: true,
            canPrepareOwnContentRelease: false,
            canMakeOwnContentVisible: false,
            allowedActions: expect.arrayContaining([
              "add_note",
              "request_changes",
              "mark_in_review",
            ]),
          }),
        }),
      ]),
    );
    expect(
      readModel.openReviewItems[0]?.moderationPermission.allowedActions.includes("mark_ready"),
    ).toBe(false);
  });

  it("keeps verified organizations isolated from foreign review items and regions", async () => {
    const draftPersistence = createInMemoryRegionSignalDraftPersistence();
    await draftPersistence.saveRecord({
      ...dossierDraftRecord(),
      id: "draft-record-beispielstadt-1",
      uniqueKey: "region-signal-draft:kommune-beispielstadt:dossier:signal-1",
      regionId: "kommune-beispielstadt",
      title: "Bibliothek und Jugendhaus Beispielstadt",
      relatedPlaces: ["Beispielstadt"],
      provenance: {
        ...dossierDraftRecord().provenance,
        sourceRegionId: "kommune-beispielstadt",
      },
    });
    await draftPersistence.saveRecord({
      ...dossierDraftRecord(),
      id: "draft-record-foreign-1",
      uniqueKey: "region-signal-draft:bezirk-berlin-reinickendorf:dossier:signal-9",
      title: "Fremdes Thema Reinickendorf",
      createdByUserId: "user-2",
    });
    setRegionSignalDraftPersistenceForTests(draftPersistence);
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [
          {
            id: "org-beispielstadt-1",
            name: "Stadt Beispielstadt",
            type: "municipality",
            countryCode: "DE",
            primaryRegionId: "kommune-beispielstadt",
            website: "https://beispielstadt.example",
            verificationStatus: "organization_verified",
            createdByUserId: "admin-1",
          },
          organization,
        ],
        memberships: [
          membership({
            organizationId: "org-beispielstadt-1",
            organizationName: "Stadt Beispielstadt",
            organizationType: "municipality",
            regionId: "kommune-beispielstadt",
          }),
          membership({
            id: "membership-foreign-1",
            userId: "user-2",
            organizationId: organization.id,
            organizationName: organization.name,
            organizationType: organization.type,
            regionId: organization.primaryRegionId,
          }),
        ],
      }),
    );

    const readModel = await buildOrganizationDashboardReadModel({
      userId: "user-1",
      roles: ["user"],
      isAdmin: false,
    });

    expect(readModel.regionSummary.every((entry) => entry.regionId !== "bezirk-berlin-reinickendorf")).toBe(true);
    expect(readModel.openReviewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Bibliothek und Jugendhaus Beispielstadt",
        }),
      ]),
    );
    expect(readModel.openReviewItems.some((item) => item.title === "Fremdes Thema Reinickendorf")).toBe(false);
  });
});
