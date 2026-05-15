import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@features/region", async () => {
  const actual = await vi.importActual<object>("@features/region");
  return {
    ...actual,
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
    expect(html).toContain("`/admin/regions` ist die produktive Übersicht.");
    expect(html).toContain("Operative Regionen aus dem offiziellen Verzeichnis");
    expect(html).toContain("Getrennt markierte Test- und Pilotregionen");
    expect(html).toContain("Flensburg");
    expect(html).toContain("offizielles Verzeichnis");
    expect(html).toContain("Berlin Reinickendorf");
    expect(html).toContain("Pilot-/Fixture-Pfad");
    expect(html).toContain("Arbeitsansicht öffnen");
    expect(html).toContain("/admin/region?regionId=flensburg");
    expect(html).toContain("/admin/region?regionId=berlin-reinickendorf");
    expect(html).toContain("Keine GeoReference, kein Live-Crawler, kein Payment und keine Publishing-Logik");
  });
});
