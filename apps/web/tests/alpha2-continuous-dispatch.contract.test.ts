import { describe, expect, it } from "vitest";
import type {
  Alpha2ExecutionDispatch,
  Alpha2ExecutionDispatcher,
} from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import {
  continueAlpha2AfterCompletedRun,
} from "@/features/agenticRuntime/alpha2ContinuousDispatcher";
import {
  parseAlpha2ContinuationCursor,
  type Alpha2ContinuationPlanner,
} from "@/features/agenticRuntime/alpha2ContinuousDispatchContract";
import type {
  Alpha2RunLedger,
  Alpha2VersionedRun,
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
    const byIdempotency = [...this.records.values()].find(
      (entry) => entry.run.idempotencyKey === run.idempotencyKey,
    );
    if (byIdempotency) return { record: byIdempotency, created: false };
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

  async tryAcquireLease() {
    return null;
  }

  async releaseLease() {}

  async listRecoverable() {
    return [];
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

const TASK = {
  id: "ALPHA2-CONTINUOUS-DISPATCH-TEST",
  status: "codex_ready",
  priority: "P0",
  dependencies: "none",
  scope: "bounded test slice",
  acceptance: "continues without chat trigger",
} as const;

function queuedRun(input: {
  id: string;
  taskId?: string;
  parentRunId?: string | null;
  rootRunId?: string;
}) {
  return createAlpha2RunRecord({
    runId: input.id,
    parentRunId: input.parentRunId,
    rootRunId: input.rootRunId,
    idempotencyKey: `idem-${input.id}`,
    taskId: input.taskId ?? TASK.id,
    kind: "engineering_slice",
    primaryRole: "engineering_agent",
    riskClass: "green",
    route: { mode: "automatic", capabilityClass: "engineering" },
    budget: { maxAttempts: 3 },
    now: "2026-08-25T10:00:00.000Z",
  });
}

function complete(run: Alpha2RunRecord, now = "2026-08-25T10:00:01.000Z") {
  const running = transitionAlpha2Run(run, "running", { now });
  return transitionAlpha2Run(running, "completed", { now });
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

async function replaceRun(ledger: FakeLedger, run: Alpha2RunRecord) {
  const current = await ledger.getByRunId(run.runId);
  if (!current) throw new Error("missing fake run");
  await ledger.compareAndSwap({ run, expectedVersion: current.version });
}

describe("Alpha2 continuous dispatch", () => {
  it("chains three bounded worker slices without another chat authorization", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const root = complete(queuedRun({ id: "slice-1" }));
    ledger.seed(root);

    const planner: Alpha2ContinuationPlanner = {
      plan({ completedRun }) {
        if (completedRun.runId === "slice-3") {
          return { state: "complete", reason: "authorized_workstream_complete" };
        }
        const nextNumber = Number(completedRun.runId.split("-")[1]) + 1;
        return {
          state: "continue",
          task: TASK,
          action: safeAction(),
          nextRun: queuedRun({
            id: `slice-${nextNumber}`,
            parentRunId: completedRun.runId,
            rootRunId: completedRun.rootRunId,
          }),
        };
      },
    };

    const first = await continueAlpha2AfterCompletedRun({
      completedRun: root,
      ledger,
      dispatcher,
      planner,
      now: "2026-08-25T10:00:02.000Z",
    });
    expect(first.state).toBe("dispatched");
    expect(dispatcher.jobs[0]).toMatchObject({ runId: "slice-2", reason: "initial" });

    const slice2 = await ledger.getByRunId("slice-2");
    if (!slice2) throw new Error("slice-2 missing");
    const completed2 = complete(slice2.run, "2026-08-25T10:00:03.000Z");
    await replaceRun(ledger, completed2);
    const second = await continueAlpha2AfterCompletedRun({
      completedRun: completed2,
      ledger,
      dispatcher,
      planner,
      now: "2026-08-25T10:00:04.000Z",
    });
    expect(second.state).toBe("dispatched");
    expect(dispatcher.jobs[1]).toMatchObject({ runId: "slice-3", reason: "initial" });

    const slice3 = await ledger.getByRunId("slice-3");
    if (!slice3) throw new Error("slice-3 missing");
    const completed3 = complete(slice3.run, "2026-08-25T10:00:05.000Z");
    await replaceRun(ledger, completed3);
    const third = await continueAlpha2AfterCompletedRun({
      completedRun: completed3,
      ledger,
      dispatcher,
      planner,
      now: "2026-08-25T10:00:06.000Z",
    });
    expect(third.state).toBe("complete");
    expect(dispatcher.jobs).toHaveLength(2);

    const savedRoot = await ledger.getByRunId("slice-1");
    expect(savedRoot?.run.childRunIds).toEqual(["slice-2"]);
    expect(
      parseAlpha2ContinuationCursor(savedRoot?.run.checkpoints.at(-1)?.cursor),
    ).toEqual({ state: "dispatched", detail: "slice-2" });
  });

  it("creates one durable human gate instead of asking for Go when an action is not auto-eligible", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const root = complete(queuedRun({ id: "gate-parent" }));
    ledger.seed(root);

    const result = await continueAlpha2AfterCompletedRun({
      completedRun: root,
      ledger,
      dispatcher,
      planner: {
        plan({ completedRun }) {
          return {
            state: "continue",
            task: TASK,
            nextRun: queuedRun({
              id: "merge-child",
              parentRunId: completedRun.runId,
              rootRunId: completedRun.rootRunId,
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
      now: "2026-08-25T10:01:00.000Z",
    });

    expect(result.state).toBe("human_gate");
    if (result.state !== "human_gate") throw new Error("unexpected continuation state");
    expect(result.gateRun.status).toBe("human_gate");
    expect(result.gateRun.humanGate.reason).toContain("human_sovereignty:merge_code");
    expect(dispatcher.jobs).toEqual([]);
  });

  it("keeps the child durable for recovery when Redis dispatch is unavailable", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    dispatcher.fail = true;
    const root = complete(queuedRun({ id: "redis-parent" }));
    ledger.seed(root);

    const result = await continueAlpha2AfterCompletedRun({
      completedRun: root,
      ledger,
      dispatcher,
      planner: {
        plan({ completedRun }) {
          return {
            state: "continue",
            task: TASK,
            action: safeAction(),
            nextRun: queuedRun({
              id: "redis-child",
              parentRunId: completedRun.runId,
              rootRunId: completedRun.rootRunId,
            }),
          };
        },
      },
      now: "2026-08-25T10:02:00.000Z",
    });

    expect(result.state).toBe("dispatched");
    expect(await ledger.getByRunId("redis-child")).toMatchObject({
      run: { status: "queued", parentRunId: "redis-parent" },
    });
    expect(dispatcher.jobs).toEqual([]);
  });
});
