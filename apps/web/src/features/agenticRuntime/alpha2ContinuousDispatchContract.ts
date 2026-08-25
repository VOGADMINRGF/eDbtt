import type {
  Alpha2ActionGateInput,
  Alpha2ActionGateResult,
} from "@/features/agenticRuntime/alpha2RiskGateContract";
import { resolveAlpha2ActionGate } from "@/features/agenticRuntime/alpha2RiskGateContract";
import type {
  Alpha2OpenTaskRecord,
  Alpha2TaskEligibility,
  Alpha2TaskOwnershipEvidence,
} from "@/features/agenticRuntime/alpha2OpenTasksEligibilityContract";
import { evaluateAlpha2TaskEligibility } from "@/features/agenticRuntime/alpha2OpenTasksEligibilityContract";
import type { Alpha2RunRecord } from "@/features/agenticRuntime/alpha2RunLifecycleContract";

export const ALPHA2_CONTINUATION_CURSOR_PREFIX = "alpha2_continuation_v1";

export type Alpha2ContinuationPlan =
  | {
      state: "continue";
      nextRun: Alpha2RunRecord;
      task: Alpha2OpenTaskRecord;
      ownership?: Alpha2TaskOwnershipEvidence;
      action: Alpha2ActionGateInput;
    }
  | { state: "idle"; reason: string }
  | { state: "complete"; reason?: string };

export interface Alpha2ContinuationPlanner {
  plan(input: {
    completedRun: Alpha2RunRecord;
    now: string;
  }): Promise<Alpha2ContinuationPlan> | Alpha2ContinuationPlan;
}

export type Alpha2ContinuationAssessment =
  | {
      state: "automatic";
      plan: Extract<Alpha2ContinuationPlan, { state: "continue" }>;
      eligibility: Alpha2TaskEligibility;
      actionGate: Alpha2ActionGateResult;
    }
  | {
      state: "human_gate";
      plan: Extract<Alpha2ContinuationPlan, { state: "continue" }>;
      eligibility: Alpha2TaskEligibility;
      actionGate: Alpha2ActionGateResult;
      reason: string;
    }
  | {
      state: "idle";
      reason: string;
      eligibility?: Alpha2TaskEligibility;
      actionGate?: Alpha2ActionGateResult;
    }
  | { state: "complete"; reason?: string };

function reason(parts: readonly string[]) {
  return parts.filter(Boolean).join(",");
}

export function assessAlpha2Continuation(input: {
  completedRun: Alpha2RunRecord;
  plan: Alpha2ContinuationPlan;
}): Alpha2ContinuationAssessment {
  if (input.plan.state === "idle") {
    return { state: "idle", reason: input.plan.reason };
  }
  if (input.plan.state === "complete") {
    return { state: "complete", reason: input.plan.reason };
  }

  const plan = input.plan;
  if (plan.nextRun.taskId !== plan.task.id) {
    return { state: "idle", reason: "alpha2_continuation_task_identity_mismatch" };
  }
  if (plan.nextRun.parentRunId !== input.completedRun.runId) {
    return { state: "idle", reason: "alpha2_continuation_parent_mismatch" };
  }
  if (plan.nextRun.rootRunId !== input.completedRun.rootRunId) {
    return { state: "idle", reason: "alpha2_continuation_root_mismatch" };
  }
  if (plan.nextRun.status !== "queued" || plan.nextRun.humanGate.state === "pending") {
    return { state: "idle", reason: "alpha2_continuation_next_run_must_be_queued" };
  }
  if (plan.action.riskClass !== plan.nextRun.riskClass) {
    return { state: "idle", reason: "alpha2_continuation_risk_class_mismatch" };
  }

  const eligibility = evaluateAlpha2TaskEligibility({
    task: plan.task,
    ownership: plan.ownership,
  });
  const actionGate = resolveAlpha2ActionGate(plan.action);

  if (eligibility.requiresHumanDecision || !actionGate.autoExecutionAllowed) {
    return {
      state: "human_gate",
      plan,
      eligibility,
      actionGate,
      reason: reason([
        ...eligibility.reasonCodes,
        ...actionGate.reasonCodes,
      ]),
    };
  }

  if (!eligibility.newSliceEligible && !eligibility.continuationEligible) {
    return {
      state: "idle",
      reason: reason(eligibility.reasonCodes) || "alpha2_no_eligible_follow_up",
      eligibility,
      actionGate,
    };
  }

  return { state: "automatic", plan, eligibility, actionGate };
}

export type Alpha2ContinuationCursor = {
  state: "dispatched" | "human_gate" | "idle" | "complete";
  detail?: string;
};

export function encodeAlpha2ContinuationCursor(cursor: Alpha2ContinuationCursor) {
  const detail = cursor.detail ? encodeURIComponent(cursor.detail) : "";
  return `${ALPHA2_CONTINUATION_CURSOR_PREFIX}:${cursor.state}:${detail}`;
}

export function parseAlpha2ContinuationCursor(value: string | undefined): Alpha2ContinuationCursor | null {
  if (!value?.startsWith(`${ALPHA2_CONTINUATION_CURSOR_PREFIX}:`)) return null;
  const [, state, rawDetail = ""] = value.split(":", 3);
  if (!(["dispatched", "human_gate", "idle", "complete"] as const).includes(state as any)) {
    return null;
  }
  let detail: string | undefined;
  if (rawDetail) {
    try {
      detail = decodeURIComponent(rawDetail);
    } catch {
      return null;
    }
  }
  return {
    state: state as Alpha2ContinuationCursor["state"],
    detail,
  };
}
