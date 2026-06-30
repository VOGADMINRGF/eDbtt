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
  "low",
  "medium",
  "high",
  "restricted",
] as const;

export type CommunitySourceReviewTrustLevel =
  (typeof COMMUNITY_SOURCE_REVIEW_TRUST_LEVELS)[number];

export const COMMUNITY_SOURCE_REVIEW_LEGACY_TRUST_LEVELS = [
  "new_contributor",
  "known_contributor",
  "trusted_contributor",
  "editorial_contributor",
] as const;

export type CommunitySourceReviewLegacyTrustLevel =
  (typeof COMMUNITY_SOURCE_REVIEW_LEGACY_TRUST_LEVELS)[number];

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

export const COMMUNITY_SOURCE_REVIEW_TRUST_SIGNAL_KINDS = [
  "prior_allowed_hint",
  "prior_rejected_hint",
  "prior_abuse_signal",
  "prior_source_review_routed",
  "prior_editorial_review_routed",
  "contributor_context_available",
  "contributor_context_missing",
  "repeated_quality_contribution",
  "repeated_low_quality_contribution",
] as const;

export type CommunitySourceReviewTrustSignalKind =
  (typeof COMMUNITY_SOURCE_REVIEW_TRUST_SIGNAL_KINDS)[number];

export const COMMUNITY_SOURCE_REVIEW_SOURCE_QUALITY_SIGNAL_KINDS = [
  "source_url_present",
  "source_url_missing",
  "source_domain_review_needed",
  "primary_source_claimed",
  "secondary_source_claimed",
  "document_type_provided",
  "document_type_missing",
  "date_provided",
  "date_missing",
  "author_or_publisher_provided",
  "author_or_publisher_missing",
  "quote_or_excerpt_provided",
  "quote_or_excerpt_missing",
  "context_provided",
  "context_missing",
  "unverifiable_reference",
  "suspicious_source_quality",
  "strong_review_candidate",
  "weak_review_candidate",
] as const;

export type CommunitySourceReviewSourceQualitySignalKind =
  (typeof COMMUNITY_SOURCE_REVIEW_SOURCE_QUALITY_SIGNAL_KINDS)[number];

export const COMMUNITY_SOURCE_REVIEW_SOURCE_QUALITY_LEVELS = [
  "unknown",
  "weak",
  "usable_for_review",
  "strong_review_candidate",
  "restricted",
] as const;

export type CommunitySourceReviewSourceQualityLevel =
  (typeof COMMUNITY_SOURCE_REVIEW_SOURCE_QUALITY_LEVELS)[number];

export const COMMUNITY_SOURCE_REVIEW_ABUSE_SIGNAL_KINDS = [
  "possible_spam",
  "possible_abuse",
  "repeated_submission",
  "possible_duplicate_hint",
  "suspicious_source_url",
  "low_information_value",
  "coordinated_activity_signal",
  "excessive_volume_signal",
  "escalation_risk",
  "moderation_history_risk",
] as const;

export type CommunitySourceReviewAbuseSignalKind =
  (typeof COMMUNITY_SOURCE_REVIEW_ABUSE_SIGNAL_KINDS)[number];

export const COMMUNITY_SOURCE_REVIEW_ABUSE_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type CommunitySourceReviewAbuseSeverity =
  (typeof COMMUNITY_SOURCE_REVIEW_ABUSE_SEVERITIES)[number];

export const COMMUNITY_SOURCE_REVIEW_ABUSE_DISPOSITIONS = [
  "review_only",
  "needs_moderator_attention",
  "hide_until_reviewed",
  "reject_recommended",
  "escalate_recommended",
] as const;

export type CommunitySourceReviewAbuseDisposition =
  (typeof COMMUNITY_SOURCE_REVIEW_ABUSE_DISPOSITIONS)[number];

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
  "abuse_signal_review_only",
  "abuse_signal_needs_moderator_attention",
  "abuse_signal_hide_until_reviewed",
  "abuse_signal_reject_recommended",
  "abuse_signal_escalate_recommended",
  "abuse_signal_repeated_submission",
  "abuse_signal_duplicate_hint",
  "abuse_signal_excessive_volume",
  "abuse_signal_evidence_blocked",
  "abuse_signal_auto_action_blocked",
  "trust_review_only",
  "trust_restricted_until_reviewed",
  "trust_history_not_truth",
  "source_quality_review_only",
  "source_quality_restricted_until_reviewed",
  "source_quality_not_verification",
  "review_priority_trust_quality_only",
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

export type CommunitySourceReviewAbuseSignalInput = {
  kind: CommunitySourceReviewAbuseSignalKind;
  severity?: CommunitySourceReviewAbuseSeverity;
  disposition?: CommunitySourceReviewAbuseDisposition;
  note?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  detectedBy?: "runtime" | "moderator";
  detectedFrom?: "heuristic" | "reason" | "manual";
};

export type CommunitySourceReviewTrustSignalInput = {
  kind: CommunitySourceReviewTrustSignalKind;
  note?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  detectedBy?: "runtime" | "moderator";
  detectedFrom?: "heuristic" | "history" | "manual";
};

export type CommunitySourceReviewSourceQualitySignalInput = {
  kind: CommunitySourceReviewSourceQualitySignalKind;
  note?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  detectedBy?: "runtime" | "moderator";
  detectedFrom?: "heuristic" | "history" | "manual";
};

export type CommunitySourceReviewModerationInput = {
  moderationStatus?: CommunitySourceReviewModerationStatus;
  trustLevel?: CommunitySourceReviewTrustLevel | CommunitySourceReviewLegacyTrustLevel;
  riskLevel?: CommunitySourceReviewRiskLevel;
  sourceQualityLevel?: CommunitySourceReviewSourceQualityLevel;
  abuseReasons?: readonly CommunitySourceReviewAbuseReason[];
  abuseSignals?: readonly CommunitySourceReviewAbuseSignalInput[];
  trustSignals?: readonly CommunitySourceReviewTrustSignalInput[];
  sourceQualitySignals?: readonly CommunitySourceReviewSourceQualitySignalInput[];
  trustSignalsReviewedAt?: string | null;
  trustSignalsReviewedBy?: string | null;
  sourceQualityReviewedAt?: string | null;
  sourceQualityReviewedBy?: string | null;
  reviewPriorityOverride?: "standard" | "prioritized" | null;
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
  sourceRefs?: readonly string[];
  textLength?: number;
  claimText?: string | null;
  notes?: readonly string[];
  materialRefs?: readonly string[];
  moderationFlags: CommunitySourceReviewGuardrailFlags;
  history?: {
    priorAllowedHint?: boolean;
    priorRejectedHint?: boolean;
    priorSourceReviewRouted?: boolean;
    priorEditorialReviewRouted?: boolean;
    contributorContextAvailable?: boolean;
  } | null;
  moderation?: CommunitySourceReviewModerationInput | null;
};

export type CommunitySourceReviewAbuseSignal = {
  kind: CommunitySourceReviewAbuseSignalKind;
  severity: CommunitySourceReviewAbuseSeverity;
  disposition: CommunitySourceReviewAbuseDisposition;
  note: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  detectedBy: "runtime" | "moderator";
  detectedFrom: "heuristic" | "reason" | "manual";
};

export type CommunitySourceReviewTrustSignal = {
  kind: CommunitySourceReviewTrustSignalKind;
  note: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  detectedBy: "runtime" | "moderator";
  detectedFrom: "heuristic" | "history" | "manual";
};

export type CommunitySourceReviewSourceQualitySignal = {
  kind: CommunitySourceReviewSourceQualitySignalKind;
  note: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  detectedBy: "runtime" | "moderator";
  detectedFrom: "heuristic" | "history" | "manual";
};

