import { ObjectId } from "@core/db/triMongo";
import type { GovernanceActor } from "@features/trust/types";
import {
  createApplyHistoryEvent,
  createReviewHistoryEvent,
  type CreatePrepareAttachApplyHistoryEvent,
  type CreatePrepareAttachDraftHistoryEvent,
  type CreatePrepareAttachDraftHistoryEventDoc,
  type CreatePrepareAttachReviewHistoryEvent,
} from "@/features/create/attachDraftHistory";
import { createPrepareAttachDraftsCol, createPrepareAttachHistoryEventsCol } from "@/features/create/attachDraftCollections";
import {
  applyPrepareAttachDraftReviewDecision,
  isCreatePrepareAttachDraftApplyState,
  isCreatePrepareAttachDraftReviewState,
  normalizeCreatePrepareAttachDraftVersion,
  type CreatePrepareAttachDraft,
  type CreatePrepareAttachDraftApplyState,
  type CreatePrepareAttachDraftReviewDecision,
  type CreatePrepareAttachDraftReviewState,
} from "@/features/create/prepareAttachDraft";

type CreatePrepareAttachDraftDoc = Omit<CreatePrepareAttachDraft, "draftId"> & {
  _id: ObjectId;
  draftId: string;
  authorId: string;
  status: "draft_intent";
};

export type CreatePrepareAttachDraftQueueItem = {
  draftId: string;
  ctaId: CreatePrepareAttachDraft["ctaId"];
  matchType: CreatePrepareAttachDraft["matchType"] | null;
  matchEntityType: CreatePrepareAttachDraft["matchEntityType"] | null;
  attachTargetType: CreatePrepareAttachDraft["attachTargetType"] | null;
  attachTargetId: string | null;
  attachTargetLabel: string | null;
  sourceSummary: string;
  reasons: string[];
  duplicateRisk: boolean;
  requiresReview: true;
  reviewState: CreatePrepareAttachDraftReviewState;
  applyState: CreatePrepareAttachDraftApplyState;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  appliedAt: string | null;
  appliedBy: string | null;
  applyNote: string | null;
  applyError: string | null;
  version: number;
  reviewEvents?: CreatePrepareAttachReviewHistoryEvent[];
  applyEvents?: CreatePrepareAttachApplyHistoryEvent[];
  createdAt: string;
  updatedAt: string;
};

export async function listCreatePrepareAttachDraftQueue(params: {
  actor: GovernanceActor;
  reviewState: CreatePrepareAttachDraftReviewState | "all";
  page: number;
  pageSize: number;
  q: string;
}) {
  assertReviewQueueActor(params.actor);
  const Drafts = await createPrepareAttachDraftsCol();

  const conditions: Record<string, unknown>[] = [{ status: "draft_intent" }];
  if (params.reviewState !== "all") {
    conditions.push({ reviewState: params.reviewState });
  }
  if (params.q.trim()) {
    const pattern = new RegExp(escapeRegex(params.q.trim()).slice(0, 120), "i");
    conditions.push({
      $or: [{ sourceSummary: pattern }, { attachTargetLabel: pattern }, { attachTargetId: pattern }],
    });
  }

  const filter = conditions.length > 1 ? { $and: conditions } : conditions[0];
  const skip = (params.page - 1) * params.pageSize;
  const total = await Drafts.countDocuments(filter);
  const docs = await Drafts.find(filter).sort({ createdAt: -1 }).skip(skip).limit(params.pageSize).toArray();
  const baseItems = docs.map((doc) => mapDocToQueueItem(doc as CreatePrepareAttachDraftDoc));
  const historyMap = await loadCreatePrepareAttachDraftHistory({
    draftIds: baseItems.map((item) => item.draftId),
    maxEventsPerType: 8,
  });

  return {
    items: baseItems.map((item) => {
      const history = historyMap.get(item.draftId) ?? { reviewEvents: [], applyEvents: [] };
      return {
        ...item,
        reviewEvents: history.reviewEvents,
        applyEvents: history.applyEvents,
      };
    }),
    total,
  };
}

