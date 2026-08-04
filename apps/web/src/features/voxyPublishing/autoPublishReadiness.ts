export const VOXY_AUTO_PUBLISH_READINESS_POLICY = {
  schemaVersion: "voxy_auto_publish_readiness.v2",
  mode: "manual_review_with_shadow_decision",
  plannedShadowStartAt: "2026-08-21T11:00:00+02:00",
  reviewWindowDays: 30,
  operationalEvidenceMaxAgeDays: 30,
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

export type VoxyAutoPublishPolicySnapshot = {
  schemaVersion: "voxy_auto_publish_policy_snapshot.v1";
  policySnapshotId: string;
  policyVersion: string;
  approvalStatus: "prepared" | "approved" | "revoked";
  approvedBy: string | null;
  approvedAt: string | null;
  validFrom: string;
  validUntil: string | null;
  timeZone: string;
  allowedLanguages: readonly string[];
  allowedChannels: readonly string[];
  allowedContentClasses: readonly VoxyAutoPublishAllowlistClass[];
};

export const VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT: VoxyAutoPublishPolicySnapshot =
  {
    schemaVersion: "voxy_auto_publish_policy_snapshot.v1",
    policySnapshotId: "voxy-shadow-policy-2026-08-21-prepared",
    policyVersion: "1.0.0",
    approvalStatus: "prepared",
    approvedBy: null,
    approvedAt: null,
    validFrom: "2026-08-21T11:00:00+02:00",
    validUntil: null,
    timeZone: "Europe/Berlin",
    allowedLanguages: ["de", "en"],
    allowedChannels: ["website", "linkedin"],
    allowedContentClasses: VOXY_AUTO_PUBLISH_ALLOWLIST_CLASSES,
  };

export const VOXY_AUTO_PUBLISH_BLOCKERS = [
  "evaluation_timestamp_invalid",
  "policy_snapshot_mismatch",
  "policy_snapshot_not_approved",
  "policy_snapshot_not_effective",
  "shadow_not_started",
  "shadow_start_in_future",
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
  "content_revision_hash_missing",
  "generator_version_missing",
  "reviewer_version_missing",
  "prompt_version_missing",
  "generator_principal_missing",
  "reviewer_principal_missing",
  "generator_reviewer_not_independent",
  "review_service_unavailable",
  "kill_switch_probe_invalid",
  "rollback_drill_invalid",
  "idempotency_key_missing",
  "review_queue_unavailable",
] as const;

export type VoxyAutoPublishBlocker =
  (typeof VOXY_AUTO_PUBLISH_BLOCKERS)[number];

export type VoxyHumanDecision =
  | "pending"
  | "approved_as_is"
  | "approved_after_changes"
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

export type VoxyOperationalEvidence = {
  evidenceId: string;
  testedAt: string;
  passed: boolean;
};

export type VoxyAutoPublishCandidate = {
  evaluationId: string;
  contentId: string;
  contentRevisionId: string;
  contentRevisionHash: string;
  policySnapshotId: string;
  contentClass: VoxyAutoPublishContentClass;
  language: string;
  channel: string;
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
  generatorPrincipalId: string | null;
  reviewerPrincipalId: string | null;
  reviewServiceAvailable: boolean;
  killSwitchProbe: VoxyOperationalEvidence | null;
  rollbackDrill: VoxyOperationalEvidence | null;
  idempotencyKey: string | null;
  reviewQueueStatus: "available" | "degraded" | "unavailable";
  shadowStartedAt: string | null;
  evaluatedAt: string;
};

export type VoxyAutoPublishEvaluation = {
  schemaVersion: "voxy_auto_publish_evaluation.v2";
  evaluationId: string;
  contentId: string;
  contentRevisionId: string;
  contentRevisionHash: string;
  policySnapshotId: string;
  policyVersion: string;
  contentClass: VoxyAutoPublishContentClass;
  language: string;
  channel: string;
  evaluatedAt: string;
  qualityStatus: "passed" | "failed";
  riskLevel: "green" | "yellow" | "red";
  blockers: VoxyAutoPublishBlocker[];
  autoPublishEligible: boolean;
  shadowDecision: "would_publish" | "would_hold" | "would_block";
  humanReviewRequired: true;
  autoPublishExecutionAllowed: false;
  shadowStartedAt: string | null;
  reviewDueAt: string | null;
  generatorPrincipalId: string | null;
  reviewerPrincipalId: string | null;
  killSwitchEvidenceId: string | null;
  rollbackEvidenceId: string | null;
  idempotencyKey: string | null;
  generatorModelVersion: string | null;
  reviewModelVersion: string | null;
  promptVersion: string | null;
};

export type VoxyShadowEvidenceRecord = VoxyAutoPublishEvaluation & {
  reviewedAt: string;
  humanDecision: VoxyHumanDecision;
  humanCorrections: readonly VoxyHumanCorrectionCategory[];
  humanApprovedRevisionHash: string | null;
  technicalFailure: boolean;
};

export type VoxyEvidenceSegmentSummary = {
  totalRecords: number;
  totalHumanReviewed: number;
  agreementCount: number;
  agreementRate: number | null;
  criticalMissCount: number;
  technicalFailureCount: number;
  technicalFailureRate: number | null;
};

export type VoxyShadowEvidenceSummary = {
  totalRecords: number;
  uniqueRecordCount: number;
  duplicateRecordCount: number;
  totalHumanReviewed: number;
  wouldPublishCount: number;
  approvedAsIsCount: number;
  approvedAfterChangesCount: number;
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
  segments: {
    languages: Record<string, VoxyEvidenceSegmentSummary>;
    channels: Record<string, VoxyEvidenceSegmentSummary>;
    contentClasses: Record<string, VoxyEvidenceSegmentSummary>;
  };
};

export type VoxyShadowActivationThresholds = {
  minimumReviewedSamples: number;
  minimumReviewedSamplesPerLanguage: number;
  minimumReviewedSamplesPerChannel: number;
  minimumReviewedSamplesPerContentClass: number;
  maximumCriticalMisses: number;
  minimumAgreementRate: number;
  maximumTechnicalFailureRate: number;
  requiredLanguages: readonly string[];
  requiredChannels: readonly string[];
  requiredContentClasses: readonly VoxyAutoPublishContentClass[];
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

type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const SENSITIVE_CLASS_SET = new Set<string>(
  VOXY_AUTO_PUBLISH_SENSITIVE_CLASSES,
);
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_TIME_FORMATTERS = new Map<string, Intl.DateTimeFormat>();
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

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function unique<T>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function isValidDate(value: string | null | undefined) {
  return Boolean(value) && Number.isFinite(new Date(value as string).getTime());
}

function getDateTimeFormatter(timeZone: string) {
  const cached = DATE_TIME_FORMATTERS.get(timeZone);
  if (cached) return cached;

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    DATE_TIME_FORMATTERS.set(timeZone, formatter);
    return formatter;
  } catch {
    throw new Error("invalid_shadow_timezone");
  }
}

function getZonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const values = Object.fromEntries(
    getDateTimeFormatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function zonedPartsToUtc(parts: ZonedDateTimeParts, timeZone: string) {
  const targetWallClockMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let candidateMs = targetWallClockMs;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const represented = getZonedDateTimeParts(new Date(candidateMs), timeZone);
    const representedWallClockMs = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute,
      represented.second,
    );
    const correction = targetWallClockMs - representedWallClockMs;
    candidateMs += correction;
    if (correction === 0) break;
  }

  return new Date(candidateMs);
}

