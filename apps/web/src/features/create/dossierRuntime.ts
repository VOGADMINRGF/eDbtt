import type { CreateHandoffReviewQueueItem } from "@/features/create/createHandoffReviewQueue";
import type { CommunitySourceReviewContribution } from "@/features/create/communitySourceReviewContribution";
import {
  buildPersistedCreateHandoffSuggestedTitle,
  buildPersistedCreateHandoffSummary,
  persistedCreateHandoffStatementId,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";

export const DOSSIER_RUNTIME_STATUSES = [
  "draft",
  "queued_for_review",
  "approved_for_creation",
  "created",
  "rejected",
  "blocked",
  "archived",
] as const;

export type DossierRuntimeStatus = (typeof DOSSIER_RUNTIME_STATUSES)[number];

export const DOSSIER_RUNTIME_CREATION_BLOCKERS = [
  "review_not_approved",
  "missing_title",
  "missing_summary",
  "source_review_pending",
  "moderation_pending",
  "unresolved_abuse_signal",
  "unresolved_trust_quality_blocker",
  "graph_context_pending",
  "unsafe_auto_create",
  "publish_not_allowed",
  "insufficient_audit_context",
] as const;

export type DossierRuntimeCreationBlocker =
  (typeof DOSSIER_RUNTIME_CREATION_BLOCKERS)[number];

export const DOSSIER_RUNTIME_SOURCE_STATUSES = [
  "not_checked",
  "source_review_requested",
  "source_review_pending",
  "source_reviewed",
  "disputed",
  "blocked",
] as const;

export type DossierRuntimeSourceStatus =
  (typeof DOSSIER_RUNTIME_SOURCE_STATUSES)[number];

export const DOSSIER_RUNTIME_VISIBILITIES = [
  "internal_review",
  "editorial_workspace",
  "ready_for_publish_review",
  "published",
] as const;

export type DossierRuntimeVisibility =
  (typeof DOSSIER_RUNTIME_VISIBILITIES)[number];

export type DossierRuntimeAuditContext = {
  actorUserId: string | null;
  reason: string | null;
  origin:
    | "create_handoff_review"
    | "admin_review"
    | "dossier_runtime"
    | null;
  approvedAt: string | null;
};

export type DossierRuntimeCommunitySignal = {
  contributionId: string;
  title: string;
  status: CommunitySourceReviewContribution["status"];
  kind: CommunitySourceReviewContribution["kind"];
  summary: string;
  trustLevel: CommunitySourceReviewContribution["moderation"]["trustLevel"];
  sourceQualityLevel: CommunitySourceReviewContribution["moderation"]["sourceQualityLevel"];
  reviewPriority: CommunitySourceReviewContribution["moderation"]["reviewPriority"];
  moderationStatus: CommunitySourceReviewContribution["moderation"]["moderationStatus"];
  hasAbuseBlocker: boolean;
  hasTrustQualityBlocker: boolean;
  sourceReviewPending: boolean;
  moderationPending: boolean;
};

export type DossierRuntimeDraft = {
  id: string;
  sourceHandoffId: string;
  sourceReviewItemId: string;
  statementId: string;
  title: string;
  workingTitle: string;
  summary: string;
  originQuestion: string | null;
  recognizedStandpoints: string[];
  argumentLines: string[];
  openQuestions: string[];
  sourceStatus: DossierRuntimeSourceStatus;
  communitySignals: DossierRuntimeCommunitySignal[];
  graphReferences: string[];
  topicReferences: string[];
  moderationPending: boolean;
  unresolvedAbuseSignal: boolean;
  unresolvedTrustQualityBlocker: boolean;
  graphContextPending: boolean;
  approvedForSetup: boolean;
  status: DossierRuntimeStatus;
  visibility: DossierRuntimeVisibility;
  blockers: DossierRuntimeCreationBlocker[];
  auditContext: DossierRuntimeAuditContext;
  createdDossierId: string | null;
  createdWorkspaceId: string | null;
  guardrails: {
    noAutoCreateFromAiAlone: true;
    noAutoPublish: true;
    noVerifiedFactsByDefault: true;
    noVerifiedSourcesByDefault: true;
    noCommunityHintsAsTruth: true;
    noTrustOrSourceQualityAsVerification: true;
    noGraphEdgeAsProof: true;
    noMajorityAsTruth: true;
    noAnlassraumCreation: true;
    noParticipationSpaceCreation: true;
    auditContextRequired: true;
  };
  createdAt: string;
  updatedAt: string;
};

export type DossierRuntimeAuditEntry = {
  id: string;
  sourceHandoffId: string;
  at: string;
  action:
    | "draft_derived"
    | "creation_approved"
    | "creation_rejected"
    | "creation_blocked"
    | "runtime_created";
  actorUserId: string | null;
  note: string | null;
  blockers: DossierRuntimeCreationBlocker[];
  status: DossierRuntimeStatus;
  dossierId?: string | null;
  workspaceId?: string | null;
};

export type DossierRuntimeRecord = DossierRuntimeDraft & {
  auditTrail: DossierRuntimeAuditEntry[];
  approvedForCreationAt: string | null;
  approvedForCreationBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
};

export type DossierRuntimeCreateDependencies = {
  creator: (input: {
    record: DossierRuntimeRecord;
    auditContext: DossierRuntimeAuditContext;
  }) => Promise<
    | {
        ok: true;
        createdAt?: string | null;
        dossierId: string;
        workspaceId?: string | null;
      }
    | {
        ok: false;
        error?: string;
      }
  >;
};

function nowIso() {
  return new Date().toISOString();
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function trimOrNull(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function sourceStatusFromCommunitySignals(
  signals: DossierRuntimeCommunitySignal[],
): DossierRuntimeSourceStatus {
  if (signals.some((signal) => signal.hasAbuseBlocker)) return "blocked";
  if (signals.some((signal) => signal.kind === "counter_source")) return "disputed";
  if (signals.some((signal) => signal.sourceReviewPending)) {
    return "source_review_pending";
  }
  if (signals.some((signal) => signal.status === "accepted_as_hint")) {
    return "source_reviewed";
  }
  if (signals.length > 0) return "source_review_requested";
  return "not_checked";
}

function mapCommunitySignal(
  contribution: CommunitySourceReviewContribution,
): DossierRuntimeCommunitySignal {
  const abuseBlocked = Boolean(
    contribution.moderation.abuseState.usageBlocked ||
      contribution.moderation.abuseState.evidenceBlocked ||
      contribution.moderation.abuseState.autoActionBlocked ||
      contribution.moderation.moderationStatus === "rejected_abuse",
  );
  const trustQualityBlocked = Boolean(
    contribution.moderation.trustState.reviewBlocked ||
      contribution.moderation.sourceQualityState.reviewBlocked,
  );
  const sourcePending =
    contribution.status === "pending_review" ||
    contribution.status === "submitted" ||
    contribution.moderation.sourceQualityState.reviewCandidateHint !== "none";
  const moderationPending =
    contribution.status === "needs_moderation" ||
    contribution.moderation.moderationStatus === "needs_moderation" ||
    contribution.moderation.moderationStatus === "hidden_pending_review";

  return {
    contributionId: contribution.id,
    title: contribution.title,
    status: contribution.status,
    kind: contribution.kind,
    summary: contribution.moderation.summary,
    trustLevel: contribution.moderation.trustLevel,
    sourceQualityLevel: contribution.moderation.sourceQualityLevel,
    reviewPriority: contribution.moderation.reviewPriority,
    moderationStatus: contribution.moderation.moderationStatus,
    hasAbuseBlocker: abuseBlocked,
    hasTrustQualityBlocker: trustQualityBlocked,
    sourceReviewPending: sourcePending,
    moderationPending,
  };
}

function buildRecognizedStandpoints(record: PersistedCreateHandoffRecord) {
  const argumentStandpoints = record.arguments.map((argument) => {
    if (argument.stance === "pro") return `Pro: ${argument.text}`;
    if (argument.stance === "contra") return `Contra: ${argument.text}`;
    if (argument.stance === "mixed") return `Gemischt: ${argument.text}`;
    return `Standpunkt offen: ${argument.text}`;
  });
  if (argumentStandpoints.length > 0) return unique(argumentStandpoints);

  const claimStandpoints = record.claims.map((claim) => claim.text);
  if (claimStandpoints.length > 0) return unique(claimStandpoints);

  return unique([record.sourceText]);
}

function buildArgumentLines(record: PersistedCreateHandoffRecord) {
  const lines = record.arguments.map((argument) => argument.text);
  if (lines.length > 0) return unique(lines);
  return unique(record.claims.map((claim) => claim.text));
}

function buildOpenQuestions(record: PersistedCreateHandoffRecord) {
  const fromDraft = record.openQuestions.map((question) => question.question);
  const fromPlanner = record.plannerResult.openQuestions ?? [];
  return unique([...fromDraft, ...fromPlanner]);
}

function buildGraphReferences(record: PersistedCreateHandoffRecord) {
  const refs = [
    ...(record.graphMatches.matches ?? []).map((match) => match.label),
    ...(record.graphMatches.matchedDossiers ?? []),
    ...(record.graphMatches.matchedAnlassraeume ?? []),
    ...(record.graphMatches.matchedTopics ?? []),
  ];
  return unique(refs);
}

function buildTopicReferences(record: PersistedCreateHandoffRecord) {
  return unique([
    record.topicSeed.topicLabel,
    ...(record.plannerResult.topicCandidates ?? []),
    ...(record.graphMatches.matchedTopics ?? []),
  ]);
}

function buildGuardrailBlockers(
  draft: Pick<
    DossierRuntimeDraft,
    | "guardrails"
    | "visibility"
    | "title"
    | "summary"
    | "sourceStatus"
    | "moderationPending"
    | "unresolvedAbuseSignal"
    | "unresolvedTrustQualityBlocker"
    | "graphContextPending"
    | "status"
    | "auditContext"
  >,
) {
  const blockers: DossierRuntimeCreationBlocker[] = [];

  if (draft.status !== "approved_for_creation" && draft.status !== "created") {
    blockers.push("review_not_approved");
  }
  if (!hasText(draft.title)) blockers.push("missing_title");
  if (!hasText(draft.summary)) blockers.push("missing_summary");
  if (draft.sourceStatus === "source_review_pending") {
    blockers.push("source_review_pending");
  }
  if (draft.moderationPending) blockers.push("moderation_pending");
  if (draft.unresolvedAbuseSignal) blockers.push("unresolved_abuse_signal");
  if (draft.unresolvedTrustQualityBlocker) {
    blockers.push("unresolved_trust_quality_blocker");
  }
  if (draft.graphContextPending) blockers.push("graph_context_pending");
  if (blocksUnsafeDossierCreation(draft)) blockers.push("unsafe_auto_create");
  if (blocksDossierAutoPublish(draft)) blockers.push("publish_not_allowed");
  if (
    !draft.auditContext.actorUserId ||
    !draft.auditContext.reason ||
    !draft.auditContext.origin
  ) {
    blockers.push("insufficient_audit_context");
  }

  return unique(blockers) as DossierRuntimeCreationBlocker[];
}

export function getDossierRuntimeStatusLabel(status: DossierRuntimeStatus) {
  switch (status) {
    case "draft":
      return "Entwurf";
    case "queued_for_review":
      return "Zur Prüfung";
    case "approved_for_creation":
      return "Für Erstellung freigegeben";
    case "created":
      return "Erstellt";
    case "rejected":
      return "Abgelehnt";
    case "blocked":
      return "Blockiert";
    case "archived":
      return "Archiviert";
    default:
      return status;
  }
}

export function getDossierRuntimeCreationBlockerLabel(
  blocker: DossierRuntimeCreationBlocker,
) {
  switch (blocker) {
    case "review_not_approved":
      return "Explizite Freigabe zur Dossier-Erstellung fehlt.";
    case "missing_title":
      return "Titel oder Arbeitstitel fehlt.";
    case "missing_summary":
      return "Zusammenfassung fehlt.";
    case "source_review_pending":
      return "Quellenprüfung ist noch offen.";
    case "moderation_pending":
      return "Moderation ist noch offen.";
    case "unresolved_abuse_signal":
      return "Abuse-/Spam-Signal ist noch ungeklärt.";
    case "unresolved_trust_quality_blocker":
      return "Trust-/Quellenqualitäts-Blocker ist noch ungeklärt.";
    case "graph_context_pending":
      return "Graph-/Themenkontext ist noch nicht belastbar genug.";
    case "unsafe_auto_create":
      return "Auto-Dossier aus KI allein bleibt gesperrt.";
    case "publish_not_allowed":
      return "Erstellung darf keine Veröffentlichung setzen.";
    case "insufficient_audit_context":
      return "Audit-Kontext ist unvollständig.";
    default:
      return blocker;
  }
}

export function getDossierRuntimeSourceStatusLabel(
  status: DossierRuntimeSourceStatus,
) {
  switch (status) {
    case "not_checked":
      return "Nicht geprüft";
    case "source_review_requested":
      return "Quellenprüfung angefordert";
    case "source_review_pending":
      return "Quellenprüfung offen";
    case "source_reviewed":
      return "Quellenprüfung eingeordnet";
    case "disputed":
      return "Umstritten";
    case "blocked":
      return "Blockiert";
    default:
      return status;
  }
}

export function getDossierRuntimeVisibilityLabel(
  visibility: DossierRuntimeVisibility,
) {
  switch (visibility) {
    case "internal_review":
      return "Nur interne Prüfung";
    case "editorial_workspace":
      return "Redaktioneller Arbeitsraum";
    case "ready_for_publish_review":
      return "Bereit für Publish-Review";
    case "published":
      return "Veröffentlicht";
    default:
      return visibility;
  }
}

export function buildDossierRuntimeDraftFromHandoff(
  record: PersistedCreateHandoffRecord,
  options?: {
    communityContributions?: CommunitySourceReviewContribution[];
    status?: DossierRuntimeStatus;
    createdDossierId?: string | null;
    createdWorkspaceId?: string | null;
    approvedForSetup?: boolean;
    visibility?: DossierRuntimeVisibility;
    auditContext?: Partial<DossierRuntimeAuditContext>;
  },
): DossierRuntimeDraft {
  const createdAt = record.createdAt ?? nowIso();
  const updatedAt = nowIso();
  const status = options?.status ?? "queued_for_review";
  const communitySignals = (options?.communityContributions ?? []).map(
    mapCommunitySignal,
  );
  const sourceStatus = sourceStatusFromCommunitySignals(communitySignals);
  const graphReferences = buildGraphReferences(record);
  const topicReferences = buildTopicReferences(record);
  const graphContextPending =
    graphReferences.length === 0 &&
    topicReferences.length === 0 &&
    !record.graphMatches.shouldCreateNewTopic;
  const draft: DossierRuntimeDraft = {
    id: `dossier-runtime:${record.id}`,
    sourceHandoffId: record.id,
    sourceReviewItemId: `create_handoff:persisted:${record.id}`,
    statementId: persistedCreateHandoffStatementId(record.id),
    title: buildPersistedCreateHandoffSuggestedTitle(record, "dossier"),
    workingTitle: buildPersistedCreateHandoffSuggestedTitle(record, "dossier"),
    summary: buildPersistedCreateHandoffSummary(record),
    originQuestion:
      trimOrNull(record.plannerResult.openQuestions?.[0]) ??
      trimOrNull(record.plannerResult.shortSummary) ??
      trimOrNull(record.sourceText),
    recognizedStandpoints: buildRecognizedStandpoints(record),
    argumentLines: buildArgumentLines(record),
    openQuestions: buildOpenQuestions(record),
    sourceStatus,
    communitySignals,
    graphReferences,
    topicReferences,
    moderationPending: communitySignals.some((signal) => signal.moderationPending),
    unresolvedAbuseSignal: communitySignals.some((signal) => signal.hasAbuseBlocker),
    unresolvedTrustQualityBlocker: communitySignals.some(
      (signal) => signal.hasTrustQualityBlocker,
    ),
    graphContextPending,
    approvedForSetup: options?.approvedForSetup ?? true,
    status,
    visibility: options?.visibility ?? "internal_review",
    blockers: [],
    auditContext: {
      actorUserId: trimOrNull(options?.auditContext?.actorUserId),
      reason: trimOrNull(options?.auditContext?.reason),
      origin: options?.auditContext?.origin ?? null,
      approvedAt: trimOrNull(options?.auditContext?.approvedAt),
    },
    createdDossierId: trimOrNull(options?.createdDossierId),
    createdWorkspaceId: trimOrNull(options?.createdWorkspaceId),
    guardrails: {
      noAutoCreateFromAiAlone: true,
      noAutoPublish: true,
      noVerifiedFactsByDefault: true,
      noVerifiedSourcesByDefault: true,
      noCommunityHintsAsTruth: true,
      noTrustOrSourceQualityAsVerification: true,
      noGraphEdgeAsProof: true,
      noMajorityAsTruth: true,
      noAnlassraumCreation: true,
      noParticipationSpaceCreation: true,
      auditContextRequired: true,
    },
    createdAt,
    updatedAt,
  };

  return {
    ...draft,
    blockers: getDossierRuntimeCreationBlockers(draft),
  };
}

export function buildDossierRuntimeDraftFromReviewItem(
  item: CreateHandoffReviewQueueItem,
  options?: {
    status?: DossierRuntimeStatus;
    auditContext?: Partial<DossierRuntimeAuditContext>;
  },
): DossierRuntimeDraft {
  const draft: DossierRuntimeDraft = {
    id: `dossier-runtime:${item.id}`,
    sourceHandoffId: item.sourceDraftId,
    sourceReviewItemId: item.id,
    statementId: persistedCreateHandoffStatementId(item.sourceDraftId),
    title: item.title,
    workingTitle: item.title,
    summary: item.summary,
    originQuestion: item.openQuestions[0] ?? null,
    recognizedStandpoints: item.authorStandpoint ? [item.authorStandpoint] : [],
    argumentLines: [],
    openQuestions: unique(item.openQuestions),
    sourceStatus: item.requiresFactcheck
      ? "source_review_pending"
      : "source_review_requested",
    communitySignals: [],
    graphReferences: [],
    topicReferences: item.topicTitle ? [item.topicTitle] : [],
    moderationPending: false,
    unresolvedAbuseSignal: false,
    unresolvedTrustQualityBlocker: false,
    graphContextPending: item.target !== "dossier_candidate",
    approvedForSetup: item.status === "approved_for_setup",
    status: options?.status ?? "queued_for_review",
    visibility: "internal_review",
    blockers: [],
    auditContext: {
      actorUserId: trimOrNull(options?.auditContext?.actorUserId),
      reason: trimOrNull(options?.auditContext?.reason),
      origin: options?.auditContext?.origin ?? null,
      approvedAt: trimOrNull(options?.auditContext?.approvedAt),
    },
    createdDossierId: null,
    createdWorkspaceId: null,
    guardrails: {
      noAutoCreateFromAiAlone: true,
      noAutoPublish: true,
      noVerifiedFactsByDefault: true,
      noVerifiedSourcesByDefault: true,
      noCommunityHintsAsTruth: true,
      noTrustOrSourceQualityAsVerification: true,
      noGraphEdgeAsProof: true,
      noMajorityAsTruth: true,
      noAnlassraumCreation: true,
      noParticipationSpaceCreation: true,
      auditContextRequired: true,
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  return {
    ...draft,
    blockers: getDossierRuntimeCreationBlockers(draft),
  };
}

export function getDossierRuntimeCreationBlockers(
  draft: Pick<
    DossierRuntimeDraft,
    | "guardrails"
    | "visibility"
    | "title"
    | "summary"
    | "sourceStatus"
    | "moderationPending"
    | "unresolvedAbuseSignal"
    | "unresolvedTrustQualityBlocker"
    | "graphContextPending"
    | "status"
    | "auditContext"
  >,
) {
  return buildGuardrailBlockers(draft);
}

export function canCreateDossierRuntime(
  draft: Pick<
    DossierRuntimeDraft,
    | "guardrails"
    | "visibility"
    | "title"
    | "summary"
    | "sourceStatus"
    | "moderationPending"
    | "unresolvedAbuseSignal"
    | "unresolvedTrustQualityBlocker"
    | "graphContextPending"
    | "status"
    | "auditContext"
  >,
) {
  return getDossierRuntimeCreationBlockers(draft).length === 0;
}

export function blocksUnsafeDossierCreation(
  draft: Pick<DossierRuntimeDraft, "guardrails">,
) {
  return (
    draft.guardrails.noAutoCreateFromAiAlone !== true ||
    draft.guardrails.noVerifiedFactsByDefault !== true ||
    draft.guardrails.noVerifiedSourcesByDefault !== true ||
    draft.guardrails.noCommunityHintsAsTruth !== true ||
    draft.guardrails.noTrustOrSourceQualityAsVerification !== true ||
    draft.guardrails.noGraphEdgeAsProof !== true ||
    draft.guardrails.noMajorityAsTruth !== true ||
    draft.guardrails.noAnlassraumCreation !== true ||
    draft.guardrails.noParticipationSpaceCreation !== true
  );
}

export function blocksDossierAutoPublish(
  draft: Pick<DossierRuntimeDraft, "guardrails" | "visibility">,
) {
  return (
    draft.guardrails.noAutoPublish !== true || draft.visibility === "published"
  );
}

export function summarizeDossierRuntimeState(
  draft: Pick<
    DossierRuntimeDraft,
    | "status"
    | "sourceStatus"
    | "blockers"
    | "createdDossierId"
    | "createdWorkspaceId"
  >,
) {
  const parts = [
    getDossierRuntimeStatusLabel(draft.status),
    getDossierRuntimeSourceStatusLabel(draft.sourceStatus),
  ];

  if (draft.createdDossierId) {
    parts.push(`Dossier ${draft.createdDossierId}`);
  }
  if (draft.createdWorkspaceId) {
    parts.push(`Workspace ${draft.createdWorkspaceId}`);
  }
  if (draft.blockers.length > 0) {
    parts.push(
      draft.blockers.map(getDossierRuntimeCreationBlockerLabel).join(" "),
    );
  }

  return parts.join(" · ");
}

export async function createDossierRuntimeAfterReview(
  record: DossierRuntimeRecord,
  options: {
    auditContext?: Partial<DossierRuntimeAuditContext>;
  } & DossierRuntimeCreateDependencies,
): Promise<
  | {
      ok: true;
      record: DossierRuntimeRecord;
    }
  | {
      ok: false;
      blockers: DossierRuntimeCreationBlocker[];
      error: "blocked" | "create_failed";
      message: string;
    }
> {
  const merged: DossierRuntimeRecord = {
    ...record,
    auditContext: {
      actorUserId:
        trimOrNull(options.auditContext?.actorUserId) ??
        record.auditContext.actorUserId,
      reason:
        trimOrNull(options.auditContext?.reason) ?? record.auditContext.reason,
      origin: options.auditContext?.origin ?? record.auditContext.origin,
      approvedAt:
        trimOrNull(options.auditContext?.approvedAt) ??
        record.auditContext.approvedAt,
    },
    updatedAt: nowIso(),
  };
  const blockers = getDossierRuntimeCreationBlockers(merged);
  if (blockers.length > 0) {
    return {
      ok: false,
      blockers,
      error: "blocked",
      message:
        "Dossier-Erstellung bleibt review-first blockiert, bis Freigabe, Audit-Kontext und offene Guardrail-Blocker sauber geklärt sind.",
    };
  }

  const created = await options.creator({
    record: merged,
    auditContext: merged.auditContext,
  });
  if (created.ok === false) {
    return {
      ok: false,
      blockers: [],
      error: "create_failed",
      message:
        created.error ??
        "Die Dossier-Runtime konnte nicht sicher in die bestehende Persistenz geschrieben werden.",
    };
  }

  return {
    ok: true,
    record: {
      ...merged,
      status: "created",
      visibility: "editorial_workspace",
      blockers: [],
      createdDossierId: created.dossierId,
      createdWorkspaceId: trimOrNull(created.workspaceId),
      updatedAt: trimOrNull(created.createdAt) ?? nowIso(),
    },
  };
}
