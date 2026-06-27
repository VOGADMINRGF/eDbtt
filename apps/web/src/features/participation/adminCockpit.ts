import { type ParticipationImpactStatus } from "@/features/participation/impactStatus";
import {
  createEmptyParticipationResultFeedback,
  isParticipationResultFeedbackPublishable,
  isParticipationResultFeedbackPublic,
  requiresParticipationResultFeedbackReview,
  summarizeParticipationResultFeedbackReadiness,
  type ParticipationResultFeedback,
  type ParticipationResultFeedbackSourceStatus,
  type ParticipationResultFeedbackStatus,
} from "@/features/participation/resultFeedback";

export const PARTICIPATION_ADMIN_COCKPIT_QUEUE_KEYS = [
  "needs_clarification",
  "ready_for_review",
  "in_evaluation",
  "bundled_for_response",
  "addressed_waiting_feedback",
  "feedback_ready",
  "archive_candidates",
] as const;

export type ParticipationAdminCockpitQueueKey =
  (typeof PARTICIPATION_ADMIN_COCKPIT_QUEUE_KEYS)[number];

export const PARTICIPATION_ADMIN_COCKPIT_ACTIONS = [
  "request_clarification",
  "mark_ready_for_review",
  "start_evaluation",
  "bundle_with_related",
  "mark_addressed",
  "prepare_feedback",
  "approve_feedback_for_public",
  "publish_feedback_manually",
  "archive_item",
] as const;

export type ParticipationAdminCockpitAction =
  (typeof PARTICIPATION_ADMIN_COCKPIT_ACTIONS)[number];

export const PARTICIPATION_ADMIN_COCKPIT_RISK_FLAGS = [
  "unverified_source",
  "sensitive_claim",
  "minority_position_present",
  "open_questions_present",
  "external_feedback_pending",
  "manual_review_required",
] as const;

export type ParticipationAdminCockpitRiskFlag =
  (typeof PARTICIPATION_ADMIN_COCKPIT_RISK_FLAGS)[number];

export type ParticipationAdminCockpitGuardrails = {
  noAutoPublish: true;
  noAutoDossier: true;
  noAutoAnlassraum: true;
  noAutoGraph: true;
  noAutomaticOfficialAssessment: true;
  manualReviewRequiredForPublicFeedback: true;
  cockpitIsWorklistOnly: true;
  publishManualOnly: true;
  feedbackReadyIsNotPublic: true;
  addressedIsNotResolved: true;
  operatorReviewIsNotPoliticalDecision: true;
};

export type ParticipationAdminCockpitItemInput = {
  id: string;
  title: string;
  summary: string;
  impactStatus: ParticipationImpactStatus;
  feedbackStatus: ParticipationResultFeedbackStatus;
  sourceStatus: ParticipationResultFeedbackSourceStatus;
  updatedAt: string;
  topicSummaryCount?: number;
  nextStepCount?: number;
  minorityPositionCount?: number;
  openQuestionCount?: number;
  sensitiveClaimCount?: number;
};

export type ParticipationAdminCockpitItem = ParticipationAdminCockpitItemInput & {
  publishable: boolean;
  publicVisible: boolean;
  feedbackReadinessLabel: ReturnType<
    typeof summarizeParticipationResultFeedbackReadiness
  >["readinessLabel"];
  riskFlags: ParticipationAdminCockpitRiskFlag[];
  queueKey: ParticipationAdminCockpitQueueKey;
  allowedActions: ParticipationAdminCockpitAction[];
  reviewRequired: boolean;
  guardrails: ParticipationAdminCockpitGuardrails;
};

export type ParticipationAdminCockpitQueue = {
  key: ParticipationAdminCockpitQueueKey;
  label: string;
  count: number;
  items: ParticipationAdminCockpitItem[];
  guardrails: ParticipationAdminCockpitGuardrails;
};

export type ParticipationAdminCockpitSummary = {
  total: number;
  reviewRequiredCount: number;
  riskItemCount: number;
  publicFeedbackCount: number;
  publishableCount: number;
  queues: ParticipationAdminCockpitQueue[];
  guardrails: ParticipationAdminCockpitGuardrails;
};

const PARTICIPATION_ADMIN_COCKPIT_GUARDRAILS =
  Object.freeze({
    noAutoPublish: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoGraph: true,
    noAutomaticOfficialAssessment: true,
    manualReviewRequiredForPublicFeedback: true,
    cockpitIsWorklistOnly: true,
    publishManualOnly: true,
    feedbackReadyIsNotPublic: true,
    addressedIsNotResolved: true,
    operatorReviewIsNotPoliticalDecision: true,
  }) satisfies ParticipationAdminCockpitGuardrails;

const PARTICIPATION_ADMIN_COCKPIT_QUEUE_LABELS: Record<
  ParticipationAdminCockpitQueueKey,
  string
