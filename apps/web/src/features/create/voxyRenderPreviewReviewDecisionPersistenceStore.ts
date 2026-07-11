import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderPreviewReviewDecisionPersistenceCommand,
  VoxyRenderPreviewReviewDecisionPersistenceState,
  VoxyRenderPreviewReviewDecisionRecord,
  VoxyRenderPreviewReviewDecisionStoreResult,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import {
  buildVoxyRenderPreviewReviewDecisionEffects,
  buildVoxyRenderPreviewReviewDecisionExecutionFlags,
  deriveVoxyRenderPreviewReviewDecisionStatus,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";

export const VOXY_RENDER_PREVIEW_REVIEW_DECISION_AUDIT_ACTIONS = [
  "preview_review_decision_recorded",
] as const;

export type VoxyRenderPreviewReviewDecisionAuditAction =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_DECISION_AUDIT_ACTIONS)[number];

export type VoxyRenderPreviewReviewDecisionAuditEvent = {
  id: string;
  decisionRecordId: string;
  previewReviewFlowId: string | null;
  decisionGateId: string | null;
  renderDecisionId: string | null;
  action: VoxyRenderPreviewReviewDecisionAuditAction;
  byUserId: string | null;
  at: string;
  decisionType: VoxyRenderPreviewReviewDecisionRecord["decisionType"];
  decisionStatus: VoxyRenderPreviewReviewDecisionRecord["decisionStatus"];
  summary: string;
  note: string | null;
  previousDecisionRecordRef: string | null;
};

