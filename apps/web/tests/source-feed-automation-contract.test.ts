import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSourceFeedAutomationModule,
  resetSourceFeedAutomationFixtures,
  setSourceFeedAutomationFixtures,
} from "./source-feed-automation-test-helpers";

describe("source feed automation contract", () => {
  beforeEach(() => {
    resetSourceFeedAutomationFixtures();
  });

  it("tracks guarded feed automation fields for cron-ready sources", async () => {
    setSourceFeedAutomationFixtures({
      feedConfigs: {
        de: {
          feeds: [
            {
              feedUrl: "https://example.org/rss.xml",
              regionCode: "DE-BE",
              topicHint: "schule",
            },
          ],
        },
      },
    });

    const mod = await loadSourceFeedAutomationModule();
    const sourceId = mod.buildFeedSourceAutomationId({
      feedUrl: "https://example.org/rss.xml",
      regionId: "DE-BE",
    });
    await mod.recordFeedSourceAutomationEvent({
      sourceId,
      regionId: "DE-BE",
      sourceType: "rss_feed",
      sourceLabel: "example.org",
      sourceHref: "https://example.org/rss.xml",
      automationMode: "cron_ready",
      runStatus: "success",
      completedAt: new Date("2026-05-27T09:00:00.000Z"),
      fetchedItems: 12,
      insertedSignals: 3,
      reviewCandidateCount: 3,
    });

    const readModel = await mod.buildFeedSourceAutomationReadModel();
    const item = readModel.items[0];

    expect(item).toMatchObject({
      sourceId,
      regionId: "DE-BE",
      sourceType: "rss_feed",
      healthStatus: "healthy",
      automationMode: "cron_ready",
      signalCount: 3,
      reviewCandidateCount: 3,
      reviewRequired: true,
      noAutoPublish: true,
      noDeepSearchAuto: true,
    });
    expect(item.lastPullAt).toBe("2026-05-27T09:00:00.000Z");
    expect(item.nextSuggestedPullAt).toBeTruthy();
  });
});
