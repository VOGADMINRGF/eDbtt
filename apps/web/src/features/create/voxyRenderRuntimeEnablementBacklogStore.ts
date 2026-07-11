import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderRuntimeEnablementBacklogCommand,
  VoxyRenderRuntimeEnablementBacklogPersistenceState,
  VoxyRenderRuntimeEnablementBacklogRecord,
  VoxyRenderRuntimeEnablementStoreResult,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";

export const VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_AUDIT_ACTIONS = [
  "runtime_enablement_backlog_recorded",
] as const;

export type VoxyRenderRuntimeEnablementBacklogAuditAction =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_AUDIT_ACTIONS)[number];

export type VoxyRenderRuntimeEnablementBacklogAuditEvent = {
  id: string;
  backlogId: string;
  matrixId: string | null;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderRuntimeEnablementBacklogAuditAction;
  byUserId: string | null;
  at: string;
  backlogStatus: VoxyRenderRuntimeEnablementBacklogRecord["backlogStatus"];
  nextRecommendedAction: VoxyRenderRuntimeEnablementBacklogRecord["nextRecommendedAction"];
  videoFormat: VoxyRenderRuntimeEnablementBacklogRecord["videoFormat"];
  note: string | null;
  summary: string;
  previousBacklogRef: string | null;
};

