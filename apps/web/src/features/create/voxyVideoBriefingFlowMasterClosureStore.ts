import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyVideoBriefingFlowMasterClosureCommand,
  VoxyVideoBriefingFlowMasterClosurePersistenceState,
  VoxyVideoBriefingFlowMasterClosureRecord,
  VoxyVideoBriefingFlowMasterClosureStoreResult,
} from "@/features/create/voxyVideoBriefingFlowMasterClosureContract";

export const VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_AUDIT_ACTIONS = [
  "master_closure_recorded",
] as const;

export type VoxyVideoBriefingFlowMasterClosureAuditAction =
  (typeof VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_AUDIT_ACTIONS)[number];

export type VoxyVideoBriefingFlowMasterClosureAuditEvent = {
  id: string;
  masterClosureId: string;
  runtimeCutoverGateId: string | null;
  previewReviewFlowId: string | null;
  scriptCandidateId: string | null;
  action: VoxyVideoBriefingFlowMasterClosureAuditAction;
  byUserId: string | null;
  at: string;
  masterStatus: VoxyVideoBriefingFlowMasterClosureRecord["masterStatus"];
  nextStep: VoxyVideoBriefingFlowMasterClosureRecord["nextStep"];
  summary: string;
  note: string | null;
  previousMasterClosureRef: string | null;
};

