import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  const historyEvents: Array<Record<string, unknown>> = [];

  const toId = (value: unknown) => {
    if (value instanceof ObjectId) return value.toHexString();
    return String(value ?? "");
  };

  const sortRows = (rows: Array<Record<string, unknown>>, dir: 1 | -1) =>
    [...rows].sort((left, right) => {
      const l = toId(left._id);
      const r = toId(right._id);
      return dir === 1 ? l.localeCompare(r) : r.localeCompare(l);
    });

  return {
    reset() {
      historyEvents.length = 0;
    },
    seedHistoryEvent(doc: Record<string, unknown>) {
      historyEvents.push({ ...doc });
    },
    readHistoryEvents() {
      return historyEvents.map((entry) => ({ ...entry }));
    },
    getCol: vi.fn(async (name: string) => {
      if (name !== "create_prepare_attach_history_events") {
        throw new Error(`unexpected_collection_${name}`);
      }
      return {
        async createIndex() {
          return "ok";
        },
        find() {
          let current = historyEvents.map((entry) => ({ ...entry }));
          return {
            sort(spec: Record<string, 1 | -1>) {
              if (spec._id) current = sortRows(current, spec._id);
              return this;
            },
            limit(value: number) {
              const limit = Math.max(0, Number(value) || 0);
              current = current.slice(0, limit);
              return this;
            },
            async toArray() {
              return current.map((entry) => ({ ...entry }));
            },
          };
        },
        async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>) {
          const idx = historyEvents.findIndex((entry) => toId(entry._id) === toId(filter._id));
          if (idx < 0) return { matchedCount: 0, modifiedCount: 0 };
          const setValues = (update?.$set ?? {}) as Record<string, unknown>;
          historyEvents[idx] = { ...historyEvents[idx], ...setValues };
          return { matchedCount: 1, modifiedCount: 1 };
        },
      };
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
  classifyCreatePrepareAttachHistoryLegacyRow,
  parseCreatePrepareAttachHistoryBackfillArgs,
  runCreatePrepareAttachHistoryBackfill,
} from "@/features/create/attachDraftHistoryBackfill";

describe("create prepare-attach history backfill service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("classifies canonical rows as no-op", () => {
    const row = {
      _id: new ObjectId("65f000000000000000000111"),
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "review",
      eventId: "e-1",
      draftId: "65f000000000000000000211",
      actorUserId: "u-review",
      previousReviewState: "pending",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
      reviewNote: null,
      resultCode: "review_state_changed",
      createdAt: "2026-03-20T10:00:00.000Z",
    };
    const assessment = classifyCreatePrepareAttachHistoryLegacyRow(row);
    expect(assessment.status).toBe("canonical_already_ok");
    expect(assessment.reasons).toEqual([]);
    expect(assessment.normalizedEvent).toBeNull();
  });

  it("detects review legacy rows as normalizable", () => {
    const row = {
      _id: new ObjectId("65f000000000000000000112"),
      draftId: "65f000000000000000000212",
      reviewedBy: "legacy-reviewer",
      reviewState: "accepted_for_apply",
      reviewNote: "legacy review",
      reviewedAt: "2026-03-20T11:00:00.000Z",
      previousReviewState: "pending",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
    };
    const assessment = classifyCreatePrepareAttachHistoryLegacyRow(row);
    expect(assessment.status).toBe("normalizable");
    expect(assessment.inferredEventType).toBe("review");
    expect(assessment.reasons).toContain("event_type_inferred");
    expect(assessment.normalizedEvent).toMatchObject({
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "review",
      actorUserId: "legacy-reviewer",
      resultCode: "review_state_changed",
    });
  });

  it("detects apply legacy rows as normalizable", () => {
    const row = {
      _id: "65f000000000000000000113",
      draftId: "65f000000000000000000213",
      appliedBy: "legacy-applier",
      result: "failed",
      errorCode: "attach_target_not_found",
      applyNote: "legacy failed",
      appliedAt: "2026-03-20T11:05:00.000Z",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      previousApplyState: "not_applied",
      nextApplyState: "apply_failed",
      targetType: "claim",
      targetId: "legacy-claim-1",
    };
    const assessment = classifyCreatePrepareAttachHistoryLegacyRow(row);
    expect(assessment.status).toBe("normalizable");
    expect(assessment.inferredEventType).toBe("apply");
    expect(assessment.normalizedEvent).toMatchObject({
      schemaVersion: "create_prepare_attach_history.v1",
      eventType: "apply",
      actorUserId: "legacy-applier",
      result: "failed",
      targetType: "claim",
      targetId: "legacy-claim-1",
    });
  });

  it("marks ambiguous rows as unsafe instead of rewriting blindly", () => {
    const row = {
      _id: new ObjectId("65f000000000000000000114"),
      draftId: "65f000000000000000000214",
      reviewedBy: "legacy-reviewer",
      reviewState: "accepted_for_apply",
      result: "failed",
      appliedBy: "legacy-applier",
      appliedAt: "2026-03-20T11:10:00.000Z",
    };
    const assessment = classifyCreatePrepareAttachHistoryLegacyRow(row);
    expect(assessment.status).toBe("unsafe_to_backfill");
    expect(assessment.reasons).toContain("ambiguous_event_signals");
    expect(assessment.normalizedEvent).toBeNull();
  });

  it("handles string _id deterministically and reports missing _id as unsafe", () => {
    const stringIdRow = {
      _id: "65f000000000000000000115",
      draftId: "65f000000000000000000215",
      appliedBy: "legacy-applier",
      result: "failed",
      nextApplyState: "apply_failed",
      appliedAt: "2026-03-20T11:20:00.000Z",
      previousReviewState: "accepted_for_apply",
      nextReviewState: "accepted_for_apply",
      targetType: "claim",
      targetId: "legacy-claim-2",
    };
    const missingIdRow = {
      draftId: "65f000000000000000000216",
      reviewedBy: "legacy-reviewer",
      reviewState: "parked",
      reviewedAt: "2026-03-20T11:21:00.000Z",
    };

    const withStringId = classifyCreatePrepareAttachHistoryLegacyRow(stringIdRow);
    expect(withStringId.status).toBe("normalizable");
    expect(withStringId.rowId).toBe("65f000000000000000000115");
    expect(withStringId.normalizedEvent?.eventId).toBe("65f000000000000000000115");

    const missingId = classifyCreatePrepareAttachHistoryLegacyRow(missingIdRow);
    expect(missingId.status).toBe("unsafe_to_backfill");
    expect(missingId.reasons).toContain("row_id_missing");
  });

  it("supports dry-run summary and explicit apply mode", async () => {
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000116"),
      draftId: "65f000000000000000000217",
      reviewedBy: "legacy-reviewer",
      reviewState: "accepted_for_apply",
      reviewedAt: "2026-03-20T11:30:00.000Z",
      previousReviewState: "pending",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
    });

    const dryRun = await runCreatePrepareAttachHistoryBackfill();
    expect(dryRun.mode).toBe("dry_run");
    expect(dryRun.totalScanned).toBe(1);
    expect(dryRun.normalizable).toBe(1);
    expect(dryRun.applied).toBe(0);

    const apply = await runCreatePrepareAttachHistoryBackfill({ mode: "apply" });
    expect(apply.mode).toBe("apply");
    expect(apply.normalizable).toBe(1);
    expect(apply.applied).toBe(1);
  });

  it("is idempotent across repeated apply runs", async () => {
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000117"),
      draftId: "65f000000000000000000218",
      reviewedBy: "legacy-reviewer",
      reviewState: "accepted_for_apply",
      reviewedAt: "2026-03-20T11:40:00.000Z",
      previousReviewState: "pending",
      previousApplyState: "not_applied",
      nextApplyState: "not_applied",
    });

    const first = await runCreatePrepareAttachHistoryBackfill({ mode: "apply" });
    expect(first.applied).toBe(1);

    const second = await runCreatePrepareAttachHistoryBackfill({ mode: "apply" });
    expect(second.applied).toBe(0);
    expect(second.canonical).toBe(1);
  });

  it("reports unsafe rows in dry-run output", async () => {
    mocks.seedHistoryEvent({
      _id: new ObjectId("65f000000000000000000118"),
      draftId: "65f000000000000000000219",
      reviewedBy: "legacy-reviewer",
      appliedBy: "legacy-applier",
      reviewState: "accepted_for_apply",
      result: "failed",
      appliedAt: "2026-03-20T11:50:00.000Z",
    });

    const report = await runCreatePrepareAttachHistoryBackfill({ mode: "dry_run", previewLimit: 5 });
    expect(report.unsafe).toBe(1);
    expect(report.samples[0]?.status).toBe("unsafe_to_backfill");
    expect(report.reasonBuckets.ambiguous_event_signals).toBe(1);
  });

  it("rejects invalid mode in runner and cli parsing", async () => {
    await expect(
      runCreatePrepareAttachHistoryBackfill({ mode: "invalid" as any }),
    ).rejects.toThrow("invalid_history_backfill_mode");
    expect(() => parseCreatePrepareAttachHistoryBackfillArgs(["--mode=invalid"])).toThrow(
      "invalid_history_backfill_mode",
    );
  });
});
