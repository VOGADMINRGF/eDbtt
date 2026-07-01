import {
  getCommunitySourceReviewContributionKindLabel,
  getCommunitySourceReviewTargetLabel,
  type CommunitySourceReviewContribution,
} from "@/features/create/communitySourceReviewContribution";
import {
  getCommunitySourceReviewAbuseDispositionLabel,
  getCommunitySourceReviewAbuseSeverityLabel,
  getCommunitySourceReviewAbuseSignalKindLabel,
  getCommunitySourceReviewModerationStatusLabel,
  getCommunitySourceReviewRiskLevelLabel,
  getCommunitySourceReviewSourceQualityLevelLabel,
  getCommunitySourceReviewSourceQualitySignalKindLabel,
  getCommunitySourceReviewTrustLevelLabel,
  getCommunitySourceReviewTrustSignalKindLabel,
} from "@/features/create/communitySourceReviewModeration";
import {
  getCommunitySourceReviewDecisionStatusLabel,
  getCommunitySourceReviewHintBlockerLabel,
  getCommunitySourceReviewRouteTargetLabel,
  listCommunitySourceReviewAudits,
  listCommunitySourceReviewRecords,
  type CommunitySourceReviewAuditEntry,
  type CommunitySourceReviewRecord,
  type CommunitySourceReviewWorkbenchPriorityOverride,
} from "@/features/create/communitySourceReviewServer";

export const COMMUNITY_SOURCE_REVIEW_WORKBENCH_STATUSES = [
  "new",
  "queued_for_moderation",
  "needs_source_review",
  "needs_editorial_review",
  "escalated",
  "allowed_as_hint",
  "hidden",
  "rejected",
  "archived",
] as const;

export type CommunitySourceReviewWorkbenchStatus =
  (typeof COMMUNITY_SOURCE_REVIEW_WORKBENCH_STATUSES)[number];

export const COMMUNITY_SOURCE_REVIEW_WORKBENCH_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;

export type CommunitySourceReviewWorkbenchPriority =
  (typeof COMMUNITY_SOURCE_REVIEW_WORKBENCH_PRIORITIES)[number];

export const COMMUNITY_SOURCE_REVIEW_WORKBENCH_SIGNALS = [
  "spam_suspected",
  "abuse_suspected",
  "duplicate_suspected",
  "high_volume",
  "trust_signal",
  "source_quality_signal",
  "escalation_requested",
  "source_review_requested",
  "editorial_review_requested",
] as const;

export type CommunitySourceReviewWorkbenchSignal =
  (typeof COMMUNITY_SOURCE_REVIEW_WORKBENCH_SIGNALS)[number];

export const COMMUNITY_SOURCE_REVIEW_WORKBENCH_ACTIONS = [
  "allow_as_hint",
  "hide_hint",
  "reject_hint",
  "escalate_hint",
  "mark_needs_source_review",
  "mark_needs_editorial_review",
  "set_priority",
  "archive",
  "add_internal_note",
] as const;

export type CommunitySourceReviewWorkbenchAction =
  (typeof COMMUNITY_SOURCE_REVIEW_WORKBENCH_ACTIONS)[number];

export type CommunitySourceReviewWorkbenchAuditEvent = {
  id: string;
  action: CommunitySourceReviewAuditEntry["action"];
  label: string;
  note: string | null;
  actorUserId: string | null;
  at: string;
  workbenchPriority: CommunitySourceReviewWorkbenchPriority | null;
};

export type CommunitySourceReviewWorkbenchSignalEntry = {
  kind: CommunitySourceReviewWorkbenchSignal;
  label: string;
  detail: string;
};

export type CommunitySourceReviewWorkbenchItem = {
  id: string;
  origin: "public_submission" | "community_contribution";
  originLabel: string;
  originDetail: string;
  kind: CommunitySourceReviewContribution["kind"];
  kindLabel: string;
  title: string;
  body: string;
  targetLabel: string;
  targetId: string | null;
  claimText: string | null;
  status: CommunitySourceReviewWorkbenchStatus;
  statusLabel: string;
  priority: CommunitySourceReviewWorkbenchPriority;
  priorityLabel: string;
  moderationStatusLabel: string;
  decisionStatusLabel: string;
  routeTargetLabel: string;
  reviewPriorityLabel: string;
  trustLevelLabel: string;
  sourceQualityLevelLabel: string;
  riskLevelLabel: string;
  sourceRefs: string[];
  materialRefs: string[];
  signals: CommunitySourceReviewWorkbenchSignalEntry[];
  availableActions: CommunitySourceReviewWorkbenchAction[];
  guardrails: string[];
  blockerLabels: string[];
  auditTrail: CommunitySourceReviewWorkbenchAuditEvent[];
  latestAudit: CommunitySourceReviewWorkbenchAuditEvent | null;
  internalNotes: CommunitySourceReviewWorkbenchAuditEvent[];
  staleHours: number;
  pendingTooLong: boolean;
  lastUpdatedAt: string;
  priorityOverride: CommunitySourceReviewWorkbenchPriorityOverride | null;
};

