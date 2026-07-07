import type { CanonicalPreparationStatus } from "@/features/create/canonicalPreparationStatusContract";
import {
  resolveRoleSpecificPublicationGate,
  type CompletedRoleSpecificReview,
  type RoleSpecificReviewType,
} from "@/features/create/roleSpecificReviewContract";
import type { GovernanceActor } from "@features/trust/types";

export const DOWNSTREAM_RUNTIME_HANDOFF_TARGETS = [
  "dossier_runtime_record",
  "anlassraum_runtime_record",
  "participation_space_runtime_record",
  "topic_graph_candidate",
] as const;

export type DownstreamRuntimeHandoffTarget =
  (typeof DOWNSTREAM_RUNTIME_HANDOFF_TARGETS)[number];

export const DOWNSTREAM_RUNTIME_HANDOFF_STATES = [
  "review_draft",
  "planned_handoff",
  "persisted_review_record",
  "prepared_not_executed",
  "blocked_by_runtime_truth",
] as const;

export type DownstreamRuntimeHandoffState =
  (typeof DOWNSTREAM_RUNTIME_HANDOFF_STATES)[number];

export type DownstreamRuntimeHandoffRecord = {
  handoffId: string;
  sourceContributionId: string;
  target: DownstreamRuntimeHandoffTarget;
  state: DownstreamRuntimeHandoffState;
  preparationStatus: CanonicalPreparationStatus;
  requiredReviewType: RoleSpecificReviewType;
  targetRecordId: string | null;
  reviewRequired: true;
  autoCreate: false;
  autoPublish: false;
  autoGraphWrite: false;
  missingRuntimeTruth: string[];
};

export type BuildDownstreamRuntimeHandoffInput = {
  handoffId: string;
  sourceContributionId: string;
  target: DownstreamRuntimeHandoffTarget;
  preparationStatus: CanonicalPreparationStatus;
  requiredReviewType: RoleSpecificReviewType;
  targetRecordId?: string | null;
  runtimeTruthAvailable?: boolean;
};

export type ResolveDownstreamRuntimeExecutionInput = {
  actor: GovernanceActor;
  handoff: DownstreamRuntimeHandoffRecord;
  completedReviews: readonly CompletedRoleSpecificReview[];
};

export type DownstreamRuntimeExecutionGate = {
  allowed: boolean;
  state: DownstreamRuntimeHandoffState;
  reason:
    | "allowed"
    | "blocked_by_review_gate"
    | "blocked_by_runtime_truth";
};

export function buildDownstreamRuntimeHandoffRecord(
  input: BuildDownstreamRuntimeHandoffInput,
): DownstreamRuntimeHandoffRecord {
  const runtimeTruthAvailable = input.runtimeTruthAvailable === true;
  const targetRecordId = input.targetRecordId?.trim() ?? null;
  const missingRuntimeTruth =
    runtimeTruthAvailable || targetRecordId
      ? []
      : ["missing_runtime_truth"];

  return {
    handoffId: input.handoffId,
    sourceContributionId: input.sourceContributionId,
    target: input.target,
    state:
      targetRecordId !== null
        ? "persisted_review_record"
        : runtimeTruthAvailable
          ? "planned_handoff"
          : "blocked_by_runtime_truth",
    preparationStatus: input.preparationStatus,
    requiredReviewType: input.requiredReviewType,
    targetRecordId,
    reviewRequired: true,
    autoCreate: false,
    autoPublish: false,
    autoGraphWrite: false,
    missingRuntimeTruth,
  };
}

export function resolveDownstreamRuntimeExecutionGate(
  input: ResolveDownstreamRuntimeExecutionInput,
): DownstreamRuntimeExecutionGate {
  if (input.handoff.missingRuntimeTruth.length > 0) {
    return {
      allowed: false,
      state: "blocked_by_runtime_truth",
      reason: "blocked_by_runtime_truth",
    };
  }

  const gate = resolveRoleSpecificPublicationGate({
    actor: input.actor,
    action: input.handoff.target === "topic_graph_candidate" ? "approve" : "activate",
    requiredReviewType: input.handoff.requiredReviewType,
    completedReviews: input.completedReviews,
  });

  if (!gate.allowed) {
    return {
      allowed: false,
      state: "review_draft",
      reason: "blocked_by_review_gate",
    };
  }

  return {
    allowed: true,
    state: input.handoff.targetRecordId ? "persisted_review_record" : "prepared_not_executed",
    reason: "allowed",
  };
}
