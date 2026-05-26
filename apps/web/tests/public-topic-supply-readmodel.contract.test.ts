import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  let proposalDocs: Array<Record<string, unknown>> = [];
  let feedDraftDocs: Array<Record<string, unknown>> = [];
  let dossierSuggestionDocs: Array<Record<string, unknown>> = [];
  let createHandoffs: Array<Record<string, unknown>> = [];
  let rooms: Array<Record<string, unknown>> = [];
  let workspaces = new Map<string, { regionId?: string; organizationId?: string } | null>();

  return {
    reset() {
      proposalDocs = [];
      feedDraftDocs = [];
      dossierSuggestionDocs = [];
      createHandoffs = [];
      rooms = [];
      workspaces = new Map();
    },
    setState(input: {
      proposals?: Array<Record<string, unknown>>;
      feedDrafts?: Array<Record<string, unknown>>;
      dossierSuggestions?: Array<Record<string, unknown>>;
      createRecords?: Array<Record<string, unknown>>;
      anlassraeume?: Array<Record<string, unknown>>;
      workspaceMap?: Record<string, { regionId?: string; organizationId?: string } | null>;
    }) {
      proposalDocs = (input.proposals ?? []).map((entry) => ({ ...entry }));
      feedDraftDocs = (input.feedDrafts ?? []).map((entry) => ({ ...entry }));
      dossierSuggestionDocs = (input.dossierSuggestions ?? []).map((entry) => ({ ...entry }));
      createHandoffs = (input.createRecords ?? []).map((entry) => ({ ...entry }));
      rooms = (input.anlassraeume ?? []).map((entry) => ({ ...entry }));
      workspaces = new Map(Object.entries(input.workspaceMap ?? {}));
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
                      return proposalDocs.map((entry) => ({ ...entry }));
                    },
                  };
                },
              };
            },
          };
        },
      };
    }),
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
                    return dossierSuggestionDocs.map((entry) => ({ ...entry }));
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
    listPersistedCreateHandoffRecords: vi.fn(async () => createHandoffs.map((entry) => ({ ...entry }))),
    getWorkspaceRepo: vi.fn(() => ({
      async getDossierStudioWorkspace(dossierId: string) {
        const value = workspaces.get(dossierId) ?? null;
        return value ? { dossierId, ...value } : null;
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
  buildPersistedCreateHandoffSummary: (record: { sourceText?: string }) => record.sourceText ?? "Create-Hinweis",
  listPersistedCreateHandoffRecords: () => mocks.listPersistedCreateHandoffRecords(),
  persistedCreateHandoffStatementId: (id: string) => `create-handoff:${id}`,
}));

vi.mock("@features/dossier/server/studioPersistence", () => ({
  getDossierStudioWorkspaceRepo: () => mocks.getWorkspaceRepo(),
}));

import { buildPublicTopicSupplyReadModel } from "@/features/swipes/publicTopicSupply";

describe("public topic supply readmodel contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("bundles proposal, feed, dossier, anlassraum and create signals into visible topic supply", async () => {
    const feedDraftId = new ObjectId();
    const roomId = new ObjectId();
    const dossierRoomId = new ObjectId();

    mocks.setState({
      proposals: [
        {
          _id: new ObjectId("65f000000000000000000011"),
          title: "Öffentliche Priorität Busspur",
          text: "Busspur priorisieren",
          topic: "Mobilität",
          responsibility: "Kommune",
          status: "proposed",
          createdAt: new Date("2026-05-26T10:00:00.000Z"),
        },
      ],
      feedDrafts: [
        {
          _id: feedDraftId,
          anlassraumId: roomId,
          title: "Feed-Thema Wärmenetz",
          summary: "Neuer Feed-Hinweis",
          claims: [{ text: "Wärmenetz ausbauen", topic: "Energie", responsibility: "Kommune" }],
          status: "review",
          feedReviewState: "queued",
          regionCode: "region-a",
          createdAt: new Date("2026-05-26T08:00:00.000Z"),
          publishedAt: null,
        },
      ],
      dossierSuggestions: [
        {
          suggestionId: "ds-1",
          dossierId: "dossier-1",
          type: "update",
          status: "pending",
          payload: {
            title: "Dossier-Update Schulen",
            summary: "Neue Quellenlage zur Sanierung",
            section: "sources",
            statementId: "dossier-statement-1",
            anlassraumHref: `/runden?anlassraumId=${dossierRoomId.toHexString()}`,
          },
          createdAt: new Date("2026-05-26T07:00:00.000Z"),
          updatedAt: new Date("2026-05-26T09:00:00.000Z"),
        },
      ],
      createRecords: [
        {
          id: "handoff-1",
          sourceText: "Hinweis aus eigenem Beitrag",
          claims: [],
          sourceGrounding: [],
          topicSeed: { topicLabel: "Wohnen", jurisdiction: "kommune" },
          createdByUserId: "user-1",
          organizationId: "org-1",
          regionId: "region-a",
          dossierId: null,
          anlassraumId: null,
          resumeHref: "/create?resume=handoff-1",
          reviewRequired: true,
        },
      ],
      anlassraeume: [
        {
          _id: roomId,
          title: "Anlassraum Wärme",
          summary: "Öffentlicher Anlassraum",
          sourceMode: "feed",
          status: "active",
          isPublic: true,
          dossierId: new ObjectId("65f000000000000000000099"),
          regionKey: "region-a",
          updatedAt: new Date("2026-05-26T08:30:00.000Z"),
          createdAt: new Date("2026-05-26T08:00:00.000Z"),
        },
      ],
      workspaceMap: {
        "dossier-1": { regionId: "region-a", organizationId: "org-1" },
      },
    });

    const model = await buildPublicTopicSupplyReadModel({
      userId: "user-1",
      filter: {
        viewerRegionIds: ["region-a"],
        organizationIds: ["org-1"],
      },
      limit: 20,
    });

    expect(model.items.length).toBeGreaterThanOrEqual(4);
    expect(model.items.some((item) => item.sourceType === "proposal" && item.supplyLabel === "Allgemein sichtbares Thema")).toBe(true);
    expect(model.items.some((item) => item.sourceType === "feed" && item.supplyBuckets?.includes("from_feed"))).toBe(true);
    expect(model.items.some((item) => item.sourceType === "dossier" && item.supplyBuckets?.includes("from_dossier"))).toBe(true);
    expect(model.items.some((item) => item.sourceType === "create" && item.supplyLabel === "Aus deinem Beitrag")).toBe(true);
    expect(model.summary.totalVisible).toBe(model.items.length);
    expect(model.summary.buckets.some((bucket) => bucket.bucket === "organization" && bucket.count > 0)).toBe(true);
    expect(model.summary.buckets.some((bucket) => bucket.bucket === "regional" && bucket.count > 0)).toBe(true);
    expect(model.summary.buckets.some((bucket) => bucket.bucket === "needs_review" && bucket.count > 0)).toBe(true);
    expect(model.summary.sources.some((source) => source.source === "feed" && source.count > 0)).toBe(true);
  });
});
