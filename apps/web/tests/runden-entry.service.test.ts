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
        ownerType: "media",
        ownerId: "org-media-1",
        stewardUserId: "65f000000000000000000901",
        createdBy: "65f000000000000000000902",
        topicKey: "mobility",
        type: "policy",
        sourceMode: "feed",
        status: "reviewed",
        isPublic: true,
      },
    ]);

    memory.seed("output_seed", [
      {
        _id: seedId,
        anlassraumId: roomId,
        outputType: "round_seed",
        status: "review",
        reviewState: "pending",
        publishTarget: "/round/mobilitaet-innenstadt",
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
      ownerType: "media",
      ownerId: "org-media-1",
      stewardUserId: "65f000000000000000000901",
      createdBy: "65f000000000000000000902",
      isPublic: true,
      outputStatus: "review",
      lifecycle: "active",
      finished: false,
      intakeHref: `/create?mode=source&anlassraumId=${roomId.toHexString()}`,
      operatingHref: `/round/mobilitaet-innenstadt?anlassraumId=${roomId.toHexString()}`,
      resultsHref: null,
      entryHref: `/round/mobilitaet-innenstadt?anlassraumId=${roomId.toHexString()}`,
      shareActions: {
        contextKind: "runde",
        primaryTargetKind: "round_operating_target",
        socialCandidate: false,
        needsReviewBeforeOfficialSocial: true,
      },
    });
    expect(items[0]?.shareActions?.canonicalTarget).toContain("/round/mobilitaet-innenstadt");
    expect(items[0]?.shareActions?.qrTarget).toContain("/round/mobilitaet-innenstadt");
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
      isPublic: null,
      outputStatus: "draft",
      reviewState: "pending",
      legacyIncomplete: true,
      sourceKind: "output_seed_legacy_incomplete",
      intakeHref: null,
      operatingHref: null,
      resultsHref: null,
      entryHref: null,
    });
    expect(items[0].createdAt).toBeNull();
  });

  it("Scenario D: non-public room ignores publish target and stays room-scoped", async () => {
    const roomId = new ObjectId("65f000000000000000000031");
    const seedId = new ObjectId("65f000000000000000000041");

    memory.seed("anlassraum", [
      {
        _id: roomId,
        title: "Nicht öffentliche Sitzung",
        summary: "Interner Anlassraum",
        type: "event",
        sourceMode: "manual",
        status: "active",
        isPublic: false,
      },
    ]);

    memory.seed("output_seed", [
      {
        _id: seedId,
        anlassraumId: roomId,
        outputType: "round_seed",
        status: "review",
        reviewState: "pending",
        publishTarget: "/round/interne-sitzung",
        updatedAt: new Date("2026-03-19T11:00:00.000Z"),
      },
    ]);

    const items = await listRundenEntryItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: seedId.toHexString(),
      anlassraumId: roomId.toHexString(),
      isPublic: false,
      intakeHref: `/create?mode=source&anlassraumId=${roomId.toHexString()}`,
      operatingHref: `/anlassraum?anlassraumId=${roomId.toHexString()}`,
      resultsHref: null,
      entryHref: `/create?mode=source&anlassraumId=${roomId.toHexString()}`,
      shareActions: null,
    });
  });

  it("Scenario E: closed public round exposes stable results href and finished metadata", async () => {
    const roomId = new ObjectId("65f000000000000000000051");
    const seedId = new ObjectId("65f000000000000000000061");

    memory.seed("anlassraum", [
      {
        _id: roomId,
        title: "Fernwaerme Ausbau",
        summary: "Abgeschlossener Anlass",
        type: "policy",
        sourceMode: "manual",
        status: "published",
        isPublic: true,
      },
    ]);

    memory.seed("output_seed", [
      {
        _id: seedId,
        anlassraumId: roomId,
        outputType: "round_seed",
        status: "published",
        reviewState: "approved",
        publishTarget: "/round/fernwaerme-ausbau",
        updatedAt: new Date("2026-03-21T13:00:00.000Z"),
      },
    ]);

    const items = await listRundenEntryItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: seedId.toHexString(),
      lifecycle: "closed",
      finished: true,
      resultsHref: `/round/fernwaerme-ausbau?anlassraumId=${roomId.toHexString()}`,
      shareActions: {
        contextKind: "ergebnis",
        primaryTargetKind: "round_results_target",
        socialCandidate: true,
        needsReviewBeforeOfficialSocial: true,
      },
    });
    expect(items[0].finishedAt).toBe("2026-03-21T13:00:00.000Z");
  });

  it("Scenario F: source failure is mapped to stable service error", async () => {
    memory.failOutputSeedReads();
    await expect(listRundenEntryItems()).rejects.toThrow("round_entry_source_unavailable");
  });
});