export function calculateVoxyShadowReviewDueAt(
  shadowStartedAt: string,
  reviewWindowDays = VOXY_AUTO_PUBLISH_READINESS_POLICY.reviewWindowDays,
  timeZone = VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT.timeZone,
) {
  if (!isValidDate(shadowStartedAt)) {
    throw new Error("invalid_shadow_started_at");
  }
  if (!Number.isInteger(reviewWindowDays) || reviewWindowDays <= 0) {
    throw new Error("invalid_review_window_days");
  }

  const localStart = getZonedDateTimeParts(new Date(shadowStartedAt), timeZone);
  const shiftedCalendar = new Date(
    Date.UTC(
      localStart.year,
      localStart.month - 1,
      localStart.day + reviewWindowDays,
      localStart.hour,
      localStart.minute,
      localStart.second,
    ),
  );
  const targetLocalParts: ZonedDateTimeParts = {
    year: shiftedCalendar.getUTCFullYear(),
    month: shiftedCalendar.getUTCMonth() + 1,
    day: shiftedCalendar.getUTCDate(),
    hour: shiftedCalendar.getUTCHours(),
    minute: shiftedCalendar.getUTCMinutes(),
    second: shiftedCalendar.getUTCSeconds(),
  };

  return zonedPartsToUtc(targetLocalParts, timeZone).toISOString();
}