export type CommunitySourceReviewWorkbenchSummary = {
  total: number;
  active: number;
  archived: number;
  newCount: number;
  queuedForModerationCount: number;
  needsSourceReviewCount: number;
  needsEditorialReviewCount: number;
  escalatedCount: number;
  hiddenOrRejectedCount: number;
  urgentCount: number;
  highCount: number;
  pendingTooLongCount: number;
};

export type CommunitySourceReviewWorkbenchUiItem =
  CommunitySourceReviewWorkbenchItem;

function findNotePrefix(
  notes: readonly string[],
  prefix: string,
): string | null {
  const match = notes.find((note) => note.startsWith(prefix));
  if (!match) return null;
  return match.slice(prefix.length).trim() || null;
}

function isPublicSubmissionRecord(record: CommunitySourceReviewRecord) {
  return record.contribution.notes.some(
    (note) => note === "Öffentlicher Intake: review-first API",
  );
}

function mapPublicOrigin(record: CommunitySourceReviewRecord) {
  if (isPublicSubmissionRecord(record)) {
    const room =
      findNotePrefix(
        record.contribution.notes,
        "Öffentlicher Beteiligungsraum: ",
      ) ?? null;
    return {
      origin: "public_submission" as const,
      originLabel: "Öffentliche Submission",
      originDetail: room
        ? `Eingang über den gehärteten Public-Submission-Pfad · Raum: ${room}`
        : "Eingang über den gehärteten Public-Submission-Pfad",
    };
  }
  return {
    origin: "community_contribution" as const,
    originLabel: "Community-Review-Beitrag",
    originDetail:
      "Bestehender review-first Community-Hinweis ohne öffentliche Wahrheits- oder Publish-Logik.",
  };
}

function priorityLabel(
  priority: CommunitySourceReviewWorkbenchPriority,
): string {
  if (priority === "urgent") return "Urgent";
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Normal";
}

function actionLabel(
  action: CommunitySourceReviewWorkbenchAction,
): string {
  if (action === "allow_as_hint") return "Als Hinweis zulassen";
  if (action === "hide_hint") return "Verstecken";
  if (action === "reject_hint") return "Ablehnen";
  if (action === "escalate_hint") return "Eskalieren";
  if (action === "mark_needs_source_review") return "Quellenprüfung anfordern";
  if (action === "mark_needs_editorial_review") {
    return "Redaktionelle Prüfung anfordern";
  }
  if (action === "set_priority") return "Priorität setzen";
  if (action === "archive") return "Archivieren";
  return "Interne Notiz ergänzen";
}

function mapAuditLabel(action: CommunitySourceReviewAuditEntry["action"]) {
  if (action === "draft_saved") return "Entwurf gespeichert";
  if (action === "signal_detected") return "Signal erkannt";
  if (action === "signal_reviewed") return "Signal geprüft";
  if (action === "moderation_action_taken") return "Moderationsaktion ausgeführt";
  if (action === "escalation_recommended") return "Eskalation empfohlen";
  if (action === "trust_signal_derived") return "Trust-Signal abgeleitet";
  if (action === "source_quality_signal_derived") {
    return "Quellenqualität abgeleitet";
  }
  if (action === "review_priority_changed") return "Review-Priorität geändert";
  if (action === "source_quality_reviewed") return "Quellenqualität geprüft";
  if (action === "trust_quality_reviewed") return "Trust/Quality geprüft";
  if (action === "hint_allowed") return "Als Hinweis erlaubt";
  if (action === "hint_hidden") return "Hinweis verborgen";
  if (action === "hint_rejected") return "Hinweis zurückgewiesen";
  if (action === "hint_escalated") return "Hinweis eskaliert";
  if (action === "source_review_requested") return "Zur Quellenprüfung geroutet";
  if (action === "editorial_review_requested") {
    return "Zur Redaktion geroutet";
  }
  if (action === "workbench_priority_set") return "Workbench-Priorität gesetzt";
  if (action === "item_archived") return "Workbench-Item archiviert";
  return "Interne Notiz ergänzt";
}

