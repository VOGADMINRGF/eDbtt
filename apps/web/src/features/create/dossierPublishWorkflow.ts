import type {
  DossierRuntimeCommunitySignal,
  DossierRuntimeRecord,
  DossierRuntimeSourceStatus,
  DossierRuntimeStatus,
  DossierRuntimeVisibility,
} from "@/features/create/dossierRuntime";

export const DOSSIER_PUBLICATION_STATUSES = [
  "draft_internal",
  "review_only",
  "ready_for_publication_review",
  "approved_for_publication",
  "published",
  "unpublished",
  "rejected_for_publication",
  "blocked",
  "archived",
] as const;

export type DossierPublicationStatus =
  (typeof DOSSIER_PUBLICATION_STATUSES)[number];

export const DOSSIER_VISIBILITIES = ["internal", "public"] as const;
export type DossierVisibility = (typeof DOSSIER_VISIBILITIES)[number];

export const DOSSIER_PUBLIC_ACCESS_MODES = ["none", "public_read_only"] as const;
export type DossierPublicAccessMode =
  (typeof DOSSIER_PUBLIC_ACCESS_MODES)[number];

export const DOSSIER_PUBLISH_DECISIONS = [
  "request_publication_review",
  "approve_publication",
  "publish",
  "unpublish",
  "reject_publication",
  "block_publication",
  "archive_publication",
] as const;

export type DossierPublishDecision = (typeof DOSSIER_PUBLISH_DECISIONS)[number];

export const DOSSIER_PUBLICATION_BLOCKERS = [
  "dossier_missing",
  "dossier_not_created",
  "creation_not_audited",
  "publication_review_not_requested",
  "publication_not_approved",
  "missing_title",
  "missing_summary",
  "source_review_pending",
  "moderation_pending",
  "unresolved_abuse_signal",
  "unresolved_trust_quality_blocker",
  "graph_context_pending",
  "unsafe_auto_publish",
  "insufficient_audit_context",
] as const;

export type DossierPublicationBlocker =
  (typeof DOSSIER_PUBLICATION_BLOCKERS)[number];

export type DossierPublishAuditContext = {
  actorUserId: string | null;
  reason: string | null;
  origin:
    | "admin_review"
    | "dossier_runtime"
    | "dossier_publish_workflow"
    | null;
  approvedAt: string | null;
};

export type DossierPublishGuardrails = {
  creationApprovalIsNotPublicationApproval: true;
  publicationApprovalIsNotFactVerification: true;
  publishedIsNotAbsoluteTruth: true;
  sourceReferencesAreNotAutomaticVerification: true;
  trustSignalsAreReviewContextOnly: true;
  noAutoPublish: true;
  noAutoActivation: true;
  noAutoGraphWrite: true;
  noAutoMerge: true;
  noAutoFactcheck: true;
  noAutoAnlassraumCreation: true;
  noAutoParticipationSpaceCreation: true;
  noDeepSearch: true;
  noHiddenCostPath: true;
  noInternalFieldLeak: true;
  auditContextRequired: true;
};

export type DossierPublishAuditEvent = {
  id: string;
  sourceHandoffId: string;
  dossierId: string | null;
  at: string;
  action:
    | "publication_review_requested"
    | "publication_approved"
    | "published_public"
    | "unpublished_public"
    | "publication_rejected"
    | "publication_blocked"
    | "publication_archived";
  actorUserId: string | null;
  note: string | null;
  blockers: DossierPublicationBlocker[];
  status: DossierPublicationStatus;
};

export type DossierPublicationDraft = {
  id: string;
  sourceHandoffId: string;
  sourceReviewItemId: string;
  statementId: string;
  dossierId: string | null;
  runtimeStatus: DossierRuntimeStatus;
  runtimeVisibility: DossierRuntimeVisibility;
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
  creationAudited: boolean;
  status: DossierPublicationStatus;
  visibility: DossierVisibility;
  publicAccessMode: DossierPublicAccessMode;
  blockers: DossierPublicationBlocker[];
  auditContext: DossierPublishAuditContext;
  guardrails: DossierPublishGuardrails;
  createdAt: string;
  updatedAt: string;
};

