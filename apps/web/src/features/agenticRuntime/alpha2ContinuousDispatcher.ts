import type { Alpha2ExecutionDispatcher } from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import {
  assessAlpha2Continuation,
  encodeAlpha2ContinuationCursor,
  type Alpha2ContinuationPlanner,
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

export type Alpha2ContinuousDispatchResult =
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
      nextRun: Alpha2RunRecord;
      jobId?: string;
    };

function checkpointId(run: Alpha2RunRecord, suffix: string) {
  const previous = run.checkpoints.at(-1)?.checkpointId ?? "start";
  return `continuation_${previous}_${suffix}`;
}

async function updateParent(input: {
  ledger: Alpha2RunLedger;
  current: Alpha2VersionedRun;
  child?: Alpha2RunRecord;
  state: "dispatched" | "human_gate" | "idle" | "complete";
  detail?: string;
  now: string;
}) {
  let parent = input.current.run;
  if (input.child) parent = linkAlpha2ChildRun(parent, input.child);
  parent = appendAlpha2Checkpoint(parent, {
    checkpointId: checkpointId(parent, input.state),
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

export async function continueAlpha2AfterCompletedRun(input: {
  completedRun: Alpha2RunRecord;
  ledger: Alpha2RunLedger;
  dispatcher: Alpha2ExecutionDispatcher;
  planner: Alpha2ContinuationPlanner;
  now?: string;
}): Promise<Alpha2ContinuousDispatchResult> {
  if (input.completedRun.status !== "completed") {
    return { state: "not_applicable", run: input.completedRun };
  }

  const now = input.now ?? new Date().toISOString();
  const current = await input.ledger.getByRunId(input.completedRun.runId);
  if (!current || current.run.status !== "completed") {
    return { state: "not_applicable", run: input.completedRun };
  }

  const plan = await input.planner.plan({ completedRun: current.run, now });
  const assessment = assessAlpha2Continuation({
    completedRun: current.run,
    plan,
  });

  if (assessment.state === "idle") {
    const saved = await updateParent({
      ledger: input.ledger,
      current,
      state: "idle",
      detail: assessment.reason,
      now,
    });
    return { state: "idle", run: saved.run, reason: assessment.reason };
  }

  if (assessment.state === "complete") {
    const saved = await updateParent({
      ledger: input.ledger,
      current,
      state: "complete",
      detail: assessment.reason,
      now,
    });
    return { state: "complete", run: saved.run, reason: assessment.reason };
  }

  if (assessment.state === "human_gate") {
    const gateRun = transitionAlpha2Run(assessment.plan.nextRun, "human_gate", {
      now,
      humanGate: {
        state: "pending",
        reason: assessment.reason,
      },
    });
    const child = await input.ledger.createOrGet(gateRun);
    const saved = await updateParent({
      ledger: input.ledger,
      current,
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
  const saved = await updateParent({
    ledger: input.ledger,
    current,
    child: child.record.run,
    state: "dispatched",
    detail: child.record.run.runId,
    now,
  });

  try {
    const queued = await input.dispatcher.dispatch({
      runId: child.record.run.runId,
      taskId: child.record.run.taskId,
      dispatchKey: `continuation_${saved.run.runId}_${child.record.run.runId}`,
      reason: "initial",
      requestedAt: now,
    });
    return {
      state: "dispatched",
      run: saved.run,
      nextRun: child.record.run,
      jobId: queued.jobId,
    };
  } catch {
    // The queued child is durable Mongo truth. Recovery can recreate the BullMQ job.
    return {
      state: "dispatched",
      run: saved.run,
      nextRun: child.record.run,
    };
  }
}