function technicalValidationPassed(validation: VoxyTechnicalValidation) {
  return Object.values(validation).every((value) => value === true);
}

function operationalEvidenceValid(
  evidence: VoxyOperationalEvidence | null,
  evaluatedAt: string,
) {
  if (
    !evidence ||
    !hasText(evidence.evidenceId) ||
    !evidence.passed ||
    !isValidDate(evidence.testedAt) ||
    !isValidDate(evaluatedAt)
  ) {
    return false;
  }

  const evidenceAt = new Date(evidence.testedAt).getTime();
  const evaluationAt = new Date(evaluatedAt).getTime();
  const maximumAge =
    VOXY_AUTO_PUBLISH_READINESS_POLICY.operationalEvidenceMaxAgeDays *
    MILLISECONDS_PER_DAY;

  return evidenceAt <= evaluationAt && evaluationAt - evidenceAt <= maximumAge;
}

function policySnapshotEffective(
  snapshot: VoxyAutoPublishPolicySnapshot,
  evaluatedAt: string,
) {
  if (
    snapshot.approvalStatus !== "approved" ||
    !hasText(snapshot.approvedBy) ||
    !isValidDate(snapshot.approvedAt) ||
    !isValidDate(snapshot.validFrom) ||
    !isValidDate(evaluatedAt)
  ) {
    return false;
  }

  const evaluatedAtMs = new Date(evaluatedAt).getTime();
  const approvedAtMs = new Date(snapshot.approvedAt as string).getTime();
  const validFromMs = new Date(snapshot.validFrom).getTime();
  const validUntilMs = snapshot.validUntil
    ? new Date(snapshot.validUntil).getTime()
    : null;

  return (
    approvedAtMs <= evaluatedAtMs &&
    evaluatedAtMs >= validFromMs &&
    (validUntilMs === null ||
      (Number.isFinite(validUntilMs) && evaluatedAtMs <= validUntilMs))
  );
}

function isRedBlocker(blocker: VoxyAutoPublishBlocker) {
  return [
    "policy_snapshot_not_approved",
    "sensitive_content_class",
    "source_coverage_not_verified",
    "factuality_not_verified",
    "translation_inconsistent",
    "policy_flag_present",
    "content_revision_hash_missing",
    "kill_switch_probe_invalid",
    "rollback_drill_invalid",
  ].includes(blocker);
}

