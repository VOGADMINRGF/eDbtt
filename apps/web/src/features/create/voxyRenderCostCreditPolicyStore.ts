import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderCostCreditPolicyPersistenceState,
  VoxyRenderCostCreditPolicyPreviewCommand,
  VoxyRenderCostCreditPolicyPreviewRecord,
  VoxyRenderCostCreditPolicyStoreResult,
} from "@/features/create/voxyRenderCostCreditPolicyContract";

export const VOXY_RENDER_COST_CREDIT_POLICY_AUDIT_ACTIONS = [
  "cost_credit_policy_recorded",
] as const;

export type VoxyRenderCostCreditPolicyAuditAction =
  (typeof VOXY_RENDER_COST_CREDIT_POLICY_AUDIT_ACTIONS)[number];

export type VoxyRenderCostCreditPolicyAuditEvent = {
  id: string;
  policyPreviewId: string;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderCostCreditPolicyAuditAction;
  byUserId: string | null;
  at: string;
  policyStatus: VoxyRenderCostCreditPolicyPreviewRecord["policyStatus"];
  videoFormat: VoxyRenderCostCreditPolicyPreviewRecord["videoFormat"];
  note: string | null;
  summary: string;
  previousPolicyPreviewRef: string | null;
};

export type VoxyRenderCostCreditPolicyRecordListParams = {
  policyPreviewId?: string | null;
  queuePreviewId?: string | null;
  requestDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  decisionGateIds?: string[];
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderCostCreditPolicyAuditListParams = {
  policyPreviewId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderCostCreditPolicyRepository = {
  saveRecord(
    record: VoxyRenderCostCreditPolicyPreviewRecord,
  ): Promise<VoxyRenderCostCreditPolicyPreviewRecord>;
  getLatestRecord(
    decisionGateId: string,
  ): Promise<VoxyRenderCostCreditPolicyPreviewRecord | null>;
  listRecords(
    params?: VoxyRenderCostCreditPolicyRecordListParams,
  ): Promise<VoxyRenderCostCreditPolicyPreviewRecord[]>;
  appendAuditEvent(
    event: VoxyRenderCostCreditPolicyAuditEvent,
  ): Promise<VoxyRenderCostCreditPolicyAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderCostCreditPolicyAuditListParams,
  ): Promise<VoxyRenderCostCreditPolicyAuditEvent[]>;
  getPersistenceState(): VoxyRenderCostCreditPolicyPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_cost_credit_policy_records";
const AUDIT_COLLECTION = "voxy_render_cost_credit_policy_audits";

let repoSingleton: VoxyRenderCostCreditPolicyRepository | null = null;
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

function policyPreviewIdFor(input: {
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  policyStatus: string;
  persistedAt: string;
}) {
  return `voxy-render-cost-credit-policy:${stableHash(
    [
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.policyStatus,
      input.persistedAt,
    ].join(":"),
  ).slice(0, 24)}`;
}

function auditIdFor(input: {
  policyPreviewId: string;
  decisionGateId: string | null;
  at: string;
}) {
  return `voxy-render-cost-credit-policy-audit:${stableHash(
    `${input.policyPreviewId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  policyStatus: string;
  createdBy: string | null;
}) {
  return `voxy-render-cost-credit-policy-idempotency:${stableHash(
    [
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.policyStatus,
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderCostCreditPolicyPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Voxy-Cost-/Credit-Policy-Store"
      : "In-Memory-Fallback für Voxy-Cost-/Credit-Policy-Store",
    summary: persistent
      ? "Cost-/Credit-/Limit-Policy-Previews und Audit-Spuren liegen getrennt von Billing, Queue, Provider, Medien und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Policy-Previews leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderCostCreditPolicyRepository",
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
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderCostCreditPolicyRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.policyPreviewId },
        {
          $set: {
            _id: record.policyPreviewId,
            record: clone(record),
            queuePreviewId: record.queuePreviewId,
            requestDraftId: record.requestDraftId,
            decisionId: record.decisionId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            policyStatus: record.policyStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            policyVersion: record.policyVersion,
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
      const policyPreviewId = normalizeOptionalString(params?.policyPreviewId);
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (policyPreviewId) filter._id = policyPreviewId;
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
      return docs.map((doc) => clone(doc.record as VoxyRenderCostCreditPolicyPreviewRecord));
    },
    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      await col.updateOne(
        { _id: event.id },
        {
          $set: {
            _id: event.id,
            ...clone(event),
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
      const policyPreviewId = normalizeOptionalString(params?.policyPreviewId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (policyPreviewId) filter.policyPreviewId = policyPreviewId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs.map((doc) => clone(doc as VoxyRenderCostCreditPolicyAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderCostCreditPolicyRepository(seed?: {
  records?: VoxyRenderCostCreditPolicyPreviewRecord[];
  audits?: VoxyRenderCostCreditPolicyAuditEvent[];
}): VoxyRenderCostCreditPolicyRepository {
  const records = new Map<string, VoxyRenderCostCreditPolicyPreviewRecord>();
  const audits = new Map<string, VoxyRenderCostCreditPolicyAuditEvent>();
  for (const record of seed?.records ?? []) records.set(record.policyPreviewId, clone(record));
  for (const event of seed?.audits ?? []) audits.set(event.id, clone(event));
  return {
    async saveRecord(record) {
      records.set(record.policyPreviewId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const policyPreviewId = normalizeOptionalString(params?.policyPreviewId);
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      const list = Array.from(records.values())
        .filter((record) => (policyPreviewId ? record.policyPreviewId === policyPreviewId : true))
        .filter((record) => (queuePreviewId ? record.queuePreviewId === queuePreviewId : true))
        .filter((record) => (requestDraftId ? record.requestDraftId === requestDraftId : true))
        .filter((record) => (decisionId ? record.decisionId === decisionId : true))
        .filter((record) =>
          decisionGateIds.length > 0
            ? decisionGateIds.includes(record.decisionGateId ?? "")
            : decisionGateId
              ? record.decisionGateId === decisionGateId
              : true,
        )
        .filter((record) =>
          contributionRefId ? record.contributionRef?.id === contributionRefId : true,
        )
        .filter((record) => (dossierRefId ? record.dossierRef?.id === dossierRefId : true))
        .sort((left, right) =>
          String(right.persistedAt ?? "").localeCompare(String(left.persistedAt ?? "")),
        )
        .map(clone);
      return typeof params?.limit === "number"
        ? list.slice(0, Math.max(1, params.limit))
        : list;
    },
    async appendAuditEvent(event) {
      audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      const policyPreviewId = normalizeOptionalString(params?.policyPreviewId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const list = Array.from(audits.values())
        .filter((event) => (policyPreviewId ? event.policyPreviewId === policyPreviewId : true))
        .filter((event) => (decisionId ? event.decisionId === decisionId : true))
        .filter((event) => (decisionGateId ? event.decisionGateId === decisionGateId : true))
        .sort((left, right) => right.at.localeCompare(left.at))
        .map(clone);
      return typeof params?.limit === "number"
        ? list.slice(0, Math.max(1, params.limit))
        : list;
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderCostCreditPolicyRepository()
    : createMongoRepository();
  return repoSingleton;
}

function buildRecordFromCommand(input: {
  command: VoxyRenderCostCreditPolicyPreviewCommand;
  existing: VoxyRenderCostCreditPolicyPreviewRecord | null;
}) {
  const persistedAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const persistedBy = normalizeOptionalString(input.command.createdBy);
  const decisionId = normalizeOptionalString(input.command.decisionId);
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  const requestDraftId = normalizeOptionalString(input.command.requestDraftId);
  const queuePreviewId = normalizeOptionalString(input.command.queuePreviewId);
  const policyPreviewId =
    normalizeOptionalString(input.command.policyPreviewId) ??
    policyPreviewIdFor({
      queuePreviewId,
      requestDraftId,
      decisionId,
      decisionGateId,
      policyStatus: input.command.policyStatus,
      persistedAt,
    });
  return {
    ...clone(input.command),
    policyPreviewId,
    queuePreviewId,
    requestDraftId,
    decisionId,
    decisionGateId,
    persistedAt,
    persistedBy,
    idempotencyKey: buildIdempotencyKey({
      queuePreviewId,
      requestDraftId,
      decisionId,
      decisionGateId,
      policyStatus: input.command.policyStatus,
      createdBy: persistedBy,
    }),
    previousPolicyPreviewRef: input.existing?.policyPreviewId ?? null,
    supersedesPolicyPreviewRef: input.existing?.policyPreviewId ?? null,
    policyVersion: (input.existing?.policyVersion ?? 0) + 1,
  } satisfies VoxyRenderCostCreditPolicyPreviewRecord;
}

function buildAuditEvent(input: {
  record: VoxyRenderCostCreditPolicyPreviewRecord;
  existing: VoxyRenderCostCreditPolicyPreviewRecord | null;
}) {
  const at = input.record.persistedAt ?? nowIso();
  return {
    id: auditIdFor({
      policyPreviewId: input.record.policyPreviewId,
      decisionGateId: input.record.decisionGateId,
      at,
    }),
    policyPreviewId: input.record.policyPreviewId,
    queuePreviewId: input.record.queuePreviewId,
    requestDraftId: input.record.requestDraftId,
    decisionId: input.record.decisionId,
    decisionGateId: input.record.decisionGateId,
    action: "cost_credit_policy_recorded",
    byUserId: input.record.persistedBy,
    at,
    policyStatus: input.record.policyStatus,
    videoFormat: input.record.videoFormat,
    note: input.record.reviewerVisibleReason,
    summary: input.record.userVisibleReason,
    previousPolicyPreviewRef: input.existing?.policyPreviewId ?? null,
  } satisfies VoxyRenderCostCreditPolicyAuditEvent;
}

export function getVoxyRenderCostCreditPolicyRepository() {
  return getRepo();
}

export function setVoxyRenderCostCreditPolicyRepositoryForTests(
  repo: VoxyRenderCostCreditPolicyRepository | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}

export function getVoxyRenderCostCreditPolicyPersistenceState() {
  return getRepo().getPersistenceState();
}

export async function getLatestVoxyRenderCostCreditPolicyRecord(decisionGateId: string) {
  return getRepo().getLatestRecord(normalizeText(decisionGateId));
}

export async function listVoxyRenderCostCreditPolicyRecords(
  params?: VoxyRenderCostCreditPolicyRecordListParams,
) {
  return getRepo().listRecords(params);
}

export async function listLatestVoxyRenderCostCreditPolicyRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) return new Map<string, VoxyRenderCostCreditPolicyPreviewRecord>();
  const records = await getRepo().listRecords({ decisionGateIds: normalized });
  const map = new Map<string, VoxyRenderCostCreditPolicyPreviewRecord>();
  for (const record of records) {
    if (record.decisionGateId && !map.has(record.decisionGateId)) {
      map.set(record.decisionGateId, record);
    }
  }
  return map;
}

export async function listVoxyRenderCostCreditPolicyAuditEvents(
  params?: VoxyRenderCostCreditPolicyAuditListParams,
) {
  return getRepo().listAuditEvents(params);
}

export async function persistVoxyRenderCostCreditPolicy(input: {
  command: VoxyRenderCostCreditPolicyPreviewCommand;
}) {
  const repo = getRepo();
  const persistence = repo.getPersistenceState();
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  if (!decisionGateId) {
    return {
      result: {
        ok: false,
        status: "blocked",
        record: null,
        warnings: [],
        errors: ["decision_gate_id_missing"],
        idempotencyKey: null,
        nextStep: "Decision Gate oder Queue-/Draft-Referenz sauber ergänzen",
      } satisfies VoxyRenderCostCreditPolicyStoreResult,
      auditEvent: null,
      persistence,
    };
  }

  const existing = await repo.getLatestRecord(decisionGateId);
  const record = buildRecordFromCommand({
    command: {
      ...input.command,
      decisionGateId,
    },
    existing,
  });

  if (existing?.idempotencyKey && existing.idempotencyKey === record.idempotencyKey) {
    return {
      result: {
        ok: true,
        status: "noop",
        record: existing,
        warnings:
          persistence.mode === "persistent_primary"
            ? []
            : ["in_memory_fallback_active", "record_is_not_production_truth"],
        errors: [],
        idempotencyKey: existing.idempotencyKey,
        nextStep:
          persistence.mode === "persistent_primary"
            ? "Bestehende Policy-Auditspur prüfen"
            : "Persistenzgrenze vor produktivem Rollout härten",
      } satisfies VoxyRenderCostCreditPolicyStoreResult,
      auditEvent: null,
      persistence,
    };
  }

  const savedRecord = await repo.saveRecord(record);
  const auditEvent = await repo.appendAuditEvent(
    buildAuditEvent({
      record: savedRecord,
      existing,
    }),
  );

  const blocked =
    savedRecord.policyStatus === "blocked_by_missing_request_draft" ||
    savedRecord.policyStatus === "blocked_by_missing_queue_contract" ||
    savedRecord.policyStatus === "blocked_by_missing_provider" ||
    savedRecord.policyStatus === "blocked_by_missing_assets" ||
    savedRecord.policyStatus === "blocked_by_runtime_truth";

  return {
    result: {
      ok: !blocked,
      status: blocked ? "blocked" : "preview_only",
      record: savedRecord,
      warnings:
        persistence.mode === "persistent_primary"
          ? []
          : ["in_memory_fallback_active", "record_is_not_production_truth"],
      errors: blocked ? ["policy_preview_blocked"] : [],
      idempotencyKey: savedRecord.idempotencyKey,
      nextStep:
        persistence.mode === "persistent_primary"
          ? "Policy-Audit prüfen oder neue Noop-Policy dokumentieren"
          : "Store nur als Preview nutzen und produktive Persistenz separat absichern",
    } satisfies VoxyRenderCostCreditPolicyStoreResult,
    auditEvent,
    persistence,
  };
}
