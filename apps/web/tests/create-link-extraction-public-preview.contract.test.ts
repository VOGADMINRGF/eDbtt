import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CreateRathausDemoSourcePreview from "@/features/create/CreateRathausDemoSourcePreview";
import { getRathausDemoGraphSeedPreview } from "@features/region/rathausDemoSeed";

describe("create link extraction public preview contract", () => {
  it("limits the public preview to three safe topic clusters and shows the region warning", () => {
    const preview = getRathausDemoGraphSeedPreview({
      urls: [
        "https://www.berlin.de/ba-reinickendorf/service/buergerbeteiligung/investitions-haushaltsplanung/",
      ],
      roles: ["citizen"],
    });

    expect(preview).not.toBeNull();
    expect(preview?.access.accessMode).toBe("public_preview");
    expect(preview?.publicPreviewClusters).toHaveLength(3);
    expect(preview?.counts.dossiers).toBeGreaterThanOrEqual(2);
    expect(preview?.counts.anlassraeume).toBeGreaterThanOrEqual(15);
    expect(preview?.counts.claims).toBeGreaterThanOrEqual(45);

    const html = renderToStaticMarkup(
      CreateRathausDemoSourcePreview({ preview: preview! }),
    );

    expect(html).toContain("Öffentliche Vorschau");
    expect(html).toContain("Dieser Link betrifft Reinickendorf");
    expect(html).toContain("Rathaus, Haushalt und Zugang");
    expect(html).toContain("Kultur-, Sport- und Jugendorte");
    expect(html).toContain("Verkehr, Schulbau und Priorisierung");
    expect(html).not.toContain("Vollständige Seed-Kandidaten");
    expect(html).not.toContain("Arbeitsstand öffnen");
  });
});
