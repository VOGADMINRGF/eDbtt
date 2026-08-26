import { randomUUID } from "node:crypto";
import {
  Alpha2RunRecordSchema,
  appendAlpha2Checkpoint,
  transitionAlpha2Run,
  type Alpha2RunRecord,
  type Alpha2RunStatus,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";
import {
  isAlpha2HumanStoppedRun,
  isAlpha2TerminalRun,
  type Alpha2RunLedger,
  type Alpha2VersionedRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import type {
  Alpha2ExecutionDispatcher,
  Alpha2ExecutionReason,
} from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";

export type Alpha2WorkerOutcomeBase = {
  checkpointId: string;
  cursor?: string;
  evidenceRefs?: string[];
  safeTraceStepRefs?: Alpha2RunRecord["safeTraceStepRefs"];
  artifactRefs?: Alpha2RunRecord["artifactRefs"];
};

export type Alpha2WorkerOutcome =
  | (Alpha2WorkerOutcomeBase & { type: "completed" })
  | (Alpha2WorkerOutcomeBase & { type: "waiting"; resumeAfterMs: number })
  | (Alpha2WorkerOutcomeBase & { type: "review" })
  | (Alpha2WorkerOutcomeBase & { type: "human_gate"; reason: string })
  | (Alpha2WorkerOutcomeBase & {
      type: "failed";
      errorCode: string;
      retryable: boolean;
      retryAfterMs?: number;
    });

export interface Alpha2WorkerExecutor {
  execute(input: {
    run: Alpha2RunRecord;
    workerId: string;
    signal: AbortSignal;
  }): Promise<Alpha2WorkerOutcome>;
}

export type Alpha2DurableStepResult =
  | { state: "missing"; runId: string }
  | { state: "not_due"; run: Alpha2RunRecord }
  | { state: "human_stopped"; run: Alpha2RunRecord }
  | { state: "terminal"; run: Alpha2RunRecord }
  | { state: "lease_not_acquired"; runId: string }
  | { state: "attempts_exhausted"; run: Alpha2RunRecord }
  | {
      state: "executed";
      run: Alpha2RunRecord;
      dispatchedJobId?: string;
    };

function unique(values: readonly string[] = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueArtifacts(values: Alpha2RunRecord["artifactRefs"] = []) {
  return Array.from(new Map(values.map((artifact) => [artifact.id, artifact])).values());
}

function uniqueSafeTraceSteps(values: Alpha2RunRecord["safeTraceStepRefs"] = []) {
  return Array.from(new Map(values.map((step) => [step.stepId, step])).values());
}

function at(now: string, delayMs: number) {
  const safeDelay = Math.max(0, Math.floor(delayMs));
  return new Date(Date.parse(now) + safeDelay).toISOString();
}

function withOutcomeRefs(run: Alpha2RunRecord, outcome: Alpha2WorkerOutcome) {
  return Alpha2RunRecordSchema.parse({
    ...run,
    evidenceRefs: unique([...run.evidenceRefs, ...(outcome.evidenceRefs ?? [])]),
    safeTraceStepRefs: uniqueSafeTraceSteps([
      ...run.safeTraceStepRefs,
      ...(outcome.safeTraceStepRefs ?? []),
    ]),
    artifactRefs: uniqueArtifacts([...run.artifactRefs, ...(outcome.artifactRefs ?? [])]),
  });
}

function checkpointStatus(outcome: Alpha2WorkerOutcome): Alpha2RunStatus {
  switch (outcome.type) {
    case "completed":
      return "completed";
    case "waiting":
      return "waiting";
    case "review":
      return "review";
    case "human_gate":
      return "human_gate";
    case "failed":
      return "failed";
  }
}

async function save(
  ledger: Alpha2RunLedger,
  current: Alpha2VersionedRun,
  run: Alpha2RunRecord,
  lease: { owner: string; now: string },
) {
  return ledger.compareAndSwap({ run, expectedVersion: current.version, lease });
}

async function moveToRunning(input: {
  ledger: Alpha2RunLedger;
  leased: Alpha2VersionedRun;
  now: string;
  leaseOwner: string;
}) {
  let current = input.leased;
  let run = current.run;

  if (run.status === "failed") {
    if (run.attempt >= run.budget.maxAttempts) return { exhausted: true as const, current };
    run = transitionAlpha2Run(run, "queued", { now: input.now });
    current = await save(input.ledger, current, run, {
      owner: input.leaseOwner,
      now: input.now,
    });
  }

  if (run.status === "running") {
    run = transitionAlpha2Run(run, "failed", {
      now: input.now,
      errorCode:
        run.attempt >= run.budget.maxAttempts
          ? "alpha2_attempt_budget_exhausted"
          : "alpha2_abandoned_running_step",
      resumeAt: run.attempt < run.budget.maxAttempts ? input.now : undefined,
    });
    current = await save(input.ledger, current, run, {
      owner: input.leaseOwner,
      now: input.now,
    });
    if (run.attempt >= run.budget.maxAttempts) {
      return { exhausted: true as const, current };
    }
    run = transitionAlpha2Run(run, "queued", { now: input.now });
    current = await save(input.ledger, current, run, {
      owner: input.leaseOwner,
      now: input.now,
    });
  }

  if (run.status === "queued" || run.status === "waiting") {
    run = transitionAlpha2Run(current.run, "running", { now: input.now });
    current = await save(input.ledger, current, run, {
      owner: input.leaseOwner,
      now: input.now,
    });
  }

  if (current.run.status !== "running") {
    throw new Error(`alpha2_orchestrator_unexpected_start_status:${current.run.status}`);
  }

  return { exhausted: false as const, current };
}

async function persistOutcome(input: {
  ledger: Alpha2RunLedger;
  current: Alpha2VersionedRun;
  outcome: Alpha2WorkerOutcome;
  now: string;
  leaseOwner: string;
}) {
  let run = withOutcomeRefs(input.current.run, input.outcome);
  run = appendAlpha2Checkpoint(run, {
    checkpointId: input.outcome.checkpointId,
    createdAt: input.now,
    status: checkpointStatus(input.outcome),
    cursor: input.outcome.cursor,
    evidenceRefs: input.outcome.evidenceRefs ?? [],
    safeTraceStepRefs: input.outcome.safeTraceStepRefs ?? [],
    artifactRefs: input.outcome.artifactRefs ?? [],
  });

  switch (input.outcome.type) {
    case "completed":
      run = transitionAlpha2Run(run, "completed", { now: input.now });
      break;
    case "waiting":
      run = transitionAlpha2Run(run, "waiting", {
        now: input.now,
        resumeAt: at(input.now, input.outcome.resumeAfterMs),
      });
      break;
    case "review":
      run = transitionAlpha2Run(run, "review", { now: input.now });
      break;
    case "human_gate":
      run = transitionAlpha2Run(run, "human_gate", {
        now: input.now,
        humanGate: {
          state: "pending",
          reason: input.outcome.reason,
        },
      });
      break;
    case "failed": {
      const canRetry =
        input.outcome.retryable && input.current.run.attempt < input.current.run.budget.maxAttempts;
      run = transitionAlpha2Run(run, "failed", {
        now: input.now,
        errorCode: input.outcome.errorCode,
        resumeAt: canRetry ? at(input.now, input.outcome.retryAfterMs ?? 30_000) : undefined,
      });
      break;
    }
  }

  return save(input.ledger, input.current, run, {
    owner: input.leaseOwner,
    now: input.now,
  });
}

function createLeaseOwner(input: {
  workerId: string;
  runId: string;
  observedVersion: number;
  executionAttempt: number;
  executionId?: string;
}) {
  const executionId = input.executionId ?? randomUUID();
  return [
    input.workerId,
    input.runId,
    `attempt-${input.executionAttempt}`,
    `version-${input.observedVersion}`,
    executionId,
  ].join(":");
}

function startLeaseHeartbeat(input: {
  ledger: Alpha2RunLedger;
  runId: string;
  leaseOwner: string;
  leaseMs: number;
}) {
  let lost = false;
  let pending: Promise<void> | null = null;
  const renew = () => {
    if (pending) return pending;
    pending = input.ledger
      .renewLease({
        runId: input.runId,
        owner: input.leaseOwner,
        now: new Date().toISOString(),
        leaseMs: input.leaseMs,
      })
      .then((renewed) => {
        if (!renewed) lost = true;
      })
      .catch(() => {
        lost = true;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };
  const timer = setInterval(() => void renew(), Math.max(1_000, Math.floor(input.leaseMs / 3)));
  timer.unref?.();

  return {
    async stopAndVerify(now: string) {
      clearInterval(timer);
      await pending;
      if (!lost) {
        const renewed = await input.ledger.renewLease({
          runId: input.runId,
          owner: input.leaseOwner,
          now,
          leaseMs: input.leaseMs,
        });
        if (!renewed) lost = true;
      }
      if (lost) throw new Error("alpha2_ledger_lease_lost");
    },
    stop() {
      clearInterval(timer);
    },
  };
}

function executorFailure(run: Alpha2RunRecord, error: unknown): Alpha2WorkerOutcome {
  const candidate = error as { code?: unknown; name?: unknown } | null;
  return {
    type: "failed",
    checkpointId: `exception_${run.runId}_${run.attempt}`,
    errorCode: String(candidate?.code ?? candidate?.name ?? "alpha2_worker_exception"),
    retryable: true,
    retryAfterMs: 30_000,
  };
}

async function executeWithinWallClockBudget(input: {
  run: Alpha2RunRecord;
  workerId: string;
  executor: Alpha2WorkerExecutor;
  now: string;
}): Promise<Alpha2WorkerOutcome> {
  const maxWallClockMs = input.run.budget.maxWallClockMs;
  const startedAt = input.run.startedAt ?? input.now;
  const remainingMs = maxWallClockMs
    ? Date.parse(startedAt) + maxWallClockMs - Date.parse(input.now)
    : undefined;

  if (remainingMs !== undefined && remainingMs <= 0) {
    return {
      type: "failed",
      checkpointId: `wall_clock_${input.run.runId}_${input.run.attempt}`,
      errorCode: "alpha2_wall_clock_budget_exhausted",
      retryable: false,
    };
  }

  const controller = new AbortController();
  const execution = Promise.resolve()
    .then(() =>
      input.executor.execute({
        run: input.run,
        workerId: input.workerId,
        signal: controller.signal,
      }),
    )
    .catch((error: unknown) => executorFailure(input.run, error));
  if (remainingMs === undefined) return execution;

  const timeoutOutcome: Alpha2WorkerOutcome = {
    type: "failed",
    checkpointId: `wall_clock_${input.run.runId}_${input.run.attempt}`,
    errorCode: "alpha2_wall_clock_budget_exhausted",
    retryable: false,
  };
  const maxTimerDelayMs = 2_147_483_647;
  const deadlineMs = Date.now() + remainingMs;
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Alpha2WorkerOutcome>((resolve) => {
    const schedule = () => {
      const delayMs = Math.min(maxTimerDelayMs, Math.max(0, deadlineMs - Date.now()));
      timer = setTimeout(() => {
        if (Date.now() < deadlineMs) {
          schedule();
          return;
        }
        timedOut = true;
        resolve(timeoutOutcome);
        controller.abort("alpha2_wall_clock_budget_exhausted");
      }, delayMs);
    };
    schedule();
  });

  try {
    const result = await Promise.race([execution, timeout]);
    return timedOut ? timeoutOutcome : result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function nextDispatch(input: {
  run: Alpha2RunRecord;
  outcome: Alpha2WorkerOutcome;
  now: string;
}): { reason: Alpha2ExecutionReason; delayMs: number; dispatchKey: string } | null {
  if (input.outcome.type === "waiting") {
    return {
      reason: "scheduled_resume",
      delayMs: Math.max(0, input.outcome.resumeAfterMs),
      dispatchKey: `resume_${input.outcome.checkpointId}`,
    };
  }

  if (
    input.outcome.type === "failed" &&
    input.outcome.retryable &&
    Boolean(input.run.resumeAt)
  ) {
    return {
      reason: "retry",
      delayMs: Math.max(0, Date.parse(input.run.resumeAt!) - Date.parse(input.now)),
      dispatchKey: `retry_${input.outcome.checkpointId}`,
    };
  }

  return null;
}

export async function runAlpha2DurableStep(input: {
  runId: string;
  workerId: string;
  ledger: Alpha2RunLedger;
  dispatcher: Alpha2ExecutionDispatcher;
  executor: Alpha2WorkerExecutor;
  leaseMs?: number;
  now?: string;
  executionId?: string;
}): Promise<Alpha2DurableStepResult> {
  const startedAt = input.now ?? new Date().toISOString();
  const observed = await input.ledger.getByRunId(input.runId);
  if (!observed) return { state: "missing", runId: input.runId };
  if (isAlpha2TerminalRun(observed.run)) return { state: "terminal", run: observed.run };
  if (isAlpha2HumanStoppedRun(observed.run)) {
    return { state: "human_stopped", run: observed.run };
  }
  const leaseMs = Math.max(10_000, input.leaseMs ?? 120_000);
  const executionAttempt =
    observed.run.status === "waiting" || observed.run.attempt >= observed.run.budget.maxAttempts
      ? observed.run.attempt
      : observed.run.attempt + 1;
  const leaseOwner = createLeaseOwner({
    workerId: input.workerId,
    runId: input.runId,
    observedVersion: observed.version,
    executionAttempt,
    executionId: input.executionId,
  });
  const leased = await input.ledger.tryAcquireLease({
    runId: input.runId,
    owner: leaseOwner,
    now: startedAt,
    leaseMs,
  });
  if (!leased) {
    const isDue = await input.ledger.isRunDue({ runId: input.runId, now: startedAt });
    return isDue
      ? { state: "lease_not_acquired", runId: input.runId }
      : { state: "not_due", run: observed.run };
  }

  try {
    const start = await moveToRunning({
      ledger: input.ledger,
      leased,
      now: startedAt,
      leaseOwner,
    });
    if (start.exhausted) return { state: "attempts_exhausted", run: start.current.run };

    const heartbeat = startLeaseHeartbeat({
      ledger: input.ledger,
      runId: input.runId,
      leaseOwner,
      leaseMs,
    });
    try {
      const outcome = await executeWithinWallClockBudget({
        run: start.current.run,
        workerId: input.workerId,
        executor: input.executor,
        now: startedAt,
      });
      const outcomeAt = input.now ?? new Date().toISOString();
      await heartbeat.stopAndVerify(outcomeAt);
      const persisted = await persistOutcome({
        ledger: input.ledger,
        current: start.current,
        outcome,
        now: outcomeAt,
        leaseOwner,
      });

      const dispatch = nextDispatch({ run: persisted.run, outcome, now: outcomeAt });
      if (!dispatch) return { state: "executed", run: persisted.run };

      try {
        const queued = await input.dispatcher.dispatch({
          runId: persisted.run.runId,
          taskId: persisted.run.taskId,
          dispatchKey: dispatch.dispatchKey,
          reason: dispatch.reason,
          requestedAt: outcomeAt,
          delayMs: dispatch.delayMs,
        });
        return { state: "executed", run: persisted.run, dispatchedJobId: queued.jobId };
      } catch {
        // MongoDB remains authoritative. A later recovery scan recreates the queue job.
        return { state: "executed", run: persisted.run };
      }
    } finally {
      heartbeat.stop();
    }
  } finally {
    await input.ledger.releaseLease({ runId: input.runId, owner: leaseOwner });
  }
}

export async function recoverAlpha2DueRuns(input: {
  ledger: Alpha2RunLedger;
  dispatcher: Alpha2ExecutionDispatcher;
  now?: string;
  limit?: number;
}) {
  const now = input.now ?? new Date().toISOString();
  const recoverable = await input.ledger.listRecoverable({ now, limit: input.limit });
  const results: Array<{ runId: string; jobId?: string; error?: string }> = [];

  for (const entry of recoverable) {
    const lastCheckpoint = entry.run.checkpoints.at(-1)?.checkpointId ?? "start";
    try {
      const queued = await input.dispatcher.dispatch({
        runId: entry.run.runId,
        taskId: entry.run.taskId,
        dispatchKey: `recovery_v${entry.version}_${lastCheckpoint}`,
        reason: "recovery",
        requestedAt: now,
      });
      results.push({ runId: entry.run.runId, jobId: queued.jobId });
    } catch (error: any) {
      results.push({ runId: entry.run.runId, error: String(error?.code ?? error?.message ?? error) });
    }
  }

  return results;
}

export function startAlpha2RecoveryScheduler(input: {
  ledger: Alpha2RunLedger;
  dispatcher: Alpha2ExecutionDispatcher;
  intervalMs?: number;
  batchSize?: number;
  onError?: (error: unknown) => void;
}) {
  const intervalMs = Math.max(10_000, input.intervalMs ?? 60_000);
  let active = true;
  let running = false;

  const tick = async () => {
    if (!active || running) return;
    running = true;
    try {
      await recoverAlpha2DueRuns({
        ledger: input.ledger,
        dispatcher: input.dispatcher,
        limit: input.batchSize ?? 50,
      });
    } catch (error) {
      input.onError?.(error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
  void tick();

  return {
    stop() {
      active = false;
      clearInterval(timer);
    },
    tick,
  };
}
