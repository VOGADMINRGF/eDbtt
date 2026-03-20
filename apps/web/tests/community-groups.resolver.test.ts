import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const memory = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  const users: AnyDoc[] = [];
  const requests: AnyDoc[] = [];
  const statements: AnyDoc[] = [];
  const dossiers: AnyDoc[] = [];
  let failReads = false;
  let mutationCalls = 0;

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const asHex = (value as { toHexString?: () => string }).toHexString;
      if (typeof asHex === "function") return asHex.call(value);
    }
    return String(value ?? "");
  }

  class Cursor {
    private docs: AnyDoc[];
    constructor(docs: AnyDoc[]) {
      this.docs = [...docs];
    }
    sort(spec: Record<string, 1 | -1>) {
      const [field, dir] = Object.entries(spec)[0] ?? [];
      if (!field) return this;
      this.docs.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av === bv) return 0;
        if (av < bv) return dir === 1 ? -1 : 1;
        return dir === 1 ? 1 : -1;
      });
      return this;
    }
    limit(n: number) {
      this.docs = this.docs.slice(0, Math.max(0, Number(n) || 0));
      return this;
    }
    async toArray() {
      return [...this.docs];
    }
  }

  return {
    reset() {
      users.length = 0;
      requests.length = 0;
      statements.length = 0;
      dossiers.length = 0;
      failReads = false;
      mutationCalls = 0;
    },
    seedUsers(rows: AnyDoc[]) {
      users.push(...rows.map((row) => ({ ...row })));
    },
    seedRequests(rows: AnyDoc[]) {
      requests.push(...rows.map((row) => ({ ...row })));
    },
    seedStatements(rows: AnyDoc[]) {
      statements.push(...rows.map((row) => ({ ...row })));
    },
    seedDossiers(rows: AnyDoc[]) {
      dossiers.push(...rows.map((row) => ({ ...row })));
    },
    forceReadFailure() {
      failReads = true;
    },
    mutationCalls() {
      return mutationCalls;
    },
    async coreCol(name: string) {
      if (failReads) throw new Error("forced_core_failure");
      if (name === "users") {
        return {
          async findOne(filter: AnyDoc) {
            const wanted = toKey(filter?._id);
            return users.find((row) => toKey(row._id) === wanted) ?? null;
          },
          find(filter: AnyDoc) {
            let rows = [...users];
            const excluded = toKey(filter?._id?.$ne);
            if (excluded) rows = rows.filter((row) => toKey(row._id) !== excluded);
            const topicKey = filter?.$and?.find?.((entry: AnyDoc) => entry?.["profile.topTopics.key"])?.[
              "profile.topTopics.key"
            ];
            if (topicKey) {
              rows = rows.filter((row) =>
                Array.isArray(row?.profile?.topTopics)
                  ? row.profile.topTopics.some((topic: AnyDoc) => String(topic?.key) === String(topicKey))
                  : false,
              );
            }
            return new Cursor(rows);
          },
          async insertOne() {
            mutationCalls += 1;
            return { acknowledged: true };
          },
          async updateOne() {
            mutationCalls += 1;
            return { acknowledged: true };
          },
        };
      }
      if (name === "social_friend_requests") {
        return {
          find() {
            return new Cursor(requests);
          },
          async insertOne() {
            mutationCalls += 1;
            return { acknowledged: true };
          },
          async updateOne() {
            mutationCalls += 1;
            return { acknowledged: true };
          },
        };
      }
      throw new Error(`unexpected_core_collection_${name}`);
    },
    async feedStatementsCol() {
      if (failReads) throw new Error("forced_feed_failure");
      return {
        find(filter: AnyDoc) {
          const rows = statements.filter((row) => {
            if (filter?.status && row.status !== filter.status) return false;
            return true;
          });
          return new Cursor(rows);
        },
      };
    },
    async dossiersCol() {
      if (failReads) throw new Error("forced_dossier_failure");
      return {
        async findOne(filter: AnyDoc) {
          if (filter?.dossierId) {
            return dossiers.find((row) => String(row.dossierId) === String(filter.dossierId)) ?? null;
          }
          if (filter?.title instanceof RegExp) {
            return dossiers.find((row) => filter.title.test(String(row.title ?? ""))) ?? null;
          }
          return null;
        },
      };
    },
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    coreCol: (...args: unknown[]) => memory.coreCol(...(args as [string])),
  };
});

vi.mock("@features/feeds/db", () => ({
  feedStatementsCol: () => memory.feedStatementsCol(),
}));

vi.mock("@features/dossier/db", () => ({
  dossiersCol: () => memory.dossiersCol(),
}));

