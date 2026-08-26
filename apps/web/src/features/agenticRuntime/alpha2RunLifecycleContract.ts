import { z } from "zod";
import {
  AGENT_ROLE_IDS,
  type AgentRoleId,
} from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  AGENT_SAFE_TRACE_ARTIFACT_TYPES,
  type AgentSafeTraceArtifactRef,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export const ALPHA2_RUN_STATUSES = [
  "queued",
  "running",
  "waiting",
  "review",
  "human_gate",
  "failed",
  "completed",
  "cancelled",
] as const;

export const ALPHA2_RUN_KINDS = [
  "mission",
  "engineering_slice",
  "independent_review",
  "diagnostic",
  "content",
  "membership",
  "support",
  "funding",
  "research",
] as const;

export const ALPHA2_RISK_CLASSES = ["green", "yellow", "orange", "red"] as const;
export const ALPHA2_GATE_STATES = [
  "not_required",
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;
export const ALPHA2_ROUTE_MODES = ["automatic", "pinned"] as const;

export type Alpha2RunStatus = (typeof ALPHA2_RUN_STATUSES)[number];
export type Alpha2RunKind = (typeof ALPHA2_RUN_KINDS)[number];
export type Alpha2RiskClass = (typeof ALPHA2_RISK_CLASSES)[number];
export type Alpha2GateState = (typeof ALPHA2_GATE_STATES)[number];
export type Alpha2RouteMode = (typeof ALPHA2_ROUTE_MODES)[number];
export type Alpha2SafeTraceArtifactRef = AgentSafeTraceArtifactRef;
export type Alpha2SafeTraceStepRef = Pick<AgentSafeTraceStep, "stepId" | "roleId">;

const Alpha2RunStatusSchema = z.enum(ALPHA2_RUN_STATUSES);
const Alpha2RunKindSchema = z.enum(ALPHA2_RUN_KINDS);
const Alpha2RiskClassSchema = z.enum(ALPHA2_RISK_CLASSES);
const Alpha2GateStateSchema = z.enum(ALPHA2_GATE_STATES);
const Alpha2RouteModeSchema = z.enum(ALPHA2_ROUTE_MODES);
const AgentRoleIdSchema = z.enum(AGENT_ROLE_IDS);
const DECIDED_HUMAN_GATE_STATES = new Set<Alpha2GateState>([
  "approved",
  "rejected",
  "expired",
]);

export const Alpha2SafeTraceArtifactRefSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(AGENT_SAFE_TRACE_ARTIFACT_TYPES),
    label: z.string().min(1),
    reviewState: z.enum(["present", "planned", "review_required"]),
  })
  .strict();

export const Alpha2SafeTraceStepRefSchema = z
  .object({
    stepId: z.string().min(1),
    roleId: AgentRoleIdSchema,
  })
  .strict();

export const Alpha2BudgetSchema = z
  .object({
    maxAttempts: z.number().int().min(1).max(20).default(3),
    maxModelCalls: z.number().int().min(0).max(10_000).optional(),
    maxWallClockMs: z.number().int().positive().optional(),
    maxEstimatedCostEur: z.number().nonnegative().optional(),
  })
  .strict();

export const Alpha2ModelRouteSchema = z
  .object({
    mode: Alpha2RouteModeSchema,
    capabilityClass: z.string().min(1),
    providerId: z.string().min(1).optional(),
    modelId: z.string().min(1).optional(),
    fallbackAllowed: z.boolean().default(true),
  })
  .strict()
  .superRefine((route, ctx) => {
    if (route.mode === "pinned" && (!route.providerId || !route.modelId)) {
      ctx.addIssue({
        code: "custom",
        message: "alpha2_pinned_route_requires_provider_and_model",
      });
    }
  });

export const Alpha2HumanGateSchema = z
  .object({
    state: Alpha2GateStateSchema,
    reason: z.string().min(1).optional(),
    decisionRef: z.string().min(1).optional(),
    decidedAt: z.string().datetime().optional(),
  })
  .strict()
  .superRefine((gate, ctx) => {
    if (gate.state === "pending" && !gate.reason) {
      ctx.addIssue({ code: "custom", message: "alpha2_pending_gate_requires_reason" });
    }
    if (["approved", "rejected", "expired"].includes(gate.state) && !gate.decisionRef) {
      ctx.addIssue({ code: "custom", message: "alpha2_gate_decision_requires_reference" });
    }
  });

export const Alpha2CheckpointSchema = z
  .object({
    checkpointId: z.string().min(1),
    createdAt: z.string().datetime(),
    status: Alpha2RunStatusSchema,
    cursor: z.string().min(1).optional(),
    evidenceRefs: z.array(z.string().min(1)).default([]),
    safeTraceStepRefs: z.array(Alpha2SafeTraceStepRefSchema).default([]),
    artifactRefs: z.array(Alpha2SafeTraceArtifactRefSchema).default([]),
  })
  .strict();

