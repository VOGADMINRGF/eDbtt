import {
  Alpha2RunRecordSchema,
  appendAlpha2Checkpoint,
  transitionAlpha2Run,
  type Alpha2RunRecord,
  type Alpha2RunStatus,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";
import {
  isAlpha2HumanStoppedRun,
  isAlpha2RunDue,
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
  artifactRefs?: string[];
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

function at(now: string, delayMs: number) {
  const safeDelay = Math.max(0, Math.floor(delayMs));
  return new Date(Date.parse(now) + safeDelay).toISOString();
}

function withOutcomeRefs(run: Alpha2RunRecord, outcome: Alpha2WorkerOutcome) {
  return Alpha2RunRecordSchema.parse({
    ...run,
    evidenceRefs: unique([...run.evidenceRefs, ...(outcome.evidenceRefs ?? [])]),
    artifactRefs: unique([...run.artifactRefs, ...(outcome.artifactRefs ?? [])]),
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
) {
  return ledger.compareAndSwap({ run, expectedVersion: current.version });
}

async function moveToRunning(input: {
  ledger: Alpha2RunLedger;
  leased: Alpha2VersionedRun;
  now: string;
}) {
  let current = input.leased;
  let run = current.run;

  if (run.status === "failed") {
    if (run.attempt >= run.budget.maxAttempts) return { exhausted: true as const, current };
    run = transitionAlpha2Run(run, "queued", { now: input.now });
    current = await save(input.ledger, current, run);
  }

  if (run.status === "queued" || run.status === "waiting") {
    run = transitionAlpha2Run(current.run, "running", { now: input.now });
    current = await save(input.ledger, current, run);
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
}) {
  let run = withOutcomeRefs(input.current.run, input.outcome);
  run = appendAlpha2Checkpoint(run, {
    checkpointId: input.outcome.checkpointId,
    createdAt: input.now,
    status: checkpointStatus(input.outcome),
    cursor: input.outcome.cursor,
    evidenceRefs: input.outcome.evidenceRefs ?? [],
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

  return save(input.ledger, input.current, run);
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
}): Promise<Alpha2DurableStepResult> {
  const now = input.now ?? new Date().toISOString();
  const observed = await input.ledger.getByRunId(input.runId);
  if (!observed) return { state: "missing", runId: input.runId };
  if (isAlpha2TerminalRun(observed.run)) return { state: "terminal", run: observed.run };
  if (isAlpha2HumanStoppedRun(observed.run)) {
    return { state: "human_stopped", run: observed.run };
  }
  if (!isAlpha2RunDue(observed.run, now)) return { state: "not_due", run: observed.run };

  const leased = await input.ledger.tryAcquireLease({
    runId: input.runId,
    owner: input.workerId,
    now,
    leaseMs: Math.max(10_000, input.leaseMs ?? 120_000),
  });
  if (!leased) return { state: "lease_not_acquired", runId: input.runId };

  try {
    const start = await moveToRunning({ ledger: input.ledger, leased, now });
    if (start.exhausted) return { state: "attempts_exhausted", run: start.current.run };

    let outcome: Alpha2WorkerOutcome;
    try {
      outcome = await input.executor.execute({ run: start.current.run, workerId: input.workerId });
    } catch (error: any) {
      outcome = {
        type: "failed",
        checkpointId: `exception_${start.current.run.runId}_${start.current.run.attempt}`,
        errorCode: String(error?.code ?? error?.name ?? "alpha2_worker_exception"),
        retryable: true,
        retryAfterMs: 30_000,
      };
    }

    const persisted = await persistOutcome({
      ledger: input.ledger,
      current: start.current,
      outcome,
      now: new Date().toISOString(),
    });

    const dispatch = nextDispatch({ run: persisted.run, outcome, now });
    if (!dispatch) return { state: "executed", run: persisted.run };

    try {
      const queued = await input.dispatcher.dispatch({
        runId: persisted.run.runId,
        taskId: persisted.run.taskId,
        dispatchKey: dispatch.dispatchKey,
        reason: dispatch.reason,
        requestedAt: new Date().toISOString(),
        delayMs: dispatch.delayMs,
      });
      return { state: "executed", run: persisted.run, dispatchedJobId: queued.jobId };
    } catch {
      // MongoDB remains authoritative. A later recovery scan recreates the queue job.
      return { state: "executed", run: persisted.run };
    }
  } finally {
    await input.ledger.releaseLease({ runId: input.runId, owner: input.workerId });
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
    if (!isAlpha2RunDue(entry.run, now)) continue;
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
