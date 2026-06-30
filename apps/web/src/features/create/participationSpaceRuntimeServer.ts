import { ObjectId, coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { normalizeGermanSlug } from "@features/common/utils/textNormalization";
import {
  createEmptyParticipationSpace,
  type ParticipationSpace,
} from "@/features/participation/spaceContainer";
import {
  buildParticipationSpaceRuntimeDraftFromHandoff,
  createParticipationSpaceRuntimeAfterReview,
  getParticipationSpaceRuntimeCreationBlockers,
  type ParticipationSpaceRuntimeAuditContext,
  type ParticipationSpaceRuntimeAuditEntry,
  type ParticipationSpaceRuntimeRecord,
  type ParticipationSpaceRuntimeSourceStatus,
} from "@/features/create/participationSpaceRuntime";
import { listCommunitySourceReviewRecords } from "@/features/create/communitySourceReviewServer";
import {
  getPersistedCreateHandoffRecord,
  listPersistedCreateHandoffRecords,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";

export type ParticipationSpaceRuntimePersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  label: string;
  summary: string;
  repositoryInterface: "ParticipationSpaceRuntimeRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
};

type ParticipationSpaceRuntimeCreatedSpaceRecord = {
  id: string;
  slug: string;
  space: ParticipationSpace;
  sourceHandoffId: string;
  sourceReviewItemId: string;
  statementId: string;
  title: string;
  description: string;
  participationQuestion: string;
  relatedAnlassraumId: string | null;
  relatedDossierId: string | null;
  sourceStatus: ParticipationSpaceRuntimeSourceStatus;
  recognizedStandpoints: string[];
  argumentLines: string[];
  openQuestions: string[];
  communitySignals: ParticipationSpaceRuntimeRecord["communitySignals"];
  graphReferences: string[];
  topicReferences: string[];
  regionId: string | null;
  organizationId: string | null;
  createdByUserId: string | null;
  auditContext: ParticipationSpaceRuntimeAuditContext;
  createdAt: string;
  updatedAt: string;
};

type ParticipationSpaceRuntimeRepository = {
  get(sourceHandoffId: string): Promise<ParticipationSpaceRuntimeRecord | null>;
  save(record: ParticipationSpaceRuntimeRecord): Promise<ParticipationSpaceRuntimeRecord>;
  list(limit?: number): Promise<ParticipationSpaceRuntimeRecord[]>;
  insertAudit(
    entry: ParticipationSpaceRuntimeAuditEntry,
  ): Promise<ParticipationSpaceRuntimeAuditEntry>;
  listAudits(params?: {
    sourceHandoffId?: string | null;
    limit?: number;
  }): Promise<ParticipationSpaceRuntimeAuditEntry[]>;
  saveCreatedSpace(
    record: ParticipationSpaceRuntimeCreatedSpaceRecord,
  ): Promise<ParticipationSpaceRuntimeCreatedSpaceRecord>;
  getPersistenceState(): ParticipationSpaceRuntimePersistenceState;
};

const RUNTIME_COLLECTION = "participation_space_runtime_records";
const AUDIT_COLLECTION = "participation_space_runtime_audits";
const SPACE_COLLECTION = "participation_space_runtime_spaces";

let repoSingleton: ParticipationSpaceRuntimeRepository | null = null;

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
  mode: ParticipationSpaceRuntimePersistenceState["mode"],
): ParticipationSpaceRuntimePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistente Beteiligungsraum-Runtime-Creation"
      : "In-Memory-Fallback für Beteiligungsraum-Runtime-Creation",
    summary: persistent
      ? "Review-bestätigte Beteiligungsraum-Creation-Drafts, Freigaben, Audit-Spuren und interne Raumobjekte liegen dauerhaft vor. Erstellung bleibt strikt von Veröffentlichung, öffentlicher Aktivierung, Wahrheit, Verifikation und Graph-/Merge-Automatik getrennt."
      : "Nur Dev-/Test-Fallback: Beteiligungsraum-Creation-Drafts und interne Raumobjekte leben pro Runtime und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "ParticipationSpaceRuntimeRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
  };
}

function auditIdFor(input: {
  sourceHandoffId: string;
  action: ParticipationSpaceRuntimeAuditEntry["action"];
  at: string;
}) {
  return `participation-space-runtime-audit-${stableHash(
    `${input.sourceHandoffId}:${input.action}:${input.at}`,
  ).slice(0, 22)}`;
}

