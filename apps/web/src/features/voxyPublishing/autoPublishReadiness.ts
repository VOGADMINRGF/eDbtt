export const VOXY_AUTO_PUBLISH_READINESS_POLICY = {
  schemaVersion: "voxy_auto_publish_readiness.v1",
  mode: "manual_review_with_shadow_decision",
  plannedShadowStartAt: "2026-08-21T11:00:00+02:00",
  reviewWindowDays: 30,
  humanReviewRequired: true,
  autoPublishExecutionAllowed: false,
  autoActivationAllowed: false,
  politicalViewpointScoringAllowed: false,
  qualityModerationOnly: true,
} as const;

export const VOXY_AUTO_PUBLISH_ALLOWLIST_CLASSES = [
  "project_update",
  "published_result",
  "event_status",
  "approved_translation",
  "recurring_fact_update",
] as const;

export const VOXY_AUTO_PUBLISH_SENSITIVE_CLASSES = [
  "public_policy_analysis",
  "breaking_news",
  "unconfirmed_allegation",
  "election",
  "legal",
  "health",
  "conflict",
  "personal_data",
] as const;

export type VoxyAutoPublishAllowlistClass =
  (typeof VOXY_AUTO_PUBLISH_ALLOWLIST_CLASSES)[number];
export type VoxyAutoPublishSensitiveClass =
  (typeof VOXY_AUTO_PUBLISH_SENSITIVE_CLASSES)[number];
export type VoxyAutoPublishContentClass =
  | VoxyAutoPublishAllowlistClass
  | VoxyAutoPublishSensitiveClass
  | "other";

export const VOXY_AUTO_PUBLISH_BLOCKERS = [
  "shadow_not_started",
  "content_class_not_allowlisted",
  "sensitive_content_class",
  "language_not_allowlisted",
  "channel_not_allowlisted",
  "source_coverage_not_verified",
  "factuality_not_verified",
  "translation_unreviewed",
  "translation_inconsistent",
  "policy_flag_present",
  "technical_validation_failed",
  "generator_version_missing",
  "reviewer_version_missing",
  "prompt_version_missing",
  "review_service_unavailable",
  "generator_reviewer_not_independent",
  "kill_switch_unavailable",
  "rollback_unavailable",
  "idempotency_unverified",
  "human_review_unavailable",
] as const;

export type VoxyAutoPublishBlocker =
  (typeof VOXY_AUTO_PUBLISH_BLOCKERS)[number];

export type VoxyHumanDecision =
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";

export type VoxyHumanCorrectionCategory =
  | "facts"
  | "sources"
  | "language"
  | "translation"
  | "pronunciation"
  | "legal"
  | "privacy"
  | "format"
  | "other";

export type VoxyTechnicalValidation = {
  renderComplete: boolean;
  fileIntegrity: boolean;
  captionsValid: boolean;
  brandingValid: boolean;
  accessibilityValid: boolean;
  formatValid: boolean;
};

export type VoxyAutoPublishCandidate = {
  contentId: string;
  contentClass: VoxyAutoPublishContentClass;
  language: string;
  channel: string;
  allowedLanguages: readonly string[];
  allowedChannels: readonly string[];
  sourceCoverage: "none" | "partial" | "verified";
  factualityStatus: "unverified" | "contested" | "verified";
  translationConsistency:
    | "not_applicable"
    | "unreviewed"
    | "consistent"
    | "inconsistent";
  policyFlags: readonly string[];
  technicalValidation: VoxyTechnicalValidation;
  generatorModelVersion: string | null;
  reviewModelVersion: string | null;
  promptVersion: string | null;
  reviewServiceAvailable: boolean;
  generatorAndReviewerIndependent: boolean;
  killSwitchAvailable: boolean;
  rollbackAvailable: boolean;
  idempotencyVerified: boolean;
  humanReviewAvailable: boolean;
  shadowStartedAt: string | null;
  humanDecision?: VoxyHumanDecision;
  humanCorrections?: readonly VoxyHumanCorrectionCategory[];
};

