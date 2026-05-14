import { describe, expect, it } from "vitest";
import {
  buildOfficialRegionalActorsFromDirectory,
  buildOfficialRegionsFromDirectory,
  listOfficialMunicipalDirectoryEntries,
  summarizeOfficialAdministrativeDirectory,
} from "@features/region";

describe("regional official directory contract", () => {
  it("covers the essential municipal and administrative layers from the official directory", () => {
    const entries = listOfficialMunicipalDirectoryEntries();
    const summary = summarizeOfficialAdministrativeDirectory();
    const summaryTypes = new Set(summary.map((entry) => entry.administrativeUnitType));

    expect(entries.length).toBeGreaterThan(13000);
    expect(summaryTypes.has("kreisfreie_stadt")).toBe(true);
    expect(summaryTypes.has("landkreis")).toBe(true);
    expect(summaryTypes.has("amt")).toBe(true);
    expect(summaryTypes.has("kreisangehoerige_gemeinde")).toBe(true);
    expect(summaryTypes.has("verbandsgemeinde")).toBe(true);
  });

  it("maps official rows into verortbare regions and administrative actors", () => {
    const regions = buildOfficialRegionsFromDirectory();
    const actors = buildOfficialRegionalActorsFromDirectory();

    const flensburgRegion = regions.find((region) => region.officialDirectoryEntry?.ags === "01001000");
    const amtRegion = regions.find((region) => region.officialDirectoryEntry?.ars === "010515163");
    const flensburgActor = actors.find((actor) => actor.officialDirectoryEntry?.ags === "01001000");

    expect(flensburgRegion).toMatchObject({
      type: "kommune",
      administrativeUnitType: "kreisfreie_stadt",
      publicVisibility: "public",
    });
    expect(amtRegion).toMatchObject({
      type: "region",
      administrativeUnitType: "amt",
    });
    expect(flensburgActor).toMatchObject({
      actorType: "verwaltung",
      sourceKind: "official_directory",
      verificationStatus: "verified",
    });
  });
});
