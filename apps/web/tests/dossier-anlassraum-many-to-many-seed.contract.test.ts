import { describe, expect, it } from "vitest";
import { getRathausDemoGraphSeedPreview } from "@features/region/rathausDemoSeed";

describe("dossier anlassraum many-to-many seed contract", () => {
  it("keeps dossier and anlassraum links many-to-many capable", () => {
    const preview = getRathausDemoGraphSeedPreview({
      urls: [
        "https://www.berlin.de/ba-reinickendorf/service/buergerbeteiligung/investitions-haushaltsplanung/",
      ],
      roles: ["admin"],
    });
    if (!preview) throw new Error("missing_rathaus_demo_preview");

    const linkedToMultipleDossiers = preview.anlassraeume.filter(
      (anlassraum) => anlassraum.dossierIds.length > 1,
    );
    expect(linkedToMultipleDossiers.length).toBeGreaterThan(0);

    for (const dossier of preview.dossiers) {
      expect(dossier.anlassraumIds.length).toBeGreaterThan(1);
      for (const anlassraumId of dossier.anlassraumIds) {
        const anlassraum = preview.anlassraeume.find((entry) => entry.id === anlassraumId);
        expect(anlassraum).toBeDefined();
        expect(anlassraum?.dossierIds).toContain(dossier.id);
      }
    }
  });
});
