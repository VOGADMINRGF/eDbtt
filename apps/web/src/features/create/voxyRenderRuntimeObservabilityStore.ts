import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderRuntimeObservabilityCommand,
  VoxyRenderRuntimeObservabilityPersistenceState,
  VoxyRenderRuntimeObservabilityRecord,
  VoxyRenderRuntimeObservabilityStoreResult,
} from "@/features/create/voxyRenderRuntimeObservabilityContract";

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_AUDIT_ACTIONS = [
  "runtime_observability_recorded",
] as const;

export type VoxyRenderRuntimeObservabilityAuditAction =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_AUDIT_ACTIONS)[number];

export type VoxyRenderRuntimeObservabilityAuditEvent = {
  id: string;
  runtimeObservabilityId: string;
  schedulingPolicyId: string;
  uploadTargetPolicyId: string | null;
  previewReviewFlowId: string | null;
  action: VoxyRenderRuntimeObservabilityAuditAction;
  byUserId: string | null;
  at: string;
  runtimeObservabilityStatus: VoxyRenderRuntimeObservabilityRecord["runtimeObservabilityStatus"];
  nextStep: VoxyRenderRuntimeObservabilityRecord["nextStep"];
  summary: string;
  note: string | null;
  previousRuntimeObservabilityRef: string | null;
};

