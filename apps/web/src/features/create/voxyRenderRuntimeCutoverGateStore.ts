import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderRuntimeCutoverGateCommand,
  VoxyRenderRuntimeCutoverGatePersistenceState,
  VoxyRenderRuntimeCutoverGateRecord,
  VoxyRenderRuntimeCutoverGateStoreResult,
} from "@/features/create/voxyRenderRuntimeCutoverGateContract";

export const VOXY_RENDER_RUNTIME_CUTOVER_GATE_AUDIT_ACTIONS = [
  "runtime_cutover_gate_recorded",
] as const;

export type VoxyRenderRuntimeCutoverGateAuditAction =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_GATE_AUDIT_ACTIONS)[number];

export type VoxyRenderRuntimeCutoverGateAuditEvent = {
  id: string;
  runtimeCutoverGateId: string;
  runtimeObservabilityId: string;
  schedulingPolicyId: string | null;
  previewReviewFlowId: string | null;
  action: VoxyRenderRuntimeCutoverGateAuditAction;
  byUserId: string | null;
  at: string;
  runtimeCutoverGateStatus: VoxyRenderRuntimeCutoverGateRecord["runtimeCutoverGateStatus"];
  nextStep: VoxyRenderRuntimeCutoverGateRecord["nextStep"];
  summary: string;
  note: string | null;
  previousRuntimeCutoverGateRef: string | null;
};

