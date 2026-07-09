import "server-only";

import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import {
  buildVoxyRenderDecisionExecutionFlags,
  buildVoxyRenderDecisionReasonSet,
  type VoxyRenderDecisionPersistenceCommand,
  type VoxyRenderDecisionPersistenceState,
  type VoxyRenderDecisionStoreResult,
  type VoxyRenderPersistedDecisionRecord,
} from "@/features/create/voxyRenderDecisionPersistenceContract";

export const VOXY_RENDER_DECISION_AUDIT_ACTIONS = ["decision_recorded"] as const;

export type VoxyRenderDecisionAuditAction =
  (typeof VOXY_RENDER_DECISION_AUDIT_ACTIONS)[number];

export type VoxyRenderDecisionAuditEvent = {
  id: string;
  decisionId: string;
  decisionGateId: string;
  action: VoxyRenderDecisionAuditAction;
  byUserId: string | null;
  at: string;
  status: VoxyRenderPersistedDecisionRecord["status"];
  selectedDecision: VoxyRenderPersistedDecisionRecord["selectedDecision"];
  note: string | null;
  summary: string;
  previousDecisionRef: string | null;
  executionFlags: VoxyRenderPersistedDecisionRecord["executionFlags"];
};

export type VoxyRenderDecisionRecordListParams = {
  decisionGateId?: string | null;
  decisionGateIds?: string[];
  contributionRefId?: string | null;
  dossierRefId?: string | null;
  limit?: number;
};

export type VoxyRenderDecisionAuditListParams = {
  decisionGateId?: string | null;
  decisionId?: string | null;
  limit?: number;
};

export type VoxyRenderDecisionRepository = {
  saveRecord(record: VoxyRenderPersistedDecisionRecord): Promise<VoxyRenderPersistedDecisionRecord>;
  getLatestRecord(decisionGateId: string): Promise<VoxyRenderPersistedDecisionRecord | null>;
  listRecords(
    params?: VoxyRenderDecisionRecordListParams,
  ): Promise<VoxyRenderPersistedDecisionRecord[]>;
  appendAuditEvent(event: VoxyRenderDecisionAuditEvent): Promise<VoxyRenderDecisionAuditEvent>;
  listAuditEvents(params?: VoxyRenderDecisionAuditListParams): Promise<VoxyRenderDecisionAuditEvent[]>;
  getPersistenceState(): VoxyRenderDecisionPersistenceState;
};

const RECORDS_COLLECTION = "voxy_render_review_decision_records";
const AUDIT_COLLECTION = "voxy_render_review_decision_audits";

let repoSingleton: VoxyRenderDecisionRepository | null = null;
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

function normalizeRef(
  ref: VoxyRenderDecisionPersistenceCommand["contributionRef"],
): VoxyRenderDecisionPersistenceCommand["contributionRef"] {
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
  return Array.from(
    new Set(values?.map((value) => normalizeText(value)).filter(Boolean) ?? []),
  );
}

