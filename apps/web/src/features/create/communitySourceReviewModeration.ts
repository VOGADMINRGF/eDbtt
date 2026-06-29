export const COMMUNITY_SOURCE_REVIEW_MODERATION_STATUSES = [
  "pending_review",
  "needs_moderation",
  "allowed_as_hint",
  "hidden_pending_review",
  "rejected_abuse",
  "escalated_to_editorial",
] as const;

export type CommunitySourceReviewModerationStatus =
  (typeof COMMUNITY_SOURCE_REVIEW_MODERATION_STATUSES)[number];

export const COMMUNITY_SOURCE_REVIEW_TRUST_LEVELS = [
  "unknown",
  "new_contributor",
  "known_contributor",
  "trusted_contributor",
  "editorial_contributor",
] as const;

export type CommunitySourceReviewTrustLevel =
  (typeof COMMUNITY_SOURCE_REVIEW_TRUST_LEVELS)[number];

export const COMMUNITY_SOURCE_REVIEW_RISK_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type CommunitySourceReviewRiskLevel =
  (typeof COMMUNITY_SOURCE_REVIEW_RISK_LEVELS)[number];

export const COMMUNITY_SOURCE_REVIEW_ABUSE_REASONS = [
  "spam",
  "harassment",
  "duplicate",
  "coordinated_manipulation",
  "unverifiable_claim",
  "misleading_source",
  "personal_data",
  "off_topic",
  "unsafe_content",
] as const;

export type CommunitySourceReviewAbuseReason =
  (typeof COMMUNITY_SOURCE_REVIEW_ABUSE_REASONS)[number];

export const COMMUNITY_SOURCE_REVIEW_MODERATION_BLOCKERS = [
  "abuse_spam",
  "abuse_harassment",
  "abuse_duplicate",
  "abuse_coordinated_manipulation",
  "abuse_unverifiable_claim",
  "abuse_misleading_source",
  "abuse_personal_data",
  "abuse_off_topic",
  "abuse_unsafe_content",
  "hidden_pending_review",
  "rejected_abuse",
  "public_exposure_requires_moderation_safe_status",
] as const;

export type CommunitySourceReviewModerationBlocker =
  (typeof COMMUNITY_SOURCE_REVIEW_MODERATION_BLOCKERS)[number];

export type CommunitySourceReviewGuardrailFlags = {
  verifiesClaim: boolean;
  marksSourceConfirmed: boolean;
  requestsPublish: boolean;
  requestsAutoMerge: boolean;
  requestsRuntimeEntity: boolean;
  usesMajorityAsTruth: boolean;
};

export type CommunitySourceReviewModerationInput = {
  moderationStatus?: CommunitySourceReviewModerationStatus;
  trustLevel?: CommunitySourceReviewTrustLevel;
  riskLevel?: CommunitySourceReviewRiskLevel;
  abuseReasons?: readonly CommunitySourceReviewAbuseReason[];
};

export type CommunitySourceReviewModerationAssessmentInput = {
  kind:
    | "source_suggestion"
    | "counter_source"
    | "context_note"
    | "lived_experience"
    | "unclear_claim"
    | "wording_clarification"
    | "escalation_request";
  target:
    | "claim"
    | "factcheck_request"
    | "source_question"
    | "handoff_review_item";
  relatedContributionCount: number;
  sourceRefCount: number;
  moderationFlags: CommunitySourceReviewGuardrailFlags;
  moderation?: CommunitySourceReviewModerationInput | null;
};

export type CommunitySourceReviewModerationSignal = {
  moderationStatus: CommunitySourceReviewModerationStatus;
  trustLevel: CommunitySourceReviewTrustLevel;
  riskLevel: CommunitySourceReviewRiskLevel;
  abuseReasons: CommunitySourceReviewAbuseReason[];
  requiresHumanModeration: boolean;
  canExposePublicly: boolean;
  canEscalateToEditorial: boolean;
  reviewPriority: "standard" | "prioritized";
  guardrails: {
    trustDoesNotVerifyTruth: true;
    volumeDoesNotVerifyTruth: true;
    acceptedHintIsNotFact: true;
    sourceSuggestionIsNotConfirmedSource: true;
    counterSourceIsNotAutomaticDisproof: true;
    livedExperienceIsNotRepresentativeEvidence: true;
    hiddenOrRejectedNotEvidence: true;
  };
  summary: string;
};

