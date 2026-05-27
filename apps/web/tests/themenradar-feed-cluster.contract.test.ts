import { beforeEach, describe, expect, it } from "vitest";
import {
  loadAutonomousModule,
  resetAutonomousFixtures,
  setAutonomousFixtures,
} from "./themenradar-autonomous-test-helpers";

describe("themenradar feed cluster contract", () => {
  beforeEach(() => {
    resetAutonomousFixtures();
  });

  it("keeps duplicate consolidation as a review suggestion instead of auto-merging or auto-publishing", async () => {
    setAutonomousFixtures({
      voteDrafts: [
        {
          _id: "draft-1",
          title: "Parkplätze werden zu Hitzeinseln",
          claims: [{ title: "Asphaltflächen verschärfen Hitze", topic: "Hitzeinseln" }],
          summary: "Neue Quelle zur Sommerhitze?",
          status: "review",
          feedReviewState: "ready",
          createdAt: "2026-05-26T09:00:00.000Z",
          publishedAt: "2026-05-26T09:30:00.000Z",
          regionCode: "DE-BE",
        },
      ],
      clusterCandidates: [
        {
          _id: "cluster-1",
          clusterKey: "cluster-hitze",
          topicKey: "hitzeinseln",
          draftCount: 3,
          sampleTitles: ["Parkplätze werden zu Hitzeinseln", "Mehr Schatten gegen Sommerhitze"],
          anlassraumIds: ["anlass-22"],
          regionCode: "DE-BE",
          createdAt: "2026-05-26T08:00:00.000Z",
          updatedAt: "2026-05-26T10:00:00.000Z",
        },
      ],
    });

    const { buildAutonomousThemenradarReadModel } = await loadAutonomousModule();
    const readModel = await buildAutonomousThemenradarReadModel();
    const duplicateCluster = readModel.items.find((item) => item.sourceTypes.includes("cluster"));

    expect(duplicateCluster).toBeDefined();
    expect(duplicateCluster?.duplicateSuggestionCount).toBeGreaterThan(0);
    expect(duplicateCluster?.reviewState).toBe("review_candidate");
    expect(duplicateCluster?.nextSuggestedAction.key).toBe("compare_duplicates");
    expect(duplicateCluster?.autoPublishAllowed).toBe(false);
  });
});