export const Alpha2RunRecordSchema = z
  .object({
    schemaVersion: z.literal("alpha2.run.v1"),
    runId: z.string().min(1),
    rootRunId: z.string().min(1),
    parentRunId: z.string().min(1).nullable(),
    childRunIds: z.array(z.string().min(1)).default([]),
    idempotencyKey: z.string().min(1),
    taskId: z.string().min(1),
    kind: Alpha2RunKindSchema,
    status: Alpha2RunStatusSchema,
    primaryRole: AgentRoleIdSchema,
    supportingRoles: z.array(AgentRoleIdSchema).default([]),
    riskClass: Alpha2RiskClassSchema,
    humanGate: Alpha2HumanGateSchema,
    budget: Alpha2BudgetSchema,
    route: Alpha2ModelRouteSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    startedAt: z.string().datetime().optional(),
    wallClockDeadlineAt: z.string().datetime().optional(),
    finishedAt: z.string().datetime().optional(),
    resumeAt: z.string().datetime().optional(),
    attempt: z.number().int().min(0),
    checkpoints: z.array(Alpha2CheckpointSchema).default([]),
    evidenceRefs: z.array(z.string().min(1)).default([]),
    safeTraceStepRefs: z.array(Alpha2SafeTraceStepRefSchema).default([]),
    artifactRefs: z.array(Alpha2SafeTraceArtifactRefSchema).default([]),
    lastErrorCode: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((run, ctx) => {
    if (run.parentRunId === null && run.rootRunId !== run.runId) {
      ctx.addIssue({ code: "custom", message: "alpha2_root_run_must_reference_itself" });
    }
    if (run.parentRunId !== null && run.parentRunId === run.runId) {
      ctx.addIssue({ code: "custom", message: "alpha2_run_cannot_parent_itself" });
    }
    if (run.parentRunId !== null && run.rootRunId === run.runId) {
      ctx.addIssue({ code: "custom", message: "alpha2_child_run_cannot_reference_itself_as_root" });
    }
    if (new Set(run.childRunIds).size !== run.childRunIds.length) {
      ctx.addIssue({ code: "custom", message: "alpha2_duplicate_child_run_id" });
    }
    if (run.childRunIds.includes(run.runId)) {
      ctx.addIssue({ code: "custom", message: "alpha2_run_cannot_be_own_child" });
    }
    if (run.status === "human_gate" && run.humanGate.state !== "pending") {
      ctx.addIssue({ code: "custom", message: "alpha2_human_gate_status_requires_pending_gate" });
    }
    if (run.humanGate.state === "pending" && run.status !== "human_gate") {
      ctx.addIssue({ code: "custom", message: "alpha2_pending_gate_requires_human_gate_status" });
    }
    if (["completed", "cancelled"].includes(run.status) && !run.finishedAt) {
      ctx.addIssue({ code: "custom", message: "alpha2_terminal_run_requires_finished_at" });
    }
    if (["completed", "cancelled", "review", "human_gate"].includes(run.status) && run.resumeAt) {
      ctx.addIssue({ code: "custom", message: "alpha2_nonresumable_status_cannot_have_resume_at" });
    }
    if (run.attempt > run.budget.maxAttempts) {
      ctx.addIssue({ code: "custom", message: "alpha2_attempt_exceeds_budget" });
    }
  });

export type Alpha2Budget = z.infer<typeof Alpha2BudgetSchema>;
export type Alpha2ModelRoute = z.infer<typeof Alpha2ModelRouteSchema>;
export type Alpha2HumanGate = z.infer<typeof Alpha2HumanGateSchema>;
export type Alpha2Checkpoint = z.infer<typeof Alpha2CheckpointSchema>;
export type Alpha2RunRecord = z.infer<typeof Alpha2RunRecordSchema>;

const ALLOWED_TRANSITIONS: Record<Alpha2RunStatus, readonly Alpha2RunStatus[]> = {
  queued: ["running", "review", "human_gate", "cancelled"],
  running: ["waiting", "review", "human_gate", "failed", "completed", "cancelled"],
  waiting: ["running", "review", "human_gate", "failed", "cancelled"],
  review: ["running", "human_gate", "failed", "completed", "cancelled"],
  human_gate: ["running", "review", "failed", "cancelled"],
  failed: ["queued", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isAlpha2RunTransitionAllowed(from: Alpha2RunStatus, to: Alpha2RunStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertAlpha2RunTransition(from: Alpha2RunStatus, to: Alpha2RunStatus) {
  if (!isAlpha2RunTransitionAllowed(from, to)) {
    throw new Error(`alpha2_invalid_run_transition:${from}->${to}`);
  }
}

export function createAlpha2RunRecord(input: {
  runId: string;
  parentRunId?: string | null;
  rootRunId?: string;
  idempotencyKey: string;
  taskId: string;
  kind: Alpha2RunKind;
  primaryRole: AgentRoleId;
  supportingRoles?: AgentRoleId[];
  riskClass: Alpha2RiskClass;
  route: Alpha2ModelRoute;
  budget?: Partial<Alpha2Budget>;
  humanGate?: Alpha2HumanGate;
  now?: string;
}): Alpha2RunRecord {
  const now = input.now ?? new Date().toISOString();
  const parentRunId = input.parentRunId ?? null;

  if (parentRunId !== null && !input.rootRunId) {
    throw new Error("alpha2_child_run_requires_root_run_id");
  }

  const rootRunId = input.rootRunId ?? input.runId;

  return Alpha2RunRecordSchema.parse({
    schemaVersion: "alpha2.run.v1",
    runId: input.runId,
    rootRunId,
    parentRunId,
    childRunIds: [],
    idempotencyKey: input.idempotencyKey,
    taskId: input.taskId,
    kind: input.kind,
    status: input.humanGate?.state === "pending" ? "human_gate" : "queued",
    primaryRole: input.primaryRole,
    supportingRoles: Array.from(new Set(input.supportingRoles ?? [])).filter(
      (role) => role !== input.primaryRole,
    ),
    riskClass: input.riskClass,
    humanGate: input.humanGate ?? { state: "not_required" },
    budget: {
      maxAttempts: input.budget?.maxAttempts ?? 3,
      maxModelCalls: input.budget?.maxModelCalls,
      maxWallClockMs: input.budget?.maxWallClockMs,
      maxEstimatedCostEur: input.budget?.maxEstimatedCostEur,
    },
    route: input.route,
    createdAt: now,
    updatedAt: now,
    attempt: 0,
    checkpoints: [],
    evidenceRefs: [],
    safeTraceStepRefs: [],
    artifactRefs: [],
  });
}

export function transitionAlpha2Run(
  run: Alpha2RunRecord,
  to: Alpha2RunStatus,
  input: {
    now?: string;
    humanGate?: Alpha2HumanGate;
    errorCode?: string;
    resumeAt?: string;
  } = {},
): Alpha2RunRecord {
  assertAlpha2RunTransition(run.status, to);
  const now = input.now ?? new Date().toISOString();

  if (DECIDED_HUMAN_GATE_STATES.has(run.humanGate.state) && input.humanGate) {
    throw new Error("alpha2_human_gate_decision_is_immutable");
  }

  const nextHumanGate = input.humanGate ?? run.humanGate;

  if (run.status === "human_gate" && ["running", "review"].includes(to)) {
    if (nextHumanGate.state !== "approved") {
      throw new Error("alpha2_human_gate_exit_requires_approval");
    }
  }

  if (run.status === "human_gate" && !DECIDED_HUMAN_GATE_STATES.has(nextHumanGate.state)) {
    throw new Error("alpha2_human_gate_exit_requires_decision");
  }

  if (to === "running" && !["not_required", "approved"].includes(nextHumanGate.state)) {
    throw new Error("alpha2_execution_blocked_by_human_gate_decision");
  }

  const preservesResumeAt = to === "waiting" || to === "failed";
  const next = {
    ...run,
    status: to,
    updatedAt: now,
    startedAt: to === "running" ? (run.startedAt ?? now) : run.startedAt,
    finishedAt: ["completed", "cancelled"].includes(to) ? now : undefined,
    resumeAt: preservesResumeAt ? input.resumeAt : undefined,
    attempt: to === "running" && run.status === "queued" ? run.attempt + 1 : run.attempt,
    humanGate: nextHumanGate,
    lastErrorCode: to === "failed" ? input.errorCode ?? "alpha2_run_failed" : undefined,
  } satisfies Alpha2RunRecord;

  return Alpha2RunRecordSchema.parse(next);
}

export function appendAlpha2Checkpoint(
  run: Alpha2RunRecord,
  checkpoint: Omit<Alpha2Checkpoint, "status"> & { status?: Alpha2RunStatus },
): Alpha2RunRecord {
  if (run.checkpoints.some((entry) => entry.checkpointId === checkpoint.checkpointId)) {
    return run;
  }

  return Alpha2RunRecordSchema.parse({
    ...run,
    updatedAt: checkpoint.createdAt,
    checkpoints: [
      ...run.checkpoints,
      {
        ...checkpoint,
        status: checkpoint.status ?? run.status,
      },
    ],
  });
}

export function linkAlpha2ChildRun(parent: Alpha2RunRecord, child: Alpha2RunRecord): Alpha2RunRecord {
  if (child.parentRunId !== parent.runId) {
    throw new Error("alpha2_child_parent_mismatch");
  }
  if (child.rootRunId !== parent.rootRunId) {
    throw new Error("alpha2_child_root_mismatch");
  }
  if (parent.childRunIds.includes(child.runId)) return parent;

  return Alpha2RunRecordSchema.parse({
    ...parent,
    childRunIds: [...parent.childRunIds, child.runId],
  });
}
