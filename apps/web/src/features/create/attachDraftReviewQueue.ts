import { ObjectId } from "@core/db/triMongo";
import type { GovernanceActor } from "@features/trust/types";
import {
  CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION,
  createApplyHistoryEvent,
  createReviewHistoryEvent,
  isCreatePrepareAttachHistoryType,
  type CreatePrepareAttachApplyHistoryEvent,
  type CreatePrepareAttachDraftHistoryEvent,
  type CreatePrepareAttachDraftHistoryEventDoc,
  type CreatePrepareAttachHistoryType,
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
  historyHasMore?: boolean;
  historyNextCursor?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreatePrepareAttachDraftHistoryPage = {
  events: CreatePrepareAttachDraftHistoryEvent[];
  reviewEvents: CreatePrepareAttachReviewHistoryEvent[];
  applyEvents: CreatePrepareAttachApplyHistoryEvent[];
  hasMore: boolean;
  nextCursor: string | null;
  nextScanCursor: string | null;
};

type HistoryCursorPayload = {
  draftId: string;
  createdAt: string;
  oid: string;
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
      const history = historyMap.get(item.draftId) ?? {
        reviewEvents: [],
        applyEvents: [],
        hasMore: false,
        nextCursor: null,
        nextScanCursor: null,
      };
      return {
        ...item,
        reviewEvents: history.reviewEvents,
        applyEvents: history.applyEvents,
        historyHasMore: history.hasMore,
        historyNextCursor: history.nextCursor,
      };
    }),
    total,
  };
}

