import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderApprovalEffects,
  VoxyRenderApprovalExecutionFlags,
  VoxyRenderApprovalPersistenceState,
  VoxyRenderApprovalSemanticsCommand,
  VoxyRenderApprovalSemanticsRecord,
  VoxyRenderApprovalStoreResult,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  buildVoxyRenderApprovalEffects,
  buildVoxyRenderApprovalExecutionFlags,
  deriveVoxyRenderApprovalSemanticsStatus,
} from "@/features/create/voxyRenderApprovalSemanticsContract";

export const VOXY_RENDER_APPROVAL_AUDIT_ACTIONS = [
  "approval_semantics_recorded",
] as const;

export type VoxyRenderApprovalAuditAction =
  (typeof VOXY_RENDER_APPROVAL_AUDIT_ACTIONS)[number];

export type VoxyRenderApprovalAuditEvent = {
  id: string;
  approvalSemanticsId: string;
  socialDistributionHandoffId: string | null;
  publishReadinessGuardId: string | null;
  previewOutcomeHandoffId: string | null;
  previewReviewDecisionRecordId: string | null;
  previewReviewFlowId: string | null;
  action: VoxyRenderApprovalAuditAction;
  byUserId: string | null;
  at: string;
  approvalStatus: VoxyRenderApprovalSemanticsRecord["approvalStatus"];
  nextStep: VoxyRenderApprovalSemanticsRecord["nextStep"];
  summary: string;
  note: string | null;
  previousApprovalSemanticsRef: string | null;
};

export type VoxyRenderApprovalSemanticsListParams = {
  socialDistributionHandoffId?: string | null;
  socialDistributionHandoffIds?: string[];
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderApprovalAuditListParams = {
  approvalSemanticsId?: string | null;
  socialDistributionHandoffId?: string | null;
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  limit?: number;
};

export type VoxyRenderApprovalSemanticsRepository = {
  saveRecord(
    record: VoxyRenderApprovalSemanticsRecord,
  ): Promise<VoxyRenderApprovalSemanticsRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderApprovalSemanticsListParams,
      | "socialDistributionHandoffId"
      | "publishReadinessGuardId"
      | "previewOutcomeHandoffId"
      | "previewReviewDecisionRecordId"
      | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderApprovalSemanticsRecord | null>;
  listRecords(
    params?: VoxyRenderApprovalSemanticsListParams,
  ): Promise<VoxyRenderApprovalSemanticsRecord[]>;
  appendAuditEvent(
    event: VoxyRenderApprovalAuditEvent,
  ): Promise<VoxyRenderApprovalAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderApprovalAuditListParams,
  ): Promise<VoxyRenderApprovalAuditEvent[]>;
  getPersistenceState(): VoxyRenderApprovalPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_approval_semantics_records";
const AUDIT_COLLECTION = "voxy_render_approval_semantics_audits";

let repoSingleton: VoxyRenderApprovalSemanticsRepository | null = null;
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
  return Array.from(
    new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []),
  );
}

