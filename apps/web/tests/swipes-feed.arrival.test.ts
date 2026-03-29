import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  let proposalDocs: Array<Record<string, any>> = [];
  let eventualityCounts: Record<string, number> = {};

  return {
    reset() {
      proposalDocs = [];
      eventualityCounts = {};
    },
    setProposals(docs: Array<Record<string, any>>) {
      proposalDocs = docs.map((doc) => ({ ...doc }));
    },
    setEventualityCounts(counts: Record<string, number>) {
      eventualityCounts = { ...counts };
    },
    getCol: vi.fn(async (name: string) => {
      if (name !== "statement_proposals") throw new Error(`unexpected_collection_${name}`);
      return {
        find() {
          return {
            sort() {
              return {
                limit() {
                  return {
                    async toArray() {
                      return proposalDocs.map((doc) => ({ ...doc }));
                    },
                  };
                },
              };
            },
          };
        },
      };
    }),
    eventualityNodesCol: vi.fn(async () => ({
      aggregate(pipeline: Array<Record<string, any>>) {
        const ids: string[] =
          pipeline?.[0]?.$match?.statementId?.$in?.map?.((value: unknown) => String(value)) ?? [];
        const rows = ids
          .map((id) => ({ _id: id, count: eventualityCounts[id] ?? 0 }))
          .filter((row) => row.count > 0);
        return {
          async toArray() {
            return rows;
          },
        };
      },
    })),
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

vi.mock("@core/eventualities/db", () => ({
  eventualityNodesCol: () => mocks.eventualityNodesCol(),
}));

vi.mock("@/features/graph/swipes", () => ({
  recordSwipeVoteInGraph: vi.fn(async () => {}),
}));

vi.mock("@/lib/onboarding/preferenceSnapshot", () => ({
  getUserPreferenceSnapshot: vi.fn(async () => null),
  getPersonalizedStartItems: vi.fn((_: unknown, items: any[]) => items.map((item) => ({ item, score: { totalScore: 0 } }))),
}));

import { getSwipeFeed } from "@/features/swipes/service";

describe("swipes feed arrival mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("focuses proposals from fromDraft and marks them as arrival matches", async () => {
    const fromDraftId = new ObjectId().toHexString();
    const otherDraftId = new ObjectId().toHexString();
    const anlassraumId = new ObjectId().toHexString();
    const matchingStatementId = new ObjectId().toHexString();

    mocks.setProposals([
      {
        _id: new ObjectId(matchingStatementId),
        draftId: new ObjectId(fromDraftId),
        anlassraumId,
        title: "Aus Beitrag A",
        text: "Text A",
        topic: "Mobilität",
        responsibility: "Kommune",
        status: "proposed",
        createdAt: new Date("2026-03-26T10:00:00.000Z"),
      },
      {
        _id: new ObjectId(),
        draftId: new ObjectId(otherDraftId),
        anlassraumId: new ObjectId().toHexString(),
        title: "Aus Beitrag B",
        text: "Text B",
        topic: "Wohnen",
        responsibility: "Bund",
        status: "proposed",
        createdAt: new Date("2026-03-26T09:00:00.000Z"),
      },
    ]);
    mocks.setEventualityCounts({ [matchingStatementId]: 2 });

    const feed = await getSwipeFeed({
      edebattePackage: "none",
      filter: { fromDraftId },
      limit: 20,
    });

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].sourceDraftId).toBe(fromDraftId);
    expect(feed.items[0].fromDraftMatch).toBe(true);
    expect(feed.items[0].contextHref).toBe(`/create?mode=source&anlassraumId=${encodeURIComponent(anlassraumId)}`);
    expect(feed.items[0].eventualitiesCount).toBe(2);
  });

  it("does not fall back to seed items when fromDraft has no proposal matches", async () => {
    const fromDraftId = new ObjectId().toHexString();

    mocks.setProposals([
      {
        _id: new ObjectId(),
        draftId: new ObjectId(),
        title: "Unrelated",
        text: "Text",
        topic: "Bildung",
        responsibility: "Land",
        status: "proposed",
        createdAt: new Date(),
      },
    ]);

    const feed = await getSwipeFeed({
      edebattePackage: "none",
      filter: { fromDraftId },
      limit: 20,
    });

    expect(feed.items).toEqual([]);
  });

  it("keeps seed fallback for non-arrival requests", async () => {
    mocks.setProposals([]);

    const feed = await getSwipeFeed({
      edebattePackage: "none",
      filter: {},
      limit: 20,
    });

    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items[0]?.id.startsWith("seed-")).toBe(true);
  });
});
