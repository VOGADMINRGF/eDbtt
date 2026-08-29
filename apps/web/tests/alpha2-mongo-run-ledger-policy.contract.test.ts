import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Alpha2RunRecordSchema,
  appendAlpha2Checkpoint,
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
});
