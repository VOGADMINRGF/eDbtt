import { describe, expect, it, vi } from "vitest";
import {
  recoverAlpha2DueRuns,
  createAlpha2ResolvingExecutor,
  runAlpha2DurableStep as runAlpha2DurableStepInternal,
  startAlpha2RecoveryScheduler,
  type Alpha2WorkerExecutor,
  type Alpha2WorkerOutcome,
} from "@/features/agenticRuntime/alpha2DurableOrchestrator";
import type {
  Alpha2ExecutionDispatch,
  Alpha2ExecutionDispatcher,
  Alpha2ExecutionJob,
} from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import { dispatchAlpha2Execution } from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import {
  isAlpha2HumanStoppedRun,
  isAlpha2RunDue,
  isAlpha2TerminalRun,
  type Alpha2RunLedger,
  type Alpha2VersionedRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import {
  Alpha2RunRecordSchema,
  createAlpha2RunRecord,
  transitionAlpha2Run,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

class FakeLedger implements Alpha2RunLedger {
  private records = new Map<string, Alpha2VersionedRun>();
  leaseOwners: string[] = [];
  serverNow: string | undefined;
  serverNowAfterNextCompareAndSwap: string | undefined;
  listRecoverableBarrier: Promise<void> | undefined;
  listRecoverableError: Error | undefined;
  onListRecoverable: (() => void) | undefined;

  seed(run: Alpha2RunRecord) {
    this.records.set(run.runId, { run, version: 0, lease: null });
  }

  stealLease(runId: string, owner: string, expiresAt: string) {
    const current = this.records.get(runId);
    if (!current) throw new Error("missing test run");
    this.records.set(runId, { ...current, lease: { owner, expiresAt } });
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

  async compareAndSwap(input: {
    run: Alpha2RunRecord;
    expectedVersion: number;
    lease?: { owner: string; now: string };
    resumeAfterMs?: number;
    initializeWallClock?: { maxWallClockMs?: number };
    stampCheckpointId?: string;
  }) {
    const current = this.records.get(input.run.runId);
    if (!current || current.version !== input.expectedVersion) {
      throw new Error("alpha2_ledger_version_conflict");
    }
    if (
      input.lease &&
      (current.lease?.owner !== input.lease.owner ||
        Date.parse(current.lease.expiresAt) <=
          Date.parse(this.serverNow ?? input.lease.now))
    ) {
      throw new Error("alpha2_ledger_lease_lost");
    }
    const authoritativeNow = this.serverNow ?? input.lease?.now ?? input.run.updatedAt;
    const checkpoints = input.stampCheckpointId
      ? input.run.checkpoints.map((checkpoint) =>
          checkpoint.checkpointId === input.stampCheckpointId
            ? { ...checkpoint, createdAt: authoritativeNow }
            : checkpoint,
        )
      : input.run.checkpoints;
    const run = Alpha2RunRecordSchema.parse({
      ...input.run,
      updatedAt: authoritativeNow,
      finishedAt: input.run.finishedAt ? authoritativeNow : undefined,
      checkpoints,
      ...(input.resumeAfterMs === undefined
        ? {}
        : {
            resumeAt: new Date(
              Date.parse(authoritativeNow) + Math.max(0, Math.floor(input.resumeAfterMs)),
            ).toISOString(),
          }),
      ...(input.initializeWallClock
        ? {
            startedAt: authoritativeNow,
            wallClockDeadlineAt:
              input.initializeWallClock.maxWallClockMs === undefined
                ? undefined
                : new Date(
                    Date.parse(authoritativeNow) + input.initializeWallClock.maxWallClockMs,
                  ).toISOString(),
          }
        : {}),
    });
    const next = {
      run,
      version: current.version + 1,
      lease: current.lease,
    } satisfies Alpha2VersionedRun;
    this.records.set(input.run.runId, next);
    if (this.serverNowAfterNextCompareAndSwap) {
      this.serverNow = this.serverNowAfterNextCompareAndSwap;
      this.serverNowAfterNextCompareAndSwap = undefined;
    }
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
      current.lease && Date.parse(current.lease.expiresAt) > Date.parse(input.now)
    ) {
      return null;
    }
    const leaseNow = this.serverNow ?? input.now;
    const next = {
      ...current,
      lease: {
        owner: input.owner,
        expiresAt: new Date(Date.parse(leaseNow) + input.leaseMs).toISOString(),
      },
    };
    this.leaseOwners.push(input.owner);
    this.records.set(input.runId, next);
    return next;
  }

  async renewLease(input: {
    runId: string;
    owner: string;
    now: string;
    leaseMs: number;
  }) {
    const current = this.records.get(input.runId);
    const leaseNow =
      this.serverNow ??
      (current?.lease
        ? new Date(Date.parse(current.lease.expiresAt) - input.leaseMs).toISOString()
        : input.now);
    if (
      !current ||
      current.lease?.owner !== input.owner ||
      Date.parse(current.lease.expiresAt) <= Date.parse(leaseNow)
    ) {
      return null;
    }
    const next = {
      ...current,
      lease: {
        owner: input.owner,
        expiresAt: new Date(Date.parse(leaseNow) + input.leaseMs).toISOString(),
      },
    } satisfies Alpha2VersionedRun;
    this.records.set(input.runId, next);
    return next;
  }

  async isRunDue(input: { runId: string; now: string }) {
    const current = this.records.get(input.runId);
    if (!current || isAlpha2TerminalRun(current.run) || isAlpha2HumanStoppedRun(current.run)) {
      return false;
    }
    if (current.run.status === "queued" || current.run.status === "running") return true;
    return Boolean(current.run.resumeAt) && isAlpha2RunDue(current.run, input.now);
  }

  async releaseLease(input: { runId: string; owner: string }) {
    const current = this.records.get(input.runId);
    if (!current || current.lease?.owner !== input.owner) return;
    this.records.set(input.runId, { ...current, lease: null });
  }

  async listRecoverable(input: { now: string; limit?: number }) {
    this.onListRecoverable?.();
    await this.listRecoverableBarrier;
    if (this.listRecoverableError) throw this.listRecoverableError;
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

const AUTHORIZED_OPENTASKS = `
## Kanonischer Operativteil
| ID | Status | Priorität | Abhängigkeiten | Scope / Ziel | Akzeptanzkriterien / Evidence |
| --- | --- | --- | --- | --- | --- |
| ALPHA2-TEST-01 | in_progress | P0 |  | Test | Test |
## Historischer Katalog und Evidenz
`;

function runAlpha2DurableStep(
  input: Omit<Parameters<typeof runAlpha2DurableStepInternal>[0], "currentHeadSha"> & {
    currentHeadSha?: string;
  },
) {
  const observedAt =
    input.ledger instanceof FakeLedger && input.ledger.serverNow
      ? input.ledger.serverNow
      : (input.now ?? new Date().toISOString());
  return runAlpha2DurableStepInternal({
    ...input,
    currentHeadSha: input.currentHeadSha ?? "1111111111111111111111111111111111111111",
    authorization: input.authorization ?? {
      observedHeadSha: "1111111111111111111111111111111111111111",
      observedAt,
      openTasksText: AUTHORIZED_OPENTASKS,
      ownership: {
        branch: "feat/alpha2-test",
        prNumber: 637,
        exactHead: true,
        ciState: "success",
        unresolvedReviewThreads: 0,
      },
      action: {
        actionKind: "read_only",
        riskClass: "green",
        confidence: "high",
        reversible: true,
        evidenceRefs: ["test:alpha2-runtime-authorization"],
      },
    },
  });
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
  it("persists a human gate before executing a blocked OpenTasks task", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-blocked-task"));
    let executed = false;

    const result = await runAlpha2DurableStepInternal({
      runId: "run-blocked-task",
      workerId: "worker-gated",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          executed = true;
          return { type: "completed", checkpointId: "must-not-run" };
        },
      },
      currentHeadSha: "1111111111111111111111111111111111111111",
      authorization: {
        observedHeadSha: "1111111111111111111111111111111111111111",
        observedAt: "2026-08-23T20:00:00.000Z",
        openTasksText: AUTHORIZED_OPENTASKS.replace("in_progress", "blocked"),
        ownership: {
          branch: "feat/alpha2-test",
          prNumber: 637,
          exactHead: true,
          ciState: "success",
          unresolvedReviewThreads: 0,
        },
        action: {
          actionKind: "read_only",
          riskClass: "green",
          confidence: "high",
          reversible: true,
          evidenceRefs: ["test:blocked-task"],
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(executed).toBe(false);
    expect(result.state).toBe("execution_blocked");
    if (result.state !== "execution_blocked") throw new Error("unexpected state");
    expect(result.reasonCodes).toContain("task_blocked");
    expect(result.run.status).toBe("human_gate");
    expect(result.run.humanGate.state).toBe("pending");
  });

  it("persists a human gate before executing an orange action", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(
      createAlpha2RunRecord({
        runId: "run-orange-action",
        idempotencyKey: "idem-run-orange-action",
        taskId: "ALPHA2-TEST-01",
        kind: "engineering_slice",
        primaryRole: "governance_compliance",
        riskClass: "orange",
        route: { mode: "automatic", capabilityClass: "test" },
        now: "2026-08-23T20:00:00.000Z",
      }),
    );

    const result = await runAlpha2DurableStepInternal({
      runId: "run-orange-action",
      workerId: "worker-gated",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          throw new Error("must not execute");
        },
      },
      currentHeadSha: "1111111111111111111111111111111111111111",
      authorization: {
        observedHeadSha: "1111111111111111111111111111111111111111",
        observedAt: "2026-08-23T20:00:00.000Z",
        openTasksText: AUTHORIZED_OPENTASKS,
        ownership: {
          branch: "feat/alpha2-test",
          prNumber: 637,
          exactHead: true,
          ciState: "success",
          unresolvedReviewThreads: 0,
        },
        action: {
          actionKind: "read_only",
          riskClass: "orange",
          confidence: "high",
          reversible: true,
          evidenceRefs: ["test:orange-action"],
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("execution_blocked");
    if (result.state !== "execution_blocked") throw new Error("unexpected state");
    expect(result.reasonCodes).toContain("risk_class:orange");
    expect(result.run.status).toBe("human_gate");
  });

  it("consumes an approval only for the exact runtime action gate it resolves", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(
      createAlpha2RunRecord({
        runId: "run-approved-orange-action",
        idempotencyKey: "idem-run-approved-orange-action",
        taskId: "ALPHA2-TEST-01",
        kind: "engineering_slice",
        primaryRole: "governance_compliance",
        riskClass: "orange",
        route: { mode: "automatic", capabilityClass: "test" },
        budget: { maxAttempts: 1 },
        now: "2026-08-23T20:00:00.000Z",
      }),
    );
    const authorization = {
      observedHeadSha: "1111111111111111111111111111111111111111",
      observedAt: "2026-08-23T20:00:00.000Z",
      openTasksText: AUTHORIZED_OPENTASKS,
      ownership: {
        branch: "feat/alpha2-test",
        prNumber: 637,
        exactHead: true,
        ciState: "success" as const,
        unresolvedReviewThreads: 0,
      },
      action: {
        actionKind: "read_only" as const,
        riskClass: "orange" as const,
        confidence: "high" as const,
        reversible: true,
        evidenceRefs: ["test:approved-orange-action"],
      },
    };

    const blocked = await runAlpha2DurableStepInternal({
      runId: "run-approved-orange-action",
      workerId: "worker-gated",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          throw new Error("must not execute");
        },
      },
      currentHeadSha: authorization.observedHeadSha,
      authorization,
      now: authorization.observedAt,
    });
    expect(blocked.state).toBe("execution_blocked");
    if (blocked.state !== "execution_blocked") throw new Error("unexpected state");
    expect(blocked.run.humanGate.gateRef).toMatch(/^alpha2_gate_[a-f0-9]{64}$/);

    const approved = transitionAlpha2Run(blocked.run, "running", {
      now: "2026-08-23T20:00:01.000Z",
      humanGate: {
        state: "approved",
        reason: blocked.run.humanGate.reason,
        gateRef: blocked.run.humanGate.gateRef,
        resumeMode: blocked.run.humanGate.resumeMode,
        decisionRef: "human:orange-action-approval",
        decidedAt: "2026-08-23T20:00:01.000Z",
      },
    });
    ledger.seed(approved);
    let executions = 0;

    const executed = await runAlpha2DurableStepInternal({
      runId: "run-approved-orange-action",
      workerId: "worker-gated",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          executions += 1;
          return {
            type: "failed",
            checkpointId: "cp-approved-orange",
            errorCode: "approved_action_failed",
            retryable: true,
          };
        },
      },
      currentHeadSha: authorization.observedHeadSha,
      authorization: { ...authorization, observedAt: "2026-08-23T20:00:01.000Z" },
      now: "2026-08-23T20:00:01.000Z",
    });

    expect(executions).toBe(1);
    expect(executed.state).toBe("executed");
    if (executed.state !== "executed") throw new Error("unexpected state");
    expect(executed.run.attempt).toBe(1);
    expect(executed.run.status).toBe("failed");
    expect(executed.run.resumeAt).toBeUndefined();
    expect(executed.run.humanGate.state).toBe("not_required");
    expect(executed.run.humanGateHistory).toContainEqual(
      expect.objectContaining({
        state: "approved",
        gateRef: blocked.run.humanGate.gateRef,
        decisionRef: "human:orange-action-approval",
      }),
    );
  });

  it("preserves an earlier gate approval while recording a new runtime block", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(
      createAlpha2RunRecord({
        runId: "run-approved-then-blocked",
        idempotencyKey: "idem-run-approved-then-blocked",
        taskId: "ALPHA2-TEST-01",
        kind: "engineering_slice",
        primaryRole: "governance_compliance",
        riskClass: "green",
        route: { mode: "automatic", capabilityClass: "test" },
        humanGate: {
          state: "approved",
          decisionRef: "human:approval-1",
          decidedAt: "2026-08-23T19:55:00.000Z",
        },
        now: "2026-08-23T20:00:00.000Z",
      }),
    );

    const result = await runAlpha2DurableStepInternal({
      runId: "run-approved-then-blocked",
      workerId: "worker-gated",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          throw new Error("must not execute");
        },
      },
      currentHeadSha: "1111111111111111111111111111111111111111",
      authorization: {
        observedHeadSha: "1111111111111111111111111111111111111111",
        observedAt: "2026-08-23T20:00:00.000Z",
        openTasksText: AUTHORIZED_OPENTASKS.replace("in_progress", "blocked"),
        ownership: {
          branch: "feat/alpha2-test",
          prNumber: 637,
          exactHead: true,
          ciState: "success",
          unresolvedReviewThreads: 0,
        },
        action: {
          actionKind: "read_only",
          riskClass: "green",
          confidence: "high",
          reversible: true,
          evidenceRefs: ["test:new-runtime-block"],
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("execution_blocked");
    if (result.state !== "execution_blocked") throw new Error("unexpected state");
    expect(result.run.status).toBe("human_gate");
    expect(result.run.humanGate).toMatchObject({ state: "pending", reason: "task_blocked" });
    expect(result.run.humanGateHistory).toContainEqual(
      expect.objectContaining({ state: "approved", decisionRef: "human:approval-1" }),
    );
    expect(result.run.checkpoints.at(-1)?.evidenceRefs).toContain("task_blocked");
    expect(() =>
      transitionAlpha2Run(result.run, "running", {
        now: "2026-08-23T20:01:00.000Z",
      }),
    ).toThrow("alpha2_human_gate_exit_requires_approval");
  });

  it("fails closed when authorization is stale or belongs to another exact head", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-stale-authorization"));
    let executions = 0;

    const result = await runAlpha2DurableStep({
      runId: "run-stale-authorization",
      workerId: "worker-gated",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          executions += 1;
          return { type: "completed", checkpointId: "must-not-run" };
        },
      },
      currentHeadSha: "2222222222222222222222222222222222222222",
      authorization: {
        observedHeadSha: "1111111111111111111111111111111111111111",
        observedAt: "2026-08-23T19:00:00.000Z",
        openTasksText: AUTHORIZED_OPENTASKS,
        ownership: {
          branch: "feat/alpha2-test",
          prNumber: 637,
          exactHead: true,
          ciState: "success",
          unresolvedReviewThreads: 0,
        },
        action: {
          actionKind: "read_only",
          riskClass: "green",
          confidence: "high",
          reversible: true,
          evidenceRefs: ["test:stale-authorization"],
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(executions).toBe(0);
    expect(result.state).toBe("execution_blocked");
    if (result.state !== "execution_blocked") throw new Error("unexpected state");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining([
        "authorization_head_sha_mismatch",
        "authorization_evidence_stale",
      ]),
    );
  });

  it("revalidates authorization freshness after a slow start transition", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.serverNow = "2026-08-23T20:00:00.000Z";
    ledger.serverNowAfterNextCompareAndSwap = "2026-08-23T20:00:02.000Z";
    ledger.seed(run("run-authorization-stale-at-start"));
    let executions = 0;

    const result = await runAlpha2DurableStep({
      runId: "run-authorization-stale-at-start",
      workerId: "worker-gated",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          executions += 1;
          return { type: "completed", checkpointId: "must-not-run" };
        },
      },
      authorizationMaxAgeMs: 1_000,
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(executions).toBe(0);
    expect(result.state).toBe("execution_blocked");
    if (result.state !== "execution_blocked") throw new Error("unexpected state");
    expect(result.reasonCodes).toContain("authorization_evidence_stale");
  });

  it("fails closed on unmetered durable model-call and cost budgets", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(
      createAlpha2RunRecord({
        runId: "run-unmetered-budget",
        idempotencyKey: "idem-run-unmetered-budget",
        taskId: "ALPHA2-TEST-01",
        kind: "engineering_slice",
        primaryRole: "governance_compliance",
        riskClass: "green",
        route: { mode: "automatic", capabilityClass: "test" },
        budget: { maxAttempts: 3, maxModelCalls: 1, maxEstimatedCostEur: 0.1 },
        now: "2026-08-23T20:00:00.000Z",
      }),
    );

    const result = await runAlpha2DurableStep({
      runId: "run-unmetered-budget",
      workerId: "worker-budget",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          throw new Error("must not execute");
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("execution_blocked");
    if (result.state !== "execution_blocked") throw new Error("unexpected state");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining([
        "durable_model_call_metering_not_available",
        "durable_cost_metering_not_available",
      ]),
    );
  });

  it("bounds executor resolution even when the resolver never settles", async () => {
    const executor = createAlpha2ResolvingExecutor({
      resolutionTimeoutMs: 10,
      resolver: {
        resolve() {
          return new Promise<Alpha2WorkerExecutor>(() => undefined);
        },
      },
    });

    await expect(
      executor.execute({
        run: run("run-resolver-timeout"),
        workerId: "worker-resolver",
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow("alpha2_executor_resolution_timeout");
  });

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
    expect(ledger.leaseOwners[1]).toContain(":attempt-1:");
    expect(second.run.checkpoints.map((entry) => entry.checkpointId)).toEqual([
      "cp-wait",
      "cp-done",
    ]);
  });

  it("derives a persisted resume deadline from authoritative ledger time", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.serverNow = "2026-08-23T20:05:00.000Z";
    ledger.seed(run("run-server-resume"));

    const result = await runAlpha2DurableStep({
      runId: "run-server-resume",
      workerId: "worker-clock-skew",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return {
            type: "waiting",
            checkpointId: "cp-server-resume",
            resumeAfterMs: 60_000,
          };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.resumeAt).toBe("2026-08-23T20:06:00.000Z");
    expect(dispatcher.jobs[0]?.delayMs).toBe(60_000);
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

  it("persists a synchronous executor throw as a retryable failed outcome", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-sync-throw"));

    const result = await runAlpha2DurableStep({
      runId: "run-sync-throw",
      workerId: "worker-sync",
      ledger,
      dispatcher,
      executor: {
        execute() {
          throw Object.assign(new Error("sync failure"), { code: "sync_executor_failure" });
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.lastErrorCode).toBe("sync_executor_failure");
    expect(result.run.resumeAt).toBe("2026-08-23T20:00:30.000Z");
  });

  it("distinguishes a server-not-due run from lease contention", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const running = transitionAlpha2Run(run("run-not-due"), "running", {
      now: "2026-08-23T20:00:00.000Z",
    });
    const waiting = transitionAlpha2Run(running, "waiting", {
      now: "2026-08-23T20:00:00.000Z",
      resumeAt: "2026-08-23T21:00:00.000Z",
    });
    ledger.seed(waiting);

    const result = await runAlpha2DurableStep({
      runId: "run-not-due",
      workerId: "worker-early",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return { type: "completed", checkpointId: "cp-too-early" };
        },
      },
      now: "2026-08-23T20:30:00.000Z",
    });

    expect(result.state).toBe("not_due");
    expect(dispatcher.jobs).toEqual([]);
  });

  it("does not let concurrent deliveries from the same process share a lease", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-concurrent"));
    let unblock!: () => void;
    let markStarted!: () => void;
    const blocked = new Promise<void>((resolve) => {
      unblock = resolve;
    });
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });

    const first = runAlpha2DurableStep({
      runId: "run-concurrent",
      workerId: "worker-process-a",
      executionId: "delivery-1",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          markStarted();
          await blocked;
          return { type: "completed", checkpointId: "cp-first" };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });
    await started;

    const second = await runAlpha2DurableStep({
      runId: "run-concurrent",
      workerId: "worker-process-a",
      executionId: "delivery-2",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return { type: "completed", checkpointId: "cp-second" };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(second).toEqual({ state: "lease_not_acquired", runId: "run-concurrent" });
    unblock();
    expect((await first).state).toBe("executed");
  });

  it("refuses to persist an outcome after the attempt lease was lost", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-fenced"));

    await expect(
      runAlpha2DurableStep({
        runId: "run-fenced",
        workerId: "worker-a",
        executionId: "delivery-a",
        ledger,
        dispatcher,
        executor: {
          async execute() {
            ledger.stealLease(
              "run-fenced",
              "worker-b:run-fenced:attempt-1:version-1:delivery-b",
              "2026-08-23T21:00:00.000Z",
            );
            return { type: "completed", checkpointId: "cp-stale" };
          },
        },
        now: "2026-08-23T20:00:00.000Z",
      }),
    ).rejects.toThrow("alpha2_ledger_lease_lost");

    const stored = await ledger.getByRunId("run-fenced");
    expect(stored?.run.status).toBe("running");
    expect(stored?.run.checkpoints).toEqual([]);
  });

  it("aborts execution and rejects fenced side effects after heartbeat ownership is lost", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-fenced-effect"));
    let sideEffects = 0;
    let signalAborted = false;

    await expect(
      runAlpha2DurableStep({
        runId: "run-fenced-effect",
        workerId: "worker-a",
        executionId: "delivery-a",
        ledger,
        dispatcher,
        executor: {
          async execute({ signal, fence }) {
            ledger.stealLease(
              "run-fenced-effect",
              "worker-b:run-fenced-effect:attempt-1:version-1:delivery-b",
              "2026-08-23T21:00:00.000Z",
            );
            await expect(
              fence.runSideEffect({
                effectId: "publish-result",
                sink: ({ attemptToken }) => {
                  expect(attemptToken).toBe(fence.token);
                  sideEffects += 1;
                },
              }),
            ).rejects.toThrow("alpha2_ledger_lease_lost");
            signalAborted = signal.aborted;
            return { type: "completed", checkpointId: "must-not-persist" };
          },
        },
        now: "2026-08-23T20:00:00.000Z",
      }),
    ).rejects.toThrow("alpha2_ledger_lease_lost");

    expect(sideEffects).toBe(0);
    expect(signalAborted).toBe(true);
    expect((await ledger.getByRunId("run-fenced-effect"))?.run.checkpoints).toEqual([]);
  });

  it("supplies effect sinks with a stable key and monotonic lease generation", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-fenced-sink"));
    let sinkFence:
      | { idempotencyKey: string; generation: number; attemptToken: string; activeAt: string }
      | undefined;

    const result = await runAlpha2DurableStep({
      runId: "run-fenced-sink",
      workerId: "worker-sink",
      executionId: "delivery-sink",
      ledger,
      dispatcher,
      executor: {
        async execute({ fence }) {
          await fence.runSideEffect({
            effectId: "publish-result",
            async sink(input) {
              sinkFence = {
                idempotencyKey: input.idempotencyKey,
                generation: input.generation,
                attemptToken: input.attemptToken,
                activeAt: await input.assertActive(),
              };
            },
          });
          return { type: "completed", checkpointId: "cp-fenced-sink" };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    expect(sinkFence).toMatchObject({
      idempotencyKey: expect.stringMatching(/^alpha2_effect_[a-f0-9]{64}$/),
      generation: 1,
      attemptToken: expect.stringContaining("delivery-sink"),
      activeAt: "2026-08-23T20:00:00.000Z",
    });
  });

  it("charges an abandoned running step against the retry budget", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const abandoned = transitionAlpha2Run(run("run-abandoned"), "running", {
      now: "2026-08-23T20:00:00.000Z",
    });
    ledger.seed(abandoned);

    const result = await runAlpha2DurableStep({
      runId: "run-abandoned",
      workerId: "worker-recovery",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return { type: "completed", checkpointId: "cp-recovered" };
        },
      },
      now: "2026-08-23T20:02:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.attempt).toBe(2);
    expect(result.run.status).toBe("completed");
  });

  it("fails closed when an abandoned running step exhausted its attempt budget", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const limited = createAlpha2RunRecord({
      runId: "run-exhausted",
      idempotencyKey: "idem-run-exhausted",
      taskId: "ALPHA2-TEST-01",
      kind: "engineering_slice",
      primaryRole: "governance_compliance",
      riskClass: "green",
      route: { mode: "automatic", capabilityClass: "test" },
      budget: { maxAttempts: 1 },
      now: "2026-08-23T20:00:00.000Z",
    });
    ledger.seed(
      transitionAlpha2Run(limited, "running", { now: "2026-08-23T20:00:00.000Z" }),
    );
    let executions = 0;

    const result = await runAlpha2DurableStep({
      runId: "run-exhausted",
      workerId: "worker-recovery",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          executions += 1;
          return { type: "completed", checkpointId: "cp-impossible" };
        },
      },
      now: "2026-08-23T20:02:00.000Z",
    });

    expect(result.state).toBe("attempts_exhausted");
    if (result.state !== "attempts_exhausted") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.lastErrorCode).toBe("alpha2_attempt_budget_exhausted");
    expect(result.run.attempt).toBe(1);
    expect(executions).toBe(0);
  });

  it.each(["failed", "completed"] as const)(
    "replaces an identical retained %s BullMQ recovery job",
    async (retainedState) => {
      let removed = false;
      const added: Array<{ name: string; options: { jobId: string; delay: number } }> = [];
      const queue = {
        async getJob() {
          if (removed) return undefined;
          return {
            id: "alpha2_run-recovery_recovery_v1_start",
            data: {
              runId: "run-recovery",
              taskId: "ALPHA2-TEST-01",
              dispatchKey: "recovery_v1_start",
              reason: "recovery" as const,
              requestedAt: "2026-08-23T20:00:00.000Z",
            },
            async getState() {
              return retainedState;
            },
            async remove() {
              removed = true;
            },
          };
        },
        async add(
          name: string,
          _data: Alpha2ExecutionJob,
          options: { jobId: string; delay: number },
        ) {
          added.push({ name, options });
          return { id: options.jobId };
        },
      };

      const dispatched = await dispatchAlpha2Execution(queue, {
        runId: "run-recovery",
        taskId: "ALPHA2-TEST-01",
        dispatchKey: "recovery_v1_start",
        reason: "recovery",
        requestedAt: "2026-08-23T20:00:00.000Z",
      });

      expect(removed).toBe(true);
      expect(added).toHaveLength(1);
      expect(added[0]?.options.jobId).toBe(dispatched.jobId);
    },
  );

  it("aborts and persists failure when the durable wall-clock budget expires", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const limited = createAlpha2RunRecord({
      runId: "run-wall-clock",
      idempotencyKey: "idem-run-wall-clock",
      taskId: "ALPHA2-TEST-01",
      kind: "engineering_slice",
      primaryRole: "governance_compliance",
      riskClass: "green",
      route: { mode: "automatic", capabilityClass: "test" },
      budget: { maxAttempts: 3, maxWallClockMs: 10 },
      now: "2026-08-23T20:00:00.000Z",
    });
    ledger.seed(limited);
    let aborted = false;

    const result = await runAlpha2DurableStep({
      runId: "run-wall-clock",
      workerId: "worker-budget",
      ledger,
      dispatcher,
      executor: {
        execute({ signal }) {
          return new Promise((_resolve, reject) => {
            signal.addEventListener("abort", () => {
              aborted = true;
              reject(new Error("aborted"));
            });
          });
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(aborted).toBe(true);
    expect(result.run.status).toBe("failed");
    expect(result.run.lastErrorCode).toBe("alpha2_wall_clock_budget_exhausted");
    expect(result.run.resumeAt).toBeUndefined();
    expect(dispatcher.jobs).toEqual([]);
  });

  it("evaluates a persisted wall-clock deadline against authoritative lease time", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.serverNow = "2026-08-23T20:00:00.500Z";
    ledger.seed(
      Alpha2RunRecordSchema.parse({
        ...createAlpha2RunRecord({
          runId: "run-authoritative-wall-clock",
          idempotencyKey: "idem-run-authoritative-wall-clock",
          taskId: "ALPHA2-TEST-01",
          kind: "engineering_slice",
          primaryRole: "governance_compliance",
          riskClass: "green",
          route: { mode: "automatic", capabilityClass: "test" },
          budget: { maxAttempts: 3, maxWallClockMs: 1_000 },
          now: "2026-08-23T20:00:00.000Z",
        }),
        startedAt: "2026-08-23T20:00:00.000Z",
        wallClockDeadlineAt: "2026-08-23T20:00:01.000Z",
      }),
    );

    const result = await runAlpha2DurableStep({
      runId: "run-authoritative-wall-clock",
      workerId: "worker-clock-skew",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return { type: "completed", checkpointId: "cp-within-server-deadline" };
        },
      },
      now: "2026-08-23T21:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("completed");
  });

  it("refreshes authoritative server time immediately before starting execution", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.serverNow = "2026-08-23T20:00:00.000Z";
    ledger.seed(
      Alpha2RunRecordSchema.parse({
        ...createAlpha2RunRecord({
          runId: "run-deadline-during-authorization",
          idempotencyKey: "idem-run-deadline-during-authorization",
          taskId: "ALPHA2-TEST-01",
          kind: "engineering_slice",
          primaryRole: "governance_compliance",
          riskClass: "green",
          route: { mode: "automatic", capabilityClass: "test" },
          budget: { maxAttempts: 3, maxWallClockMs: 1_000 },
          now: "2026-08-23T20:00:00.000Z",
        }),
        startedAt: "2026-08-23T20:00:00.000Z",
        wallClockDeadlineAt: "2026-08-23T20:00:01.000Z",
      }),
    );
    let executions = 0;

    const result = await runAlpha2DurableStepInternal({
      runId: "run-deadline-during-authorization",
      workerId: "worker-clock-skew",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          executions += 1;
          return { type: "completed", checkpointId: "must-not-run" };
        },
      },
      currentHeadSha: "1111111111111111111111111111111111111111",
      authorizationResolver: (_run, context) => {
        ledger.serverNow = "2026-08-23T20:00:02.000Z";
        return {
          observedHeadSha: context.currentHeadSha,
          observedAt: context.observedAt,
          openTasksText: AUTHORIZED_OPENTASKS,
          ownership: {
            branch: "feat/alpha2-test",
            prNumber: 637,
            exactHead: true,
            ciState: "success",
            unresolvedReviewThreads: 0,
          },
          action: {
            actionKind: "read_only",
            riskClass: "green",
            confidence: "high",
            reversible: true,
            evidenceRefs: ["test:deadline-refresh"],
          },
        };
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(executions).toBe(0);
    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.lastErrorCode).toBe("alpha2_wall_clock_budget_exhausted");
  });

  it("keeps timeout failure authoritative when an abort handler resolves normally", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const limited = createAlpha2RunRecord({
      runId: "run-abort-resolution",
      idempotencyKey: "idem-run-abort-resolution",
      taskId: "ALPHA2-TEST-01",
      kind: "engineering_slice",
      primaryRole: "governance_compliance",
      riskClass: "green",
      route: { mode: "automatic", capabilityClass: "test" },
      budget: { maxAttempts: 3, maxWallClockMs: 10 },
      now: "2026-08-23T20:00:00.000Z",
    });
    ledger.seed(limited);

    const result = await runAlpha2DurableStep({
      runId: "run-abort-resolution",
      workerId: "worker-budget",
      ledger,
      dispatcher,
      executor: {
        execute({ signal }) {
          return new Promise((resolve) => {
            signal.addEventListener("abort", () => {
              resolve({ type: "completed", checkpointId: "cp-abort-cleanup" });
            });
          });
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.lastErrorCode).toBe("alpha2_wall_clock_budget_exhausted");
    expect(result.run.checkpoints.at(-1)?.checkpointId).toContain("wall_clock_");
  });

  it("keeps the lease fenced until an abort-ignoring executor actually terminates", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(
      createAlpha2RunRecord({
        runId: "run-abort-ignored",
        idempotencyKey: "idem-run-abort-ignored",
        taskId: "ALPHA2-TEST-01",
        kind: "engineering_slice",
        primaryRole: "governance_compliance",
        riskClass: "green",
        route: { mode: "automatic", capabilityClass: "test" },
        budget: { maxAttempts: 3, maxWallClockMs: 10 },
        now: "2026-08-23T20:00:00.000Z",
      }),
    );
    let settleExecutor!: (outcome: Alpha2WorkerOutcome) => void;
    let observeAbort!: () => void;
    const abortObserved = new Promise<void>((resolve) => {
      observeAbort = resolve;
    });

    const execution = runAlpha2DurableStep({
      runId: "run-abort-ignored",
      workerId: "worker-budget",
      ledger,
      dispatcher,
      executor: {
        execute({ signal }) {
          signal.addEventListener("abort", observeAbort, { once: true });
          return new Promise<Alpha2WorkerOutcome>((resolve) => {
            settleExecutor = resolve;
          });
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    await abortObserved;
    let handlerSettled = false;
    void execution.finally(() => {
      handlerSettled = true;
    });
    await Promise.resolve();
    expect(handlerSettled).toBe(false);
    expect((await ledger.getByRunId("run-abort-ignored"))?.run.status).toBe("running");
    expect((await ledger.getByRunId("run-abort-ignored"))?.lease).not.toBeNull();

    settleExecutor({ type: "completed", checkpointId: "ignored-after-timeout" });
    const result = await execution;
    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.lastErrorCode).toBe("alpha2_wall_clock_budget_exhausted");
  });

  it("rejects executor completion after an event-loop-blocked wall-clock deadline", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const limited = createAlpha2RunRecord({
      runId: "run-blocked-deadline",
      idempotencyKey: "idem-run-blocked-deadline",
      taskId: "ALPHA2-TEST-01",
      kind: "engineering_slice",
      primaryRole: "governance_compliance",
      riskClass: "green",
      route: { mode: "automatic", capabilityClass: "test" },
      budget: { maxAttempts: 3, maxWallClockMs: 10 },
      now: "2026-08-23T20:00:00.000Z",
    });
    ledger.seed(limited);

    const result = await runAlpha2DurableStep({
      runId: "run-blocked-deadline",
      workerId: "worker-budget",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          const blockedUntil = globalThis.performance.now() + 25;
          while (globalThis.performance.now() < blockedUntil) {
            // Model synchronous executor work that prevents the timeout callback from running.
          }
          return { type: "completed", checkpointId: "cp-too-late" };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.lastErrorCode).toBe("alpha2_wall_clock_budget_exhausted");
    expect(result.run.checkpoints.at(-1)?.checkpointId).toContain("wall_clock_");
  });

  it("chunks wall-clock budgets above Node's maximum timer delay", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const limited = createAlpha2RunRecord({
      runId: "run-long-budget",
      idempotencyKey: "idem-run-long-budget",
      taskId: "ALPHA2-TEST-01",
      kind: "engineering_slice",
      primaryRole: "governance_compliance",
      riskClass: "green",
      route: { mode: "automatic", capabilityClass: "test" },
      budget: { maxAttempts: 3, maxWallClockMs: 2_147_483_648 },
      now: "2026-08-23T20:00:00.000Z",
    });
    ledger.seed(limited);

    try {
      const result = await runAlpha2DurableStep({
        runId: "run-long-budget",
        workerId: "worker-budget",
        ledger,
        dispatcher,
        executor: {
          async execute() {
            return { type: "completed", checkpointId: "cp-within-long-budget" };
          },
        },
        now: "2026-08-23T20:00:00.000Z",
      });

      expect(result.state).toBe("executed");
      const scheduledDelays = timeoutSpy.mock.calls.map((call) => Number(call[1]));
      expect(scheduledDelays.some((delay) => delay > 2_000_000_000)).toBe(true);
      expect(scheduledDelays.every((delay) => delay <= 2_147_483_647)).toBe(true);
    } finally {
      timeoutSpy.mockRestore();
    }
  });

  it("persists outcome audit timestamps from the authoritative ledger clock", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.serverNow = "2026-08-23T20:00:05.000Z";
    ledger.seed(run("run-server-audit-time"));

    const result = await runAlpha2DurableStep({
      runId: "run-server-audit-time",
      workerId: "worker-clock-skew",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return { type: "completed", checkpointId: "cp-server-time" };
        },
      },
      now: "2026-08-23T22:00:00.000Z",
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.updatedAt).toBe(ledger.serverNow);
    expect(result.run.finishedAt).toBe(ledger.serverNow);
    expect(result.run.checkpoints.at(-1)?.createdAt).toBe(ledger.serverNow);
  });

  it("preserves the authoritative timestamp of an existing checkpoint id", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.serverNow = "2026-08-23T20:00:00.000Z";
    ledger.seed(run("run-duplicate-checkpoint"));

    const first = await runAlpha2DurableStep({
      runId: "run-duplicate-checkpoint",
      workerId: "worker-checkpoint",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return { type: "waiting", checkpointId: "cp-repeat", resumeAfterMs: 0 };
        },
      },
      now: "2026-08-23T20:00:00.000Z",
    });
    expect(first.state).toBe("executed");
    if (first.state !== "executed") throw new Error("unexpected state");
    expect(first.run.checkpoints[0]?.createdAt).toBe("2026-08-23T20:00:00.000Z");

    ledger.serverNow = "2026-08-23T20:01:00.000Z";
    const second = await runAlpha2DurableStep({
      runId: "run-duplicate-checkpoint",
      workerId: "worker-checkpoint",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          return { type: "completed", checkpointId: "cp-repeat" };
        },
      },
      now: "2026-08-23T20:01:00.000Z",
    });

    expect(second.state).toBe("executed");
    if (second.state !== "executed") throw new Error("unexpected state");
    expect(second.run.checkpoints).toHaveLength(1);
    expect(second.run.checkpoints[0]?.createdAt).toBe("2026-08-23T20:00:00.000Z");
  });

  it("awaits an in-flight recovery scan before scheduler shutdown completes", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.seed(run("run-recovery-shutdown"));
    let releaseScan!: () => void;
    ledger.listRecoverableBarrier = new Promise<void>((resolve) => {
      releaseScan = resolve;
    });
    let scanStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      scanStarted = resolve;
    });
    ledger.onListRecoverable = scanStarted;

    const scheduler = startAlpha2RecoveryScheduler({ ledger, dispatcher });
    await started;
    const manualScan = scheduler.recoverNow();
    let stopCompleted = false;
    const stopping = scheduler.stop().then(() => {
      stopCompleted = true;
    });
    await Promise.resolve();
    expect(stopCompleted).toBe(false);

    releaseScan();
    const [manualResults] = await Promise.all([manualScan, stopping]);
    expect(stopCompleted).toBe(true);
    expect(manualResults).toHaveLength(1);
    expect(dispatcher.jobs).toHaveLength(1);
  });

  it("propagates a tracked manual recovery failure to its caller", async () => {
    const ledger = new FakeLedger();
    const dispatcher = new FakeDispatcher();
    ledger.listRecoverableError = new Error("mongo_recovery_unavailable");
    let releaseScan!: () => void;
    ledger.listRecoverableBarrier = new Promise<void>((resolve) => {
      releaseScan = resolve;
    });
    let scanStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      scanStarted = resolve;
    });
    ledger.onListRecoverable = scanStarted;
    const onError = vi.fn();

    const scheduler = startAlpha2RecoveryScheduler({ ledger, dispatcher, onError });
    await started;
    const manualScan = scheduler.recoverNow();
    releaseScan();
    await expect(manualScan).rejects.toThrow("mongo_recovery_unavailable");
    await scheduler.stop();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: "mongo_recovery_unavailable",
    }));
  });

  it("hashes the full BullMQ dispatch identity without truncation collisions", async () => {
    const jobIds: string[] = [];
    const queue = {
      async getJob() {
        return undefined;
      },
      async add(
        _name: string,
        _data: Alpha2ExecutionJob,
        options: { jobId: string; delay: number },
      ) {
        jobIds.push(options.jobId);
        return { id: options.jobId };
      },
    };
    const sharedPrefix = "run-" + "a".repeat(220);

    await dispatchAlpha2Execution(queue, {
      runId: `${sharedPrefix}-one`,
      taskId: "ALPHA2-TEST-01",
      dispatchKey: "recovery_v1_start",
      reason: "recovery",
      requestedAt: "2026-08-23T20:00:00.000Z",
    });
    await dispatchAlpha2Execution(queue, {
      runId: `${sharedPrefix}-two`,
      taskId: "ALPHA2-TEST-01",
      dispatchKey: "recovery_v1_start",
      reason: "recovery",
      requestedAt: "2026-08-23T20:00:00.000Z",
    });

    expect(jobIds).toHaveLength(2);
    expect(jobIds[0]).not.toBe(jobIds[1]);
    expect(jobIds.every((jobId) => /^alpha2_[a-f0-9]{64}$/.test(jobId))).toBe(true);
  });
});
