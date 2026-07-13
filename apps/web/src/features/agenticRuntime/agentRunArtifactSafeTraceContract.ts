import {
  buildAiTraceHiddenByPolicyLines,
  getAiTraceSurfaceScopeLine,
} from "@/features/ai/aiTraceSurfaceTruth";
import {
  buildCreateAiOrchestrationProvenanceTrace,
  buildRundenAiOrchestrationProvenanceTrace,
  type AiOrchestrationProvenanceTraceStep,
} from "@/features/create/aiOrchestrationProvenanceTrace";
import {
  resolveTaskToAgentRoles,
  type AgentRoleId,
} from "@/features/agenticRuntime/agentRegistryBootstrapContract";

export const AGENT_SAFE_TRACE_CONFIDENCE_LABELS = [
  "guarded",
  "review_required",
  "confirmed_runtime",
] as const;

export const AGENT_SAFE_TRACE_STATUSES = [
  "completed",
  "review_required",
  "planned",
  "blocked",
] as const;

export const AGENT_SAFE_TRACE_ARTIFACT_TYPES = [
  "human_input",
  "source_reference",
  "server_draft",
  "create_workspace",
  "planner_followup",
  "analyze_receipt",
  "candidate_preview",
  "review_handoff",
  "source_pack",
  "regional_signal",
  "transferability_candidate",
] as const;

export const AGENT_SAFE_TRACE_REQUIRED_HUMAN_ACTIONS = [
  "review_before_publish",
  "confirm_intake_split",
  "verify_source_provenance",
  "assess_transferability",
  "triage_regional_relevance",
  "continue_manually",
  "none",
] as const;

export type AgentSafeTraceConfidenceLabel =
  (typeof AGENT_SAFE_TRACE_CONFIDENCE_LABELS)[number];
export type AgentSafeTraceStatus = (typeof AGENT_SAFE_TRACE_STATUSES)[number];
export type AgentSafeTraceArtifactType =
  (typeof AGENT_SAFE_TRACE_ARTIFACT_TYPES)[number];
export type AgentSafeTraceRequiredHumanAction =
  (typeof AGENT_SAFE_TRACE_REQUIRED_HUMAN_ACTIONS)[number];

export type AgentSafeTraceArtifactRef = {
  id: string;
  type: AgentSafeTraceArtifactType;
  label: string;
  reviewState: "present" | "planned" | "review_required";
};

export type AgentSafeTraceStep = {
  roleId: AgentRoleId;
  stepId: string;
  surface: string;
  userSafeLabel: string;
  status: AgentSafeTraceStatus;
  confidenceLabel: AgentSafeTraceConfidenceLabel;
  requiredHumanAction: AgentSafeTraceRequiredHumanAction;
  inputArtifacts: AgentSafeTraceArtifactRef[];
  outputArtifacts: AgentSafeTraceArtifactRef[];
  evidenceRefs: string[];
  reviewState: string;
  publishState: string;
  traceScopeLine: string;
  hiddenByPolicy: string[];
};

function artifactTypeFromInputOrigin(
  value: AiOrchestrationProvenanceTraceStep["inputOriginType"],
): AgentSafeTraceArtifactType {
  if (value === "server_draft") return "server_draft";
  if (value === "planned_not_active") return "create_workspace";
  if (value === "human_input") return "human_input";
  return "source_reference";
}

function artifactTypeFromOutput(
  value: AiOrchestrationProvenanceTraceStep["outputType"],
): AgentSafeTraceArtifactType {
  switch (value) {
    case "draft_saved":
    case "draft_handoff_ready":
      return "create_workspace";
    case "planner_followup":
      return "planner_followup";
    case "analyze_result":
    case "run_receipt":
    case "admin_smoke_diagnostics":
      return "analyze_receipt";
    case "candidate_preview":
      return "candidate_preview";
    case "candidate_review_handoff":
      return "review_handoff";
    case "planned_not_active":
      return "create_workspace";
  }
}

function resolveSafeTraceRole(step: AiOrchestrationProvenanceTraceStep): AgentRoleId {
  if (step.stepId.includes("planner") || step.stepId.includes("intake")) {
    return resolveTaskToAgentRoles({ id: "V3-INTAKE-FORMAT-AGENT-E2E-01" }).primaryRole;
  }
  if (step.stepId.includes("feed_enrichment")) {
    return resolveTaskToAgentRoles({
      id: "V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01",
    }).primaryRole;
  }
  if (step.stepId.includes("review_handoff") || step.stepId.includes("candidate_preview")) {
    return resolveTaskToAgentRoles({
      id: "V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01",
      primaryRole: "dossier_briefing",
      supportingRoles: ["governance_compliance"],
    }).primaryRole;
  }
  if (step.stepId.includes("voxy")) {
    return "personal_voxy";
  }
  return resolveTaskToAgentRoles({
    id: "V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01",
  }).primaryRole;
}

function resolveStatus(step: AiOrchestrationProvenanceTraceStep): AgentSafeTraceStatus {
  if (step.publishState === "planned_not_active" || step.reviewState === "planned_not_active") {
    return "planned";
  }
  if (step.missingRuntimeTruth && step.outputType === "planned_not_active") {
    return "planned";
  }
  if (step.reviewState === "review_required" || step.publishState === "publish_blocked") {
    return "review_required";
  }
  return "completed";
}