> = {
  needs_clarification: "Rückfragen offen",
  ready_for_review: "Reviewfähig",
  in_evaluation: "In Auswertung",
  bundled_for_response: "Gebündelt für Rückmeldung",
  addressed_waiting_feedback: "Adressiert, Rückmeldung ausstehend",
  feedback_ready: "Rückmeldung freigegeben, nicht öffentlich",
  archive_candidates: "Archivkandidaten",
};

function withDefaults(
  item: ParticipationAdminCockpitItemInput,
): Required<ParticipationAdminCockpitItemInput> {
  return {
    ...item,
    topicSummaryCount: item.topicSummaryCount ?? 0,
    nextStepCount: item.nextStepCount ?? 0,
    minorityPositionCount: item.minorityPositionCount ?? 0,
    openQuestionCount: item.openQuestionCount ?? 0,
    sensitiveClaimCount: item.sensitiveClaimCount ?? 0,
  };
}

function buildSyntheticFeedback(
  input: ParticipationAdminCockpitItemInput,
): ParticipationResultFeedback {
  const normalized = withDefaults(input);

  return {
    ...createEmptyParticipationResultFeedback({
      id: normalized.id,
      updatedAt: normalized.updatedAt,
      impactStatus: normalized.impactStatus,
    }),
    title: normalized.title,
    summary: normalized.summary,
    feedbackStatus: normalized.feedbackStatus,
    sourceStatus: normalized.sourceStatus,
    topicSummaries: Array.from(
      { length: normalized.topicSummaryCount },
      (_, index) => ({
        id: `topic-${index + 1}`,
        title: `Topic ${index + 1}`,
        summary: "Prepared summary",
      }),
    ),
    minorityPositions: Array.from(
      { length: normalized.minorityPositionCount },
      (_, index) => ({
        id: `minority-${index + 1}`,
        title: `Minority ${index + 1}`,
        summary: "Preserved minority position",
        preserved: true as const,
      }),
    ),
    openQuestions: Array.from(
      { length: normalized.openQuestionCount },
      (_, index) => ({
        id: `question-${index + 1}`,
        question: `Open question ${index + 1}`,
        stillOpen: true as const,
      }),
    ),
    nextSteps: Array.from({ length: normalized.nextStepCount }, (_, index) => ({
      id: `step-${index + 1}`,
      label: `Step ${index + 1}`,
      description: "Manual review-first follow-up",
      reviewFirst: true as const,
    })),
  };
}

function hasApprovalBase(item: ParticipationAdminCockpitItemInput): boolean {
  const feedback = buildSyntheticFeedback(item);
  const readiness = summarizeParticipationResultFeedbackReadiness(feedback);

  return (
    readiness.readinessLabel === "ready_for_review" ||
    readiness.readinessLabel === "approved_not_public" ||
    readiness.readinessLabel === "public_feedback_live"
  );
}

function buildRiskFlags(
  item: ParticipationAdminCockpitItemInput,
): ParticipationAdminCockpitRiskFlag[] {
  const normalized = withDefaults(item);
  const feedback = buildSyntheticFeedback(normalized);
  const publicVisible = isParticipationResultFeedbackPublic(feedback);
  const reviewRequired = requiresParticipationResultFeedbackReview(feedback);
  const flags: ParticipationAdminCockpitRiskFlag[] = [];

  if (normalized.sourceStatus === "unverified_input") {
    flags.push("unverified_source");
  }
  if (normalized.sensitiveClaimCount > 0) {
    flags.push("sensitive_claim");
  }
  if (normalized.minorityPositionCount > 0) {
    flags.push("minority_position_present");
  }
  if (normalized.openQuestionCount > 0) {
    flags.push("open_questions_present");
  }
  if (normalized.impactStatus === "addressed" && !publicVisible) {
    flags.push("external_feedback_pending");
  }
  if (reviewRequired) {
    flags.push("manual_review_required");
  }

  return flags;
}

export function getParticipationAdminCockpitQueueKey(
  item: ParticipationAdminCockpitItemInput,
): ParticipationAdminCockpitQueueKey {
  const feedback = buildSyntheticFeedback(item);
  const readiness = summarizeParticipationResultFeedbackReadiness(feedback);

  if (item.impactStatus === "needs_clarification") {
    return "needs_clarification";
  }
  if (readiness.readinessLabel === "approved_not_public") {
    return "feedback_ready";
  }
  if (readiness.readinessLabel === "ready_for_review") {
    return "ready_for_review";
  }
  if (item.impactStatus === "in_evaluation") {
    return "in_evaluation";
  }
  if (item.impactStatus === "bundled") {
    return "bundled_for_response";
  }
  if (
    item.impactStatus === "addressed" &&
    item.feedbackStatus !== "published_feedback"
  ) {
    return "addressed_waiting_feedback";
  }
  if (
    item.impactStatus === "feedback_available" ||
    item.impactStatus === "closed_archived" ||
    item.feedbackStatus === "published_feedback"
  ) {
    return "archive_candidates";
  }

  return "needs_clarification";
}