function runtimeRecordId(sourceHandoffId: string) {
  return `participation-space-runtime:${stableHash(
    String(sourceHandoffId).trim(),
  ).slice(0, 18)}`;
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryParticipationSpaceRuntimeRepository()
    : createMongoParticipationSpaceRuntimeRepository();
  return repoSingleton;
}

export function setParticipationSpaceRuntimeRepositoryForTests(
  repo: ParticipationSpaceRuntimeRepository | null,
) {
  repoSingleton = repo;
}

export function createInMemoryParticipationSpaceRuntimeRepository(): ParticipationSpaceRuntimeRepository {
  const records = new Map<string, ParticipationSpaceRuntimeRecord>();
  const audits = new Map<string, ParticipationSpaceRuntimeAuditEntry>();
  const spaces = new Map<string, ParticipationSpaceRuntimeCreatedSpaceRecord>();

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
    async saveCreatedSpace(record) {
      spaces.set(record.id, clone(record));
      return clone(record);
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function createMongoParticipationSpaceRuntimeRepository(): ParticipationSpaceRuntimeRepository {
  return {
    async get(sourceHandoffId) {
      const col = await coreCol<{ _id: string; record: ParticipationSpaceRuntimeRecord }>(
        RUNTIME_COLLECTION,
      );
      const doc = await col.findOne({ _id: runtimeRecordId(sourceHandoffId) } as any);
      return doc?.record ? clone(doc.record) : null;
    },
    async save(record) {
      const col = await coreCol<{ _id: string; record: ParticipationSpaceRuntimeRecord }>(
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
            createdParticipationSpaceId: record.createdParticipationSpaceId,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async list(limit) {
      const col = await coreCol<{ _id: string; record: ParticipationSpaceRuntimeRecord }>(
        RUNTIME_COLLECTION,
      );
      const cursor = col.find({} as any).sort({ updatedAt: -1 });
      if (typeof limit === "number") cursor.limit(limit);
      const docs = await cursor.toArray();
      return docs
        .map((doc) => clone(doc.record))
        .filter((record): record is ParticipationSpaceRuntimeRecord => Boolean(record));
    },
    async insertAudit(entry) {
      const col = await coreCol<ParticipationSpaceRuntimeAuditEntry>(
        AUDIT_COLLECTION,
      );
      await col.updateOne({ id: entry.id } as any, { $set: clone(entry) as any }, { upsert: true });
      return clone(entry);
    },
    async listAudits(params) {
      const col = await coreCol<ParticipationSpaceRuntimeAuditEntry>(
        AUDIT_COLLECTION,
      );
      const filter: Record<string, unknown> = {};
      if (params?.sourceHandoffId) {
        filter.sourceHandoffId = params.sourceHandoffId;
      }
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(params.limit);
      const docs = await cursor.toArray();
      return docs.map(clone);
    },
    async saveCreatedSpace(record) {
      const col = await coreCol<{ _id: string; record: ParticipationSpaceRuntimeCreatedSpaceRecord }>(
        SPACE_COLLECTION,
      );
      await col.updateOne(
        { _id: record.id } as any,
        {
          $set: {
            record: clone(record),
            sourceHandoffId: record.sourceHandoffId,
            slug: record.slug,
            regionId: record.regionId,
            organizationId: record.organizationId,
            updatedAt: record.updatedAt,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

async function recordAudit(
  sourceHandoffId: string,
  entry: Omit<ParticipationSpaceRuntimeAuditEntry, "id" | "sourceHandoffId">,
) {
  const auditEntry: ParticipationSpaceRuntimeAuditEntry = {
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

function buildSpaceSlug(record: ParticipationSpaceRuntimeRecord) {
  return normalizeGermanSlug(record.title, {
    maxLength: 72,
    fallback: "beteiligungsraum",
  });
}

function buildSpaceModules(): ParticipationSpace["modules"] {
  return [
    "topic_overview",
    "status_timeline",
    "open_questions",
    "minority_positions",
    "next_steps",
    "result_feedback",
    "dossier_references",
    "operator_cockpit",
  ];
}

async function materializeRuntimeParticipationSpace(input: {
  record: ParticipationSpaceRuntimeRecord;
  auditContext: ParticipationSpaceRuntimeAuditContext;
}) {
  const sourceRecord = await getPersistedCreateHandoffRecord(input.record.sourceHandoffId);
  if (!sourceRecord) {
    return { ok: false, error: "source_handoff_missing" } as const;
  }

  const createdAt = nowIso();
  const spaceId = `participation-space-${new ObjectId().toHexString()}`;
  const slug = buildSpaceSlug(input.record);
  const space = createEmptyParticipationSpace({
    id: spaceId,
    title: input.record.title,
    slug,
    summary: input.record.description,
    updatedAt: createdAt,
    status: "review_active",
    visibility: "review_only",
    modules: buildSpaceModules(),
  });

  const spaceRecord: ParticipationSpaceRuntimeCreatedSpaceRecord = {
    id: spaceId,
    slug,
    space: {
      ...space,
      publicSummary: {
        ...space.publicSummary,
        headline: input.record.participationQuestion,
        shortSummary: input.record.description,
        openQuestionCount: input.record.openQuestions.length,
        minorityPositionCount: Math.min(
          input.record.recognizedStandpoints.length,
          3,
        ),
        nextStepCount: Math.min(input.record.argumentLines.length, 3),
        lastUpdatedAt: createdAt,
      },
      updatedAt: createdAt,
    },
    sourceHandoffId: input.record.sourceHandoffId,
    sourceReviewItemId: input.record.sourceReviewItemId,
    statementId: input.record.statementId,
    title: input.record.title,
    description: input.record.description,
    participationQuestion: input.record.participationQuestion,
    relatedAnlassraumId: input.record.relatedAnlassraumId,
    relatedDossierId: input.record.relatedDossierId,
    sourceStatus: input.record.sourceStatus,
    recognizedStandpoints: input.record.recognizedStandpoints,
    argumentLines: input.record.argumentLines,
    openQuestions: input.record.openQuestions,
    communitySignals: input.record.communitySignals,
    graphReferences: input.record.graphReferences,
    topicReferences: input.record.topicReferences,
    regionId: sourceRecord.regionId,
    organizationId: sourceRecord.organizationId,
    createdByUserId: trimOrNull(input.auditContext.actorUserId),
    auditContext: input.auditContext,
    createdAt,
    updatedAt: createdAt,
  };

  await getRepo().saveCreatedSpace(spaceRecord);

  return {
    ok: true,
    participationSpaceId: spaceId,
    participationSpaceSlug: slug,
    createdAt,
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
): Promise<ParticipationSpaceRuntimeRecord> {
  const [existing, communityContributions, audits] = await Promise.all([
    getRepo().get(handoff.id),
    communitySignalsForHandoff(handoff.id),
    getRepo().listAudits({ sourceHandoffId: handoff.id, limit: 40 }),
  ]);

  const draft = buildParticipationSpaceRuntimeDraftFromHandoff(handoff, {
    communityContributions,
    status: existing?.status ?? "queued_for_review",
    createdParticipationSpaceId: existing?.createdParticipationSpaceId ?? null,
    createdParticipationSpaceSlug: existing?.createdParticipationSpaceSlug ?? null,
    approvedForSetup: true,
    visibility: existing?.visibility ?? "internal_review",
    graphContextPending: existing?.graphContextPending,
    dossierContextPending: existing?.dossierContextPending,
    anlassraumContextPending: existing?.anlassraumContextPending,
    auditContext: existing?.auditContext ?? {},
  });

  return {
    ...draft,
    id: existing?.id ?? draft.id,
    blockers:
      existing?.status === "approved_for_creation" ||
      existing?.status === "created"
        ? getParticipationSpaceRuntimeCreationBlockers(draft)
        : draft.blockers,
    auditTrail:
      audits.length > 0
        ? audits
        : [
            {
              id: `participation-space-runtime-derived-${handoff.id}`,
              sourceHandoffId: handoff.id,
              at: handoff.updatedAt,
              action: "draft_derived",
              actorUserId: handoff.createdByUserId,
              note:
                "Beteiligungsraum-Creation-Draft aus bestehendem Create-Handoff abgeleitet. Noch nicht erstellt, aktiviert oder veröffentlicht.",
              blockers: draft.blockers,
              status: draft.status,
            },
          ],
    approvedForCreationAt: existing?.approvedForCreationAt ?? null,
    approvedForCreationBy: existing?.approvedForCreationBy ?? null,
    rejectedAt: existing?.rejectedAt ?? null,
    rejectedBy: existing?.rejectedBy ?? null,
  };
}

async function saveRecord(record: ParticipationSpaceRuntimeRecord) {
  return getRepo().save(record);
}

export function getParticipationSpaceRuntimePersistenceState() {
  return getRepo().getPersistenceState();
}

export async function listParticipationSpaceRuntimeRecords(limit = 40) {
  const records = await listPersistedCreateHandoffRecords();
  const handoffs = records
    .filter(
      (record) => record.selectedAction === "prepare_participation_space",
    )
    .slice(0, limit);
  const runtimeRecords = await Promise.all(handoffs.map(buildRuntimeRecord));
  return runtimeRecords.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function getParticipationSpaceRuntimeRecord(sourceHandoffId: string) {
  const handoff = await getPersistedCreateHandoffRecord(sourceHandoffId);
  if (!handoff || handoff.selectedAction !== "prepare_participation_space") {
    return null;
  }
  return buildRuntimeRecord(handoff);
}

export async function listParticipationSpaceRuntimeAudits(params?: {
  sourceHandoffId?: string | null;
  limit?: number;
}) {
  return getRepo().listAudits(params);
}

export async function approveParticipationSpaceCreation(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getParticipationSpaceRuntimeRecord(input.sourceHandoffId);
  if (!record) {
    throw new Error("participation_space_runtime_record_not_found");
  }

  const approvedAt = nowIso();
  const candidate: ParticipationSpaceRuntimeRecord = {
    ...record,
    status: "approved_for_creation",
    auditContext: {
      actorUserId: input.actorUserId,
      reason:
        trimOrNull(input.note) ??
        "Review-approved Beteiligungsraum-Creation im bestehenden Admin-Review freigegeben.",
      origin: "admin_review",
      approvedAt,
    },
    approvedForCreationAt: approvedAt,
    approvedForCreationBy: input.actorUserId,
    updatedAt: approvedAt,
  };

  const blockers = getParticipationSpaceRuntimeCreationBlockers(candidate).filter(
    (blocker) => blocker !== "review_not_approved",
  );
  if (blockers.length > 0) {
    const blockedRecord: ParticipationSpaceRuntimeRecord = {
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

  const approvedRecord: ParticipationSpaceRuntimeRecord = {
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
      "Beteiligungsraum-Erstellung explizit freigegeben. Erstellung bleibt getrennt von Veröffentlichung und öffentlicher Aktivierung.",
    blockers: [],
    status: "approved_for_creation",
  });
  return approvedRecord;
}

export async function rejectParticipationSpaceCreation(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getParticipationSpaceRuntimeRecord(input.sourceHandoffId);
  if (!record) {
    throw new Error("participation_space_runtime_record_not_found");
  }

  const rejectedAt = nowIso();
  const rejectedRecord: ParticipationSpaceRuntimeRecord = {
    ...record,
    status: "rejected",
    blockers: [],
    rejectedAt,
    rejectedBy: input.actorUserId,
    auditContext: {
      actorUserId: input.actorUserId,
      reason:
        trimOrNull(input.note) ??
        "Beteiligungsraum-Erstellung im Review zurückgewiesen.",
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
      "Beteiligungsraum-Erstellung abgelehnt. Kein Beteiligungsraum und keine öffentliche Sichtbarkeit wurden erzeugt.",
    blockers: [],
    status: "rejected",
  });
  return rejectedRecord;
}

export async function createApprovedParticipationSpace(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getParticipationSpaceRuntimeRecord(input.sourceHandoffId);
  if (!record) {
    throw new Error("participation_space_runtime_record_not_found");
  }

  const result = await createParticipationSpaceRuntimeAfterReview(record, {
    auditContext: {
      actorUserId: input.actorUserId,
      reason:
        trimOrNull(input.note) ??
        record.auditContext.reason ??
        "Review-approved Beteiligungsraum-Creation in bestehende Runtime geschrieben.",
      origin: "participation_space_runtime",
      approvedAt: record.approvedForCreationAt ?? nowIso(),
    },
    creator: materializeRuntimeParticipationSpace,
  });

  if (result.ok === false) {
    const blockedRecord: ParticipationSpaceRuntimeRecord = {
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

  const createdRecord: ParticipationSpaceRuntimeRecord = {
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
      "Beteiligungsraum-Runtime erstellt. Der Status bleibt interner Arbeitsstand und nicht öffentlich.",
    blockers: [],
    status: "created",
    participationSpaceId: createdRecord.createdParticipationSpaceId,
    participationSpaceSlug: createdRecord.createdParticipationSpaceSlug,
  });
  return createdRecord;
}
