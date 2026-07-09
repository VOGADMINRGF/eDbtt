import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderQueuePersistenceState,
  VoxyRenderQueuePreviewCommand,
  VoxyRenderQueuePreviewRecord,
  VoxyRenderQueueStoreResult,
} from "@/features/create/voxyRenderQueueContract";

export const VOXY_RENDER_QUEUE_AUDIT_ACTIONS = ["queue_preview_recorded"] as const;

export type VoxyRenderQueueAuditAction = (typeof VOXY_RENDER_QUEUE_AUDIT_ACTIONS)[number];

export type VoxyRenderQueueAuditEvent = {
  id: string;
  queuePreviewId: string;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderQueueAuditAction;
  byUserId: string | null;
  at: string;
  queueStatus: VoxyRenderQueuePreviewRecord["queueStatus"];
  videoFormat: VoxyRenderQueuePreviewRecord["videoFormat"];
  note: string | null;
  summary: string;
  previousQueuePreviewRef: string | null;
};

export type VoxyRenderQueuePreviewRecordListParams = {
  queuePreviewId?: string | null;
  requestDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  decisionGateIds?: string[];
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderQueueAuditListParams = {
  queuePreviewId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderQueuePreviewRepository = {
  saveRecord(record: VoxyRenderQueuePreviewRecord): Promise<VoxyRenderQueuePreviewRecord>;
  getLatestRecord(decisionGateId: string): Promise<VoxyRenderQueuePreviewRecord | null>;
  listRecords(
    params?: VoxyRenderQueuePreviewRecordListParams,
  ): Promise<VoxyRenderQueuePreviewRecord[]>;
  appendAuditEvent(event: VoxyRenderQueueAuditEvent): Promise<VoxyRenderQueueAuditEvent>;
  listAuditEvents(params?: VoxyRenderQueueAuditListParams): Promise<VoxyRenderQueueAuditEvent[]>;
  getPersistenceState(): VoxyRenderQueuePersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_queue_preview_records";
const AUDIT_COLLECTION = "voxy_render_queue_preview_audits";

let repoSingleton: VoxyRenderQueuePreviewRepository | null = null;
let indexesReady = false;

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeDecisionGateIds(values: string[] | undefined): string[] {
  return Array.from(
    new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []),
  );
}

function queuePreviewIdFor(input: {
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  queueStatus: string;
  persistedAt: string;
}) {
  return `voxy-render-queue-preview:${stableHash(
    [
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.queueStatus,
      input.persistedAt,
    ].join(":"),
  ).slice(0, 24)}`;
}

function auditIdFor(input: {
  queuePreviewId: string;
  decisionGateId: string | null;
  at: string;
}) {
  return `voxy-render-queue-preview-audit:${stableHash(
    `${input.queuePreviewId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  queueStatus: string;
  createdBy: string | null;
}) {
  return `voxy-render-queue-preview-idempotency:${stableHash(
    [
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.queueStatus,
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderQueuePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Voxy-Queue-Preview-Store"
      : "In-Memory-Fallback für Voxy-Queue-Preview-Store",
    summary: persistent
      ? "Queue-Preview-Records und Audit-Spuren liegen getrennt von Queue, Worker, Provider, Medien, Kosten und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Queue-Preview-Records leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderQueuePreviewRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ decisionGateId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ decisionId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ requestDraftId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderQueuePreviewRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.queuePreviewId },
        {
          $set: {
            _id: record.queuePreviewId,
            record: clone(record),
            requestDraftId: record.requestDraftId,
            decisionId: record.decisionId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            queueStatus: record.queueStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            queueVersion: record.queueVersion,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (queuePreviewId) filter._id = queuePreviewId;
      if (requestDraftId) filter.requestDraftId = requestDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateIds.length > 0) filter.decisionGateId = { $in: decisionGateIds };
      else if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const cursor = col.find(filter as any).sort({ persistedAt: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderQueuePreviewRecord))
        .filter(Boolean);
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
      return clone(event);
    },
    async listAuditEvents(params) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      const filter: Record<string, unknown> = {};
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (queuePreviewId) filter.queuePreviewId = queuePreviewId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs.map((doc) => clone(doc as VoxyRenderQueueAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderQueuePreviewRepository(seed?: {
  records?: VoxyRenderQueuePreviewRecord[];
  audits?: VoxyRenderQueueAuditEvent[];
}): VoxyRenderQueuePreviewRepository {
  const records = new Map<string, VoxyRenderQueuePreviewRecord>();
  const audits = new Map<string, VoxyRenderQueueAuditEvent>();
  for (const record of seed?.records ?? []) records.set(record.queuePreviewId, clone(record));
  for (const event of seed?.audits ?? []) audits.set(event.id, clone(event));
  return {
    async saveRecord(record) {
      records.set(record.queuePreviewId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      const list = Array.from(records.values())
        .filter((record) => (queuePreviewId ? record.queuePreviewId === queuePreviewId : true))
        .filter((record) => (requestDraftId ? record.requestDraftId === requestDraftId : true))
        .filter((record) => (decisionId ? record.decisionId === decisionId : true))
        .filter((record) =>
          decisionGateIds.length > 0
            ? decisionGateIds.includes(record.decisionGateId ?? "")
            : decisionGateId
              ? record.decisionGateId === decisionGateId
              : true,
        )
        .filter((record) =>
          contributionRefId ? record.contributionRef?.id === contributionRefId : true,
        )
        .filter((record) => (dossierRefId ? record.dossierRef?.id === dossierRefId : true))
        .sort((left, right) =>
          String(right.persistedAt ?? "").localeCompare(String(left.persistedAt ?? "")),
        )
        .map(clone);
      return typeof params?.limit === "number"
        ? list.slice(0, Math.max(1, params.limit))
        : list;
    },
    async appendAuditEvent(event) {
      audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const list = Array.from(audits.values())
        .filter((event) => (queuePreviewId ? event.queuePreviewId === queuePreviewId : true))
        .filter((event) => (decisionId ? event.decisionId === decisionId : true))
        .filter((event) => (decisionGateId ? event.decisionGateId === decisionGateId : true))
        .sort((left, right) => right.at.localeCompare(left.at))
        .map(clone);
      return typeof params?.limit === "number"
        ? list.slice(0, Math.max(1, params.limit))
        : list;
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderQueuePreviewRepository()
    : createMongoRepository();
  return repoSingleton;
}

function buildRecordFromCommand(input: {
  command: VoxyRenderQueuePreviewCommand;
  existing: VoxyRenderQueuePreviewRecord | null;
}) {
  const persistedAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const persistedBy = normalizeOptionalString(input.command.createdBy);
  const decisionId = normalizeOptionalString(input.command.decisionId);
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  const requestDraftId = normalizeOptionalString(input.command.requestDraftId);
  const queuePreviewId =
    normalizeOptionalString(input.command.queuePreviewId) ??
    queuePreviewIdFor({
      requestDraftId,
      decisionId,
      decisionGateId,
      queueStatus: input.command.queueStatus,
      persistedAt,
    });
  return {
    ...clone(input.command),
    queuePreviewId,
    requestDraftId,
    decisionId,
    decisionGateId,
    persistedAt,
    persistedBy,
    idempotencyKey: buildIdempotencyKey({
      requestDraftId,
      decisionId,
      decisionGateId,
      queueStatus: input.command.queueStatus,
      createdBy: persistedBy,
    }),
    previousQueuePreviewRef: input.existing?.queuePreviewId ?? null,
    supersedesQueuePreviewRef: input.existing?.queuePreviewId ?? null,
    queueVersion: (input.existing?.queueVersion ?? 0) + 1,
  } satisfies VoxyRenderQueuePreviewRecord;
}

function buildAuditEvent(input: {
  record: VoxyRenderQueuePreviewRecord;
  existing: VoxyRenderQueuePreviewRecord | null;
}) {
  const at = input.record.persistedAt ?? nowIso();
  return {
    id: auditIdFor({
      queuePreviewId: input.record.queuePreviewId,
      decisionGateId: input.record.decisionGateId,
      at,
    }),
    queuePreviewId: input.record.queuePreviewId,
    requestDraftId: input.record.requestDraftId,
    decisionId: input.record.decisionId,
    decisionGateId: input.record.decisionGateId,
    action: "queue_preview_recorded",
    byUserId: input.record.persistedBy,
    at,
    queueStatus: input.record.queueStatus,
    videoFormat: input.record.videoFormat,
    note: input.record.reviewerVisibleReason,
    summary: input.record.userVisibleReason,
    previousQueuePreviewRef: input.existing?.queuePreviewId ?? null,
  } satisfies VoxyRenderQueueAuditEvent;
}

export function getVoxyRenderQueuePreviewRepository() {
  return getRepo();
}

export function setVoxyRenderQueuePreviewRepositoryForTests(
  repo: VoxyRenderQueuePreviewRepository | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}

export function getVoxyRenderQueuePersistenceState() {
  return getRepo().getPersistenceState();
}

export async function getLatestVoxyRenderQueuePreviewRecord(decisionGateId: string) {
  return getRepo().getLatestRecord(normalizeText(decisionGateId));
}

export async function listVoxyRenderQueuePreviewRecords(
  params?: VoxyRenderQueuePreviewRecordListParams,
) {
  return getRepo().listRecords(params);
}

export async function listLatestVoxyRenderQueuePreviewRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) return new Map<string, VoxyRenderQueuePreviewRecord>();
  const records = await getRepo().listRecords({ decisionGateIds: normalized });
  const map = new Map<string, VoxyRenderQueuePreviewRecord>();
  for (const record of records) {
    if (record.decisionGateId && !map.has(record.decisionGateId)) {
      map.set(record.decisionGateId, record);
    }
  }
  return map;
}

export async function listVoxyRenderQueueAuditEvents(
  params?: VoxyRenderQueueAuditListParams,
) {
  return getRepo().listAuditEvents(params);
}

export async function persistVoxyRenderQueuePreview(input: {
  command: VoxyRenderQueuePreviewCommand;
}) {
  const repo = getRepo();
  const persistence = repo.getPersistenceState();
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  if (!decisionGateId) {
    return {
      result: {
        ok: false,
        status: "blocked",
        record: null,
        warnings: [],
        errors: ["decision_gate_id_missing"],
        idempotencyKey: null,
        nextStep: "Decision Gate oder Request-Draft-Referenz sauber ergänzen",
      } satisfies VoxyRenderQueueStoreResult,
      auditEvent: null,
      persistence,
    };
  }

  const existing = await repo.getLatestRecord(decisionGateId);
  const record = buildRecordFromCommand({
    command: {
      ...input.command,
      decisionGateId,
    },
    existing,
  });

  if (existing?.idempotencyKey && existing.idempotencyKey === record.idempotencyKey) {
    return {
      result: {
        ok: true,
        status: "noop",
        record: existing,
        warnings:
          persistence.mode === "persistent_primary"
            ? []
            : ["in_memory_fallback_active", "record_is_not_production_truth"],
        errors: [],
        idempotencyKey: existing.idempotencyKey,
        nextStep:
          persistence.mode === "persistent_primary"
            ? "Bestehende Queue-Preview-Auditspur prüfen"
            : "Persistenzgrenze vor produktivem Rollout härten",
      } satisfies VoxyRenderQueueStoreResult,
      auditEvent: null,
      persistence,
    };
  }

  const savedRecord = await repo.saveRecord(record);
  const auditEvent = await repo.appendAuditEvent(
    buildAuditEvent({
      record: savedRecord,
      existing,
    }),
  );

  return {
    result: {
      ok: true,
      status: persistence.mode === "persistent_primary" ? "disabled" : "preview_only",
      record: savedRecord,
      warnings:
        persistence.mode === "persistent_primary"
          ? []
          : ["in_memory_fallback_active", "record_is_not_production_truth"],
      errors: [],
      idempotencyKey: savedRecord.idempotencyKey,
      nextStep:
        persistence.mode === "persistent_primary"
          ? "Queue-Preview-Audit prüfen oder neue disabled Preview dokumentieren"
          : "Store nur als Preview nutzen und produktive Persistenz separat absichern",
    } satisfies VoxyRenderQueueStoreResult,
    auditEvent,
    persistence,
  };
}
