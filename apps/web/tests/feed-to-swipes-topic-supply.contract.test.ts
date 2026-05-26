import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  let feedDraftDocs: Array<Record<string, unknown>> = [];
  let rooms: Array<Record<string, unknown>> = [];

  return {
    reset() {
      feedDraftDocs = [];
      rooms = [];
    },
    setState(input: {
      feedDrafts?: Array<Record<string, unknown>>;
      anlassraeume?: Array<Record<string, unknown>>;
    }) {
      feedDraftDocs = (input.feedDrafts ?? []).map((entry) => ({ ...entry }));
      rooms = (input.anlassraeume ?? []).map((entry) => ({ ...entry }));
    },
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
    voteDraftsCol: vi.fn(async () => ({
      find() {
        return {
          sort() {
            return {
              limit() {
                return {
                  async toArray() {
                    return feedDraftDocs.map((entry) => ({ ...entry }));
                  },
                };
              },
            };
          },
        };
      },
    })),
    dossierSuggestionsCol: vi.fn(async () => ({
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
    anlassraumCol: vi.fn(async () => ({
      find(query?: Record<string, unknown>) {
        const ids = ((query?._id as { $in?: ObjectId[] } | undefined)?.$in ?? []).map((entry) =>
          entry.toHexString(),
        );
        const selected =
          ids.length > 0
            ? rooms.filter((entry) => ids.includes(String((entry._id as ObjectId | undefined)?.toHexString?.())))
            : rooms;
        return {
          sort() {
            return {
              limit() {
                return {
                  async toArray() {
                    return selected.map((entry) => ({ ...entry }));
                  },
                };
              },
            };
          },
          async toArray() {
            return selected.map((entry) => ({ ...entry }));
          },
        };
      },
    })),
    listPersistedCreateHandoffRecords: vi.fn(async () => []),
    getWorkspaceRepo: vi.fn(() => ({
      async getDossierStudioWorkspace() {
        return null;
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

vi.mock("@features/feeds/db", () => ({
  voteDraftsCol: () => mocks.voteDraftsCol(),
}));

vi.mock("@features/dossier/db", () => ({
  dossierSuggestionsCol: () => mocks.dossierSuggestionsCol(),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: () => mocks.anlassraumCol(),
}));

vi.mock("@/features/create/persistedHandoffReviewQueue", () => ({
  buildPersistedCreateHandoffSummary: () => "Create-Hinweis",
  listPersistedCreateHandoffRecords: () => mocks.listPersistedCreateHandoffRecords(),
  persistedCreateHandoffStatementId: (id: string) => `create-handoff:${id}`,
}));

vi.mock("@features/dossier/server/studioPersistence", () => ({
  getDossierStudioWorkspaceRepo: () => mocks.getWorkspaceRepo(),
}));

import { buildPublicTopicSupplyReadModel } from "@/features/swipes/publicTopicSupply";

describe("feed to swipes topic supply contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("maps review-first feed drafts into swipe topics with dossier and anlassraum context", async () => {
    const draftId = new ObjectId();
    const roomId = new ObjectId();
    const dossierId = new ObjectId();

    mocks.setState({
      feedDrafts: [
        {
          _id: draftId,
          anlassraumId: roomId,
          title: "Neues Wärmenetz",
          summary: "Feed-Draft aus dem Radar",
          claims: [{ text: "Wärmenetz ausbauen", topic: "Energie", responsibility: "Kommune" }],
          status: "review",
          feedReviewState: "queued",
          regionCode: "region-a",
          createdAt: new Date("2026-05-26T08:00:00.000Z"),
          publishedAt: null,
        },
      ],
      anlassraeume: [
        {
          _id: roomId,
          dossierId,
          title: "Anlassraum Wärme",
          summary: "Öffentlicher Anlassraum",
          isPublic: true,
          status: "active",
          updatedAt: new Date("2026-05-26T08:30:00.000Z"),
          createdAt: new Date("2026-05-26T08:00:00.000Z"),
        },
      ],
    });

    const model = await buildPublicTopicSupplyReadModel({
      filter: { viewerRegionIds: ["region-a"] },
      limit: 20,
    });

    expect(model.items).toHaveLength(2);
    const feedItem = model.items.find((item) => item.sourceType === "feed");
    expect(feedItem).toBeTruthy();
    expect(feedItem?.supplyBuckets).toContain("from_feed");
    expect(feedItem?.supplyLabel).toBe("Regionaler Hinweis aus dem Feed");
    expect(feedItem?.contextHref).toBe(`/runden?anlassraumId=${roomId.toHexString()}`);
    expect(feedItem?.dossierHref).toBe(`/dossier/${dossierId.toHexString()}`);
    expect(feedItem?.statusLabel).toBe("Im Dossier-Kontext");
  });
});
