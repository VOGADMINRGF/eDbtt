import { describe, expect, it } from "vitest";
import { recommendInstitutionalConfiguration } from "@features/pricing";

describe("institutional-package-recommendation.contract", () => {
  it("recommends activation package for low-complexity setup", () => {
    const recommendation = recommendInstitutionalConfiguration({
      segmentId: "organisationen",
      goalId: "beteiligung_starten",
      frameId: "pilot",
      locale: "de",
    });

    expect(recommendation.recommendedPackageId).toBe("b2b_basis");
    expect(recommendation.alternativePackageId).toBe("b2b_pro");
  });

  it("recommends operations-plus package for higher complexity municipal setup", () => {
    const recommendation = recommendInstitutionalConfiguration({
      segmentId: "kommunen",
      goalId: "auswertung_reports",
      frameId: "laufender_betrieb",
      locale: "de",
    });

    expect(recommendation.recommendedPackageId).toBe("b2g_pro");
    expect(recommendation.alternativePackageId).toBe("b2g_basis");
  });
});