export type VoxyRenderRuntimeCutoverGateListParams = {
  runtimeCutoverGateId?: string | null;
  runtimeObservabilityId?: string | null;
  schedulingPolicyId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderRuntimeCutoverGateAuditListParams = {
  runtimeObservabilityId?: string | null;
  previewReviewFlowId?: string | null;
  limit?: number;
};

export type VoxyRenderRuntimeCutoverGateRepository = {
  saveRecord(record: VoxyRenderRuntimeCutoverGateRecord): Promise<VoxyRenderRuntimeCutoverGateRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderRuntimeCutoverGateListParams,
      "runtimeObservabilityId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderRuntimeCutoverGateRecord | null>;
  listRecords(
    params?: VoxyRenderRuntimeCutoverGateListParams,
  ): Promise<VoxyRenderRuntimeCutoverGateRecord[]>;
  appendAuditEvent(
    event: VoxyRenderRuntimeCutoverGateAuditEvent,
  ): Promise<VoxyRenderRuntimeCutoverGateAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderRuntimeCutoverGateAuditListParams,
  ): Promise<VoxyRenderRuntimeCutoverGateAuditEvent[]>;
  getPersistenceState(): VoxyRenderRuntimeCutoverGatePersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_runtime_cutover_gate_records";
const AUDITS_COLLECTION = "voxy_render_runtime_cutover_gate_audits";

let repositorySingleton: VoxyRenderRuntimeCutoverGateRepository | null = null;
let indexesReady = false;

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeRef<T extends { id: string; title: string; href?: string | null } | null | undefined>(
  ref: T,
) {
  if (!ref) return null;
  const id = normalizeText(ref.id);
  const title = normalizeText(ref.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    href: normalizeOptionalString(ref.href),
  };
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderRuntimeCutoverGatePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Runtime-Cutover-Gate-Store"
      : "In-Memory-Fallback für Runtime Cutover Gate",
    summary: persistent
      ? "Cutover-Gate-Records bleiben streng read-only gegenüber Runtime, Feature Flag, Provider, Queue, Worker, Upload, Scheduling und Publish."
      : "Nur Dev-/Test-Fallback: Cutover-Gate-Records leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderRuntimeCutoverGateRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildRecordId(input: {
  runtimeObservabilityId: string;
  previewReviewFlowId: string | null;
  runtimeCutoverGateStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-runtime-cutover-gate:${stableHash(
    [
      input.runtimeObservabilityId,
      input.previewReviewFlowId ?? "",
      input.runtimeCutoverGateStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  runtimeCutoverGateId: string;
  runtimeObservabilityId: string;
  at: string;
}) {
  return `voxy-render-runtime-cutover-gate-audit:${stableHash(
    `${input.runtimeCutoverGateId}:${input.runtimeObservabilityId}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  runtimeObservabilityId: string;
  previewReviewFlowId: string | null;
  runtimeCutoverGateStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-runtime-cutover-gate-idempotency:${stableHash(
    [
      input.runtimeObservabilityId,
      input.previewReviewFlowId ?? "",
      input.runtimeCutoverGateStatus,
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDITS_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ runtimeObservabilityId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ schedulingPolicyId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ runtimeObservabilityId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function matchesRecord(
  record: VoxyRenderRuntimeCutoverGateRecord,
  params: VoxyRenderRuntimeCutoverGateListParams,
) {
  if (params.runtimeCutoverGateId && record.runtimeCutoverGateId !== params.runtimeCutoverGateId) {
    return false;
  }
  if (params.runtimeObservabilityId && record.runtimeObservabilityId !== params.runtimeObservabilityId) {
    return false;
  }
  if (params.schedulingPolicyId && record.schedulingPolicyId !== params.schedulingPolicyId) {
    return false;
  }
  if (params.previewReviewFlowId && record.previewReviewFlowId !== params.previewReviewFlowId) {
    return false;
  }
  if (params.contributionRefId && record.contributionRef?.id !== params.contributionRefId) {
    return false;
  }
  if (params.dossierRefId && record.dossierRef?.id !== params.dossierRefId) {
    return false;
  }
  return true;
}

function matchesAudit(
  event: VoxyRenderRuntimeCutoverGateAuditEvent,
  params: VoxyRenderRuntimeCutoverGateAuditListParams,
) {
  if (params.runtimeObservabilityId && event.runtimeObservabilityId !== params.runtimeObservabilityId) {
    return false;
  }
  if (params.previewReviewFlowId && event.previewReviewFlowId !== params.previewReviewFlowId) {
    return false;
  }
  return true;
}

export function createInMemoryVoxyRenderRuntimeCutoverGateRepository(): VoxyRenderRuntimeCutoverGateRepository {
  const records: VoxyRenderRuntimeCutoverGateRecord[] = [];
  const audits: VoxyRenderRuntimeCutoverGateAuditEvent[] = [];
  return {
    async saveRecord(record) {
      records.unshift(clone(record));
      return clone(record);
    },
    async getLatestRecord(params) {
      const normalized = {
        runtimeObservabilityId: normalizeOptionalString(params.runtimeObservabilityId),
        previewReviewFlowId: normalizeOptionalString(params.previewReviewFlowId),
      };
      return (
        records.find((record) =>
          matchesRecord(record, {
            runtimeObservabilityId: normalized.runtimeObservabilityId,
            previewReviewFlowId: normalized.previewReviewFlowId,
          }),
        ) ?? null
      );
    },
    async listRecords(params = {}) {
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      return records
        .filter((record) =>
          matchesRecord(record, {
            runtimeCutoverGateId: normalizeOptionalString(params.runtimeCutoverGateId),
            runtimeObservabilityId: normalizeOptionalString(params.runtimeObservabilityId),
            schedulingPolicyId: normalizeOptionalString(params.schedulingPolicyId),
            previewReviewFlowId: normalizeOptionalString(params.previewReviewFlowId),
            contributionRefId: normalizeOptionalString(params.contributionRefId),
            dossierRefId: normalizeOptionalString(params.dossierRefId),
          }),
        )
        .slice(0, limit)
        .map((record) => clone(record));
    },
    async appendAuditEvent(event) {
      audits.unshift(clone(event));
      return clone(event);
    },
    async listAuditEvents(params = {}) {
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      return audits
        .filter((event) =>
          matchesAudit(event, {
            runtimeObservabilityId: normalizeOptionalString(params.runtimeObservabilityId),
            previewReviewFlowId: normalizeOptionalString(params.previewReviewFlowId),
          }),
        )
        .slice(0, limit)
        .map((event) => clone(event));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function createMongoRepository(): VoxyRenderRuntimeCutoverGateRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.runtimeCutoverGateId },
        {
          $set: {
            _id: record.runtimeCutoverGateId,
            record: clone(record),
            runtimeObservabilityId: record.runtimeObservabilityId,
            schedulingPolicyId: record.schedulingPolicyId,
            previewReviewFlowId: record.previewReviewFlowId ?? null,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            runtimeCutoverGateStatus: record.runtimeCutoverGateStatus,
            nextStep: record.nextStep,
            runtimeCutoverGateVersion: record.runtimeCutoverGateVersion,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(params) {
      const [record] = await this.listRecords({
        runtimeObservabilityId: params.runtimeObservabilityId,
        previewReviewFlowId: params.previewReviewFlowId,
        limit: 1,
      });
      return record ?? null;
    },
    async listRecords(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const runtimeCutoverGateId = normalizeOptionalString(params.runtimeCutoverGateId);
      const runtimeObservabilityId = normalizeOptionalString(params.runtimeObservabilityId);
      const schedulingPolicyId = normalizeOptionalString(params.schedulingPolicyId);
      const previewReviewFlowId = normalizeOptionalString(params.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params.contributionRefId);
      const dossierRefId = normalizeOptionalString(params.dossierRefId);
      if (runtimeCutoverGateId) filter._id = runtimeCutoverGateId;
      if (runtimeObservabilityId) filter.runtimeObservabilityId = runtimeObservabilityId;
      if (schedulingPolicyId) filter.schedulingPolicyId = schedulingPolicyId;
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      const rows = await col.find(filter).sort({ persistedAt: -1 }).limit(limit).toArray();
      return rows.map((row) => clone(row.record) as VoxyRenderRuntimeCutoverGateRecord);
    },
    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDITS_COLLECTION);
      await col.insertOne({
        _id: event.id,
        ...clone(event),
      });
      return clone(event);
    },
    async listAuditEvents(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDITS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const runtimeObservabilityId = normalizeOptionalString(params.runtimeObservabilityId);
      const previewReviewFlowId = normalizeOptionalString(params.previewReviewFlowId);
      if (runtimeObservabilityId) filter.runtimeObservabilityId = runtimeObservabilityId;
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      const rows = await col.find(filter).sort({ at: -1 }).limit(limit).toArray();
      return rows.map((row) => {
        const { _id: _ignored, ...event } = row;
        return clone(event) as VoxyRenderRuntimeCutoverGateAuditEvent;
      });
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

function resolveRepository() {
  if (repositorySingleton) return repositorySingleton;
  repositorySingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderRuntimeCutoverGateRepository()
    : createMongoRepository();
  return repositorySingleton;
}

export function setVoxyRenderRuntimeCutoverGateRepositoryForTests(
  repository: VoxyRenderRuntimeCutoverGateRepository | null,
) {
  repositorySingleton = repository;
}

export function getVoxyRenderRuntimeCutoverGatePersistenceState() {
  return resolveRepository().getPersistenceState();
}

export async function listVoxyRenderRuntimeCutoverGateRecords(
  params: VoxyRenderRuntimeCutoverGateListParams = {},
) {
  return resolveRepository().listRecords(params);
}

export async function getLatestVoxyRenderRuntimeCutoverGateRecord(
  params: Pick<
    VoxyRenderRuntimeCutoverGateListParams,
    "runtimeObservabilityId" | "previewReviewFlowId"
  >,
) {
  return resolveRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderRuntimeCutoverGatesByRuntimeObservabilityIds(
  runtimeObservabilityIds: string[],
) {
  const normalized = Array.from(
    new Set(runtimeObservabilityIds.map((value) => normalizeText(value)).filter(Boolean)),
  );
  if (normalized.length === 0) return new Map<string, VoxyRenderRuntimeCutoverGateRecord>();
  const records = await resolveRepository().listRecords({
    limit: Math.max(20, normalized.length * 3),
  });
  const latest = new Map<string, VoxyRenderRuntimeCutoverGateRecord>();
  for (const record of records) {
    if (!normalized.includes(record.runtimeObservabilityId) || latest.has(record.runtimeObservabilityId)) {
      continue;
    }
    latest.set(record.runtimeObservabilityId, record);
  }
  return latest;
}

export async function listVoxyRenderRuntimeCutoverGateAuditEvents(
  params: VoxyRenderRuntimeCutoverGateAuditListParams = {},
) {
  return resolveRepository().listAuditEvents(params);
}

function everyExecutionFlagIsFalse(
  flags: VoxyRenderRuntimeCutoverGateCommand["executionFlags"],
) {
  return Object.values(flags).every((value) => value === false);
}

function semanticsRemainNoop(
  semantics: VoxyRenderRuntimeCutoverGateCommand["semantics"],
) {
  return (
    semantics.runtimeEnabled === false &&
    semantics.featureFlagEnabled === false &&
    semantics.providerRuntimeEnabled === false &&
    semantics.queueWorkerEnabled === false &&
    semantics.storageRuntimeEnabled === false &&
    semantics.uploadRuntimeEnabled === false &&
    semantics.schedulingRuntimeEnabled === false &&
    semantics.observabilityRuntimeEnabled === false &&
    semantics.costRuntimeEnabled === false &&
    semantics.rollbackReady === false &&
    semantics.runbookReady === false &&
    semantics.publishAllowed === false
  );
}

export async function persistVoxyRenderRuntimeCutoverGate(input: {
  command: VoxyRenderRuntimeCutoverGateCommand;
}) {
  const repository = resolveRepository();
  const persistence = repository.getPersistenceState();
  const warnings = [
    "runtime_cutover_gate_is_review_only",
    "feature_flag_remains_disabled",
    "provider_queue_upload_publish_runtime_remain_disabled",
  ];
  const errors: string[] = [];

  const runtimeObservabilityId = normalizeOptionalString(input.command.runtimeObservabilityId);
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord = runtimeObservabilityId
    ? await repository.getLatestRecord({ runtimeObservabilityId, previewReviewFlowId })
    : null;

  if (!runtimeObservabilityId) {
    errors.push("runtime_observability_required");
  }
  if (!semanticsRemainNoop(input.command.semantics)) {
    errors.push("runtime_cutover_gate_semantics_must_remain_noop");
  }
  if (!everyExecutionFlagIsFalse(input.command.executionFlags)) {
    errors.push("runtime_cutover_gate_execution_flags_must_remain_false");
  }
  if (
    input.command.gates.some((gate) => gate.executionAllowed !== false)
  ) {
    errors.push("runtime_cutover_gate_items_must_remain_non_executable");
  }
  if (
    input.command.cutoverCandidate.runtimeEnabled !== false ||
    input.command.cutoverCandidate.featureFlagEnabled !== false
  ) {
    errors.push("cutover_candidate_enablement_must_remain_false");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      status: "blocked",
      record: null,
      warnings,
      errors,
      idempotencyKey: null,
      nextStep: input.command.nextStep,
    } satisfies VoxyRenderRuntimeCutoverGateStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizeOptionalString(input.command.reviewerRef?.id);
  const record: VoxyRenderRuntimeCutoverGateRecord = {
    ...clone(input.command),
    runtimeCutoverGateId:
      normalizeOptionalString(input.command.runtimeCutoverGateId) ??
      buildRecordId({
        runtimeObservabilityId,
        previewReviewFlowId,
        runtimeCutoverGateStatus: input.command.runtimeCutoverGateStatus,
        persistedAt,
        persistedBy,
      }),
    runtimeObservabilityId,
    schedulingPolicyId: normalizeOptionalString(input.command.schedulingPolicyId),
    uploadTargetPolicyId: normalizeOptionalString(input.command.uploadTargetPolicyId),
    mediaStorageTruthId: normalizeOptionalString(input.command.mediaStorageTruthId),
    approvalSemanticsId: normalizeOptionalString(input.command.approvalSemanticsId),
    socialDistributionHandoffId: normalizeOptionalString(input.command.socialDistributionHandoffId),
    publishReadinessGuardId: normalizeOptionalString(input.command.publishReadinessGuardId),
    enablementBacklogId: normalizeOptionalString(input.command.enablementBacklogId),
    matrixId: normalizeOptionalString(input.command.matrixId),
    providerSelectionDraftId: normalizeOptionalString(input.command.providerSelectionDraftId),
    queueContractId: normalizeOptionalString(input.command.queueContractId),
    costCreditPolicyId: normalizeOptionalString(input.command.costCreditPolicyId),
    requestDraftId: normalizeOptionalString(input.command.requestDraftId),
    scriptRef: normalizeRef(input.command.scriptRef),
    contributionRef: normalizeRef(input.command.contributionRef),
    dossierRef: normalizeRef(input.command.dossierRef),
    reviewerRef: normalizeRef(input.command.reviewerRef),
    createdAt: normalizeOptionalString(input.command.createdAt),
    updatedAt: normalizeOptionalString(input.command.updatedAt),
    persistedAt,
    persistedBy,
    idempotencyKey: buildIdempotencyKey({
      runtimeObservabilityId,
      previewReviewFlowId,
      runtimeCutoverGateStatus: input.command.runtimeCutoverGateStatus,
      reviewerRefId: persistedBy,
    }),
    previousRuntimeCutoverGateRef: latestRecord?.runtimeCutoverGateId ?? null,
    supersedesRuntimeCutoverGateRef: latestRecord?.runtimeCutoverGateId ?? null,
    runtimeCutoverGateVersion: (latestRecord?.runtimeCutoverGateVersion ?? 0) + 1,
  };

  const saved = await repository.saveRecord(record);
  return {
    ok: true,
    status: persistence.productionTruth ? "persisted" : "noop",
    record: saved,
    warnings,
    errors: [],
    idempotencyKey: saved.idempotencyKey,
    nextStep: saved.nextStep,
  } satisfies VoxyRenderRuntimeCutoverGateStoreResult;
}

export async function appendVoxyRenderRuntimeCutoverGateAuditEvent(input: {
  record: VoxyRenderRuntimeCutoverGateRecord;
  action?: VoxyRenderRuntimeCutoverGateAuditAction;
  byUserId?: string | null;
  note?: string | null;
}) {
  const event: VoxyRenderRuntimeCutoverGateAuditEvent = {
    id: buildAuditId({
      runtimeCutoverGateId: input.record.runtimeCutoverGateId,
      runtimeObservabilityId: input.record.runtimeObservabilityId,
      at: nowIso(),
    }),
    runtimeCutoverGateId: input.record.runtimeCutoverGateId,
    runtimeObservabilityId: input.record.runtimeObservabilityId,
    schedulingPolicyId: input.record.schedulingPolicyId,
    previewReviewFlowId: input.record.previewReviewFlowId ?? null,
    action: input.action ?? "runtime_cutover_gate_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at: nowIso(),
    runtimeCutoverGateStatus: input.record.runtimeCutoverGateStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousRuntimeCutoverGateRef: input.record.previousRuntimeCutoverGateRef,
  };
  return resolveRepository().appendAuditEvent(event);
}
