import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import {
  approveDossierPublication as approveDossierPublicationRecord,
  archiveDossierPublication as archiveDossierPublicationRecord,
  blockDossierPublication as blockDossierPublicationRecord,
  buildDossierPublicationDraft,
  getDossierPublicationBlockers,
  isPublicDossier,
  publishDossier,
  rejectDossierPublication as rejectDossierPublicationRecord,
  requestDossierPublicationReview as requestDossierPublicationReviewRecord,
  type DossierPublicationRecord,
  type DossierPublishAuditEvent,
  unpublishDossier as unpublishDossierRecord,
} from "@/features/create/dossierPublishWorkflow";
import {
  getDossierRuntimeRecord,
  listDossierRuntimeRecords,
  syncDossierRuntimePublicationVisibility,
} from "@/features/create/dossierRuntimeServer";
import type { DossierRuntimeRecord } from "@/features/create/dossierRuntime";

export type DossierPublicationPersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  label: string;
  summary: string;
  repositoryInterface: "DossierPublicationWorkflowRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  publicRouteRuntime: "runtime_wired";
};

type DossierPublicationRepository = {
  get(sourceHandoffId: string): Promise<DossierPublicationRecord | null>;
  save(record: DossierPublicationRecord): Promise<DossierPublicationRecord>;
  list(limit?: number): Promise<DossierPublicationRecord[]>;
  insertAudit(entry: DossierPublishAuditEvent): Promise<DossierPublishAuditEvent>;
  listAudits(params?: {
    sourceHandoffId?: string | null;
    limit?: number;
  }): Promise<DossierPublishAuditEvent[]>;
  getPersistenceState(): DossierPublicationPersistenceState;
};

const PUBLICATION_COLLECTION = "dossier_publication_records";
const AUDIT_COLLECTION = "dossier_publication_audits";

let repoSingleton: DossierPublicationRepository | null = null;

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function trimOrNull(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function buildPersistenceState(
  mode: DossierPublicationPersistenceState["mode"],
): DossierPublicationPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Dossier-Publish-Workflow"
      : "In-Memory-Fallback für Dossier-Publish-Workflow",
    summary: persistent
      ? "Separater Veröffentlichungsworkflow, Audit-Spuren und Public-Readmodel-Status liegen dauerhaft vor. Creation bleibt strikt von Veröffentlichung, Wahrheit und Verifikation getrennt."
      : "Nur Dev-/Test-Fallback: Veröffentlichungsentscheidungen leben pro Runtime und sind keine belastbare Produktionswahrheit.",
    repositoryInterface: "DossierPublicationWorkflowRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
    publicRouteRuntime: "runtime_wired",
  };
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryDossierPublicationRepository()
    : createMongoDossierPublicationRepository();
  return repoSingleton;
}

export function setDossierPublicationRepositoryForTests(
  repo: DossierPublicationRepository | null,
) {
  repoSingleton = repo;
}

function publicationRecordId(sourceHandoffId: string) {
  return `dossier-publication:${stableHash(String(sourceHandoffId).trim()).slice(0, 18)}`;
}

function auditIdFor(input: {
  sourceHandoffId: string;
  action: DossierPublishAuditEvent["action"];
  at: string;
}) {
  return `dossier-publication-audit-${stableHash(
    `${input.sourceHandoffId}:${input.action}:${input.at}`,
  ).slice(0, 22)}`;
}

