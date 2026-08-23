import { describe, expect, it } from "vitest";
import {
  recoverAlpha2DueRuns,
  runAlpha2DurableStep,
  type Alpha2WorkerExecutor,
} from "@/features/agenticRuntime/alpha2DurableOrchestrator";
import type {
  Alpha2ExecutionDispatch,
  Alpha2ExecutionDispatcher,
} from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import {
  isAlpha2HumanStoppedRun,
  isAlpha2RunDue,
  isAlpha2TerminalRun,
  type Alpha2RunLedger,
  type Alpha2VersionedRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import {
  createAlpha2RunRecord,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

class FakeLedger implements Alpha2RunLedger {
  private records = new Map<string, Alpha2VersionedRun>();

  seed(run: Alpha2RunRecord) {
    this.records.set(run.runId, { run, version: 0, lease: null });
  }

  async createOrGet(run: Alpha2RunRecord) {
    const existing = this.records.get(run.runId);
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
    const autoDue =
      current.run.status === "queued" ||
      current.run.status === "running" ||
      ((current.run.status === "waiting" || current.run.status === "failed") &&
        Boolean(current.run.resumeAt) &&
        isAlpha2RunDue(current.run, input.now));
    if (!autoDue) return null;
    if (
      current.lease &&
      current.lease.owner !== input.owner &&
      Date.parse(current.lease.expiresAt) > Date.parse(input.now)
    ) {
      return null;
    }
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
        if (entry.lease && Date.parse(entry.lease.expiresAt) > Date.parse(input.now)) return false;
        if (entry.run.status === "queued" || entry.run.status === "running") return true;
        if (entry.run.status === "waiting" || entry.run.status === "failed") {
          return Boolean(entry.run.resumeAt) && isAlpha2RunDue(entry.run, input.now);
        }
        return false;
      })
      .slice(0, input.limit ?? 50);
  }
}

class FakeDispatcher implements Alpha2ExecutionDispatcher {
  jobs: Alpha2ExecutionDispatch[] = [];
  fail = false;

  async dispatch(input: Alpha2ExecutionDispatch) {
    if (this.fail) throw new Error("redis_unavailable");
    this.jobs.push(input);
    return { jobId: `job-${this.jobs.length}` };
  }
}

function run(id = "run-1") {
  return createAlpha2RunRecord({
    runId: id,
    idempotencyKey: `idem-${id}`,
    taskId: "ALPHA2-TEST-01",
    kind: "engineering_slice",
    primaryRole: "governance_compliance",
    riskClass: "green",
    route: { mode: "automatic", capabilityClass: "test" },
    budget: { maxAttempts: 3 },
    now: "2026-08-23T20:00:00.000Z",
  });
}

describe("Alpha-Foxtrott 2 durable orchestrator", () => {
  it("persists a scheduled wait and resumes without counting the resume as another attempt", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run());

    const waitExecutor: Alpha2WorkerExecutor = {
      async execute() {
        return {
          type: "waiting",
          checkpointId: "cp-wait",
          cursor: "phase-2",
          resumeAfterMs: 60_000,
        };
      },
    };

    const first = await runAlpha2DurableStep({
      runId: "run-1",
      workerId: "worker-a",
      ledger,
      dispatcher,
      executor: waitExecutor,
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(first.state).toBe("executed");
    if (first.state !== "executed") throw new Error("unexpected state");
    expect(first.run.status).toBe("waiting");
    expect(first.run.attempt).toBe(1);
    expect(first.run.resumeAt).toBe("2026-08-23T20:01:00.000Z");
    expect(dispatcher.jobs[0]).toMatchObject({ reason: "scheduled_resume", delayMs: 60_000 });

    const completeExecutor: Alpha2WorkerExecutor = {
      async execute() {
        return { type: "completed", checkpointId: "cp-done" };
      },
    };

    const second = await runAlpha2DurableStep({
      runId: "run-1",
      workerId: "worker-b",
      ledger,
      dispatcher,
      executor: completeExecutor,
      now: "2026-08-23T20:01:00.000Z",
    });

    expect(second.state).toBe("executed");
    if (second.state !== "executed") throw new Error("unexpected state");
    expect(second.run.status).toBe("completed");
    expect(second.run.attempt).toBe(1);
    expect(second.run.checkpoints.map((entry) => entry.checkpointId)).toEqual([
      "cp-wait",
      "cp-done",
    ]);
  });

  it("stops at a human gate and never recovers it automatically", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-gate"));

    const result = await runAlpha2DurableStep({
      runId: "run-gate",
      workerId: "worker-a",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return {
            type: "human_gate",
            checkpointId: "cp-gate",
            reason: "political_position_requires_human_decision",
          };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("human_gate");
    expect(result.run.humanGate).toMatchObject({
      state: "pending",
      reason: "political_position_requires_human_decision",
    });

    const recovered = await recoverAlpha2DueRuns({
      ledger,
      dispatcher,
      now: "2026-08-24T20:00:00.000Z",
    });
    expect(recovered).toEqual([]);
  });

  it("recovers a retryable failure from Mongo truth when queue dispatch was lost", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    dispatcher.fail = true;
    ledger.seed(run("run-retry"));

    const result = await runAlpha2DurableStep({
      runId: "run-retry",
      workerId: "worker-a",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return {
            type: "failed",
            checkpointId: "cp-fail",
            errorCode: "provider_timeout",
            retryable: true,
            retryAfterMs: 30_000,
          };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.resumeAt).toBe("2026-08-23T20:00:30.000Z");
    expect(dispatcher.jobs).toHaveLength(0);

    dispatcher.fail = false;
    const recovered = await recoverAlpha2DueRuns({
      ledger,
      dispatcher,
      now: "2026-08-23T20:00:30.000Z",
    });

    expect(recovered).toHaveLength(1);
    expect(dispatcher.jobs[0]).toMatchObject({
      runId: "run-retry",
      reason: "recovery",
    });
  });

  it("does not recover a non-retryable failure", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-terminal-failure"));

    const result = await runAlpha2DurableStep({
      runId: "run-terminal-failure",
      workerId: "worker-a",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return {
            type: "failed",
            checkpointId: "cp-fail-hard",
            errorCode: "policy_denied",
            retryable: false,
          };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.resumeAt).toBeUndefined();

    const recovered = await recoverAlpha2DueRuns({
      ledger,
      dispatcher,
      now: "2026-08-30T20:00:00.000Z",
    });
    expect(recovered).toEqual([]);
  });
});
