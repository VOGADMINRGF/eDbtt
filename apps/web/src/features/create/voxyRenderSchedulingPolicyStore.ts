import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderCalendarHint,
  VoxyRenderScheduleCandidate,
  VoxyRenderSchedulingExecutionFlags,
  VoxyRenderSchedulingPolicyCommand,
  VoxyRenderSchedulingPolicyPersistenceState,
  VoxyRenderSchedulingPolicyRecord,
  VoxyRenderSchedulingPolicyStoreResult,
  VoxyRenderSchedulingSemantics,
} from "@/features/create/voxyRenderSchedulingPolicyContract";
import {
  buildVoxyRenderSchedulingExecutionFlags,
} from "@/features/create/voxyRenderSchedulingPolicyContract";

export const VOXY_RENDER_SCHEDULING_POLICY_AUDIT_ACTIONS = [
  "scheduling_policy_recorded",
] as const;

export type VoxyRenderSchedulingPolicyAuditAction =
  (typeof VOXY_RENDER_SCHEDULING_POLICY_AUDIT_ACTIONS)[number];

export type VoxyRenderSchedulingPolicyAuditEvent = {
  id: string;
  schedulingPolicyId: string;
  uploadTargetPolicyId: string;
  previewReviewFlowId: string | null;
  action: VoxyRenderSchedulingPolicyAuditAction;
  byUserId: string | null;
  at: string;
  schedulingPolicyStatus: VoxyRenderSchedulingPolicyRecord["schedulingPolicyStatus"];
  nextStep: VoxyRenderSchedulingPolicyRecord["nextStep"];
  summary: string;
  note: string | null;
  previousSchedulingPolicyRef: string | null;
};

export type VoxyRenderSchedulingPolicyListParams = {
  uploadTargetPolicyId?: string | null;
  uploadTargetPolicyIds?: string[];
  approvalSemanticsId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderSchedulingPolicyAuditListParams = {
  schedulingPolicyId?: string | null;
  uploadTargetPolicyId?: string | null;
  previewReviewFlowId?: string | null;
  limit?: number;
};

export type VoxyRenderSchedulingPolicyRepository = {
  saveRecord(
    record: VoxyRenderSchedulingPolicyRecord,
  ): Promise<VoxyRenderSchedulingPolicyRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderSchedulingPolicyListParams,
      "uploadTargetPolicyId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderSchedulingPolicyRecord | null>;
  listRecords(
    params?: VoxyRenderSchedulingPolicyListParams,
  ): Promise<VoxyRenderSchedulingPolicyRecord[]>;
  appendAuditEvent(
    event: VoxyRenderSchedulingPolicyAuditEvent,
  ): Promise<VoxyRenderSchedulingPolicyAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderSchedulingPolicyAuditListParams,
  ): Promise<VoxyRenderSchedulingPolicyAuditEvent[]>;
  getPersistenceState(): VoxyRenderSchedulingPolicyPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_scheduling_policy_records";
const AUDIT_COLLECTION = "voxy_render_scheduling_policy_audits";

let repoSingleton: VoxyRenderSchedulingPolicyRepository | null = null;
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
  ref: VoxyRenderSchedulingPolicyCommand["scriptRef"],
): VoxyRenderSchedulingPolicyCommand["scriptRef"] {
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
  value: VoxyRenderSchedulingExecutionFlags,
): VoxyRenderSchedulingExecutionFlags {
  return {
    ...buildVoxyRenderSchedulingExecutionFlags(),
    ...value,
    schedulingAllowed: false,
    schedulerJobAllowed: false,
    calendarWriteAllowed: false,
    reminderAllowed: false,
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
  };
}

function normalizeScheduleCandidate(
  value: VoxyRenderScheduleCandidate,
): VoxyRenderScheduleCandidate {
  return {
    ...value,
    scheduleCandidateId: normalizeOptionalString(value.scheduleCandidateId),
    suggestedWindow: null,
    timezone: null,
    platform: normalizeOptionalString(value.platform),
    scheduledAt: null,
    scheduled: false,
    schedulingAllowed: false,
    schedulerJobCreated: false,
    calendarEventCreated: false,
    reviewerVisibleReason: normalizeText(value.reviewerVisibleReason),
    userVisibleReason: normalizeText(value.userVisibleReason),
  };
}

