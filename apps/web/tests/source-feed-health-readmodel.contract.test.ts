import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSourceFeedAutomationModule,
  resetSourceFeedAutomationFixtures,
  setSourceFeedAutomationFixtures,
} from "./source-feed-automation-test-helpers";

describe("source feed health readmodel", () => {
  beforeEach(() => {
    resetSourceFeedAutomationFixtures();
  });

  it("surfaces healthy, noisy, failing and quiet sources with next action", async () => {
    setSourceFeedAutomationFixtures({
      feedConfigs: {
        de: {
          feeds: [
            { feedUrl: "https://healthy.example/rss", regionCode: "DE-BE", topicHint: "schule" },
            { feedUrl: "https://noisy.example/rss", regionCode: "DE-BE", topicHint: "verkehr" },
          ],
        },
      },
      connections: [
        {
          id: "source-quiet",
          label: "Leises Rathaus",
          sourceType: "manual_snapshot",
          regionId: "DE-BE",
          organizationId: null,
          url: "https://quiet.example",
          enabled: true,
          status: "active_review_required",
          sampleItems: [],
          latestTestResult: { status: "passed", checkedAt: "2026-05-01T08:00:00.000Z" },
          latestSnapshotAt: "2026-05-01T08:00:00.000Z",
        },
        {
          id: "source-failing",
          label: "Fehlerhafte Quelle",
          sourceType: "document_url",
          regionId: "DE-BE",
          organizationId: null,
          url: "https://broken.example",
          enabled: true,
          status: "test_failed",
          sampleItems: [],
          latestTestResult: { status: "failed", checkedAt: "2026-05-27T07:00:00.000Z" },
          latestSnapshotAt: "2026-05-27T07:00:00.000Z",
        },
      ],
    });

    const mod = await loadSourceFeedAutomationModule();
    await mod.recordFeedSourceAutomationEvent({
      sourceId: mod.buildFeedSourceAutomationId({
        feedUrl: "https://healthy.example/rss",
        regionId: "DE-BE",
      }),
      regionId: "DE-BE",
      sourceType: "rss_feed",
      sourceLabel: "healthy.example",
      sourceHref: "https://healthy.example/rss",
      automationMode: "cron_ready",
      runStatus: "success",
      completedAt: new Date("2026-05-27T09:00:00.000Z"),
      fetchedItems: 8,
      insertedSignals: 4,
    });
    const noisySourceId = mod.buildFeedSourceAutomationId({
      feedUrl: "https://noisy.example/rss",
      regionId: "DE-BE",
    });
    await mod.recordFeedSourceAutomationEvent({
      sourceId: noisySourceId,
      regionId: "DE-BE",
      sourceType: "rss_feed",
      sourceLabel: "noisy.example",
      sourceHref: "https://noisy.example/rss",
      automationMode: "cron_ready",
      runStatus: "success",
      completedAt: new Date("2026-05-27T08:00:00.000Z"),
      fetchedItems: 11,
      insertedSignals: 0,
    });
    await mod.recordFeedSourceAutomationEvent({
      sourceId: noisySourceId,
      regionId: "DE-BE",
      sourceType: "rss_feed",
      sourceLabel: "noisy.example",
      sourceHref: "https://noisy.example/rss",
      automationMode: "cron_ready",
      runStatus: "success",
      completedAt: new Date("2026-05-27T09:00:00.000Z"),
      fetchedItems: 12,
      insertedSignals: 0,
    });

    const readModel = await mod.buildFeedSourceAutomationReadModel({ limit: 10 });

    expect(readModel.summary.healthySources).toBeGreaterThan(0);
    expect(readModel.summary.noisySources).toBeGreaterThan(0);
    expect(readModel.summary.failingSources).toBeGreaterThan(0);
    expect(readModel.summary.quietSources).toBeGreaterThan(0);
    expect(readModel.summary.nextAction.href).toBeTruthy();
  });
});
