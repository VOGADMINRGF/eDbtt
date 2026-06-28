import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  statementCandidatesCol: vi.fn(),
  voteDraftsCol: vi.fn(),
  clusterCol: vi.fn(),
  feedStatementsCol: vi.fn(),
  anlassraumCol: vi.fn(),
  listRecentRuns: vi.fn(),
  coreCol: vi.fn(),
  loadFeeds: vi.fn(),
  collectFeedRefs: vi.fn(),
  listRegionSourceConnections: vi.fn(),
  listRegionSourceTestResults: vi.fn(),
  buildPublicTopicSupplyReadModel: vi.fn(),
  buildFeedSourceAutomationReadModel: vi.fn(),
  buildMaterialExtractionJobReadModel: vi.fn(),
  resolveAiFlowIntegration: vi.fn(),
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

vi.mock("@core/db/triMongo", () => ({
  coreCol: (...args: unknown[]) => mocks.coreCol(...args),
}));

vi.mock("@features/feeds/feedConfig", async () => {
  const actual = await vi.importActual<typeof import("@features/feeds/feedConfig")>(
    "@features/feeds/feedConfig",
  );
  return {
    ...actual,
    loadFeeds: (...args: unknown[]) => mocks.loadFeeds(...args),
    collectFeedRefs: (...args: unknown[]) => mocks.collectFeedRefs(...args),
  };
});

vi.mock("@features/region/server/sourceConnectionRuntime", () => ({
  listRegionSourceConnections: (...args: unknown[]) =>
    mocks.listRegionSourceConnections(...args),
  listRegionSourceTestResults: (...args: unknown[]) =>
    mocks.listRegionSourceTestResults(...args),
}));

vi.mock("@features/feeds/runtimeLog", () => ({
  listRecentFeedRuntimeRuns: (...args: unknown[]) => mocks.listRecentRuns(...args),
}));

vi.mock("@/features/swipes/publicTopicSupply", () => ({
  buildPublicTopicSupplyReadModel: (...args: unknown[]) =>
    mocks.buildPublicTopicSupplyReadModel(...args),
}));

vi.mock("@features/feeds/sourceAutomation", () => ({
  buildFeedSourceAutomationReadModel: (...args: unknown[]) =>
    mocks.buildFeedSourceAutomationReadModel(...args),
}));

vi.mock("@/features/material/materialExtractionJobs", () => ({
  buildMaterialExtractionJobReadModel: (...args: unknown[]) =>
    mocks.buildMaterialExtractionJobReadModel(...args),
}));

vi.mock("@/features/ai/v2OrchestrationPolicy", () => ({
  resolveAiFlowIntegration: (...args: unknown[]) => mocks.resolveAiFlowIntegration(...args),
}));

import { buildFeedRadarRuntimeReadModel } from "@features/feeds/runtimeReadModel";

describe("v1 feed radar runtime contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.coreCol.mockResolvedValue({
      createIndex: vi.fn(async () => undefined),
      find: vi.fn(() => ({
        toArray: async () => [],
      })),
      findOne: vi.fn(async () => null),
      updateOne: vi.fn(async () => undefined),
    });
    mocks.loadFeeds.mockImplementation(async (scope: "de" | "global") => ({
      config: null,
      searched: [],
      source: `mock:${scope}`,
    }));
    mocks.collectFeedRefs.mockReturnValue([]);
    mocks.listRegionSourceConnections.mockResolvedValue([]);
    mocks.listRegionSourceTestResults.mockResolvedValue([]);
    mocks.statementCandidatesCol.mockResolvedValue(
      countCollection({
        "{}": 8,
        '{"analyzeStatus":"processing"}': 1,
        '{"analyzeStatus":"success"}': 5,
        '{"analyzeStatus":"error"}': 1,
      }),
    );
    mocks.voteDraftsCol.mockResolvedValue(
      countCollection({
        "{}": 6,
        '{"feedReviewState":"queued"}': 2,
        '{"status":"review"}': 3,
        '{"status":"published"}': 1,
        '{"feedReviewState":"ignored"}': 0,
        '{"feedReviewState":"weak_signal"}': 1,
        '{"feedReviewState":"attached"}': 1,
        '{"feedReviewState":"candidate_created"}': 1,
      }),
    );
    mocks.clusterCol.mockResolvedValue(countCollection({ "{}": 2 }));
    mocks.feedStatementsCol.mockResolvedValue(
      countCollection({
        '{"status":"readyForLive"}': 1,
      }),
    );
    mocks.anlassraumCol.mockResolvedValue(
      countCollection({
        '{"dossierId":{"$exists":true,"$ne":null}}': 1,
      }),
    );
    mocks.listRecentRuns.mockResolvedValue([
      {
        runType: "pull",
        status: "success",
        requestedAt: new Date("2026-05-25T08:00:00.000Z"),
        completedAt: new Date("2026-05-25T08:02:00.000Z"),
        counts: { inserted: 4, fetchedItems: 12 },
      },
      {
        runType: "analyze",
        status: "error",
        requestedAt: new Date("2026-05-25T08:10:00.000Z"),
        completedAt: new Date("2026-05-25T08:12:00.000Z"),
        counts: { analyzed: 3, errors: 1 },
        error: "analyze_pending_partial_error",
      },
    ]);
    mocks.buildPublicTopicSupplyReadModel.mockResolvedValue(null);
    mocks.buildFeedSourceAutomationReadModel.mockResolvedValue(null);
    mocks.buildMaterialExtractionJobReadModel.mockResolvedValue(null);
    mocks.resolveAiFlowIntegration.mockImplementation((flow: string) => ({
      lane: flow,
      laneLabel: `Lane ${flow}`,
      outputLabel: `Output ${flow}`,
      reviewRequired: true,
      draftOnly: true,
      publicOutputAllowed: false,
      costApprovalRequired: flow === "material_extraction",
    }));
  });

  it("summarizes the runtime as review-first and routes follow-up to existing surfaces", async () => {
    const model = await buildFeedRadarRuntimeReadModel();

    expect(model.sourceStatus.status).toBe("error");
    expect(model.metrics.review.value).toBe(6);
    expect(model.queue.clusteredCandidates).toBe(2);
    expect(model.nextAction).toMatchObject({
      action: "check_errors",
      href: "/admin/feeds/drafts",
    });
    expect(model.publicHandoffs.map((entry) => entry.surface)).toEqual([
      "swipes",
      "runden",
      "dossier",
    ]);
    expect(model.runs[0]?.label).toBe("Abruf");
    expect(model.runs[1]?.error).toBe("analyze_pending_partial_error");
  });
});