export type VoxyAutoPublishEvaluation = {
  schemaVersion: "voxy_auto_publish_evaluation.v1";
  contentId: string;
  contentClass: VoxyAutoPublishContentClass;
  language: string;
  channel: string;
  qualityStatus: "passed" | "failed";
  riskLevel: "green" | "yellow" | "red";
  blockers: VoxyAutoPublishBlocker[];
  autoPublishEligible: boolean;
  shadowDecision: "would_publish" | "would_hold" | "would_block";
  humanReviewRequired: true;
  autoPublishExecutionAllowed: false;
  humanDecision: VoxyHumanDecision;
  humanCorrections: VoxyHumanCorrectionCategory[];
  shadowStartedAt: string | null;
  reviewDueAt: string | null;
  rollbackAvailable: boolean;
  generatorModelVersion: string | null;
  reviewModelVersion: string | null;
  promptVersion: string | null;
};

export type VoxyShadowEvidenceRecord = VoxyAutoPublishEvaluation & {
  reviewedAt: string;
  technicalFailure: boolean;
};

export type VoxyShadowEvidenceSummary = {
  totalRecords: number;
  totalHumanReviewed: number;
  wouldPublishCount: number;
  humanApprovedCount: number;
  agreementCount: number;
  agreementRate: number | null;
  criticalMissCount: number;
  overblockCount: number;
  technicalFailureCount: number;
  technicalFailureRate: number | null;
  languagesCovered: string[];
  channelsCovered: string[];
  contentClassesCovered: VoxyAutoPublishContentClass[];
  correctionsByCategory: Record<VoxyHumanCorrectionCategory, number>;
};

export type VoxyShadowActivationThresholds = {
  minimumReviewedSamples: number;
  maximumCriticalMisses: number;
  minimumAgreementRate: number;
  maximumTechnicalFailureRate: number;
  requiredLanguages: readonly string[];
};

export type VoxyShadowReadinessAssessment = {
  status:
    | "review_window_not_complete"
    | "continue_shadow"
    | "no_go"
    | "eligible_for_human_allowlist_decision";
  blockers: string[];
  autoActivationAllowed: false;
  globalAutoPublishAllowed: false;
};

const ALLOWLIST_CLASS_SET = new Set<string>(
  VOXY_AUTO_PUBLISH_ALLOWLIST_CLASSES,
);
const SENSITIVE_CLASS_SET = new Set<string>(
  VOXY_AUTO_PUBLISH_SENSITIVE_CLASSES,
);

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function unique<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function isValidDate(value: string) {
  return Number.isFinite(new Date(value).getTime());
}

export function calculateVoxyShadowReviewDueAt(
  shadowStartedAt: string,
  reviewWindowDays = VOXY_AUTO_PUBLISH_READINESS_POLICY.reviewWindowDays,
) {
  if (!isValidDate(shadowStartedAt)) {
    throw new Error("invalid_shadow_started_at");
  }
  if (!Number.isInteger(reviewWindowDays) || reviewWindowDays <= 0) {
    throw new Error("invalid_review_window_days");
  }

  const dueAt = new Date(shadowStartedAt);
  dueAt.setUTCDate(dueAt.getUTCDate() + reviewWindowDays);
  return dueAt.toISOString();
}

function technicalValidationPassed(validation: VoxyTechnicalValidation) {
  return Object.values(validation).every((value) => value === true);
}

function isRedBlocker(blocker: VoxyAutoPublishBlocker) {
  return [
    "sensitive_content_class",
    "source_coverage_not_verified",
    "factuality_not_verified",
    "translation_inconsistent",
    "policy_flag_present",
    "kill_switch_unavailable",
    "rollback_unavailable",
  ].includes(blocker);
}

