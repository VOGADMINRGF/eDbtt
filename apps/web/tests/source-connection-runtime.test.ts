import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryRegionSourceConnectionRuntimeRepo,
  getRegionById,
  runRegionSourceConnectionDryRun,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region";

describe("source connection runtime", () => {
  beforeEach(() => {
    setRegionSourceConnectionRuntimeRepoForTests(createInMemoryRegionSourceConnectionRuntimeRepo());
  });

  it("derives ortsteil hints generically from the active region instead of a Reinickendorf special case", async () => {
    const region = getRegionById("kommune-beispielstadt");
    if (!region) throw new Error("missing_region_fixture");

    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        connections: [
          {
            id: "source-generic-1",
            regionId: "kommune-beispielstadt",
            label: "Stadtportal Beispielstadt",
            sourceType: "municipal_news",
            adapterId: "productive_regional_source",
            url: null,
            notes: "Kuratiertes Beispiel ohne Reinickendorf-Sonderlogik.",
            enabled: true,
            sampleItems: [
              {
                title: "Jugendhaus in Nordpark wird erweitert",
                summary:
                  "Das Team trifft sich in Beispielstadt und im Nordpark, um den Ausbau des Jugendhauses zu besprechen.",
                url: null,
                detectedTopics: ["Jugend", "Kultur"],
              },
            ],
            sourceSnapshotTemplate: null,
            createdAt: "2026-05-20T09:00:00.000Z",
            updatedAt: "2026-05-20T09:00:00.000Z",
            createdBy: "admin-1",
            updatedBy: "admin-1",
            reviewRequired: true,
            noLiveCrawlerClaim: true,
            noScraping: true,
            noDeepSearchAutoCosts: true,
            organizationId: null,
          },
        ],
      }),
    );

    const result = await runRegionSourceConnectionDryRun({
      connectionId: "source-generic-1",
      testedBy: "admin-1",
      region,
      actorRole: "admin",
      organizationIds: [],
    });

    expect(result.affectedScope.regionName).toBe("Beispielstadt");
    expect(result.affectedScope.ortsteilHints).toContain("Nordpark");
    expect(result.affectedScope.ortsteilHints).not.toContain("Beispielstadt");
    expect(result.noPublicOfficial).toBe(true);
  });
});
