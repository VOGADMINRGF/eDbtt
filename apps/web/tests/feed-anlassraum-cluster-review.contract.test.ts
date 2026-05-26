import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { resolveFeedRadarStatusFromDraft } from "@features/feeds/statusContract";

const memory = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  const collections = new Map<string, AnyDoc[]>();

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const fn = (value as { toHexString?: () => string }).toHexString;
      if (typeof fn === "function") return fn.call(value);
    }
    return value;
  }

  function matches(doc: AnyDoc, filter: AnyDoc) {
    return Object.entries(filter ?? {}).every(([key, value]) => {
      if (value && typeof value === "object" && "$in" in (value as Record<string, unknown>)) {
        const values = ((value as { $in?: unknown[] }).$in ?? []).map(toKey);
        return values.includes(toKey(doc[key]));
      }
      return toKey(doc[key]) === toKey(value);
    });
  }

  class Cursor {
    constructor(private rows: AnyDoc[]) {}
    sort() {
      return this;
    }
    limit(count: number) {
      this.rows = this.rows.slice(0, count);
      return this;
    }
    async toArray() {
      return this.rows.map((row) => ({ ...row }));
    }
  }

  function getCollection(name: string) {
    const key = String(name);
    if (!collections.has(key)) collections.set(key, []);
    const rows = collections.get(key)!;
    return {
      async createIndex() {
        return "ok";
      },
      find(filter: AnyDoc = {}) {
        return new Cursor(rows.filter((row) => matches(row, filter)));
      },
      async findOne(filter: AnyDoc = {}) {
        const hit = rows.find((row) => matches(row, filter));
        return hit ? { ...hit } : null;
      },
      async insertOne(doc: AnyDoc) {
        const next = { ...doc };
        if (!next._id) next._id = new ObjectId();
        rows.push(next);
        return { insertedId: next._id };
      },
      seed(seedRows: AnyDoc[]) {
        collections.set(key, seedRows.map((row) => ({ ...row })));
      },
      all() {
        return (collections.get(key) ?? []).map((row) => ({ ...row }));
      },
    };
  }

  return {
    reset() {
      collections.clear();
    },
    seed(name: string, rows: AnyDoc[]) {
      getCollection(name).seed(rows);
    },
    read(name: string) {
      return getCollection(name).all();
    },
    getCollection,
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    coreCol: async (name: string) => memory.getCollection(name),
  };
});

import { runFeedAnlassraumClusterJob } from "@features/feeds/clusterJob";

describe("feed anlassraum cluster review contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memory.reset();
  });

  it("keeps clustered proposals reviewable before they are attached or published", async () => {
    const roomId = new ObjectId("65f200000000000000000210");
    memory.seed("vote_drafts", [
      {
        _id: new ObjectId("65f200000000000000000201"),
        status: "draft",
        feedReviewState: "queued",
        pipeline: "feeds_to_statementCandidate",
        title: "Schulwegsicherheit Nord",
        claims: [{ id: "c1", text: "x", topic: "schulweg" }],
        regionCode: "DE:BE",
        createdAt: new Date("2026-05-25T08:00:00.000Z"),
        updatedAt: new Date("2026-05-25T08:10:00.000Z"),
      },
      {
        _id: new ObjectId("65f200000000000000000202"),
        status: "review",
        feedReviewState: "queued",
        pipeline: "feeds_to_statementCandidate",
        title: "Schulwegsicherheit Süd",
        claims: [{ id: "c2", text: "y", topic: "schulweg" }],
        regionCode: "DE:BE",
        createdAt: new Date("2026-05-25T08:20:00.000Z"),
        updatedAt: new Date("2026-05-25T08:30:00.000Z"),
      },
    ]);

    const clusterResult = await runFeedAnlassraumClusterJob({
      minItemsPerCluster: 2,
      windowHours: 72,
    });

    expect(clusterResult.status).toBe("success");
    expect(clusterResult.summary.totalClusters).toBe(1);
    expect(resolveFeedRadarStatusFromDraft({ draftStatus: "review", feedReviewState: "queued" })).toBe(
      "needs_review",
    );
    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "review",
        feedReviewState: "queued",
        hasClusterCandidate: true,
      }),
    ).toBe("clustered");
    expect(memory.read("feed_anlassraum_cluster_candidates")).toHaveLength(1);

    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "review",
        feedReviewState: "attached",
        hasAnlassraum: true,
      }),
    ).toBe("attached_to_anlassraum");
    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "review",
        feedReviewState: "attached",
        hasAnlassraum: true,
        hasDossier: true,
      }),
    ).toBe("attached_to_dossier");

    expect(roomId).toBeTruthy();
  });
});
