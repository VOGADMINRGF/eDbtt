import { coreCol, ObjectId, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { z } from "zod";
import {
  getDossierStudioWorkspaceRepo,
  type DossierStudioWorkspaceSource,
} from "@features/dossier/server/studioPersistence";
import { logDossierRevision } from "@features/dossier/revisions";
import { dossiersCol, dossierSourcesCol, updateDossierCounts } from "@features/dossier/db";
import { seedDossierFromAnalysis } from "@features/dossier/seed";
import {
  isPublicVisibilityState,
  publicationVisibilityLabel,
  type RegionPublicationVisibilityState,
} from "@features/region/publicationRiskLadder";
import type { RegionSourcePossibleClaim, RegionSourceTestResult } from "@features/region/sourceConnections";
import { getRegionSourceTestResultById } from "@features/region/server/sourceConnectionRuntime";
import { createManualAnlassraum } from "@features/anlassraum/service";

export const CONTENT_RELEASE_TARGET_TYPES = ["dossier", "anlassraum"] as const;
export type ContentReleaseTargetType = (typeof CONTENT_RELEASE_TARGET_TYPES)[number];

export const CONTENT_RELEASE_ACTIONS = [
  "prepare_target",
  "make_visible",
  "prepare_publication",
  "retract_visibility",
  "archive_target",
] as const;
export type ContentReleaseAction = (typeof CONTENT_RELEASE_ACTIONS)[number];

export const CONTENT_RELEASE_AUDIT_ACTIONS = [
  "prepared",
  "visibility_made_public",
  "publication_prepared",
  "visibility_retracted",
  "archived",
] as const;
export type ContentReleaseAuditAction = (typeof CONTENT_RELEASE_AUDIT_ACTIONS)[number];

const CONTENT_RELEASE_VISIBILITY_STATES = [
  "internal_review",
  "public_unverified",
  "public_reviewed",
  "public_official",
  "archived",
  "blocked",
] as const;

export type ContentReleaseStatusLabel =
  | "Arbeitsstand"
  | "sichtbar, aber nicht geprüft"
  | "geprüft"
  | "amtlich freigegeben"
  | "archiviert"
  | "blockiert";

const ContentReleaseTargetRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    sourceResultId: z.string().trim().min(1),
    sourceReviewItemId: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    targetType: z.enum(CONTENT_RELEASE_TARGET_TYPES),
    targetId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    previewHref: z.string().trim().min(1),
    publicHref: z.string().trim().min(1),
    visibilityState: z.enum(CONTENT_RELEASE_VISIBILITY_STATES),
    createdByUserId: z.string().trim().min(1),
    createdAt: z.string().datetime({ offset: true }),
    updatedByUserId: z.string().trim().min(1),
    updatedAt: z.string().datetime({ offset: true }),
    reviewRequired: z.literal(true),
    noAutoPublish: z.literal(true),
    noPublicOfficial: z.literal(true),
    noSocialPublishing: z.literal(true),
    noAutomaticOfficialResponse: z.literal(true),
    noAutoFinalization: z.literal(true),
    revokable: z.literal(true),
    archivable: z.literal(true),
  })
  .strict();

export type ContentReleaseTargetRecord = z.infer<typeof ContentReleaseTargetRecordSchema>;

const ContentReleaseAuditEventSchema = z
  .object({
    id: z.string().trim().min(1),
    recordId: z.string().trim().min(1),
    sourceResultId: z.string().trim().min(1),
    targetType: z.enum(CONTENT_RELEASE_TARGET_TYPES),
    action: z.enum(CONTENT_RELEASE_AUDIT_ACTIONS),
    byUserId: z.string().trim().min(1),
    note: z.string().trim().min(1).nullable().optional(),
    at: z.string().datetime({ offset: true }),
  })
  .strict();

export type ContentReleaseAuditEvent = z.infer<typeof ContentReleaseAuditEventSchema>;

export type ContentReleaseWorkbenchTarget = {
  targetType: ContentReleaseTargetType;
  targetLabel: string;
  suggestedTitle: string;
  targetId: string | null;
  prepared: boolean;
  previewHref: string | null;
  publicHref: string | null;
  qrHref: string | null;
  visibilityState: RegionPublicationVisibilityState;
  visibilityLabel: string;
  statusLabel: ContentReleaseStatusLabel;
  canPrepare: boolean;
  canMakeVisible: boolean;
  canPreparePublication: boolean;
  canCreateQrLink: boolean;
};