export function evaluateVoxyAutoPublishCandidate(
  candidate: VoxyAutoPublishCandidate,
  policySnapshot: VoxyAutoPublishPolicySnapshot =
    VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT,
): VoxyAutoPublishEvaluation {
  const blockers: VoxyAutoPublishBlocker[] = [];
  const evaluatedAtValid = isValidDate(candidate.evaluatedAt);
  const evaluatedAtMs = evaluatedAtValid
    ? new Date(candidate.evaluatedAt).getTime()
    : Number.NaN;

  if (!evaluatedAtValid) blockers.push("evaluation_timestamp_invalid");
  if (candidate.policySnapshotId !== policySnapshot.policySnapshotId) {
    blockers.push("policy_snapshot_mismatch");
  }
  if (
    policySnapshot.approvalStatus !== "approved" ||
    !hasText(policySnapshot.approvedBy) ||
    !isValidDate(policySnapshot.approvedAt)
  ) {
    blockers.push("policy_snapshot_not_approved");
  } else if (!policySnapshotEffective(policySnapshot, candidate.evaluatedAt)) {
    blockers.push("policy_snapshot_not_effective");
  }

  if (!candidate.shadowStartedAt || !isValidDate(candidate.shadowStartedAt)) {
    blockers.push("shadow_not_started");
  } else if (
    !evaluatedAtValid ||
    new Date(candidate.shadowStartedAt).getTime() > evaluatedAtMs
  ) {
    blockers.push("shadow_start_in_future");
  }

  if (SENSITIVE_CLASS_SET.has(candidate.contentClass)) {
    blockers.push("sensitive_content_class");
  }
  if (
    !policySnapshot.allowedContentClasses.includes(
      candidate.contentClass as VoxyAutoPublishAllowlistClass,
    )
  ) {
    blockers.push("content_class_not_allowlisted");
  }
  if (!policySnapshot.allowedLanguages.includes(candidate.language)) {
    blockers.push("language_not_allowlisted");
  }
  if (!policySnapshot.allowedChannels.includes(candidate.channel)) {
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
  if (candidate.policyFlags.length > 0) blockers.push("policy_flag_present");
  if (!technicalValidationPassed(candidate.technicalValidation)) {
    blockers.push("technical_validation_failed");
  }
  if (!hasText(candidate.contentRevisionHash)) {
    blockers.push("content_revision_hash_missing");
  }
  if (!hasText(candidate.generatorModelVersion)) {
    blockers.push("generator_version_missing");
  }
  if (!hasText(candidate.reviewModelVersion)) {
    blockers.push("reviewer_version_missing");
  }
  if (!hasText(candidate.promptVersion)) blockers.push("prompt_version_missing");
  if (!hasText(candidate.generatorPrincipalId)) {
    blockers.push("generator_principal_missing");
  }
  if (!hasText(candidate.reviewerPrincipalId)) {
    blockers.push("reviewer_principal_missing");
  }
  if (
    hasText(candidate.generatorPrincipalId) &&
    hasText(candidate.reviewerPrincipalId) &&
    candidate.generatorPrincipalId === candidate.reviewerPrincipalId
  ) {
    blockers.push("generator_reviewer_not_independent");
  }
  if (!candidate.reviewServiceAvailable) {
    blockers.push("review_service_unavailable");
  }
  if (
    !operationalEvidenceValid(candidate.killSwitchProbe, candidate.evaluatedAt)
  ) {
    blockers.push("kill_switch_probe_invalid");
  }
  if (!operationalEvidenceValid(candidate.rollbackDrill, candidate.evaluatedAt)) {
    blockers.push("rollback_drill_invalid");
  }
  if (!hasText(candidate.idempotencyKey)) {
    blockers.push("idempotency_key_missing");
  }
  if (candidate.reviewQueueStatus !== "available") {
    blockers.push("review_queue_unavailable");
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
    schemaVersion: "voxy_auto_publish_evaluation.v2",
    evaluationId: candidate.evaluationId,
    contentId: candidate.contentId,
    contentRevisionId: candidate.contentRevisionId,
    contentRevisionHash: candidate.contentRevisionHash,
    policySnapshotId: policySnapshot.policySnapshotId,
    policyVersion: policySnapshot.policyVersion,
    contentClass: candidate.contentClass,
    language: candidate.language,
    channel: candidate.channel,
    evaluatedAt: candidate.evaluatedAt,
    qualityStatus: autoPublishEligible ? "passed" : "failed",
    riskLevel: autoPublishEligible ? "green" : hasRedBlocker ? "red" : "yellow",
    blockers: uniqueBlockers,
    autoPublishEligible,
    shadowDecision,
    humanReviewRequired: true,
    autoPublishExecutionAllowed: false,
    shadowStartedAt: candidate.shadowStartedAt,
    reviewDueAt:
      candidate.shadowStartedAt && isValidDate(candidate.shadowStartedAt)
        ? calculateVoxyShadowReviewDueAt(
            candidate.shadowStartedAt,
            VOXY_AUTO_PUBLISH_READINESS_POLICY.reviewWindowDays,
            policySnapshot.timeZone,
          )
        : null,
    generatorPrincipalId: candidate.generatorPrincipalId,
    reviewerPrincipalId: candidate.reviewerPrincipalId,
    killSwitchEvidenceId: candidate.killSwitchProbe?.evidenceId ?? null,
    rollbackEvidenceId: candidate.rollbackDrill?.evidenceId ?? null,
    idempotencyKey: candidate.idempotencyKey,
    generatorModelVersion: candidate.generatorModelVersion,
    reviewModelVersion: candidate.reviewModelVersion,
    promptVersion: candidate.promptVersion,
  };
}

function humanDecisionReviewed(decision: VoxyHumanDecision) {
  return decision !== "pending";
}

function approvedAsIs(record: VoxyShadowEvidenceRecord) {
  return (
    record.humanDecision === "approved_as_is" &&
    record.humanApprovedRevisionHash === record.contentRevisionHash
  );
}

function recordAgreement(record: VoxyShadowEvidenceRecord) {
  if (record.shadowDecision === "would_publish") return approvedAsIs(record);
  return (
    record.humanDecision === "changes_requested" ||
    record.humanDecision === "rejected"
  );
}

function deduplicateEvidence(records: readonly VoxyShadowEvidenceRecord[]) {
  const byRevision = new Map<string, VoxyShadowEvidenceRecord>();

  for (const record of records) {
    const key = `${record.contentRevisionId}:${record.contentRevisionHash}`;
    const existing = byRevision.get(key);
    if (
      !existing ||
      new Date(record.reviewedAt).getTime() >
        new Date(existing.reviewedAt).getTime()
    ) {
      byRevision.set(key, record);
    }
  }

  return Array.from(byRevision.values());
}

function summarizeSegment(
  records: readonly VoxyShadowEvidenceRecord[],
): VoxyEvidenceSegmentSummary {
  const reviewed = records.filter((record) =>
    humanDecisionReviewed(record.humanDecision),
  );
  const agreements = reviewed.filter(recordAgreement);
  const criticalMisses = reviewed.filter(
    (record) =>
      record.shadowDecision === "would_publish" && !approvedAsIs(record),
  );
  const technicalFailures = records.filter((record) => record.technicalFailure);

  return {
    totalRecords: records.length,
    totalHumanReviewed: reviewed.length,
    agreementCount: agreements.length,
    agreementRate:
      reviewed.length > 0 ? agreements.length / reviewed.length : null,
    criticalMissCount: criticalMisses.length,
    technicalFailureCount: technicalFailures.length,
    technicalFailureRate:
      records.length > 0 ? technicalFailures.length / records.length : null,
  };
}

function summarizeSegments(
  records: readonly VoxyShadowEvidenceRecord[],
  selectKey: (record: VoxyShadowEvidenceRecord) => string,
) {
  const groups = new Map<string, VoxyShadowEvidenceRecord[]>();

  for (const record of records) {
    const key = selectKey(record);
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  return Object.fromEntries(
    Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, group]) => [key, summarizeSegment(group)]),
  );
}

