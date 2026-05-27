import { beforeEach, describe, expect, it } from "vitest";
import {
  loadAutonomousModule,
  resetAutonomousFixtures,
  setAutonomousFixtures,
} from "./themenradar-autonomous-test-helpers";

describe("themenradar swipes supply contract", () => {
  beforeEach(() => {
    resetAutonomousFixtures();
  });

  it("shows when a cluster is already visible in swipes and keeps links review-first", async () => {
    setAutonomousFixtures({
      voteDrafts: [
        {
          _id: "draft-visible",
          title: "Bessere Radwege im Kiez",
          claims: [{ title: "Radwege sicherer machen", topic: "Radwege" }],
          status: "published",
          feedReviewState: "ready",
          createdAt: "2026-05-26T09:00:00.000Z",
          publishedAt: "2026-05-26T09:30:00.000Z",
          regionCode: "DE-BE",
        },
      ],
      swipeItems: [
        {
          id: "draft-visible",
          title: "Bessere Radwege im Kiez",
          category: "Mobilität",
          level: "Kommune",
          topicTags: ["Radwege"],
          evidenceCount: 2,
          responsibilityLabel: "Bezirk",
          domainLabel: "Verkehr",
          hasEventualities: false,
          eventualitiesCount: 0,
          sourceType: "feed",
          sourceDraftId: "draft-visible",
          supplyBuckets: ["from_feed", "regional"],
        },
      ],
    });

    const { buildAutonomousThemenradarReadModel } = await loadAutonomousModule();
    const readModel = await buildAutonomousThemenradarReadModel();
    const cluster = readModel.items[0];

    expect(cluster.visibleInSwipes).toBe(true);
    expect(cluster.nextSuggestedAction.key).not.toBe("attach_swipes");
    expect(cluster.reviewRequired).toBe(true);
    expect(cluster.autoPublishAllowed).toBe(false);
  });
});