export type VoxyRenderRuntimeEnablementBacklogRecordListParams = {
  backlogId?: string | null;
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

export type VoxyRenderRuntimeEnablementBacklogAuditListParams = {
  backlogId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderRuntimeEnablementBacklogRepository = {
  saveRecord(
    record: VoxyRenderRuntimeEnablementBacklogRecord,
  ): Promise<VoxyRenderRuntimeEnablementBacklogRecord>;
  getLatestRecord(
    decisionGateId: string,
  ): Promise<VoxyRenderRuntimeEnablementBacklogRecord | null>;
  listRecords(
    params?: VoxyRenderRuntimeEnablementBacklogRecordListParams,
  ): Promise<VoxyRenderRuntimeEnablementBacklogRecord[]>;
  appendAuditEvent(
    event: VoxyRenderRuntimeEnablementBacklogAuditEvent,
  ): Promise<VoxyRenderRuntimeEnablementBacklogAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderRuntimeEnablementBacklogAuditListParams,
  ): Promise<VoxyRenderRuntimeEnablementBacklogAuditEvent[]>;
  getPersistenceState(): VoxyRenderRuntimeEnablementBacklogPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_runtime_enablement_backlog_records";
const AUDITS_COLLECTION = "voxy_render_runtime_enablement_backlog_audits";

let repoSingleton: VoxyRenderRuntimeEnablementBacklogRepository | null = null;
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

function backlogIdFor(input: {
  matrixId: string | null;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  backlogStatus: string;
  persistedAt: string;
}) {
  return `voxy-render-runtime-enablement-backlog:${stableHash(
    [
      input.matrixId ?? "",
      input.providerSelectionDraftId ?? "",
      input.assetPackDraftId ?? "",
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.backlogStatus,
      input.persistedAt,
    ].join(":"),
  ).slice(0, 24)}`;
}

function auditIdFor(input: { backlogId: string; decisionGateId: string | null; at: string }) {
  return `voxy-render-runtime-enablement-backlog-audit:${stableHash(
    `${input.backlogId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  matrixId: string | null;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  backlogStatus: string;
  createdBy: string | null;
}) {
  return `voxy-render-runtime-enablement-backlog-idempotency:${stableHash(
    [
      input.matrixId ?? "",
      input.providerSelectionDraftId ?? "",
      input.assetPackDraftId ?? "",
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.backlogStatus,
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderRuntimeEnablementBacklogPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Runtime-Enablement-Backlog"
      : "In-Memory-Fallback für Runtime-Enablement-Backlog",
    summary: persistent
      ? "Enablement-Backlogs und Audit-Spuren liegen getrennt von Render, Queue, Provider, Kosten, Upload und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Enablement-Backlogs leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderRuntimeEnablementBacklogRepository",
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
    recordsCol.createIndex({ matrixId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderRuntimeEnablementBacklogRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.backlogId },
        {
          $set: {
            _id: record.backlogId,
            record: clone(record),
            matrixId: record.matrixId,
            providerSelectionDraftId: record.providerSelectionDraftId,
            assetPackDraftId: record.assetPackDraftId,
            costPolicyPreviewId: record.costPolicyPreviewId,
            queuePreviewId: record.queuePreviewId,
            requestDraftId: record.requestDraftId,
            decisionId: record.decisionId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            backlogStatus: record.backlogStatus,
            nextRecommendedAction: record.nextRecommendedAction,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            backlogVersion: record.backlogVersion,
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
      const backlogId = normalizeOptionalString(params?.backlogId);
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
      if (backlogId) filter._id = backlogId;
      if (matrixId) filter.matrixId = matrixId;
      if (providerSelectionDraftId) filter.providerSelectionDraftId = providerSelectionDraftId;
      if (assetPackDraftId) filter.assetPackDraftId = assetPackDraftId;
      if (costPolicyPreviewId) filter.costPolicyPreviewId = costPolicyPreviewId;
      if (queuePreviewId) filter.queuePreviewId = queuePreviewId;
      if (requestDraftId) filter.requestDraftId = requestDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (decisionGateIds.length > 0) filter.decisionGateId = { $in: decisionGateIds };
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const limit = Math.max(1, Math.min(50, params?.limit ?? 20));
      const docs = await col.find(filter).sort({ persistedAt: -1 }).limit(limit).toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderRuntimeEnablementBacklogRecord))
        .filter(Boolean);
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
            backlogId: event.backlogId,
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
      const backlogId = normalizeOptionalString(params?.backlogId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (backlogId) filter.backlogId = backlogId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const limit = Math.max(1, Math.min(50, params?.limit ?? 20));
      const docs = await col.find(filter).sort({ at: -1 }).limit(limit).toArray();
      return docs
        .map((doc) => clone(doc.event as VoxyRenderRuntimeEnablementBacklogAuditEvent))
        .filter(Boolean);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderRuntimeEnablementBacklogRepository(): VoxyRenderRuntimeEnablementBacklogRepository {
  const records = new Map<string, VoxyRenderRuntimeEnablementBacklogRecord>();
  const audits = new Map<string, VoxyRenderRuntimeEnablementBacklogAuditEvent>();
  return {
    async saveRecord(record) {
      records.set(record.backlogId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      return Array.from(records.values())
        .filter((record) => {
          if (params?.backlogId && record.backlogId !== params.backlogId) return false;
          if (params?.matrixId && record.matrixId !== params.matrixId) return false;
          if (
            params?.providerSelectionDraftId &&
            record.providerSelectionDraftId !== params.providerSelectionDraftId
          ) {
            return false;
          }
          if (params?.assetPackDraftId && record.assetPackDraftId !== params.assetPackDraftId) {
            return false;
          }
          if (
            params?.costPolicyPreviewId &&
            record.costPolicyPreviewId !== params.costPolicyPreviewId
          ) {
            return false;
          }
          if (params?.queuePreviewId && record.queuePreviewId !== params.queuePreviewId) {
            return false;
          }
          if (params?.requestDraftId && record.requestDraftId !== params.requestDraftId) {
            return false;
          }
          if (params?.decisionId && record.decisionId !== params.decisionId) return false;
          if (params?.decisionGateId && record.decisionGateId !== params.decisionGateId) {
            return false;
          }
          if (
            decisionGateIds.length > 0 &&
            !decisionGateIds.includes(normalizeText(record.decisionGateId))
          ) {
            return false;
          }
          if (params?.contributionRefId && record.contributionRef?.id !== params.contributionRefId) {
            return false;
          }
          if (params?.dossierRefId && record.dossierRef?.id !== params.dossierRefId) return false;
          return true;
        })
        .sort((left, right) => (right.persistedAt ?? "").localeCompare(left.persistedAt ?? ""))
        .slice(0, Math.max(1, Math.min(50, params?.limit ?? 20)))
        .map((record) => clone(record));
    },
    async appendAuditEvent(event) {
      audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      return Array.from(audits.values())
        .filter((event) => {
          if (params?.backlogId && event.backlogId !== params.backlogId) return false;
          if (params?.decisionId && event.decisionId !== params.decisionId) return false;
          if (params?.decisionGateId && event.decisionGateId !== params.decisionGateId) {
            return false;
          }
          return true;
        })
        .sort((left, right) => right.at.localeCompare(left.at))
        .slice(0, Math.max(1, Math.min(50, params?.limit ?? 20)))
        .map((event) => clone(event));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function resolveRepository() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderRuntimeEnablementBacklogRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderRuntimeEnablementBacklogRepositoryForTests(
  repository: VoxyRenderRuntimeEnablementBacklogRepository,
) {
  repoSingleton = repository;
}

export function getVoxyRenderRuntimeEnablementBacklogPersistenceState() {
  return resolveRepository().getPersistenceState();
}

export async function listVoxyRenderRuntimeEnablementBacklogRecords(
  params?: VoxyRenderRuntimeEnablementBacklogRecordListParams,
) {
  return resolveRepository().listRecords(params);
}

export async function getLatestVoxyRenderRuntimeEnablementBacklogRecord(decisionGateId: string) {
  return resolveRepository().getLatestRecord(decisionGateId);
}

export async function listLatestVoxyRenderRuntimeEnablementBacklogRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  const records = await resolveRepository().listRecords({
    decisionGateIds: normalized,
    limit: Math.max(20, normalized.length * 3),
  });
  const map = new Map<string, VoxyRenderRuntimeEnablementBacklogRecord>();
  for (const record of records) {
    if (!record.decisionGateId || map.has(record.decisionGateId)) continue;
    map.set(record.decisionGateId, record);
  }
  return map;
}

export async function listVoxyRenderRuntimeEnablementBacklogAuditEvents(
  params?: VoxyRenderRuntimeEnablementBacklogAuditListParams,
) {
  return resolveRepository().listAuditEvents(params);
}

export async function persistVoxyRenderRuntimeEnablementBacklog(input: {
  command: VoxyRenderRuntimeEnablementBacklogCommand;
}) {
  const repo = resolveRepository();
  const persistence = repo.getPersistenceState();
  const persistedAt = nowIso();
  const normalizedCreatedBy = normalizeOptionalString(input.command.createdBy);
  const existingLatest =
    input.command.decisionGateId != null
      ? await repo.getLatestRecord(input.command.decisionGateId)
      : null;
  const backlogId = backlogIdFor({
    matrixId: input.command.matrixId,
    providerSelectionDraftId: input.command.providerSelectionDraftId,
    assetPackDraftId: input.command.assetPackDraftId,
    costPolicyPreviewId: input.command.costPolicyPreviewId,
    queuePreviewId: input.command.queuePreviewId,
    requestDraftId: input.command.requestDraftId,
    decisionId: input.command.decisionId,
    decisionGateId: input.command.decisionGateId,
    backlogStatus: input.command.backlogStatus,
    persistedAt,
  });
  const idempotencyKey = buildIdempotencyKey({
    matrixId: input.command.matrixId,
    providerSelectionDraftId: input.command.providerSelectionDraftId,
    assetPackDraftId: input.command.assetPackDraftId,
    costPolicyPreviewId: input.command.costPolicyPreviewId,
    queuePreviewId: input.command.queuePreviewId,
    requestDraftId: input.command.requestDraftId,
    decisionId: input.command.decisionId,
    decisionGateId: input.command.decisionGateId,
    backlogStatus: input.command.backlogStatus,
    createdBy: normalizedCreatedBy,
  });
  const record: VoxyRenderRuntimeEnablementBacklogRecord = {
    ...clone(input.command),
    backlogId,
    persistedAt,
    persistedBy: normalizedCreatedBy,
    idempotencyKey,
    previousBacklogRef: existingLatest?.backlogId ?? null,
    supersedesBacklogRef: existingLatest?.backlogId ?? null,
    backlogVersion: (existingLatest?.backlogVersion ?? 0) + 1,
  };
  const savedRecord = await repo.saveRecord(record);
  const auditEvent: VoxyRenderRuntimeEnablementBacklogAuditEvent = {
    id: auditIdFor({
      backlogId: savedRecord.backlogId,
      decisionGateId: savedRecord.decisionGateId,
      at: persistedAt,
    }),
    backlogId: savedRecord.backlogId,
    matrixId: savedRecord.matrixId,
    providerSelectionDraftId: savedRecord.providerSelectionDraftId,
    assetPackDraftId: savedRecord.assetPackDraftId,
    costPolicyPreviewId: savedRecord.costPolicyPreviewId,
    queuePreviewId: savedRecord.queuePreviewId,
    requestDraftId: savedRecord.requestDraftId,
    decisionId: savedRecord.decisionId,
    decisionGateId: savedRecord.decisionGateId,
    action: "runtime_enablement_backlog_recorded",
    byUserId: normalizedCreatedBy,
    at: persistedAt,
    backlogStatus: savedRecord.backlogStatus,
    nextRecommendedAction: savedRecord.nextRecommendedAction,
    videoFormat: savedRecord.videoFormat,
    note: null,
    summary: `${savedRecord.backlogStatus} · ${savedRecord.nextRecommendedAction} · ${savedRecord.userVisibleSummary}`,
    previousBacklogRef: existingLatest?.backlogId ?? null,
  };
  await repo.appendAuditEvent(auditEvent);
  const result: VoxyRenderRuntimeEnablementStoreResult = {
    ok: true,
    status: persistence.productionTruth ? "preview_only" : "noop",
    record: savedRecord,
    warnings:
      persistence.mode === "in_memory_fallback"
        ? ["Nur In-Memory-Fallback aktiv; Backlog ist keine belastbare Produktionswahrheit."]
        : [],
    errors: [],
    idempotencyKey,
    nextStep: savedRecord.userVisibleSummary,
  };
  return {
    result,
    auditEvent,
    persistence,
  };
}
