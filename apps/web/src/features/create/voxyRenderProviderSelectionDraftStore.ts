import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderProviderSelectionDraftCommand,
  VoxyRenderProviderSelectionDraftRecord,
  VoxyRenderProviderSelectionPersistenceState,
  VoxyRenderProviderSelectionStoreResult,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";

export const VOXY_RENDER_PROVIDER_SELECTION_AUDIT_ACTIONS = [
  "provider_selection_draft_recorded",
] as const;

export type VoxyRenderProviderSelectionAuditAction =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_AUDIT_ACTIONS)[number];

export type VoxyRenderProviderSelectionAuditEvent = {
  id: string;
  providerSelectionDraftId: string;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderProviderSelectionAuditAction;
  byUserId: string | null;
  at: string;
  providerSelectionStatus: VoxyRenderProviderSelectionDraftRecord["providerSelectionStatus"];
  videoFormat: VoxyRenderProviderSelectionDraftRecord["videoFormat"];
  note: string | null;
  summary: string;
  previousProviderSelectionDraftRef: string | null;
};

export type VoxyRenderProviderSelectionRecordListParams = {
  providerSelectionDraftId?: string | null;
  assetPackDraftId?: string | null;
  costPolicyPreviewId?: string | null;
  queuePreviewId?: string | null;
  requestDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  decisionGateIds?: string[];
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderProviderSelectionAuditListParams = {
  providerSelectionDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderProviderSelectionDraftRepository = {
  saveRecord(
    record: VoxyRenderProviderSelectionDraftRecord,
  ): Promise<VoxyRenderProviderSelectionDraftRecord>;
  getLatestRecord(
    decisionGateId: string,
  ): Promise<VoxyRenderProviderSelectionDraftRecord | null>;
  listRecords(
    params?: VoxyRenderProviderSelectionRecordListParams,
  ): Promise<VoxyRenderProviderSelectionDraftRecord[]>;
  appendAuditEvent(
    event: VoxyRenderProviderSelectionAuditEvent,
  ): Promise<VoxyRenderProviderSelectionAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderProviderSelectionAuditListParams,
  ): Promise<VoxyRenderProviderSelectionAuditEvent[]>;
  getPersistenceState(): VoxyRenderProviderSelectionPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_provider_selection_draft_records";
const AUDIT_COLLECTION = "voxy_render_provider_selection_draft_audits";

let repoSingleton: VoxyRenderProviderSelectionDraftRepository | null = null;
let indexesReady = false;

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeDecisionGateIds(values: string[] | undefined): string[] {
  return Array.from(new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []));
}

function providerSelectionDraftIdFor(input: {
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  providerSelectionStatus: string;
  persistedAt: string;
}) {
  return `voxy-render-provider-selection-draft:${stableHash(
    [
      input.assetPackDraftId ?? "",
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.providerSelectionStatus,
      input.persistedAt,
    ].join(":"),
  ).slice(0, 24)}`;
}

function auditIdFor(input: {
  providerSelectionDraftId: string;
  decisionGateId: string | null;
  at: string;
}) {
  return `voxy-render-provider-selection-draft-audit:${stableHash(
    `${input.providerSelectionDraftId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  providerSelectionStatus: string;
  createdBy: string | null;
}) {
  return `voxy-render-provider-selection-draft-idempotency:${stableHash(
    [
      input.assetPackDraftId ?? "",
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.providerSelectionStatus,
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderProviderSelectionPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Voxy-Provider-Selection-Draft-Store"
      : "In-Memory-Fallback für Voxy-Provider-Selection-Draft-Store",
    summary: persistent
      ? "Provider-Selection-Drafts und Audit-Spuren liegen getrennt von Providerlauf, Secrets, Queue, Render, Kosten und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Provider-Selection-Drafts leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderProviderSelectionDraftRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ decisionGateId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ decisionId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ requestDraftId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ queuePreviewId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ costPolicyPreviewId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ assetPackDraftId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderProviderSelectionDraftRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.providerSelectionDraftId },
        {
          $set: {
            _id: record.providerSelectionDraftId,
            record: clone(record),
            assetPackDraftId: record.assetPackDraftId,
            costPolicyPreviewId: record.costPolicyPreviewId,
            queuePreviewId: record.queuePreviewId,
            requestDraftId: record.requestDraftId,
            decisionId: record.decisionId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            providerSelectionStatus: record.providerSelectionStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            providerSelectionVersion: record.providerSelectionVersion,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const providerSelectionDraftId = normalizeOptionalString(params?.providerSelectionDraftId);
      const assetPackDraftId = normalizeOptionalString(params?.assetPackDraftId);
      const costPolicyPreviewId = normalizeOptionalString(params?.costPolicyPreviewId);
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (providerSelectionDraftId) filter._id = providerSelectionDraftId;
      if (assetPackDraftId) filter.assetPackDraftId = assetPackDraftId;
      if (costPolicyPreviewId) filter.costPolicyPreviewId = costPolicyPreviewId;
      if (queuePreviewId) filter.queuePreviewId = queuePreviewId;
      if (requestDraftId) filter.requestDraftId = requestDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateIds.length > 0) filter.decisionGateId = { $in: decisionGateIds };
      else if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const cursor = col.find(filter as any).sort({ persistedAt: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs.map((doc) => clone(doc.record as VoxyRenderProviderSelectionDraftRecord));
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
            providerSelectionDraftId: event.providerSelectionDraftId,
            decisionId: event.decisionId,
            decisionGateId: event.decisionGateId,
            at: event.at,
          },
        },
        { upsert: true },
      );
      return clone(event);
    },
    async listAuditEvents(params) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      const filter: Record<string, unknown> = {};
      const providerSelectionDraftId = normalizeOptionalString(params?.providerSelectionDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (providerSelectionDraftId) filter.providerSelectionDraftId = providerSelectionDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs.map((doc) => clone(doc.event as VoxyRenderProviderSelectionAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderProviderSelectionDraftRepository(
  seed?: {
    records?: VoxyRenderProviderSelectionDraftRecord[];
    auditEvents?: VoxyRenderProviderSelectionAuditEvent[];
  },
): VoxyRenderProviderSelectionDraftRepository {
  const records = new Map<string, VoxyRenderProviderSelectionDraftRecord>();
  const auditEvents = new Map<string, VoxyRenderProviderSelectionAuditEvent>();
  for (const record of seed?.records ?? []) records.set(record.providerSelectionDraftId, clone(record));
  for (const event of seed?.auditEvents ?? []) auditEvents.set(event.id, clone(event));
  return {
    async saveRecord(record) {
      records.set(record.providerSelectionDraftId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const list = Array.from(records.values()).filter((record) => {
        const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
        if (
          normalizeOptionalString(params?.providerSelectionDraftId) &&
          record.providerSelectionDraftId !== normalizeOptionalString(params?.providerSelectionDraftId)
        ) {
          return false;
        }
        if (
          normalizeOptionalString(params?.assetPackDraftId) &&
          record.assetPackDraftId !== normalizeOptionalString(params?.assetPackDraftId)
        ) {
          return false;
        }
        if (
          normalizeOptionalString(params?.costPolicyPreviewId) &&
          record.costPolicyPreviewId !== normalizeOptionalString(params?.costPolicyPreviewId)
        ) {
          return false;
        }
        if (
          normalizeOptionalString(params?.queuePreviewId) &&
          record.queuePreviewId !== normalizeOptionalString(params?.queuePreviewId)
        ) {
          return false;
        }
        if (
          normalizeOptionalString(params?.requestDraftId) &&
          record.requestDraftId !== normalizeOptionalString(params?.requestDraftId)
        ) {
          return false;
        }
        if (
          normalizeOptionalString(params?.decisionId) &&
          record.decisionId !== normalizeOptionalString(params?.decisionId)
        ) {
          return false;
        }
        if (decisionGateIds.length > 0 && !decisionGateIds.includes(record.decisionGateId ?? "")) {
          return false;
        }
        if (
          decisionGateIds.length === 0 &&
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
      });
      return list
        .sort((a, b) => String(b.persistedAt ?? "").localeCompare(String(a.persistedAt ?? "")))
        .slice(0, typeof params?.limit === "number" ? Math.max(1, params.limit) : list.length)
        .map((record) => clone(record));
    },
    async appendAuditEvent(event) {
      auditEvents.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      const list = Array.from(auditEvents.values()).filter((event) => {
        if (
          normalizeOptionalString(params?.providerSelectionDraftId) &&
          event.providerSelectionDraftId !== normalizeOptionalString(params?.providerSelectionDraftId)
        ) {
          return false;
        }
        if (
          normalizeOptionalString(params?.decisionId) &&
          event.decisionId !== normalizeOptionalString(params?.decisionId)
        ) {
          return false;
        }
        if (
          normalizeOptionalString(params?.decisionGateId) &&
          event.decisionGateId !== normalizeOptionalString(params?.decisionGateId)
        ) {
          return false;
        }
        return true;
      });
      return list
        .sort((a, b) => String(b.at).localeCompare(String(a.at)))
        .slice(0, typeof params?.limit === "number" ? Math.max(1, params.limit) : list.length)
        .map((event) => clone(event));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

export function setVoxyRenderProviderSelectionDraftRepositoryForTests(
  repo: VoxyRenderProviderSelectionDraftRepository | null,
) {
  repoSingleton = repo;
}

function getRepository() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderProviderSelectionDraftRepository()
    : createMongoRepository();
  return repoSingleton;
}

export function getVoxyRenderProviderSelectionPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listVoxyRenderProviderSelectionDraftRecords(
  params?: VoxyRenderProviderSelectionRecordListParams,
) {
  return getRepository().listRecords(params);
}

export async function getLatestVoxyRenderProviderSelectionDraftRecord(
  decisionGateId: string,
) {
  return getRepository().getLatestRecord(decisionGateId);
}

export async function listLatestVoxyRenderProviderSelectionDraftRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) return new Map<string, VoxyRenderProviderSelectionDraftRecord>();
  const records = await getRepository().listRecords({
    decisionGateIds: normalized,
    limit: normalized.length * 4,
  });
  const result = new Map<string, VoxyRenderProviderSelectionDraftRecord>();
  for (const decisionGateId of normalized) {
    const record = records.find((entry) => entry.decisionGateId === decisionGateId);
    if (record) result.set(decisionGateId, record);
  }
  return result;
}

export async function listVoxyRenderProviderSelectionDraftAuditEvents(
  params?: VoxyRenderProviderSelectionAuditListParams,
) {
  return getRepository().listAuditEvents(params);
}

export async function persistVoxyRenderProviderSelectionDraft(input: {
  command: VoxyRenderProviderSelectionDraftCommand;
}) {
  const repo = getRepository();
  const createdAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const createdBy = normalizeOptionalString(input.command.createdBy);
  const previous = input.command.decisionGateId
    ? await repo.getLatestRecord(input.command.decisionGateId).catch(() => null)
    : null;
  const providerSelectionVersion = (previous?.providerSelectionVersion ?? 0) + 1;
  const providerSelectionDraftId = providerSelectionDraftIdFor({
    assetPackDraftId: input.command.assetPackDraftId,
    costPolicyPreviewId: input.command.costPolicyPreviewId,
    queuePreviewId: input.command.queuePreviewId,
    requestDraftId: input.command.requestDraftId,
    decisionId: input.command.decisionId,
    decisionGateId: input.command.decisionGateId,
    providerSelectionStatus: input.command.providerSelectionStatus,
    persistedAt: createdAt,
  });
  const idempotencyKey = buildIdempotencyKey({
    assetPackDraftId: input.command.assetPackDraftId,
    costPolicyPreviewId: input.command.costPolicyPreviewId,
    queuePreviewId: input.command.queuePreviewId,
    requestDraftId: input.command.requestDraftId,
    decisionId: input.command.decisionId,
    decisionGateId: input.command.decisionGateId,
    providerSelectionStatus: input.command.providerSelectionStatus,
    createdBy,
  });
  const record: VoxyRenderProviderSelectionDraftRecord = {
    ...clone(input.command),
    providerSelectionDraftId,
    execution: {
      providerExecutionAllowed: false,
      providerCalled: false,
      secretsAccessed: false,
      pricingClaimAllowed: false,
      queueEnabled: false,
      createsQueueJob: false,
      workerExecutionAllowed: false,
      mediaFileCreationAllowed: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    },
    decision: {
      ...clone(input.command.decision),
    },
    persistedAt: createdAt,
    persistedBy: createdBy,
    idempotencyKey,
    previousProviderSelectionDraftRef: previous?.providerSelectionDraftId ?? null,
    supersedesProviderSelectionDraftRef: previous?.providerSelectionDraftId ?? null,
    providerSelectionVersion,
  };
  const savedRecord = await repo.saveRecord(record);
  const auditEvent: VoxyRenderProviderSelectionAuditEvent = {
    id: auditIdFor({
      providerSelectionDraftId: savedRecord.providerSelectionDraftId,
      decisionGateId: savedRecord.decisionGateId,
      at: createdAt,
    }),
    providerSelectionDraftId: savedRecord.providerSelectionDraftId,
    assetPackDraftId: savedRecord.assetPackDraftId,
    costPolicyPreviewId: savedRecord.costPolicyPreviewId,
    queuePreviewId: savedRecord.queuePreviewId,
    requestDraftId: savedRecord.requestDraftId,
    decisionId: savedRecord.decisionId,
    decisionGateId: savedRecord.decisionGateId,
    action: "provider_selection_draft_recorded",
    byUserId: createdBy,
    at: createdAt,
    providerSelectionStatus: savedRecord.providerSelectionStatus,
    videoFormat: savedRecord.videoFormat,
    note: null,
    summary: savedRecord.decision.reviewerVisibleReason,
    previousProviderSelectionDraftRef: previous?.providerSelectionDraftId ?? null,
  };
  await repo.appendAuditEvent(auditEvent);
  const resultStatus: VoxyRenderProviderSelectionStoreResult["status"] =
    savedRecord.providerSelectionStatus.startsWith("blocked_")
      ? "blocked"
      : savedRecord.providerSelectionStatus === "keep_as_script_only" ||
          savedRecord.providerSelectionStatus === "provider_selection_draft_only" ||
          savedRecord.providerSelectionStatus === "noop_provider_selection" ||
          savedRecord.providerSelectionStatus === "requirements_only"
        ? "noop"
        : "preview_only";
  const result: VoxyRenderProviderSelectionStoreResult = {
    ok: true,
    status: resultStatus,
    record: savedRecord,
    warnings: resultStatus === "blocked" ? savedRecord.blockers : [],
    errors: [],
    idempotencyKey,
    nextStep: savedRecord.decision.nextStep,
  };
  return {
    result,
    auditEvent,
    persistence: repo.getPersistenceState(),
  };
}