export type VoxyVideoBriefingFlowMasterClosureListParams = {
  masterClosureId?: string | null;
  runtimeCutoverGateId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyVideoBriefingFlowMasterClosureAuditListParams = {
  runtimeCutoverGateId?: string | null;
  previewReviewFlowId?: string | null;
  limit?: number;
};

export type VoxyVideoBriefingFlowMasterClosureRepository = {
  saveRecord(
    record: VoxyVideoBriefingFlowMasterClosureRecord,
  ): Promise<VoxyVideoBriefingFlowMasterClosureRecord>;
  getLatestRecord(
    params: Pick<
      VoxyVideoBriefingFlowMasterClosureListParams,
      "runtimeCutoverGateId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyVideoBriefingFlowMasterClosureRecord | null>;
  listRecords(
    params?: VoxyVideoBriefingFlowMasterClosureListParams,
  ): Promise<VoxyVideoBriefingFlowMasterClosureRecord[]>;
  appendAuditEvent(
    event: VoxyVideoBriefingFlowMasterClosureAuditEvent,
  ): Promise<VoxyVideoBriefingFlowMasterClosureAuditEvent>;
  listAuditEvents(
    params?: VoxyVideoBriefingFlowMasterClosureAuditListParams,
  ): Promise<VoxyVideoBriefingFlowMasterClosureAuditEvent[]>;
  getPersistenceState(): VoxyVideoBriefingFlowMasterClosurePersistenceState;
};

const RECORDS_COLLECTION = "voxy_video_briefing_flow_master_closure_records";
const AUDITS_COLLECTION = "voxy_video_briefing_flow_master_closure_audits";

let repositorySingleton: VoxyVideoBriefingFlowMasterClosureRepository | null = null;
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

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyVideoBriefingFlowMasterClosurePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Voxy-Master-Closure-Store"
      : "In-Memory-Fallback für Voxy Master Closure",
    summary: persistent
      ? "Master-Closure-Records bleiben streng audit-only. Es gibt keinen Runtime-Start, keinen Render, keinen Upload, kein Scheduling und keinen Publish."
      : "Nur Dev-/Test-Fallback: Master-Closure-Records leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyVideoBriefingFlowMasterClosureRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildRecordId(input: {
  runtimeCutoverGateId: string | null;
  previewReviewFlowId: string | null;
  masterStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-video-briefing-flow-master-closure:${stableHash(
    [
      input.runtimeCutoverGateId ?? "",
      input.previewReviewFlowId ?? "",
      input.masterStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  masterClosureId: string;
  runtimeCutoverGateId: string | null;
  at: string;
}) {
  return `voxy-video-briefing-flow-master-closure-audit:${stableHash(
    `${input.masterClosureId}:${input.runtimeCutoverGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  runtimeCutoverGateId: string | null;
  previewReviewFlowId: string | null;
  masterStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-video-briefing-flow-master-closure-idempotency:${stableHash(
    [
      input.runtimeCutoverGateId ?? "",
      input.previewReviewFlowId ?? "",
      input.masterStatus,
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
    recordsCol.createIndex({ runtimeCutoverGateId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ runtimeCutoverGateId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function matchesRecord(
  record: VoxyVideoBriefingFlowMasterClosureRecord,
  params: VoxyVideoBriefingFlowMasterClosureListParams,
) {
  if (params.masterClosureId && record.masterClosureId !== params.masterClosureId) return false;
  if (params.runtimeCutoverGateId && record.runtimeCutoverGateId !== params.runtimeCutoverGateId) {
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
  event: VoxyVideoBriefingFlowMasterClosureAuditEvent,
  params: VoxyVideoBriefingFlowMasterClosureAuditListParams,
) {
  if (params.runtimeCutoverGateId && event.runtimeCutoverGateId !== params.runtimeCutoverGateId) {
    return false;
  }
  if (params.previewReviewFlowId && event.previewReviewFlowId !== params.previewReviewFlowId) {
    return false;
  }
  return true;
}

export function createInMemoryVoxyVideoBriefingFlowMasterClosureRepository(): VoxyVideoBriefingFlowMasterClosureRepository {
  const records: VoxyVideoBriefingFlowMasterClosureRecord[] = [];
  const audits: VoxyVideoBriefingFlowMasterClosureAuditEvent[] = [];
  return {
    async saveRecord(record) {
      records.unshift(clone(record));
      return clone(record);
    },
    async getLatestRecord(params) {
      const normalized = {
        runtimeCutoverGateId: normalizeOptionalString(params.runtimeCutoverGateId),
        previewReviewFlowId: normalizeOptionalString(params.previewReviewFlowId),
      };
      return (
        records.find((record) =>
          matchesRecord(record, {
            runtimeCutoverGateId: normalized.runtimeCutoverGateId,
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
            masterClosureId: normalizeOptionalString(params.masterClosureId),
            runtimeCutoverGateId: normalizeOptionalString(params.runtimeCutoverGateId),
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
            runtimeCutoverGateId: normalizeOptionalString(params.runtimeCutoverGateId),
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

function createMongoRepository(): VoxyVideoBriefingFlowMasterClosureRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.masterClosureId },
        {
          $set: {
            _id: record.masterClosureId,
            record: clone(record),
            runtimeCutoverGateId: record.runtimeCutoverGateId,
            previewReviewFlowId: record.previewReviewFlowId ?? null,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            masterStatus: record.masterStatus,
            nextStep: record.nextStep,
            masterClosureVersion: record.masterClosureVersion,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(params) {
      const [record] = await this.listRecords({
        runtimeCutoverGateId: params.runtimeCutoverGateId,
        previewReviewFlowId: params.previewReviewFlowId,
        limit: 1,
      });
      return record ?? null;
    },
    async listRecords(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const masterClosureId = normalizeOptionalString(params.masterClosureId);
      const runtimeCutoverGateId = normalizeOptionalString(params.runtimeCutoverGateId);
      const previewReviewFlowId = normalizeOptionalString(params.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params.contributionRefId);
      const dossierRefId = normalizeOptionalString(params.dossierRefId);
      if (masterClosureId) filter._id = masterClosureId;
      if (runtimeCutoverGateId) filter.runtimeCutoverGateId = runtimeCutoverGateId;
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      const rows = await col.find(filter).sort({ persistedAt: -1 }).limit(limit).toArray();
      return rows.map((row) => clone(row.record) as VoxyVideoBriefingFlowMasterClosureRecord);
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
      const runtimeCutoverGateId = normalizeOptionalString(params.runtimeCutoverGateId);
      const previewReviewFlowId = normalizeOptionalString(params.previewReviewFlowId);
      if (runtimeCutoverGateId) filter.runtimeCutoverGateId = runtimeCutoverGateId;
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 20));
      const rows = await col.find(filter).sort({ at: -1 }).limit(limit).toArray();
      return rows.map((row) => {
        const { _id: _ignored, ...event } = row;
        return clone(event) as VoxyVideoBriefingFlowMasterClosureAuditEvent;
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
    ? createInMemoryVoxyVideoBriefingFlowMasterClosureRepository()
    : createMongoRepository();
  return repositorySingleton;
}

export function setVoxyVideoBriefingFlowMasterClosureRepositoryForTests(
  repository: VoxyVideoBriefingFlowMasterClosureRepository | null,
) {
  repositorySingleton = repository;
}

export function getVoxyVideoBriefingFlowMasterClosurePersistenceState() {
  return resolveRepository().getPersistenceState();
}

export async function listVoxyVideoBriefingFlowMasterClosureRecords(
  params: VoxyVideoBriefingFlowMasterClosureListParams = {},
) {
  return resolveRepository().listRecords(params);
}

export async function getLatestVoxyVideoBriefingFlowMasterClosureRecord(
  params: Pick<
    VoxyVideoBriefingFlowMasterClosureListParams,
    "runtimeCutoverGateId" | "previewReviewFlowId"
  >,
) {
  return resolveRepository().getLatestRecord(params);
}

export async function listLatestVoxyVideoBriefingFlowMasterClosuresByRuntimeCutoverGateIds(
  runtimeCutoverGateIds: string[],
) {
  const normalized = Array.from(
    new Set(runtimeCutoverGateIds.map((value) => normalizeText(value)).filter(Boolean)),
  );
  if (normalized.length === 0) {
    return new Map<string, VoxyVideoBriefingFlowMasterClosureRecord>();
  }
  const records = await resolveRepository().listRecords({
    limit: Math.max(20, normalized.length * 3),
  });
  const latest = new Map<string, VoxyVideoBriefingFlowMasterClosureRecord>();
  for (const record of records) {
    if (!record.runtimeCutoverGateId || latest.has(record.runtimeCutoverGateId)) continue;
    if (!normalized.includes(record.runtimeCutoverGateId)) continue;
    latest.set(record.runtimeCutoverGateId, record);
  }
  return latest;
}

export async function listVoxyVideoBriefingFlowMasterClosureAuditEvents(
  params: VoxyVideoBriefingFlowMasterClosureAuditListParams = {},
) {
  return resolveRepository().listAuditEvents(params);
}

function everyExecutionFlagIsFalse(
  flags: VoxyVideoBriefingFlowMasterClosureCommand["executionFlags"],
) {
  return Object.values(flags).every((value) => value === false);
}

function semanticsRemainNoop(
  semantics: VoxyVideoBriefingFlowMasterClosureCommand["semantics"],
) {
  return (
    semantics.runtimePending === true &&
    semantics.runtimeEnabled === false &&
    semantics.previewRendered === false &&
    semantics.mediaFileAvailable === false &&
    semantics.uploaded === false &&
    semantics.scheduled === false &&
    semantics.socialPosted === false &&
    semantics.published === false &&
    semantics.autoPublishAllowed === false
  );
}

export async function persistVoxyVideoBriefingFlowMasterClosure(input: {
  command: VoxyVideoBriefingFlowMasterClosureCommand;
}) {
  const repository = resolveRepository();
  const persistence = repository.getPersistenceState();
  const warnings = [
    "master_closure_is_review_only",
    "runtime_remains_disabled",
    "no_render_upload_schedule_publish_execution",
  ];
  const errors: string[] = [];

  const runtimeCutoverGateId = normalizeOptionalString(input.command.runtimeCutoverGateId);
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord =
    runtimeCutoverGateId || previewReviewFlowId
      ? await repository.getLatestRecord({ runtimeCutoverGateId, previewReviewFlowId })
      : null;

  if (!semanticsRemainNoop(input.command.semantics)) {
    errors.push("master_closure_semantics_must_remain_noop");
  }
  if (!everyExecutionFlagIsFalse(input.command.executionFlags)) {
    errors.push("master_closure_execution_flags_must_remain_false");
  }
  if (
    input.command.readinessAreas.some(
      (area) => area.runtimeEnabled !== false || area.executionAllowed !== false,
    )
  ) {
    errors.push("master_closure_areas_must_remain_non_executable");
  }
  if (input.command.originalPreserved !== true) {
    errors.push("master_closure_must_preserve_original_language");
  }
  if (input.command.translationIsEvidence !== false) {
    errors.push("master_closure_translation_must_not_be_evidence");
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
    } satisfies VoxyVideoBriefingFlowMasterClosureStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizeOptionalString(input.command.reviewerRef?.id);
  const record: VoxyVideoBriefingFlowMasterClosureRecord = {
    ...clone(input.command),
    masterClosureId:
      normalizeOptionalString(input.command.masterClosureId) ??
      buildRecordId({
        runtimeCutoverGateId,
        previewReviewFlowId,
        masterStatus: input.command.masterStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey: buildIdempotencyKey({
      runtimeCutoverGateId,
      previewReviewFlowId,
      masterStatus: input.command.masterStatus,
      reviewerRefId: persistedBy,
    }),
    previousMasterClosureRef: latestRecord?.masterClosureId ?? null,
    supersedesMasterClosureRef: latestRecord?.masterClosureId ?? null,
    masterClosureVersion: (latestRecord?.masterClosureVersion ?? 0) + 1,
  };

  const saved = await repository.saveRecord(record);
  return {
    ok: true,
    status: persistence.mode === "persistent_primary" ? "persisted" : "noop",
    record: saved,
    warnings,
    errors: [],
    idempotencyKey: saved.idempotencyKey,
    nextStep: saved.nextStep,
  } satisfies VoxyVideoBriefingFlowMasterClosureStoreResult;
}

export async function appendVoxyVideoBriefingFlowMasterClosureAuditEvent(input: {
  record: VoxyVideoBriefingFlowMasterClosureRecord;
  note?: string | null;
}) {
  const repository = resolveRepository();
  const at = nowIso();
  const event: VoxyVideoBriefingFlowMasterClosureAuditEvent = {
    id: buildAuditId({
      masterClosureId: input.record.masterClosureId,
      runtimeCutoverGateId: input.record.runtimeCutoverGateId,
      at,
    }),
    masterClosureId: input.record.masterClosureId,
    runtimeCutoverGateId: input.record.runtimeCutoverGateId,
    previewReviewFlowId: input.record.previewReviewFlowId,
    scriptCandidateId: input.record.scriptCandidateId,
    action: "master_closure_recorded",
    byUserId: input.record.persistedBy,
    at,
    masterStatus: input.record.masterStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousMasterClosureRef: input.record.previousMasterClosureRef,
  };
  return repository.appendAuditEvent(event);
}