export type DossierPublicationRecord = DossierPublicationDraft & {
  auditTrail: DossierPublishAuditEvent[];
  approvedForPublicationAt: string | null;
  approvedForPublicationBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  unpublishedAt: string | null;
  unpublishedBy: string | null;
  archivedAt: string | null;
  archivedBy: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function trimOrNull(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function defaultGuardrails(): DossierPublishGuardrails {
  return {
    creationApprovalIsNotPublicationApproval: true,
    publicationApprovalIsNotFactVerification: true,
    publishedIsNotAbsoluteTruth: true,
    sourceReferencesAreNotAutomaticVerification: true,
    trustSignalsAreReviewContextOnly: true,
    noAutoPublish: true,
    noAutoActivation: true,
    noAutoGraphWrite: true,
    noAutoMerge: true,
    noAutoFactcheck: true,
    noAutoAnlassraumCreation: true,
    noAutoParticipationSpaceCreation: true,
    noDeepSearch: true,
    noHiddenCostPath: true,
    noInternalFieldLeak: true,
    auditContextRequired: true,
  };
}

function publicationRequested(status: DossierPublicationStatus) {
  return !["draft_internal", "review_only"].includes(status);
}

function publicationApproved(status: DossierPublicationStatus) {
  return ["approved_for_publication", "published"].includes(status);
}

function baseBlockers(
  draft: DossierPublicationDraft | DossierPublicationRecord,
) {
  const blockers: DossierPublicationBlocker[] = [];
  if (!draft.dossierId) blockers.push("dossier_missing", "dossier_not_created");
  if (draft.runtimeStatus !== "created") blockers.push("dossier_not_created");
  if (!draft.creationAudited) blockers.push("creation_not_audited");
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
  if (
    !draft.auditContext.actorUserId ||
    !draft.auditContext.reason ||
    !draft.auditContext.origin
  ) {
    blockers.push("insufficient_audit_context");
  }
  if (blocksUnsafePublicVisibility(draft)) blockers.push("unsafe_auto_publish");
  return blockers;
}

export function buildDossierPublicationDraft(
  runtimeRecord: DossierRuntimeRecord,
  options?: {
    status?: DossierPublicationStatus;
    visibility?: DossierVisibility;
    publicAccessMode?: DossierPublicAccessMode;
    creationAudited?: boolean;
    auditContext?: Partial<DossierPublishAuditContext>;
    createdAt?: string | null;
    updatedAt?: string | null;
    approvedForPublicationAt?: string | null;
    approvedForPublicationBy?: string | null;
    rejectedAt?: string | null;
    rejectedBy?: string | null;
    unpublishedAt?: string | null;
    unpublishedBy?: string | null;
    archivedAt?: string | null;
    archivedBy?: string | null;
  },
): DossierPublicationDraft {
  const createdAt =
    trimOrNull(options?.createdAt) ??
    trimOrNull(runtimeRecord.createdAt) ??
    nowIso();
  const updatedAt =
    trimOrNull(options?.updatedAt) ??
    trimOrNull(runtimeRecord.updatedAt) ??
    createdAt;
  const draft: DossierPublicationDraft = {
    id: `dossier-publication:${runtimeRecord.sourceHandoffId}`,
    sourceHandoffId: runtimeRecord.sourceHandoffId,
    sourceReviewItemId: runtimeRecord.sourceReviewItemId,
    statementId: runtimeRecord.statementId,
    dossierId: trimOrNull(runtimeRecord.createdDossierId),
    runtimeStatus: runtimeRecord.status,
    runtimeVisibility: runtimeRecord.visibility,
    title: String(runtimeRecord.title || "").trim(),
    workingTitle: String(
      runtimeRecord.workingTitle || runtimeRecord.title || "",
    ).trim(),
    summary: String(runtimeRecord.summary || "").trim(),
    originQuestion: trimOrNull(runtimeRecord.originQuestion),
    recognizedStandpoints: unique(runtimeRecord.recognizedStandpoints),
    argumentLines: unique(runtimeRecord.argumentLines),
    openQuestions: unique(runtimeRecord.openQuestions),
    sourceStatus: runtimeRecord.sourceStatus,
    communitySignals: runtimeRecord.communitySignals,
    graphReferences: unique(runtimeRecord.graphReferences),
    topicReferences: unique(runtimeRecord.topicReferences),
    moderationPending: runtimeRecord.moderationPending,
    unresolvedAbuseSignal: runtimeRecord.unresolvedAbuseSignal,
    unresolvedTrustQualityBlocker:
      runtimeRecord.unresolvedTrustQualityBlocker,
    graphContextPending: runtimeRecord.graphContextPending,
    creationAudited:
      options?.creationAudited ??
      runtimeRecord.auditTrail.some((entry) => entry.action === "runtime_created"),
    status: options?.status ?? "review_only",
    visibility: options?.visibility ?? "internal",
    publicAccessMode: options?.publicAccessMode ?? "none",
    blockers: [],
    auditContext: {
      actorUserId: trimOrNull(options?.auditContext?.actorUserId),
      reason: trimOrNull(options?.auditContext?.reason),
      origin: options?.auditContext?.origin ?? null,
      approvedAt: trimOrNull(options?.auditContext?.approvedAt),
    },
    guardrails: defaultGuardrails(),
    createdAt,
    updatedAt,
  };

  return {
    ...draft,
    blockers: getDossierPublicationBlockers(draft),
  };
}

export function getDossierPublicationBlockers(
  draft: DossierPublicationDraft | DossierPublicationRecord,
) {
  const blockers = baseBlockers(draft);
  if (!publicationRequested(draft.status)) {
    blockers.push("publication_review_not_requested");
  }
  if (!publicationApproved(draft.status)) {
    blockers.push("publication_not_approved");
  }
  return unique(blockers) as DossierPublicationBlocker[];
}

function blockersForRequestedReview(
  draft: DossierPublicationDraft | DossierPublicationRecord,
) {
  return baseBlockers(draft).filter(
    (blocker) => blocker !== "unsafe_auto_publish",
  );
}

function blockersForApproval(
  draft: DossierPublicationDraft | DossierPublicationRecord,
) {
  return baseBlockers(draft).filter(
    (blocker) => blocker !== "publication_review_not_requested",
  );
}

function updatedAuditContext(
  record: DossierPublicationRecord,
  input: Partial<DossierPublishAuditContext> | undefined,
  fallbackReason: string,
) {
  return {
    actorUserId:
      trimOrNull(input?.actorUserId) ??
      trimOrNull(record.auditContext.actorUserId),
    reason:
      trimOrNull(input?.reason) ??
      trimOrNull(record.auditContext.reason) ??
      fallbackReason,
    origin: input?.origin ?? record.auditContext.origin ?? "admin_review",
    approvedAt: trimOrNull(input?.approvedAt) ?? nowIso(),
  } satisfies DossierPublishAuditContext;
}

export function requestDossierPublicationReview(
  record: DossierPublicationRecord,
  input?: Partial<DossierPublishAuditContext>,
): DossierPublicationRecord {
  const requestedAt = trimOrNull(input?.approvedAt) ?? nowIso();
  const candidate: DossierPublicationRecord = {
    ...record,
    status: "ready_for_publication_review",
    visibility: "internal",
    publicAccessMode: "none",
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: requestedAt },
      "Veröffentlichungsprüfung explizit angefordert.",
    ),
    updatedAt: requestedAt,
  };
  const blockers = blockersForRequestedReview(candidate);
  return blockers.length > 0
    ? { ...candidate, status: "blocked", blockers }
    : { ...candidate, blockers: [] };
}

