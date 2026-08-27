import { randomUUID } from "node:crypto";
import {
  Alpha2RunRecordSchema,
  appendAlpha2Checkpoint,
  transitionAlpha2Run,
  transitionAlpha2RunToNewHumanGate,
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
import {
  evaluateAlpha2TaskEligibility,
  findAlpha2OpenTask,
  type Alpha2TaskOwnershipEvidence,
} from "@/features/agenticRuntime/alpha2OpenTasksEligibilityContract";
import {
  resolveAlpha2ActionGate,
  type Alpha2ActionGateInput,
} from "@/features/agenticRuntime/alpha2RiskGateContract";

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

export type Alpha2ExecutionFence = {
  /** Attempt-specific token that side-effect adapters must use as their fencing/idempotency key. */
  token: string;
  assertActive(): Promise<void>;
  /**
   * Every external or mutating effect must cross this boundary. The lease is
   * validated immediately before and after the effect, and the attempt token is
   * supplied to the adapter so a later delivery cannot reuse this ownership.
   */
  runSideEffect<T>(
    effect: (input: { fenceToken: string }) => Promise<T> | T,
  ): Promise<T>;
};

export interface Alpha2WorkerExecutor {
  execute(input: {
    run: Alpha2RunRecord;
    workerId: string;
    signal: AbortSignal;
    fence: Alpha2ExecutionFence;
  }): Promise<Alpha2WorkerOutcome>;
}

export interface Alpha2ExecutorResolver {
  resolve(
    run: Alpha2RunRecord,
    input: { signal: AbortSignal },
  ): Promise<Alpha2WorkerExecutor> | Alpha2WorkerExecutor;
}

export function createAlpha2ResolvingExecutor(input: {
  resolver: Alpha2ExecutorResolver;
  resolutionTimeoutMs?: number;
}): Alpha2WorkerExecutor {
  const resolutionTimeoutMs = Math.max(1, input.resolutionTimeoutMs ?? 30_000);
  return {
    async execute(context) {
      const resolutionController = new AbortController();
      const abortResolution = () => resolutionController.abort(context.signal.reason);
      context.signal.addEventListener("abort", abortResolution, { once: true });
      let timer: ReturnType<typeof setTimeout> | undefined;
      let executor: Alpha2WorkerExecutor;
      try {
        executor = await Promise.race([
          Promise.resolve().then(() =>
            input.resolver.resolve(context.run, { signal: resolutionController.signal }),
          ),
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => {
              resolutionController.abort("alpha2_executor_resolution_timeout");
              reject(new Error("alpha2_executor_resolution_timeout"));
            }, resolutionTimeoutMs);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
        context.signal.removeEventListener("abort", abortResolution);
      }
      if (context.signal.aborted) throw new Error("alpha2_executor_resolution_aborted");
      return executor.execute(context);
    },
  };
}

export type Alpha2ExecutionAuthorization = {
  observedHeadSha: string;
  observedAt: string;
  openTasksText: string;
  ownership: Alpha2TaskOwnershipEvidence;
  action: Alpha2ActionGateInput;
};

export type Alpha2DurableStepResult =
  | { state: "missing"; runId: string }
  | { state: "not_due"; run: Alpha2RunRecord }
  | { state: "human_stopped"; run: Alpha2RunRecord }
  | { state: "terminal"; run: Alpha2RunRecord }
  | { state: "lease_not_acquired"; runId: string }
  | { state: "attempts_exhausted"; run: Alpha2RunRecord }
  | { state: "execution_blocked"; run: Alpha2RunRecord; reasonCodes: string[] }
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
  resumeAfterMs?: number,
  initializeWallClock?: { maxWallClockMs?: number },
  stampCheckpointId?: string,
) {
  return ledger.compareAndSwap({
    run,
    expectedVersion: current.version,
    lease,
    resumeAfterMs,
    initializeWallClock,
    stampCheckpointId,
  });
}

function executionBlockReasons(
  run: Alpha2RunRecord,
  authorization: Alpha2ExecutionAuthorization | undefined,
  input: { currentHeadSha: string; authoritativeNow: string; maxAgeMs: number },
) {
  const reasonCodes: string[] = [];

  if (!authorization) return ["missing_runtime_execution_authorization"];

  if (!/^[0-9a-f]{40}$/i.test(input.currentHeadSha)) {
    reasonCodes.push("runtime_head_sha_missing");
  }
  if (
    !/^[0-9a-f]{40}$/i.test(authorization.observedHeadSha) ||
    authorization.observedHeadSha !== input.currentHeadSha
  ) {
    reasonCodes.push("authorization_head_sha_mismatch");
  }
  const observedAtMs = Date.parse(authorization.observedAt);
  const authoritativeNowMs = Date.parse(input.authoritativeNow);
  if (
    !Number.isFinite(observedAtMs) ||
    !Number.isFinite(authoritativeNowMs) ||
    authoritativeNowMs - observedAtMs > input.maxAgeMs ||
    observedAtMs - authoritativeNowMs > input.maxAgeMs
  ) {
    reasonCodes.push("authorization_evidence_stale");
  }

  try {
    const task = findAlpha2OpenTask(authorization.openTasksText, run.taskId);
    if (!task) {
      reasonCodes.push("task_missing_from_canonical_opentasks");
    } else {
      const eligibility = evaluateAlpha2TaskEligibility({
        task,
        ownership: authorization.ownership,
      });
      if (!eligibility.continuationEligible) {
        reasonCodes.push(...eligibility.reasonCodes);
      }
    }
  } catch {
    reasonCodes.push("canonical_opentasks_unreadable");
  }

  if (authorization.ownership.exactHead !== true) {
    reasonCodes.push("owner_not_on_exact_head");
  }
  if (authorization.ownership.ciState !== "success") {
    reasonCodes.push("exact_head_ci_not_successful");
  }
  if ((authorization.ownership.unresolvedReviewThreads ?? 1) > 0) {
    reasonCodes.push("unresolved_review_threads");
  }

  try {
    if (authorization.action.riskClass !== run.riskClass) {
      reasonCodes.push("action_risk_class_mismatch");
    }
    const actionGate = resolveAlpha2ActionGate(authorization.action);
    if (!actionGate.autoExecutionAllowed) reasonCodes.push(...actionGate.reasonCodes);
  } catch {
    reasonCodes.push("action_gate_evidence_invalid");
  }

  if (run.budget.maxModelCalls !== undefined) {
    reasonCodes.push("durable_model_call_metering_not_available");
  }
  if (run.budget.maxEstimatedCostEur !== undefined) {
    reasonCodes.push("durable_cost_metering_not_available");
  }

  return unique(reasonCodes);
}

async function persistExecutionBlock(input: {
  ledger: Alpha2RunLedger;
  leased: Alpha2VersionedRun;
  now: string;
  leaseOwner: string;
  reasonCodes: string[];
}) {
  let current = input.leased;
  if (current.run.status === "failed") {
    const queued = transitionAlpha2Run(current.run, "queued", { now: input.now });
    current = await save(input.ledger, current, queued, {
      owner: input.leaseOwner,
      now: input.now,
    });
  }

  const checkpointId = `runtime_block_v${current.version}`;
  const checkpointAlreadyExists = current.run.checkpoints.some(
    (checkpoint) => checkpoint.checkpointId === checkpointId,
  );
  const checkpointed = appendAlpha2Checkpoint(current.run, {
    checkpointId,
    createdAt: input.now,
    status: "human_gate",
    evidenceRefs: input.reasonCodes,
    safeTraceStepRefs: [],
    artifactRefs: [],
  });
  const stopped = transitionAlpha2RunToNewHumanGate(checkpointed, {
    now: input.now,
    reason: input.reasonCodes.join(","),
  });
  return save(
    input.ledger,
    current,
    stopped,
    { owner: input.leaseOwner, now: input.now },
    undefined,
    undefined,
    checkpointAlreadyExists ? undefined : checkpointId,
  );
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
    const initializeWallClock =
      run.status === "queued" && !run.startedAt
        ? { maxWallClockMs: run.budget.maxWallClockMs }
        : undefined;
    run = transitionAlpha2Run(current.run, "running", { now: input.now });
    current = await save(input.ledger, current, run, {
      owner: input.leaseOwner,
      now: input.now,
    }, undefined, initializeWallClock);
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
  const checkpointAlreadyExists = input.current.run.checkpoints.some(
    (checkpoint) => checkpoint.checkpointId === input.outcome.checkpointId,
  );
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
      run = transitionAlpha2Run(run, "failed", {
        now: input.now,
        errorCode: input.outcome.errorCode,
      });
      break;
    }
  }

  const resumeAfterMs =
    input.outcome.type === "waiting"
      ? input.outcome.resumeAfterMs
      : input.outcome.type === "failed" &&
          input.outcome.retryable &&
          input.current.run.attempt < input.current.run.budget.maxAttempts
        ? (input.outcome.retryAfterMs ?? 30_000)
        : undefined;

  return save(
    input.ledger,
    input.current,
    run,
    { owner: input.leaseOwner, now: input.now },
    resumeAfterMs,
    undefined,
    checkpointAlreadyExists ? undefined : input.outcome.checkpointId,
  );
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
  onLost?: () => void;
}) {
  let lost = false;
  let pending: Promise<void> | null = null;
  const markLost = () => {
    if (lost) return;
    lost = true;
    input.onLost?.();
  };
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
        if (!renewed) markLost();
      })
      .catch(() => {
        markLost();
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };
  const timer = setInterval(() => void renew(), Math.max(1_000, Math.floor(input.leaseMs / 3)));
  timer.unref?.();

  return {
    async assertActive() {
      await renew();
      if (lost) throw new Error("alpha2_ledger_lease_lost");
    },
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
        if (!renewed) markLost();
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
  controller: AbortController;
  fence: Alpha2ExecutionFence;
}): Promise<Alpha2WorkerOutcome> {
  const maxWallClockMs = input.run.budget.maxWallClockMs;
  if (maxWallClockMs !== undefined && !input.run.wallClockDeadlineAt) {
    return {
      type: "failed",
      checkpointId: `wall_clock_${input.run.runId}_${input.run.attempt}`,
      errorCode: "alpha2_wall_clock_deadline_missing",
      retryable: false,
    };
  }
  const remainingMs = input.run.wallClockDeadlineAt
    ? Date.parse(input.run.wallClockDeadlineAt) - Date.parse(input.now)
    : undefined;

  if (remainingMs !== undefined && remainingMs <= 0) {
    return {
      type: "failed",
      checkpointId: `wall_clock_${input.run.runId}_${input.run.attempt}`,
      errorCode: "alpha2_wall_clock_budget_exhausted",
      retryable: false,
    };
  }

  const execution = Promise.resolve()
    .then(() =>
      input.executor.execute({
        run: input.run,
        workerId: input.workerId,
        signal: input.controller.signal,
        fence: input.fence,
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
  const deadlineMs = globalThis.performance.now() + remainingMs;
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Alpha2WorkerOutcome>((resolve) => {
    const schedule = () => {
      const delayMs = Math.min(
        maxTimerDelayMs,
        Math.max(0, deadlineMs - globalThis.performance.now()),
      );
      timer = setTimeout(() => {
        if (globalThis.performance.now() < deadlineMs) {
          schedule();
          return;
        }
        timedOut = true;
        resolve(timeoutOutcome);
        input.controller.abort("alpha2_wall_clock_budget_exhausted");
      }, delayMs);
    };
    schedule();
  });

  try {
    const result = await Promise.race([execution, timeout]);
    if (timedOut || globalThis.performance.now() >= deadlineMs) {
      input.controller.abort("alpha2_wall_clock_budget_exhausted");
      // Ownership must not be released while an abort-ignoring executor can still
      // perform side effects. A non-cooperative executor therefore keeps this
      // delivery (and its heartbeat) fenced until it actually settles.
      await execution;
      return timeoutOutcome;
    }
    return result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function nextDispatch(input: {
  run: Alpha2RunRecord;
  outcome: Alpha2WorkerOutcome;
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
      delayMs: Math.max(0, input.outcome.retryAfterMs ?? 30_000),
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
  currentHeadSha: string;
  authorization?: Alpha2ExecutionAuthorization;
  authorizationResolver?: (
    run: Alpha2RunRecord,
    input: { currentHeadSha: string; observedAt: string },
  ) => Alpha2ExecutionAuthorization;
  authorizationMaxAgeMs?: number;
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
  const authoritativeLeaseNow = leased.lease
    ? new Date(Date.parse(leased.lease.expiresAt) - leaseMs).toISOString()
    : startedAt;

  try {
    let authorization = input.authorization;
    try {
      authorization = input.authorizationResolver?.(leased.run, {
        currentHeadSha: input.currentHeadSha,
        observedAt: authoritativeLeaseNow,
      }) ?? authorization;
    } catch {
      authorization = undefined;
    }
    const reasonCodes = executionBlockReasons(leased.run, authorization, {
      currentHeadSha: input.currentHeadSha,
      authoritativeNow: authoritativeLeaseNow,
      maxAgeMs: Math.max(1_000, input.authorizationMaxAgeMs ?? 60_000),
    });
    if (reasonCodes.length > 0) {
      const stopped = await persistExecutionBlock({
        ledger: input.ledger,
        leased,
        now: startedAt,
        leaseOwner,
        reasonCodes,
      });
      return { state: "execution_blocked", run: stopped.run, reasonCodes };
    }

    const start = await moveToRunning({
      ledger: input.ledger,
      leased,
      now: startedAt,
      leaseOwner,
    });
    if (start.exhausted) return { state: "attempts_exhausted", run: start.current.run };
    const executionController = new AbortController();
    const heartbeat = startLeaseHeartbeat({
      ledger: input.ledger,
      runId: input.runId,
      leaseOwner,
      leaseMs,
      onLost: () => executionController.abort("alpha2_ledger_lease_lost"),
    });
    const executionFence: Alpha2ExecutionFence = {
      token: leaseOwner,
      async assertActive() {
        if (executionController.signal.aborted) {
          throw new Error(String(executionController.signal.reason ?? "alpha2_execution_aborted"));
        }
        await heartbeat.assertActive();
        if (executionController.signal.aborted) {
          throw new Error(String(executionController.signal.reason ?? "alpha2_execution_aborted"));
        }
      },
      async runSideEffect(effect) {
        await this.assertActive();
        const result = await effect({ fenceToken: leaseOwner });
        await this.assertActive();
        return result;
      },
    };
    try {
      await executionFence.assertActive();
      const outcome = await executeWithinWallClockBudget({
        run: start.current.run,
        workerId: input.workerId,
        executor: input.executor,
        now: authoritativeLeaseNow,
        controller: executionController,
        fence: executionFence,
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

      const dispatch = nextDispatch({ run: persisted.run, outcome });
      if (!dispatch) return { state: "executed", run: persisted.run };

      try {
        const queued = await input.dispatcher.dispatch({
          runId: persisted.run.runId,
          taskId: persisted.run.taskId,
          dispatchKey: dispatch.dispatchKey,
          reason: dispatch.reason,
          requestedAt: persisted.run.updatedAt,
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
  let inFlight: Promise<void> | null = null;

  const tick = () => {
    if (!active) return Promise.resolve();
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        await recoverAlpha2DueRuns({
          ledger: input.ledger,
          dispatcher: input.dispatcher,
          limit: input.batchSize ?? 50,
        });
      } catch (error) {
        input.onError?.(error);
      }
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();
  void tick();

  return {
    async stop() {
      active = false;
      clearInterval(timer);
      await inFlight;
    },
    tick,
  };
}