export type PrepareContentReleaseTargetInput = {
  sourceResultId: string;
  targetType: ContentReleaseTargetType;
  requestedBy: string;
  organizationId?: string | null;
};

export type UpdateContentReleaseTargetInput = {
  sourceResultId: string;
  targetType: ContentReleaseTargetType;
  action: Exclude<ContentReleaseAction, "prepare_target">;
  requestedBy: string;
  note?: string | null;
};

type ContentReleaseWorkbenchRepo = {
  getTargetRecord(
    sourceResultId: string,
    targetType: ContentReleaseTargetType,
  ): Promise<ContentReleaseTargetRecord | null>;
  listTargetRecordsForSourceResult(sourceResultId: string): Promise<ContentReleaseTargetRecord[]>;
  saveTargetRecord(record: ContentReleaseTargetRecord): Promise<void>;
  appendAuditEvent(event: ContentReleaseAuditEvent): Promise<void>;
  listAuditEvents(recordId: string): Promise<ContentReleaseAuditEvent[]>;
};

const CONTENT_RELEASE_TARGETS_COLLECTION = "content_release_workbench_targets";
const CONTENT_RELEASE_AUDIT_COLLECTION = "content_release_workbench_audit";

let repoSingleton: ContentReleaseWorkbenchRepo | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isoNow() {
  return new Date().toISOString();
}

function targetLabel(targetType: ContentReleaseTargetType) {
  return targetType === "dossier" ? "Dossier-Entwurf" : "Anlassraum";
}

function recordIdFor(sourceResultId: string, targetType: ContentReleaseTargetType) {
  return `content-release-${targetType}-${stableHash(`${sourceResultId}:${targetType}`).slice(0, 18)}`;
}

function auditEventIdFor(recordId: string, action: ContentReleaseAuditAction, at: string) {
  return `content-release-audit-${stableHash(`${recordId}:${action}:${at}`).slice(0, 18)}`;
}

function dossierIdForSourceResult(sourceResultId: string) {
  return `source-result-dossier-${stableHash(sourceResultId).slice(0, 16)}`;
}

function statementIdForSourceResult(sourceResultId: string) {
  return `source-result:${sourceResultId}`;
}

