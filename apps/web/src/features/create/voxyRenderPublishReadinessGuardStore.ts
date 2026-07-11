import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessPersistenceState,
  VoxyRenderPublishReadinessGuardRecord,
  VoxyRenderPublishReadinessStoreResult,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  buildVoxyRenderPublishReadinessEffects,
  buildVoxyRenderPublishReadinessExecutionFlags,
  deriveVoxyRenderPublishReadinessGuardStatus,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";

export const VOXY_RENDER_PUBLISH_READINESS_AUDIT_ACTIONS = [
  "publish_readiness_guard_recorded",
] as const;

export type VoxyRenderPublishReadinessAuditAction =
  (typeof VOXY_RENDER_PUBLISH_READINESS_AUDIT_ACTIONS)[number];

export type VoxyRenderPublishReadinessAuditEvent = {
  id: string;
  publishReadinessGuardId: string;
  previewOutcomeHandoffId: string | null;
  previewReviewDecisionRecordId: string | null;
  previewReviewFlowId: string | null;
  action: VoxyRenderPublishReadinessAuditAction;
  byUserId: string | null;
  at: string;
  guardStatus: VoxyRenderPublishReadinessGuardRecord["guardStatus"];
  nextStep: VoxyRenderPublishReadinessGuardRecord["nextStep"];
  summary: string;
  note: string | null;
  previousPublishReadinessGuardRef: string | null;
};

