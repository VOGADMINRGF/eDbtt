import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildOperationalRegionCatalog,
  buildOfficialRegionalActorsFromDirectory,
  buildOfficialRegionsFromDirectory,
  getDirectorySourceStatus,
  getOperationalRegionCatalog,
  importOfficialDirectoryFromXlsx,
  listOfficialMunicipalDirectoryEntries,
  resolveOperationalRegion,
  summarizeOfficialAdministrativeDirectory,
  type Region,
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

  it("builds the complete operational catalog with deterministic unique slugs", () => {
    const officialRegions = buildOfficialRegionsFromDirectory();
    const catalog = getOperationalRegionCatalog();

    expect(officialRegions).toHaveLength(12401);
    expect(new Set(officialRegions.map((region) => region.slug)).size).toBe(
      officialRegions.length,
    );
    expect(catalog.regions.length).toBeGreaterThan(12000);
    expect(catalog.regions).not.toHaveLength(7);
    expect(new Set(catalog.regions.map((region) => region.slug)).size).toBe(
      catalog.regions.length,
    );
    expect(catalog.sources.officialDirectory).toMatchObject({
      status: "ready",
      recordCount: 13339,
      errorCode: null,
    });
  });

  it("resolves Hamburg through every supported stable identifier", () => {
    const { regions } = getOperationalRegionCatalog();
    const officialHamburgId = "region-official-02000000";

    expect(resolveOperationalRegion(regions, "Hamburg")).toMatchObject({
      id: "region-land-02",
      name: "Hamburg",
      type: "land",
    });
    for (const query of [
      "02000000",
      "020000000000",
      officialHamburgId,
      "hamburg-freie-und-hansestadt-02000000",
      "Senat der Freien und Hansestadt Hamburg",
    ]) {
      expect(resolveOperationalRegion(regions, query)).toMatchObject({
        id: officialHamburgId,
        officialDirectoryEntry: {
          ags: "02000000",
          ars: "020000000000",
        },
      });
    }
  });

  it("keeps ambiguous names separate instead of resolving them heuristically", () => {
    const sourceStatus = getDirectorySourceStatus();
    const fixtureTemplate = getOperationalRegionCatalog().regions.find(
      (region) => region.id === "kommune-beispielstadt",
    );
    expect(fixtureTemplate).toBeTruthy();

    const sameNameRegions = [
      {
        ...fixtureTemplate!,
        id: "same-name-a",
        slug: "neustadt",
        name: "Neustadt",
      },
      {
        ...fixtureTemplate!,
        id: "same-name-b",
        slug: "neustadt",
        name: "Neustadt",
      },
    ] satisfies Region[];
    const catalog = buildOperationalRegionCatalog({
      registryRegions: [],
      directoryRegions: [],
      fixtureRegions: sameNameRegions,
      regionRegistryStatus: sourceStatus.regionRegistry,
      officialDirectoryStatus: sourceStatus.officialDirectory,
    });

    expect(catalog.regions).toHaveLength(2);
    expect(new Set(catalog.regions.map((region) => region.slug)).size).toBe(2);
    expect(resolveOperationalRegion(catalog.regions, "Neustadt")).toBeNull();
    expect(resolveOperationalRegion(catalog.regions, "same-name-a")?.id).toBe(
      "same-name-a",
    );
  });

  it("applies Registry before Directory before Fixture for stable identities", () => {
    const sourceStatus = getDirectorySourceStatus();
    const directoryHamburg = getOperationalRegionCatalog().regions.find(
      (region) => region.id === "region-official-02000000",
    );
    expect(directoryHamburg).toBeTruthy();

    const registryRegion = {
      ...directoryHamburg!,
      id: "registry-hamburg",
      slug: "registry-hamburg",
      name: "Hamburg aus Registry",
    } satisfies Region;
    const directoryRegion = {
      ...directoryHamburg!,
      id: "directory-hamburg",
      slug: "directory-hamburg",
      name: "Hamburg aus Directory",
    } satisfies Region;
    const fixtureRegion = {
      ...directoryHamburg!,
      id: "fixture-hamburg",
      slug: "fixture-hamburg",
      name: "Hamburg aus Fixture",
    } satisfies Region;
    const catalog = buildOperationalRegionCatalog({
      registryRegions: [registryRegion],
      directoryRegions: [directoryRegion],
      fixtureRegions: [fixtureRegion],
      regionRegistryStatus: sourceStatus.regionRegistry,
      officialDirectoryStatus: sourceStatus.officialDirectory,
    });

    expect(catalog.regions).toHaveLength(1);
    expect(catalog.regions[0]).toMatchObject({
      id: "registry-hamburg",
      name: "Hamburg aus Registry",
    });

    const transitiveIdentityCatalog = buildOperationalRegionCatalog({
      registryRegions: [
        {
          ...registryRegion,
          id: "shared-hamburg-id",
          officialDirectoryEntry: null,
        },
      ],
      directoryRegions: [
        {
          ...directoryRegion,
          id: "shared-hamburg-id",
        },
      ],
      fixtureRegions: [fixtureRegion],
      regionRegistryStatus: sourceStatus.regionRegistry,
      officialDirectoryStatus: sourceStatus.officialDirectory,
    });
    expect(transitiveIdentityCatalog.regions).toHaveLength(1);
    expect(transitiveIdentityCatalog.regions[0]?.id).toBe("shared-hamburg-id");

    const withoutRegistry = buildOperationalRegionCatalog({
      registryRegions: [],
      directoryRegions: [directoryRegion],
      fixtureRegions: [fixtureRegion],
      regionRegistryStatus: sourceStatus.regionRegistry,
      officialDirectoryStatus: sourceStatus.officialDirectory,
    });
    expect(withoutRegistry.regions).toHaveLength(1);
    expect(withoutRegistry.regions[0]?.id).toBe("directory-hamburg");

    const fixtureOnly = buildOperationalRegionCatalog({
      registryRegions: [],
      directoryRegions: [],
      fixtureRegions: [fixtureRegion],
      regionRegistryStatus: sourceStatus.regionRegistry,
      officialDirectoryStatus: sourceStatus.officialDirectory,
    });
    expect(fixtureOnly.regions).toHaveLength(1);
    expect(fixtureOnly.regions[0]?.id).toBe("fixture-hamburg");
  });

  it("keeps Registry and fixtures available while reporting missing or failed XLSX sources", () => {
    const sourceStatus = getDirectorySourceStatus();
    const fallbackRegion = getOperationalRegionCatalog().regions.find(
      (region) => region.id === "kommune-beispielstadt",
    );
    expect(fallbackRegion).toBeTruthy();

    const missing = importOfficialDirectoryFromXlsx({
      filePath: path.resolve(process.cwd(), "does-not-exist.xlsx"),
    });
    const failed = importOfficialDirectoryFromXlsx({
      filePath: path.resolve(process.cwd(), "package.json"),
    });
    const fallbackCatalog = buildOperationalRegionCatalog({
      registryRegions: [fallbackRegion!],
      directoryRegions: missing.derivedRegions,
      fixtureRegions: [
        {
          ...fallbackRegion!,
          id: "fixture-fallback",
          slug: "fixture-fallback",
        },
      ],
      regionRegistryStatus: sourceStatus.regionRegistry,
      officialDirectoryStatus: missing.status,
    });

    expect(missing.status).toMatchObject({
      status: "missing",
      recordCount: 0,
      errorCode: "official_directory_not_found",
    });
    expect(failed.status.status).toBe("error");
    expect(failed.status.errorCode).toContain("official_directory_sheet_missing");
    expect(fallbackCatalog.regions).toHaveLength(2);
    expect(fallbackCatalog.sources.officialDirectory.status).toBe("missing");
  });
});