function normalizeCalendarHint(value: VoxyRenderCalendarHint): VoxyRenderCalendarHint {
  return {
    ...value,
    calendarHintId: normalizeOptionalString(value.calendarHintId),
    calendarEventCreated: false,
    calendarWriteAllowed: false,
    reminderCreated: false,
    reviewerVisibleReason: normalizeText(value.reviewerVisibleReason),
    userVisibleReason: normalizeText(value.userVisibleReason),
  };
}

function normalizeSchedulingSemantics(
  value: VoxyRenderSchedulingSemantics,
): VoxyRenderSchedulingSemantics {
  return {
    ...value,
    scheduled: false,
    schedulerJobCreated: false,
    calendarEventCreated: false,
    postedAtAvailable: false,
    distributionTimeFinal: false,
    uploadReady: false,
    published: false,
    socialPosted: false,
  };
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderSchedulingPolicyPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Scheduling-Policy-Store"
      : "In-Memory-Fallback für Scheduling-Policy-Store",
    summary: persistent
      ? "Scheduling-Policies und Audit-Spuren werden getrennt von Scheduling-Job, Kalendertermin, Posting und Veröffentlichung gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Scheduling-Policy lebt pro Prozess und ist keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderSchedulingPolicyRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  uploadTargetPolicyId: string | null;
  previewReviewFlowId: string | null;
  schedulingPolicyStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-scheduling-policy-idempotency:${stableHash(
    [
      input.uploadTargetPolicyId ?? "",
      input.previewReviewFlowId ?? "",
      input.schedulingPolicyStatus,
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildRecordId(input: {
  uploadTargetPolicyId: string | null;
  previewReviewFlowId: string | null;
  schedulingPolicyStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-scheduling-policy:${stableHash(
    [
      input.uploadTargetPolicyId ?? "",
      input.previewReviewFlowId ?? "",
      input.schedulingPolicyStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  schedulingPolicyId: string;
  uploadTargetPolicyId: string;
  at: string;
}) {
  return `voxy-render-scheduling-policy-audit:${stableHash(
    `${input.schedulingPolicyId}:${input.uploadTargetPolicyId}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ uploadTargetPolicyId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ approvalSemanticsId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ schedulingPolicyId: 1, at: -1 }),
    auditsCol.createIndex({ uploadTargetPolicyId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]);
  indexesReady = true;
}

function recordMatches(
  record: VoxyRenderSchedulingPolicyRecord,
  params: VoxyRenderSchedulingPolicyListParams,
) {
  if (params.uploadTargetPolicyId && record.uploadTargetPolicyId !== params.uploadTargetPolicyId) {
    return false;
  }
  if (
    params.uploadTargetPolicyIds?.length &&
    !params.uploadTargetPolicyIds.includes(record.uploadTargetPolicyId ?? "")
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
  event: VoxyRenderSchedulingPolicyAuditEvent,
  params: VoxyRenderSchedulingPolicyAuditListParams,
) {
  if (params.schedulingPolicyId && event.schedulingPolicyId !== params.schedulingPolicyId) {
    return false;
  }
  if (params.uploadTargetPolicyId && event.uploadTargetPolicyId !== params.uploadTargetPolicyId) {
    return false;
  }
  if (params.previewReviewFlowId && event.previewReviewFlowId !== params.previewReviewFlowId) {
    return false;
  }
  return true;
}

export function createInMemoryVoxyRenderSchedulingPolicyRepository(): VoxyRenderSchedulingPolicyRepository {
  const records: VoxyRenderSchedulingPolicyRecord[] = [];
  const audits: VoxyRenderSchedulingPolicyAuditEvent[] = [];
  return {
    async saveRecord(record) {
      records.unshift(clone(record));
      return clone(record);
    },
    async getLatestRecord(params) {
      return (
        records.find((record) =>
          recordMatches(record, {
            uploadTargetPolicyId: params.uploadTargetPolicyId ?? null,
            previewReviewFlowId: params.previewReviewFlowId ?? null,
          }),
        ) ?? null
      );
    },
    async listRecords(params = {}) {
      return records
        .filter((record) => recordMatches(record, params))
        .slice(0, params.limit ?? 20)
        .map((record) => clone(record));
    },
    async appendAuditEvent(event) {
      audits.unshift(clone(event));
      return clone(event);
    },
    async listAuditEvents(params = {}) {
      return audits
        .filter((event) => auditMatches(event, params))
        .slice(0, params.limit ?? 20)
        .map((event) => clone(event));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function createMongoVoxyRenderSchedulingPolicyRepository(): VoxyRenderSchedulingPolicyRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const stored = {
        ...clone(record),
        contributionRefId: record.contributionRef?.id ?? null,
        dossierRefId: record.dossierRef?.id ?? null,
      };
      await col.insertOne(stored);
      return clone(record);
    },
    async getLatestRecord(params) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const query: Record<string, unknown> = {};
      if (params.uploadTargetPolicyId) query.uploadTargetPolicyId = params.uploadTargetPolicyId;
      if (params.previewReviewFlowId) query.previewReviewFlowId = params.previewReviewFlowId;
      const value = await col.find(query).sort({ persistedAt: -1 }).limit(1).next();
      return value ? (clone(value) as VoxyRenderSchedulingPolicyRecord) : null;
    },
    async listRecords(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const query: Record<string, unknown> = {};
      if (params.uploadTargetPolicyId) query.uploadTargetPolicyId = params.uploadTargetPolicyId;
      if (params.uploadTargetPolicyIds?.length) {
        query.uploadTargetPolicyId = { $in: normalizeIds(params.uploadTargetPolicyIds) };
      }
      if (params.approvalSemanticsId) query.approvalSemanticsId = params.approvalSemanticsId;
      if (params.previewReviewFlowId) query.previewReviewFlowId = params.previewReviewFlowId;
      if (params.contributionRefId) query.contributionRefId = params.contributionRefId;
      if (params.dossierRefId) query.dossierRefId = params.dossierRefId;
      const rows = await col
        .find(query)
        .sort({ persistedAt: -1 })
        .limit(params.limit ?? 20)
        .toArray();
      return rows.map((row) => clone(row) as VoxyRenderSchedulingPolicyRecord);
    },
    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      await col.insertOne(clone(event));
      return clone(event);
    },
    async listAuditEvents(params = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      const query: Record<string, unknown> = {};
      if (params.schedulingPolicyId) query.schedulingPolicyId = params.schedulingPolicyId;
      if (params.uploadTargetPolicyId) query.uploadTargetPolicyId = params.uploadTargetPolicyId;
      if (params.previewReviewFlowId) query.previewReviewFlowId = params.previewReviewFlowId;
      const rows = await col
        .find(query)
        .sort({ at: -1 })
        .limit(params.limit ?? 20)
        .toArray();
      return rows.map((row) => clone(row) as VoxyRenderSchedulingPolicyAuditEvent);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

function getRepository() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderSchedulingPolicyRepository()
    : createMongoVoxyRenderSchedulingPolicyRepository();
  return repoSingleton;
}

export function setVoxyRenderSchedulingPolicyRepositoryForTests(
  repository: VoxyRenderSchedulingPolicyRepository | null,
) {
  repoSingleton = repository;
}

export function getVoxyRenderSchedulingPolicyPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderSchedulingPolicyRecords(
  params: VoxyRenderSchedulingPolicyListParams = {},
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderSchedulingPolicyRecord(
  params: Pick<
    VoxyRenderSchedulingPolicyListParams,
    "uploadTargetPolicyId" | "previewReviewFlowId"
  >,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderSchedulingPoliciesByUploadTargetPolicyIds(
  uploadTargetPolicyIds: string[],
) {
  const normalizedIds = normalizeIds(uploadTargetPolicyIds);
  if (normalizedIds.length === 0) {
    return new Map<string, VoxyRenderSchedulingPolicyRecord>();
  }
  const records = await getRepository().listRecords({
    uploadTargetPolicyIds: normalizedIds,
    limit: normalizedIds.length * 5,
  });
  const latest = new Map<string, VoxyRenderSchedulingPolicyRecord>();
  for (const record of records) {
    const id = record.uploadTargetPolicyId;
    if (!id || latest.has(id)) continue;
    latest.set(id, record);
  }
  return latest;
}

export async function listVoxyRenderSchedulingPolicyAuditEvents(
  params: VoxyRenderSchedulingPolicyAuditListParams = {},
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderSchedulingPolicy(input: {
  command: VoxyRenderSchedulingPolicyCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const errors: string[] = [];
  const warnings: string[] = [];

  const uploadTargetPolicyId = normalizeOptionalString(input.command.uploadTargetPolicyId);
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const schedulingPolicyStatus = input.command.schedulingPolicyStatus;
  const latestRecord = uploadTargetPolicyId
    ? await repo.getLatestRecord({
        uploadTargetPolicyId,
        previewReviewFlowId,
      })
    : null;

  if (!uploadTargetPolicyId) {
    errors.push("upload_target_policy_required");
  }
  if (input.command.scheduleCandidate.suggestedWindow !== null) {
    errors.push("suggested_window_must_remain_null");
  }
  if (input.command.scheduleCandidate.timezone !== null) {
    errors.push("timezone_must_remain_null");
  }
  if (input.command.scheduleCandidate.scheduledAt !== null) {
    errors.push("scheduled_at_must_remain_null");
  }
  if (input.command.publishWindow.earliestPublishAt !== null) {
    errors.push("earliest_publish_at_must_remain_null");
  }
  if (input.command.publishWindow.latestPublishAt !== null) {
    errors.push("latest_publish_at_must_remain_null");
  }
  if (input.command.scheduleCandidate.scheduled !== false) {
    errors.push("scheduled_must_remain_false");
  }
  if (input.command.scheduleCandidate.schedulingAllowed !== false) {
    errors.push("scheduling_allowed_must_remain_false");
  }
  if (input.command.scheduleCandidate.schedulerJobCreated !== false) {
    errors.push("scheduler_job_created_must_remain_false");
  }
  if (input.command.scheduleCandidate.calendarEventCreated !== false) {
    errors.push("calendar_event_created_must_remain_false");
  }
  if (input.command.calendarHint.calendarEventCreated !== false) {
    errors.push("calendar_hint_event_must_remain_false");
  }
  if (input.command.calendarHint.calendarWriteAllowed !== false) {
    errors.push("calendar_write_allowed_must_remain_false");
  }
  if (input.command.calendarHint.reminderCreated !== false) {
    errors.push("reminder_created_must_remain_false");
  }
  if (input.command.schedulingSemantics.scheduled !== false) {
    errors.push("semantics_scheduled_must_remain_false");
  }
  if (input.command.schedulingSemantics.schedulerJobCreated !== false) {
    errors.push("semantics_scheduler_job_must_remain_false");
  }
  if (input.command.schedulingSemantics.calendarEventCreated !== false) {
    errors.push("semantics_calendar_event_must_remain_false");
  }
  if (input.command.schedulingSemantics.postedAtAvailable !== false) {
    errors.push("posted_at_available_must_remain_false");
  }
  if (input.command.schedulingSemantics.distributionTimeFinal !== false) {
    errors.push("distribution_time_final_must_remain_false");
  }
  if (input.command.schedulingSemantics.uploadReady !== false) {
    errors.push("upload_ready_must_remain_false");
  }
  if (input.command.schedulingSemantics.published !== false) {
    errors.push("published_must_remain_false");
  }
  if (input.command.schedulingSemantics.socialPosted !== false) {
    errors.push("social_posted_must_remain_false");
  }
  if (input.command.executionFlags.schedulingAllowed !== false) {
    errors.push("scheduling_execution_must_remain_false");
  }
  if (input.command.executionFlags.schedulerJobAllowed !== false) {
    errors.push("scheduler_job_allowed_must_remain_false");
  }
  if (input.command.executionFlags.calendarWriteAllowed !== false) {
    errors.push("calendar_write_execution_must_remain_false");
  }
  if (input.command.executionFlags.reminderAllowed !== false) {
    errors.push("reminder_allowed_must_remain_false");
  }
  warnings.push("schedule_candidate_is_not_scheduled");
  warnings.push("publish_window_is_not_scheduler_job");
  warnings.push("calendar_hint_is_not_calendar_event");
  warnings.push("distribution_time_is_not_posted_at");
  warnings.push("no_schedule_job_calendar_event_or_publish_happens");

  const normalizedCommand: VoxyRenderSchedulingPolicyCommand = {
    ...input.command,
    schedulingPolicyId: input.command.schedulingPolicyId ?? null,
    uploadTargetPolicyId,
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
    scheduleCandidate: normalizeScheduleCandidate(input.command.scheduleCandidate),
    publishWindow: {
      ...input.command.publishWindow,
      publishWindowId: normalizeOptionalString(input.command.publishWindow.publishWindowId),
      earliestPublishAt: null,
      latestPublishAt: null,
      reviewerVisibleReason: normalizeText(input.command.publishWindow.reviewerVisibleReason),
      userVisibleReason: normalizeText(input.command.publishWindow.userVisibleReason),
    },
    calendarHint: normalizeCalendarHint(input.command.calendarHint),
    schedulingSemantics: normalizeSchedulingSemantics(input.command.schedulingSemantics),
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
    } satisfies VoxyRenderSchedulingPolicyStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizedCommand.reviewerRef?.id ?? null;
  const idempotencyKey = buildIdempotencyKey({
    uploadTargetPolicyId,
    previewReviewFlowId,
    schedulingPolicyStatus,
    reviewerRefId: persistedBy,
  });

  const record: VoxyRenderSchedulingPolicyRecord = {
    ...normalizedCommand,
    schedulingPolicyId:
      normalizedCommand.schedulingPolicyId ??
      buildRecordId({
        uploadTargetPolicyId,
        previewReviewFlowId,
        schedulingPolicyStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey,
    previousSchedulingPolicyRef: latestRecord?.schedulingPolicyId ?? null,
    supersedesSchedulingPolicyRef: null,
    schedulingPolicyVersion: (latestRecord?.schedulingPolicyVersion ?? 0) + 1,
  };

  const saved = await repo.saveRecord(record);
  return {
    ok: true,
    status: persistence.productionTruth ? "persisted" : "noop",
    record: saved,
    warnings,
    errors: [],
    idempotencyKey,
    nextStep: saved.nextStep,
  } satisfies VoxyRenderSchedulingPolicyStoreResult;
}

export async function appendVoxyRenderSchedulingPolicyAuditEvent(input: {
  record: VoxyRenderSchedulingPolicyRecord;
  byUserId?: string | null;
  note?: string | null;
}) {
  const repo = getRepository();
  const at = nowIso();
  const event: VoxyRenderSchedulingPolicyAuditEvent = {
    id: buildAuditId({
      schedulingPolicyId: input.record.schedulingPolicyId,
      uploadTargetPolicyId: input.record.uploadTargetPolicyId ?? "missing-upload-target-policy",
      at,
    }),
    schedulingPolicyId: input.record.schedulingPolicyId,
    uploadTargetPolicyId: input.record.uploadTargetPolicyId ?? "missing-upload-target-policy",
    previewReviewFlowId: input.record.previewReviewFlowId ?? null,
    action: "scheduling_policy_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at,
    schedulingPolicyStatus: input.record.schedulingPolicyStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousSchedulingPolicyRef: input.record.previousSchedulingPolicyRef ?? null,
  };
  return repo.appendAuditEvent(event);
}