export type VoxyRenderPublishReadinessGuardListParams = {
  previewOutcomeHandoffId?: string | null;
  previewOutcomeHandoffIds?: string[];
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderPublishReadinessAuditListParams = {
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  publishReadinessGuardId?: string | null;
  limit?: number;
};

export type VoxyRenderPublishReadinessGuardRepository = {
  saveRecord(
    record: VoxyRenderPublishReadinessGuardRecord,
  ): Promise<VoxyRenderPublishReadinessGuardRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderPublishReadinessGuardListParams,
      "previewOutcomeHandoffId" | "previewReviewDecisionRecordId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderPublishReadinessGuardRecord | null>;
  listRecords(
    params?: VoxyRenderPublishReadinessGuardListParams,
  ): Promise<VoxyRenderPublishReadinessGuardRecord[]>;
  appendAuditEvent(
    event: VoxyRenderPublishReadinessAuditEvent,
  ): Promise<VoxyRenderPublishReadinessAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderPublishReadinessAuditListParams,
  ): Promise<VoxyRenderPublishReadinessAuditEvent[]>;
  getPersistenceState(): VoxyRenderPublishReadinessPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_publish_readiness_guard_records";
const AUDIT_COLLECTION = "voxy_render_publish_readiness_guard_audits";

let repoSingleton: VoxyRenderPublishReadinessGuardRepository | null = null;
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

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeRef(
  ref: VoxyRenderPublishReadinessGuardCommand["scriptRef"],
): VoxyRenderPublishReadinessGuardCommand["scriptRef"] {
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

function normalizeIds(values: string[] | undefined): string[] {
  return Array.from(new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []));
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderPublishReadinessPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Publish-Readiness-Guard-Store"
      : "In-Memory-Fallback für Publish-Readiness-Guard-Store",
    summary: persistent
      ? "Publish-Readiness-Guards und Audit-Spuren werden getrennt von Upload, Scheduling, Social Posting und Veröffentlichung gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Publish-Readiness-Guards leben pro Prozess und sind keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderPublishReadinessGuardRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  previewOutcomeHandoffId: string | null;
  previewReviewDecisionRecordId: string | null;
  guardStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-publish-readiness-guard-idempotency:${stableHash(
    [
      input.previewOutcomeHandoffId ?? "",
      input.previewReviewDecisionRecordId ?? "",
      input.guardStatus,
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildGuardRecordId(input: {
  previewOutcomeHandoffId: string | null;
  previewReviewDecisionRecordId: string | null;
  guardStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-publish-readiness-guard:${stableHash(
    [
      input.previewOutcomeHandoffId ?? "",
      input.previewReviewDecisionRecordId ?? "",
      input.guardStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  publishReadinessGuardId: string;
  previewOutcomeHandoffId: string | null;
  at: string;
}) {
  return `voxy-render-publish-readiness-guard-audit:${stableHash(
    `${input.publishReadinessGuardId}:${input.previewOutcomeHandoffId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ previewOutcomeHandoffId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewDecisionRecordId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ previewOutcomeHandoffId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewDecisionRecordId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderPublishReadinessGuardRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.publishReadinessGuardId },
        {
          $set: {
            _id: record.publishReadinessGuardId,
            record: clone(record),
            previewOutcomeHandoffId: record.previewOutcomeHandoffId,
            previewReviewDecisionRecordId: record.previewReviewDecisionRecordId,
            previewReviewFlowId: record.previewReviewFlowId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            guardStatus: record.guardStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            guardVersion: record.guardVersion,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(params) {
      const [record] = await this.listRecords({ ...params, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewOutcomeHandoffIds = normalizeIds(params?.previewOutcomeHandoffIds);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (previewOutcomeHandoffId) filter.previewOutcomeHandoffId = previewOutcomeHandoffId;
      if (previewOutcomeHandoffIds.length > 0) {
        filter.previewOutcomeHandoffId = { $in: previewOutcomeHandoffIds };
      }
      if (previewReviewDecisionRecordId) {
        filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;

      const docs = await col
        .find(filter)
        .sort({ persistedAt: -1, publishReadinessGuardId: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderPublishReadinessGuardRecord))
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
            event: clone(event),
            previewOutcomeHandoffId: event.previewOutcomeHandoffId,
            previewReviewDecisionRecordId: event.previewReviewDecisionRecordId,
            previewReviewFlowId: event.previewReviewFlowId,
            publishReadinessGuardId: event.publishReadinessGuardId,
            at: event.at,
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
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const publishReadinessGuardId = normalizeOptionalString(
        params?.publishReadinessGuardId,
      );
      if (previewOutcomeHandoffId) filter.previewOutcomeHandoffId = previewOutcomeHandoffId;
      if (previewReviewDecisionRecordId) {
        filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (publishReadinessGuardId) filter.publishReadinessGuardId = publishReadinessGuardId;
      const docs = await col
        .find(filter)
        .sort({ at: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.event as VoxyRenderPublishReadinessAuditEvent))
        .filter(Boolean);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderPublishReadinessGuardRepository(seed?: {
  records?: VoxyRenderPublishReadinessGuardRecord[];
  auditEvents?: VoxyRenderPublishReadinessAuditEvent[];
}): VoxyRenderPublishReadinessGuardRepository {
  const records = [...(seed?.records ?? [])];
  const auditEvents = [...(seed?.auditEvents ?? [])];

  return {
    async saveRecord(record) {
      const next = clone(record);
      const existingIndex = records.findIndex(
        (item) => item.publishReadinessGuardId === record.publishReadinessGuardId,
      );
      if (existingIndex >= 0) records.splice(existingIndex, 1, next);
      else records.push(next);
      return clone(next);
    },
    async getLatestRecord(params) {
      const [record] = await this.listRecords({ ...params, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewOutcomeHandoffIds = normalizeIds(params?.previewOutcomeHandoffIds);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      return records
        .filter((record) => {
          if (previewOutcomeHandoffId && record.previewOutcomeHandoffId !== previewOutcomeHandoffId) {
            return false;
          }
          if (
            previewOutcomeHandoffIds.length > 0 &&
            !previewOutcomeHandoffIds.includes(normalizeOptionalString(record.previewOutcomeHandoffId) ?? "")
          ) {
            return false;
          }
          if (
            previewReviewDecisionRecordId &&
            record.previewReviewDecisionRecordId !== previewReviewDecisionRecordId
          ) {
            return false;
          }
          if (previewReviewFlowId && record.previewReviewFlowId !== previewReviewFlowId) {
            return false;
          }
          if (contributionRefId && record.contributionRef?.id !== contributionRefId) return false;
          if (dossierRefId && record.dossierRef?.id !== dossierRefId) return false;
          return true;
        })
        .sort((a, b) => String(b.persistedAt).localeCompare(String(a.persistedAt)))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)))
        .map((record) => clone(record));
    },
    async appendAuditEvent(event) {
      const next = clone(event);
      const existingIndex = auditEvents.findIndex((item) => item.id === event.id);
      if (existingIndex >= 0) auditEvents.splice(existingIndex, 1, next);
      else auditEvents.push(next);
      return clone(next);
    },
    async listAuditEvents(params) {
      return auditEvents
        .filter((event) => {
          if (
            normalizeOptionalString(params?.previewOutcomeHandoffId) &&
            event.previewOutcomeHandoffId !== normalizeOptionalString(params?.previewOutcomeHandoffId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.previewReviewDecisionRecordId) &&
            event.previewReviewDecisionRecordId !==
              normalizeOptionalString(params?.previewReviewDecisionRecordId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.previewReviewFlowId) &&
            event.previewReviewFlowId !== normalizeOptionalString(params?.previewReviewFlowId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.publishReadinessGuardId) &&
            event.publishReadinessGuardId !== normalizeOptionalString(params?.publishReadinessGuardId)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => String(b.at).localeCompare(String(a.at)))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)))
        .map((event) => clone(event));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function getRepository() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderPublishReadinessGuardRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderPublishReadinessGuardRepositoryForTests(
  repo: VoxyRenderPublishReadinessGuardRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderPublishReadinessPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderPublishReadinessGuardRecords(
  params?: VoxyRenderPublishReadinessGuardListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderPublishReadinessGuardRecord(
  params: Pick<
    VoxyRenderPublishReadinessGuardListParams,
    "previewOutcomeHandoffId" | "previewReviewDecisionRecordId" | "previewReviewFlowId"
  >,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderPublishReadinessGuardsByPreviewOutcomeHandoffIds(
  previewOutcomeHandoffIds: string[],
) {
  const normalized = normalizeIds(previewOutcomeHandoffIds);
  if (normalized.length === 0) {
    return new Map<string, VoxyRenderPublishReadinessGuardRecord>();
  }
  const records = await getRepository().listRecords({
    previewOutcomeHandoffIds: normalized,
    limit: normalized.length * 5,
  });
  const result = new Map<string, VoxyRenderPublishReadinessGuardRecord>();
  for (const record of records) {
    const key = normalizeOptionalString(record.previewOutcomeHandoffId);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

export async function listVoxyRenderPublishReadinessAuditEvents(
  params?: VoxyRenderPublishReadinessAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderPublishReadinessGuard(input: {
  command: VoxyRenderPublishReadinessGuardCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const previewOutcomeHandoffId = normalizeOptionalString(input.command.previewOutcomeHandoffId);
  const previewReviewDecisionRecordId = normalizeOptionalString(
    input.command.previewReviewDecisionRecordId,
  );
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord =
    previewOutcomeHandoffId || previewReviewDecisionRecordId || previewReviewFlowId
      ? await repo.getLatestRecord({
          previewOutcomeHandoffId,
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : null;

  const guardStatus = deriveVoxyRenderPublishReadinessGuardStatus({
    previewOutcomeHandoffId,
    previewOutcomeTypeHint: input.command.previewOutcomeTypeHint ?? null,
    previewOutcomeStatusHint: input.command.previewOutcomeStatusHint ?? null,
    reviewGate: input.command.reviewGate,
    approvalGate: input.command.approvalGate,
    mediaGate: input.command.mediaGate,
    uploadGate: input.command.uploadGate,
    schedulingGate: input.command.schedulingGate,
    socialPostingGate: input.command.socialPostingGate,
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!previewOutcomeHandoffId) {
    errors.push("preview_outcome_handoff_required");
  }
  if (input.command.publishSemantics.approved !== false) {
    errors.push("approved_must_remain_false");
  }
  if (input.command.publishSemantics.publishReady !== false) {
    errors.push("publish_ready_must_remain_false");
  }
  if (input.command.publishSemantics.published !== false) {
    errors.push("published_must_remain_false");
  }
  if (input.command.publishSemantics.uploaded !== false) {
    errors.push("uploaded_must_remain_false");
  }
  if (input.command.publishSemantics.scheduled !== false) {
    errors.push("scheduled_must_remain_false");
  }
  if (input.command.publishSemantics.socialPosted !== false) {
    errors.push("social_posted_must_remain_false");
  }
  if (input.command.publishSemantics.autoPublishAllowed !== false) {
    errors.push("auto_publish_must_remain_false");
  }
  if (input.command.guardEffects.blocksPublish !== true) {
    errors.push("blocks_publish_must_remain_true");
  }
  if (input.command.guardEffects.blocksUpload !== true) {
    errors.push("blocks_upload_must_remain_true");
  }
  if (input.command.guardEffects.blocksScheduling !== true) {
    errors.push("blocks_scheduling_must_remain_true");
  }
  if (input.command.guardEffects.blocksSocialPosting !== true) {
    errors.push("blocks_social_posting_must_remain_true");
  }
  if (guardStatus === "review_ready_only") {
    warnings.push("review_ready_only_is_not_approved");
  }
  warnings.push("approved_is_not_published");
  warnings.push("publish_ready_is_not_published");
  warnings.push("publish_guard_does_not_upload_or_schedule");

  const normalizedCommand: VoxyRenderPublishReadinessGuardCommand = {
    ...input.command,
    publishReadinessGuardId: input.command.publishReadinessGuardId ?? null,
    previewOutcomeHandoffId,
    previewReviewDecisionRecordId,
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
    guardStatus,
    guardEffects: buildVoxyRenderPublishReadinessEffects(),
    executionFlags: buildVoxyRenderPublishReadinessExecutionFlags(),
    topBlockers: Array.from(new Set((input.command.topBlockers ?? []).map(normalizeText).filter(Boolean))),
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
    } satisfies VoxyRenderPublishReadinessStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizedCommand.reviewerRef?.id ?? null;
  const idempotencyKey = buildIdempotencyKey({
    previewOutcomeHandoffId,
    previewReviewDecisionRecordId,
    guardStatus,
    reviewerRefId: persistedBy,
  });

  const record: VoxyRenderPublishReadinessGuardRecord = {
    ...normalizedCommand,
    publishReadinessGuardId:
      normalizedCommand.publishReadinessGuardId ??
      buildGuardRecordId({
        previewOutcomeHandoffId,
        previewReviewDecisionRecordId,
        guardStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey,
    previousPublishReadinessGuardRef: latestRecord?.publishReadinessGuardId ?? null,
    supersedesPublishReadinessGuardRef: null,
    guardVersion: (latestRecord?.guardVersion ?? 0) + 1,
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
  } satisfies VoxyRenderPublishReadinessStoreResult;
}

export async function appendVoxyRenderPublishReadinessAuditEvent(input: {
  record: VoxyRenderPublishReadinessGuardRecord;
  byUserId?: string | null;
  note?: string | null;
}) {
  const repo = getRepository();
  const at = nowIso();
  const event: VoxyRenderPublishReadinessAuditEvent = {
    id: buildAuditId({
      publishReadinessGuardId: input.record.publishReadinessGuardId,
      previewOutcomeHandoffId: input.record.previewOutcomeHandoffId ?? null,
      at,
    }),
    publishReadinessGuardId: input.record.publishReadinessGuardId,
    previewOutcomeHandoffId: input.record.previewOutcomeHandoffId ?? null,
    previewReviewDecisionRecordId: input.record.previewReviewDecisionRecordId ?? null,
    previewReviewFlowId: input.record.previewReviewFlowId ?? null,
    action: "publish_readiness_guard_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at,
    guardStatus: input.record.guardStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousPublishReadinessGuardRef: input.record.previousPublishReadinessGuardRef ?? null,
  };
  return repo.appendAuditEvent(event);
}