export type VoxyRenderPreviewReviewDecisionRecordListParams = {
  previewReviewFlowId?: string | null;
  decisionGateId?: string | null;
  decisionGateIds?: string[];
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderPreviewReviewDecisionAuditListParams = {
  previewReviewFlowId?: string | null;
  decisionGateId?: string | null;
  decisionRecordId?: string | null;
  limit?: number;
};

export type VoxyRenderPreviewReviewDecisionRepository = {
  saveRecord(
    record: VoxyRenderPreviewReviewDecisionRecord,
  ): Promise<VoxyRenderPreviewReviewDecisionRecord>;
  getLatestRecord(
    params: Pick<
      VoxyRenderPreviewReviewDecisionRecordListParams,
      "previewReviewFlowId" | "decisionGateId"
    >,
  ): Promise<VoxyRenderPreviewReviewDecisionRecord | null>;
  listRecords(
    params?: VoxyRenderPreviewReviewDecisionRecordListParams,
  ): Promise<VoxyRenderPreviewReviewDecisionRecord[]>;
  appendAuditEvent(
    event: VoxyRenderPreviewReviewDecisionAuditEvent,
  ): Promise<VoxyRenderPreviewReviewDecisionAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderPreviewReviewDecisionAuditListParams,
  ): Promise<VoxyRenderPreviewReviewDecisionAuditEvent[]>;
  getPersistenceState(): VoxyRenderPreviewReviewDecisionPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_preview_review_decision_records";
const AUDIT_COLLECTION = "voxy_render_preview_review_decision_audits";

let repoSingleton: VoxyRenderPreviewReviewDecisionRepository | null = null;
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
  ref: VoxyRenderPreviewReviewDecisionPersistenceCommand["scriptRef"],
): VoxyRenderPreviewReviewDecisionPersistenceCommand["scriptRef"] {
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

function normalizeDecisionGateIds(values: string[] | undefined): string[] {
  return Array.from(new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []));
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderPreviewReviewDecisionPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Preview-Review-Decision-Store"
      : "In-Memory-Fallback für Preview-Review-Decision-Store",
    summary: persistent
      ? "Menschliche Preview-Review-Entscheidungen und Audit-Spuren werden getrennt von Render, Re-Render, Queue, Provider, Medien, Kosten und Publishing gespeichert."
      : "Nur Dev-/Test-/Runtime-Fallback: Preview-Review-Decision-Records leben pro Prozess und sind keine Produktionswahrheit.",
    repositoryInterface: "VoxyRenderPreviewReviewDecisionRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildIdempotencyKey(input: {
  previewReviewFlowId: string | null;
  decisionGateId: string | null;
  decisionType: string;
  reviewerComment: string | null;
  reviewerRefId: string | null;
}) {
  return `voxy-render-preview-review-decision-idempotency:${stableHash(
    [
      input.previewReviewFlowId ?? "",
      input.decisionGateId ?? "",
      input.decisionType,
      input.reviewerComment ?? "",
      input.reviewerRefId ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildDecisionRecordId(input: {
  previewReviewFlowId: string | null;
  decisionGateId: string | null;
  decisionType: string;
  persistedAt: string;
  persistedBy: string | null;
  reviewerComment: string | null;
}) {
  return `voxy-render-preview-review-decision:${stableHash(
    [
      input.previewReviewFlowId ?? "",
      input.decisionGateId ?? "",
      input.decisionType,
      input.persistedAt,
      input.persistedBy ?? "",
      input.reviewerComment ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildAuditId(input: {
  decisionRecordId: string;
  decisionGateId: string | null;
  at: string;
}) {
  return `voxy-render-preview-review-decision-audit:${stableHash(
    `${input.decisionRecordId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ decisionGateId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ previewReviewFlowId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ previewReviewFlowId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderPreviewReviewDecisionRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.decisionRecordId },
        {
          $set: {
            _id: record.decisionRecordId,
            record: clone(record),
            previewReviewFlowId: record.previewReviewFlowId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            decisionType: record.decisionType,
            decisionStatus: record.decisionStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            decisionVersion: record.decisionVersion,
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
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (decisionGateIds.length > 0) {
        filter.decisionGateId = { $in: decisionGateIds };
      } else if (decisionGateId) {
        filter.decisionGateId = decisionGateId;
      }
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const docs = await col
        .find(filter as any)
        .sort({ persistedAt: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs.map((doc: any) => clone(doc.record as VoxyRenderPreviewReviewDecisionRecord));
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
            decisionRecordId: event.decisionRecordId,
            previewReviewFlowId: event.previewReviewFlowId,
            decisionGateId: event.decisionGateId,
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
      const previewReviewFlowId = normalizeOptionalString(params?.previewReviewFlowId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionRecordId = normalizeOptionalString(params?.decisionRecordId);
      if (previewReviewFlowId) filter.previewReviewFlowId = previewReviewFlowId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (decisionRecordId) filter.decisionRecordId = decisionRecordId;
      const docs = await col
        .find(filter as any)
        .sort({ at: -1, _id: -1 })
        .limit(Math.max(1, Math.min(100, params?.limit ?? 20)))
        .toArray();
      return docs.map((doc: any) => clone(doc.event as VoxyRenderPreviewReviewDecisionAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

function createInMemoryMaps(seed?: {
  records?: VoxyRenderPreviewReviewDecisionRecord[];
  audits?: VoxyRenderPreviewReviewDecisionAuditEvent[];
}) {
  const records = new Map<string, VoxyRenderPreviewReviewDecisionRecord>();
  const audits = new Map<string, VoxyRenderPreviewReviewDecisionAuditEvent>();
  for (const record of seed?.records ?? []) records.set(record.decisionRecordId, clone(record));
  for (const audit of seed?.audits ?? []) audits.set(audit.id, clone(audit));
  return { records, audits };
}

export function createInMemoryVoxyRenderPreviewReviewDecisionRepository(seed?: {
  records?: VoxyRenderPreviewReviewDecisionRecord[];
  audits?: VoxyRenderPreviewReviewDecisionAuditEvent[];
}): VoxyRenderPreviewReviewDecisionRepository {
  const { records, audits } = createInMemoryMaps(seed);
  return {
    async saveRecord(record) {
      records.set(record.decisionRecordId, clone(record));
      return clone(record);
    },
    async getLatestRecord(params) {
      const [record] = await this.listRecords({ ...params, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      return Array.from(records.values())
        .map(clone)
        .filter((record) => {
          if (
            normalizeOptionalString(params?.previewReviewFlowId) &&
            record.previewReviewFlowId !== normalizeOptionalString(params?.previewReviewFlowId)
          ) {
            return false;
          }
          if (normalizeDecisionGateIds(params?.decisionGateIds).length > 0) {
            const gateId = normalizeOptionalString(record.decisionGateId);
            if (!gateId || !normalizeDecisionGateIds(params?.decisionGateIds).includes(gateId)) {
              return false;
            }
          } else if (
            normalizeOptionalString(params?.decisionGateId) &&
            record.decisionGateId !== normalizeOptionalString(params?.decisionGateId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.contributionRefId) &&
            record.contributionRef?.id !== normalizeOptionalString(params?.contributionRefId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.dossierRefId) &&
            record.dossierRef?.id !== normalizeOptionalString(params?.dossierRefId)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => String(b.persistedAt ?? "").localeCompare(String(a.persistedAt ?? "")))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)));
    },
    async appendAuditEvent(event) {
      audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      return Array.from(audits.values())
        .map(clone)
        .filter((event) => {
          if (
            normalizeOptionalString(params?.previewReviewFlowId) &&
            event.previewReviewFlowId !== normalizeOptionalString(params?.previewReviewFlowId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.decisionGateId) &&
            event.decisionGateId !== normalizeOptionalString(params?.decisionGateId)
          ) {
            return false;
          }
          if (
            normalizeOptionalString(params?.decisionRecordId) &&
            event.decisionRecordId !== normalizeOptionalString(params?.decisionRecordId)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => String(b.at).localeCompare(String(a.at)))
        .slice(0, Math.max(1, Math.min(100, params?.limit ?? 20)));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function getRepository() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderPreviewReviewDecisionRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function setVoxyRenderPreviewReviewDecisionRepositoryForTests(
  repo: VoxyRenderPreviewReviewDecisionRepository,
) {
  repoSingleton = repo;
}

export function getVoxyRenderPreviewReviewDecisionPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderPreviewReviewDecisionRecords(
  params?: VoxyRenderPreviewReviewDecisionRecordListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderPreviewReviewDecisionRecord(
  params: Pick<VoxyRenderPreviewReviewDecisionRecordListParams, "previewReviewFlowId" | "decisionGateId">,
) {
  return getRepository().getLatestRecord(params);
}

export async function listLatestVoxyRenderPreviewReviewDecisionRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) {
    return new Map<string, VoxyRenderPreviewReviewDecisionRecord>();
  }
  const records = await getRepository().listRecords({
    decisionGateIds: normalized,
    limit: normalized.length * 5,
  });
  const result = new Map<string, VoxyRenderPreviewReviewDecisionRecord>();
  for (const record of records) {
    const key = normalizeOptionalString(record.decisionGateId);
    if (!key || result.has(key)) continue;
    result.set(key, record);
  }
  return result;
}

export async function listVoxyRenderPreviewReviewDecisionAuditEvents(
  params?: VoxyRenderPreviewReviewDecisionAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderPreviewReviewDecision(input: {
  command: VoxyRenderPreviewReviewDecisionPersistenceCommand;
}) {
  const repo = getRepository();
  const persistence = repo.getPersistenceState();
  const previewReviewFlowId = normalizeOptionalString(input.command.previewReviewFlowId);
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  const latestRecord =
    previewReviewFlowId || decisionGateId
      ? await repo.getLatestRecord({
          previewReviewFlowId,
          decisionGateId,
        })
      : null;
  const decisionType = input.command.decisionType;
  const decisionStatus = deriveVoxyRenderPreviewReviewDecisionStatus({
    previewFlow: previewReviewFlowId
      ? ({
          previewReviewFlowId,
          previewStatus: input.command.previewReviewStatusHint ?? null,
        } as any)
      : null,
    decisionType,
    persistenceMode: persistence.mode,
  });
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!previewReviewFlowId) {
    errors.push("preview_review_flow_required");
  }
  if (
    input.command.previewReviewStatusHint === "keep_as_script_only" &&
    decisionType !== "keep_as_script_only" &&
    decisionType !== "comment_only"
  ) {
    errors.push("keep_as_script_only_allows_only_comment_or_script_only");
  }
  if (decisionType === "mark_review_ready") {
    warnings.push("review_ready_is_not_approved_or_published");
  }
  if (decisionType === "request_revision") {
    warnings.push("request_revision_does_not_trigger_rerender");
  }
  if (decisionType === "reject_preview") {
    warnings.push("reject_preview_does_not_trigger_publish");
  }

  const createdAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const reviewerComment = normalizeOptionalString(input.command.decisionPayload.reviewerComment);
  const persistedBy =
    normalizeOptionalString(input.command.reviewerRef?.id) ??
    normalizeOptionalString(input.command.reviewerRef?.title) ??
    null;
  const idempotencyKey = buildIdempotencyKey({
    previewReviewFlowId,
    decisionGateId,
    decisionType,
    reviewerComment,
    reviewerRefId: normalizeOptionalString(input.command.reviewerRef?.id),
  });
  const record: VoxyRenderPreviewReviewDecisionRecord = {
    decisionRecordId:
      normalizeOptionalString(input.command.decisionRecordId) ??
      buildDecisionRecordId({
        previewReviewFlowId,
        decisionGateId,
        decisionType,
        persistedAt: createdAt,
        persistedBy,
        reviewerComment,
      }),
    previewReviewFlowId,
    decisionGateId,
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
    decisionType,
    decisionStatus,
    decisionPayload: clone(input.command.decisionPayload),
    checklistResults: clone(input.command.checklistResults),
    decisionEffects: buildVoxyRenderPreviewReviewDecisionEffects(),
    executionFlags: buildVoxyRenderPreviewReviewDecisionExecutionFlags(),
    nextStep: normalizeOptionalString(input.command.nextStep) ?? "Preview-Review-Entscheidung prüfen.",
    userVisibleSummary:
      normalizeOptionalString(input.command.userVisibleSummary) ??
      "Die Preview-Review-Entscheidung bleibt audit-only.",
    reviewerVisibleSummary:
      normalizeOptionalString(input.command.reviewerVisibleSummary) ??
      "Die Entscheidung bleibt getrennt von Render, Queue, Provider, Kosten und Publish.",
    previewReviewStatusHint: input.command.previewReviewStatusHint ?? null,
    persistedAt: createdAt,
    persistedBy,
    idempotencyKey,
    previousDecisionRecordRef: latestRecord?.decisionRecordId ?? null,
    supersedesDecisionRecordRef: latestRecord?.decisionRecordId ?? null,
    decisionVersion: latestRecord ? (latestRecord.decisionVersion ?? 0) + 1 : 1,
  };

  const blocked =
    errors.length > 0 ||
    decisionStatus === "blocked_by_missing_preview_review_flow" ||
    decisionStatus === "blocked_by_runtime_truth";
  if (blocked) {
    const result: VoxyRenderPreviewReviewDecisionStoreResult = {
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
  const auditEvent: VoxyRenderPreviewReviewDecisionAuditEvent = {
    id: buildAuditId({
      decisionRecordId: savedRecord.decisionRecordId,
      decisionGateId: savedRecord.decisionGateId,
      at: createdAt,
    }),
    decisionRecordId: savedRecord.decisionRecordId,
    previewReviewFlowId: savedRecord.previewReviewFlowId ?? null,
    decisionGateId: savedRecord.decisionGateId ?? null,
    renderDecisionId: savedRecord.renderDecisionId ?? null,
    action: "preview_review_decision_recorded",
    byUserId: persistedBy,
    at: createdAt,
    decisionType: savedRecord.decisionType,
    decisionStatus: savedRecord.decisionStatus,
    summary: savedRecord.reviewerVisibleSummary,
    note: reviewerComment,
    previousDecisionRecordRef: latestRecord?.decisionRecordId ?? null,
  };
  await repo.appendAuditEvent(auditEvent);

  const status: VoxyRenderPreviewReviewDecisionStoreResult["status"] =
    savedRecord.decisionType === "keep_as_script_only"
      ? "noop"
      : persistence.mode === "persistent_primary"
        ? "persisted"
        : "preview_only";

  const result: VoxyRenderPreviewReviewDecisionStoreResult = {
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