export type VoxyRenderRuntimeObservabilityListParams = {
  runtimeObservabilityId?: string | null;
  schedulingPolicyId?: string | null;
  uploadTargetPolicyId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderRuntimeObservabilityAuditListParams = {
  schedulingPolicyId?: string | null;
  previewReviewFlowId?: string | null;
  limit?: number;
};

export type VoxyRenderRuntimeObservabilityRepository = {
  saveRecord(
    record: VoxyRenderRuntimeObservabilityRecord,
  ): Promise<VoxyRenderRuntimeObservabilityRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderRuntimeObservabilityListParams,
      "schedulingPolicyId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderRuntimeObservabilityRecord | null>;
  listRecords(
    params?: VoxyRenderRuntimeObservabilityListParams,
  ): Promise<VoxyRenderRuntimeObservabilityRecord[]>;
  appendAuditEvent(
    event: VoxyRenderRuntimeObservabilityAuditEvent,
  ): Promise<VoxyRenderRuntimeObservabilityAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderRuntimeObservabilityAuditListParams,
  ): Promise<VoxyRenderRuntimeObservabilityAuditEvent[]>;
  getPersistenceState(): VoxyRenderRuntimeObservabilityPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_runtime_observability_records";
const AUDITS_COLLECTION = "voxy_render_runtime_observability_audits";

let repositorySingleton: VoxyRenderRuntimeObservabilityRepository | null = null;
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
): VoxyRenderRuntimeObservabilityPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Runtime-Observability-Store"
      : "In-Memory-Fallback für Runtime-Observability",
    summary: persistent
      ? "Observability-Records und Audit-Spuren bleiben strikt getrennt von Runtime, Monitoring Provider, Event-Emitter, Render, Upload und Publish."
      : "Nur Dev-/Test-/Runtime-Fallback: Observability-Records leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderRuntimeObservabilityRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildRecordId(input: {
  schedulingPolicyId: string;
  previewReviewFlowId: string | null;
  runtimeObservabilityStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-runtime-observability:${stableHash(
    [
      input.schedulingPolicyId,
      input.previewReviewFlowId ?? "",
      input.runtimeObservabilityStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  runtimeObservabilityId: string;
  schedulingPolicyId: string;
  at: string;
}) {
  return `voxy-render-runtime-observability-audit:${stableHash(
    `${input.runtimeObservabilityId}:${input.schedulingPolicyId}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  schedulingPolicyId: string;
  previewReviewFlowId: string | null;
  runtimeObservabilityStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-runtime-observability-idempotency:${stableHash(
    [
      input.schedulingPolicyId,
      input.previewReviewFlowId ?? "",
      input.runtimeObservabilityStatus,
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
    recordsCol.createIndex({ schedulingPolicyId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ uploadTargetPolicyId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ schedulingPolicyId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function matchesRecord(
  record: VoxyRenderRuntimeObservabilityRecord,
  params: VoxyRenderRuntimeObservabilityListParams,
) {
  if (params.runtimeObservabilityId && record.runtimeObservabilityId !== params.runtimeObservabilityId) {
    return false;
  }
  if (params.schedulingPolicyId && record.schedulingPolicyId !== params.schedulingPolicyId) {
    return false;
  }
  if (params.uploadTargetPolicyId && record.uploadTargetPolicyId !== params.uploadTargetPolicyId) {
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
  event: VoxyRenderRuntimeObservabilityAuditEvent,
  params: VoxyRenderRuntimeObservabilityAuditListParams,
) {
  if (params.schedulingPolicyId && event.schedulingPolicyId !== params.schedulingPolicyId) {
    return false;
  }
  if (params.previewReviewFlowId && event.previewReviewFlowId !== params.previewReviewFlowId) {
    return false;
  }
  return true;
}

export function createInMemoryVoxyRenderRuntimeObservabilityRepository(): VoxyRenderRuntimeObservabilityRepository {
  const records: VoxyRenderRuntimeObservabilityRecord[] = [];
  const audits: VoxyRenderRuntimeObservabilityAuditEvent[] = [];
  return {
    async saveRecord(record) {
      records.unshift(clone(record));
      return clone(record);
    },
    async getLatestRecord(params) {
      const normalized = {
        schedulingPolicyId: normalizeOptionalString(params.schedulingPolicyId),
        previewReviewFlowId: normalizeOptionalString(params.previewReviewFlowId),
      };
      return (
        records.find((record) =>
          matchesRecord(record, {
            schedulingPolicyId: normalized.schedulingPolicyId,
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
            runtimeObservabilityId: normalizeOptionalString(params.runtimeObservabilityId),
            schedulingPolicyId: normalizeOptionalString(params.schedulingPolicyId),
            uploadTargetPolicyId: normalizeOptionalString(params.uploadTargetPolicyId),
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
            schedulingPolicyId: normalizeOptionalString(params.schedulingPolicyId),
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

function createMongoRepository(): VoxyRenderRuntimeObservabilityRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.runtimeObservabilityId },
        {
          $set: {
            _id: record.runtimeObservabilityId,
            record: clone(record),
            schedulingPolicyId: record.schedulingPolicyId,
            uploadTargetPolicyId: record.uploadTargetPolicyId,
            previewReviewFlowId: record.previewReviewFlowId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            runtimeObservabilityStatus: record.runtimeObservabilityStatus,
            nextStep: record.nextStep,
            runtimeObservabilityVersion: record.runtimeObservabilityVersion,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(params) {
      const [record] = await this.listRecords({
        schedulingPolicyId: params.schedulingPolicyId,
        previewReviewFlowId: params.previewReviewFlowId,
        limit: 1,
      });
      return record ?? null;
    },
    async listRecords(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const runtimeObservabilityId = normalizeOptionalString(params.runtimeObservabilityId);
      const schedulingPolicyId = normalizeOptionalString(params.schedulingPolicyId);
      const uploadTargetPolicyId = normalizeOptionalString(params.uploadTargetPolicyId);
      const previewReviewFlowId = normalizeOptionalString(params.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params.contributionRefId);
      const dossierRefId = normalizeOptionalString(params.dossierRefId);
      if (runtimeObservabilityId) filter._id = runtimeObservabilityId;
      if (schedulingPolicyId) filter.schedulingPolicyId = schedulingPolicyId;
      if (uploadTargetPolicyId) filter.uploadTargetPolicyId = uploadTargetPolicyId;
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      const rows = await col.find(filter).sort({ persistedAt: -1 }).limit(limit).toArray();
      return rows.map((row) => clone(row.record) as VoxyRenderRuntimeObservabilityRecord);
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
      const schedulingPolicyId = normalizeOptionalString(params.schedulingPolicyId);
      const previewReviewFlowId = normalizeOptionalString(params.previewReviewFlowId);
      if (schedulingPolicyId) filter.schedulingPolicyId = schedulingPolicyId;
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      const rows = await col.find(filter).sort({ at: -1 }).limit(limit).toArray();
      return rows.map((row) => {
        const { _id: _ignored, ...event } = row;
        return clone(event) as VoxyRenderRuntimeObservabilityAuditEvent;
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
    ? createInMemoryVoxyRenderRuntimeObservabilityRepository()
    : createMongoRepository();
  return repositorySingleton;
}

export function setVoxyRenderRuntimeObservabilityRepositoryForTests(
  repository: VoxyRenderRuntimeObservabilityRepository | null,
) {
  repositorySingleton = repository;
}

export function getVoxyRenderRuntimeObservabilityPersistenceState() {
  return resolveRepository().getPersistenceState();
}

export async function listVoxyRenderRuntimeObservabilityRecords(
  params: VoxyRenderRuntimeObservabilityListParams = {},
) {
  return resolveRepository().listRecords(params);
}

export async function getLatestVoxyRenderRuntimeObservabilityRecord(
  params: Pick<
    VoxyRenderRuntimeObservabilityListParams,
    "schedulingPolicyId" | "previewReviewFlowId"
  >,
) {
  return resolveRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderRuntimeObservabilityBySchedulingPolicyIds(
  schedulingPolicyIds: string[],
) {
  const normalized = Array.from(
    new Set(schedulingPolicyIds.map((value) => normalizeText(value)).filter(Boolean)),
  );
  if (normalized.length === 0) return new Map<string, VoxyRenderRuntimeObservabilityRecord>();
  const records = await resolveRepository().listRecords({
    limit: Math.max(20, normalized.length * 3),
  });
  const latest = new Map<string, VoxyRenderRuntimeObservabilityRecord>();
  for (const record of records) {
    if (!normalized.includes(record.schedulingPolicyId) || latest.has(record.schedulingPolicyId)) {
      continue;
    }
    latest.set(record.schedulingPolicyId, record);
  }
  return latest;
}

export async function listVoxyRenderRuntimeObservabilityAuditEvents(
  params: VoxyRenderRuntimeObservabilityAuditListParams = {},
) {
  return resolveRepository().listAuditEvents(params);
}

function everyExecutionFlagIsFalse(
  flags: VoxyRenderRuntimeObservabilityCommand["executionFlags"],
) {
  return Object.values(flags).every((value) => value === false);
}

function everySemanticFlagIsNoop(
  semantics: VoxyRenderRuntimeObservabilityCommand["semantics"],
) {
  return (
    semantics.observabilityPlan === true &&
    semantics.runtimeTraceAvailable === false &&
    semantics.auditEventsEmitted === false &&
    semantics.metricsEmitted === false &&
    semantics.alertsEmitted === false &&
    semantics.monitoringRuntimeEnabled === false &&
    semantics.runtimeEnabled === false &&
    semantics.renderExecuted === false &&
    semantics.uploadExecuted === false &&
    semantics.schedulingExecuted === false &&
    semantics.publishExecuted === false &&
    semantics.socialPostExecuted === false
  );
}

export async function persistVoxyRenderRuntimeObservability(input: {
  command: VoxyRenderRuntimeObservabilityCommand;
}) {
  const repository = resolveRepository();
  const persistence = repository.getPersistenceState();
  const warnings = [
    "audit_event_candidate_is_not_emitted",
    "metric_candidate_is_not_metric_stream",
    "alert_candidate_is_not_alert_runtime",
    "runtime_trace_candidate_is_not_execution",
    "no_monitoring_provider_or_runtime_is_activated",
  ];
  const errors: string[] = [];

  const schedulingPolicyId = normalizeOptionalString(input.command.schedulingPolicyId);
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord = schedulingPolicyId
    ? await repository.getLatestRecord({ schedulingPolicyId, previewReviewFlowId })
    : null;

  if (!schedulingPolicyId) {
    errors.push("scheduling_policy_required");
  }
  if (input.command.runtimeTraceCandidate.traceId !== null) {
    errors.push("trace_id_must_remain_null");
  }
  if (!everySemanticFlagIsNoop(input.command.semantics)) {
    errors.push("runtime_observability_semantics_must_remain_noop");
  }
  if (!everyExecutionFlagIsFalse(input.command.executionFlags)) {
    errors.push("runtime_observability_execution_flags_must_remain_false");
  }
  if (
    input.command.auditEventCandidates.some(
      (candidate) => candidate.emitted !== false || candidate.emitterAllowed !== false,
    )
  ) {
    errors.push("audit_event_candidates_must_remain_unemitted");
  }
  if (
    input.command.metricCandidates.some(
      (candidate) =>
        candidate.metricEmitted !== false || candidate.metricStreamCreated !== false,
    )
  ) {
    errors.push("metric_candidates_must_remain_unemitted");
  }
  if (
    input.command.alertCandidates.some(
      (candidate) => candidate.alertEmitted !== false || candidate.alertCreated !== false,
    )
  ) {
    errors.push("alert_candidates_must_remain_unemitted");
  }
  if (
    input.command.runtimeTraceCandidate.executionStarted !== false ||
    input.command.runtimeTraceCandidate.executionCompleted !== false ||
    input.command.runtimeTraceCandidate.executionFailed !== false
  ) {
    errors.push("runtime_trace_candidate_must_remain_noop");
  }

  const normalizedCommand: VoxyRenderRuntimeObservabilityCommand = {
    ...input.command,
    runtimeObservabilityId: normalizeOptionalString(input.command.runtimeObservabilityId),
    schedulingPolicyId,
    uploadTargetPolicyId: normalizeOptionalString(input.command.uploadTargetPolicyId),
    mediaStorageTruthId: normalizeOptionalString(input.command.mediaStorageTruthId),
    approvalSemanticsId: normalizeOptionalString(input.command.approvalSemanticsId),
    socialDistributionHandoffId: normalizeOptionalString(input.command.socialDistributionHandoffId),
    publishReadinessGuardId: normalizeOptionalString(input.command.publishReadinessGuardId),
    previewOutcomeHandoffId: normalizeOptionalString(input.command.previewOutcomeHandoffId),
    previewReviewFlowId,
    enablementBacklogId: normalizeOptionalString(input.command.enablementBacklogId),
    matrixId: normalizeOptionalString(input.command.matrixId),
    requestDraftId: normalizeOptionalString(input.command.requestDraftId),
    scriptRef: normalizeRef(input.command.scriptRef),
    contributionRef: normalizeRef(input.command.contributionRef),
    dossierRef: normalizeRef(input.command.dossierRef),
    reviewerRef: normalizeRef(input.command.reviewerRef),
    createdAt: normalizeOptionalString(input.command.createdAt),
    updatedAt: normalizeOptionalString(input.command.updatedAt),
    topBlockers: Array.from(
      new Set(input.command.topBlockers.map((value) => normalizeText(value)).filter(Boolean)),
    ),
    userVisibleSummary: normalizeText(input.command.userVisibleSummary),
    reviewerVisibleSummary: normalizeText(input.command.reviewerVisibleSummary),
    auditEventCandidates: input.command.auditEventCandidates.map((candidate) => ({
      ...candidate,
      eventCandidateId: normalizeOptionalString(candidate.eventCandidateId),
      eventKey: normalizeText(candidate.eventKey),
      reviewerVisibleReason: normalizeText(candidate.reviewerVisibleReason),
      userVisibleReason: normalizeText(candidate.userVisibleReason),
      emitted: false,
      emitterAllowed: false,
    })),
    metricCandidates: input.command.metricCandidates.map((candidate) => ({
      ...candidate,
      metricCandidateId: normalizeOptionalString(candidate.metricCandidateId),
      metricKey: normalizeText(candidate.metricKey),
      reviewerVisibleReason: normalizeText(candidate.reviewerVisibleReason),
      userVisibleReason: normalizeText(candidate.userVisibleReason),
      metricStreamCreated: false,
      metricEmitted: false,
    })),
    alertCandidates: input.command.alertCandidates.map((candidate) => ({
      ...candidate,
      alertCandidateId: normalizeOptionalString(candidate.alertCandidateId),
      alertKey: normalizeText(candidate.alertKey),
      reviewerVisibleReason: normalizeText(candidate.reviewerVisibleReason),
      userVisibleReason: normalizeText(candidate.userVisibleReason),
      alertCreated: false,
      alertEmitted: false,
    })),
    runtimeTraceCandidate: {
      ...input.command.runtimeTraceCandidate,
      traceCandidateId: normalizeOptionalString(input.command.runtimeTraceCandidate.traceCandidateId),
      traceId: null,
      reviewerVisibleReason: normalizeText(input.command.runtimeTraceCandidate.reviewerVisibleReason),
      userVisibleReason: normalizeText(input.command.runtimeTraceCandidate.userVisibleReason),
      executionStarted: false,
      executionCompleted: false,
      executionFailed: false,
    },
    executionFlags: {
      ...input.command.executionFlags,
      auditEventEmissionAllowed: false,
      metricEmissionAllowed: false,
      alertEmissionAllowed: false,
      monitoringProviderCallAllowed: false,
      traceCreationAllowed: false,
      runtimeExecutionAllowed: false,
      schedulingAllowed: false,
      schedulerJobAllowed: false,
      calendarWriteAllowed: false,
      publishAllowed: false,
      uploadAllowed: false,
      storageWriteAllowed: false,
      socialPostAllowed: false,
      autoPublishAllowed: false,
      createsMediaFile: false,
      previewRendered: false,
      renderAllowed: false,
      rerenderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    semantics: {
      ...input.command.semantics,
      observabilityPlan: true,
      runtimeTraceAvailable: false,
      auditEventsEmitted: false,
      metricsEmitted: false,
      alertsEmitted: false,
      monitoringRuntimeEnabled: false,
      runtimeEnabled: false,
      renderExecuted: false,
      uploadExecuted: false,
      schedulingExecuted: false,
      publishExecuted: false,
      socialPostExecuted: false,
    },
  };

  if (errors.length > 0) {
    return {
      ok: false,
      status: "blocked",
      record: null,
      warnings,
      errors,
      idempotencyKey: null,
      nextStep: input.command.nextStep,
    } satisfies VoxyRenderRuntimeObservabilityStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizedCommand.reviewerRef?.id ?? null;
  const idempotencyKey = buildIdempotencyKey({
    schedulingPolicyId,
    previewReviewFlowId,
    runtimeObservabilityStatus: normalizedCommand.runtimeObservabilityStatus,
    reviewerRefId: persistedBy,
  });
  const record: VoxyRenderRuntimeObservabilityRecord = {
    ...normalizedCommand,
    runtimeObservabilityId:
      normalizedCommand.runtimeObservabilityId ??
      buildRecordId({
        schedulingPolicyId,
        previewReviewFlowId,
        runtimeObservabilityStatus: normalizedCommand.runtimeObservabilityStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey,
    previousRuntimeObservabilityRef: latestRecord?.runtimeObservabilityId ?? null,
    supersedesRuntimeObservabilityRef: null,
    runtimeObservabilityVersion: (latestRecord?.runtimeObservabilityVersion ?? 0) + 1,
  };
  const saved = await repository.saveRecord(record);
  return {
    ok: true,
    status: persistence.productionTruth ? "persisted" : "noop",
    record: saved,
    warnings,
    errors: [],
    idempotencyKey,
    nextStep: saved.nextStep,
  } satisfies VoxyRenderRuntimeObservabilityStoreResult;
}

export async function appendVoxyRenderRuntimeObservabilityAuditEvent(input: {
  record: VoxyRenderRuntimeObservabilityRecord;
  byUserId?: string | null;
  note?: string | null;
}) {
  const repository = resolveRepository();
  const at = nowIso();
  const event: VoxyRenderRuntimeObservabilityAuditEvent = {
    id: buildAuditId({
      runtimeObservabilityId: input.record.runtimeObservabilityId,
      schedulingPolicyId: input.record.schedulingPolicyId,
      at,
    }),
    runtimeObservabilityId: input.record.runtimeObservabilityId,
    schedulingPolicyId: input.record.schedulingPolicyId,
    uploadTargetPolicyId: input.record.uploadTargetPolicyId ?? null,
    previewReviewFlowId: input.record.previewReviewFlowId ?? null,
    action: "runtime_observability_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at,
    runtimeObservabilityStatus: input.record.runtimeObservabilityStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousRuntimeObservabilityRef: input.record.previousRuntimeObservabilityRef ?? null,
  };
  return repository.appendAuditEvent(event);
}