function resolveConfidenceLabel(
  step: AiOrchestrationProvenanceTraceStep,
): AgentSafeTraceConfidenceLabel {
  if (step.missingRuntimeTruth) return "guarded";
  if (step.reviewState === "review_required") return "review_required";
  return "confirmed_runtime";
}

function resolveRequiredHumanAction(
  step: AiOrchestrationProvenanceTraceStep,
): AgentSafeTraceRequiredHumanAction {
  if (step.stepId.includes("transition")) return "continue_manually";
  if (step.stepId.includes("planner") || step.stepId.includes("analyze")) {
    return "confirm_intake_split";
  }
  if (step.stepId.includes("feed_enrichment")) return "verify_source_provenance";
  if (step.stepId.includes("voxy")) return "continue_manually";
  if (step.reviewState === "review_required" || step.publishState === "publish_blocked") {
    return "review_before_publish";
  }
  return "none";
}

function buildInputArtifacts(
  step: AiOrchestrationProvenanceTraceStep,
): AgentSafeTraceArtifactRef[] {
  const artifacts: AgentSafeTraceArtifactRef[] = [
    {
      id: `${step.stepId}:input`,
      type: artifactTypeFromInputOrigin(step.inputOriginType),
      label: step.inputOrigin,
      reviewState: step.inputOriginType === "planned_not_active" ? "planned" : "present",
    },
  ];

  for (const source of step.sourceProvenance) {
    artifacts.push({
      id: `${step.stepId}:source:${source.type}:${source.ref ?? source.label}`,
      type: source.state === "planned_not_active" ? "create_workspace" : "source_reference",
      label: source.label,
      reviewState:
        source.state === "present"
          ? "present"
          : source.state === "planned_not_active"
            ? "planned"
            : "review_required",
    });
  }

  return artifacts;
}

function buildOutputArtifacts(
  step: AiOrchestrationProvenanceTraceStep,
): AgentSafeTraceArtifactRef[] {
  return [
    {
      id: `${step.stepId}:output`,
      type: artifactTypeFromOutput(step.outputType),
      label: step.userVisibleLabel,
      reviewState:
        resolveStatus(step) === "planned"
          ? "planned"
          : resolveStatus(step) === "review_required"
            ? "review_required"
            : "present",
    },
  ];
}

export function buildAgentSafeTraceStep(input: {
  taskId: string;
  stepId: string;
  surface: string;
  userSafeLabel: string;
  status: AgentSafeTraceStatus;
  confidenceLabel: AgentSafeTraceConfidenceLabel;
  requiredHumanAction: AgentSafeTraceRequiredHumanAction;
  inputArtifacts: AgentSafeTraceArtifactRef[];
  outputArtifacts: AgentSafeTraceArtifactRef[];
  evidenceRefs?: string[];
  reviewState?: string;
  publishState?: string;
  primaryRole?: AgentRoleId;
  supportingRoles?: AgentRoleId[];
}): AgentSafeTraceStep {
  const resolution = resolveTaskToAgentRoles({
    id: input.taskId,
    primaryRole: input.primaryRole,
    supportingRoles: input.supportingRoles,
  });

  return {
    roleId: resolution.primaryRole,
    stepId: input.stepId,
    surface: input.surface,
    userSafeLabel: input.userSafeLabel,
    status: input.status,
    confidenceLabel: input.confidenceLabel,
    requiredHumanAction: input.requiredHumanAction,
    inputArtifacts: input.inputArtifacts,
    outputArtifacts: input.outputArtifacts,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    reviewState: input.reviewState ?? "review_required",
    publishState: input.publishState ?? "publish_blocked",
    traceScopeLine: getAiTraceSurfaceScopeLine("user"),
    hiddenByPolicy: buildAiTraceHiddenByPolicyLines("user"),
  };
}

export function buildAgentSafeTraceFromAiStep(
  step: AiOrchestrationProvenanceTraceStep,
): AgentSafeTraceStep {
  return {
    roleId: resolveSafeTraceRole(step),
    stepId: step.stepId,
    surface: step.surface,
    userSafeLabel: step.userVisibleLabel,
    status: resolveStatus(step),
    confidenceLabel: resolveConfidenceLabel(step),
    requiredHumanAction: resolveRequiredHumanAction(step),
    inputArtifacts: buildInputArtifacts(step),
    outputArtifacts: buildOutputArtifacts(step),
    evidenceRefs: [...step.evidenceRefs],
    reviewState: step.reviewState,
    publishState: step.publishState,
    traceScopeLine: getAiTraceSurfaceScopeLine("user"),
    hiddenByPolicy: buildAiTraceHiddenByPolicyLines("user"),
  };
}

export function buildCreateAgentRunSafeTrace(
  params: Parameters<typeof buildCreateAiOrchestrationProvenanceTrace>[0],
) {
  return buildCreateAiOrchestrationProvenanceTrace(params).map(buildAgentSafeTraceFromAiStep);
}

export function buildRundenAgentRunSafeTrace(
  params?: Parameters<typeof buildRundenAiOrchestrationProvenanceTrace>[0],
) {
  return buildRundenAiOrchestrationProvenanceTrace(params).map(buildAgentSafeTraceFromAiStep);
}
