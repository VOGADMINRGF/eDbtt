import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  statementCandidatesCol: vi.fn(),
  voteDraftsCol: vi.fn(),
  clusterCol: vi.fn(),
  feedStatementsCol: vi.fn(),
  anlassraumCol: vi.fn(),
  listRecentRuns: vi.fn(),
  buildTopicSupply: vi.fn(),
  buildSourceAutomation: vi.fn(),
}));

function countCollection(counts: Record<string, number>) {
  return {
    countDocuments: vi.fn(async (filter: Record<string, unknown> = {}) => {
      const key = JSON.stringify(filter);
      return counts[key] ?? counts["{}"] ?? 0;
    }),
  };
}

vi.mock("@features/feeds/db", () => ({
  statementCandidatesCol: (...args: unknown[]) => mocks.statementCandidatesCol(...args),
  voteDraftsCol: (...args: unknown[]) => mocks.voteDraftsCol(...args),
  feedAnlassraumClusterCandidatesCol: (...args: unknown[]) => mocks.clusterCol(...args),
  feedStatementsCol: (...args: unknown[]) => mocks.feedStatementsCol(...args),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: (...args: unknown[]) => mocks.anlassraumCol(...args),
}));

vi.mock("@features/feeds/runtimeLog", () => ({
  listRecentFeedRuntimeRuns: (...args: unknown[]) => mocks.listRecentRuns(...args),
}));

vi.mock("@/features/swipes/publicTopicSupply", () => ({
  buildPublicTopicSupplyReadModel: (...args: unknown[]) => mocks.buildTopicSupply(...args),
}));

vi.mock("@features/feeds/sourceAutomation", () => ({
  buildFeedSourceAutomationReadModel: (...args: unknown[]) => mocks.buildSourceAutomation(...args),
}));

import { buildFeedRadarRuntimeReadModel } from "@features/feeds/runtimeReadModel";

describe("source feed themenradar handoff contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.statementCandidatesCol.mockResolvedValue(countCollection({ "{}": 0, '{"analyzeStatus":"processing"}': 0, '{"analyzeStatus":"success"}': 0, '{"analyzeStatus":"error"}': 0 }));
    mocks.voteDraftsCol.mockResolvedValue(countCollection({ "{}": 0, '{"feedReviewState":"queued"}': 0, '{"status":"review"}': 0, '{"status":"published"}': 0, '{"feedReviewState":"ignored"}': 0, '{"feedReviewState":"weak_signal"}': 0, '{"feedReviewState":"attached"}': 0, '{"feedReviewState":"candidate_created"}': 0 }));
    mocks.clusterCol.mockResolvedValue(countCollection({ "{}": 0 }));
    mocks.feedStatementsCol.mockResolvedValue(countCollection({ '{"status":"readyForLive"}': 0 }));
    mocks.anlassraumCol.mockResolvedValue(countCollection({ '{"dossierId":{"$exists":true,"$ne":null}}': 0 }));
    mocks.listRecentRuns.mockResolvedValue([]);
    mocks.buildTopicSupply.mockResolvedValue({
      items: [],
      summary: {
        totalVisible: 0,
        reviewRequired: 0,
        buckets: [],
        sources: [],
        nextAction: { label: "Supply prüfen", description: "Leer", href: "/admin/feeds" },
      },
    });
    mocks.buildSourceAutomation.mockResolvedValue({
      generatedAt: "2026-05-27T10:00:00.000Z",
      items: [],
      summary: {
        totalSources: 3,
        healthySources: 1,
        noisySources: 1,
        failingSources: 0,
        quietSources: 1,
        backoffSources: 0,
        reviewCandidateCount: 4,
        cronReadySources: 2,
        manualSources: 1,
        themenradarReadySources: 2,
        nextAction: {
          label: "Themenradar öffnen",
          description: "Mehrere Quellen liefern reviewfähige Signale.",
          href: "/admin/themenradar?mode=autonomous",
        },
      },
    });
  });

  it("surfaces the guarded source automation handoff inside the feed runtime", async () => {
    const model = await buildFeedRadarRuntimeReadModel();

    expect(model.sourceAutomation.summary.totalSources).toBe(3);
    expect(model.sourceAutomation.summary.reviewCandidateCount).toBe(4);
    expect(model.sourceAutomation.summary.nextAction.href).toBe("/admin/themenradar?mode=autonomous");
  });
});
