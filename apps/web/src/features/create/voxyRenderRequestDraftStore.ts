import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderRequestDraftCommand,
  VoxyRenderRequestDraftPersistenceState,
  VoxyRenderRequestDraftRecord,
  VoxyRenderRequestDraftStoreResult,
} from "@/features/create/voxyRenderRequestDraftContract";

export const VOXY_RENDER_REQUEST_DRAFT_AUDIT_ACTIONS = ["request_draft_recorded"] as const;

export type VoxyRenderRequestDraftAuditAction =
  (typeof VOXY_RENDER_REQUEST_DRAFT_AUDIT_ACTIONS)[number];

export type VoxyRenderRequestDraftAuditEvent = {
  id: string;
  requestDraftId: string;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderRequestDraftAuditAction;
  byUserId: string | null;
  at: string;
  requestStatus: VoxyRenderRequestDraftRecord["requestStatus"];
  videoFormat: VoxyRenderRequestDraftRecord["videoFormat"];
  note: string | null;
  summary: string;
  previousRequestDraftRef: string | null;
};

export type VoxyRenderRequestDraftRecordListParams = {
  requestDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  decisionGateIds?: string[];
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderRequestDraftAuditListParams = {
  requestDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderRequestDraftRepository = {
  saveRecord(record: VoxyRenderRequestDraftRecord): Promise<VoxyRenderRequestDraftRecord>;
  getLatestRecord(decisionGateId: string): Promise<VoxyRenderRequestDraftRecord | null>;
  listRecords(
    params?: VoxyRenderRequestDraftRecordListParams,
  ): Promise<VoxyRenderRequestDraftRecord[]>;
  appendAuditEvent(
    event: VoxyRenderRequestDraftAuditEvent,
  ): Promise<VoxyRenderRequestDraftAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderRequestDraftAuditListParams,
  ): Promise<VoxyRenderRequestDraftAuditEvent[]>;
  getPersistenceState(): VoxyRenderRequestDraftPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_request_draft_records";
const AUDIT_COLLECTION = "voxy_render_request_draft_audits";

let repoSingleton: VoxyRenderRequestDraftRepository | null = null;
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

function requestDraftIdFor(input: {
  decisionId: string | null;
  decisionGateId: string | null;
  requestStatus: string;
  persistedAt: string;
}) {
  return `voxy-render-request-draft:${stableHash(
    [input.decisionId ?? "", input.decisionGateId ?? "", input.requestStatus, input.persistedAt].join(
      ":",
    ),
  ).slice(0, 24)}`;
}

function auditIdFor(input: {
  requestDraftId: string;
  decisionGateId: string | null;
  at: string;
}) {
  return `voxy-render-request-draft-audit:${stableHash(
    `${input.requestDraftId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  decisionId: string | null;
  decisionGateId: string | null;
  requestStatus: string;
  reviewerNote: string | null;
  createdBy: string | null;
}) {
  return `voxy-render-request-draft-idempotency:${stableHash(
    [
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.requestStatus,
      input.reviewerNote ?? "",
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderRequestDraftPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Voxy-Request-Draft-Store"
      : "In-Memory-Fallback für Voxy-Request-Draft-Store",
    summary: persistent
      ? "Render-Request-Drafts und Audit-Spuren liegen dauerhaft getrennt von Queue, Provider, Medien, Kosten und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Request-Drafts leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderRequestDraftRepository",
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
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderRequestDraftRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.requestDraftId },
        {
          $set: {
            _id: record.requestDraftId,
            record: clone(record),
            decisionId: record.decisionId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            requestStatus: record.requestStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            requestVersion: record.requestVersion,
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
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (requestDraftId) filter._id = requestDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateIds.length > 0) filter.decisionGateId = { $in: decisionGateIds };
      else if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const cursor = col.find(filter as any).sort({ persistedAt: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderRequestDraftRecord))
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
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (requestDraftId) filter.requestDraftId = requestDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs.map((doc) => clone(doc as VoxyRenderRequestDraftAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderRequestDraftRepository(seed?: {
  records?: VoxyRenderRequestDraftRecord[];
  audits?: VoxyRenderRequestDraftAuditEvent[];
}): VoxyRenderRequestDraftRepository {
  const records = new Map<string, VoxyRenderRequestDraftRecord>();
  const audits = new Map<string, VoxyRenderRequestDraftAuditEvent>();
  for (const record of seed?.records ?? []) records.set(record.requestDraftId, clone(record));
  for (const event of seed?.audits ?? []) audits.set(event.id, clone(event));
  return {
    async saveRecord(record) {
      records.set(record.requestDraftId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      const list = Array.from(records.values())
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
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const list = Array.from(audits.values())
        .filter((event) => (requestDraftId ? event.requestDraftId === requestDraftId : true))
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
    ? createInMemoryVoxyRenderRequestDraftRepository()
    : createMongoRepository();
  return repoSingleton;
}

function buildRecordFromCommand(input: {
  command: VoxyRenderRequestDraftCommand;
  existing: VoxyRenderRequestDraftRecord | null;
}) {
  const persistedAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const persistedBy = normalizeOptionalString(input.command.createdBy);
  const reviewerNote = normalizeOptionalString(input.command.reviewerNote);
  const decisionId = normalizeOptionalString(input.command.decisionId);
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  const requestDraftId =
    normalizeOptionalString(input.command.requestDraftId) ??
    requestDraftIdFor({
      decisionId,
      decisionGateId,
      requestStatus: input.command.requestStatus,
      persistedAt,
    });
  return {
    ...clone(input.command),
    requestDraftId,
    decisionId,
    decisionGateId,
    reviewerNote,
    persistedAt,
    persistedBy,
    idempotencyKey: buildIdempotencyKey({
      decisionId,
      decisionGateId,
      requestStatus: input.command.requestStatus,
      reviewerNote,
      createdBy: persistedBy,
    }),
    previousRequestDraftRef: input.existing?.requestDraftId ?? null,
    supersedesRequestDraftRef: input.existing?.requestDraftId ?? null,
    requestVersion: (input.existing?.requestVersion ?? 0) + 1,
  } satisfies VoxyRenderRequestDraftRecord;
}

function buildAuditEvent(input: {
  record: VoxyRenderRequestDraftRecord;
  existing: VoxyRenderRequestDraftRecord | null;
}) {
  const at = input.record.persistedAt ?? nowIso();
  return {
    id: auditIdFor({
      requestDraftId: input.record.requestDraftId,
      decisionGateId: input.record.decisionGateId,
      at,
    }),
    requestDraftId: input.record.requestDraftId,
    decisionId: input.record.decisionId,
    decisionGateId: input.record.decisionGateId,
    action: "request_draft_recorded",
    byUserId: input.record.persistedBy,
    at,
    requestStatus: input.record.requestStatus,
    videoFormat: input.record.videoFormat,
    note: input.record.reviewerNote,
    summary: input.record.reviewerVisibleReason,
    previousRequestDraftRef: input.existing?.requestDraftId ?? null,
  } satisfies VoxyRenderRequestDraftAuditEvent;
}

export function getVoxyRenderRequestDraftRepository() {
  return getRepo();
}

export function setVoxyRenderRequestDraftRepositoryForTests(
  repo: VoxyRenderRequestDraftRepository | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}

export function getVoxyRenderRequestDraftPersistenceState() {
  return getRepo().getPersistenceState();
}

export async function getLatestVoxyRenderRequestDraftRecord(decisionGateId: string) {
  return getRepo().getLatestRecord(normalizeText(decisionGateId));
}

export async function listVoxyRenderRequestDraftRecords(
  params?: VoxyRenderRequestDraftRecordListParams,
) {
  return getRepo().listRecords(params);
}

export async function listLatestVoxyRenderRequestDraftRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) return new Map<string, VoxyRenderRequestDraftRecord>();
  const records = await getRepo().listRecords({ decisionGateIds: normalized });
  const map = new Map<string, VoxyRenderRequestDraftRecord>();
  for (const record of records) {
    if (record.decisionGateId && !map.has(record.decisionGateId)) {
      map.set(record.decisionGateId, record);
    }
  }
  return map;
}

export async function listVoxyRenderRequestDraftAuditEvents(
  params?: VoxyRenderRequestDraftAuditListParams,
) {
  return getRepo().listAuditEvents(params);
}

export async function persistVoxyRenderRequestDraft(input: {
  command: VoxyRenderRequestDraftCommand;
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
        nextStep: "Decision Gate oder Decision-Referenz sauber ergänzen",
      } satisfies VoxyRenderRequestDraftStoreResult,
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
        status: persistence.mode === "persistent_primary" ? "stored_draft" : "preview_only",
        record: existing,
        warnings:
          persistence.mode === "persistent_primary"
            ? []
            : ["in_memory_fallback_active", "record_is_not_production_truth"],
        errors: [],
        idempotencyKey: existing.idempotencyKey,
        nextStep:
          persistence.mode === "persistent_primary"
            ? "Audit prüfen"
            : "Persistenzgrenze vor produktivem Rollout härten",
      } satisfies VoxyRenderRequestDraftStoreResult,
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
      status: persistence.mode === "persistent_primary" ? "stored_draft" : "preview_only",
      record: savedRecord,
      warnings:
        persistence.mode === "persistent_primary"
          ? []
          : ["in_memory_fallback_active", "record_is_not_production_truth"],
      errors: [],
      idempotencyKey: savedRecord.idempotencyKey,
      nextStep:
        persistence.mode === "persistent_primary"
          ? "Draft-Audit prüfen oder neuen Request-Draft dokumentieren"
          : "Store nur als Preview nutzen und produktive Persistenz separat absichern",
    } satisfies VoxyRenderRequestDraftStoreResult,
    auditEvent,
    persistence,
  };
}
