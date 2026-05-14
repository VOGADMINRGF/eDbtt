import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@features/region", async () => {
  const actual = await vi.importActual<object>("@features/region");
  return {
    ...actual,
    listOperationalRegions: async () => [
      {
        id: "bezirk-berlin-reinickendorf",
        slug: "berlin-reinickendorf",
        name: "Berlin Reinickendorf",
        type: "district",
        administrativeUnitType: "Bezirk",
      },
    ],
    getRegionalAdminCockpitReadModel: async () => ({
      region: {
        id: "bezirk-berlin-reinickendorf",
        slug: "berlin-reinickendorf",
        name: "Berlin Reinickendorf",
        type: "district",
        administrativeUnitType: "Bezirk",
      },
      accessSummary: {
        actorRole: "institutional_actor",
        isAdmin: false,
        authoritySource: "verified_membership",
        adminFallback: false,
        verificationStatus: "organization_verified",
        hintedRegionIds: ["bezirk-berlin-reinickendorf"],
        verifiedRegionIds: ["bezirk-berlin-reinickendorf"],
        scopedRegionIds: ["bezirk-berlin-reinickendorf"],
        organizationIds: ["org-reinickendorf-1"],
        paidDashboardEntitlement: "missing",
        entitlementStatus: null,
        entitlementReason: "missing_entitlement",
        entitlementPlanId: null,
        entitlementPlanLabel: null,
        entitlementScope: null,
        entitlementSource: "not_checked",
        entitlementLimits: null,
        entitlementUsage: null,
        allowedActions: ["read_region_dashboard"],
        canReadRegionDashboard: false,
        canReviewRegionSignal: false,
        canCreateRegionDraft: false,
        canAttachSignalToDossier: false,
        canCreateDossierDraft: false,
        canCreateAnlassraumDraft: false,
      },
      actorCount: 1,
      verifiedActorCount: 1,
      officialDirectoryActorCount: 1,
      signalCount: 1,
      pendingSignalCount: 1,
      directoryStructureBreakdown: [],
      cockpit: {
        id: "admin-cockpit-bezirk-berlin-reinickendorf",
        regionId: "bezirk-berlin-reinickendorf",
        title: "Verwaltungscockpit Berlin Reinickendorf",
        modules: {
          themenlage: { headline: "Themenlage", summary: "1 Signal" },
          akteurskarte: { headline: "Akteurskarte", summary: "1 Akteur" },
          beteiligungsstatus: { headline: "Beteiligungsstatus", summary: "1 Review-Item" },
          offene_fragen: { headline: "Offene Fragen", summary: "1 Frage" },
          teilhabegaps: { headline: "Teilhabegaps", summary: "Keine Scorings" },
          naechste_rueckmeldungen: { headline: "Nächste Rückmeldungen", summary: "Review nötig" },
          mandatsstatus: { headline: "Mandatsstatus", summary: "Kein Auto-Mandat" },
        },
        guardrails: {
          noCitizenScoring: true,
          noAssociationScoring: true,
          noAutomatedEnforcement: true,
        },
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z",
      },
      feedSignals: [
        {
          id: "signal-1",
          kind: "region_feed_signal",
          regionId: "bezirk-berlin-reinickendorf",
          sourceId: "fixture-1",
          sourceType: "news",
          title: "Pilot-Fall",
          summary: "Pilotdaten",
          url: null,
          publishedAt: null,
          detectedTopics: ["Schulen"],
          detectedPlaces: ["Berlin Reinickendorf"],
          relatedClaims: [],
          relatedDossiers: [],
          relatedAnlassraumIds: [],
          suggestedAction: "create_dossier",
          confidence: 0.8,
          reviewStatus: "needs_review",
          noAutoPublish: true,
          noAutoCreateDossier: true,
          noAutoCreateAnlassraum: true,
          noTenderMonitoring: true,
          noProcurementMonitoring: true,
          provenance: {
            dataOrigin: "pilot_fixture",
            isFixture: true,
            pilotFixture: true,
            notRealNews: true,
            notProductionData: true,
            reviewRequired: true,
            sourceKind: "fixture",
          },
          clusterKey: "schools",
          openQuestions: [],
          reviewHint: "review",
          suggestedAnlassraumTitle: "Bildung",
          suggestedDossierTitle: "Schulsanierung",
        },
      ],
      topicClusters: [],
      suggestedAnlassraeume: [],
      suggestedDossiers: [],
      openReviewItems: [
        {
          id: "review-1",
          title: "Pilot-Fall",
          sourceType: "news",
          suggestedAction: "create_dossier",
          reviewStatus: "needs_review",
          dataOrigin: "pilot_fixture",
          isFixture: true,
          confidence: 0.8,
        },
      ],
      activeDossiers: [],
      activeAnlassraeume: [],
      communitySignals: [],
      actorsSummary: {
        total: 1,
        verified: 1,
        officialDirectory: 1,
        manual: 0,
        administration: 1,
      },
      guardrails: {
        noAutoPublish: true,
        noAutoDossierCreation: true,
        noAutoAnlassraumCreation: true,
        noScrapingByDefault: true,
        noTenderMonitoring: true,
        noProcurementMonitoring: true,
        reviewRequired: true,
      },
    }),
  };
});

import AdminRegionPage from "@/app/admin/region/page";

describe("admin-region-entitlement-ui", () => {
  it("shows missing Freischaltung distinctly from membership verification", async () => {
    const html = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: { regionId: "berlin-reinickendorf" },
      }),
    );

    expect(html).toContain("Freischaltung");
    expect(html).toContain("Keine Freischaltung");
    expect(html).toContain("Verifizierte Membership allein reicht nicht.");
    expect(html).toContain("Kein Plan");
    expect(html).toContain("Noch nicht geprüft");
    expect(html).toContain("Self-declared ist nicht verifiziert.");
  });
});
