import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { GovernanceActor } from "@features/trust/types";

const memory = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  let seq = 0;
  const collections = new Map<string, InMemoryCollection>();

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
    if (Array.isArray(filter.$or)) {
      const hit = filter.$or.some((entry: AnyDoc) => matchesFilter(doc, entry));
      if (!hit) return false;
    }
    for (const [key, condition] of Object.entries(filter)) {
      if (key === "$or") continue;
      const actual = deepGet(doc, key);
      if (condition && typeof condition === "object" && !Array.isArray(condition)) {
        const c = condition as AnyDoc;
        if ("$in" in c) {
          const arr = Array.isArray(c.$in) ? c.$in : [];
          if (!arr.some((v) => toKey(v) === toKey(actual))) return false;
          continue;
        }
        if ("$exists" in c) {
          const exists = actual !== undefined;
          if (exists !== Boolean(c.$exists)) return false;
          continue;
        }
        if ("$ne" in c) {
          if (toKey(actual) === toKey(c.$ne)) return false;
          continue;
        }
      }
      if (toKey(actual) !== toKey(condition)) return false;
    }
    return true;
  }

  function applyUpdate(doc: AnyDoc, update: AnyDoc, isInsert: boolean) {
    if (update.$set && typeof update.$set === "object") {
      for (const [key, value] of Object.entries(update.$set)) {
        deepSet(doc, key, value);
      }
    }
    if (isInsert && update.$setOnInsert && typeof update.$setOnInsert === "object") {
      for (const [key, value] of Object.entries(update.$setOnInsert)) {
        deepSet(doc, key, value);
      }
    }
  }

  class InMemoryCursor {
    private readonly docs: AnyDoc[];
    constructor(docs: AnyDoc[]) {
      this.docs = [...docs];
    }
    sort(spec: Record<string, 1 | -1>) {
      const fields = Object.entries(spec);
      this.docs.sort((a, b) => {
        for (const [field, dir] of fields) {
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
      return { acknowledged: true, insertedId: next._id };
    }

    async updateOne(filter: AnyDoc, update: AnyDoc, options: AnyDoc = {}) {
      const idx = this.docs.findIndex((doc) => matchesFilter(doc, filter));
      if (idx >= 0) {
        applyUpdate(this.docs[idx], update, false);
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
      }
      if (!options.upsert) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };

      const created: AnyDoc = { _id: new ObjectId() };
      for (const [key, value] of Object.entries(filter ?? {})) {
        if (key.startsWith("$")) continue;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const cond = value as AnyDoc;
          if ("$in" in cond || "$exists" in cond || "$ne" in cond) continue;
        }
        deepSet(created, key, value);
      }
      applyUpdate(created, update, true);
      this.docs.push(created);
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
    }
  }

  function getCollection(name: string) {
    const key = String(name || "");
    const hit = collections.get(key);
    if (hit) return hit;
    const created = new InMemoryCollection();
    collections.set(key, created);
    return created;
  }

  return {
    reset() {
      collections.clear();
      seq = 0;
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

import { applyFeedReviewAction, backfillVoteDraftAnlassraumAuthorized } from "@features/feeds/reviewQueue";

const adminActor: GovernanceActor = {
  userId: "admin-1",
  role: "admin",
  isAdmin: true,
  scopedOwnerIds: ["owner-1"],
  scopedEntityIds: ["entity-1"],
  personTrust: "institutional",
};

const reviewerActor: GovernanceActor = {
  userId: "reviewer-1",
  role: "reviewer",
  isAdmin: false,
  scopedOwnerIds: ["owner-1"],
  scopedEntityIds: ["entity-1"],
  personTrust: "verified",
};

function seedDraftBase(draftId: ObjectId, candidateId: ObjectId, analyzeResultId: ObjectId, overrides: Record<string, unknown> = {}) {
  memory.seed("vote_drafts", [
    {
      _id: draftId,
      statementCandidateId: candidateId,
      analyzeResultId,
      createdAt: new Date("2026-03-19T09:00:00.000Z"),
      updatedAt: new Date("2026-03-19T09:00:00.000Z"),
      title: "Legacy Draft",
      summary: "Legacy summary",
      claims: [{ id: "c1", text: "claim-1" }],
      status: "draft",
      pipeline: "feeds_to_statementCandidate",
      sourceUrl: "https://example.org/a",
      sourceLocale: "de",
      regionCode: "DE",
      feedReviewState: "queued",
      ...overrides,
    },
  ]);
}

function seedCandidateAndAnalyze(candidateId: ObjectId, analyzeResultId: ObjectId) {
  memory.seed("statement_candidates", [
    {
      _id: candidateId,
      id: "cand-1",
      sourceUrl: "https://example.org/a",
      sourceTitle: "Source title",
      sourceSummary: "Source summary",
      sourceContent: "Source content",
      sourceName: "Publisher A",
      sourceType: "news",
      regionCode: "DE",
      canonicalHash: "h1",
      createdAt: "2026-03-19T09:00:00.000Z",
      analyzeStatus: "success",
      analyzeResultId,
    },
  ]);
  memory.seed("analyze_results", [
    {
      _id: analyzeResultId,
      statementCandidateId: candidateId,
      mode: "E150",
      sourceText: "text",
      language: "de",
      claims: [{ id: "c1", text: "claim-1", topic: "mobility", domain: "city" }],
      notes: [{ id: "n1", text: "note", kind: "context" }],
      questions: [{ id: "q1", text: "question", dimension: "impact" }],
      knots: [],
      createdAt: new Date("2026-03-19T09:00:00.000Z"),
    },
  ]);
}

function seedExistingAnlassraum(roomId: ObjectId) {
  memory.seed("anlassraum", [
    {
      _id: roomId,
      entityId: new ObjectId(),
      type: "policy",
      title: "Existing Room",
      summary: "summary",
      slug: "existing-room",
      topicKey: "mobility",
      regionKey: "de",
      regionCode: "DE",
      scope: "national",
      decisionScope: "national",
      ownerType: "system",
      ownerId: "feed-review",
      stewardUserId: null,
      sourceMode: "manual",
      originType: "feed",
      status: "draft",
      maturity: "signal",
      roomType: "community",
      contentTrust: "unverified",
      parentAnlassraumId: null,
      dossierId: null,
      isPublic: false,
      createdBy: "system",
      reviewedBy: null,
      approvedBy: null,
      relevanceScore: 0.2,
      reviewMode: "standard",
      riskFlags: [],
      createdAt: new Date("2026-03-19T09:00:00.000Z"),
      updatedAt: new Date("2026-03-19T09:00:00.000Z"),
    },
  ]);
}

describe("feed legacy backfill service", () => {
  beforeEach(() => {
    memory.reset();
  });

  it("Scenario A: legacy draft attach writes link + audit metadata without publish side effects", async () => {
    const draftId = new ObjectId();
    const candidateId = new ObjectId();
    const analyzeResultId = new ObjectId();
    const roomId = new ObjectId();
    seedDraftBase(draftId, candidateId, analyzeResultId);
    seedCandidateAndAnalyze(candidateId, analyzeResultId);
    seedExistingAnlassraum(roomId);

    const result = await backfillVoteDraftAnlassraumAuthorized({
      actor: adminActor,
      draftId,
      mode: "attach",
      anlassraumId: roomId,
      reviewNote: "manual remediation attach",
    });

    expect(result.mode).toBe("attach");
    expect(result.remediationKind).toBe("attached_existing_anlassraum");
    expect(result.result.feedReviewState).toBe("attached");
    expect(result.result.draft.anlassraumId?.toHexString()).toBe(roomId.toHexString());
    expect(result.result.draft.lastReviewAction).toBe("attach_to_anlassraum");
    expect(result.result.draft.lastReviewActionBy).toBe("admin-1");
    expect(result.result.draft.reviewNote).toContain("[legacy-backfill]");
    expect(result.result.draft.status).toBe("review");

    const room = memory.read("anlassraum").find((entry) => String(entry._id) === String(roomId));
    expect(room?.isPublic).toBe(false);
  });

  it("Scenario B: create_candidate creates room, links draft, remains non-published", async () => {
    const draftId = new ObjectId();
    const candidateId = new ObjectId();
    const analyzeResultId = new ObjectId();
    seedDraftBase(draftId, candidateId, analyzeResultId);
    seedCandidateAndAnalyze(candidateId, analyzeResultId);

    const result = await backfillVoteDraftAnlassraumAuthorized({
      actor: adminActor,
      draftId,
      mode: "create_candidate",
      reviewNote: "manual remediation create",
    });

    expect(result.mode).toBe("create_candidate");
    expect(result.remediationKind).toBe("created_candidate_anlassraum");
    expect(result.result.createdAnlassraum).toBe(true);
    expect(result.result.anlassraumId).toBeTruthy();
    expect(result.result.feedReviewState).toBe("candidate_created");
    expect(result.result.draft.reviewNote).toContain("[legacy-backfill]");
    expect(result.result.draft.status).toBe("review");

    const createdRoom = memory
      .read("anlassraum")
      .find((entry) => String(entry._id) === String(result.result.anlassraumId));
    expect(createdRoom).toBeTruthy();
    expect(createdRoom?.isPublic).toBe(false);
    expect(createdRoom?.status).toBe("draft");
  });

  it("prioritizes attach_to_existing_anlassraum when create_candidate is requested on already linked drafts", async () => {
    const draftId = new ObjectId();
    const candidateId = new ObjectId();
    const analyzeResultId = new ObjectId();
    const roomId = new ObjectId();
    seedDraftBase(draftId, candidateId, analyzeResultId, { anlassraumId: roomId });
    seedCandidateAndAnalyze(candidateId, analyzeResultId);
    seedExistingAnlassraum(roomId);

    const result = await applyFeedReviewAction({
      actor: adminActor,
      draftId,
      action: "create_anlassraum_candidate",
    });

    expect(result.feedReviewState).toBe("attached");
    expect(result.createdAnlassraum).toBe(false);
    expect(result.anlassraumId?.toHexString()).toBe(roomId.toHexString());
    expect(result.draft.lastReviewAction).toBe("attach_to_anlassraum");
    expect(memory.read("anlassraum")).toHaveLength(1);
  });

  it("Scenario C: already linked draft backfill retry is blocked", async () => {
    const draftId = new ObjectId();
    const candidateId = new ObjectId();
    const analyzeResultId = new ObjectId();
    seedDraftBase(draftId, candidateId, analyzeResultId, { anlassraumId: new ObjectId() });
    seedCandidateAndAnalyze(candidateId, analyzeResultId);

    await expect(
      backfillVoteDraftAnlassraumAuthorized({
        actor: adminActor,
        draftId,
        mode: "create_candidate",
      }),
    ).rejects.toThrow("draft_already_has_anlassraum");
  });

  it("Scenario C2: attach mode requires explicit target anlassraumId", async () => {
    const draftId = new ObjectId();
    const candidateId = new ObjectId();
    const analyzeResultId = new ObjectId();
    seedDraftBase(draftId, candidateId, analyzeResultId);
    seedCandidateAndAnalyze(candidateId, analyzeResultId);

    await expect(
      backfillVoteDraftAnlassraumAuthorized({
        actor: adminActor,
        draftId,
        mode: "attach",
      }),
    ).rejects.toThrow("anlassraum_id_required");
  });

  it("Scenario D: non-admin actor cannot use legacy remediation", async () => {
    const draftId = new ObjectId();
    const candidateId = new ObjectId();
    const analyzeResultId = new ObjectId();
    seedDraftBase(draftId, candidateId, analyzeResultId);
    seedCandidateAndAnalyze(candidateId, analyzeResultId);

    await expect(
      backfillVoteDraftAnlassraumAuthorized({
        actor: reviewerActor,
        draftId,
        mode: "create_candidate",
      }),
    ).rejects.toThrow("forbidden_legacy_backfill_requires_admin");
  });
});