export function approveDossierPublication(
  record: DossierPublicationRecord,
  input?: Partial<DossierPublishAuditContext>,
): DossierPublicationRecord {
  const approvedAt = trimOrNull(input?.approvedAt) ?? nowIso();
  const candidate: DossierPublicationRecord = {
    ...record,
    status: "approved_for_publication",
    visibility: "internal",
    publicAccessMode: "none",
    approvedForPublicationAt: approvedAt,
    approvedForPublicationBy:
      trimOrNull(input?.actorUserId) ?? record.approvedForPublicationBy,
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: approvedAt },
      "Veröffentlichung explizit freigegeben.",
    ),
    updatedAt: approvedAt,
  };
  const blockers = blockersForApproval(candidate);
  return blockers.length > 0
    ? { ...candidate, status: "blocked", blockers }
    : { ...candidate, blockers: [] };
}

export function publishDossier(
  record: DossierPublicationRecord,
  input?: Partial<DossierPublishAuditContext>,
) {
  const publishedAt = trimOrNull(input?.approvedAt) ?? nowIso();
  const candidate: DossierPublicationRecord = {
    ...record,
    status: "approved_for_publication",
    approvedForPublicationAt: record.approvedForPublicationAt ?? publishedAt,
    approvedForPublicationBy:
      record.approvedForPublicationBy ?? trimOrNull(input?.actorUserId),
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: publishedAt },
      "Öffentliche Sichtbarkeit wird explizit gesetzt.",
    ),
    updatedAt: publishedAt,
  };
  const blockers = getDossierPublicationBlockers(candidate).filter(
    (blocker) => blocker !== "publication_review_not_requested",
  );
  if (!publicationApproved(record.status)) {
    blockers.push("publication_not_approved");
  }
  if (blockers.length > 0) {
    return {
      ok: false as const,
      error: "blocked" as const,
      blockers,
      message:
        "Veröffentlichung bleibt blockiert, bis Review, Audit und offene Guardrail-Blocker sauber geklärt sind.",
    };
  }

  return {
    ok: true as const,
    record: {
      ...candidate,
      status: "published" as const,
      visibility: "public" as const,
      publicAccessMode: "public_read_only" as const,
      blockers: [],
      updatedAt: publishedAt,
    },
  };
}

