import { ObjectId, coreCol } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  SourceSupport,
  TruthStatus,
  UserFacingVerificationLabel,
} from "@features/ai/e150/verificationContract";

export const EDITORIAL_REVIEW_REQUEST_SOURCE_TYPES = [
  "start_draft",
  "create_analysis",
  "factcheck_request",
  "theme_suggestion",
  "round_draft",
  "user_relevance_appeal",
] as const;

export type EditorialReviewRequestSourceType =
  (typeof EDITORIAL_REVIEW_REQUEST_SOURCE_TYPES)[number];

export const EDITORIAL_REVIEW_REQUEST_REASONS = [
  "user_requested_review",
  "relevance_gate_appeal",
  "source_open",
  "provider_disagreement",
  "fallback_used",
  "insufficient_independent_success",
  "no_source_bluffing_failed",
  "moderation_required",
  "editorial_escalation",
] as const;

export type EditorialReviewRequestReason =
  (typeof EDITORIAL_REVIEW_REQUEST_REASONS)[number];

export const EDITORIAL_REVIEW_REQUEST_STATUSES = [
  "pending_review",
  "in_review",
  "needs_user_clarification",
  "accepted_for_workup",
  "rejected",
  "archived",
] as const;

export type EditorialReviewRequestStatus =
  (typeof EDITORIAL_REVIEW_REQUEST_STATUSES)[number];

export const EDITORIAL_REVIEW_REQUEST_ACTIONS = [
  "assign",
  "unassign",
  "add_note",
  "mark_in_review",
  "needs_user_clarification",
  "accept_for_workup",
  "reject",
  "archive",
] as const;

export type EditorialReviewRequestAction =
  (typeof EDITORIAL_REVIEW_REQUEST_ACTIONS)[number];

export type EditorialReviewRequestActivityAction =
  | EditorialReviewRequestAction
  | "user_replied";

export type EditorialReviewRequestReply = {
  id: string;
  text: string;
  createdAt: string;
  userId?: string | null;
};

export type EditorialReviewRequestHistoryEntry = {
  id: string;
  action: EditorialReviewRequestActivityAction;
  actionLabel: string;
  byUserId: string;
  at: string;
  note: string | null;
  previousStatus: EditorialReviewRequestStatus;
  nextStatus: EditorialReviewRequestStatus;
  previousAssignedToUserId: string | null;
  nextAssignedToUserId: string | null;
};

export type EditorialReviewRequest = {
  id: string;
  sourceType: EditorialReviewRequestSourceType;
  sourceId?: string | null;
  userId?: string | null;
  originalText: string;
  normalizedText?: string | null;
  analysisRunId?: string | null;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  reviewRecommended: boolean;
  verificationLabel: UserFacingVerificationLabel;
  noTruthPromotion: true;
  reason: EditorialReviewRequestReason;
  userNote?: string | null;
  status: EditorialReviewRequestStatus;
  statusNote?: string | null;
  reviewerNote?: string | null;
  userVisibleNote?: string | null;
  userReplies?: EditorialReviewRequestReply[];
  lastUserReplyAt?: string | null;
  clarificationResolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  noAutoPublish: true;
  noAutoGraphPromotion: true;
  noAutoDossier: true;
  noAutoAnlassraum: true;
  noAutoVote: true;
  assignedToUserId?: string | null;
  assignedAt?: string | null;
  assignedByUserId?: string | null;
  lastAction?: EditorialReviewRequestActivityAction | null;
  lastActionAt?: string | null;
  lastActionByUserId?: string | null;
  latestAction?: EditorialReviewRequestActivityAction | null;
  latestActionAt?: string | null;
  latestActionByUserId?: string | null;
  history?: EditorialReviewRequestHistoryEntry[];
};

type EditorialReviewRequestDoc = Omit<
  EditorialReviewRequest,
  "id" | "createdAt" | "updatedAt"
