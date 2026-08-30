import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Alpha2RunRecordSchema,
  appendAlpha2Checkpoint,
  consumeAlpha2HumanResumeApproval,
  createAlpha2RunRecord,
  transitionAlpha2Run,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

const mongoHarness = vi.hoisted(() => {
  let found: unknown = null;
  let updated: unknown = null;
  const Model = {
    findOne: vi.fn(async () => found),
    findOneAndUpdate: vi.fn(async () => updated),
  };
  return {
    Model,
    setFound(value: unknown) {
      found = value;
    },
    setUpdated(value: unknown) {
      updated = value;
    },
  };
});

vi.mock("@core/db/mongoose", () => {
  class FakeSchema {
    static Types = { Mixed: class Mixed {} };
    index() {}
  }
  return {
    mongo: vi.fn(async () => undefined),
    mongoose: {
      Schema: FakeSchema,
      models: { Alpha2RunLedger: mongoHarness.Model },
      model: vi.fn(),
    },
  };
});

import { Alpha2MongoRunLedger } from "@/features/agenticRuntime/alpha2MongoRunLedger";

function mongoDocument(run: Alpha2RunRecord, version: number) {
  return {
    toObject() {
      return {
        payload: run,
        version,
        leaseOwner: null,
        leaseExpiresAt: null,
      };
    },
  };
}

function policyRun() {
  return createAlpha2RunRecord({
    runId: "run-mongo-policy",
    idempotencyKey: "idem-run-mongo-policy",
    taskId: "ALPHA2-TEST-01",
    kind: "engineering_slice",
    primaryRole: "governance_compliance",
    riskClass: "red",
    route: { mode: "automatic", capabilityClass: "test" },
    budget: { maxAttempts: 1, maxWallClockMs: 60_000 },
    now: "2026-08-23T20:00:00.000Z",
  });
}

