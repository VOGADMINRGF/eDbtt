import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  let dossierSuggestionDocs: Array<Record<string, unknown>> = [];
  let createHandoffs: Array<Record<string, unknown>> = [];
  let workspaces = new Map<string, { regionId?: string; organizationId?: string } | null>();

  return {
    reset() {
      dossierSuggestionDocs = [];
      createHandoffs = [];
      workspaces = new Map();
    },
    setState(input: {
      dossierSuggestions?: Array<Record<string, unknown>>;
      createRecords?: Array<Record<string, unknown>>;
      workspaceMap?: Record<string, { regionId?: string; organizationId?: string } | null>;
    }) {
      dossierSuggestionDocs = (input.dossierSuggestions ?? []).map((entry) => ({ ...entry }));
      createHandoffs = (input.createRecords ?? []).map((entry) => ({ ...entry }));
      workspaces = new Map(Object.entries(input.workspaceMap ?? {}));
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
                    return [];
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
          async toArray() {
            return [];
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
  buildPersistedCreateHandoffSummary: () => "Create-Hinweis",
  listPersistedCreateHandoffRecords: () => mocks.listPersistedCreateHandoffRecords(),
  persistedCreateHandoffStatementId: (id: string) => `create-handoff:${id}`,
}));

vi.mock("@features/dossier/server/studioPersistence", () => ({
  getDossierStudioWorkspaceRepo: () => mocks.getWorkspaceRepo(),
}));

import { buildPublicTopicSupplyReadModel } from "@/features/swipes/publicTopicSupply";

describe("swipes regional and organization supply contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("shows scoped topics only when the matching region or organization is available", async () => {
    mocks.setState({
      dossierSuggestions: [
        {
          suggestionId: "ds-1",
          dossierId: "dossier-1",
          type: "update",
          status: "pending",
          payload: { title: "Regionales Dossier", summary: "Nur für Region A" },
          createdAt: new Date("2026-05-26T09:00:00.000Z"),
          updatedAt: new Date("2026-05-26T09:00:00.000Z"),
        },
      ],
      createRecords: [
        {
          id: "handoff-1",
          sourceText: "Nur für Org 1",
          claims: [],
          sourceGrounding: [],
          topicSeed: { topicLabel: "Interner Beitrag", jurisdiction: "kommune" },
          createdByUserId: "user-1",
          organizationId: "org-1",
          regionId: null,
          dossierId: null,
          anlassraumId: null,
          resumeHref: "/create?resume=handoff-1",
          reviewRequired: true,
        },
      ],
      workspaceMap: {
        "dossier-1": { regionId: "region-a", organizationId: null },
      },
    });

    const withoutScope = await buildPublicTopicSupplyReadModel({
      filter: {},
      limit: 20,
    });
    expect(withoutScope.items).toEqual([]);

    const withScope = await buildPublicTopicSupplyReadModel({
      userId: "user-1",
      filter: {
        viewerRegionIds: ["region-a"],
        organizationIds: ["org-1"],
      },
      limit: 20,
    });

    expect(withScope.items.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Regionales Dossier", "Interner Beitrag"]),
    );
    expect(withScope.items.every((item) => item.supplyBuckets?.includes("regional") || item.supplyBuckets?.includes("organization"))).toBe(true);
  });
});