export function summarizeVoxyShadowEvidence(
  records: readonly VoxyShadowEvidenceRecord[],
): VoxyShadowEvidenceSummary {
  const uniqueRecords = deduplicateEvidence(records);
  const reviewed = uniqueRecords.filter((record) =>
    humanDecisionReviewed(record.humanDecision),
  );
  const wouldPublish = uniqueRecords.filter(
    (record) => record.shadowDecision === "would_publish",
  );
  const approvedAsIsRecords = reviewed.filter(approvedAsIs);
  const approvedAfterChanges = reviewed.filter(
    (record) => record.humanDecision === "approved_after_changes",
  );
  const agreements = reviewed.filter(recordAgreement);
  const criticalMisses = reviewed.filter(
    (record) =>
      record.shadowDecision === "would_publish" && !approvedAsIs(record),
  );
  const overblocks = reviewed.filter(
    (record) =>
      record.shadowDecision !== "would_publish" && approvedAsIs(record),
  );
  const technicalFailures = uniqueRecords.filter(
    (record) => record.technicalFailure,
  );

  const correctionsByCategory = Object.fromEntries(
    CORRECTION_CATEGORIES.map((category) => [category, 0]),
  ) as Record<VoxyHumanCorrectionCategory, number>;
  for (const record of uniqueRecords) {
    for (const category of unique(record.humanCorrections)) {
      correctionsByCategory[category] += 1;
    }
  }

  return {
    totalRecords: records.length,
    uniqueRecordCount: uniqueRecords.length,
    duplicateRecordCount: records.length - uniqueRecords.length,
    totalHumanReviewed: reviewed.length,
    wouldPublishCount: wouldPublish.length,
    approvedAsIsCount: approvedAsIsRecords.length,
    approvedAfterChangesCount: approvedAfterChanges.length,
    agreementCount: agreements.length,
    agreementRate:
      reviewed.length > 0 ? agreements.length / reviewed.length : null,
    criticalMissCount: criticalMisses.length,
    overblockCount: overblocks.length,
    technicalFailureCount: technicalFailures.length,
    technicalFailureRate:
      uniqueRecords.length > 0
        ? technicalFailures.length / uniqueRecords.length
        : null,
    languagesCovered: unique(
      uniqueRecords.map((record) => record.language),
    ).sort(),
    channelsCovered: unique(
      uniqueRecords.map((record) => record.channel),
    ).sort(),
    contentClassesCovered: unique(
      uniqueRecords.map((record) => record.contentClass),
    ).sort(),
    correctionsByCategory,
    segments: {
      languages: summarizeSegments(uniqueRecords, (record) => record.language),
      channels: summarizeSegments(uniqueRecords, (record) => record.channel),
      contentClasses: summarizeSegments(
        uniqueRecords,
        (record) => record.contentClass,
      ),
    },
  };
}

