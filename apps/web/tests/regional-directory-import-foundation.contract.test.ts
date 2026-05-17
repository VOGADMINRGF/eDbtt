import { describe, expect, it } from "vitest";
import {
  getDirectorySourceStatus,
  importOfficialDirectoryFromXlsx,
  importRegionRegistrySnapshot,
  listOfficialBodiesForRegion,
  listRegionsFromRegistry,
} from "@features/region";

describe("regional directory import foundation", () => {
  it("reads the official directory xlsx when present", () => {
    const imported = importOfficialDirectoryFromXlsx();

    expect(imported.status.status).toBe("ready");
    expect(imported.entries.length).toBeGreaterThan(13000);
    expect(imported.derivedActors.length).toBeGreaterThan(13000);
  });

  it("returns a missing state instead of throwing when the official xlsx file is absent", () => {
    const imported = importOfficialDirectoryFromXlsx({
      filePath: "/private/tmp/does-not-exist-official-directory.xlsx",
    });

    expect(imported.status.status).toBe("missing");
    expect(imported.status.message).toBe("Amtliche Verwaltungsanschriften sind nicht verbunden.");
    expect(imported.entries).toEqual([]);
    expect(imported.derivedActors).toEqual([]);
  });

  it("keeps the region registry separate from the official directory", () => {
    const registry = listRegionsFromRegistry();
    const official = importOfficialDirectoryFromXlsx();
    const sourceStatus = getDirectorySourceStatus();

    expect(sourceStatus.regionRegistry.status).toBe("missing");
    expect(sourceStatus.officialDirectory.status).toBe("ready");
    expect(registry).toEqual([]);
    expect(official.entries.length).toBeGreaterThan(0);
    expect(listOfficialBodiesForRegion("bezirk-berlin-reinickendorf")).toEqual([]);
  });

  it("imports explicit region registry snapshots without treating them as official directory data", () => {
    const imported = importRegionRegistrySnapshot({
      snapshot: {
        sourceFile: "region-registry-test.json",
        sourceAsOf: "2026-05-16",
        items: [
          {
            id: "kommune-teststadt",
            slug: "teststadt",
            name: "Teststadt",
            type: "kommune",
            parentRegionId: null,
            officialBody: null,
            federalState: "Testland",
            country: "DE",
            publicVisibility: "public",
          },
        ],
      },
    });

    expect(imported.status.status).toBe("ready");
    expect(imported.regions).toMatchObject([
      {
        id: "kommune-teststadt",
        slug: "teststadt",
      },
    ]);
    expect(imported.regions[0]?.officialDirectoryEntry ?? null).toBeNull();
  });
});
