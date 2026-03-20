import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const memory = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  const collections = new Map<string, InMemoryCollection>();
  const writes = new Set<string>();
  let failVoteDraftReads = false;

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const fn = (value as { toHexString?: () => string }).toHexString;
      if (typeof fn === "function") return fn.call(value);
    }
    return value;
  }

  function deepGet(obj: AnyDoc, path: string) {
    const parts = path.split(".");
    let cursor: any = obj;
    for (const part of parts) {
      if (cursor == null) return undefined;
      cursor = cursor[part];
    }
    return cursor;
  }

  function matchesFilter(doc: AnyDoc, filter: AnyDoc) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, condition] of Object.entries(filter)) {
      const actual = deepGet(doc, key);
      if (condition && typeof condition === "object" && !Array.isArray(condition)) {
        const c = condition as AnyDoc;
        if ("$in" in c) {
          const list = Array.isArray(c.$in) ? c.$in : [];
          if (!list.some((value) => toKey(value) === toKey(actual))) return false;
          continue;
        }
      }
      if (toKey(actual) !== toKey(condition)) return false;
    }
    return true;
  }

  class InMemoryCursor {
    private readonly docs: AnyDoc[];

    constructor(docs: AnyDoc[]) {
      this.docs = [...docs];
    }

    sort(spec: Record<string, 1 | -1>) {
      const entries = Object.entries(spec);
      this.docs.sort((a, b) => {
        for (const [field, dir] of entries) {
          const av = toKey(deepGet(a, field)) as any;
          const bv = toKey(deepGet(b, field)) as any;
          if (av === bv) continue;
          if (av < bv) return dir === 1 ? -1 : 1;
          if (av > bv) return dir === 1 ? 1 : -1;
        }
        return 0;
      });
      return this;
    }

    limit(n: number) {
      this.docs.splice(Math.max(0, Math.floor(Number(n) || 0)));
      return this;
    }

    async toArray() {
      return [...this.docs];
    }
  }

  class InMemoryCollection {
    private readonly name: string;
    docs: AnyDoc[] = [];

    constructor(name: string) {
      this.name = name;
    }

    async createIndex() {
      return "ok";
    }

    seed(rows: AnyDoc[]) {
      this.docs = rows.map((row) => ({ ...row }));
    }

    all() {
      return this.docs.map((row) => ({ ...row }));
    }

    find(filter: AnyDoc = {}) {
      return new InMemoryCursor(this.docs.filter((doc) => matchesFilter(doc, filter)));
    }

    async findOne(filter: AnyDoc = {}) {
      const hit = this.docs.find((doc) => matchesFilter(doc, filter));
      return hit ? { ...hit } : null;
    }

    async insertOne(doc: AnyDoc) {
      const next = { ...doc };
      if (!next._id) next._id = new ObjectId();
      this.docs.push(next);
      writes.add(this.name);
      return { acknowledged: true, insertedId: next._id };
    }

    async updateOne(filter: AnyDoc, update: AnyDoc) {
      const idx = this.docs.findIndex((doc) => matchesFilter(doc, filter));
      if (idx < 0) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      if (update?.$set && typeof update.$set === "object") {
        this.docs[idx] = {
          ...this.docs[idx],
          ...update.$set,
        };
      }
      writes.add(this.name);
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    }
  }

  function getCollection(name: string) {
    const key = String(name || "");
    if (key === "vote_drafts" && failVoteDraftReads) {
      throw new Error("forced_vote_draft_failure");
    }
    const existing = collections.get(key);
    if (existing) return existing;
    const created = new InMemoryCollection(key);
    collections.set(key, created);
    return created;
  }

  return {
    reset() {
      collections.clear();
      writes.clear();
      failVoteDraftReads = false;
    },
    seed(name: string, rows: AnyDoc[]) {
      getCollection(name).seed(rows);
    },
    read(name: string) {
      return getCollection(name).all();
    },
    writes() {
      return Array.from(writes.values()).sort();
    },
    failVoteDraftSource() {
      failVoteDraftReads = true;
    },
    getCollection,
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    coreCol: async (name: string) => memory.getCollection(name),
    default: {
      ObjectId: mongodb.ObjectId,
      coreCol: async (name: string) => memory.getCollection(name),
    },
  };
});

import { runFeedAnlassraumClusterJob } from "@features/feeds/clusterJob";

function seedDrafts(rows: Array<Record<string, unknown>>) {
  memory.seed("vote_drafts", rows);
}