export function getParticipationAdminCockpitAllowedActions(
  item: ParticipationAdminCockpitItemInput,
): ParticipationAdminCockpitAction[] {
  const feedback = buildSyntheticFeedback(item);
  const readiness = summarizeParticipationResultFeedbackReadiness(feedback);
  const publishable = isParticipationResultFeedbackPublishable(feedback);
  const approvalBase = hasApprovalBase(item);
  const actions: ParticipationAdminCockpitAction[] = [];

  if (
    item.impactStatus === "submitted" ||
    item.impactStatus === "queued_for_review" ||
    item.impactStatus === "in_evaluation"
  ) {
    actions.push("request_clarification");
  }
  if (
    (item.feedbackStatus === "draft" || item.feedbackStatus === "in_review") &&
    readiness.readinessLabel === "ready_for_review"
  ) {
    actions.push("mark_ready_for_review");
  }
  if (item.impactStatus === "queued_for_review") {
    actions.push("start_evaluation");
  }
  if (item.impactStatus === "in_evaluation") {
    actions.push("bundle_with_related");
  }
  if (
    item.impactStatus === "in_evaluation" ||
    item.impactStatus === "bundled"
  ) {
    actions.push("mark_addressed");
  }
  if (
    item.impactStatus === "addressed" ||
    item.impactStatus === "bundled" ||
    item.impactStatus === "feedback_available"
  ) {
    actions.push("prepare_feedback");
  }
  if (
    approvalBase &&
    item.feedbackStatus !== "approved_for_public_feedback" &&
    item.feedbackStatus !== "published_feedback" &&
    item.feedbackStatus !== "archived"
  ) {
    actions.push("approve_feedback_for_public");
  }
  if (publishable) {
    actions.push("publish_feedback_manually");
  }
  if (
    item.impactStatus === "feedback_available" ||
    item.impactStatus === "closed_archived" ||
    item.feedbackStatus === "published_feedback"
  ) {
    actions.push("archive_item");
  }

  return actions;
}

export function isParticipationAdminCockpitActionAllowed(
  item: ParticipationAdminCockpitItemInput,
  action: ParticipationAdminCockpitAction,
): boolean {
  return getParticipationAdminCockpitAllowedActions(item).includes(action);
}

export function hasParticipationAdminCockpitRisk(
  item: ParticipationAdminCockpitItemInput,
): boolean {
  return buildRiskFlags(item).length > 0;
}

export function createParticipationAdminCockpitItem(
  input: ParticipationAdminCockpitItemInput,
): ParticipationAdminCockpitItem {
  const normalized = withDefaults(input);
  const feedback = buildSyntheticFeedback(normalized);
  const readiness = summarizeParticipationResultFeedbackReadiness(feedback);

  return {
    ...normalized,
    publishable: isParticipationResultFeedbackPublishable(feedback),
    publicVisible: isParticipationResultFeedbackPublic(feedback),
    feedbackReadinessLabel: readiness.readinessLabel,
    riskFlags: buildRiskFlags(normalized),
    queueKey: getParticipationAdminCockpitQueueKey(normalized),
    allowedActions: getParticipationAdminCockpitAllowedActions(normalized),
    reviewRequired: requiresParticipationResultFeedbackReview(feedback),
    guardrails: PARTICIPATION_ADMIN_COCKPIT_GUARDRAILS,
  };
}

export function buildParticipationAdminCockpitSummary(
  items: ParticipationAdminCockpitItemInput[],
): ParticipationAdminCockpitSummary {
  const hydratedItems = items.map(createParticipationAdminCockpitItem);
  const queues = PARTICIPATION_ADMIN_COCKPIT_QUEUE_KEYS.map((key) => {
    const queueItems = hydratedItems.filter((item) => item.queueKey === key);

    return {
      key,
      label: PARTICIPATION_ADMIN_COCKPIT_QUEUE_LABELS[key],
      count: queueItems.length,
      items: queueItems,
      guardrails: PARTICIPATION_ADMIN_COCKPIT_GUARDRAILS,
    };
  });

  return {
    total: hydratedItems.length,
    reviewRequiredCount: hydratedItems.filter((item) => item.reviewRequired)
      .length,
    riskItemCount: hydratedItems.filter((item) =>
      hasParticipationAdminCockpitRisk(item)
    ).length,
    publicFeedbackCount: hydratedItems.filter((item) => item.publicVisible)
      .length,
    publishableCount: hydratedItems.filter((item) => item.publishable).length,
    queues,
    guardrails: PARTICIPATION_ADMIN_COCKPIT_GUARDRAILS,
  };
}