import { resolveCommunityGroupSurface } from "@/features/community/groupSurface";

describe("community group resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memory.reset();
  });

  it("Scenario A: productive group read returns normalized items", async () => {
    const viewerId = new ObjectId("65f100000000000000000001");
    const memberId = new ObjectId("65f100000000000000000002");
    memory.seedUsers([
      {
        _id: viewerId,
        profile: { displayName: "Viewer", topTopics: [{ key: "mobility", title: "Mobilitaet" }] },
      },
      {
        _id: memberId,
        name: "Member One",
        profile: {
          displayName: "Member One",
          topTopics: [{ key: "mobility", title: "Mobilitaet" }],
          publicLocation: { city: "Berlin", region: "Berlin" },
        },
      },
    ]);
    memory.seedStatements([
      {
        _id: new ObjectId("65f100000000000000000011"),
        status: "readyForLive",
        title: "Mobilitaet Innenstadt",
        summary: "Kurzsummary",
        createdAt: new Date("2026-03-19T08:00:00.000Z"),
      },
    ]);
    memory.seedDossiers([
      {
        dossierId: "dossier-001",
        title: "Mobilitaet Berlin",
        status: "active",
      },
    ]);

    const result = await resolveCommunityGroupSurface({
      searchParams: {
        group: "mobility-berlin",
        topicKey: "mobility",
        topicLabel: "Mobilitaet",
        dossierId: "dossier-001",
      },
      viewerId: viewerId.toHexString(),
    });

    expect(result.mode).toBe("group");
    if (result.mode !== "group") return;
    expect(result.members).toHaveLength(1);
    expect(result.statements).toHaveLength(1);
    expect(result.dossierHref).toBe("/dossier/dossier-001");
    expect(result.source.unavailable).toBe(false);
    expect(memory.mutationCalls()).toBe(0);
  });

  it("Scenario B: empty productive read returns explicit empty data without fallback dataset", async () => {
    const result = await resolveCommunityGroupSurface({
      searchParams: {
        group: "energy-local",
        topicKey: "energy",
        topicLabel: "Energie",
      },
      viewerId: null,
    });

    expect(result.mode).toBe("group");
    if (result.mode !== "group") return;
    expect(result.members).toEqual([]);
    expect(result.statements).toEqual([]);
    expect(result.dossier).toBeNull();
    expect(result.dossierHref).toBeNull();
  });

  it("Scenario B: legacy alias links are normalized and resolved safely", async () => {
    const result = await resolveCommunityGroupSurface({
      searchParams: {
        group: "mobility-berlin",
        type: "regional_group",
        scope: "regional",
        topic: "mobility",
        dossier: "dossier-legacy",
        region: "Berlin",
        reason: "Legacy Link",
      },
      viewerId: null,
    });

    expect(result.mode).toBe("group");
    if (result.mode !== "group") return;
    expect(result.context.topicKey).toBe("mobility");
    expect(result.context.dossierId).toBe("dossier-legacy");
    expect(result.context.regionLabel).toBe("Berlin");
    expect(result.context.reasonLabel).toBe("Legacy Link");
  });

  it("Scenario C: source failure sets explicit unavailable state", async () => {
    memory.forceReadFailure();

    const result = await resolveCommunityGroupSurface({
      searchParams: {
        group: "energy-local",
        topicKey: "energy",
      },
      viewerId: new ObjectId("65f100000000000000000099").toHexString(),
    });

    expect(result.mode).toBe("group");
    if (result.mode !== "group") return;
    expect(result.source).toMatchObject({
      unavailable: true,
      error: "community_group_source_unavailable",
    });
    expect(result.members).toEqual([]);
    expect(result.statements).toEqual([]);
    expect(result.dossier).toBeNull();
  });

  it("Scenario E: discovery mode remains read-only and does not call mutation paths", async () => {
    const viewerId = new ObjectId("65f100000000000000000077");
    memory.seedUsers([
      {
        _id: viewerId,
        profile: {
          displayName: "Viewer",
          topTopics: [{ key: "mobility", title: "Mobilitaet" }],
          publicLocation: { city: "Berlin", region: "Berlin" },
        },
      },
    ]);

    const result = await resolveCommunityGroupSurface({
      searchParams: {},
      viewerId: viewerId.toHexString(),
    });

    expect(result.mode).toBe("discovery");
    if (result.mode !== "discovery") return;
    expect(result.groups.length).toBeGreaterThan(0);
    const groupHref = result.groups.find((entry) => entry.key !== "founder-channel")?.href ?? "";
    expect(groupHref).toContain("topicKey=");
    expect(groupHref).not.toContain("topic=");
    expect(memory.mutationCalls()).toBe(0);
  });
});