describe("feed/anlassraum cluster job service", () => {
  beforeEach(() => {
    memory.reset();
  });

  it("Scenario A: productive inputs cluster into explicit candidates", async () => {
    const roomId = new ObjectId();
    seedDrafts([
      {
        _id: new ObjectId(),
        status: "draft",
        title: "Mobilitaet Ringbahn",
        claims: [{ id: "c1", text: "x", topic: "mobility" }],
        regionCode: "DE-BE",
        anlassraumId: roomId,
        createdAt: new Date("2026-03-19T08:00:00.000Z"),
        updatedAt: new Date("2026-03-19T08:10:00.000Z"),
      },
      {
        _id: new ObjectId(),
        status: "review",
        title: "Mobilitaet Kiezbus",
        claims: [{ id: "c2", text: "y", topic: "mobility" }],
        regionCode: "DE-BE",
        createdAt: new Date("2026-03-19T09:00:00.000Z"),
        updatedAt: new Date("2026-03-19T09:10:00.000Z"),
      },
    ]);

    const result = await runFeedAnlassraumClusterJob({ minItemsPerCluster: 2, windowHours: 72 });

    expect(result.status).toBe("success");
    expect(result.summary).toMatchObject({
      totalClusters: 1,
      created: 1,
      updated: 0,
      unchanged: 0,
    });
    expect(result.clusters[0]).toMatchObject({
      action: "created",
      draftCount: 2,
      anlassraumCount: 1,
      topicKey: "mobility",
      regionCode: "DE-BE",
    });
    expect(memory.read("feed_anlassraum_cluster_candidates")).toHaveLength(1);
  });

  it("Scenario B: empty source set returns explicit no-op", async () => {
    seedDrafts([]);
    const result = await runFeedAnlassraumClusterJob();
    expect(result.status).toBe("empty");
    expect(result.emptyReason).toBe("no_source_items");
    expect(result.summary.totalClusters).toBe(0);
  });

  it("Scenario C: source failure maps to stable unavailable error", async () => {
    memory.failVoteDraftSource();
    await expect(runFeedAnlassraumClusterJob()).rejects.toThrow(
      "feed_anlassraum_cluster_source_unavailable",
    );
  });

  it("Scenario D: rerun remains idempotent and reports unchanged", async () => {
    seedDrafts([
      {
        _id: new ObjectId("65f100000000000000000001"),
        status: "draft",
        title: "Energie Quartier",
        claims: [{ id: "c1", text: "x", topic: "energy" }],
        regionCode: "DE-BE",
        createdAt: new Date("2026-03-19T08:00:00.000Z"),
        updatedAt: new Date("2026-03-19T08:10:00.000Z"),
      },
      {
        _id: new ObjectId("65f100000000000000000002"),
        status: "review",
        title: "Energie Netz",
        claims: [{ id: "c2", text: "y", topic: "energy" }],
        regionCode: "DE-BE",
        createdAt: new Date("2026-03-19T08:20:00.000Z"),
        updatedAt: new Date("2026-03-19T08:30:00.000Z"),
      },
    ]);

    const first = await runFeedAnlassraumClusterJob({ minItemsPerCluster: 2 });
    const second = await runFeedAnlassraumClusterJob({ minItemsPerCluster: 2 });

    expect(first.summary.created).toBe(1);
    expect(second.summary).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 1,
    });
    expect(memory.read("feed_anlassraum_cluster_candidates")).toHaveLength(1);
  });

  it("Scenario E: cluster job does not cross publish boundary", async () => {
    seedDrafts([
      {
        _id: new ObjectId(),
        status: "draft",
        title: "Wohnen Nord",
        claims: [{ id: "c1", text: "x", topic: "housing" }],
        regionCode: "DE-BE",
        createdAt: new Date("2026-03-19T08:00:00.000Z"),
        updatedAt: new Date("2026-03-19T08:10:00.000Z"),
      },
      {
        _id: new ObjectId(),
        status: "review",
        title: "Wohnen Sued",
        claims: [{ id: "c2", text: "y", topic: "housing" }],
        regionCode: "DE-BE",
        createdAt: new Date("2026-03-19T08:20:00.000Z"),
        updatedAt: new Date("2026-03-19T08:30:00.000Z"),
      },
    ]);
    memory.seed("output_seed", [
      {
        _id: new ObjectId(),
        anlassraumId: new ObjectId(),
        outputType: "round_seed",
        status: "published",
        reviewState: "approved",
      },
    ]);

    const beforeOutputSeeds = memory.read("output_seed");
    const beforeDrafts = memory.read("vote_drafts");

    await runFeedAnlassraumClusterJob({ minItemsPerCluster: 2 });

    expect(memory.read("output_seed")).toEqual(beforeOutputSeeds);
    expect(memory.read("vote_drafts")).toEqual(beforeDrafts);
  });

  it("Scenario F: write boundary remains narrow and auditable", async () => {
    seedDrafts([
      {
        _id: new ObjectId(),
        status: "draft",
        title: "Bildung Ost",
        claims: [{ id: "c1", text: "x", topic: "education" }],
        regionCode: "DE-BE",
        createdAt: new Date("2026-03-19T08:00:00.000Z"),
        updatedAt: new Date("2026-03-19T08:10:00.000Z"),
      },
      {
        _id: new ObjectId(),
        status: "review",
        title: "Bildung West",
        claims: [{ id: "c2", text: "y", topic: "education" }],
        regionCode: "DE-BE",
        createdAt: new Date("2026-03-19T08:20:00.000Z"),
        updatedAt: new Date("2026-03-19T08:30:00.000Z"),
      },
    ]);

    await runFeedAnlassraumClusterJob({ minItemsPerCluster: 2 });

    expect(memory.writes()).toEqual(["feed_anlassraum_cluster_candidates"]);
  });
});
