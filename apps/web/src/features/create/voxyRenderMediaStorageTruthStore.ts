import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderMediaStorageExecutionFlags,
  VoxyRenderMediaStoragePersistenceState,
  VoxyRenderMediaStorageTruthCommand,
  VoxyRenderMediaStorageTruthRecord,
  VoxyRenderMediaStorageStoreResult,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  buildVoxyRenderMediaStorageExecutionFlags,
  deriveVoxyRenderMediaStorageTruthStatus,
} from "@/features/create/voxyRenderMediaStorageTruthContract";

export const VOXY_RENDER_MEDIA_STORAGE_AUDIT_ACTIONS = [
  "media_storage_truth_recorded",
] as const;

export type VoxyRenderMediaStorageAuditAction =
  (typeof VOXY_RENDER_MEDIA_STORAGE_AUDIT_ACTIONS)[number];

export type VoxyRenderMediaStorageAuditEvent = {
  id: string;
  mediaStorageTruthId: string;
  approvalSemanticsId: string | null;
  previewReviewFlowId: string | null;
  action: VoxyRenderMediaStorageAuditAction;
  byUserId: string | null;
  at: string;
  mediaStorageTruthStatus: VoxyRenderMediaStorageTruthRecord["mediaStorageTruthStatus"];
  nextStep: VoxyRenderMediaStorageTruthRecord["nextStep"];
  summary: string;
  note: string | null;
  previousMediaStorageTruthRef: string | null;
};

export type VoxyRenderMediaStorageTruthListParams = {
  approvalSemanticsId?: string | null;
  approvalSemanticsIds?: string[];
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderMediaStorageAuditListParams = {
  mediaStorageTruthId?: string | null;
  approvalSemanticsId?: string | null;
  previewReviewFlowId?: string | null;
  limit?: number;
};

export type VoxyRenderMediaStorageTruthRepository = {
  saveRecord(
    record: VoxyRenderMediaStorageTruthRecord,
  ): Promise<VoxyRenderMediaStorageTruthRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderMediaStorageTruthListParams,
      "approvalSemanticsId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderMediaStorageTruthRecord | null>;
  listRecords(
    params?: VoxyRenderMediaStorageTruthListParams,
  ): Promise<VoxyRenderMediaStorageTruthRecord[]>;
  appendAuditEvent(
    event: VoxyRenderMediaStorageAuditEvent,
  ): Promise<VoxyRenderMediaStorageAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderMediaStorageAuditListParams,
  ): Promise<VoxyRenderMediaStorageAuditEvent[]>;
  getPersistenceState(): VoxyRenderMediaStoragePersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_media_storage_truth_records";
const AUDIT_COLLECTION = "voxy_render_media_storage_truth_audits";

let repoSingleton: VoxyRenderMediaStorageTruthRepository | null = null;
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

function normalizeIds(values: string[] | undefined): string[] {
  return Array.from(
    new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []),
  );
}

function normalizeRef(
  ref: VoxyRenderMediaStorageTruthCommand["scriptRef"],
): VoxyRenderMediaStorageTruthCommand["scriptRef"] {
  if (!ref) return null;
  const id = normalizeOptionalString(ref.id);
  const title = normalizeOptionalString(ref.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    href: normalizeOptionalString(ref.href),
  };
}

