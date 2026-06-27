import {
  type ParticipationImpactStatus,
  getParticipationImpactStatusLabel,
} from "@/features/participation/impactStatus";

export const PARTICIPATION_RESULT_FEEDBACK_STATUSES = [
  "draft",
  "in_review",
  "approved_for_public_feedback",
  "published_feedback",
  "archived",
] as const;

export type ParticipationResultFeedbackStatus =
  (typeof PARTICIPATION_RESULT_FEEDBACK_STATUSES)[number];

export const PARTICIPATION_RESULT_FEEDBACK_SOURCE_STATUSES = [
  "unverified_input",
  "reviewed_summary",
  "dossier_bound",
  "external_feedback_received",
  "operator_reviewed",
] as const;

export type ParticipationResultFeedbackSourceStatus =
  (typeof PARTICIPATION_RESULT_FEEDBACK_SOURCE_STATUSES)[number];

export type ParticipationResultFeedbackTopicSummary = {
  id: string;
  title: string;
  summary: string;
  contributionCount?: number;
};

export type ParticipationResultFeedbackMinorityPosition = {
  id: string;
  title: string;
  summary: string;
  preserved: true;
};

export type ParticipationResultFeedbackOpenQuestion = {
  id: string;
  question: string;
  context?: string;
  stillOpen: true;
};

export type ParticipationResultFeedbackNextStep = {
  id: string;
  label: string;
  description: string;
  reviewFirst: true;
  target?: "review" | "feedback" | "dossier_followup" | "anlassraum_followup";
};

export type ParticipationResultFeedback = {
  id: string;
  title: string;
  summary: string;
  impactStatus: ParticipationImpactStatus;
  feedbackStatus: ParticipationResultFeedbackStatus;
  sourceStatus: ParticipationResultFeedbackSourceStatus;
  topicSummaries: ParticipationResultFeedbackTopicSummary[];
  minorityPositions: ParticipationResultFeedbackMinorityPosition[];
  openQuestions: ParticipationResultFeedbackOpenQuestion[];
  nextSteps: ParticipationResultFeedbackNextStep[];
  reviewNotes: string[];
  updatedAt: string;
  guardrails: {
    feedbackIsNotApproval: true;
    resultIsNotPoliticalResolution: true;
    topicSummaryIsNotVoiceDeletion: true;
    minorityPositionsMustRemainVisible: true;
    openQuestionsStayVisible: true;
    noAutoPublish: true;
    noAutoDossier: true;
    noAutoAnlassraum: true;
    noAutoGraph: true;
    noAutomaticOfficialAssessment: true;
  };
};

export type ParticipationResultFeedbackReadiness = {
  publishable: boolean;
  publicVisible: boolean;
  reviewRequired: boolean;
  readinessLabel:
    | "not_ready"
    | "ready_for_review"
    | "approved_not_public"
    | "public_feedback_live"
    | "archived";
  blockingReasons: string[];
  impactStatusLabel: string;
  guardrails: ParticipationResultFeedback["guardrails"];
};

const PARTICIPATION_RESULT_FEEDBACK_GUARDRAILS =
  Object.freeze({
    feedbackIsNotApproval: true,
    resultIsNotPoliticalResolution: true,
    topicSummaryIsNotVoiceDeletion: true,
    minorityPositionsMustRemainVisible: true,
    openQuestionsStayVisible: true,
    noAutoPublish: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoGraph: true,
    noAutomaticOfficialAssessment: true,
  }) satisfies ParticipationResultFeedback["guardrails"];

const PARTICIPATION_RESULT_FEEDBACK_STATUS_LABELS: Record<
  ParticipationResultFeedbackStatus,
  string
> = {
  draft: "Entwurf",
  in_review: "In Prüfung",
  approved_for_public_feedback: "Für öffentliche Rückmeldung freigegeben",
  published_feedback: "Rückmeldung veröffentlicht",
  archived: "Archiviert",
};

const PARTICIPATION_RESULT_FEEDBACK_SOURCE_STATUS_LABELS: Record<
  ParticipationResultFeedbackSourceStatus,
  string
