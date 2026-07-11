import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderPreviewOutcomeHandoffCommand,
  VoxyRenderPreviewOutcomeHandoffPersistenceState,
  VoxyRenderPreviewOutcomeHandoffRecord,
  VoxyRenderPreviewOutcomeHandoffStoreResult,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  buildVoxyRenderPreviewOutcomeHandoffEffects,
  buildVoxyRenderPreviewOutcomeHandoffExecutionFlags,
  deriveVoxyRenderPreviewOutcomeHandoffStatus,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";

export const VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_AUDIT_ACTIONS = [
  "preview_outcome_handoff_recorded",
] as const;

export type VoxyRenderPreviewOutcomeHandoffAuditAction =
  (typeof VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_AUDIT_ACTIONS)[number];

export type VoxyRenderPreviewOutcomeHandoffAuditEvent = {
  id: string;
  outcomeHandoffId: string;
  previewReviewDecisionRecordId: string | null;
  previewReviewFlowId: string | null;
  renderDecisionId: string | null;
  action: VoxyRenderPreviewOutcomeHandoffAuditAction;
  byUserId: string | null;
  at: string;
  outcomeType: VoxyRenderPreviewOutcomeHandoffRecord["outcomeType"];
  handoffStatus: VoxyRenderPreviewOutcomeHandoffRecord["handoffStatus"];
  downstreamTarget: VoxyRenderPreviewOutcomeHandoffRecord["downstreamTarget"];
  summary: string;
  note: string | null;
  previousOutcomeHandoffRef: string | null;
};

export type VoxyRenderPreviewOutcomeHandoffRecordListParams = {
  previewReviewDecisionRecordId?: string | null;
  previewReviewDecisionRecordIds?: string[];
  previewReviewFlowId?: string | null;
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderPreviewOutcomeHandoffAuditListParams = {
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  outcomeHandoffId?: string | null;
  limit?: number;
};

export type VoxyRenderPreviewOutcomeHandoffRepository = {
  saveRecord(
    record: VoxyRenderPreviewOutcomeHandoffRecord,
  ): Promise<VoxyRenderPreviewOutcomeHandoffRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderPreviewOutcomeHandoffRecordListParams,
      "previewReviewDecisionRecordId" | "previewReviewFlowId"
    >,
  ): Promise<VoxyRenderPreviewOutcomeHandoffRecord | null>;
  listRecords(
    params?: VoxyRenderPreviewOutcomeHandoffRecordListParams,
  ): Promise<VoxyRenderPreviewOutcomeHandoffRecord[]>;
  appendAuditEvent(
    event: VoxyRenderPreviewOutcomeHandoffAuditEvent,
  ): Promise<VoxyRenderPreviewOutcomeHandoffAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderPreviewOutcomeHandoffAuditListParams,
  ): Promise<VoxyRenderPreviewOutcomeHandoffAuditEvent[]>;
  getPersistenceState(): VoxyRenderPreviewOutcomeHandoffPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_preview_outcome_handoff_records";
const AUDIT_COLLECTION = "voxy_render_preview_outcome_handoff_audits";

