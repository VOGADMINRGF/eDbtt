import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";

export const REVIEW_QUEUE_OPERATION_ACTIONS = [
  "assign",
  "unassign",
  "add_note",
  "request_changes",
  "mark_in_review",
  "mark_ready",
  "archive",
  "block",
] as const;

export type ReviewQueueOperationAction = (typeof REVIEW_QUEUE_OPERATION_ACTIONS)[number];

export const REVIEW_QUEUE_OPERATION_STATUSES = [
  "open",
  "in_review",
  "request_changes",
  "ready",
  "archived",
  "blocked",
] as const;

export type ReviewQueueOperationalStatus = (typeof REVIEW_QUEUE_OPERATION_STATUSES)[number];

export type ReviewQueueOperationRecord = {
  itemId: string;
  operationalStatus: ReviewQueueOperationalStatus;
  assignedToUserId: string | null;
  assignedByUserId: string | null;
  assignedAt: string | null;
  noteCount: number;
  latestNote: string | null;
  latestNoteAt: string | null;
  latestAction: ReviewQueueOperationAction | null;
  latestActionAt: string | null;
  latestActionByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewQueueOperationAuditEvent = {
  id: string;
  itemId: string;
  action: ReviewQueueOperationAction;
  byUserId: string;
  at: string;
  note: string | null;
  previousOperationalStatus: ReviewQueueOperationalStatus;
  nextOperationalStatus: ReviewQueueOperationalStatus;
  previousAssignedToUserId: string | null;
  nextAssignedToUserId: string | null;
};

export const REVIEW_QUEUE_OPERATION_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
] as const;

export type ReviewQueueOperationPersistenceMode =
  (typeof REVIEW_QUEUE_OPERATION_PERSISTENCE_MODES)[number];

export type ReviewQueueOperationPersistenceState = {
  mode: ReviewQueueOperationPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "ReviewQueueOperationsRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
};

export type ReviewQueueOperationAuditByItem = Record<
  string,
  ReviewQueueOperationAuditEvent[]
>;

export type ReviewQueueOperationsRepository = {
  saveRecord(record: ReviewQueueOperationRecord): Promise<void>;
  getRecord(itemId: string): Promise<ReviewQueueOperationRecord | null>;
  listRecords(): Promise<ReviewQueueOperationRecord[]>;
  appendAuditEvent(event: ReviewQueueOperationAuditEvent): Promise<void>;
  listAuditEvents(itemId: string): Promise<ReviewQueueOperationAuditEvent[]>;
  listAuditEventsForItems(
    itemIds: string[],
    limitPerItem?: number,
  ): Promise<ReviewQueueOperationAuditByItem>;
  getPersistenceState(): ReviewQueueOperationPersistenceState;
};

export type ReviewQueueOperationRepo = ReviewQueueOperationsRepository;

const RECORDS_COLLECTION = "review_queue_operation_records";
const AUDIT_COLLECTION = "review_queue_operation_audit";

let repoSingleton: ReviewQueueOperationsRepository | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function recordDoc(itemId: string, record: ReviewQueueOperationRecord) {
  return {
    _id: itemId,
    ...clone(record),
  };
}

function auditEventIdFor(itemId: string, action: ReviewQueueOperationAction, at: string) {
  return `review-queue-audit-${stableHash(`${itemId}:${action}:${at}`).slice(0, 18)}`;
}

function defaultRecord(itemId: string): ReviewQueueOperationRecord {
  const timestamp = nowIso();
  return {
    itemId,
    operationalStatus: "open",
    assignedToUserId: null,
    assignedByUserId: null,
    assignedAt: null,
    noteCount: 0,
    latestNote: null,
    latestNoteAt: null,
    latestAction: null,
    latestActionAt: null,
    latestActionByUserId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function statusLabel(status: ReviewQueueOperationalStatus) {
  switch (status) {
    case "in_review":
      return "In Review";
    case "request_changes":
      return "Änderungen angefragt";
    case "ready":
      return "Bereit";
    case "archived":
      return "Archiviert";
    case "blocked":
      return "Blockiert";
    case "open":
    default:
      return "Offen";
  }
}

function actionLabel(action: ReviewQueueOperationAction) {
  switch (action) {
    case "assign":
      return "Zugewiesen";
    case "unassign":
      return "Zuweisung entfernt";
    case "add_note":
      return "Notiz ergänzt";
    case "request_changes":
      return "Änderungen angefragt";
    case "mark_in_review":
      return "In Review gesetzt";
    case "mark_ready":
      return "Als bereit markiert";
    case "archive":
      return "Archiviert";
    case "block":
      return "Blockiert";
    default:
      return action;
  }
}

function nextStatusForAction(
  currentStatus: ReviewQueueOperationalStatus,
  action: ReviewQueueOperationAction,
): ReviewQueueOperationalStatus {
  switch (action) {
    case "mark_in_review":
      return "in_review";
    case "request_changes":
      return "request_changes";
    case "mark_ready":
      return "ready";
    case "archive":
      return "archived";
    case "block":
      return "blocked";
    case "assign":
    case "unassign":
    case "add_note":
    default:
      return currentStatus;
  }
}

function ensureMutable(record: ReviewQueueOperationRecord, action: ReviewQueueOperationAction) {
  if (record.operationalStatus !== "archived") return;
  if (action === "add_note") return;
  throw new Error("review_queue_item_archived");
}

function buildPersistenceState(
  mode: ReviewQueueOperationPersistenceMode,
): ReviewQueueOperationPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent ? "Persistenter Operations-Store" : "In-Memory-Fallback",
    summary: persistent
      ? "Zuweisungen, Notizen und Statuswechsel liegen dauerhaft in den Review-Queue-Collections und bleiben über Restart/Deployment rekonstruierbar."
      : "Nur Dev-/Test-/Runtime-Fallback: der Operations-Overlay lebt pro Prozess und darf nicht als Produktionswahrheit ausgegeben werden.",
    repositoryInterface: "ReviewQueueOperationsRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
  };
}

function createMongoRepo(): ReviewQueueOperationsRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.itemId },
        {
          $set: recordDoc(record.itemId, record) as any,
        },
        { upsert: true },
      );
    },
    async getRecord(itemId) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const doc = await col.findOne({ _id: itemId });
      if (!doc) return null;
      const { _id: _ignored, ...record } = doc;
      return clone(record as ReviewQueueOperationRecord);
    },
    async listRecords() {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const docs = await col.find({}).sort({ updatedAt: -1 }).toArray();
      return docs.map((doc) => {
        const { _id: _ignored, ...record } = doc;
        return clone(record as ReviewQueueOperationRecord);
      });
    },
    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      await col.updateOne(
        { _id: event.id },
        {
          $set: {
            _id: event.id,
            ...clone(event),
          } as any,
        },
        { upsert: true },
      );
    },
    async listAuditEvents(itemId) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      const docs = await col.find({ itemId }).sort({ at: -1 }).toArray();
      return docs.map((doc) => {
        const { _id: _ignored, ...event } = doc;
        return clone(event as ReviewQueueOperationAuditEvent);
      });
    },
    async listAuditEventsForItems(itemIds, limitPerItem = 3) {
      await ensureIndexes();
      const normalizedIds = uniqueNonEmpty(itemIds);
      const grouped: ReviewQueueOperationAuditByItem = {};
      for (const itemId of normalizedIds) grouped[itemId] = [];
      if (normalizedIds.length === 0) return grouped;
      const col = await coreCol<any>(AUDIT_COLLECTION);
      const docs = await col
        .find({ itemId: { $in: normalizedIds } })
        .sort({ at: -1 })
        .toArray();
      const limits = new Map<string, number>();
      for (const doc of docs) {
        const { _id: _ignored, ...event } = doc;
        const normalizedItemId = String(event?.itemId ?? "").trim();
        if (!normalizedItemId) continue;
        const existing = grouped[normalizedItemId] ?? [];
        const currentCount = limits.get(normalizedItemId) ?? 0;
        if (currentCount >= limitPerItem) continue;
        existing.push(clone(event as ReviewQueueOperationAuditEvent));
        grouped[normalizedItemId] = existing;
        limits.set(normalizedItemId, currentCount + 1);
      }
      return grouped;
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryReviewQueueOperationRepo(seed?: {
  records?: ReviewQueueOperationRecord[];
  auditEvents?: ReviewQueueOperationAuditEvent[];
}): ReviewQueueOperationsRepository {
  const records = new Map<string, ReviewQueueOperationRecord>();
  const auditEvents = new Map<string, ReviewQueueOperationAuditEvent>();
  for (const record of seed?.records ?? []) {
    records.set(record.itemId, clone(record));
  }
  for (const event of seed?.auditEvents ?? []) {
    auditEvents.set(event.id, clone(event));
  }
  return {
    async saveRecord(record) {
      records.set(record.itemId, clone(record));
    },
    async getRecord(itemId) {
      return records.get(itemId) ? clone(records.get(itemId) as ReviewQueueOperationRecord) : null;
    },
    async listRecords() {
      return Array.from(records.values())
        .map((record) => clone(record))
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },
    async appendAuditEvent(event) {
      auditEvents.set(event.id, clone(event));
    },
    async listAuditEvents(itemId) {
      return Array.from(auditEvents.values())
        .filter((event) => event.itemId === itemId)
        .map((event) => clone(event))
        .sort((left, right) => String(right.at).localeCompare(String(left.at)));
    },
    async listAuditEventsForItems(itemIds, limitPerItem = 3) {
      const normalizedIds = uniqueNonEmpty(itemIds);
      const grouped: ReviewQueueOperationAuditByItem = {};
      for (const itemId of normalizedIds) {
        grouped[itemId] = Array.from(auditEvents.values())
          .filter((event) => event.itemId === itemId)
          .map((event) => clone(event))
          .sort((left, right) => String(right.at).localeCompare(String(left.at)))
          .slice(0, limitPerItem);
      }
      return grouped;
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function getRepo() {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryReviewQueueOperationRepo();
    return repoSingleton;
  }
  if (!repoSingleton) repoSingleton = createMongoRepo();
  return repoSingleton;
}

export function getReviewQueueOperationsRepository(): ReviewQueueOperationsRepository {
  return getRepo();
}

export function setReviewQueueOperationRepoForTests(repo: ReviewQueueOperationsRepository | null) {
  repoSingleton = repo;
  indexesReady = false;
}

async function ensureIndexes() {
  if (indexesReady) return;
  const records = await coreCol(RECORDS_COLLECTION);
  const audits = await coreCol(AUDIT_COLLECTION);
  await Promise.all([
    records.createIndex({ operationalStatus: 1, updatedAt: -1 }),
    records.createIndex({ assignedToUserId: 1, updatedAt: -1 }),
    audits.createIndex({ itemId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

export async function getReviewQueueOperationRecord(itemId: string) {
  const normalized = String(itemId ?? "").trim();
  if (!normalized) return null;
  return getRepo().getRecord(normalized);
}

export async function listReviewQueueOperationRecords() {
  return getRepo().listRecords();
}

export async function listReviewQueueOperationAuditEvents(itemId: string) {
  const normalized = String(itemId ?? "").trim();
  if (!normalized) return [];
  return getRepo().listAuditEvents(normalized);
}

export async function listReviewQueueOperationAuditEventsForItems(
  itemIds: string[],
  limitPerItem = 3,
) {
  return getRepo().listAuditEventsForItems(itemIds, limitPerItem);
}

export function getReviewQueueOperationPersistenceState() {
  return getRepo().getPersistenceState();
}

export async function applyReviewQueueOperation(input: {
  itemId: string;
  action: ReviewQueueOperationAction;
  requestedByUserId: string;
  assignedToUserId?: string | null;
  note?: string | null;
}) {
  const itemId = String(input.itemId ?? "").trim();
  const requestedByUserId = String(input.requestedByUserId ?? "").trim();
  const note = normalizeOptionalString(input.note);
  const assignedToUserId = normalizeOptionalString(input.assignedToUserId);
  if (!itemId) throw new Error("review_queue_item_id_required");
  if (!requestedByUserId) throw new Error("review_queue_actor_required");
  if (input.action === "assign" && !assignedToUserId) {
    throw new Error("review_queue_assignee_required");
  }
  if (
    (input.action === "add_note" ||
      input.action === "request_changes" ||
      input.action === "block") &&
    !note
  ) {
    throw new Error("review_queue_note_required");
  }

  const existing = (await getRepo().getRecord(itemId)) ?? defaultRecord(itemId);
  ensureMutable(existing, input.action);

  const timestamp = nowIso();
  const previousStatus = existing.operationalStatus;
  const previousAssignedToUserId = existing.assignedToUserId;
  const nextStatus = nextStatusForAction(existing.operationalStatus, input.action);
  const nextAssignedToUserId =
    input.action === "assign"
      ? assignedToUserId
      : input.action === "unassign"
        ? null
        : existing.assignedToUserId;

  const nextRecord: ReviewQueueOperationRecord = {
    ...existing,
    operationalStatus: nextStatus,
    assignedToUserId: nextAssignedToUserId,
    assignedByUserId:
      input.action === "assign" || input.action === "unassign"
        ? requestedByUserId
        : existing.assignedByUserId,
    assignedAt:
      input.action === "assign"
        ? timestamp
        : input.action === "unassign"
          ? null
          : existing.assignedAt,
    noteCount: note ? existing.noteCount + 1 : existing.noteCount,
    latestNote: note ?? existing.latestNote,
    latestNoteAt: note ? timestamp : existing.latestNoteAt,
    latestAction: input.action,
    latestActionAt: timestamp,
    latestActionByUserId: requestedByUserId,
    updatedAt: timestamp,
  };

  const auditEvent: ReviewQueueOperationAuditEvent = {
    id: auditEventIdFor(itemId, input.action, timestamp),
    itemId,
    action: input.action,
    byUserId: requestedByUserId,
    at: timestamp,
    note,
    previousOperationalStatus: previousStatus,
    nextOperationalStatus: nextStatus,
    previousAssignedToUserId,
    nextAssignedToUserId,
  };

  await getRepo().saveRecord(nextRecord);
  await getRepo().appendAuditEvent(auditEvent);

  return {
    record: nextRecord,
    auditEvent,
  };
}

export function reviewQueueOperationalStatusLabel(status: ReviewQueueOperationalStatus) {
  return statusLabel(status);
}

export function reviewQueueOperationActionLabel(action: ReviewQueueOperationAction) {
  return actionLabel(action);
}
