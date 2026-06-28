export const DIALOG_ENGAGEMENT_MODES = [
  "count_only",
  "clarify_standpoint",
  "explore_perspectives",
  "co_create_argumentation",
  "prepare_dossier_or_space",
] as const;

export type DialogEngagementMode = (typeof DIALOG_ENGAGEMENT_MODES)[number];

export const DIALOG_USER_OPENNESS_LEVELS = [
  "low",
  "medium",
  "high",
] as const;

export type DialogUserOpenness = (typeof DIALOG_USER_OPENNESS_LEVELS)[number];

export const DIALOG_RESULT_STATUSES = [
  "draft",
  "needs_user_confirmation",
  "confirmed_by_user",
  "needs_review",
  "review_ready",
  "rejected",
] as const;

export type DialogResultStatus = (typeof DIALOG_RESULT_STATUSES)[number];

export const DIALOG_RECOGNITION_CONFIDENCE = [
  "low",
  "medium",
  "high",
] as const;

export type DialogRecognitionConfidence =
  (typeof DIALOG_RECOGNITION_CONFIDENCE)[number];

export const DIALOG_PERSPECTIVE_RELATIONS = [
  "supporting",
  "opposing",
  "adjacent",
  "affected_group",
  "institutional",
  "expert",
] as const;

export type DialogPerspectiveRelation =
  (typeof DIALOG_PERSPECTIVE_RELATIONS)[number];

export const DIALOG_PERSPECTIVE_USER_RESPONSES = [
  "interested",
  "skeptical",
  "adds_context",
  "not_now",
  "needs_clarification",
] as const;

export type DialogPerspectiveUserResponse =
  (typeof DIALOG_PERSPECTIVE_USER_RESPONSES)[number];

export const DIALOG_ARGUMENT_TYPES = [
  "experience",
  "value",
  "evidence_needed",
  "reform",
  "counterargument",
  "risk",
  "safeguard",
] as const;

export type DialogArgumentType = (typeof DIALOG_ARGUMENT_TYPES)[number];

export const DIALOG_ARGUMENT_SOURCES = [
  "user",
  "system_prompted",
  "editorial",
] as const;

export type DialogArgumentSource = (typeof DIALOG_ARGUMENT_SOURCES)[number];

export const DIALOG_ARGUMENT_VERIFICATION_STATUSES = [
  "unverified_user_claim",
  "needs_source",
  "reviewed",
  "rejected",
] as const;

export type DialogArgumentVerificationStatus =
  (typeof DIALOG_ARGUMENT_VERIFICATION_STATUSES)[number];

export const DIALOG_BRANCH_STATUSES = [
  "suggested",
  "accepted_by_user",
  "parked",
  "review_ready",
] as const;

export type DialogBranchStatus = (typeof DIALOG_BRANCH_STATUSES)[number];

export const DIALOG_HANDOFF_TARGETS = [
  "count_opinion",
  "dossier_candidate",
  "anlassraum_candidate",
  "participation_space_candidate",
  "editorial_review",
  "factcheck_request",
] as const;

export type DialogHandoffTarget = (typeof DIALOG_HANDOFF_TARGETS)[number];

export const DIALOG_OUTCOME_GUARDRAILS = {
  noAutoPublish: true,
  noAutoDossier: true,
  noAutoAnlassraum: true,
  noAutoGraph: true,
  noAutoFactAssertion: true,
  noExternalResearch: true,
  noHiddenDeepSearchCostPath: true,
} as const;

export type RecognizedUserStandpoint = {
  summary: string;
  confidence: DialogRecognitionConfidence;
  confirmedByUser: boolean;
  userCorrection?: string | null;
};

export type DialogPerspective = {
  id: string;
  label: string;
  summary: string;
  relation: DialogPerspectiveRelation;
  isPresentedToUser: boolean;
  userResponse?: DialogPerspectiveUserResponse | null;
};