function createInMemoryDossierPublicationRepository(): DossierPublicationRepository {
  const records = new Map<string, DossierPublicationRecord>();
  const audits = new Map<string, DossierPublishAuditEvent>();
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
        .filter((entry) =>
          params?.sourceHandoffId
            ? entry.sourceHandoffId === params.sourceHandoffId
            : true,
        )
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

function createMongoDossierPublicationRepository(): DossierPublicationRepository {
  return {
    async get(sourceHandoffId) {
      const col = await coreCol<{ _id: string; record: DossierPublicationRecord }>(
        PUBLICATION_COLLECTION,
      );
      const doc = await col.findOne({ _id: publicationRecordId(sourceHandoffId) } as any);
      return doc?.record ? clone(doc.record) : null;
    },
    async save(record) {
      const col = await coreCol<{ _id: string; record: DossierPublicationRecord }>(
        PUBLICATION_COLLECTION,
      );
      await col.updateOne(
        { _id: publicationRecordId(record.sourceHandoffId) } as any,
        {
          $set: {
            record: clone(record),
            sourceHandoffId: record.sourceHandoffId,
            dossierId: record.dossierId,
            status: record.status,
            visibility: record.visibility,
            publicAccessMode: record.publicAccessMode,
            updatedAt: record.updatedAt,
          } as any,
        },
        { upsert: true },
      );
      return clone(record);
    },
    async list(limit) {
      const col = await coreCol<{ _id: string; record: DossierPublicationRecord }>(
        PUBLICATION_COLLECTION,
      );
      const cursor = col.find({} as any).sort({ updatedAt: -1 });
      if (typeof limit === "number") cursor.limit(limit);
      const docs = await cursor.toArray();
      return docs
        .map((doc) => clone(doc.record))
        .filter((record): record is DossierPublicationRecord => Boolean(record));
    },
    async insertAudit(entry) {
      const col = await coreCol<DossierPublishAuditEvent>(AUDIT_COLLECTION);
      await col.updateOne({ id: entry.id } as any, { $set: clone(entry) as any }, { upsert: true });
      return clone(entry);
    },
    async listAudits(params) {
      const col = await coreCol<DossierPublishAuditEvent>(AUDIT_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params?.sourceHandoffId) filter.sourceHandoffId = params.sourceHandoffId;
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

function defaultStatusFromRuntime(record: DossierRuntimeRecord) {
  if (record.visibility === "published") return "published" as const;
  if (record.visibility === "ready_for_publish_review") {
    return "ready_for_publication_review" as const;
  }
  if (record.status === "created") return "review_only" as const;
  return "draft_internal" as const;
}

async function recordAudit(
  sourceHandoffId: string,
  entry: Omit<DossierPublishAuditEvent, "id" | "sourceHandoffId">,
) {
  const auditEntry: DossierPublishAuditEvent = {
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

async function buildPublicationRecord(
  runtimeRecord: DossierRuntimeRecord,
): Promise<DossierPublicationRecord> {
  const [existing, audits] = await Promise.all([
    getRepo().get(runtimeRecord.sourceHandoffId),
    getRepo().listAudits({
      sourceHandoffId: runtimeRecord.sourceHandoffId,
      limit: 60,
    }),
  ]);

  const draft = buildDossierPublicationDraft(runtimeRecord, {
    status: existing?.status ?? defaultStatusFromRuntime(runtimeRecord),
    visibility: existing?.visibility ?? "internal",
    publicAccessMode: existing?.publicAccessMode ?? "none",
    creationAudited: existing?.creationAudited,
    auditContext: existing?.auditContext ?? {},
    createdAt: existing?.createdAt ?? runtimeRecord.createdAt,
    updatedAt: existing?.updatedAt ?? runtimeRecord.updatedAt,
  });

  return {
    ...draft,
    auditTrail:
      audits.length > 0
        ? audits
        : [
            {
              id: `dossier-publication-derived:${runtimeRecord.sourceHandoffId}`,
              sourceHandoffId: runtimeRecord.sourceHandoffId,
              dossierId: draft.dossierId,
              at: runtimeRecord.updatedAt,
              action: "publication_review_requested",
              actorUserId: runtimeRecord.auditContext.actorUserId,
              note:
                "Separater Dossier-Veröffentlichungspfad aus erzeugter Runtime abgeleitet. Noch nicht öffentlich sichtbar.",
              blockers: getDossierPublicationBlockers(draft),
              status: draft.status,
            },
          ],
    approvedForPublicationAt: existing?.approvedForPublicationAt ?? null,
    approvedForPublicationBy: existing?.approvedForPublicationBy ?? null,
    rejectedAt: existing?.rejectedAt ?? null,
    rejectedBy: existing?.rejectedBy ?? null,
    unpublishedAt: existing?.unpublishedAt ?? null,
    unpublishedBy: existing?.unpublishedBy ?? null,
    archivedAt: existing?.archivedAt ?? null,
    archivedBy: existing?.archivedBy ?? null,
  };
}

async function saveRecord(record: DossierPublicationRecord) {
  return getRepo().save(record);
}

async function syncRuntimeVisibility(
  sourceHandoffId: string,
  visibility: DossierRuntimeRecord["visibility"],
) {
  await syncDossierRuntimePublicationVisibility({
    sourceHandoffId,
    visibility,
  });
}

export function getDossierPublicationPersistenceState() {
  return getRepo().getPersistenceState();
}

export async function listDossierPublicationRecords(limit = 80) {
  const runtimeRecords = await listDossierRuntimeRecords(limit * 2);
  const candidates = runtimeRecords.filter((record) => Boolean(record.createdDossierId));
  const publicationRecords = await Promise.all(
    candidates.slice(0, limit).map(buildPublicationRecord),
  );
  return publicationRecords.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function getDossierPublicationRecord(sourceHandoffId: string) {
  const runtimeRecord = await getDossierRuntimeRecord(sourceHandoffId);
  if (!runtimeRecord || !runtimeRecord.createdDossierId) return null;
  return buildPublicationRecord(runtimeRecord);
}

export async function getPublishedDossierPublicationRecordByDossierId(
  dossierId: string,
) {
  const records = await listDossierPublicationRecords(200);
  return (
    records.find(
      (record) =>
        record.dossierId === dossierId && isPublicDossier(record),
    ) ?? null
  );
}

export async function getAnyDossierPublicationRecordByDossierId(dossierId: string) {
  const records = await listDossierPublicationRecords(200);
  return records.find((record) => record.dossierId === dossierId) ?? null;
}

export async function listPublishedDossierPublicationRecords(limit = 80) {
  const records = await listDossierPublicationRecords(limit * 2);
  return records.filter(isPublicDossier).slice(0, limit);
}

export async function listDossierPublicationAudits(params?: {
  sourceHandoffId?: string | null;
  limit?: number;
}) {
  return getRepo().listAudits(params);
}

export async function requestDossierPublicationReview(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getDossierPublicationRecord(input.sourceHandoffId);
  if (!record) throw new Error("dossier_publication_record_not_found");

  const at = nowIso();
  const requested = requestDossierPublicationReviewRecord(record, {
    actorUserId: input.actorUserId,
    reason:
      trimOrNull(input.note) ??
      "Veröffentlichungsprüfung für Dossier explizit angefordert.",
    origin: "admin_review",
    approvedAt: at,
  });
  await saveRecord(requested);
  await syncRuntimeVisibility(
    input.sourceHandoffId,
    requested.status === "blocked" ? record.runtimeVisibility : "ready_for_publish_review",
  );
  await recordAudit(input.sourceHandoffId, {
    at,
    action: requested.status === "blocked"
      ? "publication_blocked"
      : "publication_review_requested",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      (requested.status === "blocked"
        ? "Veröffentlichungsprüfung blockiert, bis offene Guardrails geklärt sind."
        : "Veröffentlichungsprüfung angefordert. Creation bleibt getrennt von Veröffentlichung."),
    blockers: requested.blockers,
    status: requested.status,
    dossierId: requested.dossierId,
  });
  return requested;
}

export async function approveDossierPublication(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getDossierPublicationRecord(input.sourceHandoffId);
  if (!record) throw new Error("dossier_publication_record_not_found");

  const at = nowIso();
  const approved = approveDossierPublicationRecord(record, {
    actorUserId: input.actorUserId,
    reason:
      trimOrNull(input.note) ??
      "Veröffentlichung explizit freigegeben.",
    origin: "admin_review",
    approvedAt: at,
  });
  await saveRecord(approved);
  await syncRuntimeVisibility(
    input.sourceHandoffId,
    approved.status === "blocked" ? record.runtimeVisibility : "ready_for_publish_review",
  );
  await recordAudit(input.sourceHandoffId, {
    at,
    action:
      approved.status === "blocked"
        ? "publication_blocked"
        : "publication_approved",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      (approved.status === "blocked"
        ? "Veröffentlichungsfreigabe blockiert, bis Review- und Public-Guardrails vollständig sind."
        : "Veröffentlichungsfreigabe erteilt. Veröffentlichung bleibt ein separater nächster Schritt."),
    blockers: approved.blockers,
    status: approved.status,
    dossierId: approved.dossierId,
  });
  return approved;
}

export async function publishApprovedDossier(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getDossierPublicationRecord(input.sourceHandoffId);
  if (!record) throw new Error("dossier_publication_record_not_found");

  const result = publishDossier(record, {
    actorUserId: input.actorUserId,
    reason:
      trimOrNull(input.note) ??
      "Öffentliche Sichtbarkeit wird explizit gesetzt.",
    origin: "dossier_publish_workflow",
    approvedAt: nowIso(),
  });
  if (!result.ok) {
    const blocked = blockDossierPublicationRecord(record, {
      actorUserId: input.actorUserId,
      reason: trimOrNull(input.note) ?? result.message,
      origin: "dossier_publish_workflow",
      approvedAt: nowIso(),
    });
    await saveRecord(blocked);
    await recordAudit(input.sourceHandoffId, {
      at: blocked.updatedAt,
      action: "publication_blocked",
      actorUserId: input.actorUserId,
      note: trimOrNull(input.note) ?? result.message,
      blockers: blocked.blockers,
      status: blocked.status,
      dossierId: blocked.dossierId,
    });
    return blocked;
  }

  await saveRecord(result.record);
  await syncRuntimeVisibility(input.sourceHandoffId, "published");
  await recordAudit(input.sourceHandoffId, {
    at: result.record.updatedAt,
    action: "published_public",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Dossier explizit veröffentlicht. Veröffentlichung bleibt kein Wahrheits- oder Verifikationssiegel.",
    blockers: [],
    status: result.record.status,
    dossierId: result.record.dossierId,
  });
  return result.record;
}

export async function unpublishPublishedDossier(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getDossierPublicationRecord(input.sourceHandoffId);
  if (!record) throw new Error("dossier_publication_record_not_found");
  const unpublished = unpublishDossierRecord(record, {
    actorUserId: input.actorUserId,
    reason:
      trimOrNull(input.note) ??
      "Öffentliche Sichtbarkeit wurde explizit zurückgezogen.",
    origin: "dossier_publish_workflow",
    approvedAt: nowIso(),
  });
  await saveRecord(unpublished);
  await syncRuntimeVisibility(input.sourceHandoffId, "editorial_workspace");
  await recordAudit(input.sourceHandoffId, {
    at: unpublished.updatedAt,
    action: "unpublished_public",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Veröffentlichung zurückgezogen. Dossier bleibt intern redaktionell bearbeitbar.",
    blockers: [],
    status: unpublished.status,
    dossierId: unpublished.dossierId,
  });
  return unpublished;
}

export async function rejectDossierPublication(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getDossierPublicationRecord(input.sourceHandoffId);
  if (!record) throw new Error("dossier_publication_record_not_found");
  const rejected = rejectDossierPublicationRecord(record, {
    actorUserId: input.actorUserId,
    reason:
      trimOrNull(input.note) ??
      "Veröffentlichung explizit abgelehnt.",
    origin: "admin_review",
    approvedAt: nowIso(),
  });
  await saveRecord(rejected);
  await syncRuntimeVisibility(input.sourceHandoffId, "editorial_workspace");
  await recordAudit(input.sourceHandoffId, {
    at: rejected.updatedAt,
    action: "publication_rejected",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Veröffentlichung abgelehnt. Dossier bleibt intern und nicht öffentlich sichtbar.",
    blockers: [],
    status: rejected.status,
    dossierId: rejected.dossierId,
  });
  return rejected;
}

export async function blockDossierPublication(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getDossierPublicationRecord(input.sourceHandoffId);
  if (!record) throw new Error("dossier_publication_record_not_found");
  const blocked = blockDossierPublicationRecord(record, {
    actorUserId: input.actorUserId,
    reason:
      trimOrNull(input.note) ??
      "Veröffentlichung bleibt blockiert.",
    origin: "admin_review",
    approvedAt: nowIso(),
  });
  await saveRecord(blocked);
  await syncRuntimeVisibility(input.sourceHandoffId, "editorial_workspace");
  await recordAudit(input.sourceHandoffId, {
    at: blocked.updatedAt,
    action: "publication_blocked",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Veröffentlichung bleibt blockiert, bis offene Review- und Guardrail-Blocker geklärt sind.",
    blockers: blocked.blockers,
    status: blocked.status,
    dossierId: blocked.dossierId,
  });
  return blocked;
}

export async function archiveDossierPublication(input: {
  sourceHandoffId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const record = await getDossierPublicationRecord(input.sourceHandoffId);
  if (!record) throw new Error("dossier_publication_record_not_found");
  const archived = archiveDossierPublicationRecord(record, {
    actorUserId: input.actorUserId,
    reason:
      trimOrNull(input.note) ??
      "Veröffentlichungspfad archiviert.",
    origin: "admin_review",
    approvedAt: nowIso(),
  });
  await saveRecord(archived);
  await syncRuntimeVisibility(input.sourceHandoffId, "editorial_workspace");
  await recordAudit(input.sourceHandoffId, {
    at: archived.updatedAt,
    action: "publication_archived",
    actorUserId: input.actorUserId,
    note:
      trimOrNull(input.note) ??
      "Veröffentlichungspfad archiviert. Kein öffentlicher Zugriff bleibt bestehen.",
    blockers: [],
    status: archived.status,
    dossierId: archived.dossierId,
  });
  return archived;
}
