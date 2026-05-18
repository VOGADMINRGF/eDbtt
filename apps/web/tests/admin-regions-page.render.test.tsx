import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@features/region", async () => {
  const actual = await vi.importActual<object>("@features/region");
  return {
    ...actual,
    listRegionsFromRegistry: () => [],
    getDirectorySourceStatus: () => ({
      regionRegistry: {
        sourceKey: "region_registry",
        label: "RegionRegistry",
        sourceFile: "RegionRegistry.snapshot.json",
        sourcePath: null,
        sourceAsOf: null,
        status: "missing",
        isConnected: false,
        recordCount: 0,
        message: "Amtliches Gemeindeverzeichnis ist nicht verbunden.",
        errorCode: "region_registry_not_found",
      },
      officialDirectory: {
        sourceKey: "official_directory",
        label: "OfficialDirectory",
        sourceFile: "Anschriften_der_Gemeinde_und_Stadtverwaltungen_Stand_31012023_final.xlsx",
        sourcePath: "/tmp/mock.xlsx",
        sourceAsOf: "2023-01-31",
        status: "ready",
        isConnected: true,
        recordCount: 1,
        message: "Amtliche Verwaltungsanschriften sind verbunden.",
        errorCode: null,
      },
    }),
    listOperationalRegions: async () => [
      {
        id: "region-official-01001000",
        slug: "flensburg",
        name: "Flensburg",
        type: "kommune",
        administrativeUnitType: "Stadtverwaltung",
        officialBody: { id: "body-flensburg", label: "Stadt Flensburg", bodyType: "stadtverwaltung" },
        officialDirectoryEntry: { ags: "01001000" },
      },
      {
        id: "bezirk-berlin-reinickendorf",
        slug: "berlin-reinickendorf",
        name: "Berlin Reinickendorf",
        type: "bezirk",
        administrativeUnitType: "Bezirk",
        officialBody: { id: "body-reinickendorf", label: "Bezirksamt Reinickendorf", bodyType: "bezirksamt" },
        officialDirectoryEntry: null,
      },
    ],
    listRegionSourceConnections: async () => [
      {
        id: "source-1",
        regionId: "bezirk-berlin-reinickendorf",
        label: "Bezirksamt Reinickendorf News",
        sourceType: "municipal_news",
        adapterId: "productive_regional_source",
        url: "https://reinickendorf.example/aktuelles",
        notes: null,
        enabled: true,
        sampleItems: [
          {
            title: "Schulwegsicherheit im Bezirk",
            summary: "Explizit verbundene kommunale Quelle für die regionale Startlage.",
            url: "https://reinickendorf.example/aktuelles/schulwege",
            detectedTopics: ["Schule", "Verkehr"],
          },
        ],
        createdAt: "2026-05-17T00:00:00.000Z",
        updatedAt: "2026-05-17T00:00:00.000Z",
        createdBy: "admin-1",
        updatedBy: "admin-1",
        reviewRequired: true,
        noLiveCrawlerClaim: true,
        noScraping: true,
        noDeepSearchAutoCosts: true,
      },
    ],
    listRegionSourceTestResults: async () => [
      {
        id: "source-result-1",
        connectionId: "source-1",
        regionId: "bezirk-berlin-reinickendorf",
        connectionLabel: "Bezirksamt Reinickendorf News",
        sourceType: "municipal_news",
        adapterId: "productive_regional_source",
        resultMode: "dry_run",
        title: "Bezirksamt Reinickendorf News · Dry Run",
        summary: "Explizite URL vorbereitet und reviewpflichtig ausgewertet.",
        configuredUrl: "https://reinickendorf.example/aktuelles",
        detectedTopics: ["Schule", "Verkehr"],
        visibilityState: "internal_review",
        visibilityLabel: "reviewpflichtig",
        reviewStatus: "needs_review",
        confidence: 0.68,
        sourceSnapshotStatus: "fetched",
        sourceSnapshotTitle: "Schulsanierung in Reinickendorf",
        sourceSnapshotSummary: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit und Sanierungsbedarf.",
        sourceSnapshotExcerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
        possibleClaims: [
          {
            text: "Schulsanierung in Reinickendorf",
            confidence: 0.74,
            basisLabel: "Titel",
            excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
            reviewRequired: true,
          },
        ],
        topicClusters: [
          {
            clusterKey: "schule-reinickendorf",
            label: "Schule Reinickendorf",
            signalSeedIds: ["region-source-feed-signal-source-1-1"],
            openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            confidence: 0.68,
            suggestedAction: "ask_clarifying_question",
            reviewStatus: "needs_review",
          },
        ],
        dossierSuggestions: [
          {
            title: "Berlin Reinickendorf: Schule",
            signalSeedIds: ["region-source-feed-signal-source-1-1"],
            openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            confidence: 0.68,
            reviewStatus: "needs_review",
          },
        ],
        anlassraumSuggestions: [
          {
            title: "Schule Berlin Reinickendorf",
            signalSeedIds: ["region-source-feed-signal-source-1-1"],
            openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            confidence: 0.68,
            reviewStatus: "needs_review",
          },
        ],
        evidenceReferences: [
          {
            label: "Seitenauszug · Schulsanierung in Reinickendorf",
            url: "https://reinickendorf.example/aktuelles",
            excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
          },
        ],
        openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
        affectedScope: {
          regionName: "Berlin Reinickendorf",
          detectedPlaces: ["Berlin Reinickendorf"],
          ortsteilHints: [],
          fachbereichHints: ["Schule/Bildung", "Schule", "Verkehr"],
        },
        reviewSuggestions: [
          {
            id: "region-intelligence-dossier-schule-reinickendorf",
            suggestionType: "dossier_suggestion",
            title: "Berlin Reinickendorf: Schule",
            summary: "1 Signal spricht für einen reviewpflichtigen Dossier-Vorschlag.",
            signalSeedIds: ["region-source-feed-signal-source-1-1"],
            confidence: 0.68,
            reviewStatus: "needs_review",
            visibilityState: "internal_review",
            sourceCategories: ["productive"],
            sourceLabels: ["Bezirksamt Reinickendorf News"],
            sourceStatusLabel: "1 produktive Quelle verbunden",
          },
        ],
        reviewTaskSummary: {
          claimCount: 1,
          topicClusterCount: 1,
          dossierSuggestionCount: 1,
          anlassraumSuggestionCount: 1,
          openQuestionCount: 1,
          evidenceCount: 1,
          label: "1 mögliche Aussagen · 1 Themencluster · 1 Dossier-Vorschläge · 1 Anlassraum-Vorschläge · 1 offene Fragen",
        },
        createdAt: "2026-05-17T00:00:00.000Z",
        updatedAt: "2026-05-17T00:00:00.000Z",
        testedBy: "admin-1",
        reviewRequired: true,
        noAutoPublish: true,
        noPublicOfficial: true,
      },
    ],
  };
});