export function unpublishDossier(
  record: DossierPublicationRecord,
  input?: Partial<DossierPublishAuditContext>,
): DossierPublicationRecord {
  const unpublishedAt = trimOrNull(input?.approvedAt) ?? nowIso();
  return {
    ...record,
    status: "unpublished",
    visibility: "internal",
    publicAccessMode: "none",
    unpublishedAt,
    unpublishedBy: trimOrNull(input?.actorUserId) ?? record.unpublishedBy,
    blockers: [],
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: unpublishedAt },
      "Öffentliche Sichtbarkeit wurde explizit zurückgezogen.",
    ),
    updatedAt: unpublishedAt,
  };
}

export function rejectDossierPublication(
  record: DossierPublicationRecord,
  input?: Partial<DossierPublishAuditContext>,
): DossierPublicationRecord {
  const rejectedAt = trimOrNull(input?.approvedAt) ?? nowIso();
  return {
    ...record,
    status: "rejected_for_publication",
    visibility: "internal",
    publicAccessMode: "none",
    rejectedAt,
    rejectedBy: trimOrNull(input?.actorUserId) ?? record.rejectedBy,
    blockers: [],
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: rejectedAt },
      "Veröffentlichung explizit abgelehnt.",
    ),
    updatedAt: rejectedAt,
  };
}

export function blockDossierPublication(
  record: DossierPublicationRecord,
  input?: Partial<DossierPublishAuditContext>,
): DossierPublicationRecord {
  const blockedAt = trimOrNull(input?.approvedAt) ?? nowIso();
  const blockers = blockersForApproval({
    ...record,
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: blockedAt },
      "Veröffentlichung bleibt blockiert.",
    ),
  });
  return {
    ...record,
    status: "blocked",
    visibility: "internal",
    publicAccessMode: "none",
    blockers: blockers.length > 0 ? blockers : ["publication_not_approved"],
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: blockedAt },
      "Veröffentlichung bleibt blockiert.",
    ),
    updatedAt: blockedAt,
  };
}

export function archiveDossierPublication(
  record: DossierPublicationRecord,
  input?: Partial<DossierPublishAuditContext>,
): DossierPublicationRecord {
  const archivedAt = trimOrNull(input?.approvedAt) ?? nowIso();
  return {
    ...record,
    status: "archived",
    visibility: "internal",
    publicAccessMode: "none",
    archivedAt,
    archivedBy: trimOrNull(input?.actorUserId) ?? record.archivedBy,
    blockers: [],
    auditContext: updatedAuditContext(
      record,
      { ...input, approvedAt: archivedAt },
      "Veröffentlichungspfad wurde archiviert.",
    ),
    updatedAt: archivedAt,
  };
}

export function canRequestDossierPublicationReview(
  record: DossierPublicationRecord,
) {
  return (
    !["published", "archived"].includes(record.status) &&
    blockersForRequestedReview(record).length === 0
  );
}

export function canApproveDossierPublication(
  record: DossierPublicationRecord,
) {
  return (
    !["published", "archived", "rejected_for_publication"].includes(record.status) &&
    blockersForApproval(record).length === 0
  );
}

export function canPublishDossier(record: DossierPublicationRecord) {
  return publishDossier(record).ok;
}

export function canUnpublishDossier(record: DossierPublicationRecord) {
  return record.status === "published";
}

export function getDossierPublicationState(
  record: DossierPublicationDraft | DossierPublicationRecord,
) {
  return {
    status: record.status,
    visibility: record.visibility,
    publicAccessMode: record.publicAccessMode,
    blockers: getDossierPublicationBlockers(record),
    isPublic: isPublicDossier(record),
  };
}

export function isPublicDossier(
  record: Pick<
    DossierPublicationDraft | DossierPublicationRecord,
    "status" | "visibility" | "publicAccessMode" | "dossierId"
  >,
) {
  return (
    record.status === "published" &&
    record.visibility === "public" &&
    record.publicAccessMode === "public_read_only" &&
    Boolean(record.dossierId)
  );
}

