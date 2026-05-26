import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCol: vi.fn(async () => ({
    find() {
      return {
        sort() {
          return {
            limit() {
              return {
                async toArray() {
                  return [];
                },
              };
            },
          };
        },
      };
    },
  })),
  eventualityNodesCol: vi.fn(async () => ({
    aggregate() {
      return {
        async toArray() {
          return [];
        },
      };
    },
  })),
  coreCol: vi.fn(async () => ({
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        limit: vi.fn(() => ({
          toArray: vi.fn(async () => []),
        })),
      })),
    })),
    createIndex: vi.fn(async () => "ok"),
  })),
  buildPublicTopicSupplyReadModel: vi.fn(async () => ({ items: [], summary: null })),
}));

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  };
});

vi.mock("@core/eventualities/db", () => ({
  eventualityNodesCol: () => mocks.eventualityNodesCol(),
}));

vi.mock("@/features/swipes/publicTopicSupply", () => ({
  buildPublicTopicSupplyReadModel: (...args: unknown[]) => mocks.buildPublicTopicSupplyReadModel(...args),
}));

vi.mock("@features/feeds/db", () => ({
  voteDraftsCol: async () => ({
    find() {
      return {
        sort() {
          return {
            limit() {
              return {
                async toArray() {
                  return [];
                },
              };
            },
          };
        },
      };
    },
  }),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: async () => ({
    find() {
      return {
        async toArray() {
          return [];
        },
      };
    },
  }),
}));

vi.mock("@/features/graph/swipes", () => ({
  recordSwipeVoteInGraph: vi.fn(async () => {}),
}));

vi.mock("@/lib/onboarding/preferenceSnapshot", () => ({
  getUserPreferenceSnapshot: vi.fn(async () => null),
  getPersonalizedStartItems: vi.fn((_: unknown, items: any[]) => items.map((item) => ({ item, score: { totalScore: 0 } }))),
}));

import { getSwipeFeed } from "@/features/swipes/service";

describe("public topic supply no fake seed contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks seed fallback in organization, region, admin, review and fromDraft contexts", async () => {
    const contexts = [
      { organizationId: "org-1" },
      { viewerRegionIds: ["region-a"] },
      { regionId: "region-a", adminContext: true },
      { reviewContext: true },
      { fromDraftId: "65f000000000000000000011" },
    ];

    for (const filter of contexts) {
      const feed = await getSwipeFeed({
        edebattePackage: "none",
        filter,
        limit: 20,
      });
      expect(feed.items).toEqual([]);
    }
  });
});