function anlassraumTopicKey(title: string) {
  const normalized = String(title || "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "thema";
}

function previewHrefFor(targetType: ContentReleaseTargetType, targetId: string) {
  return targetType === "dossier"
    ? `/dossier/${encodeURIComponent(targetId)}/studio`
    : `/runden?view=active&anlassraumId=${encodeURIComponent(targetId)}`;
}

function publicHrefFor(targetType: ContentReleaseTargetType, targetId: string) {
  return targetType === "dossier"
    ? `/dossier/${encodeURIComponent(targetId)}`
    : `/anlassraum?anlassraumId=${encodeURIComponent(targetId)}`;
}

function qrHrefFor(publicHref: string | null, visibilityState: RegionPublicationVisibilityState) {
  if (!publicHref || !isPublicVisibilityState(visibilityState)) return null;
  return `/qrcodegenerator?target=${encodeURIComponent(publicHref)}`;
}

function statusLabelForVisibility(
  visibilityState: RegionPublicationVisibilityState,
): ContentReleaseStatusLabel {
  switch (visibilityState) {
    case "public_unverified":
      return "sichtbar, aber nicht geprüft";
    case "public_reviewed":
      return "geprüft";
    case "public_official":
      return "amtlich freigegeben";
    case "archived":
      return "archiviert";
    case "blocked":
      return "blockiert";
    case "private_draft":
    case "internal_review":
    default:
      return "Arbeitsstand";
  }
}

function summaryFromSourceResult(result: RegionSourceTestResult) {
  return (
    String(result.sourceSnapshotSummary ?? "").trim() ||
    String(result.sourceSnapshotExcerpt ?? "").trim() ||
    String(result.summary || "").trim() ||
    "Reviewpflichtiger Arbeitsstand aus expliziter URL-Auswertung."
  );
}

function suggestedTitleForTarget(
  result: RegionSourceTestResult,
  targetType: ContentReleaseTargetType,
) {
  if (targetType === "dossier") {
    return (
      String(result.dossierSuggestions[0]?.title ?? "").trim() ||
      String(result.sourceSnapshotTitle ?? "").trim() ||
      String(result.affectedScope.regionName ?? "").trim() ||
      result.title.replace(/\s+·\s+Dry Run$/u, "").trim()
    );
  }
  return (
    String(result.anlassraumSuggestions[0]?.title ?? "").trim() ||
    String(result.topicClusters[0]?.label ?? "").trim() ||
    String(result.sourceSnapshotTitle ?? "").trim() ||
    result.title.replace(/\s+·\s+Dry Run$/u, "").trim()
  );
}

function nextVisibilityStateForAction(
  current: RegionPublicationVisibilityState,
  action: Exclude<ContentReleaseAction, "prepare_target">,
) {
  switch (action) {
    case "make_visible":
      return "public_unverified" as const;
    case "prepare_publication":
      return "public_reviewed" as const;
    case "retract_visibility":
      return "internal_review" as const;
    case "archive_target":
      return "archived" as const;
    default:
      return current;
  }
}

function auditActionForVisibilityAction(
  action: Exclude<ContentReleaseAction, "prepare_target">,
): ContentReleaseAuditAction {
  switch (action) {
    case "make_visible":
      return "visibility_made_public";
    case "prepare_publication":
      return "publication_prepared";
    case "retract_visibility":
      return "visibility_retracted";
    case "archive_target":
      return "archived";
    default:
      return "visibility_retracted";
  }
}

function mapPossibleClaims(possibleClaims: RegionSourcePossibleClaim[]) {
  return possibleClaims.map((claim, index) => ({
    id: `source-result-claim-${index + 1}`,
    text: claim.text,
  }));
}

async function ensureDossierDraftFromSourceResult(input: {
  result: RegionSourceTestResult;
  requestedBy: string;
  organizationId?: string | null;
}) {
  const dossierId = dossierIdForSourceResult(input.result.id);
  const statementId = statementIdForSourceResult(input.result.id);
  const title = suggestedTitleForTarget(input.result, "dossier");
  const now = new Date();
  const dossiers = await dossiersCol();
  const existing = await dossiers.findOne({
    $or: [{ dossierId }, { statementId }],
  } as any);

  if (!existing) {
    await dossiers.insertOne({
      dossierId,
      statementId,
      title,
      status: "draft",
      counts: {
        claims: 0,
        sources: 0,
        findings: 0,
        edges: 0,
        openQuestions: 0,
      },
      createdAt: now,
      updatedAt: now,
    } as any);
    await logDossierRevision({
      dossierId,
      entityType: "dossier",
      entityId: dossierId,
      action: "create",
      diffSummary: "Dossier-Entwurf aus Review-Queue-Source-Result erstellt.",
      byRole: "admin",
      byUserId: input.requestedBy,
    });
  }

  await seedDossierFromAnalysis({
    dossierId,
    claims: mapPossibleClaims(input.result.possibleClaims),
    questions: input.result.openQuestions.map((text, index) => ({
      id: `source-result-question-${index + 1}`,
      text,
    })),
    createdByRole: "admin",
  });

  const sources = await dossierSourcesCol();
  for (const [index, reference] of input.result.evidenceReferences.entries()) {
    const url = String(reference.url ?? "").trim();
    if (!url) continue;
    const sourceId = `source-result-source-${stableHash(`${input.result.id}:${url}:${index}`).slice(0, 12)}`;
    const canonicalUrlHash = stableHash(url);
    const existingSource = await sources.findOne({ dossierId, canonicalUrlHash });
    if (existingSource) continue;
    await sources.insertOne({
      sourceId,
      dossierId,
      canonicalUrlHash,
      url,
      title: reference.label || input.result.connectionLabel,
      publisher: input.result.connectionLabel,
      publishedAt: new Date(input.result.createdAt),
      retrievedAt: now,
      type: input.result.sourceType === "official_feed" ? "official" : "quality_media",
      snippet: String(reference.excerpt ?? "").trim() || undefined,
      tags: input.result.detectedTopics.slice(0, 5),
      language: "de",
      createdAt: now,
      updatedAt: now,
    } as any);
    await logDossierRevision({
      dossierId,
      entityType: "source",
      entityId: sourceId,
      action: "create",
      diffSummary: "Quelle aus expliziter URL-Auswertung übernommen.",
      byRole: "admin",
      byUserId: input.requestedBy,
    });
  }
  await updateDossierCounts(dossierId, "Dossier-Zaehler nach Source-Result-Übernahme aktualisiert.");

  await getDossierStudioWorkspaceRepo().createOrGetDossierStudioWorkspace({
    dossierId,
    regionId: input.result.regionId,
    organizationId: String(input.organizationId ?? "").trim() || null,
    source: "manual_admin" satisfies DossierStudioWorkspaceSource,
    title,
    createdBy: input.requestedBy,
    updatedBy: input.requestedBy,
    provenance: {
      sourceSignalId: input.result.id,
      sourceRegionId: input.result.regionId,
      sourceDraftId: input.result.connectionId,
      notProductionData: false,
      fixture: false,
    },
    seed: {
      status: "draft",
      audienceNotes:
        "eDebatte bereitet aus deinem Link veröffentlichbare Inhalte vor. Du entscheidest, was als Dossier, Anlassraum oder öffentliche Themenseite sichtbar wird.",
      reviewNotes:
        "Reviewpflichtiger Studio-Arbeitsstand aus expliziter URL-Auswertung. Keine automatische Veröffentlichung.",
    },
  });

  return {
    targetId: dossierId,
    title,
    summary: summaryFromSourceResult(input.result),
  };
}

async function ensureAnlassraumFromSourceResult(input: {
  result: RegionSourceTestResult;
  requestedBy: string;
}) {
  const title = suggestedTitleForTarget(input.result, "anlassraum");
  const created = await createManualAnlassraum({
    entityId: new ObjectId(),
    type: "policy",
    title,
    summary: summaryFromSourceResult(input.result),
    topicKey: anlassraumTopicKey(title),
    regionKey: input.result.regionId,
    scope: "regional",
    ownerType: "government",
    ownerId: input.result.regionId,
    createdBy: input.requestedBy,
  });
  return {
    targetId: created.anlassraumId.toHexString(),
    title,
    summary: summaryFromSourceResult(input.result),
  };
}

async function ensureIndexes() {
  if (indexesReady) return;
  const [targets, audit] = await Promise.all([
    coreCol(CONTENT_RELEASE_TARGETS_COLLECTION),
    coreCol(CONTENT_RELEASE_AUDIT_COLLECTION),
  ]);
  await Promise.all([
    targets.createIndex({ sourceResultId: 1, targetType: 1 }, { unique: true }),
    targets.createIndex({ regionId: 1, updatedAt: -1 }),
    audit.createIndex({ recordId: 1, at: -1 }),
    audit.createIndex({ sourceResultId: 1, at: -1 }),
  ]);
  indexesReady = true;
}

function createMongoRepo(): ContentReleaseWorkbenchRepo {
  return {
    async getTargetRecord(sourceResultId, targetType) {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; record: ContentReleaseTargetRecord }>(
        CONTENT_RELEASE_TARGETS_COLLECTION,
      );
      const doc = await col.findOne({ "record.sourceResultId": sourceResultId, "record.targetType": targetType });
      return doc?.record ? ContentReleaseTargetRecordSchema.parse(clone(doc.record)) : null;
    },

    async listTargetRecordsForSourceResult(sourceResultId) {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; record: ContentReleaseTargetRecord }>(
        CONTENT_RELEASE_TARGETS_COLLECTION,
      );
      const docs = await col.find({ "record.sourceResultId": sourceResultId }).toArray();
      return docs.map((doc) => ContentReleaseTargetRecordSchema.parse(clone(doc.record)));
    },

    async saveTargetRecord(record) {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; record: ContentReleaseTargetRecord }>(
        CONTENT_RELEASE_TARGETS_COLLECTION,
      );
      await col.updateOne(
        { _id: record.id },
        { $set: { record: clone(record), sourceResultId: record.sourceResultId, targetType: record.targetType, regionId: record.regionId, updatedAt: record.updatedAt } as any },
        { upsert: true },
      );
    },

    async appendAuditEvent(event) {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; event: ContentReleaseAuditEvent }>(
        CONTENT_RELEASE_AUDIT_COLLECTION,
      );
      await col.insertOne({ _id: event.id, event: clone(event) } as any);
    },

    async listAuditEvents(recordId) {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; event: ContentReleaseAuditEvent }>(
        CONTENT_RELEASE_AUDIT_COLLECTION,
      );
      const docs = await col.find({ "event.recordId": recordId }).sort({ "event.at": -1 }).toArray();
      return docs.map((doc) => ContentReleaseAuditEventSchema.parse(clone(doc.event)));
    },
  };
}

