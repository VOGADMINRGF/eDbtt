import { coreCol, ObjectId, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { anlassraumCol } from "@features/anlassraum/db";
import { getDossierStudioWorkspaceRepo } from "@features/dossier/server/studioPersistence";
import type {
  CreateArgumentDraft,
  CreateClaimDraft,
  CreateHandoffAction,
  CreateHandoffDraft,
  CreateHandoffReviewState,
  CreateHandoffTopicSeed,
  CreateOpenQuestionDraft,
  SourceGrounding,
} from "@/features/create/createHandoff";
import type {
  CreateProductionAccessDecision,
} from "@/features/create/createProductionAccess";
import type { CreatePlannerResult } from "@/features/create/createPlanner";
import type { CreateInputClassification } from "@/features/create/inputClassification";
import type { CreateGraphMatchResult } from "@/features/create/intelligentFollowupContract";
import type { RequestScopeSummary } from "@/lib/server/auth/requestScope";
import type { RegionPublicationVisibilityState } from "@features/region/publicationRiskLadder";

export const PERSISTED_CREATE_HANDOFF_SCHEMA_VERSION = "create_handoff_review_item.v1";

export type PersistedCreateHandoffRecord = {
  schemaVersion: typeof PERSISTED_CREATE_HANDOFF_SCHEMA_VERSION;
  id: string;
  source: "create";
  sourceText: string;
  plannerResult: CreatePlannerResult;
  graphMatches: CreateGraphMatchResult;
  selectedAction: CreateHandoffAction;
  claims: CreateClaimDraft[];
  arguments: CreateArgumentDraft[];
  openQuestions: CreateOpenQuestionDraft[];
  sourceGrounding: SourceGrounding[];
  topicSeed: CreateHandoffTopicSeed;
  resumeHref: string;
  reviewState: CreateHandoffReviewState;
  visibilityState: RegionPublicationVisibilityState;
  requiresConfirmation: true;
  reviewRequired: true;
  noAutoPublish: true;
  noPublicOfficial: true;
  noAutomaticOfficialResponse: true;
  noAutoFinalization: true;
  intakeClassification: CreateInputClassification;
  createdByUserId: string;
  regionId: string | null;
  organizationId: string | null;
  dossierId: string | null;
  anlassraumId: string | null;
  requestScope: Pick<
    RequestScopeSummary,
    | "organizationId"
    | "organizationLabel"
    | "membershipStatus"
    | "organizationRole"
    | "roleLabel"
    | "regionIds"
    | "primaryRegionId"
    | "isOperatorMode"
    | "operatorModeLabel"
    | "sourceOfTruth"
    | "confidence"
  > | null;
  accessDecision: Pick<
    CreateProductionAccessDecision,
    | "status"
    | "reason"
    | "title"
    | "body"
    | "requiredEntitlementScopes"
    | "missingEntitlementScopes"
    | "requiredActions"
    | "missingActions"
    | "contractStatus"
    | "billingStatus"
    | "entitlementStatus"
  > | null;
  createdAt: string;
  updatedAt: string;
};

export type ResolvePersistedCreateHandoffContextInput = {
  draft: CreateHandoffDraft;
  dossierId?: string | null;
  anlassraumId?: string | null;
};

export type PersistedCreateHandoffContext = {
  regionId: string | null;
  organizationId: string | null;
  dossierId: string | null;
  anlassraumId: string | null;
};

export type CreateHandoffRepository = {
  save(record: PersistedCreateHandoffRecord): Promise<void>;
  get(id: string): Promise<PersistedCreateHandoffRecord | null>;
  list(): Promise<PersistedCreateHandoffRecord[]>;
};

export type PersistedCreateHandoffRepo = CreateHandoffRepository;

const COLLECTION = "create_handoff_review_items";

let repoSingleton: CreateHandoffRepository | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeRegionId(value: unknown): string | null {
  const normalized = normalizeOptionalString(value);
  return normalized || null;
}

async function resolveDossierContext(dossierId: string | null) {
  const normalizedDossierId = normalizeOptionalString(dossierId);
  if (!normalizedDossierId) {
    return {
      regionId: null,
      organizationId: null,
      dossierId: null,
    };
  }
  const workspace = await getDossierStudioWorkspaceRepo()
    .getDossierStudioWorkspace(normalizedDossierId)
    .catch(() => null);
  return {
    regionId: normalizeRegionId(workspace?.regionId ?? null),
    organizationId: normalizeOptionalString(workspace?.organizationId ?? null),
    dossierId: normalizedDossierId,
  };
}

async function resolveAnlassraumContext(anlassraumId: string | null) {
  const normalizedAnlassraumId = normalizeOptionalString(anlassraumId);
  if (!normalizedAnlassraumId) {
    return {
      regionId: null,
      anlassraumId: null,
    };
  }
  if (!ObjectId.isValid(normalizedAnlassraumId)) {
    return {
      regionId: null,
      anlassraumId: normalizedAnlassraumId,
    };
  }
  const room = await (await anlassraumCol()).findOne(
    { _id: new ObjectId(normalizedAnlassraumId) },
    { projection: { regionKey: 1 } as any },
  );
  return {
    regionId: normalizeRegionId(room?.regionKey ?? null),
    anlassraumId: normalizedAnlassraumId,
  };
}

async function resolveGraphMatchContext(graphMatches: CreateGraphMatchResult) {
  const matchedDossierId = normalizeOptionalString(graphMatches.matchedDossiers[0] ?? null);
  if (matchedDossierId) {
    const dossierContext = await resolveDossierContext(matchedDossierId);
    if (dossierContext.regionId || dossierContext.organizationId || dossierContext.dossierId) {
      return {
        regionId: dossierContext.regionId,
        organizationId: dossierContext.organizationId,
        dossierId: dossierContext.dossierId,
        anlassraumId: null,
      };
    }
  }

  const matchedAnlassraumId = normalizeOptionalString(graphMatches.matchedAnlassraeume[0] ?? null);
  if (matchedAnlassraumId) {
    const roomContext = await resolveAnlassraumContext(matchedAnlassraumId);
    if (roomContext.regionId || roomContext.anlassraumId) {
      return {
        regionId: roomContext.regionId,
        organizationId: null,
        dossierId: null,
        anlassraumId: roomContext.anlassraumId,
      };
    }
  }

  return {
    regionId: null,
    organizationId: null,
    dossierId: null,
    anlassraumId: null,
  };
}

export async function resolvePersistedCreateHandoffContext(
  input: ResolvePersistedCreateHandoffContextInput,
): Promise<PersistedCreateHandoffContext> {
  const dossierContext = await resolveDossierContext(input.dossierId ?? null);
  if (dossierContext.regionId || dossierContext.organizationId || dossierContext.dossierId) {
    return {
      regionId: dossierContext.regionId,
      organizationId: dossierContext.organizationId,
      dossierId: dossierContext.dossierId,
      anlassraumId: normalizeOptionalString(input.anlassraumId),
    };
  }

  const roomContext = await resolveAnlassraumContext(input.anlassraumId ?? null);
  if (roomContext.regionId || roomContext.anlassraumId) {
    return {
      regionId: roomContext.regionId,
      organizationId: null,
      dossierId: null,
      anlassraumId: roomContext.anlassraumId,
    };
  }

  return resolveGraphMatchContext(input.draft.graphMatches);
}

function createMongoRepo(): CreateHandoffRepository {
  return {
    async save(record) {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; record: PersistedCreateHandoffRecord }>(COLLECTION);
      await col.updateOne(
        { _id: record.id },
        {
          $set: {
            record: clone(record),
            createdByUserId: record.createdByUserId,
            regionId: record.regionId,
            organizationId: record.organizationId,
            dossierId: record.dossierId,
            anlassraumId: record.anlassraumId,
            updatedAt: record.updatedAt,
          } as any,
        },
        { upsert: true },
      );
    },
    async get(id) {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; record: PersistedCreateHandoffRecord }>(COLLECTION);
      const doc = await col.findOne({ _id: id });
      return doc?.record ? clone(doc.record) : null;
    },
    async list() {
      await ensureIndexes();
      const col = await coreCol<{ _id: string; record: PersistedCreateHandoffRecord }>(COLLECTION);
      const docs = await col.find({}).sort({ updatedAt: -1 }).toArray();
      return docs
        .map((doc) => clone(doc.record))
        .filter((record): record is PersistedCreateHandoffRecord => Boolean(record));
    },
  };
}

