import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderSocialDistributionEffects,
  VoxyRenderSocialDistributionExecutionFlags,
  VoxyRenderSocialDistributionHandoffCommand,
  VoxyRenderSocialDistributionHandoffRecord,
  VoxyRenderSocialDistributionPersistenceState,
  VoxyRenderSocialDistributionStoreResult,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  buildVoxyRenderSocialDistributionEffects,
  buildVoxyRenderSocialDistributionExecutionFlags,
  deriveVoxyRenderSocialDistributionHandoffStatus,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_AUDIT_ACTIONS = [
  "social_distribution_handoff_recorded",
] as const;

export type VoxyRenderSocialDistributionAuditAction =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_AUDIT_ACTIONS)[number];

export type VoxyRenderSocialDistributionAuditEvent = {
  id: string;
  socialDistributionHandoffId: string;
  publishReadinessGuardId: string | null;
  previewOutcomeHandoffId: string | null;
  previewReviewDecisionRecordId: string | null;
  previewReviewFlowId: string | null;
  action: VoxyRenderSocialDistributionAuditAction;
  byUserId: string | null;
  at: string;
  handoffStatus: VoxyRenderSocialDistributionHandoffRecord["handoffStatus"];
  nextStep: VoxyRenderSocialDistributionHandoffRecord["nextStep"];
  summary: string;
  note: string | null;
  previousSocialDistributionHandoffRef: string | null;
};

export type VoxyRenderSocialDistributionHandoffListParams = {
  publishReadinessGuardId?: string | null;
  publishReadinessGuardIds?: string[];
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderSocialDistributionAuditListParams = {
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  socialDistributionHandoffId?: string | null;
  limit?: number;
};

export type VoxyRenderSocialDistributionHandoffRepository = {
  saveRecord(
    record: VoxyRenderSocialDistributionHandoffRecord,
  ): Promise<VoxyRenderSocialDistributionHandoffRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderSocialDistributionHandoffListParams,
      | "publishReadinessGuardId"
      | "previewOutcomeHandoffId"
      | "previewReviewDecisionRecordId"
      | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderSocialDistributionHandoffRecord | null>;
  listRecords(
    params?: VoxyRenderSocialDistributionHandoffListParams,
  ): Promise<VoxyRenderSocialDistributionHandoffRecord[]>;
  appendAuditEvent(
    event: VoxyRenderSocialDistributionAuditEvent,
  ): Promise<VoxyRenderSocialDistributionAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderSocialDistributionAuditListParams,
  ): Promise<VoxyRenderSocialDistributionAuditEvent[]>;
  getPersistenceState(): VoxyRenderSocialDistributionPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_social_distribution_handoff_records";
const AUDIT_COLLECTION = "voxy_render_social_distribution_handoff_audits";

let repoSingleton: VoxyRenderSocialDistributionHandoffRepository | null = null;
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

function normalizeIds(values: string[] | undefined): string[] {
  return Array.from(new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []));
}

