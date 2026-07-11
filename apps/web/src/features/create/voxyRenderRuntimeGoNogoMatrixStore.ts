import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderRuntimeGoNogoMatrixCommand,
  VoxyRenderRuntimeGoNogoMatrixPersistenceState,
  VoxyRenderRuntimeGoNogoMatrixRecord,
  VoxyRenderRuntimeGoNogoStoreResult,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";

export const VOXY_RENDER_RUNTIME_GO_NOGO_AUDIT_ACTIONS = [
  "runtime_go_nogo_matrix_recorded",
] as const;

export type VoxyRenderRuntimeGoNogoAuditAction =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_AUDIT_ACTIONS)[number];

export type VoxyRenderRuntimeGoNogoAuditEvent = {
  id: string;
  matrixId: string;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderRuntimeGoNogoAuditAction;
  byUserId: string | null;
  at: string;
  matrixStatus: VoxyRenderRuntimeGoNogoMatrixRecord["matrixStatus"];
  overallDecision: VoxyRenderRuntimeGoNogoMatrixRecord["overallDecision"];
  videoFormat: VoxyRenderRuntimeGoNogoMatrixRecord["videoFormat"];
  note: string | null;
  summary: string;
  previousMatrixRef: string | null;
};

export type VoxyRenderRuntimeGoNogoRecordListParams = {
  matrixId?: string | null;
  providerSelectionDraftId?: string | null;
  assetPackDraftId?: string | null;
  costPolicyPreviewId?: string | null;
  queuePreviewId?: string | null;
  requestDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  decisionGateIds?: string[];
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderRuntimeGoNogoAuditListParams = {
  matrixId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderRuntimeGoNogoMatrixRepository = {
  saveRecord(record: VoxyRenderRuntimeGoNogoMatrixRecord): Promise<VoxyRenderRuntimeGoNogoMatrixRecord>;
  getLatestRecord(decisionGateId: string): Promise<VoxyRenderRuntimeGoNogoMatrixRecord | null>;
  listRecords(
    params?: VoxyRenderRuntimeGoNogoRecordListParams,
  ): Promise<VoxyRenderRuntimeGoNogoMatrixRecord[]>;
  appendAuditEvent(
    event: VoxyRenderRuntimeGoNogoAuditEvent,
  ): Promise<VoxyRenderRuntimeGoNogoAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderRuntimeGoNogoAuditListParams,
  ): Promise<VoxyRenderRuntimeGoNogoAuditEvent[]>;
  getPersistenceState(): VoxyRenderRuntimeGoNogoMatrixPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_runtime_go_nogo_matrix_records";
const AUDITS_COLLECTION = "voxy_render_runtime_go_nogo_matrix_audits";

let repoSingleton: VoxyRenderRuntimeGoNogoMatrixRepository | null = null;
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
  return Array.from(new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []));
}

function matrixIdFor(input: {
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  matrixStatus: string;
  persistedAt: string;
}) {
  return `voxy-render-runtime-go-nogo-matrix:${stableHash(
    [
      input.providerSelectionDraftId ?? "",
      input.assetPackDraftId ?? "",
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.matrixStatus,
      input.persistedAt,
    ].join(":"),
  ).slice(0, 24)}`;
}

