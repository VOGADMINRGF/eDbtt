import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const memory = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  const collections = new Map<string, InMemoryCollection>();
  let failOutputSeed = false;

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
          const values = Array.isArray(c.$in) ? c.$in : [];
          if (!values.some((value) => toKey(value) === toKey(actual))) return false;
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
    docs: AnyDoc[] = [];

    async createIndex() {
      return "ok";
    }

    seed(rows: AnyDoc[]) {
      this.docs = rows.map((item) => ({ ...item }));
    }

    find(filter: AnyDoc = {}) {
      return new InMemoryCursor(this.docs.filter((doc) => matchesFilter(doc, filter)));
    }
  }

  function getCollection(name: string) {
    const key = String(name || "");
    if (key === "output_seed" && failOutputSeed) {
      throw new Error("forced_output_seed_failure");
    }
    const existing = collections.get(key);
    if (existing) return existing;
    const created = new InMemoryCollection();
    collections.set(key, created);
    return created;
  }

  return {
    reset() {
      collections.clear();
      failOutputSeed = false;
    },
    seed(name: string, rows: AnyDoc[]) {
      getCollection(name).seed(rows);
    },
    failOutputSeedReads() {
      failOutputSeed = true;
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

import { listRundenEntryItems } from "@features/topicRound/entrySource";

describe("runden entry source service", () => {
  beforeEach(() => {
    memory.reset();
  });

  it("Scenario A: productive source returns rounds without seed fallback", async () => {
    const roomId = new ObjectId("65f000000000000000000001");
    const seedId = new ObjectId("65f000000000000000000011");

    memory.seed("anlassraum", [
      {
        _id: roomId,
        title: "Mobilitaet Innenstadt",
        summary: "Runde fuer konkrete Massnahmen in der Innenstadt.",
        topicKey: "mobility",
        type: "policy",
        sourceMode: "feed",
        status: "reviewed",
      },
    ]);

    memory.seed("output_seed", [
      {
        _id: seedId,
        anlassraumId: roomId,
        outputType: "round_seed",
        status: "review",
        reviewState: "pending",
        createdAt: new Date("2026-03-19T08:00:00.000Z"),
        updatedAt: new Date("2026-03-19T09:00:00.000Z"),
      },
    ]);

    const items = await listRundenEntryItems();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: seedId.toHexString(),
      anlassraumId: roomId.toHexString(),
      title: "Mobilitaet Innenstadt",
      sourceKind: "output_seed_with_anlassraum",
      outputStatus: "review",
      lifecycle: "active",
      entryHref: `/create?mode=source&anlassraumId=${roomId.toHexString()}`,
    });
  });

  it("Scenario B: empty productive source returns explicit empty list", async () => {
    memory.seed("anlassraum", []);
    memory.seed("output_seed", []);

    await expect(listRundenEntryItems()).resolves.toEqual([]);
  });

  it("Scenario C: legacy/incomplete output record is normalized safely", async () => {
    const seedId = new ObjectId("65f000000000000000000021");

    memory.seed("output_seed", [
      {
        _id: seedId,
        outputType: "round_seed",
        status: "unknown_state",
        reviewState: null,
        publishTarget: "https://invalid-target.example",
        createdAt: "not-a-date",
        updatedAt: "2026-03-19T10:00:00.000Z",
      },
    ]);

    const items = await listRundenEntryItems();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: seedId.toHexString(),
      anlassraumId: null,
      outputStatus: "draft",
      reviewState: "pending",
      legacyIncomplete: true,
      sourceKind: "output_seed_legacy_incomplete",
      entryHref: "/create?mode=source",
    });
    expect(items[0].createdAt).toBeNull();
  });

  it("Scenario D: source failure is mapped to stable service error", async () => {
    memory.failOutputSeedReads();
    await expect(listRundenEntryItems()).rejects.toThrow("round_entry_source_unavailable");
  });
});
