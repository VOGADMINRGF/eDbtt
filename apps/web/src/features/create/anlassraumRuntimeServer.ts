import { ObjectId, coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { createManualAnlassraum } from "@features/anlassraum/service";
import { anlassraumCol, anlassraumStructureCol } from "@features/anlassraum/db";
import type { AnlassraumStructureDoc } from "@features/anlassraum/types";
import type { StatementRecord, NoteRecord, QuestionRecord, KnotRecord } from "@features/analyze/schemas";
import {
  buildAnlassraumRuntimeDraftFromHandoff,
  createAnlassraumRuntimeAfterReview,
  getAnlassraumRuntimeCreationBlockers,
  type AnlassraumRuntimeAuditContext,
  type AnlassraumRuntimeAuditEntry,
  type AnlassraumRuntimeCreationBlocker,
  type AnlassraumRuntimeRecord,
} from "@/features/create/anlassraumRuntime";
import { listCommunitySourceReviewRecords } from "@/features/create/communitySourceReviewServer";
import {
  getPersistedCreateHandoffRecord,
  listPersistedCreateHandoffRecords,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";

export type AnlassraumRuntimePersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  label: string;
  summary: string;
  repositoryInterface: "AnlassraumRuntimeRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
};

type AnlassraumRuntimeRepository = {
  get(sourceHandoffId: string): Promise<AnlassraumRuntimeRecord | null>;
  save(record: AnlassraumRuntimeRecord): Promise<AnlassraumRuntimeRecord>;
  list(limit?: number): Promise<AnlassraumRuntimeRecord[]>;
  insertAudit(entry: AnlassraumRuntimeAuditEntry): Promise<AnlassraumRuntimeAuditEntry>;
  listAudits(params?: {
    sourceHandoffId?: string | null;
    limit?: number;
  }): Promise<AnlassraumRuntimeAuditEntry[]>;
  getPersistenceState(): AnlassraumRuntimePersistenceState;
};

const RUNTIME_COLLECTION = "anlassraum_runtime_records";
const AUDIT_COLLECTION = "anlassraum_runtime_audits";

let repoSingleton: AnlassraumRuntimeRepository | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function trimOrNull(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function buildPersistenceState(
  mode: AnlassraumRuntimePersistenceState["mode"],
): AnlassraumRuntimePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistente Anlassraum-Runtime-Creation"
      : "In-Memory-Fallback für Anlassraum-Runtime-Creation",
    summary: persistent
      ? "Review-bestätigte Anlassraum-Creation-Drafts, Freigaben und Audit-Spuren liegen dauerhaft vor. Erstellung bleibt strikt von Publish, Wahrheit, Verifikation, Graph-/Merge-Automatik und Beteiligungsraum-Erzeugung getrennt."
      : "Nur Dev-/Test-Fallback: Anlassraum-Creation-Drafts und Audit-Spuren leben pro Runtime und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "AnlassraumRuntimeRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
  };
}

function auditIdFor(input: {
  sourceHandoffId: string;
  action: AnlassraumRuntimeAuditEntry["action"];
  at: string;
}) {
  return `anlassraum-runtime-audit-${stableHash(
    `${input.sourceHandoffId}:${input.action}:${input.at}`,
  ).slice(0, 22)}`;
}

function runtimeRecordId(sourceHandoffId: string) {
  return `anlassraum-runtime:${stableHash(String(sourceHandoffId).trim()).slice(0, 18)}`;
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryAnlassraumRuntimeRepository()
    : createMongoAnlassraumRuntimeRepository();
  return repoSingleton;
}

export function setAnlassraumRuntimeRepositoryForTests(
  repo: AnlassraumRuntimeRepository | null,
) {
  repoSingleton = repo;
}