import AdminRegionsPage from "@/app/admin/regions/page";

describe("admin-regions-page.render", () => {
  it("separates productive regions from pilot fixtures and routes into the detail workspace", async () => {
    const html = renderToStaticMarkup(await AdminRegionsPage());

    expect(html).toContain('data-testid="admin-regions-page"');
    expect(html).toContain('data-testid="admin-regions-summary"');
    expect(html).toContain('data-testid="admin-regions-productive"');
    expect(html).toContain('data-testid="admin-regions-pilot-fixtures"');
    expect(html).toContain('data-testid="admin-regions-registry-missing-state"');
    expect(html).toContain('data-testid="admin-regions-intelligence-sources"');
    expect(html).toContain("`/admin/regions` ist die produktive Übersicht.");
    expect(html).toContain("Operative Regionen aus der RegionRegistry");
    expect(html).toContain("Getrennt markierte manuelle und Pilotregionen");
    expect(html).toContain("Konfigurierbare regionale Quellen, ohne Render-Abhängigkeit");
    expect(html).toContain("1 produktive Quelle verbunden");
    expect(html).toContain("Kuratierte Startlage");
    expect(html).toContain("Manuelle Hinweise / Review-Queue");
    expect(html).toContain("Konfigurierte Quellen");
    expect(html).toContain("Reviewpflichtige Source Results");
    expect(html).toContain("Bezirksamt Reinickendorf News");
    expect(html).toContain("Review-Queue öffnen");
    expect(html).toContain("Zur Review-Aufgabe");
    expect(html).toContain("1 mögliche Aussagen");
    expect(html).toContain("Amtliches Gemeindeverzeichnis ist nicht verbunden.");
    expect(html).toContain("Noch keine RegionRegistry-Einträge gefunden.");
    expect(html).toContain("Berlin Reinickendorf");
    expect(html).toContain("Manuell/Pilot");
    expect(html).toContain("Arbeitsansicht öffnen");
    expect(html).toContain("/admin/region?regionId=berlin-reinickendorf");
    expect(html).toContain("Verwaltungsanschriften bleiben getrennt vom RegionRegistry-Import.");
    expect(html).toContain("Keine GeoReference, kein Live-Crawler, kein Payment und keine Publishing-Logik");
  });
});