export function evaluateVoxyAutoPublishCandidate(
  candidate: VoxyAutoPublishCandidate,
): VoxyAutoPublishEvaluation {
  const blockers: VoxyAutoPublishBlocker[] = [];

  if (!candidate.shadowStartedAt || !isValidDate(candidate.shadowStartedAt)) {
    blockers.push("shadow_not_started");
  }

  if (SENSITIVE_CLASS_SET.has(candidate.contentClass)) {
    blockers.push("sensitive_content_class");
  }
  if (!ALLOWLIST_CLASS_SET.has(candidate.contentClass)) {
    blockers.push("content_class_not_allowlisted");
  }

  if (!candidate.allowedLanguages.includes(candidate.language)) {
    blockers.push("language_not_allowlisted");
  }
  if (!candidate.allowedChannels.includes(candidate.channel)) {
    blockers.push("channel_not_allowlisted");
  }
  if (candidate.sourceCoverage !== "verified") {
    blockers.push("source_coverage_not_verified");
  }
  if (candidate.factualityStatus !== "verified") {
    blockers.push("factuality_not_verified");
  }
  if (candidate.translationConsistency === "unreviewed") {
    blockers.push("translation_unreviewed");
  }
  if (candidate.translationConsistency === "inconsistent") {
    blockers.push("translation_inconsistent");
  }
  if (candidate.policyFlags.length > 0) {
    blockers.push("policy_flag_present");
  }
  if (!technicalValidationPassed(candidate.technicalValidation)) {
    blockers.push("technical_validation_failed");
  }
  if (!hasText(candidate.generatorModelVersion)) {
    blockers.push("generator_version_missing");
  }
  if (!hasText(candidate.reviewModelVersion)) {
    blockers.push("reviewer_version_missing");
  }
  if (!hasText(candidate.promptVersion)) {
    blockers.push("prompt_version_missing");
  }
  if (!candidate.reviewServiceAvailable) {
    blockers.push("review_service_unavailable");
  }
  if (!candidate.generatorAndReviewerIndependent) {
    blockers.push("generator_reviewer_not_independent");
  }
  if (!candidate.killSwitchAvailable) {
    blockers.push("kill_switch_unavailable");
  }
  if (!candidate.rollbackAvailable) {
    blockers.push("rollback_unavailable");
  }
  if (!candidate.idempotencyVerified) {
    blockers.push("idempotency_unverified");
  }
  if (!candidate.humanReviewAvailable) {
    blockers.push("human_review_unavailable");
  }

  const uniqueBlockers = unique(blockers);
  const autoPublishEligible = uniqueBlockers.length === 0;
  const hasRedBlocker = uniqueBlockers.some(isRedBlocker);
  const shadowDecision = autoPublishEligible
    ? "would_publish"
    : hasRedBlocker
      ? "would_block"
      : "would_hold";

  return {
    schemaVersion: "voxy_auto_publish_evaluation.v1",
    contentId: candidate.contentId,
    contentClass: candidate.contentClass,
    language: candidate.language,
    channel: candidate.channel,
    qualityStatus: autoPublishEligible ? "passed" : "failed",
    riskLevel: autoPublishEligible ? "green" : hasRedBlocker ? "red" : "yellow",
    blockers: uniqueBlockers,
    autoPublishEligible,
    shadowDecision,
    humanReviewRequired: true,
    autoPublishExecutionAllowed: false,
    humanDecision: candidate.humanDecision ?? "pending",
    humanCorrections: unique(candidate.humanCorrections ?? []),
    shadowStartedAt: candidate.shadowStartedAt,
    reviewDueAt:
      candidate.shadowStartedAt && isValidDate(candidate.shadowStartedAt)
        ? calculateVoxyShadowReviewDueAt(candidate.shadowStartedAt)
        : null,
    rollbackAvailable: candidate.rollbackAvailable,
    generatorModelVersion: candidate.generatorModelVersion,
    reviewModelVersion: candidate.reviewModelVersion,
    promptVersion: candidate.promptVersion,
  };
}

const CORRECTION_CATEGORIES: readonly VoxyHumanCorrectionCategory[] = [
  "facts",
  "sources",
  "language",
  "translation",
  "pronunciation",
  "legal",
  "privacy",
  "format",
  "other",
];

