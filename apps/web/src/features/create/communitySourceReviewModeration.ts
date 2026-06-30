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

export type CommunitySourceReviewModerationInput = {
  moderationStatus?: CommunitySourceReviewModerationStatus;
  trustLevel?: CommunitySourceReviewTrustLevel;
  riskLevel?: CommunitySourceReviewRiskLevel;
  abuseReasons?: readonly CommunitySourceReviewAbuseReason[];
  abuseSignals?: readonly CommunitySourceReviewAbuseSignalInput[];
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
  moderationFlags: CommunitySourceReviewGuardrailFlags;
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

export type CommunitySourceReviewModerationSignal = {
  moderationStatus: CommunitySourceReviewModerationStatus;
  trustLevel: CommunitySourceReviewTrustLevel;
  riskLevel: CommunitySourceReviewRiskLevel;
  abuseReasons: CommunitySourceReviewAbuseReason[];
  abuseSignals: CommunitySourceReviewAbuseSignal[];
  abuseState: CommunitySourceReviewAbuseState;
  abuseSeverity: CommunitySourceReviewAbuseSeverity;
  abuseDisposition: CommunitySourceReviewAbuseDisposition;
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
  if (trustLevel === "new_contributor") return "neuer Beitragender";
  if (trustLevel === "known_contributor") return "bekannter Beitragender";
  if (trustLevel === "trusted_contributor") return "vertrauenswürdiger Beitragender";
  return "redaktioneller Beitragender";
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

function deriveRiskLevel(
  input: CommunitySourceReviewModerationAssessmentInput,
  reasons: readonly CommunitySourceReviewAbuseReason[],
  abuseState: CommunitySourceReviewAbuseState,
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
    riskLevel === "high" ||
    riskLevel === "critical"
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
  if (signal.abuseReasons.includes("misleading_source")) return true;
  if (signal.abuseReasons.includes("unverifiable_claim")) return true;
  if (signal.abuseReasons.includes("coordinated_manipulation")) return true;
  return signal.riskLevel === "high" || signal.riskLevel === "critical";
}

export function shouldRequireHumanModeration(
  signal: CommunitySourceReviewModerationSignal,
): boolean {
  return signal.moderationStatus !== "allowed_as_hint" || signal.abuseSignals.length > 0;
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
  const trustLevel = deriveTrustLevel(input);
  const riskLevel = deriveRiskLevel(input, abuseReasons, abuseState);
  const moderationStatus = deriveModerationStatus(
    input,
    abuseReasons,
    abuseState,
    riskLevel,
  );

  const provisionalSignal: CommunitySourceReviewModerationSignal = {
    moderationStatus,
    trustLevel,
    riskLevel,
    abuseReasons,
    abuseSignals,
    abuseState,
    abuseSeverity: abuseState.highestSeverity,
    abuseDisposition: abuseState.effectiveDisposition,
    requiresHumanModeration: moderationStatus !== "allowed_as_hint",
    canExposePublicly: false,
    canEscalateToEditorial: false,
    canUseHintDespiteAbuseSignals: canUseCommunityHintDespiteAbuseSignals(abuseState),
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
    requiresHumanModeration:
      shouldRequireHumanModeration(signal) || hasBlockingAbuseReason(abuseReasons),
    summary: summarizeCommunityContributionModerationState(signal),
  };
}
