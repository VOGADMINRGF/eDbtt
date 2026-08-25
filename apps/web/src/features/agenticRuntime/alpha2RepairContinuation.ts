import type { Alpha2ExecutionDispatcher } from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import type { Alpha2WorkerOutcome } from "@/features/agenticRuntime/alpha2DurableOrchestrator";
import {
  assessAlpha2Continuation,
  encodeAlpha2ContinuationCursor,
  type Alpha2ContinuationPlan,
} from "@/features/agenticRuntime/alpha2ContinuousDispatchContract";
import type {
  Alpha2RunLedger,
  Alpha2VersionedRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import {
  appendAlpha2Checkpoint,
  linkAlpha2ChildRun,
  transitionAlpha2Run,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

export type Alpha2RepairableFailure = Extract<Alpha2WorkerOutcome, { type: "failed" }> & {
  repairable: true;
};

export interface Alpha2RepairPlanner {
  planRepair(input: {
    failedRun: Alpha2RunRecord;
    failure: Alpha2RepairableFailure;
    now: string;
  }): Promise<Alpha2ContinuationPlan> | Alpha2ContinuationPlan;
}

export type Alpha2RepairContinuationResult =
  | { state: "not_applicable"; run: Alpha2RunRecord }
  | { state: "idle"; run: Alpha2RunRecord; reason: string }
  | { state: "complete"; run: Alpha2RunRecord; reason?: string }
  | {
      state: "human_gate";
      run: Alpha2RunRecord;
      gateRun: Alpha2RunRecord;
      reason: string;
    }
  | {
      state: "dispatched";
      run: Alpha2RunRecord;
      repairRun: Alpha2RunRecord;
      jobId?: string;
    };

function repairCheckpointId(failure: Alpha2RepairableFailure, state: string) {
  return `repair_${failure.checkpointId}_${state}`;
}

async function updateFailedParent(input: {
  ledger: Alpha2RunLedger;
  current: Alpha2VersionedRun;
  failure: Alpha2RepairableFailure;
  child?: Alpha2RunRecord;
  state: "dispatched" | "human_gate" | "idle" | "complete";
  detail?: string;
  now: string;
}) {
  let parent = input.current.run;
  if (input.child) parent = linkAlpha2ChildRun(parent, input.child);
  parent = appendAlpha2Checkpoint(parent, {
    checkpointId: repairCheckpointId(input.failure, input.state),
    createdAt: input.now,
    status: parent.status,
    cursor: encodeAlpha2ContinuationCursor({ state: input.state, detail: input.detail }),
    evidenceRefs: [],
    artifactRefs: [],
  });
  return input.ledger.compareAndSwap({
    run: parent,
    expectedVersion: input.current.version,
  });
}

export async function continueAlpha2AfterRepairableFailure(input: {
  failedRun: Alpha2RunRecord;
  failure: Alpha2RepairableFailure;
  ledger: Alpha2RunLedger;
  dispatcher: Alpha2ExecutionDispatcher;
  planner: Alpha2RepairPlanner;
  now?: string;
}): Promise<Alpha2RepairContinuationResult> {
  if (input.failedRun.status !== "failed" || !input.failure.repairable) {
    return { state: "not_applicable", run: input.failedRun };
  }

  const now = input.now ?? new Date().toISOString();
  const current = await input.ledger.getByRunId(input.failedRun.runId);
  if (!current || current.run.status !== "failed") {
    return { state: "not_applicable", run: input.failedRun };
  }
  if (current.run.resumeAt) {
    // A same-run retry is already authoritative for this failure; do not create a parallel repair path.
    return { state: "not_applicable", run: current.run };
  }

  const plan = await input.planner.planRepair({
    failedRun: current.run,
    failure: input.failure,
    now,
  });
  const assessment = assessAlpha2Continuation({
    completedRun: current.run,
    plan,
  });

  if (assessment.state === "idle") {
    const saved = await updateFailedParent({
      ledger: input.ledger,
      current,
      failure: input.failure,
      state: "idle",
      detail: assessment.reason,
      now,
    });
    return { state: "idle", run: saved.run, reason: assessment.reason };
  }

  if (assessment.state === "complete") {
    const saved = await updateFailedParent({
      ledger: input.ledger,
      current,
      failure: input.failure,
      state: "complete",
      detail: assessment.reason,
      now,
    });
    return { state: "complete", run: saved.run, reason: assessment.reason };
  }

  if (assessment.state === "human_gate") {
    const gateRun = transitionAlpha2Run(assessment.plan.nextRun, "human_gate", {
      now,
      humanGate: { state: "pending", reason: assessment.reason },
    });
    const child = await input.ledger.createOrGet(gateRun);
    const saved = await updateFailedParent({
      ledger: input.ledger,
      current,
      failure: input.failure,
      child: child.record.run,
      state: "human_gate",
      detail: assessment.reason,
      now,
    });
    return {
      state: "human_gate",
      run: saved.run,
      gateRun: child.record.run,
      reason: assessment.reason,
    };
  }

  const child = await input.ledger.createOrGet(assessment.plan.nextRun);
  const saved = await updateFailedParent({
    ledger: input.ledger,
    current,
    failure: input.failure,
    child: child.record.run,
    state: "dispatched",
    detail: child.record.run.runId,
    now,
  });

  try {
    const queued = await input.dispatcher.dispatch({
      runId: child.record.run.runId,
      taskId: child.record.run.taskId,
      dispatchKey: `repair_${saved.run.runId}_${input.failure.checkpointId}_${child.record.run.runId}`,
      reason: "initial",
      requestedAt: now,
    });
    return {
      state: "dispatched",
      run: saved.run,
      repairRun: child.record.run,
      jobId: queued.jobId,
    };
  } catch {
    // The repair child is already durable. Existing recovery recreates the queue dispatch.
    return {
      state: "dispatched",
      run: saved.run,
      repairRun: child.record.run,
    };
  }
}