export async function getCreatePrepareAttachDraftHistory(params: {
  actor: GovernanceActor;
  draftId: string;
  maxEventsPerType?: number;
  limit?: number;
  cursor?: string | null;
  type?: CreatePrepareAttachHistoryType;
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
  const type = normalizeHistoryType(params.type);
  const parsedLimit = Number.isFinite(Number(params.limit))
    ? Number(params.limit)
    : Number(params.maxEventsPerType ?? 80);
  const limit = Math.max(1, Math.min(100, parsedLimit));
  const page = await getCreatePrepareAttachDraftHistoryPage({
    draftId,
    type,
    cursor: params.cursor ?? null,
    limit,
  });
  const events = page.events;
  return {
    draft: {
      ...mapDocToQueueItem(draft as CreatePrepareAttachDraftDoc),
      reviewEvents: page.reviewEvents,
      applyEvents: page.applyEvents,
      historyHasMore: page.hasMore,
      historyNextCursor: page.nextCursor,
    },
    events,
    latestEvent: events.length > 0 ? events[0] : null,
    reviewEvents: page.reviewEvents,
    applyEvents: page.applyEvents,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
    nextScanCursor: page.nextScanCursor,
    cursor: params.cursor ?? null,
    type,
    limit,
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
    historyHasMore: false,
    historyNextCursor: null,
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
  const map = new Map<string, CreatePrepareAttachDraftHistoryPage>();
  for (const id of ids) {
    map.set(id, {
      events: [],
      reviewEvents: [],
      applyEvents: [],
      hasMore: false,
      nextCursor: null,
      nextScanCursor: null,
    });
  }
  if (ids.length === 0) return map;

  const previewLimit = Math.max(2, Math.min(10, params.maxEventsPerType));
  const pages = await Promise.all(
    ids.map(async (draftId) => [
      draftId,
      await getCreatePrepareAttachDraftHistoryPage({
        draftId,
        type: "all",
        limit: previewLimit,
        cursor: null,
      }),
    ] as const),
  );
  for (const [draftId, page] of pages) {
    map.set(draftId, {
      ...page,
      reviewEvents: page.reviewEvents.slice(0, params.maxEventsPerType),
      applyEvents: page.applyEvents.slice(0, params.maxEventsPerType),
    });
  }

  return map;
}

export function normalizeHistoryType(value: unknown): CreatePrepareAttachHistoryType {
  return isCreatePrepareAttachHistoryType(String(value || "")) ? String(value) as CreatePrepareAttachHistoryType : "all";
}

export async function getCreatePrepareAttachDraftHistoryPage(params: {
  draftId: string;
  type: CreatePrepareAttachHistoryType;
  cursor?: string | null;
  limit: number;
}): Promise<CreatePrepareAttachDraftHistoryPage> {
  const History = await createPrepareAttachHistoryEventsCol();
  const type = normalizeHistoryType(params.type);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
  let scanCursor = decodeHistoryCursor(params.cursor ?? null, params.draftId);
  const accepted: Array<{ event: CreatePrepareAttachDraftHistoryEvent; cursor: HistoryCursorPayload }> = [];
  const batchSize = Math.max(20, Math.min(120, limit * 2));
  let exhausted = false;
  let safetyRuns = 0;
  let lastScannedCursor: HistoryCursorPayload | null = null;

  while (accepted.length < limit + 1 && !exhausted && safetyRuns < 24) {
    safetyRuns += 1;
    const filter = buildHistoryRawFilter({
      draftId: params.draftId,
      type,
      cursor: scanCursor,
    });
    const rows = await History.find(filter).sort({ createdAt: -1, _id: -1 }).limit(batchSize).toArray();
    if (rows.length === 0) {
      exhausted = true;
      break;
    }

    for (const row of rows as CreatePrepareAttachDraftHistoryEventDoc[]) {
      const rowCursor = getRowCursor(row, params.draftId);
      if (!rowCursor) continue;
      lastScannedCursor = rowCursor;
      scanCursor = rowCursor;
      const event = normalizeHistoryDoc(row, { fallbackDraftId: params.draftId });
      if (!event) continue;
      if (type !== "all" && event.eventType !== type) continue;
      accepted.push({ event, cursor: rowCursor });
      if (accepted.length >= limit + 1) break;
    }

    if (accepted.length >= limit + 1) break;
    if (rows.length < batchSize) {
      exhausted = true;
      break;
    }
  }

  const pageAccepted = accepted.slice(0, limit);
  const events = pageAccepted.map((entry) => entry.event);
  const reviewEvents = events.filter((event): event is CreatePrepareAttachReviewHistoryEvent => event.eventType === "review");
  const applyEvents = events.filter((event): event is CreatePrepareAttachApplyHistoryEvent => event.eventType === "apply");
  const hasMore = accepted.length > limit;
  const nextCursor =
    hasMore && pageAccepted.length > 0
      ? encodeHistoryCursor(pageAccepted[pageAccepted.length - 1]?.cursor ?? null)
      : null;
  const nextScanCursor = hasMore ? encodeHistoryCursor(lastScannedCursor) : null;

  return {
    events,
    reviewEvents,
    applyEvents,
    hasMore,
    nextCursor,
    nextScanCursor,
  };
}

function normalizeHistoryDoc(
  row: CreatePrepareAttachDraftHistoryEventDoc,
  options?: { fallbackDraftId?: string },
): CreatePrepareAttachDraftHistoryEvent | null {
  if (!row || typeof row !== "object") return null;
  const raw = row as Record<string, unknown>;
  const draftId = String(raw.draftId || options?.fallbackDraftId || "").trim();
  if (!draftId) return null;
  const inferredType = inferHistoryEventType(raw);
  if (!inferredType) return null;
  const inferredEventType = inferredType;
  const actorUserId = inferActorUserId(raw);
  const createdAt = normalizeEventTimestamp(raw, raw.createdAt, raw.reviewedAt, raw.appliedAt, raw.updatedAt);
  const eventType = inferredEventType;
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
    (typeof raw.eventId === "string" && raw.eventId.trim()) ||
    row._id?.toHexString?.() ||
    deriveDeterministicObjectIdHex(
      `${draftId}|${createdAt}|${String(raw.actorUserId || raw.reviewedBy || raw.appliedBy || "")}|${eventType}|${String(raw.result || "")}`,
    );
  const previousReviewParsed = parseReviewState(raw.previousReviewState);
  const nextReviewParsed = parseReviewState(raw.nextReviewState);
  const legacyReviewDecision = parseReviewDecision(raw.nextReviewState) ?? parseReviewDecision(raw.reviewState);
  const previousApplyParsed = parseApplyState(raw.previousApplyState);
  const nextApplyParsed = parseApplyState(raw.nextApplyState);
  const legacyMeta = buildLegacyNormalizationMeta(raw, inferredEventType);
  if (eventType === "review") {
    const previousReviewState = previousReviewParsed ?? "pending";
    const nextReviewState = legacyReviewDecision ?? "parked";
    const previousApplyState = previousApplyParsed ?? "not_applied";
    const nextApplyState = nextApplyParsed ?? "not_applied";
    return createReviewHistoryEvent({
      draftId,
      actorUserId,
      previousReviewState,
      nextReviewState,
      previousApplyState,
      nextApplyState,
      reviewNote: reviewNoteValue,
      normalizedFromLegacy: legacyMeta.normalizedFromLegacy,
      legacyNormalizationReason: legacyMeta.reason,
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
      result: resultValue === "applied" ? "applied" : "failed",
      applyNote: applyNoteValue,
      mutationType: mutationTypeValue,
      errorCode: errorCodeValue,
      normalizedFromLegacy: legacyMeta.normalizedFromLegacy,
      legacyNormalizationReason: legacyMeta.reason,
      previousReviewState,
      nextReviewState,
      previousApplyState,
      nextApplyState,
      createdAt,
      eventId: eventIdValue,
    });
  }

  return null;
}

function buildHistoryRawFilter(params: {
  draftId: string;
  type: CreatePrepareAttachHistoryType;
  cursor: HistoryCursorPayload | null;
}) {
  const clauses: Record<string, unknown>[] = [{ draftId: params.draftId }];
  if (params.type === "review") {
    clauses.push({
      $or: [{ eventType: "review" }, { eventType: { $exists: false } }],
    });
  } else if (params.type === "apply") {
    clauses.push({
      $or: [{ eventType: "apply" }, { result: { $in: ["applied", "failed"] } }, { eventType: { $exists: false } }],
    });
  }
  if (params.cursor) {
    clauses.push({
      $or: [
        { createdAt: { $lt: params.cursor.createdAt } },
        { createdAt: params.cursor.createdAt, _id: { $lt: new ObjectId(params.cursor.oid) } },
      ],
    });
  }
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

function buildLegacyNormalizationMeta(
  raw: Record<string, unknown>,
  inferredEventType: "review" | "apply",
  additionalReason?: string | null,
) {
  const reasons: string[] = [];
  const schemaVersion = String(raw.schemaVersion || "");
  if (schemaVersion !== CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION) {
    reasons.push("schema_version_normalized");
  }
  const rawEventType = typeof raw.eventType === "string" ? raw.eventType : null;
  if (rawEventType !== inferredEventType) {
    reasons.push("event_type_inferred");
  }
  if (!raw.actorUserId && (raw.reviewedBy || raw.appliedBy)) {
    reasons.push("actor_inferred");
  }
  if (!raw.createdAt && (raw.reviewedAt || raw.appliedAt || raw.updatedAt)) {
    reasons.push("timestamp_inferred");
  }
  if (additionalReason) reasons.push(additionalReason);
  return {
    normalizedFromLegacy: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join(",") : null,
  };
}

function inferHistoryEventType(raw: Record<string, unknown>): "review" | "apply" | null {
  if (raw.eventType === "review" || raw.eventType === "apply") return raw.eventType;
  const hasReviewSignal =
    parseReviewDecision(raw.nextReviewState) !== null ||
    parseReviewDecision(raw.reviewState) !== null ||
    typeof raw.reviewNote === "string" ||
    typeof raw.reviewedBy === "string";
  const hasApplySignal =
    raw.result === "applied" ||
    raw.result === "failed" ||
    parseApplyState(raw.nextApplyState) !== null ||
    parseApplyState(raw.applyState) !== null ||
    typeof raw.applyNote === "string" ||
    typeof raw.applyError === "string" ||
    typeof raw.targetType === "string" ||
    typeof raw.targetId === "string";
  if (hasReviewSignal && !hasApplySignal) return "review";
  if (hasApplySignal) return "apply";
  if (hasReviewSignal) return "review";
  return null;
}

function inferActorUserId(raw: Record<string, unknown>) {
  const actor = String(raw.actorUserId || raw.reviewedBy || raw.appliedBy || "").trim();
  return actor || "unknown";
}

function normalizeEventTimestamp(raw: Record<string, unknown>, ...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (!Number.isNaN(Date.parse(trimmed))) return trimmed;
  }
  const objectId = parseObjectIdLike(raw._id);
  if (objectId) {
    return objectId.getTimestamp().toISOString();
  }
  return "1970-01-01T00:00:00.000Z";
}

function getRowCursor(row: CreatePrepareAttachDraftHistoryEventDoc, draftId: string): HistoryCursorPayload | null {
  const raw = row as Record<string, unknown>;
  const createdAt = normalizeEventTimestamp(raw, raw.createdAt, raw.reviewedAt, raw.appliedAt, raw.updatedAt);
  const objectId = parseObjectIdLike(raw._id);
  const oid =
    objectId?.toHexString() ??
    deriveDeterministicObjectIdHex(
      `${draftId}|${createdAt}|${String(raw.eventId || "")}|${String(raw.actorUserId || raw.reviewedBy || raw.appliedBy || "")}`,
    );
  if (!ObjectId.isValid(oid)) return null;
  return { draftId, createdAt, oid };
}

function encodeHistoryCursor(payload: HistoryCursorPayload | null) {
  if (!payload) return null;
  const raw = JSON.stringify(payload);
  return toBase64Url(raw);
}

function decodeHistoryCursor(value: string | null, expectedDraftId: string): HistoryCursorPayload | null {
  if (!value) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(String(value)));
  } catch {
    throw new Error("invalid_history_cursor");
  }
  const obj = parsed as Record<string, unknown>;
  const draftId = String(obj.draftId || "").trim();
  const createdAt = String(obj.createdAt || "").trim();
  const oid = String(obj.oid || "").trim();
  if (
    !draftId ||
    draftId !== expectedDraftId ||
    !createdAt ||
    Number.isNaN(Date.parse(createdAt)) ||
    !ObjectId.isValid(oid)
  ) {
    throw new Error("invalid_history_cursor");
  }
  return {
    draftId,
    createdAt,
    oid: new ObjectId(oid).toHexString(),
  };
}