export function createInMemoryContentReleaseWorkbenchRepo(seed?: {
  records?: ContentReleaseTargetRecord[];
  auditEvents?: ContentReleaseAuditEvent[];
}): ContentReleaseWorkbenchRepo {
  const records = new Map<string, ContentReleaseTargetRecord>();
  const auditEvents = new Map<string, ContentReleaseAuditEvent>();
  for (const record of seed?.records ?? []) {
    const parsed = ContentReleaseTargetRecordSchema.parse(record);
    records.set(parsed.id, clone(parsed));
  }
  for (const event of seed?.auditEvents ?? []) {
    const parsed = ContentReleaseAuditEventSchema.parse(event);
    auditEvents.set(parsed.id, clone(parsed));
  }
  return {
    async getTargetRecord(sourceResultId, targetType) {
      return (
        Array.from(records.values()).find(
          (record) => record.sourceResultId === sourceResultId && record.targetType === targetType,
        ) ?? null
      );
    },
    async listTargetRecordsForSourceResult(sourceResultId) {
      return Array.from(records.values())
        .filter((record) => record.sourceResultId === sourceResultId)
        .map((record) => clone(record));
    },
    async saveTargetRecord(record) {
      records.set(record.id, clone(record));
    },
    async appendAuditEvent(event) {
      auditEvents.set(event.id, clone(event));
    },
    async listAuditEvents(recordId) {
      return Array.from(auditEvents.values())
        .filter((event) => event.recordId === recordId)
        .map((event) => clone(event))
        .sort((left, right) => String(right.at).localeCompare(String(left.at)));
    },
  };
}