> & {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type EditorialReviewQueueRepository = {
  countRecentByUser(userId: string, boundary: Date): Promise<number>;
  findActiveDuplicate(params: {
    userId: string;
    normalizedText: string;
    sourceType: EditorialReviewRequestSourceType;
    createdAtBoundary: Date;
  }): Promise<EditorialReviewRequestDoc | null>;
  insert(doc: EditorialReviewRequestDoc): Promise<EditorialReviewRequestDoc>;
  update(doc: EditorialReviewRequestDoc): Promise<EditorialReviewRequestDoc>;
  getById(id: string): Promise<EditorialReviewRequestDoc | null>;
  list(params?: {
    userId?: string | null;
    statuses?: EditorialReviewRequestStatus[];
    limit?: number;
  }): Promise<EditorialReviewRequestDoc[]>;
};

export const EDITORIAL_REVIEW_REQUEST_COLLECTION = "landing_editorial_review_requests";
export const EDITORIAL_REVIEW_MAX_REQUESTS_PER_DAY = 3;
export const EDITORIAL_REVIEW_DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const EDITORIAL_REVIEW_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const EDITORIAL_REVIEW_REPLY_MIN_LENGTH = 20;

let repoSingleton: EditorialReviewQueueRepository | null = null;

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function copyDoc(doc: EditorialReviewRequestDoc): EditorialReviewRequestDoc {
  return {
    ...doc,
    createdAt: asDate(doc.createdAt),
    updatedAt: asDate(doc.updatedAt),
    userReplies: Array.isArray(doc.userReplies) ? doc.userReplies.map((entry) => ({ ...entry })) : [],
    history: Array.isArray(doc.history) ? doc.history.map((entry) => ({ ...entry })) : [],
  };
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function objectIdString(value: unknown) {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toHexString" in (value as Record<string, unknown>) &&
    typeof (value as { toHexString?: () => string }).toHexString === "function"
  ) {
    return (value as { toHexString: () => string }).toHexString();
  }
  const fallback = String(value ?? "").trim();
  return fallback === "[object Object]" ? "" : fallback;
}

function actionLabel(action: EditorialReviewRequestActivityAction) {
  switch (action) {
    case "assign":
      return "Zugewiesen";
    case "unassign":
      return "Zuweisung entfernt";
    case "add_note":
      return "Notiz ergänzt";
    case "mark_in_review":
      return "In Prüfung genommen";
    case "needs_user_clarification":
      return "Rückfrage erforderlich";
    case "accept_for_workup":
      return "Zur Weiterarbeit freigegeben";
    case "reject":
      return "Abgelehnt";
    case "archive":
      return "Archiviert";
    case "user_replied":
      return "Nutzer hat geantwortet";
    default:
      return action;
  }
}

function statusLabel(status: EditorialReviewRequestStatus) {
  switch (status) {
    case "pending_review":
      return "Zur manuellen Prüfung vorgemerkt";
    case "in_review":
      return "In Prüfung";
    case "needs_user_clarification":
      return "Rückfrage erforderlich";
    case "accepted_for_workup":
      return "Zur Weiterarbeit freigegeben";
    case "rejected":
      return "Abgelehnt";
    case "archived":
      return "Archiviert";
    default:
      return status;
  }
}

function buildHistoryId(input: {
  requestId: string;
  action: EditorialReviewRequestActivityAction;
  at: string;
}) {
  return `editorial-review-${stableHash(`${input.requestId}:${input.action}:${input.at}`).slice(0, 18)}`;
}

function toDocId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function asDate(value: unknown) {
  if (value instanceof Date) return value;
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toReviewRequest(doc: EditorialReviewRequestDoc): EditorialReviewRequest {
  return {
    id: objectIdString(doc._id),
    sourceType: doc.sourceType,
    sourceId: doc.sourceId ?? null,
    userId: doc.userId ?? null,
    originalText: doc.originalText,
    normalizedText: doc.normalizedText ?? null,
    analysisRunId: doc.analysisRunId ?? null,
    truthStatus: doc.truthStatus,
    sourceSupport: doc.sourceSupport,
    sourceStatus: doc.sourceStatus,
    reviewRecommended: doc.reviewRecommended,
    verificationLabel: doc.verificationLabel,
    noTruthPromotion: true,
    reason: doc.reason,
    userNote: doc.userNote ?? null,
    status: doc.status,
    statusNote: doc.statusNote ?? null,
    reviewerNote: doc.reviewerNote ?? null,
    userVisibleNote: doc.userVisibleNote ?? null,
    userReplies: Array.isArray(doc.userReplies) ? clone(doc.userReplies) : [],
    lastUserReplyAt: doc.lastUserReplyAt ?? null,
    clarificationResolvedAt: doc.clarificationResolvedAt ?? null,
    createdAt: asDate(doc.createdAt).toISOString(),
    updatedAt: asDate(doc.updatedAt).toISOString(),
    noAutoPublish: true,
    noAutoGraphPromotion: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoVote: true,
    assignedToUserId: doc.assignedToUserId ?? null,
    assignedAt: doc.assignedAt ?? null,
    assignedByUserId: doc.assignedByUserId ?? null,
    lastAction: doc.lastAction ?? doc.latestAction ?? null,
    lastActionAt: doc.lastActionAt ?? doc.latestActionAt ?? null,
    lastActionByUserId: doc.lastActionByUserId ?? doc.latestActionByUserId ?? null,
    latestAction: doc.latestAction ?? null,
    latestActionAt: doc.latestActionAt ?? null,
    latestActionByUserId: doc.latestActionByUserId ?? null,
    history: Array.isArray(doc.history) ? clone(doc.history) : [],
  };
}

export function createInMemoryEditorialReviewQueueRepository(): EditorialReviewQueueRepository {
  const docs = new Map<string, EditorialReviewRequestDoc>();

  return {
    async countRecentByUser(userId, boundary) {
      return Array.from(docs.values()).filter(
        (doc) => doc.userId === userId && doc.createdAt >= boundary,
      ).length;
    },
    async findActiveDuplicate(params) {
      const matches = Array.from(docs.values()).find((doc) => {
        if (doc.userId !== params.userId) return false;
        if (doc.normalizedText !== params.normalizedText) return false;
        if (doc.sourceType !== params.sourceType) return false;
        if (!ACTIVE_DEDUPE_STATUSES.has(doc.status)) return false;
        return doc.createdAt >= params.createdAtBoundary;
      });
      return matches ? copyDoc(matches) : null;
    },
    async insert(doc) {
      const nextId = new ObjectId();
      const nextDoc = { ...copyDoc(doc), _id: nextId };
      docs.set(objectIdString(nextId), nextDoc);
      return copyDoc(nextDoc);
    },
    async update(doc) {
      const id = objectIdString(doc._id);
      const nextDoc = copyDoc(doc);
      docs.set(id, nextDoc);
      return copyDoc(nextDoc);
    },
    async getById(id) {
      const doc = docs.get(id);
      return doc ? copyDoc(doc) : null;
    },
    async list(params) {
      const list = Array.from(docs.values())
        .filter((doc) => {
          if (params?.userId && doc.userId !== params.userId) return false;
          if (params?.statuses?.length && !params.statuses.includes(doc.status)) return false;
          return true;
        })
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      const limited = typeof params?.limit === "number" ? list.slice(0, params.limit) : list;
      return limited.map((doc) => copyDoc(doc));
    },
  };
}

function createMongoEditorialReviewQueueRepository(): EditorialReviewQueueRepository {
  return {
    async countRecentByUser(userId, boundary) {
      const col = await coreCol<EditorialReviewRequestDoc>(EDITORIAL_REVIEW_REQUEST_COLLECTION);
      return col.countDocuments({
        userId,
        createdAt: { $gte: boundary },
      });
    },
    async findActiveDuplicate(params) {
      const col = await coreCol<EditorialReviewRequestDoc>(EDITORIAL_REVIEW_REQUEST_COLLECTION);
      const doc = await col.findOne({
        userId: params.userId,
        normalizedText: params.normalizedText,
        sourceType: params.sourceType,
        status: { $in: Array.from(ACTIVE_DEDUPE_STATUSES) },
        createdAt: { $gte: params.createdAtBoundary },
      } as any);
      return doc ? copyDoc(doc) : null;
    },
    async insert(doc) {
      const col = await coreCol<EditorialReviewRequestDoc>(EDITORIAL_REVIEW_REQUEST_COLLECTION);
      const result = await col.insertOne(doc);
      return { ...copyDoc(doc), _id: result.insertedId };
    },
    async update(doc) {
      const col = await coreCol<EditorialReviewRequestDoc>(EDITORIAL_REVIEW_REQUEST_COLLECTION);
      const id = doc._id ?? new ObjectId();
      const { _id: _ignore, ...rest } = copyDoc({ ...doc, _id: id });
      await col.updateOne({ _id: id } as any, { $set: rest as any }, { upsert: true });
      return { ...copyDoc(doc), _id: id };
    },
    async getById(id) {
      const col = await coreCol<EditorialReviewRequestDoc>(EDITORIAL_REVIEW_REQUEST_COLLECTION);
      const oid = toDocId(id);
      if (!oid) return null;
      const doc = await col.findOne({ _id: oid } as any);
      return doc ? clone(doc) : null;
    },
    async list(params) {
      const col = await coreCol<EditorialReviewRequestDoc>(EDITORIAL_REVIEW_REQUEST_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params?.userId) filter.userId = params.userId;
      if (params?.statuses?.length) filter.status = { $in: params.statuses };
      const cursor = col.find(filter as any).sort({ updatedAt: -1 });
      if (typeof params?.limit === "number") cursor.limit(params.limit);
      const docs = await cursor.toArray();
      return docs.map((doc) => copyDoc(doc));
    },
  };
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = createMongoEditorialReviewQueueRepository();
  return repoSingleton;
}

export function setEditorialReviewQueueRepoForTests(
  repo: EditorialReviewQueueRepository | null,
) {
  repoSingleton = repo;
}

export function createEditorialReviewTruthMeta(input?: {
  truthStatus?: TruthStatus | null;
  sourceSupport?: SourceSupport | null;
  sourceStatus?: string | null;
  reviewRecommended?: boolean | null;
  verificationLabel?: UserFacingVerificationLabel | null;
  noTruthPromotion?: true | null;
  noAutoGraphPromotion?: true | null;
}) {
  return {
    truthStatus: input?.truthStatus ?? "draft_analysis",
    sourceSupport: input?.sourceSupport ?? "none",
    sourceStatus: input?.sourceStatus?.trim() || "Analyse-Entwurf",
    reviewRecommended: input?.reviewRecommended ?? true,
    verificationLabel: input?.verificationLabel ?? "analysiert",
    noTruthPromotion: true as const,
    noAutoGraphPromotion: true as const,
  };
}

export function normalizeEditorialReviewText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function resolveEditorialReviewReason(input: {
  preferredReason?: EditorialReviewRequestReason | null;
  truthStatus?: TruthStatus | null;
  sourceSupport?: SourceSupport | null;
  reviewRecommended?: boolean | null;
  fallbackUsed?: boolean | null;
  disagreementPresent?: boolean | null;
  insufficientIndependentSuccess?: boolean | null;
  noSourceBluffingPassed?: boolean | null;
  moderationRequired?: boolean | null;
}) {
  if (input.preferredReason) return input.preferredReason;
  if (input.moderationRequired) return "moderation_required";
  if (input.noSourceBluffingPassed === false) return "no_source_bluffing_failed";
  if (input.insufficientIndependentSuccess) return "insufficient_independent_success";
  if (input.disagreementPresent) return "provider_disagreement";
  if (input.fallbackUsed) return "fallback_used";
  if (input.sourceSupport === "none" || input.sourceSupport === "open") return "source_open";
  if (input.truthStatus === "review_required" || input.reviewRecommended) return "editorial_escalation";
  return "user_requested_review";
}

type CreateEditorialReviewRequestInput = {
  sourceType: EditorialReviewRequestSourceType;
  sourceId?: string | null;
  userId?: string | null;
  originalText: string;
  analysisRunId?: string | null;
  truthStatus?: TruthStatus | null;
  sourceSupport?: SourceSupport | null;
  sourceStatus?: string | null;
  reviewRecommended?: boolean | null;
  verificationLabel?: UserFacingVerificationLabel | null;
  reason?: EditorialReviewRequestReason | null;
  userNote?: string | null;
  fallbackUsed?: boolean | null;
  disagreementPresent?: boolean | null;
  insufficientIndependentSuccess?: boolean | null;
  noSourceBluffingPassed?: boolean | null;
  moderationRequired?: boolean | null;
};

const ACTIVE_DEDUPE_STATUSES = new Set<EditorialReviewRequestStatus>([
  "pending_review",
  "in_review",
  "needs_user_clarification",
  "accepted_for_workup",
]);

export async function createEditorialReviewRequest(
  input: CreateEditorialReviewRequestInput,
): Promise<{ deduped: boolean; reviewRequest: EditorialReviewRequest }> {
  const originalText = String(input.originalText ?? "").trim();
  const normalizedText = normalizeEditorialReviewText(originalText);
  if (!originalText || !normalizedText) {
    throw new Error("editorial_review_text_required");
  }

  const truthMeta = createEditorialReviewTruthMeta({
    truthStatus: input.truthStatus ?? undefined,
    sourceSupport: input.sourceSupport ?? undefined,
    sourceStatus: input.sourceStatus ?? undefined,
    reviewRecommended: input.reviewRecommended ?? undefined,
    verificationLabel: input.verificationLabel ?? undefined,
  });

  const repo = getRepo();
  const now = new Date();
  if (input.userId) {
    const recentCount = await repo.countRecentByUser(
      input.userId,
      new Date(now.getTime() - EDITORIAL_REVIEW_RATE_LIMIT_WINDOW_MS),
    );
    if (recentCount >= EDITORIAL_REVIEW_MAX_REQUESTS_PER_DAY) {
      throw new Error("editorial_review_rate_limited");
    }

    const existing = await repo.findActiveDuplicate({
      userId: input.userId,
      normalizedText,
      sourceType: input.sourceType,
      createdAtBoundary: new Date(now.getTime() - EDITORIAL_REVIEW_DEDUPE_WINDOW_MS),
    });

    if (existing) {
      return {
        deduped: true,
        reviewRequest: toReviewRequest(existing),
      };
    }
  }

  const doc: EditorialReviewRequestDoc = {
    sourceType: input.sourceType,
    sourceId: normalizeOptionalString(input.sourceId),
    userId: normalizeOptionalString(input.userId),
    originalText,
    normalizedText,
    analysisRunId: normalizeOptionalString(input.analysisRunId),
    truthStatus: truthMeta.truthStatus,
    sourceSupport: truthMeta.sourceSupport,
    sourceStatus: truthMeta.sourceStatus,
    reviewRecommended: truthMeta.reviewRecommended,
    verificationLabel: truthMeta.verificationLabel,
    noTruthPromotion: true,
    reason: resolveEditorialReviewReason({
      preferredReason: input.reason,
      truthStatus: truthMeta.truthStatus,
      sourceSupport: truthMeta.sourceSupport,
      reviewRecommended: truthMeta.reviewRecommended,
      fallbackUsed: input.fallbackUsed,
      disagreementPresent: input.disagreementPresent,
      insufficientIndependentSuccess: input.insufficientIndependentSuccess,
      noSourceBluffingPassed: input.noSourceBluffingPassed,
      moderationRequired: input.moderationRequired,
    }),
    userNote: normalizeOptionalString(input.userNote),
    status: "pending_review",
    statusNote: null,
    reviewerNote: null,
    userVisibleNote: null,
    userReplies: [],
    lastUserReplyAt: null,
    clarificationResolvedAt: null,
    createdAt: now,
    updatedAt: now,
    noAutoPublish: true,
    noAutoGraphPromotion: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoVote: true,
    assignedToUserId: null,
    assignedAt: null,
    assignedByUserId: null,
    lastAction: null,
    lastActionAt: null,
    lastActionByUserId: null,
    latestAction: null,
    latestActionAt: null,
    latestActionByUserId: null,
    history: [],
  };

  const saved = await repo.insert(doc);
  return {
    deduped: false,
    reviewRequest: toReviewRequest(saved),
  };
}

export async function getEditorialReviewRequest(id: string) {
  const doc = await getRepo().getById(id);
  return doc ? toReviewRequest(doc) : null;
}

export async function listEditorialReviewRequests(params?: {
  userId?: string | null;
  statuses?: EditorialReviewRequestStatus[];
  limit?: number;
}) {
  const docs = await getRepo().list(params);
  return docs.map(toReviewRequest);
}

function buildEditorialReviewReplyId(input: {
  requestId: string;
  userId: string;
  text: string;
  createdAt: string;
}) {
  return `editorial-reply-${stableHash(`${input.requestId}:${input.userId}:${input.createdAt}:${input.text}`).slice(0, 18)}`;
}

function nextStatusForAction(
  currentStatus: EditorialReviewRequestStatus,
  action: EditorialReviewRequestAction,
) {
  switch (action) {
    case "mark_in_review":
      return "in_review";
    case "needs_user_clarification":
      return "needs_user_clarification";
    case "accept_for_workup":
      return "accepted_for_workup";
    case "reject":
      return "rejected";
    case "archive":
      return "archived";
    case "assign":
    case "unassign":
    case "add_note":
    default:
      return currentStatus;
  }
}

function nextStatusForUserReply(request: Pick<EditorialReviewRequestDoc, "assignedToUserId">) {
  return request.assignedToUserId ? "in_review" : "pending_review";
}

const ALLOWED_ACTIONS_BY_STATUS: Record<
  EditorialReviewRequestStatus,
  ReadonlyArray<EditorialReviewRequestAction>
> = {
  pending_review: ["assign", "unassign", "add_note", "mark_in_review", "reject", "archive"],
  in_review: [
    "assign",
    "unassign",
    "add_note",
    "needs_user_clarification",
    "accept_for_workup",
    "reject",
    "archive",
  ],
  needs_user_clarification: ["assign", "unassign", "add_note", "mark_in_review", "reject", "archive"],
  accepted_for_workup: ["assign", "unassign", "add_note", "archive"],
  rejected: ["add_note", "archive"],
  archived: ["add_note"],
};

function canApplyActionForStatus(
  status: EditorialReviewRequestStatus,
  action: EditorialReviewRequestAction,
) {
  return ALLOWED_ACTIONS_BY_STATUS[status].includes(action);
}

export async function applyEditorialReviewRequestAction(input: {
  requestId: string;
  action: EditorialReviewRequestAction;
  requestedByUserId: string;
  assignedToUserId?: string | null;
  note?: string | null;
}) {
  const repo = getRepo();
  const existing = await repo.getById(input.requestId);
  if (!existing) throw new Error("editorial_review_request_not_found");

  const note = normalizeOptionalString(input.note);
  if (
    (input.action === "needs_user_clarification" || input.action === "reject") &&
    !note
  ) {
    throw new Error("editorial_review_note_required");
  }
  if (!canApplyActionForStatus(existing.status, input.action)) {
    throw new Error("editorial_review_invalid_transition");
  }
  if (existing.status === "archived" && input.action !== "add_note") {
    throw new Error("editorial_review_request_archived");
  }

  const nextStatus = nextStatusForAction(existing.status, input.action);
  const nextAssignedToUserId =
    input.action === "unassign"
      ? null
      : normalizeOptionalString(input.assignedToUserId) ?? existing.assignedToUserId ?? null;
  const at = nowIso();
  const historyEntry: EditorialReviewRequestHistoryEntry = {
    id: buildHistoryId({ requestId: input.requestId, action: input.action, at }),
    action: input.action,
    actionLabel: actionLabel(input.action),
    byUserId: input.requestedByUserId,
    at,
    note,
    previousStatus: existing.status,
    nextStatus,
    previousAssignedToUserId: existing.assignedToUserId ?? null,
    nextAssignedToUserId,
  };

  const nextDoc: EditorialReviewRequestDoc = {
    ...existing,
    updatedAt: new Date(at),
    status: nextStatus,
    statusNote:
      input.action === "needs_user_clarification" || input.action === "reject" || input.action === "add_note"
        ? note
        : existing.statusNote ?? null,
    reviewerNote: note ?? existing.reviewerNote ?? null,
    userVisibleNote:
      input.action === "needs_user_clarification" || input.action === "reject"
        ? note
        : existing.userVisibleNote ?? null,
    clarificationResolvedAt:
      input.action === "needs_user_clarification"
        ? null
        : existing.clarificationResolvedAt ?? null,
    assignedToUserId: nextAssignedToUserId,
    assignedAt: nextAssignedToUserId ? at : null,
    assignedByUserId: nextAssignedToUserId ? input.requestedByUserId : null,
    lastAction: input.action,
    lastActionAt: at,
    lastActionByUserId: input.requestedByUserId,
    latestAction: input.action,
    latestActionAt: at,
    latestActionByUserId: input.requestedByUserId,
    history: [...(Array.isArray(existing.history) ? existing.history : []), historyEntry],
  };

  const saved = await repo.update(nextDoc);
  return {
    reviewRequest: toReviewRequest(saved),
    historyEntry,
  };
}

export async function replyToEditorialReviewRequest(input: {
  requestId: string;
  userId: string;
  text: string;
}) {
  const repo = getRepo();
  const existing = await repo.getById(input.requestId);
  if (!existing) throw new Error("editorial_review_request_not_found");
  if (existing.status === "archived") throw new Error("editorial_review_request_archived");

  const userId = normalizeOptionalString(input.userId);
  const ownerUserId = normalizeOptionalString(existing.userId);
  if (!userId || !ownerUserId || ownerUserId !== userId) {
    throw new Error("editorial_review_forbidden");
  }
  if (existing.status !== "needs_user_clarification") {
    throw new Error("editorial_review_invalid_transition");
  }

  const text = normalizeEditorialReviewText(String(input.text ?? ""));
  if (text.length < EDITORIAL_REVIEW_REPLY_MIN_LENGTH) {
    throw new Error("editorial_review_reply_too_short");
  }

  const at = nowIso();
  const nextStatus = nextStatusForUserReply(existing);
  const reply: EditorialReviewRequestReply = {
    id: buildEditorialReviewReplyId({
      requestId: input.requestId,
      userId,
      text,
      createdAt: at,
    }),
    text,
    createdAt: at,
    userId,
  };
  const historyEntry: EditorialReviewRequestHistoryEntry = {
    id: buildHistoryId({ requestId: input.requestId, action: "user_replied", at }),
    action: "user_replied",
    actionLabel: actionLabel("user_replied"),
    byUserId: userId,
    at,
    note: text,
    previousStatus: existing.status,
    nextStatus,
    previousAssignedToUserId: existing.assignedToUserId ?? null,
    nextAssignedToUserId: existing.assignedToUserId ?? null,
  };

  const nextDoc: EditorialReviewRequestDoc = {
    ...existing,
    updatedAt: new Date(at),
    status: nextStatus,
    userReplies: [...(Array.isArray(existing.userReplies) ? existing.userReplies : []), reply],
    lastUserReplyAt: at,
    clarificationResolvedAt: at,
    lastAction: "user_replied",
    lastActionAt: at,
    lastActionByUserId: userId,
    latestAction: "user_replied",
    latestActionAt: at,
    latestActionByUserId: userId,
    history: [...(Array.isArray(existing.history) ? existing.history : []), historyEntry],
  };

  const saved = await repo.update(nextDoc);
  return {
    reviewRequest: toReviewRequest(saved),
    historyEntry,
    userReply: reply,
  };
}

export function getEditorialReviewStatusLabel(status: EditorialReviewRequestStatus) {
  return statusLabel(status);
}

export function getEditorialReviewReasonLabel(reason: EditorialReviewRequestReason) {
  switch (reason) {
    case "relevance_gate_appeal":
      return "Nutzer-Einspruch";
    case "source_open":
      return "Quellenlage offen";
    case "provider_disagreement":
      return "Provider-Konflikt";
    case "fallback_used":
      return "Fallback verwendet";
    case "insufficient_independent_success":
      return "Unabhängige Gegenprobe fehlt";
    case "no_source_bluffing_failed":
      return "Quellenbezug nicht belastbar";
    case "moderation_required":
      return "Moderation erforderlich";
    case "editorial_escalation":
      return "Redaktionelle Eskalation";
    case "user_requested_review":
    default:
      return "Prüfung angefragt";
  }
}

export function getEditorialReviewSourceTypeLabel(sourceType: EditorialReviewRequestSourceType) {
  switch (sourceType) {
    case "start_draft":
      return "Start-Entwurf";
    case "create_analysis":
      return "Create-Analyse";
    case "factcheck_request":
      return "Factcheck-Anfrage";
    case "theme_suggestion":
      return "Themenvorschlag";
    case "round_draft":
      return "Runden-Entwurf";
    case "user_relevance_appeal":
      return "Relevanz-Einspruch";
    default:
      return sourceType;
  }
}

export function getEditorialReviewNextStepLabel(input: {
  sourceType: EditorialReviewRequestSourceType;
  status: EditorialReviewRequestStatus;
}) {
  if (input.status === "accepted_for_workup") {
    if (input.sourceType === "factcheck_request") return "Quellenprüfung vorbereiten";
    if (input.sourceType === "theme_suggestion") return "Manuell als Thema weiter vorbereiten";
    if (input.sourceType === "round_draft") return "Manuell als Anlassraum-Entwurf weiter vorbereiten";
    return "Manuell weiter bearbeiten";
  }
  if (input.status === "needs_user_clarification") return "Auf Rückmeldung warten";
  if (input.sourceType === "theme_suggestion") return "Themenzuschnitt prüfen";
  if (input.sourceType === "round_draft") return "Anlassraum-Entwurf prüfen";
  if (input.sourceType === "factcheck_request") return "Quellenprüfung vorbereiten";
  return "Manuell prüfen";
}

export function getEditorialReviewFilterLabel(filter: string) {
  switch (filter) {
    case "review_recommended":
      return "Prüfung empfohlen";
    case "source_open":
      return "Quellenlage offen";
    case "user_appeal":
      return "Nutzer-Einspruch";
    case "provider_conflict":
      return "Fallback/Provider-Konflikt";
    case "factcheck_requested":
      return "Factcheck angefragt";
    default:
      return "Alle";
  }
}

export function matchesEditorialReviewFilter(
  request: Pick<
    EditorialReviewRequest,
    "reason" | "sourceType" | "sourceSupport" | "reviewRecommended"
  >,
  filter: string,
) {
  switch (filter) {
    case "review_recommended":
      return request.reviewRecommended;
    case "source_open":
      return request.reason === "source_open" || request.sourceSupport === "none" || request.sourceSupport === "open";
    case "user_appeal":
      return request.reason === "relevance_gate_appeal";
    case "provider_conflict":
      return request.reason === "fallback_used" ||
        request.reason === "provider_disagreement" ||
        request.reason === "insufficient_independent_success";
    case "factcheck_requested":
      return request.sourceType === "factcheck_request";
    default:
      return true;
  }
}