function validRate(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateThresholds(thresholds: VoxyShadowActivationThresholds) {
  const integerThresholds = [
    thresholds.minimumReviewedSamples,
    thresholds.minimumReviewedSamplesPerLanguage,
    thresholds.minimumReviewedSamplesPerChannel,
    thresholds.minimumReviewedSamplesPerContentClass,
    thresholds.maximumCriticalMisses,
  ];

  if (
    integerThresholds.some((value) => !Number.isInteger(value) || value < 0) ||
    !validRate(thresholds.minimumAgreementRate) ||
    !validRate(thresholds.maximumTechnicalFailureRate)
  ) {
    throw new Error("invalid_shadow_thresholds");
  }
}

function appendSegmentBlockers(input: {
  blockers: string[];
  segmentType: "language" | "channel" | "content_class";
  requiredKeys: readonly string[];
  segments: Record<string, VoxyEvidenceSegmentSummary>;
  minimumReviewedSamples: number;
  minimumAgreementRate: number;
  maximumTechnicalFailureRate: number;
}) {
  for (const key of input.requiredKeys) {
    const segment = input.segments[key];
    if (!segment) {
      input.blockers.push(`${input.segmentType}_missing:${key}`);
      continue;
    }
    if (segment.totalHumanReviewed < input.minimumReviewedSamples) {
      input.blockers.push(
        `${input.segmentType}_sample_size_below_threshold:${key}`,
      );
    }
    if (
      segment.agreementRate === null ||
      segment.agreementRate < input.minimumAgreementRate
    ) {
      input.blockers.push(
        `${input.segmentType}_agreement_below_threshold:${key}`,
      );
    }
    if (
      segment.technicalFailureRate === null ||
      segment.technicalFailureRate > input.maximumTechnicalFailureRate
    ) {
      input.blockers.push(
        `${input.segmentType}_technical_failure_rate_above_threshold:${key}`,
      );
    }
  }
}

export function assessVoxyShadowReadiness(input: {
  shadowStartedAt: string;
  now: string;
  timeZone?: string;
  summary: VoxyShadowEvidenceSummary;
  thresholds: VoxyShadowActivationThresholds;
}): VoxyShadowReadinessAssessment {
  if (!isValidDate(input.shadowStartedAt) || !isValidDate(input.now)) {
    throw new Error("invalid_shadow_readiness_date");
  }
  validateThresholds(input.thresholds);

  const timeZone =
    input.timeZone ?? VOXY_AUTO_PUBLISH_PREPARED_POLICY_SNAPSHOT.timeZone;
  const reviewDueAt = calculateVoxyShadowReviewDueAt(
    input.shadowStartedAt,
    VOXY_AUTO_PUBLISH_READINESS_POLICY.reviewWindowDays,
    timeZone,
  );
  if (new Date(input.now).getTime() < new Date(reviewDueAt).getTime()) {
    return {
      status: "review_window_not_complete",
      blockers: ["review_window_not_complete"],
      autoActivationAllowed: false,
      globalAutoPublishAllowed: false,
    };
  }

  const blockers: string[] = [];
  if (input.summary.duplicateRecordCount > 0) {
    blockers.push("duplicate_evidence_detected");
  }
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

  appendSegmentBlockers({
    blockers,
    segmentType: "language",
    requiredKeys: input.thresholds.requiredLanguages,
    segments: input.summary.segments.languages,
    minimumReviewedSamples:
      input.thresholds.minimumReviewedSamplesPerLanguage,
    minimumAgreementRate: input.thresholds.minimumAgreementRate,
    maximumTechnicalFailureRate:
      input.thresholds.maximumTechnicalFailureRate,
  });
  appendSegmentBlockers({
    blockers,
    segmentType: "channel",
    requiredKeys: input.thresholds.requiredChannels,
    segments: input.summary.segments.channels,
    minimumReviewedSamples:
      input.thresholds.minimumReviewedSamplesPerChannel,
    minimumAgreementRate: input.thresholds.minimumAgreementRate,
    maximumTechnicalFailureRate:
      input.thresholds.maximumTechnicalFailureRate,
  });
  appendSegmentBlockers({
    blockers,
    segmentType: "content_class",
    requiredKeys: input.thresholds.requiredContentClasses,
    segments: input.summary.segments.contentClasses,
    minimumReviewedSamples:
      input.thresholds.minimumReviewedSamplesPerContentClass,
    minimumAgreementRate: input.thresholds.minimumAgreementRate,
    maximumTechnicalFailureRate:
      input.thresholds.maximumTechnicalFailureRate,
  });

  const uniqueBlockers = unique(blockers);
  const hasCriticalFailure = uniqueBlockers.some(
    (blocker) =>
      blocker === "critical_miss_limit_exceeded" ||
      blocker.includes("technical_failure_rate_above_threshold"),
  );

  return {
    status:
      uniqueBlockers.length === 0
        ? "eligible_for_human_allowlist_decision"
        : hasCriticalFailure
          ? "no_go"
          : "continue_shadow",
    blockers: uniqueBlockers,
    autoActivationAllowed: false,
    globalAutoPublishAllowed: false,
  };
}