export function assertDossierCanBePublished(
  record: DossierPublicationRecord,
) {
  const result = publishDossier(record);
  if (!result.ok) {
    const error = new Error(result.message);
    (error as Error & { blockers?: DossierPublicationBlocker[] }).blockers =
      result.blockers;
    throw error;
  }
  return result.record;
}

export function blocksUnsafePublicVisibility(
  record: Pick<
    DossierPublicationDraft | DossierPublicationRecord,
    "status" | "visibility" | "publicAccessMode" | "guardrails"
  >,
) {
  if (record.status === "published") return false;
  return (
    record.guardrails.noAutoPublish !== true ||
    record.guardrails.noInternalFieldLeak !== true ||
    record.visibility === "public" ||
    record.publicAccessMode === "public_read_only"
  );
}

export function summarizeDossierPublicationState(
  record: DossierPublicationDraft | DossierPublicationRecord,
) {
  const parts = [
    getDossierPublicationStatusLabel(record.status),
    getDossierVisibilityLabel(record.visibility),
    getDossierPublicAccessModeLabel(record.publicAccessMode),
  ];
  if (record.dossierId) parts.push(`Dossier ${record.dossierId}`);
  if (record.blockers.length > 0) {
    parts.push(
      `Blocker: ${record.blockers
        .map(getDossierPublicationBlockerLabel)
        .join(" | ")}`,
    );
  }
  return parts.join(" · ");
}

export function stripDossierInternalFieldsForPublic<T>(input: T): T {
  const blockedKeys = new Set([
    "auditTrail",
    "audit",
    "auditContext",
    "review",
    "reviewId",
    "reviewIds",
    "reviewNotes",
    "reviewer",
    "reviewers",
    "admin",
    "adminNotes",
    "moderation",
    "moderationStatus",
    "moderationNotes",
    "trust",
    "trustLevel",
    "sourceReview",
    "sourceReviewInternals",
    "privateNotes",
    "graphInternals",
    "internal",
  ]);

  if (Array.isArray(input)) {
    return input.map((entry) => stripDossierInternalFieldsForPublic(entry)) as T;
  }
  if (!input || typeof input !== "object") return input;

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (blockedKeys.has(key)) continue;
    if (
      key.toLowerCase().includes("audit") ||
      key.toLowerCase().includes("review") ||
      key.toLowerCase().includes("moderation") ||
      key.toLowerCase().includes("trust") ||
      key.toLowerCase().includes("private") ||
      key.toLowerCase().includes("internal")
    ) {
      continue;
    }
    output[key] = stripDossierInternalFieldsForPublic(value);
  }
  return output as T;
}

export function getDossierPublicationStatusLabel(
  status: DossierPublicationStatus,
) {
  switch (status) {
    case "draft_internal":
      return "Interner Entwurf";
    case "review_only":
      return "Nur Review";
    case "ready_for_publication_review":
      return "Bereit für Veröffentlichungsprüfung";
    case "approved_for_publication":
      return "Für Veröffentlichung freigegeben";
    case "published":
      return "Veröffentlicht";
    case "unpublished":
      return "Veröffentlichung zurückgezogen";
    case "rejected_for_publication":
      return "Veröffentlichung abgelehnt";
    case "blocked":
      return "Blockiert";
    case "archived":
      return "Archiviert";
    default:
      return status;
  }
}

export function getDossierVisibilityLabel(visibility: DossierVisibility) {
  return visibility === "public" ? "Öffentlich" : "Intern";
}

export function getDossierPublicAccessModeLabel(
  mode: DossierPublicAccessMode,
) {
  return mode === "public_read_only" ? "Öffentlich read-only" : "Kein Public-Zugriff";
}

export function getDossierPublicationBlockerLabel(
  blocker: DossierPublicationBlocker,
) {
  switch (blocker) {
    case "dossier_missing":
      return "Das Dossier konnte nicht belastbar geladen werden.";
    case "dossier_not_created":
      return "Ein echtes Runtime-Dossier ist noch nicht erstellt.";
    case "creation_not_audited":
      return "Die Dossier-Erstellung ist noch nicht sauber auditierbar bestätigt.";
    case "publication_review_not_requested":
      return "Veröffentlichungsprüfung wurde noch nicht explizit angefordert.";
    case "publication_not_approved":
      return "Veröffentlichung braucht eine eigene explizite Freigabe.";
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
    case "unsafe_auto_publish":
      return "Öffentliche Sichtbarkeit als Side Effect bleibt gesperrt.";
    case "insufficient_audit_context":
      return "Audit-Kontext ist unvollständig.";
    default:
      return blocker;
  }
}