function parseObjectIdLike(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  return null;
}

function deriveDeterministicObjectIdHex(seed: string): string {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const head = (hash >>> 0).toString(16).padStart(8, "0");
  const body = seed
    .split("")
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16)
    .padEnd(16, "0");
  return `${head}${body}`.slice(0, 24);
}

function toBase64Url(value: string) {
  const bufferCtor = (globalThis as { Buffer?: { from: (v: string, e?: string) => { toString: (e?: string) => string } } }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(value, "utf8").toString("base64url");
  }
  const btoaFn = (globalThis as { btoa?: (value: string) => string }).btoa;
  const TextEncoderCtor = (globalThis as { TextEncoder?: new () => { encode: (value: string) => Uint8Array } }).TextEncoder;
  if (typeof btoaFn === "function" && TextEncoderCtor) {
    const bytes = new TextEncoderCtor().encode(value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoaFn(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  throw new Error("history_cursor_encoding_unavailable");
}

function fromBase64Url(value: string) {
  const bufferCtor = (globalThis as { Buffer?: { from: (v: string, e?: string) => { toString: (e?: string) => string } } }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(value, "base64url").toString("utf8");
  }
  const atobFn = (globalThis as { atob?: (value: string) => string }).atob;
  const TextDecoderCtor = (globalThis as { TextDecoder?: new () => { decode: (value: Uint8Array) => string } }).TextDecoder;
  if (typeof atobFn === "function" && TextDecoderCtor) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atobFn(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new TextDecoderCtor().decode(bytes);
  }
  throw new Error("history_cursor_decoding_unavailable");
}

function parseReviewState(value: unknown): CreatePrepareAttachDraftReviewState | null {
  if (typeof value !== "string") return null;
  return isCreatePrepareAttachDraftReviewState(value) ? value : null;
}

function parseReviewDecision(value: unknown): CreatePrepareAttachDraftReviewDecision | null {
  if (typeof value !== "string") return null;
  if (value === "accepted_for_apply") return value;
  if (value === "rejected") return value;
  if (value === "parked") return value;
  return null;
}

function parseApplyState(value: unknown): CreatePrepareAttachDraftApplyState | null {
  if (typeof value !== "string") return null;
  return isCreatePrepareAttachDraftApplyState(value) ? value : null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
