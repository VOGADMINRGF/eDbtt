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
            sourceType: "manual_snapshot",
            status: "active_review_required",
            scope: "operator_review",
            adapterId: "manual_review_queue",
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
            latestTestResult: null,
            latestSnapshotId: null,
            latestSnapshotAt: null,
            entitlementRequiredScope: "source_connection",
            operatorReviewRequired: true,
            productionTruth: false,
            auditEvents: [],
            createdAt: "2026-05-20T09:00:00.000Z",
            updatedAt: "2026-05-20T09:00:00.000Z",
            createdBy: "admin-1",
            updatedBy: "admin-1",
            reviewRequired: true,
            noLiveCrawlerClaim: true,
            noScraping: true,
            noDeepSearchAutoCosts: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noAutoModerationRights: true,
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
    expect(result.testResult?.noAutoResearch).toBe(true);
    expect(result.reviewState).toBe("unreviewed");
  });

  it("blocks new snapshots for paused connections", async () => {
    const region = getRegionById("kommune-beispielstadt");
    if (!region) throw new Error("missing_region_fixture");

    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        connections: [
          {
            id: "source-paused-1",
            regionId: "kommune-beispielstadt",
            label: "Pausierte Quelle",
            sourceType: "website_url",
            status: "paused",
            scope: "organization_region",
            adapterId: "productive_regional_source",
            url: "https://beispielstadt.example/amt",
            notes: null,
            enabled: false,
            sampleItems: [],
            sourceSnapshotTemplate: null,
            latestTestResult: null,
            latestSnapshotId: null,
            latestSnapshotAt: null,
            entitlementRequiredScope: "source_connection",
            operatorReviewRequired: true,
            productionTruth: false,
            auditEvents: [],
            createdAt: "2026-05-20T09:00:00.000Z",
            updatedAt: "2026-05-20T09:00:00.000Z",
            createdBy: "admin-1",
            updatedBy: "admin-1",
            reviewRequired: true,
            noLiveCrawlerClaim: true,
            noScraping: true,
            noDeepSearchAutoCosts: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noAutoModerationRights: true,
            organizationId: "org-1",
          },
        ],
      }),
    );

    await expect(
      runRegionSourceConnectionDryRun({
        connectionId: "source-paused-1",
        testedBy: "staff-1",
        region,
        actorRole: "organization_member",
        organizationIds: ["org-1"],
      }),
    ).rejects.toThrow("source_connection_status_blocks_testing");
  });
});