function normalizeRef(
  ref: VoxyRenderSocialDistributionHandoffCommand["scriptRef"],
): VoxyRenderSocialDistributionHandoffCommand["scriptRef"] {
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
  value: VoxyRenderSocialDistributionExecutionFlags,
): VoxyRenderSocialDistributionExecutionFlags {
  return {
    ...buildVoxyRenderSocialDistributionExecutionFlags(),
    ...value,
    publishAllowed: false,
    uploadAllowed: false,
    schedulingAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
    platformApiCallAllowed: false,
    previewRendered: false,
    renderAllowed: false,
    rerenderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    mediaFileCreationAllowed: false,
    previewFileAvailable: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function forceBlockingEffects(
  value: VoxyRenderSocialDistributionEffects,
): VoxyRenderSocialDistributionEffects {
  return {
    ...buildVoxyRenderSocialDistributionEffects(),
    ...value,
    blocksUpload: true,
    blocksScheduling: true,
    blocksSocialPosting: true,
    blocksPublish: true,
    createsUpload: false,
    createsSchedule: false,
    createsSocialPost: false,
    triggersPublish: false,
    createsRenderJob: false,
    triggersRerender: false,
    triggersProvider: false,
    createsQueueJob: false,
    createsMediaFile: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderSocialDistributionPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Social-Distribution-Handoff-Store"
      : "In-Memory-Fallback für Social-Distribution-Handoff-Store",
    summary: persistent
      ? "Social-Distribution-Handoffs und Audit-Spuren werden getrennt von Upload, Scheduling, Social Posting und Veröffentlichung gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Social-Distribution-Handoffs leben pro Prozess und sind keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderSocialDistributionHandoffRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  publishReadinessGuardId: string | null;
  previewOutcomeHandoffId: string | null;
  handoffStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-social-distribution-handoff-idempotency:${stableHash(
    [
      input.publishReadinessGuardId ?? "",
      input.previewOutcomeHandoffId ?? "",
      input.handoffStatus,
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildRecordId(input: {
  publishReadinessGuardId: string | null;
  previewOutcomeHandoffId: string | null;
  handoffStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-social-distribution-handoff:${stableHash(
    [
      input.publishReadinessGuardId ?? "",
      input.previewOutcomeHandoffId ?? "",
      input.handoffStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  socialDistributionHandoffId: string;
  publishReadinessGuardId: string | null;
  at: string;
}) {
  return `voxy-render-social-distribution-handoff-audit:${stableHash(
    `${input.socialDistributionHandoffId}:${input.publishReadinessGuardId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ publishReadinessGuardId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewOutcomeHandoffId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewDecisionRecordId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ publishReadinessGuardId: 1, at: -1 }),
    auditsCol.createIndex({ previewOutcomeHandoffId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewDecisionRecordId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderSocialDistributionHandoffRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.socialDistributionHandoffId },
        {
          $set: {
            _id: record.socialDistributionHandoffId,
            record: clone(record),
            publishReadinessGuardId: record.publishReadinessGuardId,
            previewOutcomeHandoffId: record.previewOutcomeHandoffId,
            previewReviewDecisionRecordId: record.previewReviewDecisionRecordId,
            previewReviewFlowId: record.previewReviewFlowId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            handoffStatus: record.handoffStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            handoffVersion: record.handoffVersion,
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
      const publishReadinessGuardId = normalizeOptionalString(params?.publishReadinessGuardId);
      const publishReadinessGuardIds = normalizeIds(params?.publishReadinessGuardIds);
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (publishReadinessGuardId) filter.publishReadinessGuardId = publishReadinessGuardId;
      if (publishReadinessGuardIds.length > 0) {
        filter.publishReadinessGuardId = { $in: publishReadinessGuardIds };
      }
      if (previewOutcomeHandoffId) filter.previewOutcomeHandoffId = previewOutcomeHandoffId;
      if (previewReviewDecisionRecordId) {
        filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;

      const docs = await col
        .find(filter)
        .sort({ persistedAt: -1, socialDistributionHandoffId: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderSocialDistributionHandoffRecord))
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
            publishReadinessGuardId: event.publishReadinessGuardId,
            previewOutcomeHandoffId: event.previewOutcomeHandoffId,
            previewReviewDecisionRecordId: event.previewReviewDecisionRecordId,
            previewReviewFlowId: event.previewReviewFlowId,
            socialDistributionHandoffId: event.socialDistributionHandoffId,
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
      const publishReadinessGuardId = normalizeOptionalString(params?.publishReadinessGuardId);
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const socialDistributionHandoffId = normalizeOptionalString(
        params?.socialDistributionHandoffId,
      );
      if (publishReadinessGuardId) filter.publishReadinessGuardId = publishReadinessGuardId;
      if (previewOutcomeHandoffId) filter.previewOutcomeHandoffId = previewOutcomeHandoffId;
      if (previewReviewDecisionRecordId) {
        filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (socialDistributionHandoffId) {
        filter.socialDistributionHandoffId = socialDistributionHandoffId;
      }
      const docs = await col
        .find(filter)
        .sort({ at: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.event as VoxyRenderSocialDistributionAuditEvent))
        .filter(Boolean);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderSocialDistributionHandoffRepository(seed?: {
  records?: VoxyRenderSocialDistributionHandoffRecord[];
  auditEvents?: VoxyRenderSocialDistributionAuditEvent[];
}): VoxyRenderSocialDistributionHandoffRepository {
  const records = [...(seed?.records ?? [])];
  const auditEvents = [...(seed?.auditEvents ?? [])];

  return {
    async saveRecord(record) {
      const next = clone(record);
      const existingIndex = records.findIndex(
        (item) => item.socialDistributionHandoffId === record.socialDistributionHandoffId,
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
      const publishReadinessGuardId = normalizeOptionalString(params?.publishReadinessGuardId);
      const publishReadinessGuardIds = normalizeIds(params?.publishReadinessGuardIds);
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      return records
        .filter((record) => {
          if (
            publishReadinessGuardId &&
            record.publishReadinessGuardId !== publishReadinessGuardId
          ) {
            return false;
          }
          if (
            publishReadinessGuardIds.length > 0 &&
            !publishReadinessGuardIds.includes(
              normalizeOptionalString(record.publishReadinessGuardId) ?? "",
            )
          ) {
            return false;
          }
          if (
            previewOutcomeHandoffId &&
            record.previewOutcomeHandoffId !== previewOutcomeHandoffId
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
            normalizeOptionalString(params?.publishReadinessGuardId) &&
            event.publishReadinessGuardId !== normalizeOptionalString(params?.publishReadinessGuardId)
          ) {
            return false;
          }
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
            normalizeOptionalString(params?.socialDistributionHandoffId) &&
            event.socialDistributionHandoffId !==
              normalizeOptionalString(params?.socialDistributionHandoffId)
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
    ? createInMemoryVoxyRenderSocialDistributionHandoffRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderSocialDistributionHandoffRepositoryForTests(
  repo: VoxyRenderSocialDistributionHandoffRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderSocialDistributionPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderSocialDistributionHandoffRecords(
  params?: VoxyRenderSocialDistributionHandoffListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderSocialDistributionHandoffRecord(
  params: Pick<
    VoxyRenderSocialDistributionHandoffListParams,
    | "publishReadinessGuardId"
    | "previewOutcomeHandoffId"
    | "previewReviewDecisionRecordId"
    | "previewReviewFlowId"
  >,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderSocialDistributionHandoffsByPublishReadinessGuardIds(
  publishReadinessGuardIds: string[],
) {
  const normalized = normalizeIds(publishReadinessGuardIds);
  if (normalized.length === 0) {
    return new Map<string, VoxyRenderSocialDistributionHandoffRecord>();
  }
  const records = await getRepository().listRecords({
    publishReadinessGuardIds: normalized,
    limit: normalized.length * 5,
  });
  const result = new Map<string, VoxyRenderSocialDistributionHandoffRecord>();
  for (const record of records) {
    const key = normalizeOptionalString(record.publishReadinessGuardId);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

export async function listVoxyRenderSocialDistributionAuditEvents(
  params?: VoxyRenderSocialDistributionAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderSocialDistributionHandoff(input: {
  command: VoxyRenderSocialDistributionHandoffCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const publishReadinessGuardId = normalizeOptionalString(input.command.publishReadinessGuardId);
  const previewOutcomeHandoffId = normalizeOptionalString(input.command.previewOutcomeHandoffId);
  const previewReviewDecisionRecordId = normalizeOptionalString(
    input.command.previewReviewDecisionRecordId,
  );
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord =
    publishReadinessGuardId || previewOutcomeHandoffId || previewReviewDecisionRecordId
      ? await repo.getLatestRecord({
          publishReadinessGuardId,
          previewOutcomeHandoffId,
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : null;

  const handoffStatus = deriveVoxyRenderSocialDistributionHandoffStatus({
    publishReadinessGuardId,
    publishGuardStatusHint: input.command.publishGuardStatusHint ?? null,
    previewOutcomeTypeHint: input.command.previewOutcomeTypeHint ?? null,
    reviewGate: null,
    mediaGate: input.command.publishGuardStatusHint === "media_required" ? { status: "no_go" } : null,
    uploadGate:
      input.command.publishGuardStatusHint === "upload_blocked" ? { status: "no_go" } : null,
    schedulingGate:
      input.command.publishGuardStatusHint === "scheduling_blocked"
        ? { status: "no_go" }
        : null,
    socialPostingGate:
      input.command.publishGuardStatusHint === "social_posting_blocked"
        ? { status: "no_go" }
        : null,
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!publishReadinessGuardId) {
    errors.push("publish_readiness_guard_required");
  }
  if (input.command.distributionSemantics.publishReady !== false) {
    errors.push("publish_ready_must_remain_false");
  }
  if (input.command.distributionSemantics.published !== false) {
    errors.push("published_must_remain_false");
  }
  if (input.command.distributionSemantics.uploaded !== false) {
    errors.push("uploaded_must_remain_false");
  }
  if (input.command.distributionSemantics.scheduled !== false) {
    errors.push("scheduled_must_remain_false");
  }
  if (input.command.distributionSemantics.socialPosted !== false) {
    errors.push("social_posted_must_remain_false");
  }
  if (input.command.distributionSemantics.platformApiCalled !== false) {
    errors.push("platform_api_called_must_remain_false");
  }
  if (input.command.distributionSemantics.autoPublishAllowed !== false) {
    errors.push("auto_publish_must_remain_false");
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
  if (input.command.guardEffects.blocksPublish !== true) {
    errors.push("blocks_publish_must_remain_true");
  }
  for (const candidate of input.command.platformCandidates) {
    if (candidate.platformApiCallAllowed !== false) {
      errors.push(`platform_api_call_not_allowed:${candidate.platform}`);
    }
    if (candidate.uploadAllowed !== false) {
      errors.push(`platform_upload_not_allowed:${candidate.platform}`);
    }
    if (candidate.postAllowed !== false) {
      errors.push(`platform_post_not_allowed:${candidate.platform}`);
    }
    if (candidate.scheduleAllowed !== false) {
      errors.push(`platform_schedule_not_allowed:${candidate.platform}`);
    }
  }
  for (const copyVariant of input.command.copyVariants) {
    if (copyVariant.posted !== false) {
      errors.push(`copy_variant_posted_must_remain_false:${copyVariant.variantId}`);
    }
    if (copyVariant.scheduled !== false) {
      errors.push(`copy_variant_scheduled_must_remain_false:${copyVariant.variantId}`);
    }
    if (copyVariant.platformApiCallAllowed !== false) {
      errors.push(`copy_variant_api_not_allowed:${copyVariant.variantId}`);
    }
  }
  if (input.command.scheduleCandidate.scheduled !== false) {
    errors.push("schedule_candidate_scheduled_must_remain_false");
  }
  if (input.command.scheduleCandidate.schedulingAllowed !== false) {
    errors.push("schedule_candidate_scheduling_not_allowed");
  }

  warnings.push("distribution_handoff_is_not_social_post");
  warnings.push("platform_candidate_is_not_platform_api_call");
  warnings.push("schedule_candidate_is_not_scheduled");
  warnings.push("publish_ready_is_not_published");

  const normalizedCommand: VoxyRenderSocialDistributionHandoffCommand = {
    ...input.command,
    socialDistributionHandoffId: input.command.socialDistributionHandoffId ?? null,
    publishReadinessGuardId,
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
    handoffStatus,
    guardEffects: forceBlockingEffects(input.command.guardEffects),
    executionFlags: forceFalseExecutionFlags(input.command.executionFlags),
    topBlockers: Array.from(
      new Set((input.command.topBlockers ?? []).map(normalizeText).filter(Boolean)),
    ),
    userVisibleSummary: normalizeText(input.command.userVisibleSummary),
    reviewerVisibleSummary: normalizeText(input.command.reviewerVisibleSummary),
    platformCandidates: input.command.platformCandidates.map((candidate) => ({
      ...candidate,
      label: normalizeText(candidate.label),
      reviewerVisibleReason: normalizeText(candidate.reviewerVisibleReason),
      userVisibleReason: normalizeText(candidate.userVisibleReason),
      platformApiCallAllowed: false,
      uploadAllowed: false,
      postAllowed: false,
      scheduleAllowed: false,
    })),
    copyVariants: input.command.copyVariants.map((variant) => ({
      ...variant,
      label: normalizeText(variant.label),
      headline: normalizeOptionalString(variant.headline),
      body: normalizeOptionalString(variant.body),
      hashtags: Array.from(new Set((variant.hashtags ?? []).map(normalizeText).filter(Boolean))),
      cta: normalizeOptionalString(variant.cta),
      posted: false,
      scheduled: false,
      platformApiCallAllowed: false,
    })),
    scheduleCandidate: {
      ...input.command.scheduleCandidate,
      scheduleCandidateId: normalizeOptionalString(input.command.scheduleCandidate.scheduleCandidateId),
      suggestedWindow: normalizeOptionalString(input.command.scheduleCandidate.suggestedWindow),
      reviewerVisibleReason: normalizeText(input.command.scheduleCandidate.reviewerVisibleReason),
      userVisibleReason: normalizeText(input.command.scheduleCandidate.userVisibleReason),
      scheduled: false,
      schedulingAllowed: false,
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
    } satisfies VoxyRenderSocialDistributionStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizedCommand.reviewerRef?.id ?? null;
  const idempotencyKey = buildIdempotencyKey({
    publishReadinessGuardId,
    previewOutcomeHandoffId,
    handoffStatus,
    reviewerRefId: persistedBy,
  });

  const record: VoxyRenderSocialDistributionHandoffRecord = {
    ...normalizedCommand,
    socialDistributionHandoffId:
      normalizedCommand.socialDistributionHandoffId ??
      buildRecordId({
        publishReadinessGuardId,
        previewOutcomeHandoffId,
        handoffStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey,
    previousSocialDistributionHandoffRef: latestRecord?.socialDistributionHandoffId ?? null,
    supersedesSocialDistributionHandoffRef: null,
    handoffVersion: (latestRecord?.handoffVersion ?? 0) + 1,
  };

  await repo.saveRecord(record);

  const resultStatus =
    persistence.mode === "persistent_primary"
      ? "persisted"
      : handoffStatus === "social_distribution_handoff_only" ||
          handoffStatus === "not_distribution_ready"
        ? "noop"
        : "preview_only";

  return {
    ok: true,
    status: resultStatus,
    record,
    warnings,
    errors: [],
    idempotencyKey,
    nextStep: record.nextStep,
  } satisfies VoxyRenderSocialDistributionStoreResult;
}

export async function appendVoxyRenderSocialDistributionAuditEvent(input: {
  socialDistributionHandoffId: string;
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  byUserId?: string | null;
  handoffStatus: VoxyRenderSocialDistributionHandoffRecord["handoffStatus"];
  nextStep: VoxyRenderSocialDistributionHandoffRecord["nextStep"];
  summary: string;
  note?: string | null;
  previousSocialDistributionHandoffRef?: string | null;
}) {
  const event: VoxyRenderSocialDistributionAuditEvent = {
    id: buildAuditId({
      socialDistributionHandoffId: input.socialDistributionHandoffId,
      publishReadinessGuardId: normalizeOptionalString(input.publishReadinessGuardId),
      at: nowIso(),
    }),
    socialDistributionHandoffId: input.socialDistributionHandoffId,
    publishReadinessGuardId: normalizeOptionalString(input.publishReadinessGuardId),
    previewOutcomeHandoffId: normalizeOptionalString(input.previewOutcomeHandoffId),
    previewReviewDecisionRecordId: normalizeOptionalString(input.previewReviewDecisionRecordId),
    previewReviewFlowId: normalizeOptionalString(input.previewReviewFlowId),
    action: "social_distribution_handoff_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at: nowIso(),
    handoffStatus: input.handoffStatus,
    nextStep: input.nextStep,
    summary: normalizeText(input.summary),
    note: normalizeOptionalString(input.note),
    previousSocialDistributionHandoffRef: normalizeOptionalString(
      input.previousSocialDistributionHandoffRef,
    ),
  };
  await getRepository().appendAuditEvent(event);
  return event;
}
