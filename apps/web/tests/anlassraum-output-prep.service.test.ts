import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { GovernanceActor } from "@features/trust/types";

const memory = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  const collections = new Map<string, InMemoryCollection>();

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const asHex = (value as { toHexString?: () => string }).toHexString;
      if (typeof asHex === "function") return asHex.call(value);
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

  function deepSet(obj: AnyDoc, path: string, value: unknown) {
    const parts = path.split(".");
    let cursor: AnyDoc = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
      cursor = cursor[key] as AnyDoc;
    }
    cursor[parts[parts.length - 1]] = value;
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

    all() {
      return this.docs.map((item) => ({ ...item }));
    }

    find(filter: AnyDoc = {}) {
      return new InMemoryCursor(this.docs.filter((doc) => matchesFilter(doc, filter)));
    }

    async findOne(filter: AnyDoc = {}) {
      const hit = this.docs.find((doc) => matchesFilter(doc, filter));
      return hit ? { ...hit } : null;
    }

    async updateOne(filter: AnyDoc, update: AnyDoc) {
      const idx = this.docs.findIndex((doc) => matchesFilter(doc, filter));
      if (idx < 0) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      const target = this.docs[idx];
      if (update.$set && typeof update.$set === "object") {
        for (const [key, value] of Object.entries(update.$set)) {
          deepSet(target, key, value);
        }
      }
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    }
  }

  function getCollection(name: string) {
    const key = String(name || "");
    const existing = collections.get(key);
    if (existing) return existing;
    const created = new InMemoryCollection();
    collections.set(key, created);
    return created;
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
    default: {
      ObjectId: mongodb.ObjectId,
      coreCol: async (name: string) => memory.getCollection(name),
    },
  };
});

import { transitionOutputSeedAuthorized } from "@features/anlassraum/outputPrep";

const reviewerActor: GovernanceActor = {
  userId: "reviewer-1",
  role: "reviewer",
  isAdmin: false,
  scopedOwnerIds: ["owner-1"],
  scopedEntityIds: ["entity-1"],
  personTrust: "verified",
};

const institutionalApprover: GovernanceActor = {
  userId: "inst-approver-1",
  role: "institutional_actor",
  isAdmin: false,
  scopedOwnerIds: ["owner-1"],
  scopedEntityIds: ["entity-1"],
  personTrust: "institutional",
};

const institutionalOutOfScope: GovernanceActor = {
  userId: "inst-outscope-1",
  role: "institutional_actor",
  isAdmin: false,
  scopedOwnerIds: ["owner-x"],
  scopedEntityIds: ["entity-1"],
  personTrust: "institutional",
};

function seedRoom(
  roomId: ObjectId,
  overrides: Record<string, unknown> = {},
) {
  memory.seed("anlassraum", [
    {
      _id: roomId,
      entityId: new ObjectId(),
      type: "policy",
      title: "Room",
      summary: "Summary",
      slug: "room-slug",
      topicKey: "mobility",
      regionKey: "de-berlin",
      scope: "local",
      decisionScope: "local",
      ownerType: "organization",
      ownerId: "owner-1",
      stewardUserId: null,
      sourceMode: "manual",
      originType: "manual",
      status: "approved",
      maturity: "signal",
      roomType: "official",
      contentTrust: "checked",
      parentAnlassraumId: null,
      dossierId: null,
      isPublic: false,
      createdBy: "u1",
      reviewedBy: "reviewer-1",
      approvedBy: "inst-approver-1",
      relevanceScore: 1,
      reviewMode: "standard",
      riskFlags: [],
      createdAt: new Date("2026-03-19T09:00:00.000Z"),
      updatedAt: new Date("2026-03-19T09:00:00.000Z"),
      ...overrides,
    },
  ]);
}