export type CommunitySourceReviewAbuseState = {
  signals: CommunitySourceReviewAbuseSignal[];
  highestSeverity: CommunitySourceReviewAbuseSeverity;
  effectiveDisposition: CommunitySourceReviewAbuseDisposition;
  reviewOnlyHint: boolean;
  duplicateOrRepeatedHint: boolean;
  excessiveVolumeHint: boolean;
  usageBlocked: boolean;
  evidenceBlocked: boolean;
  autoActionBlocked: boolean;
  escalationRecommended: boolean;
  blockers: CommunitySourceReviewModerationBlocker[];
  summary: string;
};

export type CommunitySourceReviewTrustState = {
  signals: CommunitySourceReviewTrustSignal[];
  trustLevel: CommunitySourceReviewTrustLevel;
  reviewBlocked: boolean;
  reviewOnlyHint: boolean;
  summary: string;
};

export type CommunitySourceReviewSourceQualityState = {
  signals: CommunitySourceReviewSourceQualitySignal[];
  sourceQualityLevel: CommunitySourceReviewSourceQualityLevel;
  reviewBlocked: boolean;
  reviewCandidateHint: "none" | "usable_for_review" | "strong_review_candidate";
  summary: string;
};

export type CommunitySourceReviewModerationSignal = {
  moderationStatus: CommunitySourceReviewModerationStatus;
  trustLevel: CommunitySourceReviewTrustLevel;
  trustSignals: CommunitySourceReviewTrustSignal[];
  trustState: CommunitySourceReviewTrustState;
  sourceQualityLevel: CommunitySourceReviewSourceQualityLevel;
  sourceQualitySignals: CommunitySourceReviewSourceQualitySignal[];
  sourceQualityState: CommunitySourceReviewSourceQualityState;
  riskLevel: CommunitySourceReviewRiskLevel;
  abuseReasons: CommunitySourceReviewAbuseReason[];
  abuseSignals: CommunitySourceReviewAbuseSignal[];
  abuseState: CommunitySourceReviewAbuseState;
  abuseSeverity: CommunitySourceReviewAbuseSeverity;
  abuseDisposition: CommunitySourceReviewAbuseDisposition;
  trustSignalsReviewedAt: string | null;
  trustSignalsReviewedBy: string | null;
  sourceQualityReviewedAt: string | null;
  sourceQualityReviewedBy: string | null;
  requiresHumanModeration: boolean;
  canExposePublicly: boolean;
  canEscalateToEditorial: boolean;
  canUseHintDespiteAbuseSignals: boolean;
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

const severityRank: Record<CommunitySourceReviewAbuseSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const dispositionRank: Record<CommunitySourceReviewAbuseDisposition, number> = {
  review_only: 0,
  needs_moderator_attention: 1,
  hide_until_reviewed: 2,
  reject_recommended: 3,
  escalate_recommended: 4,
};

export function getCommunitySourceReviewModerationStatusLabel(
  status: CommunitySourceReviewModerationStatus,
): string {
  if (status === "pending_review") return "wartet auf Moderation";
  if (status === "needs_moderation") return "Moderation nötig";
  if (status === "allowed_as_hint") return "als Hinweis erlaubt";
  if (status === "hidden_pending_review") return "vorerst verborgen";
  if (status === "rejected_abuse") return "wegen Missbrauch abgelehnt";
  return "redaktionell eskaliert";
}

export function getCommunitySourceReviewTrustLevelLabel(
  trustLevel: CommunitySourceReviewTrustLevel,
): string {
  if (trustLevel === "unknown") return "unbekannt";
  if (trustLevel === "low") return "niedrig";
  if (trustLevel === "medium") return "mittel";
  if (trustLevel === "high") return "hoch";
  return "eingeschränkt";
}

export function getCommunitySourceReviewRiskLevelLabel(
  riskLevel: CommunitySourceReviewRiskLevel,
): string {
  if (riskLevel === "low") return "niedrig";
  if (riskLevel === "medium") return "mittel";
  if (riskLevel === "high") return "hoch";
  return "kritisch";
}

export function getCommunitySourceReviewAbuseReasonLabel(
  reason: CommunitySourceReviewAbuseReason,
): string {
  if (reason === "spam") return "Spam";
  if (reason === "harassment") return "Belästigung";
  if (reason === "duplicate") return "Duplikat";
  if (reason === "coordinated_manipulation") return "koordinierte Manipulation";
  if (reason === "unverifiable_claim") return "nicht belastbar prüfbarer Claim";
  if (reason === "misleading_source") return "irreführende Quelle";
  if (reason === "personal_data") return "personenbezogene Daten";
  if (reason === "off_topic") return "off topic";
  return "unsicherer Inhalt";
}

export function getCommunitySourceReviewAbuseSignalKindLabel(
  kind: CommunitySourceReviewAbuseSignalKind,
): string {
  if (kind === "possible_spam") return "möglicher Spam";
  if (kind === "possible_abuse") return "möglicher Missbrauch";
  if (kind === "repeated_submission") return "Mehrfacheinreichung";
  if (kind === "possible_duplicate_hint") return "mögliches Duplikat";
  if (kind === "suspicious_source_url") return "verdächtige Quellen-URL";
  if (kind === "low_information_value") return "geringer Informationswert";
  if (kind === "coordinated_activity_signal") return "Signal für koordinierte Aktivität";
  if (kind === "excessive_volume_signal") return "Volumensignal";
  if (kind === "escalation_risk") return "Eskalationsrisiko";
  return "Moderationshistorie";
}

export function getCommunitySourceReviewTrustSignalKindLabel(
  kind: CommunitySourceReviewTrustSignalKind,
): string {
  if (kind === "prior_allowed_hint") return "früher als Hinweis erlaubt";
  if (kind === "prior_rejected_hint") return "früher zurückgewiesen";
  if (kind === "prior_abuse_signal") return "früheres Abuse-Signal";
  if (kind === "prior_source_review_routed") return "früher zur Quellenprüfung geroutet";
  if (kind === "prior_editorial_review_routed") {
    return "früher redaktionell geroutet";
  }
  if (kind === "contributor_context_available") return "Contributor-Kontext vorhanden";
  if (kind === "contributor_context_missing") return "Contributor-Kontext fehlt";
  if (kind === "repeated_quality_contribution") return "wiederholt qualitätssensibler Hinweis";
  return "wiederholt schwacher Hinweis";
}

export function getCommunitySourceReviewSourceQualitySignalKindLabel(
  kind: CommunitySourceReviewSourceQualitySignalKind,
): string {
  if (kind === "source_url_present") return "Quellen-URL vorhanden";
  if (kind === "source_url_missing") return "Quellen-URL fehlt";
  if (kind === "source_domain_review_needed") return "Domain muss geprüft werden";
  if (kind === "primary_source_claimed") return "Primärquelle behauptet";
  if (kind === "secondary_source_claimed") return "Sekundärquelle behauptet";
  if (kind === "document_type_provided") return "Dokumenttyp angegeben";
  if (kind === "document_type_missing") return "Dokumenttyp fehlt";
  if (kind === "date_provided") return "Datum angegeben";
  if (kind === "date_missing") return "Datum fehlt";
  if (kind === "author_or_publisher_provided") return "Autor oder Publisher angegeben";
  if (kind === "author_or_publisher_missing") return "Autor oder Publisher fehlt";
  if (kind === "quote_or_excerpt_provided") return "Zitat oder Auszug vorhanden";
  if (kind === "quote_or_excerpt_missing") return "Zitat oder Auszug fehlt";
  if (kind === "context_provided") return "Kontext vorhanden";
  if (kind === "context_missing") return "Kontext fehlt";
  if (kind === "unverifiable_reference") return "nicht belastbar prüfbare Referenz";
  if (kind === "suspicious_source_quality") return "verdächtige Quellenqualität";
  if (kind === "strong_review_candidate") return "starker Review-Kandidat";
  return "schwacher Review-Kandidat";
}

export function getCommunitySourceReviewSourceQualityLevelLabel(
  level: CommunitySourceReviewSourceQualityLevel,
): string {
  if (level === "unknown") return "unbekannt";
  if (level === "weak") return "schwach";
  if (level === "usable_for_review") return "für Review nutzbar";
  if (level === "strong_review_candidate") return "starker Review-Kandidat";
  return "eingeschränkt";
}

export function getCommunitySourceReviewAbuseSeverityLabel(
  severity: CommunitySourceReviewAbuseSeverity,
): string {
  if (severity === "low") return "niedrig";
  if (severity === "medium") return "mittel";
  if (severity === "high") return "hoch";
  return "kritisch";
}

export function getCommunitySourceReviewAbuseDispositionLabel(
  disposition: CommunitySourceReviewAbuseDisposition,
): string {
  if (disposition === "review_only") return "nur Review-Hinweis";
  if (disposition === "needs_moderator_attention") return "Moderator prüfen";
  if (disposition === "hide_until_reviewed") return "bis Review verbergen";
  if (disposition === "reject_recommended") return "Ablehnung empfohlen";
  return "Eskalation empfohlen";
}

export function getCommunitySourceReviewModerationBlockerLabel(
  blocker: CommunitySourceReviewModerationBlocker,
): string {
  if (blocker === "abuse_spam") return "Spam blockiert weitere Nutzung.";
  if (blocker === "abuse_harassment") return "Belästigung blockiert weitere Nutzung.";
  if (blocker === "abuse_duplicate") return "Duplikate bleiben moderationspflichtig.";
  if (blocker === "abuse_coordinated_manipulation") {
    return "Koordinierte Manipulation blockiert weitere Nutzung.";
  }
  if (blocker === "abuse_unverifiable_claim") {
    return "Nicht belastbar prüfbare Claims bleiben eskalationspflichtig.";
  }
  if (blocker === "abuse_misleading_source") {
    return "Irreführende Quellenhinweise bleiben moderationspflichtig.";
  }
  if (blocker === "abuse_personal_data") {
    return "Personenbezogene Daten blockieren weitere Nutzung.";
  }
  if (blocker === "abuse_off_topic") return "Thematisch fremde Hinweise bleiben blockiert.";
  if (blocker === "abuse_unsafe_content") return "Unsicherer Inhalt blockiert weitere Nutzung.";
  if (blocker === "abuse_signal_review_only") {
    return "Signal bleibt Review-Hinweis und ist keine Wahrheits- oder Qualitätsbestätigung.";
  }
  if (blocker === "abuse_signal_needs_moderator_attention") {
    return "Signal verlangt explizite Moderationsaufmerksamkeit.";
  }
  if (blocker === "abuse_signal_hide_until_reviewed") {
    return "Signal empfiehlt Verbergen bis zur Moderationsprüfung.";
  }
  if (blocker === "abuse_signal_reject_recommended") {
    return "Signal empfiehlt Ablehnung, erzwingt sie aber nicht automatisch.";
  }
  if (blocker === "abuse_signal_escalate_recommended") {
    return "Signal empfiehlt eine redaktionelle Eskalation.";
  }
  if (blocker === "abuse_signal_repeated_submission") {
    return "Mehrfacheinreichung begründet keine Wahrheit.";
  }
  if (blocker === "abuse_signal_duplicate_hint") {
    return "Mögliche Duplikate bleiben Review-Hinweise statt zusätzlicher Evidenz.";
  }
  if (blocker === "abuse_signal_excessive_volume") {
    return "Volumensignale erhöhen Review-Bedarf, aber keine Wahrheitswahrscheinlichkeit.";
  }
  if (blocker === "abuse_signal_evidence_blocked") {
    return "Signal blockiert die Nutzung als Evidenz oder Wahrheitsbeleg.";
  }
  if (blocker === "abuse_signal_auto_action_blocked") {
    return "Signal blockiert automatische Folgeaktionen.";
  }
  if (blocker === "trust_review_only") {
    return "Trust bleibt Review-Priorisierung und keine Wahrheitsaussage.";
  }
  if (blocker === "trust_restricted_until_reviewed") {
    return "Eingeschränkter Trust blockiert die Nutzung als Hinweis bis zum Review.";
  }
  if (blocker === "trust_history_not_truth") {
    return "Contributor-Historie ist kein Glaubwürdigkeits- oder Wahrheitsbeweis.";
  }
  if (blocker === "source_quality_review_only") {
    return "Quellenqualität dient nur der Einordnung für Review.";
  }
  if (blocker === "source_quality_restricted_until_reviewed") {
    return "Eingeschränkte Quellenqualität blockiert die Nutzung bis zur Prüfung.";
  }
  if (blocker === "source_quality_not_verification") {
    return "Quellenqualität verifiziert keine Quelle.";
  }
  if (blocker === "review_priority_trust_quality_only") {
    return "Review-Priorität aus Trust/Quality erzeugt keine Wahrheit, Verifikation oder Freigabe.";
  }
  if (blocker === "hidden_pending_review") {
    return "Hinweis bleibt bis zur Moderationsprüfung verborgen.";
  }
  if (blocker === "rejected_abuse") {
    return "Hinweis ist als missbräuchlich abgelehnt.";
  }
  return "Öffentliche Sichtbarkeit bleibt bis zu einem moderation-safe Status gesperrt.";
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function uniqueReasons(
  reasons: readonly CommunitySourceReviewAbuseReason[],
): CommunitySourceReviewAbuseReason[] {
  return unique(reasons);
}

function hasReason(
  reasons: readonly CommunitySourceReviewAbuseReason[],
  reason: CommunitySourceReviewAbuseReason,
): boolean {
  return reasons.includes(reason);
}

function hasSignalKind(
  signals: readonly CommunitySourceReviewAbuseSignal[],
  kind: CommunitySourceReviewAbuseSignalKind,
): boolean {
  return signals.some((signal) => signal.kind === kind);
}

function maxSeverity(
  left: CommunitySourceReviewAbuseSeverity,
  right: CommunitySourceReviewAbuseSeverity,
): CommunitySourceReviewAbuseSeverity {
  return severityRank[left] >= severityRank[right] ? left : right;
}

function maxDisposition(
  left: CommunitySourceReviewAbuseDisposition,
  right: CommunitySourceReviewAbuseDisposition,
): CommunitySourceReviewAbuseDisposition {
  return dispositionRank[left] >= dispositionRank[right] ? left : right;
}

function createAbuseSignal(
  input: CommunitySourceReviewAbuseSignalInput,
): CommunitySourceReviewAbuseSignal {
  return {
    kind: input.kind,
    severity: input.severity ?? "medium",
    disposition: input.disposition ?? "needs_moderator_attention",
    note: typeof input.note === "string" ? input.note.trim() || null : null,
    reviewedAt: typeof input.reviewedAt === "string" ? input.reviewedAt.trim() || null : null,
    reviewedBy: typeof input.reviewedBy === "string" ? input.reviewedBy.trim() || null : null,
    detectedBy: input.detectedBy ?? "runtime",
    detectedFrom: input.detectedFrom ?? "heuristic",
  };
}

function mergeAbuseSignals(
  base: CommunitySourceReviewAbuseSignal,
  next: CommunitySourceReviewAbuseSignal,
): CommunitySourceReviewAbuseSignal {
  return {
    kind: base.kind,
    severity: maxSeverity(base.severity, next.severity),
    disposition: maxDisposition(base.disposition, next.disposition),
    note: next.note ?? base.note,
    reviewedAt: next.reviewedAt ?? base.reviewedAt,
    reviewedBy: next.reviewedBy ?? base.reviewedBy,
    detectedBy: next.detectedBy === "moderator" ? "moderator" : base.detectedBy,
    detectedFrom: next.detectedFrom === "manual" ? "manual" : base.detectedFrom,
  };
}

function createTrustSignal(
  input: CommunitySourceReviewTrustSignalInput,
): CommunitySourceReviewTrustSignal {
  return {
    kind: input.kind,
    note: typeof input.note === "string" ? input.note.trim() || null : null,
    reviewedAt: typeof input.reviewedAt === "string" ? input.reviewedAt.trim() || null : null,
    reviewedBy: typeof input.reviewedBy === "string" ? input.reviewedBy.trim() || null : null,
    detectedBy: input.detectedBy ?? "runtime",
    detectedFrom: input.detectedFrom ?? "heuristic",
  };
}

function createSourceQualitySignal(
  input: CommunitySourceReviewSourceQualitySignalInput,
): CommunitySourceReviewSourceQualitySignal {
  return {
    kind: input.kind,
    note: typeof input.note === "string" ? input.note.trim() || null : null,
    reviewedAt: typeof input.reviewedAt === "string" ? input.reviewedAt.trim() || null : null,
    reviewedBy: typeof input.reviewedBy === "string" ? input.reviewedBy.trim() || null : null,
    detectedBy: input.detectedBy ?? "runtime",
    detectedFrom: input.detectedFrom ?? "heuristic",
  };
}

function sourceTextBundle(input: CommunitySourceReviewModerationAssessmentInput): string {
  return [
    input.claimText ?? "",
    ...(input.notes ?? []),
    ...(input.sourceRefs ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function hasDateLike(value: string): boolean {
  return (
    /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/.test(value) ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(value) ||
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(value) ||
    /\b(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\b/.test(
      value,
    )
  );
}

function hasDocumentTypeLike(value: string): boolean {
  return /\b(pdf|protokoll|beschluss|drucksache|bericht|studie|memo|gutachten|vermerk|bekanntmachung|artikel|interview|transkript)\b/.test(
    value,
  );
}

function hasPrimarySourceLike(value: string): boolean {
  return /\b(primärquelle|primary source|originalquelle|original source|originaldokument|amtlich|bekanntmachung|beschluss|drucksache|protokoll)\b/.test(
    value,
  );
}

function hasSecondarySourceLike(value: string): boolean {
  return /\b(sekundärquelle|secondary source|bericht|analyse|kommentar|zusammenfassung|reviewartikel)\b/.test(
    value,
  );
}

function hasQuoteOrExcerptLike(value: string): boolean {
  return /["'„“‚‘][^"'„“‚‘]{8,}["'„“‚‘]/.test(value);
}

function hasPublisherLike(value: string, sourceRefs: readonly string[]): boolean {
  if (/\b(von|herausgegeben von|publisher|autor|redaktion|amt)\b/.test(value)) {
    return true;
  }
  return sourceRefs.some((ref) => {
    try {
      const url = new URL(ref);
      return Boolean(url.hostname && url.hostname.includes("."));
    } catch {
      return false;
    }
  });
}

function normalizeTrustLevel(
  trustLevel: CommunitySourceReviewModerationInput["trustLevel"],
): CommunitySourceReviewTrustLevel {
  if (!trustLevel || trustLevel === "unknown") return "unknown";
  if (trustLevel === "low" || trustLevel === "medium" || trustLevel === "high") {
    return trustLevel;
  }
  if (trustLevel === "restricted") return "restricted";
  if (trustLevel === "new_contributor") return "low";
  if (trustLevel === "known_contributor") return "medium";
  return "high";
}

function suspiciousUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes("bit.ly/") ||
    normalized.includes("tinyurl.com/") ||
    normalized.includes("t.co/") ||
    normalized.startsWith("http://") ||
    normalized.includes("localhost") ||
    /\b\d{1,3}(\.\d{1,3}){3}\b/.test(normalized)
  );
}

export function detectCommunitySourceReviewAbuseSignals(
  input: CommunitySourceReviewModerationAssessmentInput,
): CommunitySourceReviewAbuseSignal[] {
  const reasons = uniqueReasons(input.moderation?.abuseReasons ?? []);
  const detected = new Map<
    CommunitySourceReviewAbuseSignalKind,
    CommunitySourceReviewAbuseSignal
  >();

  function addSignal(signal: CommunitySourceReviewAbuseSignalInput) {
    const normalized = createAbuseSignal(signal);
    const existing = detected.get(normalized.kind);
    detected.set(
      normalized.kind,
      existing ? mergeAbuseSignals(existing, normalized) : normalized,
    );
  }

  for (const reason of reasons) {
    if (reason === "spam") {
      addSignal({
        kind: "possible_spam",
        severity: "high",
        disposition: "needs_moderator_attention",
        note: "Bereits als Spam-Grund markiert.",
        detectedFrom: "reason",
      });
    }
    if (
      reason === "harassment" ||
      reason === "personal_data" ||
      reason === "unsafe_content" ||
      reason === "off_topic"
    ) {
      addSignal({
        kind: "possible_abuse",
        severity: reason === "personal_data" ? "critical" : "high",
        disposition:
          reason === "personal_data" || reason === "unsafe_content"
            ? "hide_until_reviewed"
            : "needs_moderator_attention",
        note: "Bestehender Abuse-Grund wurde als Moderationssignal gespiegelt.",
        detectedFrom: "reason",
      });
    }
    if (reason === "duplicate") {
      addSignal({
        kind: "possible_duplicate_hint",
        severity: "medium",
        disposition: "review_only",
        note: "Duplikatsignal bleibt Moderationshinweis statt zusätzlicher Evidenz.",
        detectedFrom: "reason",
      });
    }
    if (reason === "coordinated_manipulation") {
      addSignal({
        kind: "coordinated_activity_signal",
        severity: "critical",
        disposition: "escalate_recommended",
        note: "Koordinierte Manipulation wurde erkannt.",
        detectedFrom: "reason",
      });
    }
    if (reason === "misleading_source") {
      addSignal({
        kind: "suspicious_source_url",
        severity: "high",
        disposition: "needs_moderator_attention",
        note: "Irreführende Quelle bleibt Moderationssignal.",
        detectedFrom: "reason",
      });
    }
    if (reason === "unverifiable_claim") {
      addSignal({
        kind: "escalation_risk",
        severity: "medium",
        disposition: "escalate_recommended",
        note: "Unklarer oder nicht belastbar prüfbarer Claim.",
        detectedFrom: "reason",
      });
    }
  }

  if (input.relatedContributionCount >= 3) {
    addSignal({
      kind: "repeated_submission",
      severity: input.relatedContributionCount >= 8 ? "high" : "medium",
      disposition: "review_only",
      note: "Mehrfacheinreichungen bleiben Review-Signal und keine zusätzliche Evidenz.",
    });
  }

  if (input.relatedContributionCount >= 12) {
    addSignal({
      kind: "excessive_volume_signal",
      severity: input.relatedContributionCount >= 20 ? "critical" : "high",
      disposition: "needs_moderator_attention",
      note: "Volumen erhöht den Moderationsbedarf, aber nicht die Wahrheitswahrscheinlichkeit.",
    });
  }

  if (
    input.moderationFlags.usesMajorityAsTruth ||
    (input.relatedContributionCount >= 10 &&
      (hasReason(reasons, "duplicate") || hasReason(reasons, "coordinated_manipulation")))
  ) {
    addSignal({
      kind: "coordinated_activity_signal",
      severity: "high",
      disposition: "escalate_recommended",
      note: "Mehrheit oder Ballung dürfen keine Wahrheit begründen.",
    });
  }

  if (
    (input.kind === "source_suggestion" || input.kind === "counter_source") &&
    input.sourceRefCount === 0
  ) {
    addSignal({
      kind: "low_information_value",
      severity: "medium",
      disposition: "review_only",
      note: "Ohne konkrete Quelle bleibt der Hinweis dünn und review-first.",
    });
  }

  if (
    (input.textLength ?? 0) > 0 &&
    (input.textLength ?? 0) < 40 &&
    input.sourceRefCount === 0
  ) {
    addSignal({
      kind: "low_information_value",
      severity: "medium",
      disposition: "review_only",
      note: "Sehr knapper Hinweis ohne belastbare Referenz.",
    });
  }

  if ((input.sourceRefs ?? []).some(suspiciousUrl)) {
    addSignal({
      kind: "suspicious_source_url",
      severity: "high",
      disposition: "needs_moderator_attention",
      note: "Verdächtige oder nicht belastbare URL erkannt.",
    });
  }

  if (
    input.moderation?.moderationStatus === "hidden_pending_review" ||
    input.moderation?.moderationStatus === "rejected_abuse" ||
    input.moderation?.moderationStatus === "escalated_to_editorial"
  ) {
    addSignal({
      kind: "moderation_history_risk",
      severity:
        input.moderation.moderationStatus === "rejected_abuse" ? "high" : "medium",
      disposition: "needs_moderator_attention",
      note: "Vorherige Moderationsentscheidung soll erneute Nutzung bremsen.",
    });
  }

  if (
    hasReason(reasons, "misleading_source") ||
    hasReason(reasons, "unverifiable_claim") ||
    hasReason(reasons, "coordinated_manipulation")
  ) {
    addSignal({
      kind: "escalation_risk",
      severity: hasReason(reasons, "coordinated_manipulation") ? "critical" : "high",
      disposition: "escalate_recommended",
      note: "Hinweis sollte eher eskaliert als automatisch verwendet werden.",
    });
  }

  for (const signal of input.moderation?.abuseSignals ?? []) {
    addSignal({
      ...signal,
      detectedBy: signal.detectedBy ?? "moderator",
      detectedFrom: signal.detectedFrom ?? "manual",
    });
  }

  return Array.from(detected.values()).sort((left, right) => {
    const severityDiff = severityRank[right.severity] - severityRank[left.severity];
    if (severityDiff !== 0) return severityDiff;
    return dispositionRank[right.disposition] - dispositionRank[left.disposition];
  });
}

export function blocksCommunityHintAutoAction(
  input:
    | CommunitySourceReviewAbuseState
    | CommunitySourceReviewModerationSignal
    | readonly CommunitySourceReviewAbuseSignal[],
): boolean {
  const state = summarizeCommunitySourceReviewAbuseState(input);
  return state.autoActionBlocked;
}

export function blocksCommunityHintAsEvidence(
  input:
    | CommunitySourceReviewAbuseState
    | CommunitySourceReviewModerationSignal
    | readonly CommunitySourceReviewAbuseSignal[],
): boolean {
  const state = summarizeCommunitySourceReviewAbuseState(input);
  return state.evidenceBlocked;
}

export function canUseCommunityHintDespiteAbuseSignals(
  input:
    | CommunitySourceReviewAbuseState
    | CommunitySourceReviewModerationSignal
    | readonly CommunitySourceReviewAbuseSignal[],
): boolean {
  const state = summarizeCommunitySourceReviewAbuseState(input);
  return !state.usageBlocked;
}

export function getCommunityHintAbuseBlockers(
  input:
    | CommunitySourceReviewAbuseState
    | CommunitySourceReviewModerationSignal
    | readonly CommunitySourceReviewAbuseSignal[],
): CommunitySourceReviewModerationBlocker[] {
  const state = summarizeCommunitySourceReviewAbuseState(input);
  return [...state.blockers];
}

export function summarizeCommunitySourceReviewAbuseState(
  input:
    | CommunitySourceReviewAbuseState
    | CommunitySourceReviewModerationSignal
    | readonly CommunitySourceReviewAbuseSignal[],
): CommunitySourceReviewAbuseState {
  if ("blockers" in input && "signals" in input && "highestSeverity" in input) {
    return input;
  }

  const signals = "abuseSignals" in input ? input.abuseSignals : [...input];
  const highestSeverity = signals.reduce<CommunitySourceReviewAbuseSeverity>(
    (current, signal) => maxSeverity(current, signal.severity),
    "low",
  );
  const effectiveDisposition = signals.reduce<CommunitySourceReviewAbuseDisposition>(
    (current, signal) => maxDisposition(current, signal.disposition),
    "review_only",
  );
  const duplicateOrRepeatedHint =
    hasSignalKind(signals, "possible_duplicate_hint") ||
    hasSignalKind(signals, "repeated_submission");
  const excessiveVolumeHint = hasSignalKind(signals, "excessive_volume_signal");
  const escalationRecommended =
    effectiveDisposition === "escalate_recommended" ||
    hasSignalKind(signals, "escalation_risk") ||
    hasSignalKind(signals, "coordinated_activity_signal");
  const usageBlocked =
    signals.length > 0 && effectiveDisposition !== "review_only";
  const evidenceBlocked =
    signals.length > 0 &&
    (highestSeverity === "high" ||
      highestSeverity === "critical" ||
      duplicateOrRepeatedHint ||
      excessiveVolumeHint ||
      effectiveDisposition !== "review_only");
  const autoActionBlocked = signals.length > 0;
  const reviewOnlyHint =
    signals.length > 0 &&
    effectiveDisposition === "review_only" &&
    !usageBlocked;

  const blockers: CommunitySourceReviewModerationBlocker[] = [];
  if (reviewOnlyHint) blockers.push("abuse_signal_review_only");
  if (effectiveDisposition === "needs_moderator_attention") {
    blockers.push("abuse_signal_needs_moderator_attention");
  }
  if (effectiveDisposition === "hide_until_reviewed") {
    blockers.push("abuse_signal_hide_until_reviewed");
  }
  if (effectiveDisposition === "reject_recommended") {
    blockers.push("abuse_signal_reject_recommended");
  }
  if (effectiveDisposition === "escalate_recommended") {
    blockers.push("abuse_signal_escalate_recommended");
  }
  if (hasSignalKind(signals, "repeated_submission")) {
    blockers.push("abuse_signal_repeated_submission");
  }
  if (hasSignalKind(signals, "possible_duplicate_hint")) {
    blockers.push("abuse_signal_duplicate_hint");
  }
  if (hasSignalKind(signals, "excessive_volume_signal")) {
    blockers.push("abuse_signal_excessive_volume");
  }
  if (evidenceBlocked) blockers.push("abuse_signal_evidence_blocked");
  if (autoActionBlocked) blockers.push("abuse_signal_auto_action_blocked");

  let summary = "Keine Abuse-/Spam-Signale erkannt.";
  if (signals.length > 0 && reviewOnlyHint) {
    summary =
      "Abuse-/Spam-Signale bleiben Moderationshinweise. Mehrfach- oder Volumensignale begründen keine Wahrheit.";
  } else if (signals.length > 0 && effectiveDisposition === "hide_until_reviewed") {
    summary =
      "Hinweis bleibt bis zum Review zurückgestellt. Signalsichtbarkeit ersetzt keine Ablehnung, sperrt aber Nutzung und Evidenz.";
  } else if (
    signals.length > 0 &&
    effectiveDisposition === "needs_moderator_attention"
  ) {
    summary =
      "Hinweis bleibt prüfpflichtig. Signale markieren Moderationsbedarf, ohne automatische Ablehnung auszulösen.";
  } else if (
    signals.length > 0 &&
    effectiveDisposition === "reject_recommended"
  ) {
    summary =
      "Hinweis bleibt Moderationsfall. Reject ist nur Empfehlung und keine automatische Entscheidung.";
  } else if (
    signals.length > 0 &&
    effectiveDisposition === "escalate_recommended"
  ) {
    summary =
      "Hinweis trägt Eskalationssignale und sollte redaktionell geprüft werden, statt automatisiert weiterzulaufen.";
  }

  return {
    signals,
    highestSeverity,
    effectiveDisposition,
    reviewOnlyHint,
    duplicateOrRepeatedHint,
    excessiveVolumeHint,
    usageBlocked,
    evidenceBlocked,
    autoActionBlocked,
    escalationRecommended,
    blockers: unique(blockers),
    summary,
  };
}

export function deriveCommunitySourceReviewSourceQualitySignals(
  input: CommunitySourceReviewModerationAssessmentInput,
): CommunitySourceReviewSourceQualitySignal[] {
  const detected = new Map<
    CommunitySourceReviewSourceQualitySignalKind,
    CommunitySourceReviewSourceQualitySignal
  >();
  const bundle = sourceTextBundle(input);
  const hasUrl = input.sourceRefCount > 0;
  const hasDocumentType = hasDocumentTypeLike(bundle) || (input.materialRefs?.length ?? 0) > 0;
  const hasDate = hasDateLike(bundle);
  const hasPublisher = hasPublisherLike(bundle, input.sourceRefs ?? []);
  const hasQuote = hasQuoteOrExcerptLike(bundle);
  const hasContext = Boolean((input.claimText ?? "").trim()) || (input.notes?.length ?? 0) > 0;
  const suspiciousSource = (input.sourceRefs ?? []).some(suspiciousUrl);

  function addSignal(signal: CommunitySourceReviewSourceQualitySignalInput) {
    detected.set(signal.kind, createSourceQualitySignal(signal));
  }

  addSignal({
    kind: hasUrl ? "source_url_present" : "source_url_missing",
    note: hasUrl
      ? "Mindestens eine Quellen-URL ist vorhanden."
      : "Es fehlt eine konkrete Quellen-URL.",
  });

  addSignal({
    kind: suspiciousSource ? "source_domain_review_needed" : "context_provided",
    note: suspiciousSource
      ? "Die Domain oder URL-Struktur sollte vor Nutzung geprüft werden."
      : "Mindestens ein Kontextsignal ist vorhanden.",
  });

  addSignal({
    kind: hasPrimarySourceLike(bundle)
      ? "primary_source_claimed"
      : hasSecondarySourceLike(bundle)
        ? "secondary_source_claimed"
        : "weak_review_candidate",
    note: hasPrimarySourceLike(bundle)
      ? "Der Hinweis behauptet eine Primärquelle, verifiziert sie aber nicht."
      : hasSecondarySourceLike(bundle)
        ? "Der Hinweis verweist eher auf eine Sekundärquelle."
        : "Keine starke Quellenklassifikation erkennbar.",
  });

  addSignal({
    kind: hasDocumentType ? "document_type_provided" : "document_type_missing",
    note: hasDocumentType
      ? "Dokumenttyp oder Materialhinweis ist erkennbar."
      : "Dokumenttyp fehlt oder bleibt unklar.",
  });
  addSignal({
    kind: hasDate ? "date_provided" : "date_missing",
    note: hasDate ? "Ein Datum oder Zeitraum ist vorhanden." : "Es fehlt ein belastbarer Zeitbezug.",
  });
  addSignal({
    kind: hasPublisher ? "author_or_publisher_provided" : "author_or_publisher_missing",
    note: hasPublisher
      ? "Autor, Publisher oder Host-Kontext ist erkennbar."
      : "Autor oder Publisher fehlen.",
  });
  addSignal({
    kind: hasQuote ? "quote_or_excerpt_provided" : "quote_or_excerpt_missing",
    note: hasQuote ? "Zitat oder Auszug hilft bei der Prüfung." : "Kein Zitat oder Auszug vorhanden.",
  });
  addSignal({
    kind: hasContext ? "context_provided" : "context_missing",
    note: hasContext ? "Claim oder Zusatzkontext ist vorhanden." : "Kontext fehlt.",
  });

  if (!hasUrl && !hasDate && !hasPublisher && !hasQuote) {
    addSignal({
      kind: "unverifiable_reference",
      note: "Referenz bleibt ohne URL, Datum, Publisher oder Zitat schwer prüfbar.",
    });
  }
  if (suspiciousSource || input.moderation?.abuseReasons?.includes("misleading_source")) {
    addSignal({
      kind: "suspicious_source_quality",
      note: "Quellenqualität wirkt verdächtig und bleibt reviewpflichtig.",
    });
  }

  const qualityEvidenceCount = [
    hasUrl,
    hasDocumentType,
    hasDate,
    hasPublisher,
    hasQuote,
    hasContext,
  ].filter(Boolean).length;
  addSignal({
    kind:
      qualityEvidenceCount >= 4 && !suspiciousSource
        ? "strong_review_candidate"
        : "weak_review_candidate",
    note:
      qualityEvidenceCount >= 4 && !suspiciousSource
        ? "Starker Review-Kandidat, aber keine Verifikation."
        : "Schwache Beleglage bleibt review-first.",
  });

  for (const signal of input.moderation?.sourceQualitySignals ?? []) {
    detected.set(signal.kind, createSourceQualitySignal(signal));
  }

  return Array.from(detected.values());
}

export function summarizeCommunitySourceReviewSourceQualityState(
  input:
    | CommunitySourceReviewSourceQualityState
    | readonly CommunitySourceReviewSourceQualitySignal[],
  explicitLevel?: CommunitySourceReviewSourceQualityLevel | null,
): CommunitySourceReviewSourceQualityState {
  if ("sourceQualityLevel" in input && "reviewCandidateHint" in input) {
    return input;
  }

  const signals = [...input];
  const hasRestricted =
    signals.some((signal) =>
      signal.kind === "suspicious_source_quality" ||
      signal.kind === "unverifiable_reference" ||
      signal.kind === "source_domain_review_needed",
    ) && explicitLevel !== "strong_review_candidate";
  const hasStrong = signals.some((signal) => signal.kind === "strong_review_candidate");
  const hasUsable =
    signals.some((signal) => signal.kind === "source_url_present") &&
    signals.some((signal) =>
      signal.kind === "context_provided" ||
      signal.kind === "quote_or_excerpt_provided" ||
      signal.kind === "document_type_provided" ||
      signal.kind === "author_or_publisher_provided" ||
      signal.kind === "date_provided",
    );

  const sourceQualityLevel =
    explicitLevel ??
    (hasRestricted
      ? "restricted"
      : hasStrong
        ? "strong_review_candidate"
        : hasUsable
          ? "usable_for_review"
          : signals.length > 0
            ? "weak"
            : "unknown");

  const reviewCandidateHint =
    sourceQualityLevel === "strong_review_candidate"
      ? "strong_review_candidate"
      : sourceQualityLevel === "usable_for_review"
        ? "usable_for_review"
        : "none";

  let summary = "Quellenqualität ist noch unklar.";
  if (sourceQualityLevel === "strong_review_candidate") {
    summary =
      "Quellenqualität wirkt für Review stark, verifiziert die Quelle aber nicht.";
  } else if (sourceQualityLevel === "usable_for_review") {
    summary =
      "Quellenqualität hilft bei der Einordnung, bleibt aber review-first.";
  } else if (sourceQualityLevel === "restricted") {
    summary =
      "Quellenqualität bleibt eingeschränkt und blockiert Nutzung bis zur Prüfung.";
  } else if (sourceQualityLevel === "weak") {
    summary =
      "Quellenqualität bleibt schwach. Niedrige Qualität bedeutet keine automatische Löschung.";
  }

  return {
    signals,
    sourceQualityLevel,
    reviewBlocked: sourceQualityLevel === "restricted",
    reviewCandidateHint,
    summary,
  };
}

export function deriveCommunitySourceReviewTrustSignals(
  input: CommunitySourceReviewModerationAssessmentInput,
  params: {
    abuseState: CommunitySourceReviewAbuseState;
    sourceQualityState: CommunitySourceReviewSourceQualityState;
  },
): CommunitySourceReviewTrustSignal[] {
  const detected = new Map<
    CommunitySourceReviewTrustSignalKind,
    CommunitySourceReviewTrustSignal
  >();
  const normalizedTrustLevel = normalizeTrustLevel(input.moderation?.trustLevel);

  function addSignal(signal: CommunitySourceReviewTrustSignalInput) {
    detected.set(signal.kind, createTrustSignal(signal));
  }

  if (input.history?.priorAllowedHint || input.moderation?.moderationStatus === "allowed_as_hint") {
    addSignal({
      kind: "prior_allowed_hint",
      note: "Der Hinweis war bereits einmal als Hint im Review-Pfad erlaubt.",
      detectedFrom: "history",
    });
  }
  if (input.history?.priorRejectedHint || input.moderation?.moderationStatus === "rejected_abuse") {
    addSignal({
      kind: "prior_rejected_hint",
      note: "Es existiert eine frühere Zurückweisung im Review-Pfad.",
      detectedFrom: "history",
    });
  }
  if (
    input.history?.priorSourceReviewRouted ||
    input.moderation?.trustSignals?.some((signal) => signal.kind === "prior_source_review_routed")
  ) {
    addSignal({
      kind: "prior_source_review_routed",
      note: "Der Hinweis war bereits in der Quellenprüfung.",
      detectedFrom: "history",
    });
  }
  if (
    input.history?.priorEditorialReviewRouted ||
    input.moderation?.trustSignals?.some(
      (signal) => signal.kind === "prior_editorial_review_routed",
    )
  ) {
    addSignal({
      kind: "prior_editorial_review_routed",
      note: "Der Hinweis war bereits in der redaktionellen Prüfung.",
      detectedFrom: "history",
    });
  }
  if (params.abuseState.signals.length > 0 || (input.moderation?.abuseReasons?.length ?? 0) > 0) {
    addSignal({
      kind: "prior_abuse_signal",
      note: "Abuse-/Spam-Signale begrenzen Trust bis zur Prüfung.",
    });
  }
  if (
    input.history?.contributorContextAvailable ||
    normalizedTrustLevel !== "unknown" ||
    (input.moderation?.trustSignalsReviewedAt ?? null) !== null
  ) {
    addSignal({
      kind: "contributor_context_available",
      note: "Es gibt internen Contributor-Kontext zur Einordnung.",
    });
  } else {
    addSignal({
      kind: "contributor_context_missing",
      note: "Es fehlt belastbarer Contributor-Kontext.",
    });
  }

  if (
    input.relatedContributionCount >= 3 &&
    params.sourceQualityState.sourceQualityLevel !== "weak" &&
    params.sourceQualityState.sourceQualityLevel !== "restricted" &&
    !params.abuseState.usageBlocked
  ) {
    addSignal({
      kind: "repeated_quality_contribution",
      note: "Wiederholte Beiträge priorisieren höchstens Review.",
    });
  }
  if (
    input.relatedContributionCount >= 3 &&
    (params.sourceQualityState.sourceQualityLevel === "weak" ||
      params.sourceQualityState.sourceQualityLevel === "restricted" ||
      params.abuseState.usageBlocked)
  ) {
    addSignal({
      kind: "repeated_low_quality_contribution",
      note: "Wiederholte schwache Beiträge erzeugen keine Glaubwürdigkeitsautomatik.",
    });
  }

  for (const signal of input.moderation?.trustSignals ?? []) {
    detected.set(signal.kind, createTrustSignal(signal));
  }

  return Array.from(detected.values());
}

export function summarizeCommunitySourceReviewTrustState(
  input:
    | CommunitySourceReviewTrustState
    | readonly CommunitySourceReviewTrustSignal[],
  explicitTrustLevel?: CommunitySourceReviewTrustLevel | CommunitySourceReviewLegacyTrustLevel | null,
): CommunitySourceReviewTrustState {
  if ("trustLevel" in input && "reviewOnlyHint" in input) {
    return input;
  }

  const signals = [...input];
  const normalizedExplicit = normalizeTrustLevel(explicitTrustLevel ?? undefined);
  const hasRestrictedSignal = signals.some((signal) =>
    signal.kind === "prior_abuse_signal" ||
    signal.kind === "prior_rejected_hint" ||
    signal.kind === "repeated_low_quality_contribution",
  );
  const hasHighSignal = signals.some((signal) =>
    signal.kind === "repeated_quality_contribution" ||
    signal.kind === "prior_allowed_hint",
  );
  const hasMediumSignal = signals.some((signal) =>
    signal.kind === "prior_source_review_routed" ||
    signal.kind === "prior_editorial_review_routed",
  );
  const trustLevel =
    normalizedExplicit !== "unknown"
      ? normalizedExplicit
      : hasRestrictedSignal
        ? "restricted"
        : hasHighSignal
          ? "high"
          : hasMediumSignal
            ? "medium"
            : signals.some((signal) => signal.kind === "contributor_context_available")
              ? "low"
              : "unknown";

  let summary = "Trust bleibt unbekannt und erzeugt keine Wahrheit.";
  if (trustLevel === "high") {
    summary =
      "Trust priorisiert Prüfung, bestätigt aber keine Wahrheit.";
  } else if (trustLevel === "medium" || trustLevel === "low") {
    summary =
      "Contributor-Historie hilft nur bei der Einordnung und ist kein Glaubwürdigkeitsbeweis.";
  } else if (trustLevel === "restricted") {
    summary =
      "Trust bleibt eingeschränkt und blockiert die Nutzung bis zum Review.";
  }

  return {
    signals,
    trustLevel,
    reviewBlocked: trustLevel === "restricted",
    reviewOnlyHint: trustLevel !== "unknown",
    summary,
  };
}

export function canPrioritizeCommunityHintForReview(
  input:
    | CommunitySourceReviewModerationSignal
    | {
        trustState: CommunitySourceReviewTrustState;
        sourceQualityState: CommunitySourceReviewSourceQualityState;
      },
): boolean {
  const trustState = input.trustState;
  const sourceQualityState = input.sourceQualityState;
  return (
    !trustState.reviewBlocked &&
    !sourceQualityState.reviewBlocked &&
    (trustState.trustLevel === "high" ||
      sourceQualityState.sourceQualityLevel === "strong_review_candidate" ||
      sourceQualityState.sourceQualityLevel === "usable_for_review")
  );
}

export function blocksTrustAsTruth(
  _input:
    | CommunitySourceReviewTrustState
    | CommunitySourceReviewModerationSignal,
): boolean {
  return true;
}

export function blocksSourceQualityAsVerification(
  _input:
    | CommunitySourceReviewSourceQualityState
    | CommunitySourceReviewModerationSignal,
): boolean {
  return true;
}

export function getCommunityHintTrustQualityBlockers(
  input:
    | CommunitySourceReviewModerationSignal
    | {
        trustState: CommunitySourceReviewTrustState;
        sourceQualityState: CommunitySourceReviewSourceQualityState;
        trustSignalsReviewedAt?: string | null;
        sourceQualityReviewedAt?: string | null;
      },
): CommunitySourceReviewModerationBlocker[] {
  const blockers: CommunitySourceReviewModerationBlocker[] = [];
  if (input.trustState.signals.length > 0) blockers.push("trust_review_only");
  if (input.trustState.reviewBlocked && !input.trustSignalsReviewedAt) {
    blockers.push("trust_restricted_until_reviewed");
  }
  if (input.trustState.signals.length > 0) blockers.push("trust_history_not_truth");
  if (input.sourceQualityState.signals.length > 0) blockers.push("source_quality_review_only");
  if (input.sourceQualityState.reviewBlocked && !input.sourceQualityReviewedAt) {
    blockers.push("source_quality_restricted_until_reviewed");
  }
  if (input.sourceQualityState.signals.length > 0) {
    blockers.push("source_quality_not_verification");
  }
  if (canPrioritizeCommunityHintForReview(input)) {
    blockers.push("review_priority_trust_quality_only");
  }
  return unique(blockers);
}

function deriveRiskLevel(
  input: CommunitySourceReviewModerationAssessmentInput,
  reasons: readonly CommunitySourceReviewAbuseReason[],
  abuseState: CommunitySourceReviewAbuseState,
  sourceQualityState: CommunitySourceReviewSourceQualityState,
): CommunitySourceReviewRiskLevel {
  if (input.moderation?.riskLevel) return input.moderation.riskLevel;

  if (
    hasReason(reasons, "personal_data") ||
    hasReason(reasons, "harassment") ||
    hasReason(reasons, "unsafe_content") ||
    hasReason(reasons, "coordinated_manipulation") ||
    abuseState.highestSeverity === "critical"
  ) {
    return "critical";
  }

  if (
    hasReason(reasons, "spam") ||
    hasReason(reasons, "misleading_source") ||
    hasReason(reasons, "off_topic") ||
    abuseState.highestSeverity === "high" ||
    sourceQualityState.sourceQualityLevel === "restricted" ||
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
    abuseState.highestSeverity === "medium" ||
    sourceQualityState.sourceQualityLevel === "weak" ||
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
  abuseState: CommunitySourceReviewAbuseState,
  trustState: CommunitySourceReviewTrustState,
  sourceQualityState: CommunitySourceReviewSourceQualityState,
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

  if (abuseState.effectiveDisposition === "hide_until_reviewed") {
    return "hidden_pending_review";
  }

  if (
    hasReason(reasons, "duplicate") ||
    hasReason(reasons, "off_topic") ||
    hasReason(reasons, "misleading_source") ||
    hasReason(reasons, "unverifiable_claim") ||
    abuseState.usageBlocked ||
    trustState.reviewBlocked ||
    sourceQualityState.reviewBlocked ||
    riskLevel === "high" ||
    riskLevel === "critical"
  ) {
    return "needs_moderation";
  }

  return "pending_review";
}

function deriveTrustLevel(
  input: CommunitySourceReviewModerationAssessmentInput,
  trustState: CommunitySourceReviewTrustState,
): CommunitySourceReviewTrustLevel {
  return trustState.trustLevel;
}

function deriveSourceQualityLevel(
  input: CommunitySourceReviewModerationAssessmentInput,
  sourceQualityState: CommunitySourceReviewSourceQualityState,
): CommunitySourceReviewSourceQualityLevel {
  if (input.moderation?.sourceQualityLevel) {
    return input.moderation.sourceQualityLevel;
  }
  return sourceQualityState.sourceQualityLevel;
}

function hasBlockingAbuseReason(
  reasons: readonly CommunitySourceReviewAbuseReason[],
): boolean {
  return reasons.some((reason) => reason !== "unverifiable_claim");
}

export function canExposeCommunityContributionPublicly(
  signal: CommunitySourceReviewModerationSignal,
): boolean {
  return (
    signal.moderationStatus === "allowed_as_hint" &&
    signal.abuseReasons.length === 0 &&
    signal.abuseSignals.length === 0 &&
    (signal.riskLevel === "low" || signal.riskLevel === "medium")
  );
}

export function canEscalateCommunityContributionToEditorial(
  signal: CommunitySourceReviewModerationSignal,
): boolean {
  if (signal.moderationStatus === "rejected_abuse") return false;
  if (signal.moderationStatus === "escalated_to_editorial") return true;
  if (signal.abuseState.escalationRecommended) return true;
  if (signal.sourceQualityState.sourceQualityLevel === "restricted") return true;
  if (signal.abuseReasons.includes("misleading_source")) return true;
  if (signal.abuseReasons.includes("unverifiable_claim")) return true;
  if (signal.abuseReasons.includes("coordinated_manipulation")) return true;
  return signal.riskLevel === "high" || signal.riskLevel === "critical";
}

export function shouldRequireHumanModeration(
  signal: CommunitySourceReviewModerationSignal,
): boolean {
  return (
    signal.moderationStatus !== "allowed_as_hint" ||
    signal.abuseSignals.length > 0 ||
    signal.trustSignals.length > 0 ||
    signal.sourceQualitySignals.length > 0
  );
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
  if (signal.abuseSignals.length > 0) {
    return signal.abuseState.summary;
  }
  if (signal.trustState.reviewBlocked) {
    return signal.trustState.summary;
  }
  if (signal.sourceQualityState.reviewBlocked) {
    return signal.sourceQualityState.summary;
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

  blockers.push(...getCommunityHintAbuseBlockers(signal));
  blockers.push(...getCommunityHintTrustQualityBlockers(signal));

  if (signal.moderationStatus === "hidden_pending_review") {
    blockers.push("hidden_pending_review");
  }
  if (signal.moderationStatus === "rejected_abuse") {
    blockers.push("rejected_abuse");
  }
  if (!signal.canExposePublicly) {
    blockers.push("public_exposure_requires_moderation_safe_status");
  }

  return unique(blockers);
}

export function assessCommunitySourceReviewContributionRisk(
  input: CommunitySourceReviewModerationAssessmentInput,
): CommunitySourceReviewModerationSignal {
  const abuseReasons = uniqueReasons(input.moderation?.abuseReasons ?? []);
  const abuseSignals = detectCommunitySourceReviewAbuseSignals(input);
  const abuseState = summarizeCommunitySourceReviewAbuseState(abuseSignals);
  const sourceQualitySignals = deriveCommunitySourceReviewSourceQualitySignals(input);
  const sourceQualityState = summarizeCommunitySourceReviewSourceQualityState(
    sourceQualitySignals,
    input.moderation?.sourceQualityLevel ?? null,
  );
  const trustSignals = deriveCommunitySourceReviewTrustSignals(input, {
    abuseState,
    sourceQualityState,
  });
  const trustState = summarizeCommunitySourceReviewTrustState(
    trustSignals,
    input.moderation?.trustLevel ?? null,
  );
  const trustLevel = deriveTrustLevel(input, trustState);
  const sourceQualityLevel = deriveSourceQualityLevel(input, sourceQualityState);
  const riskLevel = deriveRiskLevel(
    input,
    abuseReasons,
    abuseState,
    sourceQualityState,
  );
  const moderationStatus = deriveModerationStatus(
    input,
    abuseReasons,
    abuseState,
    trustState,
    sourceQualityState,
    riskLevel,
  );

  const provisionalSignal: CommunitySourceReviewModerationSignal = {
    moderationStatus,
    trustLevel,
    trustSignals,
    trustState,
    sourceQualityLevel,
    sourceQualitySignals,
    sourceQualityState,
    riskLevel,
    abuseReasons,
    abuseSignals,
    abuseState,
    abuseSeverity: abuseState.highestSeverity,
    abuseDisposition: abuseState.effectiveDisposition,
    trustSignalsReviewedAt: input.moderation?.trustSignalsReviewedAt ?? null,
    trustSignalsReviewedBy: input.moderation?.trustSignalsReviewedBy ?? null,
    sourceQualityReviewedAt: input.moderation?.sourceQualityReviewedAt ?? null,
    sourceQualityReviewedBy: input.moderation?.sourceQualityReviewedBy ?? null,
    requiresHumanModeration: moderationStatus !== "allowed_as_hint",
    canExposePublicly: false,
    canEscalateToEditorial: false,
    canUseHintDespiteAbuseSignals: canUseCommunityHintDespiteAbuseSignals(abuseState),
    reviewPriority:
      input.moderation?.reviewPriorityOverride ??
      (canPrioritizeCommunityHintForReview({
        trustState,
        sourceQualityState,
      })
        ? "prioritized"
        : "standard"),
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
    requiresHumanModeration:
      shouldRequireHumanModeration(signal) ||
      hasBlockingAbuseReason(abuseReasons) ||
      trustState.reviewBlocked ||
      sourceQualityState.reviewBlocked,
    summary: summarizeCommunityContributionModerationState(signal),
  };
}