function forceFalseExecutionFlags(
  value: VoxyRenderMediaStorageExecutionFlags,
): VoxyRenderMediaStorageExecutionFlags {
  return {
    ...buildVoxyRenderMediaStorageExecutionFlags(),
    ...value,
    createsMediaFile: false,
    createsThumbnail: false,
    createsSubtitleFile: false,
    createsSourceCaptionFile: false,
    storageWriteAllowed: false,
    uploadAllowed: false,
    publishAllowed: false,
    schedulingAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
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
  };
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderMediaStoragePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Media-/Storage-Truth-Store"
      : "In-Memory-Fallback für Media-/Storage-Truth-Store",
    summary: persistent
      ? "Media-/Storage-Truth und Audit-Spuren werden getrennt von Storage-Write, Upload und Veröffentlichung gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Media-/Storage-Truth lebt pro Prozess und ist keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderMediaStorageTruthRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  approvalSemanticsId: string | null;
  previewReviewFlowId: string | null;
  mediaStorageTruthStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-media-storage-truth-idempotency:${stableHash(
    [
      input.approvalSemanticsId ?? "",
      input.previewReviewFlowId ?? "",
      input.mediaStorageTruthStatus,
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildRecordId(input: {
  approvalSemanticsId: string | null;
  previewReviewFlowId: string | null;
  mediaStorageTruthStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-media-storage-truth:${stableHash(
    [
      input.approvalSemanticsId ?? "",
      input.previewReviewFlowId ?? "",
      input.mediaStorageTruthStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  mediaStorageTruthId: string;
  approvalSemanticsId: string | null;
  at: string;
}) {
  return `voxy-render-media-storage-truth-audit:${stableHash(
    `${input.mediaStorageTruthId}:${input.approvalSemanticsId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ approvalSemanticsId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ mediaStorageTruthId: 1, at: -1 }),
    auditsCol.createIndex({ approvalSemanticsId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]);
  indexesReady = true;
}

function recordMatches(
  record: VoxyRenderMediaStorageTruthRecord,
  params: VoxyRenderMediaStorageTruthListParams,
) {
  if (params.approvalSemanticsId && record.approvalSemanticsId !== params.approvalSemanticsId) {
    return false;
  }
  if (
    params.approvalSemanticsIds?.length &&
    !params.approvalSemanticsIds.includes(record.approvalSemanticsId ?? "")
  ) {
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

function auditMatches(
  event: VoxyRenderMediaStorageAuditEvent,
  params: VoxyRenderMediaStorageAuditListParams,
) {
  if (params.mediaStorageTruthId && event.mediaStorageTruthId !== params.mediaStorageTruthId) {
    return false;
  }
  if (params.approvalSemanticsId && event.approvalSemanticsId !== params.approvalSemanticsId) {
    return false;
  }
  if (params.previewReviewFlowId && event.previewReviewFlowId !== params.previewReviewFlowId) {
    return false;
  }
  return true;
}

export function createInMemoryVoxyRenderMediaStorageTruthRepository(seed?: {
  records?: VoxyRenderMediaStorageTruthRecord[];
  auditEvents?: VoxyRenderMediaStorageAuditEvent[];
}): VoxyRenderMediaStorageTruthRepository {
  const records = [...(seed?.records ?? [])].map(clone);
  const auditEvents = [...(seed?.auditEvents ?? [])].map(clone);

  return {
    async saveRecord(record) {
      const next = clone(record);
      const index = records.findIndex((entry) => entry.mediaStorageTruthId === next.mediaStorageTruthId);
      if (index >= 0) records[index] = next;
      else records.unshift(next);
      return clone(next);
    },
    async getLatestRecord(params) {
      const match = records
        .filter((record) =>
          recordMatches(record, {
            approvalSemanticsId: params.approvalSemanticsId ?? null,
            previewReviewFlowId: params.previewReviewFlowId ?? null,
          }),
        )
        .sort((left, right) => right.persistedAt.localeCompare(left.persistedAt))[0];
      return match ? clone(match) : null;
    },
    async listRecords(params = {}) {
      const limit = Math.max(1, Math.min(50, params.limit ?? 10));
      return records
        .filter((record) => recordMatches(record, params))
        .sort((left, right) => right.persistedAt.localeCompare(left.persistedAt))
        .slice(0, limit)
        .map(clone);
    },
    async appendAuditEvent(event) {
      const next = clone(event);
      auditEvents.unshift(next);
      return clone(next);
    },
    async listAuditEvents(params = {}) {
      const limit = Math.max(1, Math.min(50, params.limit ?? 10));
      return auditEvents
        .filter((event) => auditMatches(event, params))
        .sort((left, right) => right.at.localeCompare(left.at))
        .slice(0, limit)
        .map(clone);
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function createMongoRepository(): VoxyRenderMediaStorageTruthRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { mediaStorageTruthId: record.mediaStorageTruthId },
        { $set: record },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(params) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params.approvalSemanticsId) filter.approvalSemanticsId = params.approvalSemanticsId;
      if (params.previewReviewFlowId) filter.previewReviewFlowId = params.previewReviewFlowId;
      const doc = await col.find(filter).sort({ persistedAt: -1 }).limit(1).next();
      return doc ? clone(doc as VoxyRenderMediaStorageTruthRecord) : null;
    },
    async listRecords(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params.approvalSemanticsId) filter.approvalSemanticsId = params.approvalSemanticsId;
      if (params.approvalSemanticsIds?.length) {
        filter.approvalSemanticsId = { $in: normalizeIds(params.approvalSemanticsIds) };
      }
      if (params.previewReviewFlowId) filter.previewReviewFlowId = params.previewReviewFlowId;
      if (params.contributionRefId) filter.contributionRefId = params.contributionRefId;
      if (params.dossierRefId) filter.dossierRefId = params.dossierRefId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 10));
      return (await col.find(filter).sort({ persistedAt: -1 }).limit(limit).toArray()).map(
        (doc: any) => clone(doc as VoxyRenderMediaStorageTruthRecord),
      );
    },
    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      await col.updateOne({ id: event.id }, { $set: event }, { upsert: true });
      return clone(event);
    },
    async listAuditEvents(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params.mediaStorageTruthId) filter.mediaStorageTruthId = params.mediaStorageTruthId;
      if (params.approvalSemanticsId) filter.approvalSemanticsId = params.approvalSemanticsId;
      if (params.previewReviewFlowId) filter.previewReviewFlowId = params.previewReviewFlowId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 10));
      return (await col.find(filter).sort({ at: -1 }).limit(limit).toArray()).map((doc: any) =>
        clone(doc as VoxyRenderMediaStorageAuditEvent),
      );
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

function getRepository() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderMediaStorageTruthRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderMediaStorageTruthRepositoryForTests(
  repo: VoxyRenderMediaStorageTruthRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderMediaStoragePersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderMediaStorageTruthRecords(
  params?: VoxyRenderMediaStorageTruthListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderMediaStorageTruthRecord(
  params: Pick<
    VoxyRenderMediaStorageTruthListParams,
    "approvalSemanticsId" | "previewReviewFlowId"
  >,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderMediaStorageTruthByApprovalSemanticsIds(
  approvalSemanticsIds: string[],
) {
  const uniqueIds = normalizeIds(approvalSemanticsIds);
  if (uniqueIds.length === 0) return new Map<string, VoxyRenderMediaStorageTruthRecord>();
  const records = await getRepository().listRecords({
    approvalSemanticsIds: uniqueIds,
    limit: Math.max(10, uniqueIds.length * 3),
  });
  const map = new Map<string, VoxyRenderMediaStorageTruthRecord>();
  for (const record of records) {
    const key = record.approvalSemanticsId ?? "";
    if (!key || map.has(key)) continue;
    map.set(key, record);
  }
  return map;
}

export async function listVoxyRenderMediaStorageAuditEvents(
  params?: VoxyRenderMediaStorageAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderMediaStorageTruth(input: {
  command: VoxyRenderMediaStorageTruthCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const approvalSemanticsId = normalizeOptionalString(input.command.approvalSemanticsId);
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord =
    approvalSemanticsId || previewReviewFlowId
      ? await repo.getLatestRecord({
          approvalSemanticsId,
          previewReviewFlowId,
        })
      : null;

  const mediaStorageTruthStatus = deriveVoxyRenderMediaStorageTruthStatus({
    approvalSemanticsId,
    approvalStatusHint: input.command.approvalStatusHint ?? null,
    previewReviewFlowStatusHint: input.command.previewReviewFlowStatusHint ?? null,
    mediaCandidateStatus: input.command.mediaCandidate.status,
    storageTargetStatus: input.command.storageTarget.status,
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!approvalSemanticsId) {
    errors.push("approval_semantics_required");
  }
  if (input.command.mediaCandidate.publicUrl) {
    errors.push("public_url_must_remain_empty");
  }
  if (input.command.mediaCandidate.signedUrl) {
    errors.push("signed_url_must_remain_empty");
  }
  if (input.command.mediaCandidate.storagePath) {
    errors.push("storage_path_must_remain_empty");
  }
  if (input.command.mediaCandidate.generated !== false) {
    errors.push("generated_must_remain_false");
  }
  if (input.command.mediaCandidate.rendered !== false) {
    errors.push("rendered_must_remain_false");
  }
  if (input.command.mediaCandidate.uploaded !== false) {
    errors.push("uploaded_must_remain_false");
  }
  if (input.command.mediaCandidate.playable !== false) {
    errors.push("playable_must_remain_false");
  }
  if (input.command.mediaCandidate.downloadable !== false) {
    errors.push("downloadable_must_remain_false");
  }
  if (input.command.storageTarget.writeAllowed !== false) {
    errors.push("storage_write_must_remain_false");
  }
  if (input.command.storageTarget.readAllowed !== false) {
    errors.push("storage_read_must_remain_false");
  }
  if (input.command.storageTarget.publicAccessAllowed !== false) {
    errors.push("public_access_must_remain_false");
  }
  if (input.command.storageTarget.signedAccessAllowed !== false) {
    errors.push("signed_access_must_remain_false");
  }
  if (input.command.mediaSemantics.mediaFileAvailable !== false) {
    errors.push("media_file_available_must_remain_false");
  }
  if (input.command.mediaSemantics.previewFileAvailable !== false) {
    errors.push("preview_file_available_must_remain_false");
  }
  if (input.command.executionFlags.storageWriteAllowed !== false) {
    errors.push("storage_write_allowed_must_remain_false");
  }
  if (input.command.executionFlags.uploadAllowed !== false) {
    errors.push("upload_allowed_must_remain_false");
  }
  warnings.push("media_candidate_is_not_media_file");
  warnings.push("storage_target_is_not_storage_write");
  warnings.push("preview_file_available_remains_false");
  warnings.push("no_storage_write_upload_or_publish_happens");

  const normalizedCommand: VoxyRenderMediaStorageTruthCommand = {
    ...input.command,
    mediaStorageTruthId: input.command.mediaStorageTruthId ?? null,
    approvalSemanticsId,
    socialDistributionHandoffId: normalizeOptionalString(input.command.socialDistributionHandoffId),
    publishReadinessGuardId: normalizeOptionalString(input.command.publishReadinessGuardId),
    previewOutcomeHandoffId: normalizeOptionalString(input.command.previewOutcomeHandoffId),
    previewReviewDecisionRecordId: normalizeOptionalString(
      input.command.previewReviewDecisionRecordId,
    ),
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
    mediaStorageTruthStatus,
    executionFlags: forceFalseExecutionFlags(input.command.executionFlags),
    topBlockers: Array.from(
      new Set((input.command.topBlockers ?? []).map(normalizeText).filter(Boolean)),
    ),
    userVisibleSummary: normalizeText(input.command.userVisibleSummary),
    reviewerVisibleSummary: normalizeText(input.command.reviewerVisibleSummary),
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
    } satisfies VoxyRenderMediaStorageStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizedCommand.reviewerRef?.id ?? null;
  const idempotencyKey = buildIdempotencyKey({
    approvalSemanticsId,
    previewReviewFlowId,
    mediaStorageTruthStatus,
    reviewerRefId: persistedBy,
  });

  const record: VoxyRenderMediaStorageTruthRecord = {
    ...normalizedCommand,
    mediaStorageTruthId:
      normalizedCommand.mediaStorageTruthId ??
      buildRecordId({
        approvalSemanticsId,
        previewReviewFlowId,
        mediaStorageTruthStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey,
    previousMediaStorageTruthRef: latestRecord?.mediaStorageTruthId ?? null,
    supersedesMediaStorageTruthRef: null,
    mediaStorageTruthVersion: (latestRecord?.mediaStorageTruthVersion ?? 0) + 1,
  };

  const saved = await repo.saveRecord({
    ...record,
    contributionRef: record.contributionRef,
    dossierRef: record.dossierRef,
  });
  return {
    ok: true,
    status: persistence.productionTruth ? "persisted" : "noop",
    record: saved,
    warnings,
    errors: [],
    idempotencyKey,
    nextStep: saved.nextStep,
  } satisfies VoxyRenderMediaStorageStoreResult;
}

export async function appendVoxyRenderMediaStorageAuditEvent(input: {
  record: VoxyRenderMediaStorageTruthRecord;
  byUserId?: string | null;
  note?: string | null;
}) {
  const repo = getRepository();
  const at = nowIso();
  const event: VoxyRenderMediaStorageAuditEvent = {
    id: buildAuditId({
      mediaStorageTruthId: input.record.mediaStorageTruthId,
      approvalSemanticsId: input.record.approvalSemanticsId ?? null,
      at,
    }),
    mediaStorageTruthId: input.record.mediaStorageTruthId,
    approvalSemanticsId: input.record.approvalSemanticsId ?? null,
    previewReviewFlowId: input.record.previewReviewFlowId ?? null,
    action: "media_storage_truth_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at,
    mediaStorageTruthStatus: input.record.mediaStorageTruthStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousMediaStorageTruthRef: input.record.previousMediaStorageTruthRef ?? null,
  };
  return repo.appendAuditEvent(event);
}
