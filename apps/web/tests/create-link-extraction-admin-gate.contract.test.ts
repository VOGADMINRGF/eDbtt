import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CreateRathausDemoSourcePreview from "@/features/create/CreateRathausDemoSourcePreview";
import {
  canAccessRathausDemoRegionalSeed,
  getRathausDemoGraphSeedPreview,
} from "@features/region/rathausDemoSeed";

describe("create link extraction admin gate contract", () => {
  it("grants the full review-first seed only to admin or reinickendorf-scoped region roles", () => {
    expect(canAccessRathausDemoRegionalSeed(["citizen"])).toBe(false);
    expect(canAccessRathausDemoRegionalSeed(["admin"])).toBe(true);
    expect(
      canAccessRathausDemoRegionalSeed(["region_staff:bezirk-berlin-reinickendorf"]),
    ).toBe(true);

    const preview = getRathausDemoGraphSeedPreview({
      urls: [
        "https://www.berlin.de/ba-reinickendorf/aktuelles/pressemitteilungen/2025/pressemitteilung.1549089.php",
      ],
      roles: ["region_staff:bezirk-berlin-reinickendorf"],
    });

    expect(preview).not.toBeNull();
    expect(preview?.access.accessMode).toBe("region_admin");
    expect(preview?.access.warning).toBeNull();
    expect(preview?.counts.dossiers).toBeGreaterThanOrEqual(2);
    expect(preview?.counts.anlassraeume).toBeGreaterThanOrEqual(15);
    expect(preview?.counts.claims).toBeGreaterThanOrEqual(45);

    const html = renderToStaticMarkup(
      CreateRathausDemoSourcePreview({ preview: preview! }),
    );

    expect(html).toContain("Vollständige Seed-Kandidaten");
    expect(html).toContain("Region-Cockpit öffnen");
    expect(html).toContain("Review-Queue öffnen");
    expect(html).toContain("Rathaus Reinickendorf");
    expect(html).toContain("Schulbauoffensive Reinickendorf");
    expect(html).toContain("Claims / Fragen / Optionen");
  });
});