export async function getCreatePrepareAttachDraftHistory(params: {
  actor: GovernanceActor;
  draftId: string;
  maxEventsPerType?: number;
}) {
  assertReviewQueueActor(params.actor);
  if (!ObjectId.isValid(params.draftId)) {
    throw new Error("invalid_attach_draft_id");
  }
  const Drafts = await createPrepareAttachDraftsCol();
  const _id = new ObjectId(params.draftId);
  const draft = await Drafts.findOne({ _id, status: "draft_intent" });
  if (!draft) {
    throw new Error("attach_draft_not_found");
  }
  const draftId = String((draft as CreatePrepareAttachDraftDoc).draftId || _id.toHexString());
  const historyMap = await loadCreatePrepareAttachDraftHistory({
    draftIds: [draftId],
    maxEventsPerType: Math.max(1, Math.min(150, Number(params.maxEventsPerType ?? 80))),
  });
  const history = historyMap.get(draftId) ?? {
    reviewEvents: [],
    applyEvents: [],
  };
  const events = [...history.reviewEvents, ...history.applyEvents].sort((a, b) =>
    String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
  );
  return {
    draft: {
      ...mapDocToQueueItem(draft as CreatePrepareAttachDraftDoc),
      reviewEvents: history.reviewEvents,
      applyEvents: history.applyEvents,
    },
    events,
    latestEvent: events.length > 0 ? events[events.length - 1] : null,
    reviewEvents: history.reviewEvents,
    applyEvents: history.applyEvents,
  };
}

export async function reviewCreatePrepareAttachDraft(params: {
  actor: GovernanceActor;
  draftId: string;
  decision: CreatePrepareAttachDraftReviewDecision;
  reviewNote?: string | null;
}) {
  assertReviewQueueActor(params.actor);
  if (!ObjectId.isValid(params.draftId)) {
    throw new Error("invalid_attach_draft_id");
  }

  const Drafts = await createPrepareAttachDraftsCol();
  const _id = new ObjectId(params.draftId);
  const existing = (await Drafts.findOne({ _id, status: "draft_intent" })) as CreatePrepareAttachDraftDoc | null;
  if (!existing) {
    throw new Error("attach_draft_not_found");
  }
  if (existing.applyState && existing.applyState !== "not_applied") {
    throw new Error("attach_draft_already_applied");
  }
  const draftId = existing.draftId || _id.toHexString();
  const previousReviewState = isCreatePrepareAttachDraftReviewState(existing.reviewState)
    ? existing.reviewState
    : "pending";
  const previousApplyState = isCreatePrepareAttachDraftApplyState(existing.applyState)
    ? existing.applyState
    : "not_applied";
  const expectedVersion = normalizeCreatePrepareAttachDraftVersion((existing as Record<string, unknown>).version);

  const reviewedAt = new Date().toISOString();
  const reviewedBy = params.actor.userId;
  const review = applyPrepareAttachDraftReviewDecision({
    decision: params.decision,
    reviewNote: params.reviewNote ?? null,
    reviewedAt,
    reviewedBy,
  });
  const updateRes = await Drafts.updateOne(
    {
      _id,
      status: "draft_intent",
      reviewState: previousReviewState,
      applyState: previousApplyState,
      $or: [{ version: expectedVersion }, { version: { $exists: false } }],
    },
    {
      $set: {
        ...review,
        applyState: "not_applied",
        version: expectedVersion + 1,
        updatedAt: reviewedAt,
      },
    },
  );
  if (updateRes.modifiedCount !== 1) {
    throw new Error("attach_draft_state_conflict");
  }

  const History = await createPrepareAttachHistoryEventsCol();
  const event = createReviewHistoryEvent({
    draftId,
    actorUserId: reviewedBy,
    previousReviewState,
    nextReviewState: params.decision,
    previousApplyState,
    nextApplyState: "not_applied",
    reviewNote: params.reviewNote ?? null,
    createdAt: reviewedAt,
  });
  await History.insertOne(event);

  const updated = (await Drafts.findOne({ _id })) as CreatePrepareAttachDraftDoc | null;
  if (!updated) {
    throw new Error("attach_draft_not_found");
  }
  return mapDocToQueueItem(updated);
}