function getRepo() {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryContentReleaseWorkbenchRepo();
    return repoSingleton;
  }
  if (!repoSingleton) repoSingleton = createMongoRepo();
  return repoSingleton;
}

export function setContentReleaseWorkbenchRepoForTests(
  repo: ContentReleaseWorkbenchRepo | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}

function buildRecord(params: {
  result: RegionSourceTestResult;
  targetType: ContentReleaseTargetType;
  targetId: string;
  title: string;
  summary: string;
  requestedBy: string;
}) {
  const now = isoNow();
  const publicHref = publicHrefFor(params.targetType, params.targetId);
  return ContentReleaseTargetRecordSchema.parse({
    id: recordIdFor(params.result.id, params.targetType),
    sourceResultId: params.result.id,
    sourceReviewItemId: `region_source_result:${params.result.id}`,
    regionId: params.result.regionId,
    targetType: params.targetType,
    targetId: params.targetId,
    title: params.title,
    summary: params.summary,
    previewHref: previewHrefFor(params.targetType, params.targetId),
    publicHref,
    visibilityState: "internal_review",
    createdByUserId: params.requestedBy,
    createdAt: now,
    updatedByUserId: params.requestedBy,
    updatedAt: now,
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noSocialPublishing: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    revokable: true,
    archivable: true,
  });
}