export function createInMemoryAnlassraumRuntimeRepository(): AnlassraumRuntimeRepository {
  const records = new Map<string, AnlassraumRuntimeRecord>();
  const audits = new Map<string, AnlassraumRuntimeAuditEntry>();

  return {
    async get(sourceHandoffId) {
      const record = records.get(sourceHandoffId);
      return record ? clone(record) : null;
    },
    async save(record) {
      records.set(record.sourceHandoffId, clone(record));
      return clone(record);
    },
    async list(limit) {
      const list = Array.from(records.values()).sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
      return (typeof limit === "number" ? list.slice(0, limit) : list).map(clone);
    },
    async insertAudit(entry) {
      audits.set(entry.id, clone(entry));
      return clone(entry);
    },
    async listAudits(params) {
      const list = Array.from(audits.values())
        .filter((entry) => {
          if (
            params?.sourceHandoffId &&
            entry.sourceHandoffId !== params.sourceHandoffId
          ) {
            return false;
          }
          return true;
        })
        .sort((left, right) => right.at.localeCompare(left.at));
      return (typeof params?.limit === "number" ? list.slice(0, params.limit) : list).map(
        clone,
      );
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function createMongoAnlassraumRuntimeRepository(): AnlassraumRuntimeRepository {
  return {
    async get(sourceHandoffId) {
      const col = await coreCol<{ _id: string; record: AnlassraumRuntimeRecord }>(
        RUNTIME_COLLECTION,
      );
      const doc = await col.findOne({ _id: runtimeRecordId(sourceHandoffId) } as any);
      return doc?.record ? clone(doc.record) : null;
    },
    async save(record) {
      const col = await coreCol<{ _id: string; record: AnlassraumRuntimeRecord }>(
        RUNTIME_COLLECTION,
      );
      await col.updateOne(
        { _id: runtimeRecordId(record.sourceHandoffId) } as any,
        {
          $set: {
            record: clone(record),
            sourceHandoffId: record.sourceHandoffId,
            status: record.status,
            updatedAt: record.updatedAt,
            createdAnlassraumId: record.createdAnlassraumId,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async list(limit) {
      const col = await coreCol<{ _id: string; record: AnlassraumRuntimeRecord }>(
        RUNTIME_COLLECTION,
      );
      const cursor = col.find({} as any).sort({ updatedAt: -1 });
      if (typeof limit === "number") cursor.limit(limit);
      const docs = await cursor.toArray();
      return docs
        .map((doc) => clone(doc.record))
        .filter((record): record is AnlassraumRuntimeRecord => Boolean(record));
    },
    async insertAudit(entry) {
      const col = await coreCol<AnlassraumRuntimeAuditEntry>(AUDIT_COLLECTION);
      await col.updateOne({ id: entry.id } as any, { $set: clone(entry) as any }, { upsert: true });
      return clone(entry);
    },
    async listAudits(params) {
      const col = await coreCol<AnlassraumRuntimeAuditEntry>(AUDIT_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params?.sourceHandoffId) {
        filter.sourceHandoffId = params.sourceHandoffId;
      }
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(params.limit);
      const docs = await cursor.toArray();
      return docs.map(clone);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

async function recordAudit(
  sourceHandoffId: string,
  entry: Omit<AnlassraumRuntimeAuditEntry, "id" | "sourceHandoffId">,
) {
  const auditEntry: AnlassraumRuntimeAuditEntry = {
    ...entry,
    sourceHandoffId,
    id: auditIdFor({
      sourceHandoffId,
      action: entry.action,
      at: entry.at,
    }),
  };
  return getRepo().insertAudit(auditEntry);
}

function normalizeTopicKey(value: string): string {
  return (
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9äöüß-]/g, "")
      .slice(0, 64) || "anlass"
  );
}

function scopeForHandoff(record: PersistedCreateHandoffRecord) {
  return record.regionId ? "regional" : "global";
}

function ownerPolicyForHandoff(record: PersistedCreateHandoffRecord) {
  if (record.organizationId) {
    return {
      ownerType: "organization" as const,
      ownerId: record.organizationId,
    };
  }
  if (record.regionId) {
    return {
      ownerType: "government" as const,
      ownerId: record.regionId,
    };
  }
  return {
    ownerType: "editorial" as const,
    ownerId: record.createdByUserId,
  };
}

function mapClaims(record: AnlassraumRuntimeRecord): StatementRecord[] {
  const lines = [...record.recognizedStandpoints, ...record.argumentLines];
  return uniqueLines(lines).map((text, index) => ({
    id: `anlassraum-runtime-claim-${index + 1}`,
    text,
    title: null,
    responsibility: null,
    importance: 3,
    topic: record.topicReferences[0] ?? null,
    domain: null,
    domains: null,
    stance: text.startsWith("Contra:")
      ? "contra"
      : text.startsWith("Pro:")
        ? "pro"
        : "neutral",
    statementType: "interpretation",
  }));
}

function mapQuestions(record: AnlassraumRuntimeRecord): QuestionRecord[] {
  return record.openQuestions.map((text, index) => ({
    id: `anlassraum-runtime-question-${index + 1}`,
    text,
    dimension: "review_context",
  }));
}

function mapNotes(record: AnlassraumRuntimeRecord): NoteRecord[] {
  const notes: NoteRecord[] = [
    {
      id: "anlassraum-runtime-description",
      text: record.description,
      kind: "description",
    },
  ];

  if (record.relatedDossierId) {
    notes.push({
      id: "anlassraum-runtime-dossier-context",
      text: `Dossier-Kontext: ${record.relatedDossierId}. Dossier-Bezug ist Review-Kontext, keine automatische Wahrheit.`,
      kind: "dossier_context",
    });
  }

  notes.push({
    id: "anlassraum-runtime-guardrails",
    text: "Erstellung bedeutet nicht Veröffentlichung. Es wird kein Beteiligungsraum automatisch erstellt.",
    kind: "guardrail",
  });

  return notes;
}

function mapKnots(record: AnlassraumRuntimeRecord): KnotRecord[] {
  return record.graphReferences.slice(0, 6).map((label, index) => ({
    id: `anlassraum-runtime-knot-${index + 1}`,
    label,
    description: "Graph-Bezug als Review-Kontext, nicht als Beweis.",
  }));
}

function uniqueLines(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function materializeRuntimeAnlassraum(input: {
  record: AnlassraumRuntimeRecord;
  auditContext: AnlassraumRuntimeAuditContext;
}) {
  const actorUserId = trimOrNull(input.auditContext.actorUserId) ?? "admin";
  const sourceRecord = await getPersistedCreateHandoffRecord(input.record.sourceHandoffId);
  if (!sourceRecord) {
    return { ok: false, error: "source_handoff_missing" } as const;
  }
  const ownerPolicy = ownerPolicyForHandoff(sourceRecord);
  const created = await createManualAnlassraum({
    entityId: new ObjectId(),
    type: "policy",
    title: input.record.title,
    summary: input.record.description,
    topicKey: normalizeTopicKey(
      input.record.topicReferences[0] ?? input.record.title,
    ),
    regionKey: sourceRecord.regionId,
    scope: scopeForHandoff(sourceRecord),
    decisionScope: scopeForHandoff(sourceRecord),
    ownerType: ownerPolicy.ownerType,
    ownerId: ownerPolicy.ownerId,
    originType: "manual",
    roomType: "editorial",
    createdBy: actorUserId,
  });

  const anlassraumId = created.anlassraumId;
  const roomCol = await anlassraumCol();
  const structureCol = await anlassraumStructureCol();
  const now = new Date();
  const dossierId = ObjectId.isValid(String(input.record.relatedDossierId ?? ""))
    ? new ObjectId(String(input.record.relatedDossierId))
    : null;

  await roomCol.updateOne(
    { _id: anlassraumId },
    {
      $set: {
        summary: input.record.description,
        roomType: "editorial",
        originType: "manual",
        pipeline: "create_handoff_review",
        dossierId,
        updatedAt: now,
      } as any,
    },
  );

  const structure: AnlassraumStructureDoc = {
    anlassraumId,
    claims: mapClaims(input.record),
    notes: mapNotes(input.record),
    questions: mapQuestions(input.record),
    knots: mapKnots(input.record),
    segments: input.record.topicReferences.length > 0 ? input.record.topicReferences : ["anlassraum_runtime"],
    actors: [],
    evidenceSummary: input.record.description,
    riskFlags: [],
    createdAt: now,
    updatedAt: now,
  };

  await structureCol.updateOne(
    { anlassraumId },
    {
      $set: {
        claims: structure.claims,
        notes: structure.notes,
        questions: structure.questions,
        knots: structure.knots,
        segments: structure.segments,
        actors: structure.actors,
        evidenceSummary: structure.evidenceSummary,
        riskFlags: structure.riskFlags,
        updatedAt: now,
      },
      $setOnInsert: {
        anlassraumId,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const createdRoom = await roomCol.findOne({ _id: anlassraumId });

  return {
    ok: true,
    anlassraumId: anlassraumId.toHexString(),
    entityId:
      createdRoom?.entityId && typeof createdRoom.entityId.toHexString === "function"
        ? createdRoom.entityId.toHexString()
        : null,
    createdAt: nowIso(),
  } as const;
}

async function communitySignalsForHandoff(sourceHandoffId: string) {
  const records = await listCommunitySourceReviewRecords(200).catch(() => []);
  return records.filter(
    (record) =>
      record.target === "handoff_review_item" &&
      record.targetId === sourceHandoffId,
  );
}

async function buildRuntimeRecord(
  handoff: PersistedCreateHandoffRecord,
): Promise<AnlassraumRuntimeRecord> {
  const [existing, communityContributions, audits] = await Promise.all([
    getRepo().get(handoff.id),
    communitySignalsForHandoff(handoff.id),
    getRepo().listAudits({ sourceHandoffId: handoff.id, limit: 40 }),
  ]);

  const draft = buildAnlassraumRuntimeDraftFromHandoff(handoff, {
    communityContributions,
    status: existing?.status ?? "queued_for_review",
    createdAnlassraumId: existing?.createdAnlassraumId ?? null,
    createdEntityId: existing?.createdEntityId ?? null,
    approvedForSetup: true,
    visibility: existing?.visibility ?? "internal_review",
    graphContextPending: existing?.graphContextPending,
    dossierContextPending: existing?.dossierContextPending,
    auditContext: existing?.auditContext ?? {},
  });

  const record: AnlassraumRuntimeRecord = {
    ...draft,
    id: existing?.id ?? draft.id,
    blockers:
      existing?.status === "approved_for_creation" ||
      existing?.status === "created"
        ? getAnlassraumRuntimeCreationBlockers(draft)
        : draft.blockers,
    auditTrail:
      audits.length > 0
        ? audits
        : [
            {
              id: `anlassraum-runtime-derived-${handoff.id}`,
              sourceHandoffId: handoff.id,
              at: handoff.updatedAt,
              action: "draft_derived",
              actorUserId: handoff.createdByUserId,
              note:
                "Anlassraum-Creation-Draft aus bestehendem Create-Handoff abgeleitet. Noch nicht erstellt und nicht veröffentlicht.",
              blockers: draft.blockers,
              status: draft.status,
            },
          ],
    approvedForCreationAt: existing?.approvedForCreationAt ?? null,
    approvedForCreationBy: existing?.approvedForCreationBy ?? null,
    rejectedAt: existing?.rejectedAt ?? null,
    rejectedBy: existing?.rejectedBy ?? null,
  };

  return record;
}

async function saveRecord(record: AnlassraumRuntimeRecord) {
  return getRepo().save(record);
}

export function getAnlassraumRuntimePersistenceState() {
  return getRepo().getPersistenceState();
}

export async function listAnlassraumRuntimeRecords(limit = 40) {
  const records = await listPersistedCreateHandoffRecords();
  const handoffs = records
    .filter((record) => record.selectedAction === "prepare_anlassraum")
    .slice(0, limit);
  const runtimeRecords = await Promise.all(handoffs.map(buildRuntimeRecord));
  return runtimeRecords.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function getAnlassraumRuntimeRecord(sourceHandoffId: string) {
  const handoff = await getPersistedCreateHandoffRecord(sourceHandoffId);
  if (!handoff || handoff.selectedAction !== "prepare_anlassraum") return null;
  return buildRuntimeRecord(handoff);
}

export async function listAnlassraumRuntimeAudits(params?: {
  sourceHandoffId?: string | null;
  limit?: number;
}) {
  return getRepo().listAudits(params);
}

export async function approveAnlassraumCreation(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getAnlassraumRuntimeRecord(input.sourceHandoffId);
  if (!record) throw new Error("anlassraum_runtime_record_not_found");

  const approvedAt = nowIso();
  const candidate: AnlassraumRuntimeRecord = {
    ...record,
    status: "approved_for_creation",
    auditContext: {
      actorUserId: input.actorUserId,
      reason:
        trimOrNull(input.note) ??
        "Review-approved Anlassraum-Creation im bestehenden Admin-Review freigegeben.",
      origin: "admin_review",
      approvedAt,
    },
    approvedForCreationAt: approvedAt,
    approvedForCreationBy: input.actorUserId,
    updatedAt: approvedAt,
  };

  const blockers = getAnlassraumRuntimeCreationBlockers(candidate).filter(
    (blocker) => blocker !== "review_not_approved",
  );
  if (blockers.length > 0) {
    const blockedRecord: AnlassraumRuntimeRecord = {
      ...candidate,
      status: "blocked",
      blockers,
    };
    await saveRecord(blockedRecord);
    await recordAudit(input.sourceHandoffId, {
      at: approvedAt,
      action: "creation_blocked",
      actorUserId: input.actorUserId,
      note:
        trimOrNull(input.note) ??
        "Freigabeversuch blockiert, weil Guardrail- oder Review-Blocker offen sind.",
      blockers,
      status: "blocked",
    });
    return blockedRecord;
  }

  const approvedRecord: AnlassraumRuntimeRecord = {
    ...candidate,
    blockers: [],
  };
  await saveRecord(approvedRecord);
  await recordAudit(input.sourceHandoffId, {
    at: approvedAt,
    action: "creation_approved",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Anlassraum-Erstellung explizit freigegeben. Erstellung bleibt getrennt von Veröffentlichung und Beteiligungsraum.",
    blockers: [],
    status: "approved_for_creation",
  });
  return approvedRecord;
}

export async function rejectAnlassraumCreation(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getAnlassraumRuntimeRecord(input.sourceHandoffId);
  if (!record) throw new Error("anlassraum_runtime_record_not_found");

  const rejectedAt = nowIso();
  const rejectedRecord: AnlassraumRuntimeRecord = {
    ...record,
    status: "rejected",
    blockers: [],
    rejectedAt,
    rejectedBy: input.actorUserId,
    auditContext: {
      actorUserId: input.actorUserId,
      reason:
        trimOrNull(input.note) ??
        "Anlassraum-Erstellung im Review zurückgewiesen.",
      origin: "admin_review",
      approvedAt: record.auditContext.approvedAt,
    },
    updatedAt: rejectedAt,
  };

  await saveRecord(rejectedRecord);
  await recordAudit(input.sourceHandoffId, {
    at: rejectedAt,
    action: "creation_rejected",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Anlassraum-Erstellung abgelehnt. Kein Anlassraum und keine Veröffentlichung wurden erzeugt.",
    blockers: [],
    status: "rejected",
  });
  return rejectedRecord;
}

export async function createApprovedAnlassraum(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getAnlassraumRuntimeRecord(input.sourceHandoffId);
  if (!record) throw new Error("anlassraum_runtime_record_not_found");

  const result = await createAnlassraumRuntimeAfterReview(record, {
    auditContext: {
      actorUserId: input.actorUserId,
      reason:
        trimOrNull(input.note) ??
        record.auditContext.reason ??
        "Review-approved Anlassraum-Creation in bestehende Runtime geschrieben.",
      origin: "anlassraum_runtime",
      approvedAt: record.approvedForCreationAt ?? nowIso(),
    },
    creator: materializeRuntimeAnlassraum,
  });

  if (result.ok === false) {
    const blockedRecord: AnlassraumRuntimeRecord = {
      ...record,
      status: result.error === "blocked" ? "blocked" : record.status,
      blockers: result.blockers,
      updatedAt: nowIso(),
    };
    await saveRecord(blockedRecord);
    await recordAudit(input.sourceHandoffId, {
      at: blockedRecord.updatedAt,
      action: "creation_blocked",
      actorUserId: input.actorUserId,
      note: trimOrNull(input.note) ?? result.message,
      blockers: result.blockers,
      status: blockedRecord.status,
    });
    return blockedRecord;
  }

  const createdRecord: AnlassraumRuntimeRecord = {
    ...result.record,
    blockers: [],
    approvedForCreationAt: record.approvedForCreationAt,
    approvedForCreationBy: record.approvedForCreationBy,
    rejectedAt: record.rejectedAt,
    rejectedBy: record.rejectedBy,
    auditTrail: record.auditTrail,
  };
  await saveRecord(createdRecord);
  await recordAudit(input.sourceHandoffId, {
    at: createdRecord.updatedAt,
    action: "runtime_created",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Anlassraum-Runtime erstellt. Der Status bleibt interner Arbeitsstand und nicht veröffentlicht.",
    blockers: [],
    status: "created",
    anlassraumId: createdRecord.createdAnlassraumId,
    entityId: createdRecord.createdEntityId,
  });
  return createdRecord;
}
