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