export function createInMemoryPersistedCreateHandoffRepo(seed?: {
  records?: PersistedCreateHandoffRecord[];
}): CreateHandoffRepository {
  const records = new Map<string, PersistedCreateHandoffRecord>();
  for (const record of seed?.records ?? []) {
    records.set(record.id, clone(record));
  }
  return {
    async save(record) {
      records.set(record.id, clone(record));
    },
    async get(id) {
      return records.get(id) ? clone(records.get(id) as PersistedCreateHandoffRecord) : null;
    },
    async list() {
      return Array.from(records.values())
        .map((record) => clone(record))
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },
  };
}

function getRepo() {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryPersistedCreateHandoffRepo();
    return repoSingleton;
  }
  if (!repoSingleton) repoSingleton = createMongoRepo();
  return repoSingleton;
}

export function getCreateHandoffRepository(): CreateHandoffRepository {
  return getRepo();
}

export function setPersistedCreateHandoffRepoForTests(repo: CreateHandoffRepository | null) {
  repoSingleton = repo;
  indexesReady = false;
}

async function ensureIndexes() {
  if (indexesReady) return;
  const col = await coreCol(COLLECTION);
  await Promise.all([
    col.createIndex({ createdByUserId: 1, updatedAt: -1 }),
    col.createIndex({ regionId: 1, updatedAt: -1 }),
    col.createIndex({ organizationId: 1, updatedAt: -1 }),
    col.createIndex({ dossierId: 1, updatedAt: -1 }),
    col.createIndex({ anlassraumId: 1, updatedAt: -1 }),
    col.createIndex({ selectedAction: 1, updatedAt: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

export async function persistCreateHandoffForReview(input: {
  draft: CreateHandoffDraft;
  createdByUserId: string;
  regionId?: string | null;
  organizationId?: string | null;
  dossierId?: string | null;
  anlassraumId?: string | null;
  intakeClassification: CreateInputClassification;
  requestScope?: PersistedCreateHandoffRecord["requestScope"];
  accessDecision?: PersistedCreateHandoffRecord["accessDecision"];
}) {
  const timestamp = nowIso();
  const existing = await getRepo().get(input.draft.id);
  const record: PersistedCreateHandoffRecord = {
    schemaVersion: PERSISTED_CREATE_HANDOFF_SCHEMA_VERSION,
    id: input.draft.id,
    source: "create",
    sourceText: input.draft.sourceText,
    plannerResult: clone(input.draft.plannerResult),
    graphMatches: clone(input.draft.graphMatches),
    selectedAction: input.draft.selectedAction,
    claims: clone(input.draft.claims),
    arguments: clone(input.draft.arguments),
    openQuestions: clone(input.draft.openQuestions),
    sourceGrounding: clone(input.draft.sourceGrounding),
    topicSeed: clone(input.draft.topicSeed),
    resumeHref: input.draft.resumeHref,
    reviewState: input.draft.reviewState,
    visibilityState: input.draft.visibilityState ?? "internal_review",
    requiresConfirmation: true,
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    intakeClassification: input.intakeClassification,
    createdByUserId: input.createdByUserId,
    regionId: normalizeRegionId(input.regionId),
    organizationId: normalizeOptionalString(input.organizationId),
    dossierId: normalizeOptionalString(input.dossierId),
    anlassraumId: normalizeOptionalString(input.anlassraumId),
    requestScope: input.requestScope ?? null,
    accessDecision: input.accessDecision ?? null,
    createdAt: existing?.createdAt ?? input.draft.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  await getRepo().save(record);
  return record;
}

export async function getPersistedCreateHandoffRecord(id: string) {
  return getRepo().get(String(id || "").trim());
}

export async function listPersistedCreateHandoffRecords() {
  return getRepo().list();
}

export function toCreateHandoffDraft(record: PersistedCreateHandoffRecord): CreateHandoffDraft {
  return {
    id: record.id,
    source: "create",
    sourceText: record.sourceText,
    plannerResult: clone(record.plannerResult),
    graphMatches: clone(record.graphMatches),
    selectedAction: record.selectedAction,
    claims: clone(record.claims),
    arguments: clone(record.arguments),
    openQuestions: clone(record.openQuestions),
    sourceGrounding: clone(record.sourceGrounding),
    topicSeed: clone(record.topicSeed),
    resumeHref: record.resumeHref,
    reviewState: record.reviewState,
    visibilityState: record.visibilityState,
    requiresConfirmation: true,
    createdAt: record.createdAt,
  };
}

export function buildPersistedCreateHandoffSuggestedTitle(
  record: PersistedCreateHandoffRecord,
  targetType: "dossier" | "anlassraum" | "participation_space",
) {
  const topicLabel = String(record.topicSeed.topicLabel || "").trim();
  if (targetType === "dossier") {
    const matchedDossierLabel =
      record.graphMatches.matches.find((match) => match.kind === "dossier")?.label ?? "";
    return matchedDossierLabel.trim() || topicLabel || "Create-Dossier-Entwurf";
  }
  if (targetType === "participation_space") {
    return (
      topicLabel || "Create-Beteiligungsraum"
    );
  }
  const matchedAnlassraumLabel =
    record.graphMatches.matches.find((match) => match.kind === "anlassraum")?.label ?? "";
  return matchedAnlassraumLabel.trim() || topicLabel || "Create-Anlassraum";
}

export function buildPersistedCreateHandoffSummary(record: PersistedCreateHandoffRecord) {
  const factcheckEligibleCount = record.claims.filter((claim) => claim.factcheckEligible).length;
  const parts = [
    `${record.claims.length} Aussagen`,
    `${record.openQuestions.length} offene Fragen`,
    factcheckEligibleCount > 0 ? `${factcheckEligibleCount} Faktencheck-Kandidaten` : null,
    record.regionId ? "Regionsvorschlag vorhanden" : "Region noch offen",
    record.sourceGrounding.some((entry) => entry.id.startsWith("material-reference-"))
      ? "Materialhinweis erkannt"
      : null,
    record.sourceGrounding.some((entry) => entry.status === "link_reference")
      ? "Quellenhinweis erkannt"
      : null,
  ].filter(Boolean);
  const headline = parts.join(" · ");
  const summary = String(record.plannerResult.shortSummary || record.sourceText).trim();
  return `${headline}. ${summary}`.trim();
}

export function persistedCreateHandoffStatementId(handoffId: string) {
  return `create-handoff:${stableHash(String(handoffId || "").trim()).slice(0, 18)}`;
}