function mapWorkbenchPriorityOverride(
  priority: CommunitySourceReviewWorkbenchPriorityOverride | null | undefined,
): CommunitySourceReviewWorkbenchPriority | null {
  if (!priority) return null;
  return priority;
}

function getWorkbenchStatus(
  record: CommunitySourceReviewRecord,
): CommunitySourceReviewWorkbenchStatus {
  if (record.archivedAt) return "archived";
  if (record.routeTarget === "source_review") return "needs_source_review";
  if (
    record.routeTarget === "editorial_review" &&
    record.decisionStatus !== "escalated"
  ) {
    return "needs_editorial_review";
  }
  if (
    record.decisionStatus === "escalated" ||
    record.contribution.kind === "escalation_request"
  ) {
    return "escalated";
  }
  if (record.decisionStatus === "allowed_as_hint") return "allowed_as_hint";
  if (record.decisionStatus === "hidden") return "hidden";
  if (record.decisionStatus === "rejected") return "rejected";
  if (
    record.contribution.moderation.moderationStatus === "needs_moderation" ||
    record.contribution.moderation.moderationStatus === "hidden_pending_review" ||
    record.contribution.moderation.abuseSignals.length > 0 ||
    record.contribution.moderation.abuseReasons.length > 0
  ) {
    return "queued_for_moderation";
  }
  return "new";
}

function getWorkbenchStatusLabel(
  status: CommunitySourceReviewWorkbenchStatus,
): string {
  if (status === "new") return "Neu";
  if (status === "queued_for_moderation") return "Zur Moderation";
  if (status === "needs_source_review") return "Quellenprüfung offen";
  if (status === "needs_editorial_review") return "Redaktion offen";
  if (status === "escalated") return "Eskaliert";
  if (status === "allowed_as_hint") return "Als Hinweis erlaubt";
  if (status === "hidden") return "Versteckt";
  if (status === "rejected") return "Abgelehnt";
  return "Archiviert";
}

function pendingHours(updatedAt: string) {
  const parsed = Date.parse(updatedAt);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round((Date.now() - parsed) / 36e5));
}

function derivePriority(
  record: CommunitySourceReviewRecord,
  status: CommunitySourceReviewWorkbenchStatus,
  signals: CommunitySourceReviewWorkbenchSignalEntry[],
): CommunitySourceReviewWorkbenchPriority {
  const override = mapWorkbenchPriorityOverride(record.workbenchPriorityOverride);
  if (override) return override;
  if (status === "archived" || status === "hidden" || status === "rejected") {
    return "low";
  }
  if (
    status === "escalated" ||
    signals.some(
      (signal) =>
        signal.kind === "escalation_requested" ||
        signal.kind === "abuse_suspected",
    ) ||
    record.contribution.moderation.abuseSeverity === "critical"
  ) {
    return "urgent";
  }
  if (
    status === "needs_source_review" ||
    status === "needs_editorial_review" ||
    record.contribution.moderation.reviewPriority === "prioritized" ||
    record.contribution.moderation.sourceQualityLevel ===
      "strong_review_candidate" ||
    record.contribution.moderation.trustLevel === "high" ||
    signals.some(
      (signal) =>
        signal.kind === "duplicate_suspected" ||
        signal.kind === "high_volume" ||
        signal.kind === "source_quality_signal",
    )
  ) {
    return "high";
  }
  return "normal";
}

function pushSignal(
  entries: CommunitySourceReviewWorkbenchSignalEntry[],
  entry: CommunitySourceReviewWorkbenchSignalEntry,
) {
  if (entries.some((existing) => existing.kind === entry.kind)) return;
  entries.push(entry);
}