function uniqueReasons(
  reasons: readonly CommunitySourceReviewAbuseReason[],
): CommunitySourceReviewAbuseReason[] {
  return Array.from(new Set(reasons));
}

function hasReason(
  reasons: readonly CommunitySourceReviewAbuseReason[],
  reason: CommunitySourceReviewAbuseReason,
): boolean {
  return reasons.includes(reason);
}

function deriveRiskLevel(
  input: CommunitySourceReviewModerationAssessmentInput,
  reasons: readonly CommunitySourceReviewAbuseReason[],
): CommunitySourceReviewRiskLevel {
  if (input.moderation?.riskLevel) return input.moderation.riskLevel;

  if (
    hasReason(reasons, "personal_data") ||
    hasReason(reasons, "harassment") ||
    hasReason(reasons, "unsafe_content") ||
    hasReason(reasons, "coordinated_manipulation")
  ) {
    return "critical";
  }

  if (
    hasReason(reasons, "spam") ||
    hasReason(reasons, "misleading_source") ||
    hasReason(reasons, "off_topic") ||
    input.moderationFlags.verifiesClaim ||
    input.moderationFlags.marksSourceConfirmed ||
    input.moderationFlags.requestsPublish ||
    input.moderationFlags.requestsAutoMerge ||
    input.moderationFlags.requestsRuntimeEntity ||
    input.moderationFlags.usesMajorityAsTruth
  ) {
    return "high";
  }

  if (
    hasReason(reasons, "duplicate") ||
    hasReason(reasons, "unverifiable_claim") ||
    input.kind === "lived_experience" ||
    input.kind === "counter_source" ||
    input.kind === "escalation_request" ||
    input.relatedContributionCount >= 8
  ) {
    return "medium";
  }

  return "low";
}

function deriveModerationStatus(
  input: CommunitySourceReviewModerationAssessmentInput,
  reasons: readonly CommunitySourceReviewAbuseReason[],
  riskLevel: CommunitySourceReviewRiskLevel,
): CommunitySourceReviewModerationStatus {
  if (input.moderation?.moderationStatus) {
    return input.moderation.moderationStatus;
  }

  if (
    hasReason(reasons, "personal_data") ||
    hasReason(reasons, "harassment") ||
    hasReason(reasons, "unsafe_content")
  ) {
    return "hidden_pending_review";
  }

  if (
    hasReason(reasons, "spam") ||
    hasReason(reasons, "coordinated_manipulation")
  ) {
    return "rejected_abuse";
  }

  if (
    hasReason(reasons, "duplicate") ||
    hasReason(reasons, "off_topic") ||
    hasReason(reasons, "misleading_source") ||
    hasReason(reasons, "unverifiable_claim") ||
    riskLevel === "high"
  ) {
    return "needs_moderation";
  }

  return "pending_review";
}

function deriveTrustLevel(
  input: CommunitySourceReviewModerationAssessmentInput,
): CommunitySourceReviewTrustLevel {
  return input.moderation?.trustLevel ?? "unknown";
}

function hasBlockingAbuseReason(
  reasons: readonly CommunitySourceReviewAbuseReason[],
): boolean {
  return reasons.some((reason) =>
    reason !== "unverifiable_claim",
  );
}

export function canExposeCommunityContributionPublicly(
  signal: CommunitySourceReviewModerationSignal,
): boolean {
  return (
    signal.moderationStatus === "allowed_as_hint" &&
    signal.abuseReasons.length === 0 &&
    (signal.riskLevel === "low" || signal.riskLevel === "medium")
  );
}

export function canEscalateCommunityContributionToEditorial(
  signal: CommunitySourceReviewModerationSignal,
): boolean {
  if (signal.moderationStatus === "rejected_abuse") return false;
  if (signal.moderationStatus === "escalated_to_editorial") return true;
  if (signal.abuseReasons.includes("misleading_source")) return true;
  if (signal.abuseReasons.includes("unverifiable_claim")) return true;
  if (signal.abuseReasons.includes("coordinated_manipulation")) return true;
  return signal.riskLevel === "high" || signal.riskLevel === "critical";
}

export function shouldRequireHumanModeration(
  signal: CommunitySourceReviewModerationSignal,
): boolean {
  return signal.moderationStatus !== "allowed_as_hint";
}