export function summarizeVoxyShadowEvidence(
  records: readonly VoxyShadowEvidenceRecord[],
): VoxyShadowEvidenceSummary {
  const reviewed = records.filter((record) => record.humanDecision !== "pending");
  const wouldPublish = records.filter(
    (record) => record.shadowDecision === "would_publish",
  );
  const approved = reviewed.filter(
    (record) => record.humanDecision === "approved",
  );
  const agreements = reviewed.filter((record) => {
    const shadowAllows = record.shadowDecision === "would_publish";
    const humanAllows = record.humanDecision === "approved";
    return shadowAllows === humanAllows;
  });
  const criticalMisses = reviewed.filter(
    (record) =>
      record.shadowDecision === "would_publish" &&
      record.humanDecision !== "approved",
  );
  const overblocks = reviewed.filter(
    (record) =>
      record.shadowDecision !== "would_publish" &&
      record.humanDecision === "approved",
  );
  const technicalFailures = records.filter((record) => record.technicalFailure);

  const correctionsByCategory = Object.fromEntries(
    CORRECTION_CATEGORIES.map((category) => [category, 0]),
  ) as Record<VoxyHumanCorrectionCategory, number>;
  for (const record of records) {
    for (const category of unique(record.humanCorrections)) {
      correctionsByCategory[category] += 1;
    }
  }

  return {
    totalRecords: records.length,
    totalHumanReviewed: reviewed.length,
    wouldPublishCount: wouldPublish.length,
    humanApprovedCount: approved.length,
    agreementCount: agreements.length,
    agreementRate:
      reviewed.length > 0 ? agreements.length / reviewed.length : null,
    criticalMissCount: criticalMisses.length,
    overblockCount: overblocks.length,
    technicalFailureCount: technicalFailures.length,
    technicalFailureRate:
      records.length > 0 ? technicalFailures.length / records.length : null,
    languagesCovered: unique(records.map((record) => record.language)).sort(),
    channelsCovered: unique(records.map((record) => record.channel)).sort(),
    contentClassesCovered: unique(
      records.map((record) => record.contentClass),
    ).sort(),
    correctionsByCategory,
  };
}

export function assessVoxyShadowReadiness(input: {
  shadowStartedAt: string;
  now: string;
  summary: VoxyShadowEvidenceSummary;
  thresholds: VoxyShadowActivationThresholds;
}): VoxyShadowReadinessAssessment {
  if (!isValidDate(input.shadowStartedAt) || !isValidDate(input.now)) {
    throw new Error("invalid_shadow_readiness_date");
  }

  const reviewDueAt = calculateVoxyShadowReviewDueAt(input.shadowStartedAt);
  if (new Date(input.now).getTime() < new Date(reviewDueAt).getTime()) {
    return {
      status: "review_window_not_complete",
      blockers: ["review_window_not_complete"],
      autoActivationAllowed: false,
      globalAutoPublishAllowed: false,
    };
  }

  const blockers: string[] = [];
  if (
    input.summary.totalHumanReviewed < input.thresholds.minimumReviewedSamples
  ) {
    blockers.push("insufficient_sample_size");
  }
  if (
    input.summary.criticalMissCount > input.thresholds.maximumCriticalMisses
  ) {
    blockers.push("critical_miss_limit_exceeded");
  }
  if (
    input.summary.agreementRate === null ||
    input.summary.agreementRate < input.thresholds.minimumAgreementRate
  ) {
    blockers.push("agreement_rate_below_threshold");
  }
  if (
    input.summary.technicalFailureRate === null ||
    input.summary.technicalFailureRate >
      input.thresholds.maximumTechnicalFailureRate
  ) {
    blockers.push("technical_failure_rate_above_threshold");
  }

  const coveredLanguages = new Set(input.summary.languagesCovered);
  const missingLanguages = input.thresholds.requiredLanguages.filter(
    (language) => !coveredLanguages.has(language),
  );
  if (missingLanguages.length > 0) {
    blockers.push(`required_languages_missing:${missingLanguages.join(",")}`);
  }

  const hasCriticalFailure = blockers.some(
    (blocker) =>
      blocker === "critical_miss_limit_exceeded" ||
      blocker === "technical_failure_rate_above_threshold",
  );

  return {
    status:
      blockers.length === 0
        ? "eligible_for_human_allowlist_decision"
        : hasCriticalFailure
          ? "no_go"
          : "continue_shadow",
    blockers,
    autoActivationAllowed: false,
    globalAutoPublishAllowed: false,
  };
}
