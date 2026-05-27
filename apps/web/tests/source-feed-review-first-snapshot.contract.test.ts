import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSourceFeedAutomationModule,
  resetSourceFeedAutomationFixtures,
  setSourceFeedAutomationFixtures,
} from "./source-feed-automation-test-helpers";

describe("source feed review-first snapshot contract", () => {
  beforeEach(() => {
    resetSourceFeedAutomationFixtures();
  });

  it("keeps source snapshots manual and review-first without auto-publish or deepsearch claims", async () => {
    setSourceFeedAutomationFixtures({
      connections: [
        {
          id: "source-review",
          label: "Presseamt Mitte",
          sourceType: "press_page",
          regionId: "DE-BE",
          organizationId: "org-1",
          url: "https://presse.example",
          enabled: true,
          status: "active_review_required",
          sampleItems: [{ title: "Pressemitteilung", summary: "Neue Vorlage", url: null, detectedTopics: ["Haushalt"] }],
          latestTestResult: { status: "manual_only", checkedAt: "2026-05-27T08:00:00.000Z" },
          latestSnapshotAt: "2026-05-27T08:00:00.000Z",
        },
      ],
      testResults: [
        {
          connectionId: "source-review",
          createdAt: "2026-05-27T08:00:00.000Z",
          reviewTaskSummary: {
            claimCount: 1,
            topicClusterCount: 1,
            dossierSuggestionCount: 1,
            anlassraumSuggestionCount: 0,
            openQuestionCount: 1,
            evidenceCount: 1,
          },
        },
      ],
    });

    const mod = await loadSourceFeedAutomationModule();
    const readModel = await mod.buildFeedSourceAutomationReadModel();
    const item = readModel.items[0];

    expect(item.automationMode).toBe("manual");
    expect(item.reviewRequired).toBe(true);
    expect(item.noAutoPublish).toBe(true);
    expect(item.noDeepSearchAuto).toBe(true);
    expect(item.reviewCandidateCount).toBeGreaterThan(0);
    expect(item.nextAction.href).toContain("/admin/themenradar");
  });
});