function decisionIdFor(input: {
  decisionGateId: string;
  selectedDecision: string;
  persistedAt: string;
  persistedBy: string | null;
  reviewerNote: string | null;
}) {
  return `voxy-render-decision:${stableHash(
    [
      input.decisionGateId,
      input.selectedDecision,
      input.persistedAt,
      input.persistedBy ?? "unknown",
      input.reviewerNote ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function auditIdFor(input: {
  decisionId: string;
  decisionGateId: string;
  at: string;
}) {
  return `voxy-render-decision-audit:${stableHash(
    `${input.decisionId}:${input.decisionGateId}:${input.at}`,
  ).slice(0, 24)}`;
}

function buildIdempotencyKey(input: {
  decisionGateId: string;
  selectedDecision: string;
  reviewerNote: string | null;
  reviewerRole: string | null;
  createdBy: string | null;
}) {
  return `voxy-render-decision-idempotency:${stableHash(
    [
      input.decisionGateId,
      input.selectedDecision,
      input.reviewerNote ?? "",
      input.reviewerRole ?? "",
      input.createdBy ?? "",
    ].join(":"),
  ).slice(0, 24)}`;
}

function buildPersistenceState(
  mode: "persistent_primary" | "in_memory_fallback",
): VoxyRenderDecisionPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Voxy-Decision-Store"
      : "In-Memory-Fallback für Voxy-Decision-Store",
    summary: persistent
      ? "Review-Entscheidungen, Versionen und Audit-Spuren liegen dauerhaft getrennt von Render, Provider, Queue, Medien, Kosten und Publishing vor."
      : "Nur Dev-/Test-/Runtime-Fallback: Decision-Records und Audit-Spuren bleiben pro Prozess erhalten und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "VoxyRenderDecisionRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    adminWritePath: "admin_api_available",
  };
}

function buildRecordStatus(
  state: VoxyRenderDecisionPersistenceState,
): VoxyRenderPersistedDecisionRecord["status"] {
  return state.mode === "persistent_primary"
    ? "persisted_review_decision"
    : "noop_persistence";
}

function buildResultStatus(
  state: VoxyRenderDecisionPersistenceState,
): VoxyRenderDecisionStoreResult["status"] {
  return state.mode === "persistent_primary" ? "stored" : "preview_only";
}

function createInMemoryMaps(seed?: {
  records?: VoxyRenderPersistedDecisionRecord[];
  audits?: VoxyRenderDecisionAuditEvent[];
}) {
  const records = new Map<string, VoxyRenderPersistedDecisionRecord>();
  const audits = new Map<string, VoxyRenderDecisionAuditEvent>();
  for (const record of seed?.records ?? []) {
    records.set(record.decisionId, clone(record));
  }
  for (const event of seed?.audits ?? []) {
    audits.set(event.id, clone(event));
  }
  return { records, audits };
}

async function ensureIndexes() {
  if (indexesReady || shouldUseInMemoryMongoFallback()) return;
  const [recordsCol, auditsCol] = await Promise.all([
    coreCol<any>(RECORDS_COLLECTION),
    coreCol<any>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    recordsCol.createIndex({ decisionGateId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ contributionRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ dossierRefId: 1, persistedAt: -1 }),
    recordsCol.createIndex({ status: 1, persistedAt: -1 }),
    auditsCol.createIndex({ decisionGateId: 1, at: -1 }),
    auditsCol.createIndex({ decisionId: 1, at: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): VoxyRenderDecisionRepository {
  return {
    async saveRecord(record) {
      await ensureIndexes();
      const col = await coreCol<any>(RECORDS_COLLECTION);
      await col.updateOne(
        { _id: record.decisionId },
        {
          $set: {
            _id: record.decisionId,
            record: clone(record),
            decisionGateId: record.decisionGateId,
            contributionRefId: record.contributionRef?.id ?? null,
            dossierRefId: record.dossierRef?.id ?? null,
            selectedDecision: record.selectedDecision,
            status: record.status,
            persistedAt: record.persistedAt,
            persistedBy: record.persistedBy,
            decisionVersion: record.decisionVersion,
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
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      if (decisionGateIds.length > 0) {
        filter.decisionGateId = { $in: decisionGateIds };
      } else if (decisionGateId) {
        filter.decisionGateId = decisionGateId;
      }
      if (contributionRefId) filter.contributionRefId = contributionRefId;
      if (dossierRefId) filter.dossierRefId = dossierRefId;
      const cursor = col.find(filter as any).sort({ persistedAt: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs
        .map((doc) => clone(doc.record as VoxyRenderPersistedDecisionRecord))
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
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      if (decisionGateId) filter.decisionGateId = decisionGateId;
      if (decisionId) filter.decisionId = decisionId;
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(Math.max(1, params.limit));
      const docs = await cursor.toArray();
      return docs.map((doc) => clone(doc as VoxyRenderDecisionAuditEvent));
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

export function createInMemoryVoxyRenderDecisionRepository(seed?: {
  records?: VoxyRenderPersistedDecisionRecord[];
  audits?: VoxyRenderDecisionAuditEvent[];
}): VoxyRenderDecisionRepository {
  const state = buildPersistenceState("in_memory_fallback");
  const maps = createInMemoryMaps(seed);
  return {
    async saveRecord(record) {
      maps.records.set(record.decisionId, clone(record));
      return clone(record);
    },
    async getLatestRecord(decisionGateId) {
      const [record] = await this.listRecords({ decisionGateId, limit: 1 });
      return record ?? null;
    },
    async listRecords(params) {
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionGateIds = normalizeDecisionGateIds(params?.decisionGateIds);
      const contributionRefId = normalizeOptionalString(params?.contributionRefId);
      const dossierRefId = normalizeOptionalString(params?.dossierRefId);
      const records = Array.from(maps.records.values())
        .filter((record) =>
          decisionGateIds.length > 0
            ? decisionGateIds.includes(record.decisionGateId)
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
        ? records.slice(0, Math.max(1, params.limit))
        : records;
    },
    async appendAuditEvent(event) {
      maps.audits.set(event.id, clone(event));
      return clone(event);
    },
    async listAuditEvents(params) {
      const decisionGateId = normalizeOptionalString(params?.decisionGateId);
      const decisionId = normalizeOptionalString(params?.decisionId);
      const audits = Array.from(maps.audits.values())
        .filter((event) => (decisionGateId ? event.decisionGateId === decisionGateId : true))
        .filter((event) => (decisionId ? event.decisionId === decisionId : true))
        .sort((left, right) => right.at.localeCompare(left.at))
        .map(clone);
      return typeof params?.limit === "number"
        ? audits.slice(0, Math.max(1, params.limit))
        : audits;
    },
    getPersistenceState() {
      return state;
    },
  };
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryVoxyRenderDecisionRepository()
    : createMongoRepository();
  return repoSingleton;
}

function buildRecordFromCommand(input: {
  command: VoxyRenderDecisionPersistenceCommand;
  existing: VoxyRenderPersistedDecisionRecord | null;
  persistence: VoxyRenderDecisionPersistenceState;
}) {
  const persistedAt = normalizeOptionalString(input.command.createdAt) ?? nowIso();
  const persistedBy = normalizeOptionalString(input.command.createdBy);
  const reviewerNote = normalizeOptionalString(input.command.reviewerNote);
  const reviewerRole = normalizeOptionalString(input.command.reviewerRole);
  const decisionGateId = normalizeText(input.command.decisionGateId);
  const decisionId =
    normalizeOptionalString(input.command.decisionId) ??
    decisionIdFor({
      decisionGateId,
      selectedDecision: input.command.selectedDecision,
      persistedAt,
      persistedBy,
      reviewerNote,
    });
  const reasons = buildVoxyRenderDecisionReasonSet({
    selectedDecision: input.command.selectedDecision,
    reviewerNote,
  });
  const idempotencyKey = buildIdempotencyKey({
    decisionGateId,
    selectedDecision: input.command.selectedDecision,
    reviewerNote,
    reviewerRole,
    createdBy: persistedBy,
  });

  return {
    decisionId,
    decisionGateId,
    contributionRef: normalizeRef(input.command.contributionRef),
    dossierRef: normalizeRef(input.command.dossierRef),
    scriptRef: normalizeRef(input.command.scriptRef),
    handoffRef: normalizeRef(input.command.handoffRef),
    preflightRef: normalizeRef(input.command.preflightRef),
    registryRef: normalizeRef(input.command.registryRef),
    adapterRef: normalizeRef(input.command.adapterRef),
    status: buildRecordStatus(input.persistence),
    selectedDecision: input.command.selectedDecision,
    reviewerVisibleReason: reasons.reviewerVisibleReason,
    userVisibleReason: reasons.userVisibleReason,
    auditReason: reasons.auditReason,
    reviewerNote,
    reviewerRole,
    sourceLanguage: normalizeText(input.command.sourceLanguage),
    readingLanguage: normalizeText(input.command.readingLanguage),
    scriptLanguage: normalizeText(input.command.scriptLanguage),
    renderLanguage: normalizeText(input.command.renderLanguage),
    subtitleLanguage: normalizeOptionalString(input.command.subtitleLanguage),
    originalPreserved: true,
    translationIsEvidence: false,
    persistedAt,
    persistedBy,
    executionFlags: buildVoxyRenderDecisionExecutionFlags(),
    idempotencyKey,
    previousDecisionRef: input.existing?.decisionId ?? null,
    supersedesDecisionRef: input.existing?.decisionId ?? null,
    decisionVersion: (input.existing?.decisionVersion ?? 0) + 1,
  } satisfies VoxyRenderPersistedDecisionRecord;
}

function buildAuditEvent(input: {
  record: VoxyRenderPersistedDecisionRecord;
  existing: VoxyRenderPersistedDecisionRecord | null;
}) {
  const at = input.record.persistedAt ?? nowIso();
  return {
    id: auditIdFor({
      decisionId: input.record.decisionId,
      decisionGateId: input.record.decisionGateId,
      at,
    }),
    decisionId: input.record.decisionId,
    decisionGateId: input.record.decisionGateId,
    action: "decision_recorded",
    byUserId: input.record.persistedBy,
    at,
    status: input.record.status,
    selectedDecision: input.record.selectedDecision,
    note: input.record.reviewerNote,
    summary: input.record.auditReason,
    previousDecisionRef: input.existing?.decisionId ?? null,
    executionFlags: clone(input.record.executionFlags),
  } satisfies VoxyRenderDecisionAuditEvent;
}

export function getVoxyRenderDecisionRepository(): VoxyRenderDecisionRepository {
  return getRepo();
}

export function setVoxyRenderDecisionRepositoryForTests(
  repo: VoxyRenderDecisionRepository | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}

export function getVoxyRenderDecisionPersistenceState() {
  return getRepo().getPersistenceState();
}

export async function getLatestVoxyRenderDecisionRecord(decisionGateId: string) {
  return getRepo().getLatestRecord(normalizeText(decisionGateId));
}

export async function listVoxyRenderDecisionRecords(
  params?: VoxyRenderDecisionRecordListParams,
) {
  return getRepo().listRecords(params);
}

export async function listLatestVoxyRenderDecisionRecordsByDecisionGateIds(
  decisionGateIds: string[],
) {
  const normalized = normalizeDecisionGateIds(decisionGateIds);
  if (normalized.length === 0) return new Map<string, VoxyRenderPersistedDecisionRecord>();
  const records = await getRepo().listRecords({ decisionGateIds: normalized });
  const map = new Map<string, VoxyRenderPersistedDecisionRecord>();
  for (const record of records) {
    if (!map.has(record.decisionGateId)) {
      map.set(record.decisionGateId, record);
    }
  }
  return map;
}

export async function listVoxyRenderDecisionAuditEvents(
  params?: VoxyRenderDecisionAuditListParams,
) {
  return getRepo().listAuditEvents(params);
}

export async function persistVoxyRenderDecision(input: {
  command: VoxyRenderDecisionPersistenceCommand;
}) {
  const repo = getRepo();
  const persistence = repo.getPersistenceState();
  const decisionGateId = normalizeText(input.command.decisionGateId);
  if (!decisionGateId) {
    return {
      result: {
        ok: false,
        status: "blocked",
        record: null,
        warnings: [],
        errors: ["decision_gate_id_missing"],
        nextStep: "Decision Gate sauber referenzieren",
      } satisfies VoxyRenderDecisionStoreResult,
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
    persistence,
  });

  if (existing?.idempotencyKey && existing.idempotencyKey === record.idempotencyKey) {
    return {
      result: {
        ok: true,
        status: buildResultStatus(persistence),
        record: existing,
        warnings:
          persistence.mode === "persistent_primary"
            ? []
            : ["in_memory_fallback_active", "record_is_not_production_truth"],
        errors: [],
        nextStep:
          persistence.mode === "persistent_primary"
            ? "Audit prüfen"
            : "Persistenzgrenze vor produktivem Rollout härten",
      } satisfies VoxyRenderDecisionStoreResult,
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

  return {
    result: {
      ok: true,
      status: buildResultStatus(persistence),
      record: savedRecord,
      warnings:
        persistence.mode === "persistent_primary"
          ? []
          : ["in_memory_fallback_active", "record_is_not_production_truth"],
      errors: [],
      nextStep:
        persistence.mode === "persistent_primary"
          ? "Audit prüfen oder neue Review-Entscheidung dokumentieren"
          : "Store nur als Preview nutzen und produktive Persistenz separat absichern",
    } satisfies VoxyRenderDecisionStoreResult,
    auditEvent,
    persistence,
  };
}
