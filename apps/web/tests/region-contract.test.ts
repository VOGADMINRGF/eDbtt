import { describe, expect, it } from "vitest";
import {
  getRegionById,
  listRegions,
  normalizeRegionPublicVisibility,
  normalizeRegionType,
  parseRegion,
  REGION_TYPES,
  supportsRegionTenantIsolationRequirement,
} from "@features/region";

describe("region contract", () => {
  it("covers required region types and keeps region scope explicit", () => {
    expect(REGION_TYPES).toEqual(["bezirk", "kommune", "land", "landkreis", "quartier", "region"]);

    const fixtures = listRegions();
    expect(fixtures.length).toBeGreaterThanOrEqual(3);
    expect(fixtures.some((entry) => entry.id === "bezirk-berlin-reinickendorf")).toBe(true);
    expect(fixtures.some((entry) => entry.type === "kommune")).toBe(true);
    expect(fixtures.some((entry) => entry.type === "quartier")).toBe(true);
  });

  it("parses reinickendorf fixture with parent region and official body", () => {
    const reinickendorf = getRegionById("bezirk-berlin-reinickendorf");

    expect(reinickendorf).not.toBeNull();
    expect(reinickendorf?.slug).toBe("berlin-reinickendorf");
    expect(reinickendorf?.type).toBe("bezirk");
    expect(reinickendorf?.parentRegionId).toBe("region-berlin");
    expect(reinickendorf?.officialBody?.label).toBe("Bezirksamt Reinickendorf");
    expect(reinickendorf?.country).toBe("DE");
    expect(reinickendorf?.publicVisibility).toBe("public");
  });

  it("normalizes type and visibility safely", () => {
    expect(normalizeRegionType("KOMMUNE")).toBe("kommune");
    expect(normalizeRegionType("unknown")).toBe("region");

    expect(normalizeRegionPublicVisibility("PUBLIC")).toBe("public");
    expect(normalizeRegionPublicVisibility("not-valid")).toBe("restricted");
  });

  it("does not enforce tenant isolation", () => {
    expect(supportsRegionTenantIsolationRequirement()).toBe(false);
  });

  it("rejects malformed region payloads", () => {
    expect(() =>
      parseRegion({
        id: "region-invalid",
        slug: "invalid",
        name: "Invalid",
        type: "bezirk",
        parentRegionId: null,
        officialBody: null,
        federalState: null,
        country: "DE",
        publicVisibility: "public",
        tenantId: "should-not-exist",
      }),
    ).toThrow();
  });
});
