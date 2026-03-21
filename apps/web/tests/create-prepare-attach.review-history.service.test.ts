import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  const drafts: Array<Record<string, unknown>> = [];
  const historyEvents: Array<Record<string, unknown>> = [];

  const sameId = (left: unknown, right: unknown) => {
    const l = left instanceof ObjectId ? left.toHexString() : String(left || "");
    const r = right instanceof ObjectId ? right.toHexString() : String(right || "");
    return l === r;
  };

  const compare = (actual: unknown, condition: Record<string, unknown>) => {
    const toComparable = (value: unknown) => {
      if (value instanceof ObjectId) return value.toHexString();
      return String(value || "");
    };
    if ("$in" in condition) {
      const set = (condition.$in as unknown[]) ?? [];
      return set.some((entry) => toComparable(entry) === toComparable(actual));
    }
    if ("$exists" in condition) {
      const shouldExist = Boolean(condition.$exists);
      return shouldExist ? actual !== undefined : actual === undefined;
    }
    if ("$lt" in condition) {
      return toComparable(actual) < toComparable(condition.$lt);
    }
    if ("$gt" in condition) {
      return toComparable(actual) > toComparable(condition.$gt);
    }
    return false;
  };

  const matches = (doc: Record<string, unknown>, filter: Record<string, unknown>): boolean =>
    Object.entries(filter).every(([key, value]) => {
      if (key === "$and" && Array.isArray(value)) {
        return value.every((entry) => matches(doc, entry as Record<string, unknown>));
      }
      if (key === "$or" && Array.isArray(value)) {
        return value.some((entry) => matches(doc, entry as Record<string, unknown>));
      }
      if (key === "_id") {
        if (
          value &&
          typeof value === "object" &&
          ("$in" in (value as Record<string, unknown>) ||
            "$exists" in (value as Record<string, unknown>) ||
            "$lt" in (value as Record<string, unknown>) ||
            "$gt" in (value as Record<string, unknown>))
        ) {
          return compare(doc._id, value as Record<string, unknown>);
        }
        return sameId(doc._id, value);
      }
      if (value && typeof value === "object") {
        return compare(doc[key], value as Record<string, unknown>);
      }
      if (value instanceof RegExp) {
        return value.test(String(doc[key] || ""));
      }
      return doc[key] === value;
    });

  const makeCursor = (rows: Array<Record<string, unknown>>) => {
    let current = rows.map((entry) => ({ ...entry }));
    return {
      sort(spec: Record<string, 1 | -1>) {
        if ("createdAt" in spec || "_id" in spec) {
          const direction = spec.createdAt;
          current.sort((a, b) =>
            direction === -1
              ? String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
              : String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
          );
          if ("_id" in spec) {
            const dir = spec._id;
            current.sort((a, b) => {
              const byCreated =
                direction === -1
                  ? String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
                  : String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
              if (byCreated !== 0) return byCreated;
              const aId = a._id instanceof ObjectId ? a._id.toHexString() : String(a._id || "");
              const bId = b._id instanceof ObjectId ? b._id.toHexString() : String(b._id || "");
              return dir === -1 ? bId.localeCompare(aId) : aId.localeCompare(bId);
            });
          }
        }
        return this;
      },
      skip(value: number) {
        current = current.slice(Math.max(0, Number(value) || 0));
        return this;
      },
      limit(value: number) {
        current = current.slice(0, Math.max(0, Number(value) || 0));
        return this;
      },
      async toArray() {
        return current.map((entry) => ({ ...entry }));
      },
    };
  };

  return {
    reset() {
      drafts.length = 0;
      historyEvents.length = 0;
    },
    seedDraft(doc: Record<string, unknown>) {
      drafts.push({ ...doc });
    },
    seedHistoryEvent(doc: Record<string, unknown>) {
      historyEvents.push({ ...doc });
    },
    readHistoryEvents() {
      return historyEvents.map((entry) => ({ ...entry }));
    },
    getCol: vi.fn(async (name: string) => {
      if (name === "create_prepare_attach_drafts") {
        return {
          async createIndex() {
            return "ok";
          },
          async countDocuments(filter: Record<string, unknown>) {
            return drafts.filter((entry) => matches(entry, filter)).length;
          },
          find(filter: Record<string, unknown>) {
            return makeCursor(drafts.filter((entry) => matches(entry, filter)));
          },
          async findOne(filter: Record<string, unknown>) {
            const hit = drafts.find((entry) => matches(entry, filter));
            return hit ? { ...hit } : null;
          },
          async updateOne(filter: Record<string, unknown>, update: Record<string, any>) {
            const idx = drafts.findIndex((entry) => matches(entry, filter));
            if (idx < 0) return { matchedCount: 0, modifiedCount: 0 };
            const setValues = update?.$set ?? {};
            drafts[idx] = { ...drafts[idx], ...setValues };
            return { matchedCount: 1, modifiedCount: 1 };
          },
        };
      }
      if (name === "create_prepare_attach_history_events") {
        return {
          async createIndex() {
            return "ok";
          },
          find(filter: Record<string, unknown>) {
            return makeCursor(historyEvents.filter((entry) => matches(entry, filter)));
          },
          async insertOne(doc: Record<string, unknown>) {
            historyEvents.push({ ...doc, _id: new ObjectId() });
            return { acknowledged: true };
          },
        };
      }
      throw new Error(`unexpected_collection_${name}`);
    }),
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

import {
  getCreatePrepareAttachDraftHistory,
  listCreatePrepareAttachDraftQueue,
  reviewCreatePrepareAttachDraft,
} from "@/features/create/attachDraftReviewQueue";

const actor = {
  userId: "u-review",
  role: "reviewer",
  isAdmin: false,
  scopedOwnerIds: ["owner-1"],
  scopedEntityIds: ["owner-1"],
  personTrust: "verified",
} as const;

function seedDraft(overrides?: Record<string, unknown>) {
  const _id = new ObjectId();
  mocks.seedDraft({
    _id,
    draftId: _id.toHexString(),
    version: 1,
    authorId: "u-author",
    status: "draft_intent",
    schemaVersion: "create_prepare_attach_draft.v1",
    sourceRunId: "run-1",
    ctaId: "perspektive_anhaengen",
    matchType: "related_claim",
    matchEntityType: "claim",
    attachTargetType: "claim",
    attachTargetId: "65f000000000000000000011",
    attachTargetRef: "/swipes?statementId=65f000000000000000000011",
    attachTargetLabel: "Claim A",
    sourceSummary: "summary",
    selectedReason: "reason",
    reasons: ["reason"],
    sourceLanguage: "de",
    contentLanguage: "de",
    uiLocale: "de",
    requiresReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    originPreserved: true,
    duplicateRisk: false,
    reviewState: "pending",
    applyState: "not_applied",
    reviewNote: null,
    reviewedAt: null,
    reviewedBy: null,
    appliedAt: null,
    appliedBy: null,
    applyNote: null,
    applyError: null,
    userConfirmedAt: "2026-03-20T09:00:00.000Z",
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T09:00:00.000Z",
    ...overrides,
  });
  return _id.toHexString();
}

describe("create prepare-attach review/apply history service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("writes append-only review history events with canonical schema", async () => {
    const draftId = seedDraft();
    const updated = await reviewCreatePrepareAttachDraft({
      actor: actor as any,
      draftId,
      decision: "accepted_for_apply",
      reviewNote: "manuell pruefen",
    });

    expect(updated.reviewState).toBe("accepted_for_apply");
    expect(updated.applyState).toBe("not_applied");
    expect(updated.version).toBe(2);
    const events = mocks.readHistoryEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "review",
      draftId,
      actorUserId: "u-review",
      previousReviewState: "pending",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
      resultCode: "review_state_changed",
      reviewNote: "manuell pruefen",
    });
  });

  it("hydrates review/apply history in queue reads from unified event log", async () => {
    const draftId = seedDraft({
      reviewState: "accepted_for_apply",
      applyState: "apply_failed",
      version: 3,
      reviewedBy: "u-review",
      reviewedAt: "2026-03-20T11:00:00.000Z",
      applyError: "attach_target_not_found",
      updatedAt: "2026-03-20T11:30:00.000Z",
    });
    mocks.seedHistoryEvent({
      _id: new ObjectId(),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "review",
      eventId: "r1",
      draftId,
      actorUserId: "u-review",
      previousReviewState: "pending",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
      reviewNote: "ok",
      resultCode: "review_state_changed",
      createdAt: "2026-03-20T11:00:00.000Z",
    });
    mocks.seedHistoryEvent({
      _id: new ObjectId(),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "apply",
      eventId: "a1",
      draftId,
      actorUserId: "u-review",
      targetType: "claim",
      targetId: "65f000000000000000000011",
      result: "failed",
      mutationType: null,
      errorCode: "attach_target_not_found",
      applyNote: "retry",
      resultCode: "apply_failed_target_not_found",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "apply_failed",
      createdAt: "2026-03-20T11:30:00.000Z",
    });

    const result = await listCreatePrepareAttachDraftQueue({
      actor: actor as any,
      reviewState: "all",
      page: 1,
      pageSize: 20,
      q: "",
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].version).toBe(3);
    expect(result.items[0].reviewEvents?.[0]).toMatchObject({
      eventType: "review",
      previousReviewState: "pending",
      nextReviewState: "accepted_for_apply",
      resultCode: "review_state_changed",
    });
    expect(result.items[0].applyEvents?.[0]).toMatchObject({
      eventType: "apply",
      result: "failed",
      errorCode: "attach_target_not_found",
      resultCode: "apply_failed_target_not_found",
      previousApplyState: "not_applied",
      nextApplyState: "apply_failed",
    });
  });

  it("returns chronologically sorted timeline for draft history read", async () => {
    const draftId = seedDraft({
      reviewState: "accepted_for_apply",
      applyState: "apply_failed",
      version: 3,
    });
    mocks.seedHistoryEvent({
      _id: new ObjectId(),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "apply",
      eventId: "a1",
      draftId,
      actorUserId: "u-review",
      targetType: "claim",
      targetId: "65f000000000000000000011",
      result: "failed",
      mutationType: null,
      errorCode: "attach_target_not_found",
      applyNote: null,
      resultCode: "apply_failed_target_not_found",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "apply_failed",
      createdAt: "2026-03-20T11:30:00.000Z",
    });
    mocks.seedHistoryEvent({
      _id: new ObjectId(),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "review",
      eventId: "r1",
      draftId,
      actorUserId: "u-review",
      previousReviewState: "pending",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
      reviewNote: "ok",
      resultCode: "review_state_changed",
      createdAt: "2026-03-20T11:00:00.000Z",
    });

    const result = await getCreatePrepareAttachDraftHistory({
      actor: actor as any,
      draftId,
      limit: 20,
      type: "all",
    });

    expect(result.events.map((event) => event.eventType)).toEqual(["apply", "review"]);
    expect(result.latestEvent?.eventType).toBe("apply");
    expect(result.draft.version).toBe(3);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("supports deterministic cursor pagination with type filters", async () => {
    const draftId = seedDraft({ version: 1 });
    for (let i = 0; i < 6; i += 1) {
      const minute = 10 + i;
      mocks.seedHistoryEvent({
        _id: new ObjectId(`65f0000000000000000000${(10 + i).toString().padStart(2, "0")}`),
        schemaVersion: "create_prepare_attach_history.v1",
        eventType: i % 2 === 0 ? "review" : "apply",
        eventId: `e-${i}`,
        draftId,
        actorUserId: "u-review",
        previousReviewState: "pending",
        nextReviewState: "accepted_for_apply",
        previousApplyState: "not_applied",
        nextApplyState: i % 2 === 0 ? "not_applied" : "applied",
        reviewNote: i % 2 === 0 ? `r-${i}` : null,
        result: i % 2 === 1 ? "applied" : undefined,
        targetType: i % 2 === 1 ? "claim" : undefined,
        targetId: i % 2 === 1 ? "claim-1" : undefined,
        applyNote: null,
        mutationType: i % 2 === 1 ? "attach_reference_claim" : undefined,
        errorCode: null,
        resultCode: i % 2 === 1 ? "apply_success" : "review_state_changed",
        createdAt: `2026-03-20T12:${String(minute).padStart(2, "0")}:00.000Z`,
      });
    }

    const page1 = await getCreatePrepareAttachDraftHistory({
      actor: actor as any,
      draftId,
      limit: 2,
      type: "all",
    });
    expect(page1.events).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeTruthy();
    expect(page1.nextScanCursor).toBeTruthy();

    const page2 = await getCreatePrepareAttachDraftHistory({
      actor: actor as any,
      draftId,
      limit: 2,
      type: "all",
      cursor: page1.nextCursor,
    });
    expect(page2.events).toHaveLength(2);
    expect(page2.events[0].eventId).not.toBe(page1.events[0].eventId);

    const reviewOnly = await getCreatePrepareAttachDraftHistory({
      actor: actor as any,
      draftId,
      limit: 10,
      type: "review",
    });
    expect(reviewOnly.events.every((event) => event.eventType === "review")).toBe(true);
  });

  it("keeps tie-break deterministic for same createdAt via _id ordering", async () => {
    const draftId = seedDraft({ version: 2 });
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000211"),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "apply",
      eventId: "e-low",
      draftId,
      actorUserId: "u-review",
      targetType: "claim",
      targetId: "c1",
      result: "applied",
      mutationType: "attach_reference_claim",
      errorCode: null,
      applyNote: null,
      resultCode: "apply_success",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "applied",
      createdAt: "2026-03-20T15:00:00.000Z",
    });
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000299"),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "apply",
      eventId: "e-high",
      draftId,
      actorUserId: "u-review",
      targetType: "claim",
      targetId: "c2",
      result: "applied",
      mutationType: "attach_reference_claim",
      errorCode: null,
      applyNote: null,
      resultCode: "apply_success",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "applied",
      createdAt: "2026-03-20T15:00:00.000Z",
    });

    const page = await getCreatePrepareAttachDraftHistory({
      actor: actor as any,
      draftId,
      type: "apply",
      limit: 2,
    });
    expect(page.events.map((event) => event.eventId)).toEqual(["e-high", "e-low"]);
  });

  it("normalizes legacy events without schemaVersion/eventType instead of dropping them", async () => {
    const draftId = seedDraft({ version: 2 });
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000111"),
      draftId,
      reviewedBy: "legacy-reviewer",
      reviewState: "accepted_for_apply",
      reviewNote: "legacy",
      reviewedAt: "2026-03-20T14:00:00.000Z",
      previousReviewState: "pending",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
    });
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000112"),
      draftId,
      appliedBy: "legacy-applier",
      result: "failed",
      errorCode: "attach_target_not_found",
      applyNote: "legacy failed",
      appliedAt: "2026-03-20T14:05:00.000Z",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "apply_failed",
    });
    mocks.seedHistoryEvent({
      _id: "65f000000000000000000113",
      draftId,
      appliedBy: "legacy-string-object-id",
      result: "failed",
      errorCode: "attach_target_not_found",
      applyNote: "legacy string object id",
      createdAt: "2026-03-20T14:05:30.000Z",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "apply_failed",
      targetType: "claim",
      targetId: "legacy-claim-2",
    });
    mocks.seedHistoryEvent({
      // intentionally no _id and no eventId
      draftId,
      appliedBy: "legacy-string-id",
      result: "failed",
      errorCode: "invalid_attach_target",
      applyNote: "legacy missing id",
      createdAt: "2026-03-20T14:06:00.000Z",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "apply_failed",
      targetType: "claim",
      targetId: "legacy-claim",
    });

    const result = await getCreatePrepareAttachDraftHistory({
      actor: actor as any,
      draftId,
      limit: 10,
      type: "all",
    });

    expect(result.events).toHaveLength(4);
    expect(result.events.every((event) => event.normalizedFromLegacy)).toBe(true);
    expect(result.events[0].legacyNormalizationReason).toContain("event_type_inferred");
    expect(result.events[0].eventId).toBeTruthy();
  });

  it("rejects cursors that belong to another draft", async () => {
    const draftIdA = seedDraft({ version: 1 });
    const draftIdB = seedDraft({ version: 1 });
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000311"),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "review",
      eventId: "a-1",
      draftId: draftIdA,
      actorUserId: "u-review",
      previousReviewState: "pending",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
      reviewNote: null,
      resultCode: "review_state_changed",
      createdAt: "2026-03-20T16:00:00.000Z",
    });
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000312"),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "review",
      eventId: "a-2",
      draftId: draftIdA,
      actorUserId: "u-review",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "parked",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
      reviewNote: null,
      resultCode: "review_state_changed",
      createdAt: "2026-03-20T15:59:00.000Z",
    });

    const first = await getCreatePrepareAttachDraftHistory({
      actor: actor as any,
      draftId: draftIdA,
      type: "all",
      limit: 1,
    });
    expect(first.nextCursor).toBeTruthy();
    await expect(
      getCreatePrepareAttachDraftHistory({
        actor: actor as any,
        draftId: draftIdB,
        type: "all",
        limit: 1,
        cursor: first.nextCursor,
      }),
    ).rejects.toThrow("invalid_history_cursor");
  });
});
