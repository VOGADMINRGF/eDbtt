import { describe, expect, it } from "vitest";
import { getRathausDemoGraphSeedPreview } from "@features/region/rathausDemoSeed";

describe("rathaus demo anlassraum claims contract", () => {
  it("gives every seeded anlassraum exactly one source statement, one understanding question and one decision option", () => {
    const preview = getRathausDemoGraphSeedPreview({
      urls: [
        "https://www.berlin.de/ba-reinickendorf/service/buergerbeteiligung/investitions-haushaltsplanung/",
      ],
      roles: ["admin"],
    });
    if (!preview) throw new Error("missing_rathaus_demo_preview");

    expect(preview.claims.length).toBeGreaterThanOrEqual(45);

    for (const anlassraum of preview.anlassraeume) {
      const claims = preview.claims.filter((claim) => claim.anlassraumId === anlassraum.id);
      expect(claims).toHaveLength(3);
      expect(claims.map((claim) => claim.kind).sort()).toEqual([
        "decision_option",
        "source_statement",
        "understanding_question",
      ]);
      expect(claims.every((claim) => claim.reviewStatus === "needs_review")).toBe(true);
      expect(claims.every((claim) => claim.visibilityState === "internal_review")).toBe(true);
    }
  });
});