export async function prepareContentReleaseTargetFromSourceResult(
  input: PrepareContentReleaseTargetInput,
) {
  const result = await getRegionSourceTestResultById(input.sourceResultId);
  if (!result) throw new Error("source_result_not_found");

  const existing = await getRepo().getTargetRecord(input.sourceResultId, input.targetType);
  if (existing) return existing;

  const prepared =
    input.targetType === "dossier"
      ? await ensureDossierDraftFromSourceResult({
          result,
          requestedBy: input.requestedBy,
          organizationId: input.organizationId,
        })
      : await ensureAnlassraumFromSourceResult({
          result,
          requestedBy: input.requestedBy,
        });

  const record = buildRecord({
    result,
    targetType: input.targetType,
    targetId: prepared.targetId,
    title: prepared.title,
    summary: prepared.summary,
    requestedBy: input.requestedBy,
  });
  await getRepo().saveTargetRecord(record);
  await getRepo().appendAuditEvent({
    id: auditEventIdFor(record.id, "prepared", record.updatedAt),
    recordId: record.id,
    sourceResultId: record.sourceResultId,
    targetType: record.targetType,
    action: "prepared",
    byUserId: input.requestedBy,
    note: "Target bewusst aus Review-Queue vorbereitet.",
    at: record.updatedAt,
  });
  return record;
}

export async function updateContentReleaseTargetFromSourceResult(
  input: UpdateContentReleaseTargetInput,
) {
  const existing = await getRepo().getTargetRecord(input.sourceResultId, input.targetType);
  if (!existing) throw new Error("content_release_target_not_prepared");
  const nextVisibilityState = nextVisibilityStateForAction(existing.visibilityState, input.action);
  if (nextVisibilityState === "public_official") {
    throw new Error("public_official_requires_official_release");
  }
  const updatedAt = isoNow();
  const next = ContentReleaseTargetRecordSchema.parse({
    ...existing,
    visibilityState: nextVisibilityState,
    updatedByUserId: input.requestedBy,
    updatedAt,
  });
  await getRepo().saveTargetRecord(next);
  await getRepo().appendAuditEvent({
    id: auditEventIdFor(next.id, auditActionForVisibilityAction(input.action), updatedAt),
    recordId: next.id,
    sourceResultId: next.sourceResultId,
    targetType: next.targetType,
    action: auditActionForVisibilityAction(input.action),
    byUserId: input.requestedBy,
    note: input.note ?? null,
    at: updatedAt,
  });
  return next;
}

export async function listContentReleaseTargetsForSourceResult(sourceResultId: string) {
  return getRepo().listTargetRecordsForSourceResult(sourceResultId);
}

export async function listContentReleaseAuditEvents(recordId: string) {
  return getRepo().listAuditEvents(recordId);
}

export async function getContentReleaseTargetRecord(
  sourceResultId: string,
  targetType: ContentReleaseTargetType,
) {
  return getRepo().getTargetRecord(sourceResultId, targetType);
}

export async function buildContentReleaseWorkbenchTargets(params: {
  result: RegionSourceTestResult;
  canPrepare: boolean;
  canPreparePublication: boolean;
}) {
  const existingRecords = await listContentReleaseTargetsForSourceResult(params.result.id);
  const recordByType = new Map(existingRecords.map((record) => [record.targetType, record]));
  return CONTENT_RELEASE_TARGET_TYPES.map((targetType): ContentReleaseWorkbenchTarget => {
    const record = recordByType.get(targetType) ?? null;
    const visibilityState = record?.visibilityState ?? "internal_review";
    const publicHref = record?.publicHref ?? null;
    const qrHref = qrHrefFor(publicHref, visibilityState);
    return {
      targetType,
      targetLabel: targetLabel(targetType),
      suggestedTitle: record?.title ?? suggestedTitleForTarget(params.result, targetType),
      targetId: record?.targetId ?? null,
      prepared: Boolean(record),
      previewHref: record?.previewHref ?? null,
      publicHref,
      qrHref,
      visibilityState,
      visibilityLabel: publicationVisibilityLabel(visibilityState),
      statusLabel: statusLabelForVisibility(visibilityState),
      canPrepare: !record && params.canPrepare,
      canMakeVisible:
        Boolean(record) &&
        params.canPrepare &&
        visibilityState !== "public_unverified" &&
        visibilityState !== "public_reviewed" &&
        visibilityState !== "public_official" &&
        visibilityState !== "archived",
      canPreparePublication:
        Boolean(record) &&
        params.canPreparePublication &&
        visibilityState !== "public_reviewed" &&
        visibilityState !== "public_official" &&
        visibilityState !== "archived",
      canCreateQrLink: Boolean(qrHref),
    };
  });
}
