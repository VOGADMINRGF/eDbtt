import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderUploadExecutionFlags,
  VoxyRenderUploadTargetPolicyCommand,
  VoxyRenderUploadTargetPolicyPersistenceState,
  VoxyRenderUploadTargetPolicyRecord,
  VoxyRenderUploadTargetPolicyStoreResult,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";
import {
  buildVoxyRenderUploadExecutionFlags,
  deriveVoxyRenderUploadTargetPolicyStatus,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";

export const VOXY_RENDER_UPLOAD_TARGET_POLICY_AUDIT_ACTIONS = [
  "upload_target_policy_recorded",
] as const;

export type VoxyRenderUploadTargetPolicyAuditAction =
  (typeof VOXY_RENDER_UPLOAD_TARGET_POLICY_AUDIT_ACTIONS)[number];

export type VoxyRenderUploadTargetPolicyAuditEvent = {
  id: string;
  uploadTargetPolicyId: string;
  mediaStorageTruthId: string;
  previewReviewFlowId: string | null;
  action: VoxyRenderUploadTargetPolicyAuditAction;
  byUserId: string | null;
  at: string;
  uploadTargetPolicyStatus: VoxyRenderUploadTargetPolicyRecord["uploadTargetPolicyStatus"];
  nextStep: VoxyRenderUploadTargetPolicyRecord["nextStep"];
  summary: string;
  note: string | null;
  previousUploadTargetPolicyRef: string | null;
};

export type VoxyRenderUploadTargetPolicyListParams = {
  mediaStorageTruthId?: string | null;
  mediaStorageTruthIds?: string[];
  approvalSemanticsId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderUploadTargetPolicyAuditListParams = {
  uploadTargetPolicyId?: string | null;
  mediaStorageTruthId?: string | null;
  previewReviewFlowId?: string | null;
  limit?: number;
};

export type VoxyRenderUploadTargetPolicyRepository = {
  saveRecord(
    record: VoxyRenderUploadTargetPolicyRecord,
  ): Promise<VoxyRenderUploadTargetPolicyRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderUploadTargetPolicyListParams,
      "mediaStorageTruthId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderUploadTargetPolicyRecord | null>;
  listRecords(
    params?: VoxyRenderUploadTargetPolicyListParams,
  ): Promise<VoxyRenderUploadTargetPolicyRecord[]>;
  appendAuditEvent(
    event: VoxyRenderUploadTargetPolicyAuditEvent,
  ): Promise<VoxyRenderUploadTargetPolicyAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderUploadTargetPolicyAuditListParams,
  ): Promise<VoxyRenderUploadTargetPolicyAuditEvent[]>;
  getPersistenceState(): VoxyRenderUploadTargetPolicyPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_upload_target_policy_records";
const AUDIT_COLLECTION = "voxy_render_upload_target_policy_audits";

let repoSingleton: VoxyRenderUploadTargetPolicyRepository | null = null;
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
  ref: VoxyRenderUploadTargetPolicyCommand["scriptRef"],
): VoxyRenderUploadTargetPolicyCommand["scriptRef"] {
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
  value: VoxyRenderUploadExecutionFlags,
): VoxyRenderUploadExecutionFlags {
  return {
    ...buildVoxyRenderUploadExecutionFlags(),
    ...value,
    uploadAllowed: false,
    storageWriteAllowed: false,
    signedUrlCreationAllowed: false,
    publicUrlCreationAllowed: false,
    deletionJobAllowed: false,
    publishAllowed: false,
    schedulingAllowed: false,
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
  };
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderUploadTargetPolicyPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Upload-Target-Policy-Store"
      : "In-Memory-Fallback für Upload-Target-Policy-Store",
    summary: persistent
      ? "Upload-Target-Policy und Audit-Spuren werden getrennt von Upload, Storage-Write, URL-Erzeugung und Veröffentlichung gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Upload-Target-Policy lebt pro Prozess und ist keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderUploadTargetPolicyRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  mediaStorageTruthId: string | null;
  previewReviewFlowId: string | null;
  uploadTargetPolicyStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-upload-target-policy-idempotency:${stableHash(
    [
      input.mediaStorageTruthId ?? "",
      input.previewReviewFlowId ?? "",
      input.uploadTargetPolicyStatus,
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildRecordId(input: {
  mediaStorageTruthId: string | null;
  previewReviewFlowId: string | null;
  uploadTargetPolicyStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-upload-target-policy:${stableHash(
    [
      input.mediaStorageTruthId ?? "",
      input.previewReviewFlowId ?? "",
      input.uploadTargetPolicyStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  uploadTargetPolicyId: string;
  mediaStorageTruthId: string;
  at: string;
}) {
  return `voxy-render-upload-target-policy-audit:${stableHash(
    `${input.uploadTargetPolicyId}:${input.mediaStorageTruthId}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ mediaStorageTruthId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ approvalSemanticsId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ uploadTargetPolicyId: 1, at: -1 }),
    auditsCol.createIndex({ mediaStorageTruthId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]);
  indexesReady = true;
}

function recordMatches(
  record: VoxyRenderUploadTargetPolicyRecord,
  params: VoxyRenderUploadTargetPolicyListParams,
) {
  if (params.mediaStorageTruthId && record.mediaStorageTruthId !== params.mediaStorageTruthId) {
    return false;
  }
  if (
    params.mediaStorageTruthIds?.length &&
    !params.mediaStorageTruthIds.includes(record.mediaStorageTruthId ?? "")
  ) {
    return false;
  }
  if (params.approvalSemanticsId && record.approvalSemanticsId !== params.approvalSemanticsId) {
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
  event: VoxyRenderUploadTargetPolicyAuditEvent,
  params: VoxyRenderUploadTargetPolicyAuditListParams,
) {
  if (params.uploadTargetPolicyId && event.uploadTargetPolicyId !== params.uploadTargetPolicyId) {
    return false;
  }
  if (params.mediaStorageTruthId && event.mediaStorageTruthId !== params.mediaStorageTruthId) {
    return false;
  }
  if (params.previewReviewFlowId && event.previewReviewFlowId !== params.previewReviewFlowId) {
    return false;
  }
  return true;
}

export function createInMemoryVoxyRenderUploadTargetPolicyRepository(seed?: {
  records?: VoxyRenderUploadTargetPolicyRecord[];
  auditEvents?: VoxyRenderUploadTargetPolicyAuditEvent[];
}): VoxyRenderUploadTargetPolicyRepository {
  const records = [...(seed?.records ?? [])].map(clone);
  const auditEvents = [...(seed?.auditEvents ?? [])].map(clone);

  return {
    async saveRecord(record) {
      const next = clone(record);
      const index = records.findIndex((entry) => entry.uploadTargetPolicyId === next.uploadTargetPolicyId);
      if (index >= 0) records[index] = next;
      else records.unshift(next);
      return clone(next);
    },
    async getLatestRecord(params) {
      const match = records
        .filter((record) =>
          recordMatches(record, {
            mediaStorageTruthId: params.mediaStorageTruthId ?? null,
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

function createMongoRepository(): VoxyRenderUploadTargetPolicyRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { uploadTargetPolicyId: record.uploadTargetPolicyId },
        { $set: record },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(params) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params.mediaStorageTruthId) filter.mediaStorageTruthId = params.mediaStorageTruthId;
      if (params.previewReviewFlowId) filter.previewReviewFlowId = params.previewReviewFlowId;
      const doc = await col.find(filter).sort({ persistedAt: -1 }).limit(1).next();
      return doc ? clone(doc as VoxyRenderUploadTargetPolicyRecord) : null;
    },
    async listRecords(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params.mediaStorageTruthId) filter.mediaStorageTruthId = params.mediaStorageTruthId;
      if (params.mediaStorageTruthIds?.length) {
        filter.mediaStorageTruthId = { $in: normalizeIds(params.mediaStorageTruthIds) };
      }
      if (params.approvalSemanticsId) filter.approvalSemanticsId = params.approvalSemanticsId;
      if (params.previewReviewFlowId) filter.previewReviewFlowId = params.previewReviewFlowId;
      if (params.contributionRefId) filter.contributionRefId = params.contributionRefId;
      if (params.dossierRefId) filter.dossierRefId = params.dossierRefId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 10));
      return (await col.find(filter).sort({ persistedAt: -1 }).limit(limit).toArray()).map(
        (doc: any) => clone(doc as VoxyRenderUploadTargetPolicyRecord),
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
      if (params.uploadTargetPolicyId) filter.uploadTargetPolicyId = params.uploadTargetPolicyId;
      if (params.mediaStorageTruthId) filter.mediaStorageTruthId = params.mediaStorageTruthId;
      if (params.previewReviewFlowId) filter.previewReviewFlowId = params.previewReviewFlowId;
      const limit = Math.max(1, Math.min(50, params.limit ?? 10));
      return (await col.find(filter).sort({ at: -1 }).limit(limit).toArray()).map((doc: any) =>
        clone(doc as VoxyRenderUploadTargetPolicyAuditEvent),
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
    ? createInMemoryVoxyRenderUploadTargetPolicyRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderUploadTargetPolicyRepositoryForTests(
  repo: VoxyRenderUploadTargetPolicyRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderUploadTargetPolicyPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderUploadTargetPolicyRecords(
  params?: VoxyRenderUploadTargetPolicyListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderUploadTargetPolicyRecord(
  params: Pick<
    VoxyRenderUploadTargetPolicyListParams,
    "mediaStorageTruthId" | "previewReviewFlowId"
  >,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderUploadTargetPoliciesByMediaStorageTruthIds(
  mediaStorageTruthIds: string[],
) {
  const uniqueIds = normalizeIds(mediaStorageTruthIds);
  if (uniqueIds.length === 0) return new Map<string, VoxyRenderUploadTargetPolicyRecord>();
  const records = await getRepository().listRecords({
    mediaStorageTruthIds: uniqueIds,
    limit: Math.max(10, uniqueIds.length * 3),
  });
  const map = new Map<string, VoxyRenderUploadTargetPolicyRecord>();
  for (const record of records) {
    const key = record.mediaStorageTruthId ?? "";
    if (!key || map.has(key)) continue;
    map.set(key, record);
  }
  return map;
}

export async function listVoxyRenderUploadTargetPolicyAuditEvents(
  params?: VoxyRenderUploadTargetPolicyAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderUploadTargetPolicy(input: {
  command: VoxyRenderUploadTargetPolicyCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const mediaStorageTruthId = normalizeOptionalString(input.command.mediaStorageTruthId);
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord =
    mediaStorageTruthId || previewReviewFlowId
      ? await repo.getLatestRecord({
          mediaStorageTruthId,
          previewReviewFlowId,
        })
      : null;

  const uploadTargetPolicyStatus = deriveVoxyRenderUploadTargetPolicyStatus({
    mediaStorageTruthId,
    mediaStorageTruthStatusHint: input.command.mediaStorageTruthStatusHint ?? null,
    approvalStatusHint: input.command.approvalStatusHint ?? null,
    publishReadinessGuardStatusHint: input.command.publishReadinessGuardStatusHint ?? null,
    socialDistributionHandoffStatusHint:
      input.command.socialDistributionHandoffStatusHint ?? null,
    previewReviewFlowStatusHint: input.command.previewReviewFlowStatusHint ?? null,
    mediaFileAvailable: input.command.uploadSemantics.mediaFileAvailable,
    uploadTargetStatus: input.command.uploadTargetCandidate.status,
    accessPolicyVisibility: input.command.accessPolicy.visibility,
    signedAccessCandidate: input.command.accessPolicy.signedAccessCandidate,
    signedAccessPolicyDefined: input.command.signedAccessPolicyDefined,
    retentionPolicyStatus: input.command.retentionPolicy.status,
    deletionPolicyStatus: input.command.deletionPolicy.status,
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mediaStorageTruthId) {
    errors.push("media_storage_truth_required");
  }
  if (input.command.uploadTargetCandidate.bucketOrContainer) {
    errors.push("bucket_or_container_must_remain_empty");
  }
  if (input.command.uploadTargetCandidate.basePath) {
    errors.push("base_path_must_remain_empty");
  }
  if (input.command.uploadTargetCandidate.publicBaseUrl) {
    errors.push("public_base_url_must_remain_empty");
  }
  if (input.command.uploadTargetCandidate.writeAllowed !== false) {
    errors.push("upload_target_write_must_remain_false");
  }
  if (input.command.uploadTargetCandidate.uploadAllowed !== false) {
    errors.push("upload_target_upload_must_remain_false");
  }
  if (input.command.uploadTargetCandidate.publicAccessAllowed !== false) {
    errors.push("upload_target_public_access_must_remain_false");
  }
  if (input.command.uploadTargetCandidate.signedAccessAllowed !== false) {
    errors.push("upload_target_signed_access_must_remain_false");
  }
  if (input.command.accessPolicy.signedUrlCreated !== false) {
    errors.push("signed_url_created_must_remain_false");
  }
  if (input.command.accessPolicy.publicUrlCreated !== false) {
    errors.push("public_url_created_must_remain_false");
  }
  if (input.command.accessPolicy.downloadAllowed !== false) {
    errors.push("download_allowed_must_remain_false");
  }
  if (input.command.accessPolicy.shareAllowed !== false) {
    errors.push("share_allowed_must_remain_false");
  }
  if (input.command.retentionPolicy.retentionDays !== null) {
    errors.push("retention_days_must_remain_empty");
  }
  if (input.command.retentionPolicy.deletionJobCreated !== false) {
    errors.push("retention_deletion_job_must_remain_false");
  }
  if (input.command.retentionPolicy.deletionAllowed !== false) {
    errors.push("retention_deletion_allowed_must_remain_false");
  }
  if (input.command.deletionPolicy.deletionJobCreated !== false) {
    errors.push("deletion_job_created_must_remain_false");
  }
  if (input.command.deletionPolicy.deletionAllowed !== false) {
    errors.push("deletion_allowed_must_remain_false");
  }
  if (input.command.uploadSemantics.uploadReady !== false) {
    errors.push("upload_ready_must_remain_false");
  }
  if (input.command.uploadSemantics.uploaded !== false) {
    errors.push("uploaded_must_remain_false");
  }
  if (input.command.uploadSemantics.storageWriteAllowed !== false) {
    errors.push("storage_write_allowed_must_remain_false");
  }
  if (input.command.uploadSemantics.signedUrlAvailable !== false) {
    errors.push("signed_url_available_must_remain_false");
  }
  if (input.command.uploadSemantics.publicUrlAvailable !== false) {
    errors.push("public_url_available_must_remain_false");
  }
  if (input.command.uploadSemantics.mediaFileAvailable !== false) {
    errors.push("media_file_available_must_remain_false");
  }
  if (input.command.uploadSemantics.previewFileAvailable !== false) {
    errors.push("preview_file_available_must_remain_false");
  }
  if (input.command.executionFlags.uploadAllowed !== false) {
    errors.push("upload_allowed_must_remain_false");
  }
  if (input.command.executionFlags.storageWriteAllowed !== false) {
    errors.push("storage_write_execution_must_remain_false");
  }
  if (input.command.executionFlags.signedUrlCreationAllowed !== false) {
    errors.push("signed_url_creation_must_remain_false");
  }
  if (input.command.executionFlags.publicUrlCreationAllowed !== false) {
    errors.push("public_url_creation_must_remain_false");
  }
  if (input.command.executionFlags.deletionJobAllowed !== false) {
    errors.push("deletion_job_allowed_must_remain_false");
  }
  warnings.push("upload_target_is_not_uploaded");
  warnings.push("storage_policy_is_not_storage_write");
  warnings.push("signed_access_candidate_is_not_signed_url");
  warnings.push("retention_policy_is_not_deletion_job");
  warnings.push("no_upload_storage_write_or_publish_happens");

  const normalizedCommand: VoxyRenderUploadTargetPolicyCommand = {
    ...input.command,
    uploadTargetPolicyId: input.command.uploadTargetPolicyId ?? null,
    mediaStorageTruthId,
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
    uploadTargetPolicyStatus,
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
    } satisfies VoxyRenderUploadTargetPolicyStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizedCommand.reviewerRef?.id ?? null;
  const idempotencyKey = buildIdempotencyKey({
    mediaStorageTruthId,
    previewReviewFlowId,
    uploadTargetPolicyStatus,
    reviewerRefId: persistedBy,
  });

  const record: VoxyRenderUploadTargetPolicyRecord = {
    ...normalizedCommand,
    uploadTargetPolicyId:
      normalizedCommand.uploadTargetPolicyId ??
      buildRecordId({
        mediaStorageTruthId,
        previewReviewFlowId,
        uploadTargetPolicyStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey,
    previousUploadTargetPolicyRef: latestRecord?.uploadTargetPolicyId ?? null,
    supersedesUploadTargetPolicyRef: null,
    uploadTargetPolicyVersion: (latestRecord?.uploadTargetPolicyVersion ?? 0) + 1,
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
  } satisfies VoxyRenderUploadTargetPolicyStoreResult;
}

export async function appendVoxyRenderUploadTargetPolicyAuditEvent(input: {
  record: VoxyRenderUploadTargetPolicyRecord;
  byUserId?: string | null;
  note?: string | null;
}) {
  const repo = getRepository();
  const at = nowIso();
  const event: VoxyRenderUploadTargetPolicyAuditEvent = {
    id: buildAuditId({
      uploadTargetPolicyId: input.record.uploadTargetPolicyId,
      mediaStorageTruthId: input.record.mediaStorageTruthId ?? "missing-media-storage-truth",
      at,
    }),
    uploadTargetPolicyId: input.record.uploadTargetPolicyId,
    mediaStorageTruthId: input.record.mediaStorageTruthId ?? "missing-media-storage-truth",
    previewReviewFlowId: input.record.previewReviewFlowId ?? null,
    action: "upload_target_policy_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at,
    uploadTargetPolicyStatus: input.record.uploadTargetPolicyStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousUploadTargetPolicyRef: input.record.previousUploadTargetPolicyRef ?? null,
  };
  return repo.appendAuditEvent(event);
}