export type DialogArgument = {
  id: string;
  claim: string;
  type: DialogArgumentType;
  source: DialogArgumentSource;
  verificationStatus: DialogArgumentVerificationStatus;
  linkedPerspectiveIds: string[];
};

export type DialogBranch = {
  id: string;
  title: string;
  reason: string;
  parentTopicId?: string | null;
  status: DialogBranchStatus;
};

export type DialogOutcome = {
  id: string;
  topicTitle: string;
  engagementMode: DialogEngagementMode;
  userOpenness: DialogUserOpenness;
  recognizedStandpoint: RecognizedUserStandpoint;
  arguments: DialogArgument[];
  perspectives: DialogPerspective[];
  branches: DialogBranch[];
  openQuestions: string[];
  resultStatus: DialogResultStatus;
  handoffTargets: DialogHandoffTarget[];
};

export type DialogPerspectivePrompt = {
  perspectiveId: string;
  label: string;
  relation: DialogPerspectiveRelation;
  prompt: string;
  optional: true;
};

export type DialogHandoffCandidate = {
  target: DialogHandoffTarget;
  eligible: boolean;
  requiresReview: true;
  blockedReasons: string[];
  autoCreate: false;
  autoPublish: false;
};

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function hasText(value: string | null | undefined): boolean {
  return normalizeText(value).length > 0;
}

