import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSourceFeedAutomationModule,
  resetSourceFeedAutomationFixtures,
  setSourceFeedAutomationFixtures,
} from "./source-feed-automation-test-helpers";

describe("source feed backoff contract", () => {
  beforeEach(() => {
    resetSourceFeedAutomationFixtures();
  });

  it("applies visible backoff instead of endless retries after repeated failures", async () => {
    setSourceFeedAutomationFixtures({
      feedConfigs: {
        de: {
          feeds: [{ feedUrl: "https://broken.example/rss", regionCode: "DE-BE" }],
        },
      },
    });

    const mod = await loadSourceFeedAutomationModule();
    const sourceId = mod.buildFeedSourceAutomationId({
      feedUrl: "https://broken.example/rss",
      regionId: "DE-BE",
    });
    const firstFailureAt = new Date();
    const secondFailureAt = new Date(firstFailureAt.getTime() + 5 * 60 * 1000);
    await mod.recordFeedSourceAutomationEvent({
      sourceId,
      regionId: "DE-BE",
      sourceType: "rss_feed",
      sourceLabel: "broken.example",
      sourceHref: "https://broken.example/rss",
      automationMode: "cron_ready",
      runStatus: "error",
      completedAt: firstFailureAt,
      error: "feed_timeout 12000",
    });
    await mod.recordFeedSourceAutomationEvent({
      sourceId,
      regionId: "DE-BE",
      sourceType: "rss_feed",
      sourceLabel: "broken.example",
      sourceHref: "https://broken.example/rss",
      automationMode: "cron_ready",
      runStatus: "error",
      completedAt: secondFailureAt,
      error: "feed_timeout 12000",
    });

    const readModel = await mod.buildFeedSourceAutomationReadModel();
    const item = readModel.items[0];

    expect(item.healthStatus).toBe("backoff");
    expect(item.errorCount).toBe(2);
    expect(item.backoffUntil).toBeTruthy();
    expect(item.nextAction.label).toBe("Quelle prüfen");
  });
});