function seedGateEvidence(roomId: ObjectId) {
  memory.seed("anlassraum_source_links", [
    {
      _id: new ObjectId(),
      anlassraumId: roomId,
      sourceWeight: 1,
      role: "primary",
      publisher: "pub-a",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      anlassraumId: roomId,
      sourceWeight: 1,
      role: "supporting",
      publisher: "pub-b",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  memory.seed("anlassraum_structure", [
    {
      _id: new ObjectId(),
      anlassraumId: roomId,
      claims: [{ id: "claim-1" }],
      notes: [],
      questions: [],
      knots: [],
      segments: [],
      actors: [],
      riskFlags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

function seedOutput(
  roomId: ObjectId,
  seedId: ObjectId,
  status: "draft" | "queued" | "review" | "ready" | "published" | "discarded",
  reviewState: "pending" | "approved" | "rejected",
) {
  memory.seed("output_seed", [
    {
      _id: seedId,
      anlassraumId: roomId,
      outputType: "round_seed",
      status,
      reviewState,
      publishTarget: null,
      createdAt: new Date("2026-03-19T09:00:00.000Z"),
      updatedAt: new Date("2026-03-19T09:00:00.000Z"),
    },
  ]);
}

function outputDoc() {
  return memory.read("output_seed")[0] ?? null;
}

describe("outputPrep service integration", () => {
  beforeEach(() => {
    memory.reset();
  });

  it("Scenario A: draft -> review -> approved -> ready works in sequence", async () => {
    const roomId = new ObjectId();
    const seedId = new ObjectId();
    seedRoom(roomId);
    seedGateEvidence(roomId);
    seedOutput(roomId, seedId, "draft", "pending");

    await transitionOutputSeedAuthorized({
      anlassraumId: roomId,
      seedId,
      action: "send_to_review",
      actor: reviewerActor,
    });

    expect(outputDoc()).toMatchObject({
      status: "review",
      reviewState: "pending",
      lastAction: "send_to_review",
    });

    await transitionOutputSeedAuthorized({
      anlassraumId: roomId,
      seedId,
      action: "approve_prep",
      actor: institutionalApprover,
    });

    expect(outputDoc()).toMatchObject({
      status: "review",
      reviewState: "approved",
      lastAction: "approve_prep",
    });

    await transitionOutputSeedAuthorized({
      anlassraumId: roomId,
      seedId,
      action: "mark_ready",
      actor: institutionalApprover,
    });

    expect(outputDoc()).toMatchObject({
      status: "ready",
      reviewState: "approved",
      lastAction: "mark_ready",
      lastActionBy: "inst-approver-1",
    });
  });

  it("Scenario B: gate failure blocks mark_ready and keeps state unchanged", async () => {
    const roomId = new ObjectId();
    const seedId = new ObjectId();
    seedRoom(roomId);
    seedOutput(roomId, seedId, "review", "approved");

    await expect(
      transitionOutputSeedAuthorized({
        anlassraumId: roomId,
        seedId,
        action: "mark_ready",
        actor: institutionalApprover,
      }),
    ).rejects.toThrow(/publish_gate_failed/);

    expect(outputDoc()).toMatchObject({
      status: "review",
      reviewState: "approved",
    });
  });

  it("Scenario C: publish without approved reviewState is blocked", async () => {
    const roomId = new ObjectId();
    const seedId = new ObjectId();
    seedRoom(roomId);
    seedGateEvidence(roomId);
    seedOutput(roomId, seedId, "ready", "pending");

    await expect(
      transitionOutputSeedAuthorized({
        anlassraumId: roomId,
        seedId,
        action: "publish",
        actor: institutionalApprover,
        publishTarget: "public_feed",
      }),
    ).rejects.toThrow("output_seed_review_not_approved");

    expect(outputDoc()).toMatchObject({
      status: "ready",
      reviewState: "pending",
      publishTarget: null,
    });
  });

  it("Scenario D: publish from invalid status is blocked", async () => {
    const roomId = new ObjectId();
    const seedId = new ObjectId();
    seedRoom(roomId);
    seedGateEvidence(roomId);
    seedOutput(roomId, seedId, "draft", "approved");

    await expect(
      transitionOutputSeedAuthorized({
        anlassraumId: roomId,
        seedId,
        action: "publish",
        actor: institutionalApprover,
        publishTarget: "public_feed",
      }),
    ).rejects.toThrow("invalid_transition_from_status:draft");
  });

  it("Scenario E: non-approver and out-of-scope actors cannot approve/publish", async () => {
    const roomId = new ObjectId();
    const seedId = new ObjectId();
    seedRoom(roomId);
    seedGateEvidence(roomId);
    seedOutput(roomId, seedId, "review", "pending");

    await expect(
      transitionOutputSeedAuthorized({
        anlassraumId: roomId,
        seedId,
        action: "approve_prep",
        actor: reviewerActor,
      }),
    ).rejects.toThrow("actor_cannot_approve_prep");

    memory.seed("output_seed", [
      {
        _id: seedId,
        anlassraumId: roomId,
        outputType: "round_seed",
        status: "ready",
        reviewState: "approved",
        publishTarget: null,
        createdAt: new Date("2026-03-19T09:00:00.000Z"),
        updatedAt: new Date("2026-03-19T09:00:00.000Z"),
      },
    ]);

    await expect(
      transitionOutputSeedAuthorized({
        anlassraumId: roomId,
        seedId,
        action: "publish",
        actor: institutionalOutOfScope,
        publishTarget: "public_feed",
      }),
    ).rejects.toThrow("actor_cannot_approve_prep");
  });
});