> = {
  unverified_input: "Ungeprüfter Input",
  reviewed_summary: "Redaktionell geprüft",
  dossier_bound: "An Dossier gebunden",
  external_feedback_received: "Externe Rückmeldung eingegangen",
  operator_reviewed: "Menschlich geprüft",
};

function hasContent(value: string): boolean {
  return value.trim().length > 0;
}

export function createEmptyParticipationResultFeedback(
  params: Pick<ParticipationResultFeedback, "id" | "updatedAt"> & {
    impactStatus?: ParticipationImpactStatus;
  },
): ParticipationResultFeedback {
  return {
    id: params.id,
    title: "",
    summary: "",
    impactStatus: params.impactStatus ?? "submitted",
    feedbackStatus: "draft",
    sourceStatus: "unverified_input",
    topicSummaries: [],
    minorityPositions: [],
    openQuestions: [],
    nextSteps: [],
    reviewNotes: [],
    updatedAt: params.updatedAt,
    guardrails: PARTICIPATION_RESULT_FEEDBACK_GUARDRAILS,
  };
}

export function getParticipationResultFeedbackStatusLabel(
  status: ParticipationResultFeedbackStatus,
): string {
  return PARTICIPATION_RESULT_FEEDBACK_STATUS_LABELS[status];
}

export function getParticipationResultFeedbackSourceStatusLabel(
  status: ParticipationResultFeedbackSourceStatus,
): string {
  return PARTICIPATION_RESULT_FEEDBACK_SOURCE_STATUS_LABELS[status];
}

export function isParticipationResultFeedbackPublishable(
  feedback: ParticipationResultFeedback,
): boolean {
  return (
    feedback.feedbackStatus === "approved_for_public_feedback" &&
    feedback.sourceStatus !== "unverified_input" &&
    hasContent(feedback.title) &&
    hasContent(feedback.summary) &&
    (feedback.topicSummaries.length > 0 || feedback.nextSteps.length > 0)
  );
}

export function isParticipationResultFeedbackPublic(
  feedback: ParticipationResultFeedback,
): boolean {
  return feedback.feedbackStatus === "published_feedback";
}

export function requiresParticipationResultFeedbackReview(
  feedback: ParticipationResultFeedback,
): boolean {
  return (
    feedback.feedbackStatus === "draft" ||
    feedback.feedbackStatus === "in_review" ||
    feedback.sourceStatus === "unverified_input"
  );
}

export function summarizeParticipationResultFeedbackReadiness(
  feedback: ParticipationResultFeedback,
): ParticipationResultFeedbackReadiness {
  const blockingReasons: string[] = [];

  if (!hasContent(feedback.title)) {
    blockingReasons.push("title_missing");
  }
  if (!hasContent(feedback.summary)) {
    blockingReasons.push("summary_missing");
  }
  if (feedback.sourceStatus === "unverified_input") {
    blockingReasons.push("source_unverified");
  }
  if (
    feedback.topicSummaries.length === 0 &&
    feedback.nextSteps.length === 0
  ) {
    blockingReasons.push("topic_summary_or_next_step_required");
  }
  if (
    feedback.feedbackStatus !== "approved_for_public_feedback" &&
    feedback.feedbackStatus !== "published_feedback"
  ) {
    blockingReasons.push("feedback_status_not_approved");
  }

  const publicVisible = isParticipationResultFeedbackPublic(feedback);
  const publishable = isParticipationResultFeedbackPublishable(feedback);

  let readinessLabel: ParticipationResultFeedbackReadiness["readinessLabel"] =
    "not_ready";
  if (feedback.feedbackStatus === "archived") {
    readinessLabel = "archived";
  } else if (publicVisible) {
    readinessLabel = "public_feedback_live";
  } else if (publishable) {
    readinessLabel = "approved_not_public";
  } else if (requiresParticipationResultFeedbackReview(feedback)) {
    readinessLabel = "ready_for_review";
  }

  return {
    publishable,
    publicVisible,
    reviewRequired: requiresParticipationResultFeedbackReview(feedback),
    readinessLabel,
    blockingReasons,
    impactStatusLabel: getParticipationImpactStatusLabel(feedback.impactStatus),
    guardrails: PARTICIPATION_RESULT_FEEDBACK_GUARDRAILS,
  };
}