let repoSingleton: VoxyRenderPreviewOutcomeHandoffRepository | null = null;
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
  ref: VoxyRenderPreviewOutcomeHandoffCommand["scriptRef"],
): VoxyRenderPreviewOutcomeHandoffCommand["scriptRef"] {
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

function normalizePreviewReviewDecisionRecordIds(values: string[] | undefined): string[] {
  return Array.from(new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []));
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderPreviewOutcomeHandoffPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Preview-Outcome-Handoff-Store"
      : "In-Memory-Fallback für Preview-Outcome-Handoff-Store",
    summary: persistent
      ? "Preview-Outcome-Handoffs und Audit-Spuren werden getrennt von Render, Re-Render, Queue, Provider, Medien, Kosten und Publish gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Preview-Outcome-Handoffs leben pro Prozess und sind keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderPreviewOutcomeHandoffRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  previewReviewDecisionRecordId: string | null;
  previewReviewFlowId: string | null;
  outcomeType: string;
  downstreamTarget: string;
  reviewerComment: string | null;
  reviewerRefId: string | null;
}) {
  return `voxy-render-preview-outcome-handoff-idempotency:${stableHash(
    [
      input.previewReviewDecisionRecordId ?? "",
      input.previewReviewFlowId ?? "",
      input.outcomeType,
      input.downstreamTarget,
      input.reviewerComment ?? "",
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildOutcomeHandoffRecordId(input: {
  previewReviewDecisionRecordId: string | null;
  previewReviewFlowId: string | null;
  outcomeType: string;
  downstreamTarget: string;
  persistedAt: string;
  persistedBy: string | null;
}) {
  return `voxy-render-preview-outcome-handoff:${stableHash(
    [
      input.previewReviewDecisionRecordId ?? "",
      input.previewReviewFlowId ?? "",
      input.outcomeType,
      input.downstreamTarget,
      input.persistedAt,
      input.persistedBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  outcomeHandoffId: string;
  previewReviewDecisionRecordId: string | null;
  at: string;
}) {
  return `voxy-render-preview-outcome-handoff-audit:${stableHash(
    `${input.outcomeHandoffId}:${input.previewReviewDecisionRecordId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ previewReviewDecisionRecordId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ previewReviewDecisionRecordId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderPreviewOutcomeHandoffRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.outcomeHandoffId },
        {
          $set: {
            _id: record.outcomeHandoffId,
            record: clone(record),
            previewReviewDecisionRecordId: record.previewReviewDecisionRecordId,
            previewReviewFlowId: record.previewReviewFlowId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            outcomeType: record.outcomeType,
            handoffStatus: record.handoffStatus,
            downstreamTarget: record.downstreamTarget,
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
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const previewReviewDecisionRecordIds = normalizePreviewReviewDecisionRecordIds(
        params?.previewReviewDecisionRecordIds,
      );
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (previewReviewDecisionRecordId) filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      if (previewReviewDecisionRecordIds.length > 0) {
        filter.previewReviewDecisionRecordId = { $in: previewReviewDecisionRecordIds };
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;

      const docs = await col
        .find(filter)
        .sort({ persistedAt: -1, outcomeHandoffId: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderPreviewOutcomeHandoffRecord))
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
            previewReviewDecisionRecordId: event.previewReviewDecisionRecordId,
            previewReviewFlowId: event.previewReviewFlowId,
            outcomeHandoffId: event.outcomeHandoffId,
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
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const outcomeHandoffId = normalizeOptionalString(params?.outcomeHandoffId);
      if (previewReviewDecisionRecordId) filter.previewReviewDecisionRecordId = previewReviewDecisionRecordId;
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (outcomeHandoffId) filter.outcomeHandoffId = outcomeHandoffId;

      const docs = await col
        .find(filter)
        .sort({ at: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs
        .map((doc) => clone(doc.event as VoxyRenderPreviewOutcomeHandoffAuditEvent))
        .filter(Boolean);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderPreviewOutcomeHandoffRepository(seed?: {
  records?: VoxyRenderPreviewOutcomeHandoffRecord[];
  auditEvents?: VoxyRenderPreviewOutcomeHandoffAuditEvent[];
}): VoxyRenderPreviewOutcomeHandoffRepository {
  const records = [...(seed?.records ?? [])];
  const auditEvents = [...(seed?.auditEvents ?? [])];

  return {
    async saveRecord(record) {
      const next = clone(record);
      const existingIndex = records.findIndex((item) => item.outcomeHandoffId === record.outcomeHandoffId);
      if (existingIndex >= 0) records.splice(existingIndex, 1, next);
      else records.push(next);
      return clone(next);
    },
    async getLatestRecord(params) {
      const [record] = await this.listRecords({ ...params, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const previewReviewDecisionRecordId = normalizeOptionalString(
        params?.previewReviewDecisionRecordId,
      );
      const previewReviewDecisionRecordIds = normalizePreviewReviewDecisionRecordIds(
        params?.previewReviewDecisionRecordIds,
      );
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      return records
        .filter((record) => {
          if (
            previewReviewDecisionRecordId &&
            record.previewReviewDecisionRecordId !== previewReviewDecisionRecordId
          ) {
            return false;
          }
          if (
            previewReviewDecisionRecordIds.length > 0 &&
            !previewReviewDecisionRecordIds.includes(
              normalizeOptionalString(record.previewReviewDecisionRecordId) ?? "",
            )
          ) {
            return false;
          }
          if (previewReviewFlowId && record.previewReviewFlowId !== previewReviewFlowId) return false;
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
            normalizeOptionalString(params?.outcomeHandoffId) &&
            event.outcomeHandoffId !== normalizeOptionalString(params?.outcomeHandoffId)
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
    ? createInMemoryVoxyRenderPreviewOutcomeHandoffRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderPreviewOutcomeHandoffRepositoryForTests(
  repo: VoxyRenderPreviewOutcomeHandoffRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderPreviewOutcomeHandoffPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderPreviewOutcomeHandoffRecords(
  params?: VoxyRenderPreviewOutcomeHandoffRecordListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderPreviewOutcomeHandoffRecord(
  params: Pick<
    VoxyRenderPreviewOutcomeHandoffRecordListParams,
    "previewReviewDecisionRecordId" | "previewReviewFlowId"
  >,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderPreviewOutcomeHandoffsByPreviewReviewDecisionRecordIds(
  previewReviewDecisionRecordIds: string[],
) {
  const normalized = normalizePreviewReviewDecisionRecordIds(previewReviewDecisionRecordIds);
  if (normalized.length === 0) {
    return new Map<string, VoxyRenderPreviewOutcomeHandoffRecord>();
  }
  const records = await getRepository().listRecords({
    previewReviewDecisionRecordIds: normalized,
    limit: normalized.length * 5,
  });
  const result = new Map<string, VoxyRenderPreviewOutcomeHandoffRecord>();
  for (const record of records) {
    const key = normalizeOptionalString(record.previewReviewDecisionRecordId);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

export async function listVoxyRenderPreviewOutcomeHandoffAuditEvents(
  params?: VoxyRenderPreviewOutcomeHandoffAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderPreviewOutcomeHandoff(input: {
  command: VoxyRenderPreviewOutcomeHandoffCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const previewReviewDecisionRecordId = normalizeOptionalString(
    input.command.previewReviewDecisionRecordId,
  );
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const latestRecord =
    previewReviewDecisionRecordId || previewReviewFlowId
      ? await repo.getLatestRecord({
          previewReviewDecisionRecordId,
          previewReviewFlowId,
        })
      : null;
  const outcomeType = input.command.outcomeType;
  const downstreamTarget = input.command.downstreamTarget;
  const handoffStatus = deriveVoxyRenderPreviewOutcomeHandoffStatus({
    previewReviewDecisionRecordId,
    outcomeType,
    previewReviewDecisionStatus: input.command.previewReviewDecisionStatusHint ?? null,
  });
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!previewReviewDecisionRecordId) {
    errors.push("preview_review_decision_record_required");
  }
  if (outcomeType === "comment_only" && downstreamTarget !== "review_context") {
    errors.push("comment_only_requires_review_context_target");
  }
  if (
    outcomeType === "request_revision" &&
    !["script_revision", "asset_revision", "runtime_enablement_backlog"].includes(
      downstreamTarget,
    )
  ) {
    errors.push("request_revision_requires_revision_target");
  }
  if (outcomeType === "reject_preview" && downstreamTarget !== "blocked_downstream") {
    errors.push("reject_preview_requires_blocked_downstream_target");
  }
  if (outcomeType === "mark_review_ready" && downstreamTarget !== "publish_guard") {
    errors.push("mark_review_ready_requires_publish_guard_target");
  }
  if (outcomeType === "keep_as_script_only" && downstreamTarget !== "script_only_archive") {
    errors.push("keep_as_script_only_requires_script_only_archive_target");
  }
  if (outcomeType === "mark_review_ready") {
    warnings.push("review_ready_only_is_not_approved_or_published");
  }
  if (outcomeType === "request_revision") {
    warnings.push("request_revision_does_not_trigger_rerender");
  }
  if (outcomeType === "reject_preview") {
    warnings.push("reject_preview_does_not_trigger_publish");
  }
  if (outcomeType === "keep_as_script_only") {
    warnings.push("keep_as_script_only_pauses_video_flow_without_runtime");
  }

  const createdAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const reviewerComment = normalizeOptionalString(input.command.handoffPayload.reviewerComment);
  const persistedBy =
    normalizeOptionalString(input.command.reviewerRef?.id) ??
    normalizeOptionalString(input.command.reviewerRef?.title) ??
    null;
  const idempotencyKey = buildIdempotencyKey({
    previewReviewDecisionRecordId,
    previewReviewFlowId,
    outcomeType,
    downstreamTarget,
    reviewerComment,
    reviewerRefId: normalizeOptionalString(input.command.reviewerRef?.id),
  });
  const record: VoxyRenderPreviewOutcomeHandoffRecord = {
    outcomeHandoffId:
      normalizeOptionalString(input.command.outcomeHandoffId) ??
      buildOutcomeHandoffRecordId({
        previewReviewDecisionRecordId,
        previewReviewFlowId,
        outcomeType,
        downstreamTarget,
        persistedAt: createdAt,
        persistedBy,
      }),
    previewReviewDecisionRecordId,
    previewReviewFlowId,
    enablementBacklogId: normalizeOptionalString(input.command.enablementBacklogId),
    matrixId: normalizeOptionalString(input.command.matrixId),
    requestDraftId: normalizeOptionalString(input.command.requestDraftId),
    renderDecisionId: normalizeOptionalString(input.command.renderDecisionId),
    scriptRef: normalizeRef(input.command.scriptRef),
    contributionRef: normalizeRef(input.command.contributionRef),
    dossierRef: normalizeRef(input.command.dossierRef),
    reviewerRef: normalizeRef(input.command.reviewerRef),
    createdAt,
    updatedAt: normalizeOptionalString(input.command.updatedAt) ?? createdAt,
    sourceLanguage: normalizeOptionalString(input.command.sourceLanguage) ?? "de",
    readingLanguage:
      normalizeOptionalString(input.command.readingLanguage) ??
      normalizeOptionalString(input.command.sourceLanguage) ??
      "de",
    scriptLanguage:
      normalizeOptionalString(input.command.scriptLanguage) ??
      normalizeOptionalString(input.command.readingLanguage) ??
      "de",
    renderLanguage:
      normalizeOptionalString(input.command.renderLanguage) ??
      normalizeOptionalString(input.command.scriptLanguage) ??
      "de",
    subtitleLanguage: normalizeOptionalString(input.command.subtitleLanguage),
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: input.command.rtlRequired === true,
    handoffStatus,
    outcomeType,
    downstreamTarget,
    handoffPayload: {
      reviewerComment,
      revisionReason: normalizeOptionalString(input.command.handoffPayload.revisionReason),
      rejectionReason: normalizeOptionalString(input.command.handoffPayload.rejectionReason),
      reviewReadyReason: normalizeOptionalString(input.command.handoffPayload.reviewReadyReason),
      checklistSummary: normalizeOptionalString(input.command.handoffPayload.checklistSummary),
      languageNotes: normalizeOptionalString(input.command.handoffPayload.languageNotes),
      claimSafetyNotes: normalizeOptionalString(input.command.handoffPayload.claimSafetyNotes),
      assetNotes: normalizeOptionalString(input.command.handoffPayload.assetNotes),
      runtimeNotes: normalizeOptionalString(input.command.handoffPayload.runtimeNotes),
      downstreamNotes: normalizeOptionalString(input.command.handoffPayload.downstreamNotes),
    },
    handoffEffects: buildVoxyRenderPreviewOutcomeHandoffEffects({
      outcomeType,
      downstreamTarget,
    }),
    executionFlags: buildVoxyRenderPreviewOutcomeHandoffExecutionFlags(),
    nextStep: input.command.nextStep,
    userVisibleSummary:
      normalizeOptionalString(input.command.userVisibleSummary) ??
      "Der Preview-Outcome-Handoff bleibt audit-only.",
    reviewerVisibleSummary:
      normalizeOptionalString(input.command.reviewerVisibleSummary) ??
      "Der Handoff bleibt getrennt von Render, Queue, Provider, Kosten und Publish.",
    previewReviewDecisionTypeHint: input.command.previewReviewDecisionTypeHint ?? null,
    previewReviewDecisionStatusHint: input.command.previewReviewDecisionStatusHint ?? null,
    previewReviewFlowStatusHint: input.command.previewReviewFlowStatusHint ?? null,
    persistedAt: createdAt,
    persistedBy,
    idempotencyKey,
    previousOutcomeHandoffRef: latestRecord?.outcomeHandoffId ?? null,
    supersedesOutcomeHandoffRef: latestRecord?.outcomeHandoffId ?? null,
    handoffVersion: latestRecord ? (latestRecord.handoffVersion ?? 0) + 1 : 1,
  };

  const blocked =
    errors.length > 0 ||
    handoffStatus === "blocked_by_missing_preview_review_decision" ||
    handoffStatus === "blocked_by_runtime_truth";
  if (blocked) {
    const result: VoxyRenderPreviewOutcomeHandoffStoreResult = {
      ok: false,
      status: "blocked",
      record,
      warnings,
      errors,
      idempotencyKey,
      nextStep: record.nextStep,
    };
    return {
      result,
      auditEvent: null,
      persistence,
    };
  }

  const savedRecord = await repo.saveRecord(record);
  const auditEvent: VoxyRenderPreviewOutcomeHandoffAuditEvent = {
    id: buildAuditId({
      outcomeHandoffId: savedRecord.outcomeHandoffId,
      previewReviewDecisionRecordId: savedRecord.previewReviewDecisionRecordId ?? null,
      at: createdAt,
    }),
    outcomeHandoffId: savedRecord.outcomeHandoffId,
    previewReviewDecisionRecordId: savedRecord.previewReviewDecisionRecordId ?? null,
    previewReviewFlowId: savedRecord.previewReviewFlowId ?? null,
    renderDecisionId: savedRecord.renderDecisionId ?? null,
    action: "preview_outcome_handoff_recorded",
    byUserId: persistedBy,
    at: createdAt,
    outcomeType: savedRecord.outcomeType,
    handoffStatus: savedRecord.handoffStatus,
    downstreamTarget: savedRecord.downstreamTarget,
    summary: savedRecord.reviewerVisibleSummary,
    note: reviewerComment,
    previousOutcomeHandoffRef: latestRecord?.outcomeHandoffId ?? null,
  };
  await repo.appendAuditEvent(auditEvent);

  const status: VoxyRenderPreviewOutcomeHandoffStoreResult["status"] =
    persistence.mode === "persistent_primary"
      ? "persisted"
      : savedRecord.handoffEffects.createsScriptRevisionTask ||
          savedRecord.handoffEffects.createsAssetRevisionTask ||
          savedRecord.handoffEffects.createsRuntimeBacklogTask ||
          savedRecord.handoffEffects.blocksDownstream ||
          savedRecord.handoffEffects.marksReviewReadyOnly ||
          savedRecord.handoffEffects.pausesVideoFlow
        ? "preview_only"
        : "noop";

  const result: VoxyRenderPreviewOutcomeHandoffStoreResult = {
    ok: true,
    status,
    record: savedRecord,
    warnings,
    errors: [],
    idempotencyKey,
    nextStep: savedRecord.nextStep,
  };

  return {
    result,
    auditEvent,
    persistence,
  };
}