export function getWorkbenchItemSignals(
  record: CommunitySourceReviewRecord,
): CommunitySourceReviewWorkbenchSignalEntry[] {
  const entries: CommunitySourceReviewWorkbenchSignalEntry[] = [];

  if (
    record.contribution.moderation.abuseReasons.includes("spam") ||
    record.contribution.moderation.abuseSignals.some(
      (signal) => signal.kind === "possible_spam",
    )
  ) {
    pushSignal(entries, {
      kind: "spam_suspected",
      label: "Spam vermutet",
      detail: "Spam-/Kurzlink- oder Ballungssignal aktiv.",
    });
  }

  if (
    record.contribution.moderation.abuseReasons.some((reason) => reason !== "spam") ||
    record.contribution.moderation.abuseSignals.some((signal) =>
      ["possible_abuse", "coordinated_activity_signal", "escalation_risk"].includes(
        signal.kind,
      ),
    )
  ) {
    pushSignal(entries, {
      kind: "abuse_suspected",
      label: "Abuse-Signal",
      detail:
        "Moderations- oder Missbrauchssignal aktiv. Das ist kein Wahrheits- oder Publish-Urteil.",
    });
  }

  if (
    record.contribution.moderation.abuseState.duplicateOrRepeatedHint ||
    record.contribution.moderation.abuseReasons.includes("duplicate")
  ) {
    pushSignal(entries, {
      kind: "duplicate_suspected",
      label: "Duplikat-/Mehrfachsignal",
      detail: "Wiederholung oder mögliche Dublette erkannt; das ist keine Widerlegung.",
    });
  }

  if (record.contribution.moderation.abuseState.excessiveVolumeHint) {
    pushSignal(entries, {
      kind: "high_volume",
      label: "Volumensignal",
      detail: "Viele ähnliche Hinweise erhöhen höchstens Moderationsbedarf, nicht Wahrheit.",
    });
  }

  if (
    record.contribution.moderation.trustSignals.length > 0 ||
    record.contribution.moderation.trustLevel !== "unknown"
  ) {
    pushSignal(entries, {
      kind: "trust_signal",
      label: "Trust-Signal",
      detail: "Trust priorisiert höchstens Review und verifiziert nichts.",
    });
  }

  if (
    record.contribution.moderation.sourceQualitySignals.length > 0 ||
    record.contribution.moderation.sourceQualityLevel !== "unknown"
  ) {
    pushSignal(entries, {
      kind: "source_quality_signal",
      label: "Quellenqualitäts-Signal",
      detail: "Quellenqualität ist Einordnungshilfe, keine Bestätigung oder Verifikation.",
    });
  }

  if (
    record.contribution.kind === "escalation_request" ||
    record.decisionStatus === "escalated"
  ) {
    pushSignal(entries, {
      kind: "escalation_requested",
      label: "Eskalation angefordert",
      detail: "Erhöhte Prüfung oder redaktionelle Weiterleitung angefordert.",
    });
  }

  if (record.routeTarget === "source_review") {
    pushSignal(entries, {
      kind: "source_review_requested",
      label: "Quellenprüfung angefordert",
      detail: "Explizit zur Quellenprüfung geroutet, aber ohne Factcheck-Ergebnis.",
    });
  }

  if (record.routeTarget === "editorial_review") {
    pushSignal(entries, {
      kind: "editorial_review_requested",
      label: "Redaktionelle Prüfung angefordert",
      detail: "Explizit zur Redaktion geroutet, aber ohne Veröffentlichung.",
    });
  }

  return entries;
}

export function getWorkbenchItemGuardrails(
  item: Pick<CommunitySourceReviewWorkbenchItem, "kind" | "signals">,
): string[] {
  const guardrails = [
    "Hinweis ist kein verifizierter Fakt.",
    "Freigabe als Hinweis bedeutet nicht Veröffentlichung als Wahrheit.",
    "Trust- und Qualitätswerte dienen nur der Priorisierung.",
    "Keine Aktion schreibt in Graph, Merge oder Entitätserstellung.",
    "Keine Aktion veröffentlicht direkt und keine Aktion startet DeepSearch.",
  ];
  if (item.kind === "counter_source") {
    guardrails.push("Gegenquelle bedeutet nicht automatisch Widerlegung.");
  }
  if (item.kind === "lived_experience") {
    guardrails.push(
      "Erfahrungsbericht bedeutet nicht repräsentative Evidenz.",
    );
  }
  if (item.signals.some((signal) => signal.kind === "high_volume")) {
    guardrails.push("Volumen oder Wiederholung bedeuten keine Wahrheit.");
  }
  return guardrails;
}

