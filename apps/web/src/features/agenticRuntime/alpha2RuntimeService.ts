import type { Job, Worker } from "bullmq";
import {
  getAlpha2ExecutionDispatcher,
  startAlpha2ExecutionWorker,
  type Alpha2ExecutionJob,
} from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import {
  recoverAlpha2DueRuns,
  runAlpha2DurableStep,
  startAlpha2RecoveryScheduler,
  type Alpha2WorkerExecutor,
} from "@/features/agenticRuntime/alpha2DurableOrchestrator";
import {
  continueAlpha2AfterCompletedRun,
  type Alpha2ContinuousDispatchResult,
} from "@/features/agenticRuntime/alpha2ContinuousDispatcher";
import type { Alpha2ContinuationPlanner } from "@/features/agenticRuntime/alpha2ContinuousDispatchContract";
import {
  continueAlpha2AfterRepairableFailure,
  type Alpha2RepairContinuationResult,
  type Alpha2RepairPlanner,
  type Alpha2RepairableFailure,
} from "@/features/agenticRuntime/alpha2RepairContinuation";
import { getAlpha2MongoRunLedger } from "@/features/agenticRuntime/alpha2MongoRunLedger";
import {
  isAlpha2HumanStoppedRun,
  isAlpha2TerminalRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import {
  Alpha2RunRecordSchema,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

export interface Alpha2ExecutorResolver {
  resolve(run: Alpha2RunRecord): Promise<Alpha2WorkerExecutor> | Alpha2WorkerExecutor;
}

export async function persistAndDispatchAlpha2Run(input: {
  run: Alpha2RunRecord;
  dispatch?: boolean;
}) {
  const ledger = getAlpha2MongoRunLedger();
  const dispatcher = getAlpha2ExecutionDispatcher();
  const run = Alpha2RunRecordSchema.parse(input.run);
  const stored = await ledger.createOrGet(run);

  if (input.dispatch === false) return { ...stored, jobId: undefined as string | undefined };
  if (isAlpha2TerminalRun(stored.record.run) || isAlpha2HumanStoppedRun(stored.record.run)) {
    return { ...stored, jobId: undefined as string | undefined };
  }

  const queued = await dispatcher.dispatch({
    runId: stored.record.run.runId,
    taskId: stored.record.run.taskId,
    dispatchKey: `initial_v${stored.record.version}`,
    reason: "initial",
    requestedAt: new Date().toISOString(),
  });

  return { ...stored, jobId: queued.jobId };
}

export async function handleAlpha2ExecutionJob(input: {
  job: Job<Alpha2ExecutionJob>;
  executorResolver: Alpha2ExecutorResolver;
  continuationPlanner?: Alpha2ContinuationPlanner;
  repairPlanner?: Alpha2RepairPlanner;
  workerId: string;
}) {
  const ledger = getAlpha2MongoRunLedger();
  const dispatcher = getAlpha2ExecutionDispatcher();
  const stored = await ledger.getByRunId(input.job.data.runId);
  if (!stored) return { state: "missing" as const, runId: input.job.data.runId };
  const executor = await input.executorResolver.resolve(stored.run);

  const step = await runAlpha2DurableStep({
    runId: stored.run.runId,
    workerId: input.workerId,
    ledger,
    dispatcher,
    executor,
  });

  let repair: Alpha2RepairContinuationResult | undefined;
  if (
    input.repairPlanner &&
    step.state === "executed" &&
    step.run.status === "failed" &&
    step.outcome.type === "failed" &&
    step.outcome.repairable === true
  ) {
    repair = await continueAlpha2AfterRepairableFailure({
      failedRun: step.run,
      failure: step.outcome as Alpha2RepairableFailure,
      ledger,
      dispatcher,
      planner: input.repairPlanner,
    });
  }

  let continuation: Alpha2ContinuousDispatchResult | undefined;
  if (
    !repair &&
    input.continuationPlanner &&
    step.state === "executed" &&
    step.run.status === "completed"
  ) {
    continuation = await continueAlpha2AfterCompletedRun({
      completedRun: step.run,
      ledger,
      dispatcher,
      planner: input.continuationPlanner,
    });
  }

  if (repair) return { ...step, repair };
  return continuation ? { ...step, continuation } : step;
}

export function startAlpha2ControlPlaneRuntime(input: {
  executorResolver: Alpha2ExecutorResolver;
  continuationPlanner?: Alpha2ContinuationPlanner;
  repairPlanner?: Alpha2RepairPlanner;
  workerId?: string;
  concurrency?: number;
  recoveryIntervalMs?: number;
  recoveryBatchSize?: number;
  onRecoveryError?: (error: unknown) => void;
}) {
  const ledger = getAlpha2MongoRunLedger();
  const dispatcher = getAlpha2ExecutionDispatcher();
  const workerId = input.workerId ?? `alpha2-worker-${process.pid}`;

  const worker: Worker<Alpha2ExecutionJob> = startAlpha2ExecutionWorker({
    concurrency: input.concurrency,
    handler: (job) =>
      handleAlpha2ExecutionJob({
        job,
        executorResolver: input.executorResolver,
        continuationPlanner: input.continuationPlanner,
        repairPlanner: input.repairPlanner,
        workerId,
      }),
  });

  const recovery = startAlpha2RecoveryScheduler({
    ledger,
    dispatcher,
    intervalMs: input.recoveryIntervalMs,
    batchSize: input.recoveryBatchSize,
    onError: input.onRecoveryError,
  });

  return {
    worker,
    recovery,
    async recoverNow() {
      return recoverAlpha2DueRuns({
        ledger,
        dispatcher,
        limit: input.recoveryBatchSize,
      });
    },
    async close() {
      recovery.stop();
      await worker.close();
    },
  };
}
