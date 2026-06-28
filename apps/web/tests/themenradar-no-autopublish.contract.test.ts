import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadAutonomousModule,
  resetAutonomousFixtures,
  setAutonomousFixtures,
} from "./themenradar-autonomous-test-helpers";

describe("themenradar no-autopublish contract", () => {
  beforeEach(() => {
    resetAutonomousFixtures();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps even strong published drafts as review-first suggestions", async () => {
    setAutonomousFixtures({
      voteDrafts: [
        {
          _id: "draft-published",
          title: "Neues Freibad für den Bezirk",
          claims: [{ title: "Freibad sanieren", topic: "Freibad" }],
          summary: "Quelle meldet schnellen Handlungsdruck",
          status: "published",
          feedReviewState: "ready",
          sourceUrl: "https://example.org/freibad",
          reviewNote: "Gute Quellenlage",
          createdAt: "2026-05-26T09:00:00.000Z",
          publishedAt: "2026-05-26T09:30:00.000Z",
          regionCode: "DE-BE",
        },
      ],
    });

    const { buildAutonomousThemenradarReadModel } = await loadAutonomousModule();
    const readModel = await buildAutonomousThemenradarReadModel();

    expect(readModel.items).not.toHaveLength(0);
    for (const item of readModel.items) {
      expect(item.reviewRequired).toBe(true);
      expect(item.autoPublishAllowed).toBe(false);
      expect(item.reviewHint).toMatch(/Review|Freigabe|Vorschlag/i);
    }
  });
});