describe("Alpha2 Mongo run-ledger execution policy boundary", () => {
  beforeEach(() => {
    mongoHarness.Model.findOne.mockClear();
    mongoHarness.Model.findOneAndUpdate.mockClear();
    mongoHarness.setUpdated(null);
  });

  it("rejects direct compareAndSwap changes to execution policy", async () => {
    const existing = policyRun();
    mongoHarness.setFound(mongoDocument(existing, 0));
    const ledger = new Alpha2MongoRunLedger();
    const mutations: Array<{
      expectedError: string;
      run: Alpha2RunRecord;
    }> = [
      {
        expectedError: "alpha2_risk_class_is_immutable",
        run: Alpha2RunRecordSchema.parse({ ...existing, riskClass: "green" }),
      },
      {
        expectedError: "alpha2_budget_is_immutable",
        run: Alpha2RunRecordSchema.parse({
          ...existing,
          budget: { ...existing.budget, maxAttempts: 2 },
        }),
      },
      {
        expectedError: "alpha2_route_is_immutable",
        run: Alpha2RunRecordSchema.parse({
          ...existing,
          route: { ...existing.route, capabilityClass: "changed" },
        }),
      },
      {
        expectedError: "alpha2_run_kind_is_immutable",
        run: Alpha2RunRecordSchema.parse({ ...existing, kind: "diagnostic" }),
      },
      {
        expectedError: "alpha2_role_assignments_are_immutable",
        run: Alpha2RunRecordSchema.parse({
          ...existing,
          supportingRoles: ["research_source"],
        }),
      },
    ];

    for (const mutation of mutations) {
      await expect(
        ledger.compareAndSwap({ run: mutation.run, expectedVersion: 0 }),
      ).rejects.toThrow(mutation.expectedError);
    }
    expect(mongoHarness.Model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("allows a normal outcome CAS when execution policy is unchanged", async () => {
    const queued = policyRun();
    const running = transitionAlpha2Run(queued, "running", {
      now: "2026-08-23T20:01:00.000Z",
    });
    const checkpointed = appendAlpha2Checkpoint(running, {
      checkpointId: "cp-mongo-policy-complete",
      createdAt: "2026-08-23T20:02:00.000Z",
      status: "completed",
      evidenceRefs: [],
      safeTraceStepRefs: [],
      artifactRefs: [],
    });
    const completed = transitionAlpha2Run(checkpointed, "completed", {
      now: "2026-08-23T20:02:00.000Z",
    });
    mongoHarness.setFound(mongoDocument(running, 0));
    mongoHarness.setUpdated(mongoDocument(completed, 1));
    const ledger = new Alpha2MongoRunLedger();

    const persisted = await ledger.compareAndSwap({
      run: completed,
      expectedVersion: 0,
      stampCheckpointId: "cp-mongo-policy-complete",
    });

    expect(persisted.version).toBe(1);
    expect(persisted.run.status).toBe("completed");
    expect(persisted.run.riskClass).toBe("red");
    expect(persisted.run.budget).toEqual(running.budget);
    expect(persisted.run.route).toEqual(running.route);
    expect(mongoHarness.Model.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it("rejects direct CAS reuse of an older gate approval for review completion", async () => {
    const queued = policyRun();
    const gated = transitionAlpha2Run(queued, "human_gate", {
      now: "2026-08-23T20:00:30.000Z",
      humanGate: {
        state: "pending",
        reason: "approve entering review",
        gateRef: "gate:enter-review",
      },
    });
    const reviewed = transitionAlpha2Run(gated, "review", {
      now: "2026-08-23T20:01:00.000Z",
      humanGate: {
        state: "approved",
        reason: "approve entering review",
        gateRef: "gate:enter-review",
        resumeMode: "start_new_attempt",
        decisionRef: "decision:enter-review",
        decidedAt: "2026-08-23T20:00:45.000Z",
      },
    });
    const directCompletion = Alpha2RunRecordSchema.parse({
      ...reviewed,
      status: "completed",
      updatedAt: "2026-08-23T20:02:00.000Z",
      finishedAt: "2026-08-23T20:02:00.000Z",
    });
    mongoHarness.setFound(mongoDocument(reviewed, 1));
    const ledger = new Alpha2MongoRunLedger();

    await expect(
      ledger.compareAndSwap({ run: directCompletion, expectedVersion: 1 }),
    ).rejects.toThrow("alpha2_review_completion_requires_bound_approval");
    expect(mongoHarness.Model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects direct CAS changes to startedAt and wallClockDeadlineAt", async () => {
    const queued = policyRun();
    const running = Alpha2RunRecordSchema.parse({
      ...transitionAlpha2Run(queued, "running", {
        now: "2026-08-23T20:01:00.000Z",
      }),
      wallClockDeadlineAt: "2026-08-23T20:02:00.000Z",
    });
    mongoHarness.setFound(mongoDocument(running, 1));
    const ledger = new Alpha2MongoRunLedger();

    await expect(
      ledger.compareAndSwap({
        run: Alpha2RunRecordSchema.parse({
          ...running,
          startedAt: "2026-08-23T20:01:30.000Z",
        }),
        expectedVersion: 1,
      }),
    ).rejects.toThrow("alpha2_started_at_is_immutable");

    await expect(
      ledger.compareAndSwap({
        run: Alpha2RunRecordSchema.parse({
          ...running,
          wallClockDeadlineAt: "2026-08-23T20:03:00.000Z",
        }),
        expectedVersion: 1,
      }),
    ).rejects.toThrow("alpha2_wall_clock_deadline_is_immutable");

    expect(mongoHarness.Model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("allows unchanged wall-clock values through a normal lifecycle CAS", async () => {
    const queued = policyRun();
    const running = Alpha2RunRecordSchema.parse({
      ...transitionAlpha2Run(queued, "running", {
        now: "2026-08-23T20:01:00.000Z",
      }),
      wallClockDeadlineAt: "2026-08-23T20:02:00.000Z",
    });
    const checkpointed = appendAlpha2Checkpoint(running, {
      checkpointId: "cp-wall-clock-values-unchanged",
      createdAt: "2026-08-23T20:01:30.000Z",
      status: "completed",
      evidenceRefs: [],
      safeTraceStepRefs: [],
      artifactRefs: [],
    });
    const completed = transitionAlpha2Run(checkpointed, "completed", {
      now: "2026-08-23T20:01:30.000Z",
    });
    mongoHarness.setFound(mongoDocument(running, 1));
    mongoHarness.setUpdated(mongoDocument(completed, 2));
    const ledger = new Alpha2MongoRunLedger();

    const persisted = await ledger.compareAndSwap({
      run: completed,
      expectedVersion: 1,
      stampCheckpointId: "cp-wall-clock-values-unchanged",
    });

    expect(persisted.run.startedAt).toBe(running.startedAt);
    expect(persisted.run.wallClockDeadlineAt).toBe(running.wallClockDeadlineAt);
    expect(mongoHarness.Model.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it("initializes wall-clock timestamps only through the server-owned transition", async () => {
    const queued = policyRun();
    const running = transitionAlpha2Run(queued, "running", {
      now: "2026-08-23T20:01:00.000Z",
    });
    const serverOwned = Alpha2RunRecordSchema.parse({
      ...running,
      startedAt: "2026-08-23T20:01:05.000Z",
      wallClockDeadlineAt: "2026-08-23T20:02:05.000Z",
    });
    mongoHarness.setFound(mongoDocument(queued, 0));
    mongoHarness.setUpdated(mongoDocument(serverOwned, 1));
    const ledger = new Alpha2MongoRunLedger();

    const persisted = await ledger.compareAndSwap({
      run: running,
      expectedVersion: 0,
      initializeWallClock: { maxWallClockMs: 60_000 },
    });

    expect(persisted.run.startedAt).toBe("2026-08-23T20:01:05.000Z");
    expect(persisted.run.wallClockDeadlineAt).toBe("2026-08-23T20:02:05.000Z");
    expect(mongoHarness.Model.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it("rejects wall-clock initialization that exceeds the immutable run budget", async () => {
    const queued = policyRun();
    const running = transitionAlpha2Run(queued, "running", {
      now: "2026-08-23T20:01:00.000Z",
    });
    mongoHarness.setFound(mongoDocument(queued, 0));
    const ledger = new Alpha2MongoRunLedger();

    await expect(
      ledger.compareAndSwap({
        run: running,
        expectedVersion: 0,
        initializeWallClock: { maxWallClockMs: 120_000 },
      }),
    ).rejects.toThrow("alpha2_wall_clock_budget_mismatch");
    expect(mongoHarness.Model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("preserves the approved first-attempt lifecycle while deriving its budget server-side", async () => {
    const queued = policyRun();
    const gated = transitionAlpha2Run(queued, "human_gate", {
      now: "2026-08-23T20:00:30.000Z",
      humanGate: {
        state: "pending",
        reason: "initial_approval_required",
        resumeMode: "start_new_attempt",
      },
    });
    const approved = transitionAlpha2Run(gated, "running", {
      now: "2026-08-23T20:01:00.000Z",
      humanGate: {
        state: "approved",
        reason: gated.humanGate.reason,
        resumeMode: "start_new_attempt",
        decisionRef: "human:approved-first-attempt",
        decidedAt: "2026-08-23T20:01:00.000Z",
      },
    });
    const consumed = consumeAlpha2HumanResumeApproval(approved, {
      now: "2026-08-23T20:01:05.000Z",
    });
    const serverOwned = Alpha2RunRecordSchema.parse({
      ...consumed,
      startedAt: "2026-08-23T20:01:10.000Z",
      wallClockDeadlineAt: "2026-08-23T20:02:10.000Z",
    });
    mongoHarness.setFound(mongoDocument(approved, 1));
    mongoHarness.setUpdated(mongoDocument(serverOwned, 2));
    const ledger = new Alpha2MongoRunLedger();

    const persisted = await ledger.compareAndSwap({
      run: consumed,
      expectedVersion: 1,
      initializeWallClock: { maxWallClockMs: 60_000 },
    });

    expect(persisted.run.attempt).toBe(1);
    expect(persisted.run.humanGate.state).toBe("not_required");
    expect(persisted.run.startedAt).toBe("2026-08-23T20:01:10.000Z");
    expect(persisted.run.wallClockDeadlineAt).toBe("2026-08-23T20:02:10.000Z");
    expect(mongoHarness.Model.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it("does not allow a started run to rebase or extend its wall-clock budget", async () => {
    const queued = policyRun();
    const running = Alpha2RunRecordSchema.parse({
      ...transitionAlpha2Run(queued, "running", {
        now: "2026-08-23T20:01:00.000Z",
      }),
      wallClockDeadlineAt: "2026-08-23T20:02:00.000Z",
    });
    mongoHarness.setFound(mongoDocument(running, 1));
    const ledger = new Alpha2MongoRunLedger();

    await expect(
      ledger.compareAndSwap({
        run: running,
        expectedVersion: 1,
        initializeWallClock: { maxWallClockMs: 60_000 },
      }),
    ).rejects.toThrow("alpha2_started_at_is_immutable");
    expect(mongoHarness.Model.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