export function summarizeCommunityContributionModerationState(
  signal: CommunitySourceReviewModerationSignal,
): string {
  if (signal.moderationStatus === "rejected_abuse") {
    return "Hinweis bleibt blockiert. Missbrauch oder manipulative Einspeisung erzeugen keinen prüfbaren Beitrag.";
  }
  if (signal.moderationStatus === "hidden_pending_review") {
    return "Hinweis bleibt bis zur Moderationsprüfung verborgen. Sichtbarkeit und Evidenzzählung sind gesperrt.";
  }
  if (signal.moderationStatus === "allowed_as_hint") {
    return "Hinweis darf nach Moderation als Hinweis sichtbar werden, aber nicht als bestätigte Wahrheit oder verifizierte Quelle.";
  }
  if (signal.moderationStatus === "needs_moderation") {
    return "Hinweis braucht Moderation, bevor er als prüfbarer Beitrag sichtbar werden kann.";
  }
  if (signal.moderationStatus === "escalated_to_editorial") {
    return "Hinweis wird redaktionell eskaliert. Trust oder Menge ersetzen keine Wahrheitsprüfung.";
  }
  return "Hinweis bleibt review-first. Trust priorisiert höchstens Review und bestätigt keine Wahrheit.";
}

export function getCommunitySourceReviewModerationBlockers(
  signal: CommunitySourceReviewModerationSignal,
): CommunitySourceReviewModerationBlocker[] {
  const blockers: CommunitySourceReviewModerationBlocker[] = [];

  for (const reason of signal.abuseReasons) {
    if (reason === "spam") blockers.push("abuse_spam");
    if (reason === "harassment") blockers.push("abuse_harassment");
    if (reason === "duplicate") blockers.push("abuse_duplicate");
    if (reason === "coordinated_manipulation") {
      blockers.push("abuse_coordinated_manipulation");
    }
    if (reason === "unverifiable_claim") {
      blockers.push("abuse_unverifiable_claim");
    }
    if (reason === "misleading_source") {
      blockers.push("abuse_misleading_source");
    }
    if (reason === "personal_data") blockers.push("abuse_personal_data");
    if (reason === "off_topic") blockers.push("abuse_off_topic");
    if (reason === "unsafe_content") blockers.push("abuse_unsafe_content");
  }

  if (signal.moderationStatus === "hidden_pending_review") {
    blockers.push("hidden_pending_review");
  }
  if (signal.moderationStatus === "rejected_abuse") {
    blockers.push("rejected_abuse");
  }
  if (!signal.canExposePublicly) {
    blockers.push("public_exposure_requires_moderation_safe_status");
  }

  return blockers;
}

export function assessCommunitySourceReviewContributionRisk(
  input: CommunitySourceReviewModerationAssessmentInput,
): CommunitySourceReviewModerationSignal {
  const abuseReasons = uniqueReasons(input.moderation?.abuseReasons ?? []);
  const trustLevel = deriveTrustLevel(input);
  const riskLevel = deriveRiskLevel(input, abuseReasons);
  const moderationStatus = deriveModerationStatus(input, abuseReasons, riskLevel);

  const provisionalSignal: CommunitySourceReviewModerationSignal = {
    moderationStatus,
    trustLevel,
    riskLevel,
    abuseReasons,
    requiresHumanModeration: moderationStatus !== "allowed_as_hint",
    canExposePublicly: false,
    canEscalateToEditorial: false,
    reviewPriority:
      trustLevel === "trusted_contributor" || trustLevel === "editorial_contributor"
        ? "prioritized"
        : "standard",
    guardrails: {
      trustDoesNotVerifyTruth: true,
      volumeDoesNotVerifyTruth: true,
      acceptedHintIsNotFact: true,
      sourceSuggestionIsNotConfirmedSource: true,
      counterSourceIsNotAutomaticDisproof: true,
      livedExperienceIsNotRepresentativeEvidence: true,
      hiddenOrRejectedNotEvidence: true,
    },
    summary: "",
  };

  const signal: CommunitySourceReviewModerationSignal = {
    ...provisionalSignal,
    canExposePublicly: canExposeCommunityContributionPublicly(provisionalSignal),
    canEscalateToEditorial: canEscalateCommunityContributionToEditorial(provisionalSignal),
  };

  return {
    ...signal,
    requiresHumanModeration: shouldRequireHumanModeration(signal) || hasBlockingAbuseReason(abuseReasons),
    summary: summarizeCommunityContributionModerationState(signal),
  };
}