export function getWorkbenchItemAvailableActions(
  item: Pick<
    CommunitySourceReviewWorkbenchItem,
    "status" | "signals" | "kind" | "auditTrail"
  > & {
    record: CommunitySourceReviewRecord;
  },
): CommunitySourceReviewWorkbenchAction[] {
  const actions = new Set<CommunitySourceReviewWorkbenchAction>([
    "add_internal_note",
  ]);

  if (item.status === "archived") {
    return Array.from(actions);
  }

  actions.add("set_priority");
  actions.add("archive");

  if (item.status !== "hidden" && item.status !== "rejected") {
    actions.add("hide_hint");
    actions.add("reject_hint");
    actions.add("escalate_hint");
    actions.add("mark_needs_source_review");
    actions.add("mark_needs_editorial_review");
  }

  if (
    item.status !== "allowed_as_hint" &&
    item.status !== "hidden" &&
    item.status !== "rejected" &&
    !(
      item.record.contribution.moderation.trustState.reviewBlocked &&
      !item.record.contribution.moderation.trustSignalsReviewedAt
    )
  ) {
    actions.add("allow_as_hint");
  }

  return Array.from(actions);
}

export function createWorkbenchAuditEvent(
  audit: CommunitySourceReviewAuditEntry,
): CommunitySourceReviewWorkbenchAuditEvent {
  return {
    id: audit.id,
    action: audit.action,
    label: mapAuditLabel(audit.action),
    note: audit.reason,
    actorUserId: audit.actorUserId,
    at: audit.at,
    workbenchPriority: audit.workbenchPriority ?? null,
  };
}

function mapRecordToWorkbenchItem(
  record: CommunitySourceReviewRecord,
  audits: CommunitySourceReviewAuditEntry[],
): CommunitySourceReviewWorkbenchItem {
  const status = getWorkbenchStatus(record);
  const signals = getWorkbenchItemSignals(record);
  const priority = derivePriority(record, status, signals);
  const auditTrail = audits.map(createWorkbenchAuditEvent);
  const latestAudit = auditTrail[0] ?? null;
  const staleHours = pendingHours(record.updatedAt);
  const item: CommunitySourceReviewWorkbenchItem = {
    id: record.id,
    ...mapPublicOrigin(record),
    kind: record.contribution.kind,
    kindLabel: getCommunitySourceReviewContributionKindLabel(
      record.contribution.kind,
    ),
    title: record.contribution.title,
    body: record.contribution.text,
    targetLabel: getCommunitySourceReviewTargetLabel(record.contribution.target),
    targetId: record.contribution.targetId,
    claimText: record.contribution.claimText,
    status,
    statusLabel: getWorkbenchStatusLabel(status),
    priority,
    priorityLabel: priorityLabel(priority),
    moderationStatusLabel: getCommunitySourceReviewModerationStatusLabel(
      record.contribution.moderation.moderationStatus,
    ),
    decisionStatusLabel: getCommunitySourceReviewDecisionStatusLabel(
      record.decisionStatus,
    ),
    routeTargetLabel: getCommunitySourceReviewRouteTargetLabel(record.routeTarget),
    reviewPriorityLabel:
      record.contribution.moderation.reviewPriority === "prioritized"
        ? "priorisiert"
        : "standard",
    trustLevelLabel: getCommunitySourceReviewTrustLevelLabel(
      record.contribution.moderation.trustLevel,
    ),
    sourceQualityLevelLabel: getCommunitySourceReviewSourceQualityLevelLabel(
      record.contribution.moderation.sourceQualityLevel,
    ),
    riskLevelLabel: getCommunitySourceReviewRiskLevelLabel(
      record.contribution.moderation.riskLevel,
    ),
    sourceRefs: record.contribution.sourceRefs,
    materialRefs: record.contribution.materialRefs,
    signals,
    availableActions: [],
    guardrails: [],
    blockerLabels: record.blockers.map((blocker) =>
      getCommunitySourceReviewHintBlockerLabel(blocker),
    ),
    auditTrail,
    latestAudit,
    internalNotes: auditTrail.filter(
      (audit) => audit.action === "internal_note_added",
    ),
    staleHours,
    pendingTooLong: staleHours >= 72,
    lastUpdatedAt: record.updatedAt,
    priorityOverride: record.workbenchPriorityOverride ?? null,
  };

  item.availableActions = getWorkbenchItemAvailableActions({
    ...item,
    record,
  });
  item.guardrails = getWorkbenchItemGuardrails(item);
  return item;
}

export function mapPublicSubmissionToWorkbenchItem(
  record: CommunitySourceReviewRecord,
  audits: CommunitySourceReviewAuditEntry[],
) {
  return mapRecordToWorkbenchItem(record, audits);
}

export function mapContributionToWorkbenchItem(
  record: CommunitySourceReviewRecord,
  audits: CommunitySourceReviewAuditEntry[],
) {
  return mapRecordToWorkbenchItem(record, audits);
}