function normalizeRef(
  ref: VoxyRenderApprovalSemanticsCommand["scriptRef"],
): VoxyRenderApprovalSemanticsCommand["scriptRef"] {
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
  value: VoxyRenderApprovalExecutionFlags,
): VoxyRenderApprovalExecutionFlags {
  return {
    ...buildVoxyRenderApprovalExecutionFlags(),
    ...value,
    approvalExecutionAllowed: false,
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

function forceNoopEffects(value: VoxyRenderApprovalEffects): VoxyRenderApprovalEffects {
  return {
    ...buildVoxyRenderApprovalEffects(),
    ...value,
    marksApproved: false,
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
): VoxyRenderApprovalPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Approval-Semantik-Store"
      : "In-Memory-Fallback für Approval-Semantik-Store",
    summary: persistent
      ? "Approval-Semantik und Audit-Spuren werden getrennt von Upload, Scheduling, Social Posting und Veröffentlichung gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Approval-Semantik lebt pro Prozess und ist keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderApprovalSemanticsRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  socialDistributionHandoffId: string | null;
  publishReadinessGuardId: string | null;
  approvalStatus: string;
  reviewerRefId: string | null;
}) {
  return `voxy-render-approval-semantics-idempotency:${stableHash(
    [
      input.socialDistributionHandoffId ?? "",
      input.publishReadinessGuardId ?? "",
      input.approvalStatus,
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildRecordId(input: {
  socialDistributionHandoffId: string | null;
  publishReadinessGuardId: string | null;
  approvalStatus: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-approval-semantics:${stableHash(
    [
      input.socialDistributionHandoffId ?? "",
      input.publishReadinessGuardId ?? "",
      input.approvalStatus,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  approvalSemanticsId: string;
  socialDistributionHandoffId: string | null;
  at: string;
}) {
  return `voxy-render-approval-semantics-audit:${stableHash(
    `${input.approvalSemanticsId}:${input.socialDistributionHandoffId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ socialDistributionHandoffId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ publishReadinessGuardId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewOutcomeHandoffId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewDecisionRecordId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ socialDistributionHandoffId: 1, at: -1 }),
    auditsCol.createIndex({ publishReadinessGuardId: 1, at: -1 }),
    auditsCol.createIndex({ previewOutcomeHandoffId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewDecisionRecordId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderApprovalSemanticsRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.approvalSemanticsId },
        {
          $set: {
            _id: record.approvalSemanticsId,
            record: clone(record),
            socialDistributionHandoffId: record.socialDistributionHandoffId,
            publishReadinessGuardId: record.publishReadinessGuardId,
            previewOutcomeHandoffId: record.previewOutcomeHandoffId,
            previewReviewDecisionRecordId: record.previewReviewDecisionRecordId,
            previewReviewFlowId: record.previewReviewFlowId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            approvalStatus: record.approvalStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            approvalVersion: record.approvalVersion,
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
      const socialDistributionHandoffId = normalizeOptionalString(
        params?.socialDistributionHandoffId,
      );
      const socialDistributionHandoffIds = normalizeIds(
        params?.socialDistributionHandoffIds,
      );
      const publishReadinessGuardId = normalizeOptionalString(
        params?.publishReadinessGuardId,
      );
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (socialDistributionHandoffId) {
        filter.socialDistributionHandoffId = socialDistributionHandoffId;
      }
      if (socialDistributionHandoffIds.length > 0) {
        filter.socialDistributionHandoffId = { $in: socialDistributionHandoffIds };
      }
      if (publishReadinessGuardId) filter.publishReadinessGuardId = publishReadinessGuardId;
      if (previewOutcomeHandoffId) filter.previewOutcomeHandoffId = previewOutcomeHandoffId;
      if (previewReviewDecisionRecordId) {
        filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const docs = await col
        .find(filter)
        .sort({ persistedAt: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderApprovalSemanticsRecord))
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
            socialDistributionHandoffId: event.socialDistributionHandoffId,
            publishReadinessGuardId: event.publishReadinessGuardId,
            previewOutcomeHandoffId: event.previewOutcomeHandoffId,
            previewReviewDecisionRecordId: event.previewReviewDecisionRecordId,
            previewReviewFlowId: event.previewReviewFlowId,
            approvalSemanticsId: event.approvalSemanticsId,
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
      const approvalSemanticsId = normalizeOptionalString(params?.approvalSemanticsId);
      const socialDistributionHandoffId = normalizeOptionalString(
        params?.socialDistributionHandoffId,
      );
      const publishReadinessGuardId = normalizeOptionalString(
        params?.publishReadinessGuardId,
      );
      const previewOutcomeHandoffId = normalizeOptionalString(params?.previewOutcomeHandoffId);
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      if (approvalSemanticsId) filter.approvalSemanticsId = approvalSemanticsId;
      if (socialDistributionHandoffId) {
        filter.socialDistributionHandoffId = socialDistributionHandoffId;
      }
      if (publishReadinessGuardId) filter.publishReadinessGuardId = publishReadinessGuardId;
      if (previewOutcomeHandoffId) filter.previewOutcomeHandoffId = previewOutcomeHandoffId;
      if (previewReviewDecisionRecordId) {
        filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      const docs = await col
        .find(filter)
        .sort({ at: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.event as VoxyRenderApprovalAuditEvent))
        .filter(Boolean);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderApprovalSemanticsRepository(seed?: {
  records?: VoxyRenderApprovalSemanticsRecord[];
  auditEvents?: VoxyRenderApprovalAuditEvent[];
}): VoxyRenderApprovalSemanticsRepository {
  const records = [...(seed?.records ?? [])];
  const auditEvents = [...(seed?.auditEvents ?? [])];

  return {
    async saveRecord(record) {
      const next = clone(record);
      const existingIndex = records.findIndex(
        (item) => item.approvalSemanticsId === record.approvalSemanticsId,
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
      const socialDistributionHandoffId = normalizeOptionalString(
        params?.socialDistributionHandoffId,
      );
      const socialDistributionHandoffIds = normalizeIds(
        params?.socialDistributionHandoffIds,
      );
      const publishReadinessGuardId = normalizeOptionalString(
        params?.publishReadinessGuardId,
      );
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
            socialDistributionHandoffId &&
            record.socialDistributionHandoffId !== socialDistributionHandoffId
          ) {
            return false;
          }
          if (
            socialDistributionHandoffIds.length > 0 &&
            !socialDistributionHandoffIds.includes(
              normalizeOptionalString(record.socialDistributionHandoffId) ?? "",
            )
          ) {
            return false;
          }
          if (
            publishReadinessGuardId &&
            record.publishReadinessGuardId !== publishReadinessGuardId
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
            normalizeOptionalString(params?.approvalSemanticsId) &&
            event.approvalSemanticsId !== normalizeOptionalString(params?.approvalSemanticsId)
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
          if (
            normalizeOptionalString(params?.publishReadinessGuardId) &&
            event.publishReadinessGuardId !==
              normalizeOptionalString(params?.publishReadinessGuardId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.previewOutcomeHandoffId) &&
            event.previewOutcomeHandoffId !==
              normalizeOptionalString(params?.previewOutcomeHandoffId)
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
    ? createInMemoryVoxyRenderApprovalSemanticsRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderApprovalSemanticsRepositoryForTests(
  repo: VoxyRenderApprovalSemanticsRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderApprovalPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderApprovalSemanticsRecords(
  params?: VoxyRenderApprovalSemanticsListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderApprovalSemanticsRecord(
  params: Pick<
    VoxyRenderApprovalSemanticsListParams,
    | "socialDistributionHandoffId"
    | "publishReadinessGuardId"
    | "previewOutcomeHandoffId"
    | "previewReviewDecisionRecordId"
    | "previewReviewFlowId"
  >,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderApprovalSemanticsBySocialDistributionHandoffIds(
  socialDistributionHandoffIds: string[],
) {
  const normalized = normalizeIds(socialDistributionHandoffIds);
  if (normalized.length === 0) {
    return new Map<string, VoxyRenderApprovalSemanticsRecord>();
  }
  const records = await getRepository().listRecords({
    socialDistributionHandoffIds: normalized,
    limit: normalized.length * 5,
  });
  const result = new Map<string, VoxyRenderApprovalSemanticsRecord>();
  for (const record of records) {
    const key = normalizeOptionalString(record.socialDistributionHandoffId);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

export async function listVoxyRenderApprovalAuditEvents(
  params?: VoxyRenderApprovalAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderApprovalSemantics(input: {
  command: VoxyRenderApprovalSemanticsCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const socialDistributionHandoffId = normalizeOptionalString(
    input.command.socialDistributionHandoffId,
  );
  const publishReadinessGuardId = normalizeOptionalString(
    input.command.publishReadinessGuardId,
  );
  const previewOutcomeHandoffId = normalizeOptionalString(input.command.previewOutcomeHandoffId);
  const previewReviewDecisionRecordId = normalizeOptionalString(
    input.command.previewReviewDecisionRecordId,
  );
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord =
    socialDistributionHandoffId ||
    publishReadinessGuardId ||
    previewOutcomeHandoffId ||
    previewReviewDecisionRecordId ||
    previewReviewFlowId
      ? await repo.getLatestRecord({
          socialDistributionHandoffId,
          publishReadinessGuardId,
          previewOutcomeHandoffId,
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : null;

  const approvalStatus = deriveVoxyRenderApprovalSemanticsStatus({
    socialDistributionHandoffId,
    publishGuardStatusHint: input.command.publishGuardStatusHint ?? null,
    socialDistributionStatusHint: input.command.socialDistributionStatusHint ?? null,
    previewOutcomeTypeHint: input.command.previewOutcomeTypeHint ?? null,
    reviewReady: input.command.approvalSemantics.reviewReady,
    approvalCandidate: input.command.approvalSemantics.approvalCandidate,
    mediaGate: input.command.mediaGate,
    humanApprovalGate: input.command.humanApprovalGate,
    publishGuardGate: input.command.publishGuardGate,
    runtimeGate: input.command.runtimeGate,
    approverRef: input.command.approverRef ?? null,
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!socialDistributionHandoffId) {
    errors.push("social_distribution_handoff_required");
  }
  if (input.command.approvalSemantics.publishReady !== false) {
    errors.push("publish_ready_must_remain_false");
  }
  if (input.command.approvalSemantics.approved !== false) {
    errors.push("approved_must_remain_false");
  }
  if (input.command.approvalSemantics.uploaded !== false) {
    errors.push("uploaded_must_remain_false");
  }
  if (input.command.approvalSemantics.scheduled !== false) {
    errors.push("scheduled_must_remain_false");
  }
  if (input.command.approvalSemantics.socialPosted !== false) {
    errors.push("social_posted_must_remain_false");
  }
  if (input.command.approvalSemantics.published !== false) {
    errors.push("published_must_remain_false");
  }
  if (input.command.approvalSemantics.autoPublishAllowed !== false) {
    errors.push("auto_publish_must_remain_false");
  }
  if (input.command.approvalCandidate.approvalAllowed !== false) {
    errors.push("approval_allowed_must_remain_false");
  }
  if (input.command.approvalCandidate.approved !== false) {
    errors.push("approval_candidate_approved_must_remain_false");
  }
  if (input.command.approvalEffects.marksApproved !== false) {
    errors.push("marks_approved_must_remain_false");
  }
  if (input.command.executionFlags.approvalExecutionAllowed !== false) {
    errors.push("approval_execution_must_remain_false");
  }
  warnings.push("review_ready_is_not_approved");
  warnings.push("approval_candidate_is_not_approved");
  warnings.push("approved_is_not_uploaded_or_published");
  warnings.push("approval_semantics_does_not_upload_schedule_or_post");

  const normalizedCommand: VoxyRenderApprovalSemanticsCommand = {
    ...input.command,
    approvalSemanticsId: input.command.approvalSemanticsId ?? null,
    socialDistributionHandoffId,
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
    approverRef: normalizeRef(input.command.approverRef),
    createdAt: normalizeOptionalString(input.command.createdAt),
    updatedAt: normalizeOptionalString(input.command.updatedAt),
    approvalStatus,
    approvalEffects: forceNoopEffects(input.command.approvalEffects),
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
    } satisfies VoxyRenderApprovalStoreResult;
  }

  const persistedAt = nowIso();
  const persistedBy = normalizedCommand.reviewerRef?.id ?? null;
  const idempotencyKey = buildIdempotencyKey({
    socialDistributionHandoffId,
    publishReadinessGuardId,
    approvalStatus,
    reviewerRefId: persistedBy,
  });

  const record: VoxyRenderApprovalSemanticsRecord = {
    ...normalizedCommand,
    approvalSemanticsId:
      normalizedCommand.approvalSemanticsId ??
      buildRecordId({
        socialDistributionHandoffId,
        publishReadinessGuardId,
        approvalStatus,
        persistedAt,
        persistedBy,
      }),
    persistedAt,
    persistedBy,
    idempotencyKey,
    previousApprovalSemanticsRef: latestRecord?.approvalSemanticsId ?? null,
    supersedesApprovalSemanticsRef: null,
    approvalVersion: (latestRecord?.approvalVersion ?? 0) + 1,
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
  } satisfies VoxyRenderApprovalStoreResult;
}

export async function appendVoxyRenderApprovalAuditEvent(input: {
  record: VoxyRenderApprovalSemanticsRecord;
  byUserId?: string | null;
  note?: string | null;
}) {
  const repo = getRepository();
  const at = nowIso();
  const event: VoxyRenderApprovalAuditEvent = {
    id: buildAuditId({
      approvalSemanticsId: input.record.approvalSemanticsId,
      socialDistributionHandoffId: input.record.socialDistributionHandoffId ?? null,
      at,
    }),
    approvalSemanticsId: input.record.approvalSemanticsId,
    socialDistributionHandoffId: input.record.socialDistributionHandoffId ?? null,
    publishReadinessGuardId: input.record.publishReadinessGuardId ?? null,
    previewOutcomeHandoffId: input.record.previewOutcomeHandoffId ?? null,
    previewReviewDecisionRecordId: input.record.previewReviewDecisionRecordId ?? null,
    previewReviewFlowId: input.record.previewReviewFlowId ?? null,
    action: "approval_semantics_recorded",
    byUserId: normalizeOptionalString(input.byUserId),
    at,
    approvalStatus: input.record.approvalStatus,
    nextStep: input.record.nextStep,
    summary: input.record.reviewerVisibleSummary,
    note: normalizeOptionalString(input.note),
    previousApprovalSemanticsRef: input.record.previousApprovalSemanticsRef ?? null,
  };
  return repo.appendAuditEvent(event);
}