function auditIdFor(input: { matrixId: string; decisionGateId: string | null; at: string }) {
  return `voxy-render-runtime-go-nogo-matrix-audit:${stableHash(
    `${input.matrixId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  matrixStatus: string;
  createdBy: string | null;
}) {
  return `voxy-render-runtime-go-nogo-matrix-idempotency:${stableHash(
    [
      input.providerSelectionDraftId ?? "",
      input.assetPackDraftId ?? "",
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.matrixStatus,
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderRuntimeGoNogoMatrixPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistente Runtime-Go/No-Go-Matrix"
      : "In-Memory-Fallback für Runtime-Go/No-Go-Matrix",
    summary: persistent
      ? "Matrix-Previews und Audit-Spuren liegen getrennt von Render, Queue, Provider, Kosten, Upload und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Matrix-Previews leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderRuntimeGoNogoMatrixRepository",
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
    coreCol<any>(AUDITS_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ decisionGateId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ decisionId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ requestDraftId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ queuePreviewId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ costPolicyPreviewId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ assetPackDraftId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ providerSelectionDraftId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderRuntimeGoNogoMatrixRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.matrixId },
        {
          $set: {
            _id: record.matrixId,
            record: clone(record),
            providerSelectionDraftId: record.providerSelectionDraftId,
            assetPackDraftId: record.assetPackDraftId,
            costPolicyPreviewId: record.costPolicyPreviewId,
            queuePreviewId: record.queuePreviewId,
            requestDraftId: record.requestDraftId,
            decisionId: record.decisionId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            matrixStatus: record.matrixStatus,
            overallDecision: record.overallDecision,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            matrixVersion: record.matrixVersion,
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
      const matrixId = normalizeOptionalString(params?.matrixId);
      const providerSelectionDraftId = normalizeOptionalString(params?.providerSelectionDraftId);
      const assetPackDraftId = normalizeOptionalString(params?.assetPackDraftId);
      const costPolicyPreviewId = normalizeOptionalString(params?.costPolicyPreviewId);
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (matrixId) filter._id = matrixId;
      if (providerSelectionDraftId) filter.providerSelectionDraftId = providerSelectionDraftId;
      if (assetPackDraftId) filter.assetPackDraftId = assetPackDraftId;
      if (costPolicyPreviewId) filter.costPolicyPreviewId = costPolicyPreviewId;
      if (queuePreviewId) filter.queuePreviewId = queuePreviewId;
      if (requestDraftId) filter.requestDraftId = requestDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateIds.length > 0) filter.decisionGateId = { $in: decisionGateIds };
      else if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const docs = await col
        .find(filter)
        .sort({ persistedAt: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs.map((doc) => clone(doc.record as VoxyRenderRuntimeGoNogoMatrixRecord));
    },
    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDITS_COLLECTION);
      await col.updateOne(
        { _id: event.id },
        {
          $set: {
            _id: event.id,
            event: clone(event),
            matrixId: event.matrixId,
            decisionId: event.decisionId,
            decisionGateId: event.decisionGateId,
            at: event.at,
          } as any,
        },
        { upsert: true },
      );
      return clone(event);
    },
    async listAuditEvents(params) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDITS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const matrixId = normalizeOptionalString(params?.matrixId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (matrixId) filter.matrixId = matrixId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const docs = await col
        .find(filter)
        .sort({ at: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs.map((doc) => clone(doc.event as VoxyRenderRuntimeGoNogoAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderRuntimeGoNogoMatrixRepository(): VoxyRenderRuntimeGoNogoMatrixRepository {
  const records = new Map<string, VoxyRenderRuntimeGoNogoMatrixRecord>();
  const audits = new Map<string, VoxyRenderRuntimeGoNogoAuditEvent>();
  return {
    async saveRecord(record) {
      records.set(record.matrixId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const list = Array.from(records.values()).filter((record) => {
        if (params?.matrixId && record.matrixId !== params.matrixId) return false;
        if (
          params?.providerSelectionDraftId &&
          record.providerSelectionDraftId !== params.providerSelectionDraftId
        )
          return false;
        if (params?.assetPackDraftId && record.assetPackDraftId !== params.assetPackDraftId)
          return false;
        if (
          params?.costPolicyPreviewId &&
          record.costPolicyPreviewId !== params.costPolicyPreviewId
        )
          return false;
        if (params?.queuePreviewId && record.queuePreviewId !== params.queuePreviewId) return false;
        if (params?.requestDraftId && record.requestDraftId !== params.requestDraftId) return false;
        if (params?.decisionId && record.decisionId !== params.decisionId) return false;
        if (decisionGateIds.length > 0 && !decisionGateIds.includes(record.decisionGateId ?? ""))
          return false;
        if (
          decisionGateIds.length === 0 &&
          params?.decisionGateId &&
          record.decisionGateId !== params.decisionGateId
        )
          return false;
        if (
          params?.contributionRefId &&
          record.contributionRef?.id !== normalizeOptionalString(params.contributionRefId)
        )
          return false;
        if (
          params?.dossierRefId &&
          record.dossierRef?.id !== normalizeOptionalString(params.dossierRefId)
        )
          return false;
        return true;
      });
      return list
        .sort((a, b) => `${b.persistedAt ?? ""}:${b.matrixId}`.localeCompare(`${a.persistedAt ?? ""}:${a.matrixId}`))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)))
        .map((record) => clone(record));
    },
    async appendAuditEvent(event) {
      audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      const list = Array.from(audits.values()).filter((event) => {
        if (params?.matrixId && event.matrixId !== params.matrixId) return false;
        if (params?.decisionId && event.decisionId !== params.decisionId) return false;
        if (params?.decisionGateId && event.decisionGateId !== params.decisionGateId) return false;
        return true;
      });
      return list
        .sort((a, b) => `${b.at}:${b.id}`.localeCompare(`${a.at}:${a.id}`))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)))
        .map((event) => clone(event));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function resolveRepository(): VoxyRenderRuntimeGoNogoMatrixRepository {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderRuntimeGoNogoMatrixRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderRuntimeGoNogoMatrixRepositoryForTests(
  repository: VoxyRenderRuntimeGoNogoMatrixRepository,
) {
  repoSingleton = repository;
  indexesReady = false;
}

export function getVoxyRenderRuntimeGoNogoMatrixPersistenceState() {
  return resolveRepository().getPersistenceState();
}

export async function listVoxyRenderRuntimeGoNogoMatrixRecords(
  params?: VoxyRenderRuntimeGoNogoRecordListParams,
) {
  return resolveRepository().listRecords(params);
}

export async function getLatestVoxyRenderRuntimeGoNogoMatrixRecord(decisionGateId: string) {
  return resolveRepository().getLatestRecord(decisionGateId);
}

export async function listLatestVoxyRenderRuntimeGoNogoMatrixRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const records = await resolveRepository().listRecords({ decisionGateIds, limit: 200 });
  const latestByGate = new Map<string, VoxyRenderRuntimeGoNogoMatrixRecord>();
  for (const record of records) {
    const key = normalizeOptionalString(record.decisionGateId);
    if (!key || latestByGate.has(key)) continue;
    latestByGate.set(key, record);
  }
  return latestByGate;
}

export async function listVoxyRenderRuntimeGoNogoMatrixAuditEvents(
  params?: VoxyRenderRuntimeGoNogoAuditListParams,
) {
  return resolveRepository().listAuditEvents(params);
}

export async function persistVoxyRenderRuntimeGoNogoMatrix(input: {
  command: VoxyRenderRuntimeGoNogoMatrixCommand;
}) {
  const repo = resolveRepository();
  const persistence = repo.getPersistenceState();
  const persistedAt = nowIso();
  const normalizedCreatedBy = normalizeOptionalString(input.command.createdBy);
  const existingLatest =
    input.command.decisionGateId != null
      ? await repo.getLatestRecord(input.command.decisionGateId)
      : null;
  const matrixId = matrixIdFor({
    providerSelectionDraftId: input.command.providerSelectionDraftId,
    assetPackDraftId: input.command.assetPackDraftId,
    costPolicyPreviewId: input.command.costPolicyPreviewId,
    queuePreviewId: input.command.queuePreviewId,
    requestDraftId: input.command.requestDraftId,
    decisionId: input.command.decisionId,
    decisionGateId: input.command.decisionGateId,
    matrixStatus: input.command.matrixStatus,
    persistedAt,
  });
  const idempotencyKey = buildIdempotencyKey({
    providerSelectionDraftId: input.command.providerSelectionDraftId,
    assetPackDraftId: input.command.assetPackDraftId,
    costPolicyPreviewId: input.command.costPolicyPreviewId,
    queuePreviewId: input.command.queuePreviewId,
    requestDraftId: input.command.requestDraftId,
    decisionId: input.command.decisionId,
    decisionGateId: input.command.decisionGateId,
    matrixStatus: input.command.matrixStatus,
    createdBy: normalizedCreatedBy,
  });
  const record: VoxyRenderRuntimeGoNogoMatrixRecord = {
    ...clone(input.command),
    matrixId,
    persistedAt,
    persistedBy: normalizedCreatedBy,
    idempotencyKey,
    previousMatrixRef: existingLatest?.matrixId ?? null,
    supersedesMatrixRef: existingLatest?.matrixId ?? null,
    matrixVersion: (existingLatest?.matrixVersion ?? 0) + 1,
  };
  const savedRecord = await repo.saveRecord(record);
  const auditEvent: VoxyRenderRuntimeGoNogoAuditEvent = {
    id: auditIdFor({
      matrixId: savedRecord.matrixId,
      decisionGateId: savedRecord.decisionGateId,
      at: persistedAt,
    }),
    matrixId: savedRecord.matrixId,
    providerSelectionDraftId: savedRecord.providerSelectionDraftId,
    assetPackDraftId: savedRecord.assetPackDraftId,
    costPolicyPreviewId: savedRecord.costPolicyPreviewId,
    queuePreviewId: savedRecord.queuePreviewId,
    requestDraftId: savedRecord.requestDraftId,
    decisionId: savedRecord.decisionId,
    decisionGateId: savedRecord.decisionGateId,
    action: "runtime_go_nogo_matrix_recorded",
    byUserId: normalizedCreatedBy,
    at: persistedAt,
    matrixStatus: savedRecord.matrixStatus,
    overallDecision: savedRecord.overallDecision,
    videoFormat: savedRecord.videoFormat,
    note: null,
    summary: `${savedRecord.matrixStatus} · ${savedRecord.overallDecision} · ${savedRecord.nextStep}`,
    previousMatrixRef: existingLatest?.matrixId ?? null,
  };
  await repo.appendAuditEvent(auditEvent);
  const result: VoxyRenderRuntimeGoNogoStoreResult = {
    ok: true,
    status: persistence.productionTruth ? "preview_only" : "noop",
    record: savedRecord,
    warnings:
      persistence.mode === "in_memory_fallback"
        ? ["Nur In-Memory-Fallback aktiv; Matrix ist keine belastbare Produktionswahrheit."]
        : [],
    errors: [],
    idempotencyKey,
    nextStep: savedRecord.nextStep,
  };
  return {
    result,
    auditEvent,
    persistence,
  };
}
