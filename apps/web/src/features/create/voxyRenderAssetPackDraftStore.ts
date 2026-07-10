import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  VoxyRenderAssetPackDraftPersistenceState,
  VoxyRenderAssetPackDraftPreviewCommand,
  VoxyRenderAssetPackDraftPreviewRecord,
  VoxyRenderAssetPackDraftStoreResult,
} from "@/features/create/voxyRenderAssetPackDraftContract";

export const VOXY_RENDER_ASSET_PACK_DRAFT_AUDIT_ACTIONS = [
  "asset_pack_draft_recorded",
] as const;

export type VoxyRenderAssetPackDraftAuditAction =
  (typeof VOXY_RENDER_ASSET_PACK_DRAFT_AUDIT_ACTIONS)[number];

export type VoxyRenderAssetPackDraftAuditEvent = {
  id: string;
  assetPackDraftId: string;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  action: VoxyRenderAssetPackDraftAuditAction;
  byUserId: string | null;
  at: string;
  assetPackStatus: VoxyRenderAssetPackDraftPreviewRecord["assetPackStatus"];
  videoFormat: VoxyRenderAssetPackDraftPreviewRecord["videoFormat"];
  note: string | null;
  summary: string;
  previousAssetPackDraftRef: string | null;
};

export type VoxyRenderAssetPackDraftRecordListParams = {
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

export type VoxyRenderAssetPackDraftAuditListParams = {
  assetPackDraftId?: string | null;
  decisionId?: string | null;
  decisionGateId?: string | null;
  limit?: number;
};

export type VoxyRenderAssetPackDraftRepository = {
  saveRecord(
    record: VoxyRenderAssetPackDraftPreviewRecord,
  ): Promise<VoxyRenderAssetPackDraftPreviewRecord>;
  getLatestRecord(
    decisionGateId: string,
  ): Promise<VoxyRenderAssetPackDraftPreviewRecord | null>;
  listRecords(
    params?: VoxyRenderAssetPackDraftRecordListParams,
  ): Promise<VoxyRenderAssetPackDraftPreviewRecord[]>;
  appendAuditEvent(
    event: VoxyRenderAssetPackDraftAuditEvent,
  ): Promise<VoxyRenderAssetPackDraftAuditEvent>;
  listAuditEvents(
    params?: VoxyRenderAssetPackDraftAuditListParams,
  ): Promise<VoxyRenderAssetPackDraftAuditEvent[]>;
  getPersistenceState(): VoxyRenderAssetPackDraftPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_asset_pack_draft_records";
const AUDIT_COLLECTION = "voxy_render_asset_pack_draft_audits";

let repoSingleton: VoxyRenderAssetPackDraftRepository | null = null;
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

function assetPackDraftIdFor(input: {
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  assetPackStatus: string;
  persistedAt: string;
}) {
  return `voxy-render-asset-pack-draft:${stableHash(
    [
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.assetPackStatus,
      input.persistedAt,
    ].join(":"),
  ).slice(0, 24)}`;
}

function auditIdFor(input: {
  assetPackDraftId: string;
  decisionGateId: string | null;
  at: string;
}) {
  return `voxy-render-asset-pack-draft-audit:${stableHash(
    `${input.assetPackDraftId}:${input.decisionGateId ?? ""}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  assetPackStatus: string;
  createdBy: string | null;
}) {
  return `voxy-render-asset-pack-draft-idempotency:${stableHash(
    [
      input.costPolicyPreviewId ?? "",
      input.queuePreviewId ?? "",
      input.requestDraftId ?? "",
      input.decisionId ?? "",
      input.decisionGateId ?? "",
      input.assetPackStatus,
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderAssetPackDraftPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Voxy-Asset-Pack-Draft-Store"
      : "In-Memory-Fallback für Voxy-Asset-Pack-Draft-Store",
    summary: persistent
      ? "Asset-Pack-Drafts und Audit-Spuren liegen getrennt von Render, Export, Upload, Queue, Provider, Kosten und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Asset-Pack-Drafts leben pro Prozess und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderAssetPackDraftRepository",
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
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderAssetPackDraftRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.assetPackDraftId },
        {
          $set: {
            _id: record.assetPackDraftId,
            record: clone(record),
            costPolicyPreviewId: record.costPolicyPreviewId,
            queuePreviewId: record.queuePreviewId,
            requestDraftId: record.requestDraftId,
            decisionId: record.decisionId,
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            assetPackStatus: record.assetPackStatus,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            assetPackVersion: record.assetPackVersion,
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
      const assetPackDraftId = normalizeOptionalString(params?.assetPackDraftId);
      const costPolicyPreviewId = normalizeOptionalString(params?.costPolicyPreviewId);
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (assetPackDraftId) filter._id = assetPackDraftId;
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
      return docs.map((doc) => clone(doc.record as VoxyRenderAssetPackDraftPreviewRecord));
    },
    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      await col.updateOne(
        { _id: event.id },
        { $set: { _id: event.id, ...clone(event) } as any },
        { upsert: true },
      );
      return clone(event);
    },
    async listAuditEvents(params) {
      await ensureIndexes();
      const col = await coreCol<any>(AUDIT_COLLECTION);
      const filter: Record<string, unknown> = {};
      const assetPackDraftId = normalizeOptionalString(params?.assetPackDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      if (assetPackDraftId) filter.assetPackDraftId = assetPackDraftId;
      if (decisionId) filter.decisionId = decisionId;
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs.map((doc) => clone(doc as VoxyRenderAssetPackDraftAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderAssetPackDraftRepository(seed?: {
  records?: VoxyRenderAssetPackDraftPreviewRecord[];
  audits?: VoxyRenderAssetPackDraftAuditEvent[];
}): VoxyRenderAssetPackDraftRepository {
  const records = new Map<string, VoxyRenderAssetPackDraftPreviewRecord>();
  const audits = new Map<string, VoxyRenderAssetPackDraftAuditEvent>();
  for (const record of seed?.records ?? []) records.set(record.assetPackDraftId, clone(record));
  for (const event of seed?.audits ?? []) audits.set(event.id, clone(event));
  return {
    async saveRecord(record) {
      records.set(record.assetPackDraftId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const assetPackDraftId = normalizeOptionalString(params?.assetPackDraftId);
      const costPolicyPreviewId = normalizeOptionalString(params?.costPolicyPreviewId);
      const queuePreviewId = normalizeOptionalString(params?.queuePreviewId);
      const requestDraftId = normalizeOptionalString(params?.requestDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      const list = Array.from(records.values())
        .filter((record) => (assetPackDraftId ? record.assetPackDraftId === assetPackDraftId : true))
        .filter((record) =>
          costPolicyPreviewId ? record.costPolicyPreviewId === costPolicyPreviewId : true,
        )
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
        .sort((a, b) => String(b.persistedAt ?? "").localeCompare(String(a.persistedAt ?? "")));
      const limit = typeof params?.limit === "number" ? Math.max(1, params.limit) : list.length;
      return list.slice(0, limit).map((record) => clone(record));
    },
    async appendAuditEvent(event) {
      audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      const assetPackDraftId = normalizeOptionalString(params?.assetPackDraftId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const list = Array.from(audits.values())
        .filter((event) => (assetPackDraftId ? event.assetPackDraftId === assetPackDraftId : true))
        .filter((event) => (decisionId ? event.decisionId === decisionId : true))
        .filter((event) => (decisionGateId ? event.decisionGateId === decisionGateId : true))
        .sort((a, b) => b.at.localeCompare(a.at));
      const limit = typeof params?.limit === "number" ? Math.max(1, params.limit) : list.length;
      return list.slice(0, limit).map((event) => clone(event));
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderAssetPackDraftRepository()
    : createMongoRepository();
  return repoSingleton;
}

function buildRecordFromCommand(input: {
  command: VoxyRenderAssetPackDraftPreviewCommand;
  existing: VoxyRenderAssetPackDraftPreviewRecord | null;
}): VoxyRenderAssetPackDraftPreviewRecord {
  const persistedAt = normalizeText(input.command.createdAt) || nowIso();
  const persistedBy = normalizeOptionalString(input.command.createdBy);
  const existingVersion = input.existing?.assetPackVersion ?? 0;
  const costPolicyPreviewId = normalizeOptionalString(input.command.costPolicyPreviewId);
  const queuePreviewId = normalizeOptionalString(input.command.queuePreviewId);
  const requestDraftId = normalizeOptionalString(input.command.requestDraftId);
  const decisionId = normalizeOptionalString(input.command.decisionId);
  const decisionGateId = normalizeOptionalString(input.command.decisionGateId);
  return {
    ...clone(input.command),
    assetPackDraftId: assetPackDraftIdFor({
      costPolicyPreviewId,
      queuePreviewId,
      requestDraftId,
      decisionId,
      decisionGateId,
      assetPackStatus: input.command.assetPackStatus,
      persistedAt,
    }),
    costPolicyPreviewId,
    queuePreviewId,
    requestDraftId,
    decisionId,
    decisionGateId,
    persistedAt,
    persistedBy,
    idempotencyKey: buildIdempotencyKey({
      costPolicyPreviewId,
      queuePreviewId,
      requestDraftId,
      decisionId,
      decisionGateId,
      assetPackStatus: input.command.assetPackStatus,
      createdBy: persistedBy,
    }),
    previousAssetPackDraftRef: input.existing?.assetPackDraftId ?? null,
    supersedesAssetPackDraftRef: input.existing?.assetPackDraftId ?? null,
    assetPackVersion: existingVersion + 1,
  };
}

function buildAuditEvent(input: {
  record: VoxyRenderAssetPackDraftPreviewRecord;
  existing: VoxyRenderAssetPackDraftPreviewRecord | null;
}): VoxyRenderAssetPackDraftAuditEvent {
  const at = input.record.persistedAt ?? nowIso();
  return {
    id: auditIdFor({
      assetPackDraftId: input.record.assetPackDraftId,
      decisionGateId: input.record.decisionGateId,
      at,
    }),
    assetPackDraftId: input.record.assetPackDraftId,
    costPolicyPreviewId: input.record.costPolicyPreviewId,
    queuePreviewId: input.record.queuePreviewId,
    requestDraftId: input.record.requestDraftId,
    decisionId: input.record.decisionId,
    decisionGateId: input.record.decisionGateId,
    action: "asset_pack_draft_recorded",
    byUserId: input.record.persistedBy,
    at,
    assetPackStatus: input.record.assetPackStatus,
    videoFormat: input.record.videoFormat,
    note: normalizeOptionalString(input.record.reviewerVisibleReason),
    summary: input.record.userVisibleReason,
    previousAssetPackDraftRef: input.existing?.assetPackDraftId ?? null,
  };
}

export function getVoxyRenderAssetPackDraftRepository() {
  return getRepo();
}

export function setVoxyRenderAssetPackDraftRepositoryForTests(
  repo: VoxyRenderAssetPackDraftRepository | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}

export function getVoxyRenderAssetPackDraftPersistenceState() {
  return getRepo().getPersistenceState();
}

export async function getLatestVoxyRenderAssetPackDraftRecord(decisionGateId: string) {
  return getRepo().getLatestRecord(normalizeText(decisionGateId));
}

export async function listVoxyRenderAssetPackDraftRecords(
  params?: VoxyRenderAssetPackDraftRecordListParams,
) {
  return getRepo().listRecords(params);
}

export async function listLatestVoxyRenderAssetPackDraftRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) return new Map<string, VoxyRenderAssetPackDraftPreviewRecord>();
  const records = await getRepo().listRecords({ decisionGateIds: normalized });
  const map = new Map<string, VoxyRenderAssetPackDraftPreviewRecord>();
  for (const record of records) {
    if (record.decisionGateId && !map.has(record.decisionGateId)) {
      map.set(record.decisionGateId, record);
    }
  }
  return map;
}

export async function listVoxyRenderAssetPackDraftAuditEvents(
  params?: VoxyRenderAssetPackDraftAuditListParams,
) {
  return getRepo().listAuditEvents(params);
}

export async function persistVoxyRenderAssetPackDraft(input: {
  command: VoxyRenderAssetPackDraftPreviewCommand;
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
        nextStep: "Decision Gate oder Request-/Queue-/Policy-Referenz sauber ergänzen",
      } satisfies VoxyRenderAssetPackDraftStoreResult,
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
            ? "Bestehende Asset-Pack-Auditspur prüfen"
            : "Persistenzgrenze vor produktivem Rollout härten",
      } satisfies VoxyRenderAssetPackDraftStoreResult,
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
    savedRecord.assetPackStatus === "blocked_by_missing_request_draft" ||
    savedRecord.assetPackStatus === "blocked_by_missing_registry" ||
    savedRecord.assetPackStatus === "blocked_by_missing_required_assets" ||
    savedRecord.assetPackStatus === "blocked_by_runtime_truth";

  return {
    result: {
      ok: !blocked,
      status: blocked ? "blocked" : "preview_only",
      record: savedRecord,
      warnings:
        persistence.mode === "persistent_primary"
          ? []
          : ["in_memory_fallback_active", "record_is_not_production_truth"],
      errors: blocked ? ["asset_pack_draft_blocked"] : [],
      idempotencyKey: savedRecord.idempotencyKey,
      nextStep:
        blocked && savedRecord.assetPackStatus === "blocked_by_missing_request_draft"
          ? "Zuerst einen ehrlichen Render-Request-Draft herstellen"
          : blocked && savedRecord.assetPackStatus === "blocked_by_missing_registry"
            ? "Zuerst Registry-Wahrheit für Assets und Provider herstellen"
            : blocked
              ? "Fehlende Pflichtassets oder Runtime-Blocker sichtbar prüfen"
              : "Asset-Pack-Draft als Review-Hinweis weiterverfolgen",
    } satisfies VoxyRenderAssetPackDraftStoreResult,
    auditEvent,
    persistence,
  };
}