export function normalizeCreatePrepareAttachDraftReviewState(
  value: string | null | undefined,
): CreatePrepareAttachDraftReviewState | "all" {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "all") return "all";
  if (isCreatePrepareAttachDraftReviewState(normalized)) return normalized;
  return "all";
}

function assertReviewQueueActor(actor: GovernanceActor) {
  if (actor.isAdmin) return;
  if (actor.role === "reviewer") return;
  if (actor.role === "editorial_actor") return;
  throw new Error("actor_scope_forbidden");
}

function mapDocToQueueItem(doc: CreatePrepareAttachDraftDoc): CreatePrepareAttachDraftQueueItem {
  const reviewState = isCreatePrepareAttachDraftReviewState(doc.reviewState) ? doc.reviewState : "pending";
  const applyState = isCreatePrepareAttachDraftApplyState(doc.applyState)
    ? doc.applyState
    : "not_applied";
  return {
    draftId: doc.draftId || doc._id.toHexString(),
    ctaId: doc.ctaId,
    matchType: doc.matchType ?? null,
    matchEntityType: doc.matchEntityType ?? null,
    attachTargetType: doc.attachTargetType ?? null,
    attachTargetId: doc.attachTargetId ?? null,
    attachTargetLabel: doc.attachTargetLabel ?? null,
    sourceSummary: doc.sourceSummary || "",
    reasons: Array.isArray(doc.reasons) ? doc.reasons.filter(Boolean).slice(0, 12) : [],
    duplicateRisk: !!doc.duplicateRisk,
    requiresReview: true,
    reviewState,
    applyState,
    reviewNote: doc.reviewNote ?? null,
    reviewedAt: doc.reviewedAt ?? null,
    reviewedBy: doc.reviewedBy ?? null,
    appliedAt: doc.appliedAt ?? null,
    appliedBy: doc.appliedBy ?? null,
    applyNote: doc.applyNote ?? null,
    applyError: doc.applyError ?? null,
    version: normalizeCreatePrepareAttachDraftVersion((doc as Record<string, unknown>).version),
    reviewEvents: [],
    applyEvents: [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function loadCreatePrepareAttachDraftHistory(params: {
  draftIds: string[];
  maxEventsPerType: number;
}) {
  const ids = Array.from(
    new Set(
      params.draftIds
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
  const map = new Map<string, { reviewEvents: CreatePrepareAttachReviewHistoryEvent[]; applyEvents: CreatePrepareAttachApplyHistoryEvent[] }>();
  for (const id of ids) {
    map.set(id, { reviewEvents: [], applyEvents: [] });
  }
  if (ids.length === 0) return map;

  const rows = await (await createPrepareAttachHistoryEventsCol())
    .find({ draftId: { $in: ids } })
    .sort({ createdAt: -1, _id: -1 })
    .toArray();

  for (const row of rows as CreatePrepareAttachDraftHistoryEventDoc[]) {
    const event = normalizeHistoryDoc(row);
    if (!event) continue;
    const next = map.get(event.draftId);
    if (!next) continue;
    if (event.eventType === "review") {
      if (next.reviewEvents.length >= params.maxEventsPerType) continue;
      next.reviewEvents.push(event);
      continue;
    }
    if (next.applyEvents.length >= params.maxEventsPerType) continue;
    next.applyEvents.push(event);
  }

  return map;
}

function normalizeHistoryDoc(
  row: CreatePrepareAttachDraftHistoryEventDoc,
): CreatePrepareAttachDraftHistoryEvent | null {
  if (!row || typeof row !== "object") return null;
  const raw = row as Record<string, unknown>;
  const draftId = String(raw.draftId || "").trim();
  const actorUserId = String(raw.actorUserId || "").trim();
  const createdAt = String(raw.createdAt || "").trim();
  if (!draftId || !actorUserId || !createdAt) return null;
  const eventType = typeof raw.eventType === "string" ? raw.eventType : null;
  const resultValue = raw.result === "failed" ? "failed" : raw.result === "applied" ? "applied" : null;
  const targetTypeValue =
    raw.targetType === "claim" ||
    raw.targetType === "anlassraum" ||
    raw.targetType === "dossier" ||
    raw.targetType === "perspective"
      ? raw.targetType
      : "unknown";
  const targetIdValue = raw.targetId == null ? null : String(raw.targetId);
  const applyNoteValue = raw.applyNote == null ? null : String(raw.applyNote);
  const mutationTypeValue = raw.mutationType == null ? null : String(raw.mutationType);
  const errorCodeValue = raw.errorCode == null ? null : String(raw.errorCode);
  const reviewNoteValue = raw.reviewNote == null ? null : String(raw.reviewNote);
  const eventIdValue =
    (typeof raw.eventId === "string" && raw.eventId.trim()) || row._id?.toHexString?.();
  const previousReviewParsed = parseReviewState(raw.previousReviewState);
  const nextReviewParsed = parseReviewState(raw.nextReviewState);
  const previousApplyParsed = parseApplyState(raw.previousApplyState);
  const nextApplyParsed = parseApplyState(raw.nextApplyState);
  if (eventType === "review") {
    const previousReviewState = previousReviewParsed ?? "pending";
    const nextReviewState = nextReviewParsed ?? "pending";
    const previousApplyState = previousApplyParsed ?? "not_applied";
    const nextApplyState = nextApplyParsed ?? "not_applied";
    if (!["accepted_for_apply", "rejected", "parked", "pending"].includes(nextReviewState)) return null;
    return createReviewHistoryEvent({
      draftId,
      actorUserId,
      previousReviewState,
      nextReviewState: nextReviewState as CreatePrepareAttachDraftReviewDecision,
      previousApplyState,
      nextApplyState,
      reviewNote: reviewNoteValue,
      createdAt,
      eventId: eventIdValue,
    });
  }
  if (eventType === "apply") {
    const previousReviewState =
      previousReviewParsed ?? nextReviewParsed ?? null;
    const nextReviewState = nextReviewParsed ?? previousReviewState;
    const previousApplyState =
      previousApplyParsed ?? nextApplyParsed ?? "not_applied";
    const nextApplyState =
      nextApplyParsed ??
      (resultValue === "failed"
        ? "apply_failed"
        : resultValue === "applied"
        ? "applied"
        : "not_applied");
    return createApplyHistoryEvent({
      draftId,
      actorUserId,
      targetType: targetTypeValue,
      targetId: targetIdValue,
      result: resultValue === "failed" ? "failed" : "applied",
      applyNote: applyNoteValue,
      mutationType: mutationTypeValue,
      errorCode: errorCodeValue,
      previousReviewState,
      nextReviewState,
      previousApplyState,
      nextApplyState,
      createdAt,
      eventId: eventIdValue,
    });
  }

  // Backward-compat for older apply event shape without explicit eventType.
  if (resultValue === "applied" || resultValue === "failed") {
    return createApplyHistoryEvent({
      draftId,
      actorUserId,
      targetType: targetTypeValue,
      targetId: targetIdValue,
      result: resultValue,
      applyNote: applyNoteValue,
      mutationType: mutationTypeValue,
      errorCode: errorCodeValue,
      previousReviewState:
        previousReviewParsed ?? null,
      nextReviewState:
        nextReviewParsed ?? null,
      previousApplyState:
        previousApplyParsed ?? "not_applied",
      nextApplyState:
        nextApplyParsed ??
        (resultValue === "failed"
          ? "apply_failed"
          : "applied"),
      createdAt,
      eventId: eventIdValue,
    });
  }
  return null;
}

function parseReviewState(value: unknown): CreatePrepareAttachDraftReviewState | null {
  if (typeof value !== "string") return null;
  return isCreatePrepareAttachDraftReviewState(value) ? value : null;
}

function parseApplyState(value: unknown): CreatePrepareAttachDraftApplyState | null {
  if (typeof value !== "string") return null;
  return isCreatePrepareAttachDraftApplyState(value) ? value : null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