export function stripWorkbenchInternalFieldsForUi(
  item: CommunitySourceReviewWorkbenchItem,
): CommunitySourceReviewWorkbenchUiItem {
  return { ...item };
}

export function summarizeCommunitySourceReviewWorkbench(input: {
  items: readonly CommunitySourceReviewWorkbenchItem[];
}): CommunitySourceReviewWorkbenchSummary {
  const items = [...input.items];
  return {
    total: items.length,
    active: items.filter((item) => item.status !== "archived").length,
    archived: items.filter((item) => item.status === "archived").length,
    newCount: items.filter((item) => item.status === "new").length,
    queuedForModerationCount: items.filter(
      (item) => item.status === "queued_for_moderation",
    ).length,
    needsSourceReviewCount: items.filter(
      (item) => item.status === "needs_source_review",
    ).length,
    needsEditorialReviewCount: items.filter(
      (item) => item.status === "needs_editorial_review",
    ).length,
    escalatedCount: items.filter((item) => item.status === "escalated").length,
    hiddenOrRejectedCount: items.filter(
      (item) => item.status === "hidden" || item.status === "rejected",
    ).length,
    urgentCount: items.filter((item) => item.priority === "urgent").length,
    highCount: items.filter((item) => item.priority === "high").length,
    pendingTooLongCount: items.filter((item) => item.pendingTooLong).length,
  };
}

export async function listCommunitySourceReviewWorkbenchItems(input?: {
  limit?: number;
  includeArchived?: boolean;
}) {
  const limit = input?.limit ?? 80;
  const includeArchived = input?.includeArchived ?? true;
  const [records, audits] = await Promise.all([
    listCommunitySourceReviewRecords(limit),
    listCommunitySourceReviewAudits({ limit: limit * 4 }),
  ]);

  const items = records
    .map((record) => {
      const recordAudits = audits.filter(
        (audit) => audit.contributionId === record.id,
      );
      const item = isPublicSubmissionRecord(record)
        ? mapPublicSubmissionToWorkbenchItem(record, recordAudits)
        : mapContributionToWorkbenchItem(record, recordAudits);
      return stripWorkbenchInternalFieldsForUi(item);
    })
    .filter((item) => includeArchived || item.status !== "archived");

  return items;
}

export async function getCommunitySourceReviewWorkbenchItem(
  contributionId: string,
) {
  const normalized = String(contributionId ?? "").trim();
  if (!normalized) return null;
  const items = await listCommunitySourceReviewWorkbenchItems({
    limit: 200,
    includeArchived: true,
  });
  return items.find((item) => item.id === normalized) ?? null;
}

export function getCommunitySourceReviewWorkbenchPriorityLabel(
  priority: CommunitySourceReviewWorkbenchPriority,
) {
  return priorityLabel(priority);
}

export function getCommunitySourceReviewWorkbenchActionLabel(
  action: CommunitySourceReviewWorkbenchAction,
) {
  return actionLabel(action);
}

export function describeWorkbenchSignalEntry(
  signal: CommunitySourceReviewWorkbenchSignalEntry,
) {
  return `${signal.label} · ${signal.detail}`;
}

export function buildWorkbenchSignalDiagnostics(
  record: CommunitySourceReviewRecord,
) {
  return {
    abuseSignalSummary:
      record.contribution.moderation.abuseSignals.length > 0
        ? record.contribution.moderation.abuseSignals
            .map(
              (signal) =>
                `${getCommunitySourceReviewAbuseSignalKindLabel(signal.kind)} · ${getCommunitySourceReviewAbuseSeverityLabel(signal.severity)} · ${getCommunitySourceReviewAbuseDispositionLabel(signal.disposition)}`,
            )
            .join(" | ")
        : "keine Abuse-/Spam-Signale",
    trustSignalSummary:
      record.contribution.moderation.trustSignals.length > 0
        ? record.contribution.moderation.trustSignals
            .map((signal) =>
              getCommunitySourceReviewTrustSignalKindLabel(signal.kind),
            )
            .join(" | ")
        : "keine zusätzlichen Trust-Signale",
    sourceQualitySignalSummary:
      record.contribution.moderation.sourceQualitySignals.length > 0
        ? record.contribution.moderation.sourceQualitySignals
            .map((signal) =>
              getCommunitySourceReviewSourceQualitySignalKindLabel(signal.kind),
            )
            .join(" | ")
        : "keine zusätzlichen Quality-Signale",
  };
}
