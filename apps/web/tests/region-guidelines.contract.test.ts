import { describe, expect, it } from "vitest";
import {
  getRegionGuidelineMatrixByProfile,
  listRegionGuidelineMatrices,
  resolveGuidelineProfileForRegion,
} from "@features/region";

describe("region guidelines contract", () => {
  it("defines the Berlin participation matrix as a working matrix instead of legal advice", () => {
    const matrix = getRegionGuidelineMatrixByProfile("berlin_participation_guidelines");

    expect(matrix).not.toBeNull();
    expect(matrix?.legalAdvice).toBe(false);
    expect(matrix?.reviewRequired).toBe(true);
    expect(matrix?.criteria.map((entry) => entry.key)).toEqual([
      "fruehzeitigkeit",
      "transparenz",
      "rueckmeldung",
      "zielgruppenansprache",
      "barrierefreiheit",
      "dokumentation",
      "nachvollziehbarkeit",
    ]);
  });

  it("resolves the Berlin guideline profile for Berlin districts and quarters", () => {
    const profile = resolveGuidelineProfileForRegion({
      region: {
        id: "bezirk-berlin-reinickendorf",
        slug: "berlin-reinickendorf",
        name: "Berlin Reinickendorf",
        type: "bezirk",
        administrativeUnitType: "stadtstaat",
        parentRegionId: "land-berlin",
        officialBody: null,
        officialDirectoryEntry: null,
        federalState: "Berlin",
        country: "DE",
        publicVisibility: "restricted",
      },
      activeAnlassraeume: [],
    });

    expect(profile).toBe("berlin_participation_guidelines");
  });

  it("keeps non-Berlin regions without implicit guidelines profile", () => {
    const profile = resolveGuidelineProfileForRegion({
      region: {
        id: "kommune-magdeburg",
        slug: "magdeburg",
        name: "Magdeburg",
        type: "kommune",
        administrativeUnitType: "kreisfreie_stadt",
        parentRegionId: null,
        officialBody: null,
        officialDirectoryEntry: null,
        federalState: "Sachsen-Anhalt",
        country: "DE",
        publicVisibility: "restricted",
      },
      activeAnlassraeume: [],
    });

    expect(profile).toBeNull();
    expect(listRegionGuidelineMatrices()).toHaveLength(1);
  });
});
