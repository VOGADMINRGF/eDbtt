import { describe, expect, it } from "vitest";
import type {
  Alpha2ExecutionDispatch,
  Alpha2ExecutionDispatcher,
} from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import {
  runAlpha2DurableStep,
  type Alpha2WorkerOutcome,
} from "@/features/agenticRuntime/alpha2DurableOrchestrator";
import { continueAlpha2AfterCompletedRun } from "@/features/agenticRuntime/alpha2ContinuousDispatcher";
import type { Alpha2ContinuationPlanner } from "@/features/agenticRuntime/alpha2ContinuousDispatchContract";
import {
  continueAlpha2AfterRepairableFailure,
  type Alpha2RepairPlanner,
  type Alpha2RepairableFailure,
} from "@/features/agenticRuntime/alpha2RepairContinuation";
import type {
  Alpha2RunLedger,
  Alpha2VersionedRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import {
  isAlpha2HumanStoppedRun,
  isAlpha2RunDue,
  isAlpha2TerminalRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import {
  createAlpha2RunRecord,
  transitionAlpha2Run,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

class FakeLedger implements Alpha2RunLedger {
  records = new Map<string, Alpha2VersionedRun>();

  seed(run: Alpha2RunRecord) {
    this.records.set(run.runId, { run, version: 0, lease: null });
  }

  async createOrGet(run: Alpha2RunRecord) {
    const existing = [...this.records.values()].find(
      (entry) => entry.run.idempotencyKey === run.idempotencyKey,
    );
    if (existing) return { record: existing, created: false };
    const record = { run, version: 0, lease: null } satisfies Alpha2VersionedRun;
    this.records.set(run.runId, record);
    return { record, created: true };
  }

  async getByRunId(runId: string) {
    return this.records.get(runId) ?? null;
  }

  async getByIdempotencyKey(idempotencyKey: string) {
    return (
      [...this.records.values()].find((entry) => entry.run.idempotencyKey === idempotencyKey) ?? null
    );
  }

  async compareAndSwap(input: { run: Alpha2RunRecord; expectedVersion: number }) {
    const current = this.records.get(input.run.runId);
    if (!current || current.version !== input.expectedVersion) {
      throw new Error("alpha2_ledger_version_conflict");
    }
    const next = {
      run: input.run,
      version: current.version + 1,
      lease: current.lease,
    } satisfies Alpha2VersionedRun;
    this.records.set(input.run.runId, next);
    return next;
  }

  async tryAcquireLease(input: {
    runId: string;
    owner: string;
    now: string;
    leaseMs: number;
  }) {
    const current = this.records.get(input.runId);
    if (!current) return null;
    if (isAlpha2TerminalRun(current.run) || isAlpha2HumanStoppedRun(current.run)) return null;
    if (!isAlpha2RunDue(current.run, input.now)) return null;
    const next = {
      ...current,
      lease: {
        owner: input.owner,
        expiresAt: new Date(Date.parse(input.now) + input.leaseMs).toISOString(),
      },
    };
    this.records.set(input.runId, next);
    return next;
  }

  async releaseLease(input: { runId: string; owner: string }) {
    const current = this.records.get(input.runId);
    if (!current || current.lease?.owner !== input.owner) return;
    this.records.set(input.runId, { ...current, lease: null });
  }

  async listRecoverable(input: { now: string; limit?: number }) {
    return [...this.records.values()]
      .filter((entry) => {
        if (isAlpha2TerminalRun(entry.run) || isAlpha2HumanStoppedRun(entry.run)) return false;
        if (entry.run.status === "queued" || entry.run.status === "running") return true;
        return Boolean(entry.run.resumeAt) && isAlpha2RunDue(entry.run, input.now);
      })
      .slice(0, input.limit ?? 50);
  }
}

class FakeDispatcher implements Alpha2ExecutionDispatcher {
  jobs: Alpha2ExecutionDispatch[] = [];

  async dispatch(input: Alpha2ExecutionDispatch) {
    this.jobs.push(input);
    return { jobId: `job-${this.jobs.length}` };
  }
}

const WORK_TASK = {
  id: "ALPHA2-WORK-TEST",
  status: "codex_ready",
  priority: "P0",
  dependencies: "none",
  scope: "bounded engineering slice",
  acceptance: "repairable CI failure is repaired",
} as const;

const REPAIR_TASK = {
  id: "ALPHA2-REPAIR-TEST",
  status: "codex_ready",
  priority: "P0",
  dependencies: "ALPHA2-WORK-TEST",
  scope: "bounded repair slice",
  acceptance: "repair then verify",
} as const;

const VERIFY_TASK = {
  id: "ALPHA2-VERIFY-TEST",
  status: "codex_ready",
  priority: "P0",
  dependencies: "ALPHA2-REPAIR-TEST",
  scope: "bounded verification slice",
  acceptance: "verification passes",
} as const;

function queuedRun(input: {
  id: string;
  taskId: string;
  parentRunId?: string | null;
  rootRunId?: string;
  riskClass?: "green" | "yellow";
}) {
  return createAlpha2RunRecord({
    runId: input.id,
    parentRunId: input.parentRunId,
    rootRunId: input.rootRunId,
    idempotencyKey: `idem-${input.id}`,
    taskId: input.taskId,
    kind: "engineering_slice",
    primaryRole: "engineering_agent",
    supportingRoles: ["qa_agent"],
    riskClass: input.riskClass ?? "green",
    route: { mode: "automatic", capabilityClass: "engineering" },
    budget: { maxAttempts: 3 },
    now: "2026-08-25T11:00:00.000Z",
  });
}

function safeAction() {
  return {
    actionKind: "write_reversible" as const,
    riskClass: "green" as const,
    confidence: "high" as const,
    reversible: true,
    explicitPolicyRef: "AGENTS.md#repository-gate",
  };
}

async function persistCompleted(ledger: FakeLedger, run: Alpha2RunRecord, now: string) {
  const current = await ledger.getByRunId(run.runId);
  if (!current) throw new Error("missing run");
  const running = transitionAlpha2Run(run, "running", { now });
  const completed = transitionAlpha2Run(running, "completed", { now });
  await ledger.compareAndSwap({ run: completed, expectedVersion: current.version });
  return completed;
}

const repairPlanner: Alpha2RepairPlanner = {
  planRepair({ failedRun, failure }) {
    return {
      state: "continue",
      task: REPAIR_TASK,
      action: safeAction(),
      nextRun: queuedRun({
        id: `repair-${failure.checkpointId}`,
        taskId: REPAIR_TASK.id,
        parentRunId: failedRun.runId,
        rootRunId: failedRun.rootRunId,
      }),
    };
  },
};

describe("Alpha2 bounded repair continuation", () => {
  it("turns one repairable CI failure into one durable repair child and then continues to verify", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const work = queuedRun({ id: "work-1", taskId: WORK_TASK.id });
    ledger.seed(work);

    const failedStep = await runAlpha2DurableStep({
      runId: work.runId,
      workerId: "worker-a",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return {
            type: "failed",
            checkpointId: "ci-typecheck-1",
            errorCode: "ci_typecheck_failed",
            retryable: false,
            repairable: true,
          };
        },
      },
      now: "2026-08-25T11:00:01.000Z",
    });

    expect(failedStep.state).toBe("executed");
    if (failedStep.state !== "executed" || failedStep.outcome.type !== "failed") {
      throw new Error("unexpected failed step");
    }
    expect(failedStep.run.resumeAt).toBeUndefined();
    expect(dispatcher.jobs).toHaveLength(0);

    const failure = failedStep.outcome as Alpha2RepairableFailure;
    const firstRepair = await continueAlpha2AfterRepairableFailure({
      failedRun: failedStep.run,
      failure,
      ledger,
      dispatcher,
      planner: repairPlanner,
      now: "2026-08-25T11:00:02.000Z",
    });
    expect(firstRepair.state).toBe("dispatched");
    if (firstRepair.state !== "dispatched") throw new Error("repair not dispatched");
    expect(firstRepair.repairRun.runId).toBe("repair-ci-typecheck-1");
    expect(dispatcher.jobs).toHaveLength(1);

    const repeatedRepair = await continueAlpha2AfterRepairableFailure({
      failedRun: failedStep.run,
      failure,
      ledger,
      dispatcher,
      planner: repairPlanner,
      now: "2026-08-25T11:00:03.000Z",
    });
    expect(repeatedRepair.state).toBe("dispatched");
    expect(
      [...ledger.records.values()].filter((entry) => entry.run.taskId === REPAIR_TASK.id),
    ).toHaveLength(1);

    const repairStored = await ledger.getByRunId("repair-ci-typecheck-1");
    if (!repairStored) throw new Error("repair child missing");
    const repairCompleted = await persistCompleted(
      ledger,
      repairStored.run,
      "2026-08-25T11:00:04.000Z",
    );

    const verifyPlanner: Alpha2ContinuationPlanner = {
      plan({ completedRun }) {
        return {
          state: "continue",
          task: VERIFY_TASK,
          action: safeAction(),
          nextRun: queuedRun({
            id: "verify-1",
            taskId: VERIFY_TASK.id,
            parentRunId: completedRun.runId,
            rootRunId: completedRun.rootRunId,
          }),
        };
      },
    };
    const verify = await continueAlpha2AfterCompletedRun({
      completedRun: repairCompleted,
      ledger,
      dispatcher,
      planner: verifyPlanner,
      now: "2026-08-25T11:00:05.000Z",
    });
    expect(verify.state).toBe("dispatched");
    expect(dispatcher.jobs.at(-1)).toMatchObject({ runId: "verify-1" });
  });

  it("keeps ordinary retryable failures on the existing same-run retry path", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const work = queuedRun({ id: "transient-1", taskId: WORK_TASK.id });
    ledger.seed(work);

    const outcome: Alpha2WorkerOutcome = {
      type: "failed",
      checkpointId: "provider-timeout",
      errorCode: "provider_timeout",
      retryable: true,
      retryAfterMs: 30_000,
    };
    const result = await runAlpha2DurableStep({
      runId: work.runId,
      workerId: "worker-a",
      ledger,
      dispatcher,
      executor: { async execute() { return outcome; } },
      now: "2026-08-25T11:10:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.resumeAt).toBe("2026-08-25T11:10:30.000Z");
    expect(dispatcher.jobs).toHaveLength(1);
    expect(dispatcher.jobs[0]).toMatchObject({ runId: "transient-1", reason: "retry" });
    expect(
      [...ledger.records.values()].filter((entry) => entry.run.parentRunId === "transient-1"),
    ).toHaveLength(0);
  });

  it("stops a repair plan at the existing human sovereignty gate", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const work = queuedRun({ id: "gate-work", taskId: WORK_TASK.id });
    ledger.seed(work);
    const running = transitionAlpha2Run(work, "running", { now: "2026-08-25T11:20:00.000Z" });
    const failed = transitionAlpha2Run(running, "failed", {
      now: "2026-08-25T11:20:01.000Z",
      errorCode: "repair_requires_merge",
    });
    const current = await ledger.getByRunId(work.runId);
    if (!current) throw new Error("missing work");
    await ledger.compareAndSwap({ run: failed, expectedVersion: current.version });

    const failure: Alpha2RepairableFailure = {
      type: "failed",
      checkpointId: "merge-failure",
      errorCode: "repair_requires_merge",
      retryable: false,
      repairable: true,
    };
    const result = await continueAlpha2AfterRepairableFailure({
      failedRun: failed,
      failure,
      ledger,
      dispatcher,
      planner: {
        planRepair({ failedRun }) {
          return {
            state: "continue",
            task: REPAIR_TASK,
            nextRun: queuedRun({
              id: "gate-repair",
              taskId: REPAIR_TASK.id,
              parentRunId: failedRun.runId,
              rootRunId: failedRun.rootRunId,
            }),
            action: {
              actionKind: "merge_code",
              riskClass: "green",
              confidence: "high",
              reversible: false,
            },
          };
        },
      },
      now: "2026-08-25T11:20:02.000Z",
    });

    expect(result.state).toBe("human_gate");
    if (result.state !== "human_gate") throw new Error("expected human gate");
    expect(result.gateRun.status).toBe("human_gate");
    expect(result.reason).toContain("human_sovereignty:merge_code");
    expect(dispatcher.jobs).toHaveLength(0);
  });
});