function unique(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function normalizeTargets(
  targets: readonly DialogHandoffTarget[],
): DialogHandoffTarget[] {
  return Array.from(new Set(targets));
}

function isRejectedOutcome(outcome: DialogOutcome): boolean {
  return outcome.resultStatus === "rejected";
}

function isCountOnlyOutcome(outcome: DialogOutcome): boolean {
  return (
    outcome.engagementMode === "count_only" ||
    outcome.userOpenness === "low"
  );
}

function canExploreDialog(outcome: DialogOutcome): boolean {
  if (isRejectedOutcome(outcome)) return false;
  if (isCountOnlyOutcome(outcome)) return false;
  return outcome.userOpenness === "medium" || outcome.userOpenness === "high";
}

function hasBlockingSourceClaim(outcome: DialogOutcome): boolean {
  return outcome.arguments.some(
    (argument) => argument.verificationStatus === "needs_source",
  );
}

function hasStandpointSummary(outcome: DialogOutcome): boolean {
  return hasText(summarizeRecognizedStandpoint(outcome));
}

function isStandpointConfirmed(outcome: DialogOutcome): boolean {
  return (
    outcome.recognizedStandpoint.confirmedByUser ||
    outcome.resultStatus === "confirmed_by_user" ||
    outcome.resultStatus === "review_ready"
  );
}

function hasReviewableSubstance(outcome: DialogOutcome): boolean {
  return (
    outcome.arguments.length > 0 ||
    outcome.perspectives.length > 0 ||
    outcome.branches.length > 0 ||
    unique(outcome.openQuestions).length > 0 ||
    outcome.engagementMode === "prepare_dossier_or_space"
  );
}

function buildPerspectivePrompt(
  perspective: DialogPerspective,
): DialogPerspectivePrompt {
  const label = normalizeText(perspective.label);
  const promptLabel = label || "diese Perspektive";

  let prompt = `Möchtest du ${promptLabel} einbeziehen?`;
  if (perspective.relation === "opposing") {
    prompt = `Möchtest du die Gegenperspektive ${promptLabel} prüfen?`;
  } else if (perspective.relation === "affected_group") {
    prompt = `Soll die betroffene Gruppe ${promptLabel} als Sichtweise aufgenommen werden?`;
  } else if (perspective.relation === "institutional") {
    prompt = `Soll die institutionelle Sicht ${promptLabel} als Kontext ergänzt werden?`;
  } else if (perspective.relation === "expert") {
    prompt = `Soll die Expertenperspektive ${promptLabel} als Prüfspur markiert werden?`;
  } else if (perspective.relation === "adjacent") {
    prompt = `Möchtest du die angrenzende Perspektive ${promptLabel} mitdenken?`;
  } else if (perspective.relation === "supporting") {
    prompt = `Möchtest du die unterstützende Perspektive ${promptLabel} sichtbar machen?`;
  }

  if (perspective.isPresentedToUser) {
    prompt = `Wie möchtest du auf ${promptLabel} reagieren?`;
  }

  return {
    perspectiveId: perspective.id,
    label: perspective.label,
    relation: perspective.relation,
    prompt,
    optional: true,
  };
}

function buildHandoffBlockedReasons(
  outcome: DialogOutcome,
  target: DialogHandoffTarget,
): string[] {
  const reasons: string[] = [];

  if (isRejectedOutcome(outcome)) {
    reasons.push("result_rejected");
  }
  if (
    target !== "factcheck_request" &&
    target !== "editorial_review" &&
    !hasStandpointSummary(outcome)
  ) {
    reasons.push("recognized_standpoint_missing");
  }
  if (
    (target === "dossier_candidate" ||
      target === "anlassraum_candidate" ||
      target === "participation_space_candidate") &&
    !isStandpointConfirmed(outcome)
  ) {
    reasons.push("standpoint_confirmation_required");
  }
  if (
    (target === "dossier_candidate" ||
      target === "anlassraum_candidate" ||
      target === "participation_space_candidate") &&
    hasBlockingSourceClaim(outcome)
  ) {
    reasons.push("fact_claim_needs_source");
  }
  if (
    (target === "dossier_candidate" ||
      target === "anlassraum_candidate" ||
      target === "participation_space_candidate") &&
    !hasReviewableSubstance(outcome)
  ) {
    reasons.push("reviewable_substance_required");
  }
  if (
    (target === "dossier_candidate" || target === "anlassraum_candidate") &&
    outcome.engagementMode === "count_only"
  ) {
    reasons.push("count_only_mode_limits_handoff");
  }
  if (target === "anlassraum_candidate" && isCountOnlyOutcome(outcome)) {
    reasons.push("low_openness_limits_anlassraum");
  }
  if (
    target === "participation_space_candidate" &&
    isCountOnlyOutcome(outcome) &&
    outcome.engagementMode !== "prepare_dossier_or_space"
  ) {
    reasons.push("count_only_mode_limits_participation_space");
  }
  if (target === "factcheck_request" && !hasBlockingSourceClaim(outcome)) {
    reasons.push("no_factcheck_blocker");
  }
  if (
    target === "editorial_review" &&
    !hasStandpointSummary(outcome) &&
    outcome.arguments.length === 0 &&
    outcome.openQuestions.length === 0
  ) {
    reasons.push("nothing_to_review");
  }

  return unique(reasons);
}

function canPrepareParticipationSpaceCandidate(
  outcome: DialogOutcome,
): boolean {
  if (isRejectedOutcome(outcome)) return false;
  if (!isStandpointConfirmed(outcome)) return false;
  if (hasBlockingSourceClaim(outcome)) return false;
  if (!hasReviewableSubstance(outcome)) return false;
  if (
    isCountOnlyOutcome(outcome) &&
    outcome.engagementMode !== "prepare_dossier_or_space"
  ) {
    return false;
  }
  return true;
}

export function summarizeRecognizedStandpoint(
  outcome: DialogOutcome,
): string {
  const correction = normalizeText(outcome.recognizedStandpoint.userCorrection);
  if (outcome.recognizedStandpoint.confirmedByUser && correction) {
    return correction;
  }

  const summary = normalizeText(outcome.recognizedStandpoint.summary);
  if (summary) return summary;
  return correction;
}

export function getDialogNextQuestions(
  outcome: DialogOutcome,
): string[] {
  const questions: string[] = unique(outcome.openQuestions);

  if (!hasStandpointSummary(outcome)) {
    questions.push("Welcher Standpunkt soll aus deinem Beitrag erkennbar werden?");
  } else if (!outcome.recognizedStandpoint.confirmedByUser) {
    questions.push("Trifft der erkannte Standpunkt deinen Beitrag?");
  }

  if (canExploreDialog(outcome)) {
    questions.push("Welche Rückfrage sollte eDebatte als Nächstes stellen?");
    if (outcome.perspectives.some((perspective) => !perspective.userResponse)) {
      questions.push("Möchtest du eine Gegenperspektive oder betroffene Sichtweise prüfen?");
    }
    if (outcome.arguments.length === 0) {
      questions.push("Welcher Punkt sollte als nächstes genauer ausgearbeitet werden?");
    }
  }

  if (hasBlockingSourceClaim(outcome)) {
    questions.push("Welche überprüfbaren Quellen oder Belege fehlen noch?");
  }

  if (
    outcome.userOpenness === "high" &&
    getNewBranchSuggestions(outcome).length > 0
  ) {
    questions.push("Soll daraus ein neuer Zweig entstehen oder nur geparkt bleiben?");
  }

  return unique(questions);
}

export function getPerspectivePrompts(
  outcome: DialogOutcome,
): DialogPerspectivePrompt[] {
  if (!canExploreDialog(outcome)) return [];

  return outcome.perspectives
    .filter((perspective) => !perspective.userResponse)
    .map(buildPerspectivePrompt);
}

export function canCountOpinion(outcome: DialogOutcome): boolean {
  if (isRejectedOutcome(outcome)) return false;
  return hasStandpointSummary(outcome);
}

export function canPrepareDossierCandidate(
  outcome: DialogOutcome,
): boolean {
  if (isRejectedOutcome(outcome)) return false;
  if (!hasStandpointSummary(outcome)) return false;
  if (!isStandpointConfirmed(outcome)) return false;
  if (hasBlockingSourceClaim(outcome)) return false;
  if (!hasReviewableSubstance(outcome)) return false;
  if (outcome.engagementMode === "count_only") return false;
  return true;
}

export function canPrepareAnlassraumCandidate(
  outcome: DialogOutcome,
): boolean {
  if (!canPrepareDossierCandidate(outcome)) return false;
  if (isCountOnlyOutcome(outcome)) return false;

  return (
    outcome.engagementMode === "prepare_dossier_or_space" ||
    outcome.engagementMode === "co_create_argumentation" ||
    outcome.engagementMode === "explore_perspectives" ||
    outcome.perspectives.length > 0 ||
    outcome.branches.length > 0 ||
    unique(outcome.openQuestions).length > 0
  );
}

export function getDialogHandoffCandidates(
  outcome: DialogOutcome,
): DialogHandoffCandidate[] {
  return normalizeTargets(outcome.handoffTargets).map((target) => {
    let eligible = false;

    if (target === "count_opinion") {
      eligible = canCountOpinion(outcome);
    } else if (target === "dossier_candidate") {
      eligible = canPrepareDossierCandidate(outcome);
    } else if (target === "anlassraum_candidate") {
      eligible = canPrepareAnlassraumCandidate(outcome);
    } else if (target === "participation_space_candidate") {
      eligible = canPrepareParticipationSpaceCandidate(outcome);
    } else if (target === "editorial_review") {
      eligible =
        !isRejectedOutcome(outcome) &&
        (hasStandpointSummary(outcome) ||
          outcome.arguments.length > 0 ||
          unique(outcome.openQuestions).length > 0);
    } else if (target === "factcheck_request") {
      eligible = hasBlockingSourceClaim(outcome);
    }

    return {
      target,
      eligible,
      requiresReview: true,
      blockedReasons: buildHandoffBlockedReasons(outcome, target),
      autoCreate: false,
      autoPublish: false,
    };
  });
}

export function getNewBranchSuggestions(
  outcome: DialogOutcome,
): DialogBranch[] {
  return outcome.branches.filter(
    (branch) =>
      branch.status === "suggested" || branch.status === "parked",
  );
}
