import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderPreviewReviewFlowCommand,
  VoxyRenderPreviewReviewFlowPersistenceState,
  VoxyRenderPreviewReviewFlowRecord,
  VoxyRenderPreviewReviewFlowStoreResult,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";

export const VOXY_RENDER_PREVIEW_REVIEW_FLOW_AUDIT_ACTIONS = [
  "preview_review_flow_recorded",
] as const;

export type VoxyRenderPreviewReviewFlowAuditAction =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_FLOW_AUDIT_ACTIONS)[number];

export type VoxyRenderPreviewReviewFlowAuditEvent = {
  id: string;
  previewReviewFlowId: string;
  enablementBacklogId: string | null;
  matrixId: string | null;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderPreviewReviewFlowAuditAction;
  byUserId: string | null;
  at: string;
  previewStatus: VoxyRenderPreviewReviewFlowRecord["previewStatus"];
  overallDecision: VoxyRenderPreviewReviewFlowRecord["overallDecision"];
  nextRecommendedAction: VoxyRenderPreviewReviewFlowRecord["nextRecommendedAction"];
  note: string | null;
  summary: string;
  previousPreviewReviewFlowRef: string | null;
};

export type VoxyRenderPreviewReviewFlowRecordListParams = {
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
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

export type VoxyRenderPreviewReviewFlowAuditListParams = {
  previewReviewFlowId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderPreviewReviewFlowRepository = {
  saveRecord(record: VoxyRenderPreviewReviewFlowRecord): Promise<VoxyRenderPreviewReviewFlowRecord>;
  getLatestRecord(decisionGateId: string): Promise<VoxyRenderPreviewReviewFlowRecord | null>;
  listRecords(
    params?: VoxyRenderPreviewReviewFlowRecordListParams,
  ): Promise<VoxyRenderPreviewReviewFlowRecord[]>;
  appendAuditEvent(
    event: VoxyRenderPreviewReviewFlowAuditEvent,
  ): Promise<VoxyRenderPreviewReviewFlowAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderPreviewReviewFlowAuditListParams,
  ): Promise<VoxyRenderPreviewReviewFlowAuditEvent[]>;
  getPersistenceState(): VoxyRenderPreviewReviewFlowPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_preview_review_flow_records";
const AUDITS_COLLECTION = "voxy_render_preview_review_flow_audits";

let repoSingleton: VoxyRenderPreviewReviewFlowRepository | null = null;
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

function normalizeDecisionGateIds(values: string[] | undefined) {
  return Array.from(new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []));
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderPreviewReviewFlowPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Preview-Review-Flow-Store"
      : "In-Memory-Fallback für Preview-Review-Flow",
    summary: persistent
      ? "Preview-Review-Flows und Audit-Spuren werden getrennt von Render, Queue, Provider, Kosten und Publishing persistiert."
      : "Nur Dev-/Test-/Runtime-Fallback: Preview-Review-Flows leben pro Prozess und sind keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderPreviewReviewFlowRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  decisionGateId: string | null;
  decisionId: string | null;
  previewStatus: string;
  createdBy: string | null;
}) {
  return `voxy-render-preview-review-flow-idempotency:${stableHash(
    [
      input.decisionGateId ?? "",
      input.decisionId ?? "",
      input.previewStatus,
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  previewReviewFlowId: string;
  decisionGateId: string | null;
  at: string;
}) {
  return `voxy-render-preview-review-flow-audit:${stableHash(
    `${input.previewReviewFlowId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
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
    recordsCol.createIndex({ enablementBacklogId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ matrixId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderPreviewReviewFlowRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.previewReviewFlowId },
        {
          $set: {
            _id: record.previewReviewFlowId,
            record: clone(record),
            enablementBacklogId: record.enablementBacklogId,
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
            previewStatus: record.previewStatus,
            overallDecision: record.overallDecision,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            previewReviewVersion: record.previewReviewVersion,
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
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const enablementBacklogId = normalizeOptionalString(params?.enablementBacklogId);
      const matrixId = normalizeOptionalString(params?.matrixId);
      const providerSelectionDraftId = normalizeOptionalString(params?.providerSelectionDraftId);
      const assetPackDraftId = normalizeOptionalString(params?.assetPackDraftId);
      const costPolicyPreviewId = normalizeOptionalString(params?.costPolicyPreviewId);
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      if (previewReviewFlowId) filter._id = previewReviewFlowId;
      if (enablementBacklogId) filter.enablementBacklogId = enablementBacklogId;
      if (matrixId) filter.matrixId = matrixId;
      if (providerSelectionDraftId) filter.providerSelectionDraftId = providerSelectionDraftId;
      if (assetPackDraftId) filter.assetPackDraftId = assetPackDraftId;
      if (costPolicyPreviewId) filter.costPolicyPreviewId = costPolicyPreviewId;
      if (queuePreviewId) filter.queuePreviewId = queuePreviewId;
      if (requestDraftId) filter.requestDraftId = requestDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      if (decisionGateIds.length > 0) filter.decisionGateId = { $in: decisionGateIds };
      const limit = Math.max(1, Math.min(100, params?.limit ?? 20));
      const docs = await col.find(filter).sort({ persistedAt: -1, _id: -1 }).limit(limit).toArray();
      return docs.map((doc: any) => clone(doc.record as VoxyRenderPreviewReviewFlowRecord));
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
            previewReviewFlowId: event.previewReviewFlowId,
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
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const limit = Math.max(1, Math.min(100, params?.limit ?? 20));
      const docs = await col.find(filter).sort({ at: -1, _id: -1 }).limit(limit).toArray();
      return docs.map((doc: any) => clone(doc.event as VoxyRenderPreviewReviewFlowAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderPreviewReviewFlowRepository(): VoxyRenderPreviewReviewFlowRepository {
  const records = new Map<string, VoxyRenderPreviewReviewFlowRecord>();
  const audits = new Map<string, VoxyRenderPreviewReviewFlowAuditEvent>();

  return {
    async saveRecord(record) {
      records.set(record.previewReviewFlowId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const all = Array.from(records.values()).map(clone);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      return all
        .filter((record) => {
          if (
            normalizeOptionalString(params?.previewReviewFlowId) &&
            record.previewReviewFlowId !== normalizeOptionalString(params?.previewReviewFlowId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.enablementBacklogId) &&
            record.enablementBacklogId !== normalizeOptionalString(params?.enablementBacklogId)
          ) {
            return false;
          }
          if (normalizeOptionalString(params?.matrixId) && record.matrixId !== normalizeOptionalString(params?.matrixId)) {
            return false;
          }
          if (
            normalizeOptionalString(params?.providerSelectionDraftId) &&
            record.providerSelectionDraftId !== normalizeOptionalString(params?.providerSelectionDraftId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.assetPackDraftId) &&
            record.assetPackDraftId !== normalizeOptionalString(params?.assetPackDraftId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.costPolicyPreviewId) &&
            record.costPolicyPreviewId !== normalizeOptionalString(params?.costPolicyPreviewId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.queuePreviewId) &&
            record.queuePreviewId !== normalizeOptionalString(params?.queuePreviewId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.requestDraftId) &&
            record.requestDraftId !== normalizeOptionalString(params?.requestDraftId)
          ) {
            return false;
          }
          if (normalizeOptionalString(params?.decisionId) && record.decisionId !== normalizeOptionalString(params?.decisionId)) {
            return false;
          }
          if (
            normalizeOptionalString(params?.decisionGateId) &&
            record.decisionGateId !== normalizeOptionalString(params?.decisionGateId)
          ) {
            return false;
          }
          if (decisionGateIds.length > 0 && !decisionGateIds.includes(record.decisionGateId ?? "")) {
            return false;
          }
          if (
            normalizeOptionalString(params?.contributionRefId) &&
            record.contributionRef?.id !== normalizeOptionalString(params?.contributionRefId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.dossierRefId) &&
            record.dossierRef?.id !== normalizeOptionalString(params?.dossierRefId)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => String(b.persistedAt ?? "").localeCompare(String(a.persistedAt ?? "")))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)));
    },
    async appendAuditEvent(event) {
      audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      return Array.from(audits.values())
        .map(clone)
        .filter((event) => {
          if (
            normalizeOptionalString(params?.previewReviewFlowId) &&
            event.previewReviewFlowId !== normalizeOptionalString(params?.previewReviewFlowId)
          ) {
            return false;
          }
          if (normalizeOptionalString(params?.decisionId) && event.decisionId !== normalizeOptionalString(params?.decisionId)) {
            return false;
          }
          if (
            normalizeOptionalString(params?.decisionGateId) &&
            event.decisionGateId !== normalizeOptionalString(params?.decisionGateId)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => String(b.at).localeCompare(String(a.at)))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function getRepository() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderPreviewReviewFlowRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderPreviewReviewFlowRepositoryForTests(
  repo: VoxyRenderPreviewReviewFlowRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderPreviewReviewFlowPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderPreviewReviewFlowRecords(
  params?: VoxyRenderPreviewReviewFlowRecordListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderPreviewReviewFlowRecord(decisionGateId: string) {
  return getRepository().getLatestRecord(decisionGateId);
}

export async function listLatestVoxyRenderPreviewReviewFlowRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) return new Map<string, VoxyRenderPreviewReviewFlowRecord>();
  const records = await getRepository().listRecords({
    decisionGateIds: normalized,
    limit: normalized.length * 5,
  });
  const result = new Map<string, VoxyRenderPreviewReviewFlowRecord>();
  for (const record of records) {
    const key = normalizeOptionalString(record.decisionGateId);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

export async function listVoxyRenderPreviewReviewFlowAuditEvents(
  params?: VoxyRenderPreviewReviewFlowAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderPreviewReviewFlow(input: {
  command: VoxyRenderPreviewReviewFlowCommand;
}) {
  const repo = getRepository();
  const createdAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const createdBy = normalizeOptionalString(input.command.createdBy);
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  const latestRecord = decisionGateId ? await repo.getLatestRecord(decisionGateId) : null;
  const previewReviewVersion = latestRecord ? (latestRecord.previewReviewVersion ?? 0) + 1 : 1;
  const idempotencyKey = buildIdempotencyKey({
    decisionGateId,
    decisionId: normalizeOptionalString(input.command.decisionId),
    previewStatus: input.command.previewStatus,
    createdBy,
  });

  const record: VoxyRenderPreviewReviewFlowRecord = {
    ...clone(input.command),
    persistedAt: createdAt,
    persistedBy: createdBy,
    idempotencyKey,
    previousPreviewReviewFlowRef: latestRecord?.previewReviewFlowId ?? null,
    supersedesPreviewReviewFlowRef: latestRecord?.previewReviewFlowId ?? null,
    previewReviewVersion,
  };

  const savedRecord = await repo.saveRecord(record);
  const auditEvent: VoxyRenderPreviewReviewFlowAuditEvent = {
    id: buildAuditId({
      previewReviewFlowId: savedRecord.previewReviewFlowId,
      decisionGateId: savedRecord.decisionGateId,
      at: createdAt,
    }),
    previewReviewFlowId: savedRecord.previewReviewFlowId,
    enablementBacklogId: savedRecord.enablementBacklogId,
    matrixId: savedRecord.matrixId,
    providerSelectionDraftId: savedRecord.providerSelectionDraftId,
    assetPackDraftId: savedRecord.assetPackDraftId,
    costPolicyPreviewId: savedRecord.costPolicyPreviewId,
    queuePreviewId: savedRecord.queuePreviewId,
    requestDraftId: savedRecord.requestDraftId,
    decisionId: savedRecord.decisionId,
    decisionGateId: savedRecord.decisionGateId,
    action: "preview_review_flow_recorded",
    byUserId: createdBy,
    at: createdAt,
    previewStatus: savedRecord.previewStatus,
    overallDecision: savedRecord.overallDecision,
    nextRecommendedAction: savedRecord.nextRecommendedAction,
    note: null,
    summary: savedRecord.reviewerVisibleSummary,
    previousPreviewReviewFlowRef: latestRecord?.previewReviewFlowId ?? null,
  };
  await repo.appendAuditEvent(auditEvent);

  const status: VoxyRenderPreviewReviewFlowStoreResult["status"] =
    savedRecord.previewStatus === "blocked_by_missing_backlog" ||
    savedRecord.previewStatus === "blocked_by_missing_matrix" ||
    savedRecord.previewStatus === "blocked_by_runtime_truth"
      ? "blocked"
      : "noop";

  const result: VoxyRenderPreviewReviewFlowStoreResult = {
    ok: true,
    status,
    record: savedRecord,
    warnings: [],
    errors: [],
    idempotencyKey,
    nextStep: savedRecord.nextStep,
  };

  return {
    result,
    auditEvent,
    persistence: repo.getPersistenceState(),
  };
}
