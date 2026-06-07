import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import type {
  SourceSupport,
  TruthStatus,
  UserFacingVerificationLabel,
} from "@features/ai/e150/verificationContract";

export const GRAPH_MERGE_CANDIDATE_SOURCE_TYPES = [
  "create_analysis",
  "editorial_review_request",
  "factcheck_result",
  "theme_suggestion",
  "round_draft",
  "dossier_candidate",
] as const;

export type GraphMergeCandidateSourceType =
  (typeof GRAPH_MERGE_CANDIDATE_SOURCE_TYPES)[number];

export const GRAPH_MERGE_CANDIDATE_KINDS = [
  "claim",
  "theme",
  "dossier",
  "round",
  "source",
  "open_question",
] as const;

export type GraphMergeCandidateKind = (typeof GRAPH_MERGE_CANDIDATE_KINDS)[number];

export const GRAPH_MERGE_CANDIDATE_REVIEW_STATUSES = [
  "draft_candidate",
  "needs_review",
  "accepted_for_staging",
  "staged",
  "merged",
  "rejected",
  "archived",
] as const;

export type GraphMergeCandidateReviewStatus =
  (typeof GRAPH_MERGE_CANDIDATE_REVIEW_STATUSES)[number];

export const GRAPH_MERGE_CANDIDATE_MERGE_STATUSES = [
  "not_started",
  "duplicate_suspected",
  "merge_ready",
  "staged",
  "merged",
  "blocked",
] as const;

export type GraphMergeCandidateMergeStatus =
  (typeof GRAPH_MERGE_CANDIDATE_MERGE_STATUSES)[number];

export const GRAPH_MERGE_CANDIDATE_ACTIONS = [
  "accept_for_staging",
  "mark_duplicate",
  "resolve_duplicate",
  "prepare_productive_merge",
  "confirm_productive_merge",
  "revert_productive_merge",
  "return_to_clarification",
  "reject",
  "archive",
] as const;

export type GraphMergeCandidateAction =
  (typeof GRAPH_MERGE_CANDIDATE_ACTIONS)[number];

export const PRODUCTIVE_GRAPH_MERGE_GATE_REASONS = [
  "merge_ready",
  "blocked_source_open",
  "blocked_review_required",
  "blocked_duplicate_unresolved",
  "blocked_missing_admin",
  "blocked_truth_guard",
  "override_required",
] as const;

export type ProductiveGraphMergeGateReason =
  (typeof PRODUCTIVE_GRAPH_MERGE_GATE_REASONS)[number];

export const GRAPH_MERGE_AUDIT_ACTIONS = [
  "merge_confirmed",
  "merge_blocked",
  "merge_reverted",
  "duplicate_resolved",
  "override_confirmed",
] as const;

export type GraphMergeAuditAction = (typeof GRAPH_MERGE_AUDIT_ACTIONS)[number];

type GraphMergeCandidateActionRule = {
  nextReviewStatus: GraphMergeCandidateReviewStatus;
  noteRequired?: boolean;
};

export type GraphMergeDuplicateCandidate = {
  id: string;
  label: string;
  matchType: "normalized_text" | "title_similarity" | "source_overlap";
  sourceType: GraphMergeCandidateSourceType;
  candidateKind: GraphMergeCandidateKind;
  reviewStatus: GraphMergeCandidateReviewStatus;
  mergeStatus: GraphMergeCandidateMergeStatus;
};

export type GraphMergeCandidateHistoryEntry = {
  id: string;
  action: GraphMergeCandidateAction;
  byUserId: string;
  at: string;
  note: string | null;
  previousReviewStatus: GraphMergeCandidateReviewStatus;
  nextReviewStatus: GraphMergeCandidateReviewStatus;
  previousMergeStatus: GraphMergeCandidateMergeStatus;
  nextMergeStatus: GraphMergeCandidateMergeStatus;
};

export type GraphMergeStateSnapshot = {
  reviewStatus: GraphMergeCandidateReviewStatus;
  mergeStatus: GraphMergeCandidateMergeStatus;
  productiveMergeConfirmedAt: string | null;
  productiveMergeConfirmedByUserId: string | null;
};

export type GraphMergeAuditEntry = {
  id: string;
  candidateId: string;
  sourceType: GraphMergeCandidateSourceType;
  sourceId: string;
  mergedBy: string;
  mergedAt: string;
  action: GraphMergeAuditAction;
  reason: ProductiveGraphMergeGateReason;
  overrideReason?: string | null;
  previousState?: GraphMergeStateSnapshot | null;
  nextState?: GraphMergeStateSnapshot | null;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  verificationLabel: UserFacingVerificationLabel;
  noAutoPublish: true;
};

export type ProductiveGraphMergeGate = {
  candidateId: string;
  allowed: boolean;
  requiresAdminConfirmation: true;
  requiresDedupeReview: boolean;
  requiresSourceSupport: boolean;
  requiresReviewCompletion: boolean;
  requiresOverrideReason: boolean;
  reason: ProductiveGraphMergeGateReason;
  noAutoPublish: true;
  noAutoVote: true;
  auditRequired: true;
};

export type GraphMergeCandidate = {
  id: string;
  sourceType: GraphMergeCandidateSourceType;
  sourceId: string;
  reviewRequestId?: string | null;
  userId?: string | null;
  text: string;
  normalizedText: string;
  candidateKind: GraphMergeCandidateKind;
  proposedTitle?: string | null;
  proposedSummary?: string | null;
  proposedClaims?: string[];
  proposedTopics?: string[];
  proposedSources?: string[];
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  verificationLabel: UserFacingVerificationLabel;
  reviewRecommended: boolean;
  reviewStatus: GraphMergeCandidateReviewStatus;
  mergeStatus: GraphMergeCandidateMergeStatus;
  duplicateCandidates?: GraphMergeDuplicateCandidate[];
  createdAt: string;
  updatedAt: string;
  noTruthPromotion: true;
  noAutoPublish: true;
  noAutoGraphPromotion: true;
  requiresEditorialConfirmation: true;
  statusNote?: string | null;
  latestAction?: GraphMergeCandidateAction | null;
  latestActionAt?: string | null;
  latestActionByUserId?: string | null;
  productiveMergeConfirmedAt?: string | null;
  productiveMergeConfirmedByUserId?: string | null;
  productiveMergeOverrideReason?: string | null;
  history?: GraphMergeCandidateHistoryEntry[];
};

type GraphMergeCandidateDoc = Omit<GraphMergeCandidate, "id" | "createdAt" | "updatedAt"> & {
  _id?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GraphMergeCandidatePersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  label: string;
  summary: string;
  repositoryInterface: "GraphMergeCandidatesRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
};

type GraphMergeCandidatesRepository = {
  insert(doc: GraphMergeCandidateDoc): Promise<GraphMergeCandidateDoc>;
  update(doc: GraphMergeCandidateDoc): Promise<GraphMergeCandidateDoc>;
  getById(id: string): Promise<GraphMergeCandidateDoc | null>;
  getByReviewRequestId(reviewRequestId: string): Promise<GraphMergeCandidateDoc | null>;
  list(params?: {
    userId?: string | null;
    limit?: number;
    reviewStatuses?: GraphMergeCandidateReviewStatus[];
  }): Promise<GraphMergeCandidateDoc[]>;
  insertAudit(entry: GraphMergeAuditEntry): Promise<GraphMergeAuditEntry>;
  listAudits(params?: {
    candidateId?: string | null;
    limit?: number;
  }): Promise<GraphMergeAuditEntry[]>;
  getPersistenceState(): GraphMergeCandidatePersistenceState;
};

type EditorialReviewRequestLike = {
  id: string;
  sourceType: string;
  sourceId?: string | null;
  userId?: string | null;
  originalText: string;
  normalizedText?: string | null;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  verificationLabel: UserFacingVerificationLabel;
  reviewRecommended: boolean;
};

type FactcheckJobLike = {
  jobId: string;
  userId?: string | null;
  requestedByUserId?: string | null;
  inputText: string;
  normalizedText?: string | null;
  sourceRefs?: Array<{ url?: string | null; label?: string | null }>;
  claims?: Array<{ text?: string | null }>;
  truthStatus?: TruthStatus | null;
  sourceSupport?: SourceSupport | null;
  sourceStatus?: string | null;
  verificationLabel?: UserFacingVerificationLabel | null;
  result?: {
    reviewRecommended?: boolean | null;
    truthStatus?: TruthStatus | null;
    sourceSupport?: SourceSupport | null;
    sourceStatus?: string | null;
    verificationLabel?: UserFacingVerificationLabel | null;
  } | null;
};

const GRAPH_MERGE_CANDIDATES_COLLECTION = "graph_merge_candidates";
const GRAPH_MERGE_AUDIT_COLLECTION = "graph_merge_audit_entries";

let repoSingleton: GraphMergeCandidatesRepository | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeText(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:/.-]/gu, " ")
    .replace(/\s+/g, " ");
}

function normalizeOptionalString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function objectIdString(value: unknown) {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toHexString" in (value as Record<string, unknown>) &&
    typeof (value as { toHexString?: () => string }).toHexString === "function"
  ) {
    return (value as { toHexString: () => string }).toHexString();
  }
  return String(value ?? "").trim();
}

function asDate(value: unknown) {
  if (value instanceof Date) return value;
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function candidateHistoryId(input: {
  candidateId: string;
  action: GraphMergeCandidateAction;
  at: string;
}) {
  return `graph-candidate-${stableHash(`${input.candidateId}:${input.action}:${input.at}`).slice(0, 18)}`;
}

function auditEntryId(input: {
  candidateId: string;
  action: GraphMergeAuditAction;
  at: string;
  reason: ProductiveGraphMergeGateReason;
}) {
  return `graph-merge-audit-${stableHash(
    `${input.candidateId}:${input.action}:${input.reason}:${input.at}`,
  ).slice(0, 22)}`;
}

function candidateStateSnapshot(
  candidate: Pick<
    GraphMergeCandidateDoc,
    | "reviewStatus"
    | "mergeStatus"
    | "productiveMergeConfirmedAt"
    | "productiveMergeConfirmedByUserId"
  >,
): GraphMergeStateSnapshot {
  return {
    reviewStatus: candidate.reviewStatus,
    mergeStatus: candidate.mergeStatus,
    productiveMergeConfirmedAt: candidate.productiveMergeConfirmedAt ?? null,
    productiveMergeConfirmedByUserId: candidate.productiveMergeConfirmedByUserId ?? null,
  };
}

function buildPersistenceState(
  mode: GraphMergeCandidatePersistenceState["mode"],
): GraphMergeCandidatePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent ? "Persistenter Graph-Candidate-Store" : "In-Memory-Fallback",
    summary: persistent
      ? "Graph-Kandidaten, Merge-Gates und auditierte Bestätigungen liegen dauerhaft vor. Auto-Merge und Auto-Publish bleiben ausgeschlossen."
      : "Nur Dev-/Test-Fallback: Graph-Kandidaten und Merge-Receipts leben pro Runtime und dürfen nicht als produktive Graph-Wahrheit dargestellt werden.",
    repositoryInterface: "GraphMergeCandidatesRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
  };
}

function toCandidate(doc: GraphMergeCandidateDoc): GraphMergeCandidate {
  return {
    id: objectIdString(doc._id),
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
    reviewRequestId: doc.reviewRequestId ?? null,
    userId: doc.userId ?? null,
    text: doc.text,
    normalizedText: doc.normalizedText,
    candidateKind: doc.candidateKind,
    proposedTitle: doc.proposedTitle ?? null,
    proposedSummary: doc.proposedSummary ?? null,
    proposedClaims: Array.isArray(doc.proposedClaims) ? clone(doc.proposedClaims) : [],
    proposedTopics: Array.isArray(doc.proposedTopics) ? clone(doc.proposedTopics) : [],
    proposedSources: Array.isArray(doc.proposedSources) ? clone(doc.proposedSources) : [],
    truthStatus: doc.truthStatus,
    sourceSupport: doc.sourceSupport,
    sourceStatus: doc.sourceStatus,
    verificationLabel: doc.verificationLabel,
    reviewRecommended: Boolean(doc.reviewRecommended),
    reviewStatus: doc.reviewStatus,
    mergeStatus: doc.mergeStatus,
    duplicateCandidates: Array.isArray(doc.duplicateCandidates)
      ? clone(doc.duplicateCandidates)
      : [],
    createdAt: asDate(doc.createdAt).toISOString(),
    updatedAt: asDate(doc.updatedAt).toISOString(),
    noTruthPromotion: true,
    noAutoPublish: true,
    noAutoGraphPromotion: true,
    requiresEditorialConfirmation: true,
    statusNote: doc.statusNote ?? null,
    latestAction: doc.latestAction ?? null,
    latestActionAt: doc.latestActionAt ?? null,
    latestActionByUserId: doc.latestActionByUserId ?? null,
    productiveMergeConfirmedAt: doc.productiveMergeConfirmedAt ?? null,
    productiveMergeConfirmedByUserId: doc.productiveMergeConfirmedByUserId ?? null,
    productiveMergeOverrideReason: doc.productiveMergeOverrideReason ?? null,
    history: Array.isArray(doc.history) ? clone(doc.history) : [],
  };
}

export function createInMemoryGraphMergeCandidatesRepository(): GraphMergeCandidatesRepository {
  const docs = new Map<string, GraphMergeCandidateDoc>();
  const audits = new Map<string, GraphMergeAuditEntry>();
  return {
    async insert(doc) {
      const nextId = `graphcandidate_${stableHash(`${doc.sourceId}:${doc.reviewRequestId ?? ""}:${doc.text}`).slice(0, 22)}`;
      const nextDoc = { ...clone(doc), _id: nextId };
      docs.set(nextId, nextDoc);
      return clone(nextDoc);
    },
    async update(doc) {
      const id = objectIdString(doc._id);
      docs.set(id, clone(doc));
      return clone(doc);
    },
    async getById(id) {
      const doc = docs.get(id);
      return doc ? clone(doc) : null;
    },
    async getByReviewRequestId(reviewRequestId) {
      const doc = Array.from(docs.values()).find((entry) => entry.reviewRequestId === reviewRequestId);
      return doc ? clone(doc) : null;
    },
    async list(params) {
      const list = Array.from(docs.values())
        .filter((doc) => {
          if (params?.userId && doc.userId !== params.userId) return false;
          if (params?.reviewStatuses?.length && !params.reviewStatuses.includes(doc.reviewStatus)) return false;
          return true;
        })
        .sort((a, b) => asDate(b.updatedAt).getTime() - asDate(a.updatedAt).getTime());
      return (typeof params?.limit === "number" ? list.slice(0, params.limit) : list).map(clone);
    },
    async insertAudit(entry) {
      audits.set(entry.id, clone(entry));
      return clone(entry);
    },
    async listAudits(params) {
      const list = Array.from(audits.values())
        .filter((entry) => {
          if (params?.candidateId && entry.candidateId !== params.candidateId) return false;
          return true;
        })
        .sort((left, right) => right.mergedAt.localeCompare(left.mergedAt));
      return (typeof params?.limit === "number" ? list.slice(0, params.limit) : list).map(clone);
    },
    getPersistenceState() {
      return buildPersistenceState("in_memory_fallback");
    },
  };
}

function createMongoRepo(): GraphMergeCandidatesRepository {
  return {
    async insert(doc) {
      const col = await coreCol<GraphMergeCandidateDoc>(GRAPH_MERGE_CANDIDATES_COLLECTION);
      const nextId =
        doc._id ??
        `graphcandidate_${stableHash(`${doc.sourceId}:${doc.reviewRequestId ?? ""}:${doc.text}`).slice(0, 22)}`;
      await col.insertOne({ ...doc, _id: nextId } as any);
      return { ...clone(doc), _id: nextId };
    },
    async update(doc) {
      const col = await coreCol<GraphMergeCandidateDoc>(GRAPH_MERGE_CANDIDATES_COLLECTION);
      const id = doc._id as string;
      const { _id: _ignore, ...rest } = clone(doc);
      await col.updateOne({ _id: id } as any, { $set: rest as any }, { upsert: true });
      return clone(doc);
    },
    async getById(id) {
      const col = await coreCol<GraphMergeCandidateDoc>(GRAPH_MERGE_CANDIDATES_COLLECTION);
      const doc = await col.findOne({ _id: id as any } as any);
      return doc ? clone(doc) : null;
    },
    async getByReviewRequestId(reviewRequestId) {
      const col = await coreCol<GraphMergeCandidateDoc>(GRAPH_MERGE_CANDIDATES_COLLECTION);
      const doc = await col.findOne({ reviewRequestId } as any);
      return doc ? clone(doc) : null;
    },
    async list(params) {
      const col = await coreCol<GraphMergeCandidateDoc>(GRAPH_MERGE_CANDIDATES_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params?.userId) filter.userId = params.userId;
      if (params?.reviewStatuses?.length) filter.reviewStatus = { $in: params.reviewStatuses };
      const cursor = col.find(filter as any).sort({ updatedAt: -1 });
      if (typeof params?.limit === "number") cursor.limit(params.limit);
      const docs = await cursor.toArray();
      return docs.map(clone);
    },
    async insertAudit(entry) {
      const col = await coreCol<GraphMergeAuditEntry>(GRAPH_MERGE_AUDIT_COLLECTION);
      await col.updateOne({ id: entry.id } as any, { $set: clone(entry) as any }, { upsert: true });
      return clone(entry);
    },
    async listAudits(params) {
      const col = await coreCol<GraphMergeAuditEntry>(GRAPH_MERGE_AUDIT_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (params?.candidateId) filter.candidateId = params.candidateId;
      const cursor = col.find(filter as any).sort({ mergedAt: -1 });
      if (typeof params?.limit === "number") cursor.limit(params.limit);
      const docs = await cursor.toArray();
      return docs.map(clone);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryGraphMergeCandidatesRepository()
    : createMongoRepo();
  return repoSingleton;
}

export function setGraphMergeCandidatesRepoForTests(repo: GraphMergeCandidatesRepository | null) {
  repoSingleton = repo;
}

function mapReviewSourceTypeToCandidateSourceType(
  request: EditorialReviewRequestLike,
): GraphMergeCandidateSourceType {
  if (request.sourceType === "create_analysis") return "create_analysis";
  if (request.sourceType === "theme_suggestion") return "theme_suggestion";
  if (request.sourceType === "round_draft") return "round_draft";
  if (
    request.sourceType === "factcheck_request" &&
    (request.truthStatus === "factcheck_passed" || request.truthStatus === "sealed_verified")
  ) {
    return "factcheck_result";
  }
  return "editorial_review_request";
}

function mapReviewSourceTypeToCandidateKind(
  request: EditorialReviewRequestLike,
): GraphMergeCandidateKind {
  if (request.sourceType === "theme_suggestion") return "theme";
  if (request.sourceType === "round_draft") return "round";
  if (request.sourceType === "factcheck_request") return "claim";
  return "claim";
}

function extractUrls(text: string) {
  const matches = String(text ?? "").match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  return Array.from(new Set(matches.map((value) => value.trim()).filter(Boolean))).slice(0, 6);
}

function summarizeText(text: string, limit = 140) {
  const normalized = String(text ?? "").trim().replace(/\s+/g, " ");
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1).trim()}…`;
}

function deriveProposedTopics(request: EditorialReviewRequestLike) {
  if (request.sourceType === "theme_suggestion") {
    return [summarizeText(request.originalText, 80)];
  }
  return [];
}

function deriveReviewStatus(input: {
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  reviewRecommended: boolean;
}): GraphMergeCandidateReviewStatus {
  if (input.sourceSupport === "none" || input.sourceSupport === "open") return "needs_review";
  if (input.reviewRecommended) return "needs_review";
  if (input.truthStatus === "sealed_verified" || input.truthStatus === "factcheck_passed") {
    return "needs_review";
  }
  return "needs_review";
}

function deriveMergeStatus(input: {
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  reviewRecommended: boolean;
}): GraphMergeCandidateMergeStatus {
  if (input.sourceSupport === "none" || input.sourceSupport === "open") return "blocked";
  if (input.reviewRecommended) return "not_started";
  if (input.truthStatus === "sealed_verified" || input.truthStatus === "factcheck_passed") {
    return "merge_ready";
  }
  return "not_started";
}

function titleTokens(value: string | null | undefined) {
  return normalizeText(value ?? "")
    .split(/\s+/)
    .filter((token) => token.length >= 5)
    .slice(0, 6);
}

function buildDuplicateCandidates(
  input: {
    normalizedText: string;
    proposedTitle: string | null;
    proposedSources: string[];
  },
  existing: GraphMergeCandidate[],
  currentId?: string | null,
): GraphMergeDuplicateCandidate[] {
  const currentTitleTokens = titleTokens(input.proposedTitle);
  return existing
    .filter((entry) => entry.id !== currentId)
    .map((entry) => {
      if (entry.normalizedText === input.normalizedText) {
        return {
          id: entry.id,
          label: entry.proposedTitle ?? summarizeText(entry.text, 90),
          matchType: "normalized_text" as const,
          sourceType: entry.sourceType,
          candidateKind: entry.candidateKind,
          reviewStatus: entry.reviewStatus,
          mergeStatus: entry.mergeStatus,
        };
      }
      const overlappingTitleTokens = titleTokens(entry.proposedTitle).filter((token) =>
        currentTitleTokens.includes(token),
      );
      if (overlappingTitleTokens.length >= 2) {
        return {
          id: entry.id,
          label: entry.proposedTitle ?? summarizeText(entry.text, 90),
          matchType: "title_similarity" as const,
          sourceType: entry.sourceType,
          candidateKind: entry.candidateKind,
          reviewStatus: entry.reviewStatus,
          mergeStatus: entry.mergeStatus,
        };
      }
      const currentSources = new Set(input.proposedSources);
      if ((entry.proposedSources ?? []).some((source) => currentSources.has(source))) {
        return {
          id: entry.id,
          label: entry.proposedTitle ?? summarizeText(entry.text, 90),
          matchType: "source_overlap" as const,
          sourceType: entry.sourceType,
          candidateKind: entry.candidateKind,
          reviewStatus: entry.reviewStatus,
          mergeStatus: entry.mergeStatus,
        };
      }
      return null;
    })
    .filter((entry): entry is GraphMergeDuplicateCandidate => Boolean(entry))
    .slice(0, 5);
}

export async function listGraphMergeCandidates(params?: {
  userId?: string | null;
  limit?: number;
  reviewStatuses?: GraphMergeCandidateReviewStatus[];
}) {
  const docs = await getRepo().list(params);
  return docs.map(toCandidate);
}

export function getGraphMergeCandidatesPersistenceState() {
  return getRepo().getPersistenceState();
}

export async function prepareGraphMergeCandidateFromReviewRequest(
  request: EditorialReviewRequestLike,
) {
  const repo = getRepo();
  const existingDoc = await repo.getByReviewRequestId(request.id);
  const now = new Date();
  const sourceType = mapReviewSourceTypeToCandidateSourceType(request);
  const candidateKind = mapReviewSourceTypeToCandidateKind(request);
  const proposedTitle = summarizeText(request.originalText, 90);
  const proposedSources = extractUrls(request.originalText);
  const proposedTopics = deriveProposedTopics(request);
  const base: Omit<GraphMergeCandidateDoc, "_id" | "createdAt" | "updatedAt"> = {
    sourceType,
    sourceId: request.sourceId ?? request.id,
    reviewRequestId: request.id,
    userId: request.userId ?? null,
    text: request.originalText.trim(),
    normalizedText: request.normalizedText?.trim() || normalizeText(request.originalText),
    candidateKind,
    proposedTitle,
    proposedSummary: summarizeText(request.originalText, 180),
    proposedClaims: candidateKind === "claim" ? [request.originalText.trim()] : [],
    proposedTopics,
    proposedSources,
    truthStatus: request.truthStatus,
    sourceSupport: request.sourceSupport,
    sourceStatus: request.sourceStatus,
    verificationLabel: request.verificationLabel,
    reviewRecommended: request.reviewRecommended,
    reviewStatus: deriveReviewStatus({
      truthStatus: request.truthStatus,
      sourceSupport: request.sourceSupport,
      reviewRecommended: request.reviewRecommended,
    }),
    mergeStatus: deriveMergeStatus({
      truthStatus: request.truthStatus,
      sourceSupport: request.sourceSupport,
      reviewRecommended: request.reviewRecommended,
    }),
    duplicateCandidates: [],
    noTruthPromotion: true,
    noAutoPublish: true,
    noAutoGraphPromotion: true,
    requiresEditorialConfirmation: true,
    statusNote: null,
    latestAction: null,
    latestActionAt: null,
    latestActionByUserId: null,
    productiveMergeConfirmedAt: null,
    productiveMergeConfirmedByUserId: null,
    productiveMergeOverrideReason: null,
    history: [],
  };

  const allCandidates = await listGraphMergeCandidates({ limit: 200 });
  const duplicateCandidates = buildDuplicateCandidates(
    {
      normalizedText: base.normalizedText,
      proposedTitle,
      proposedSources,
    },
    allCandidates,
    existingDoc ? objectIdString(existingDoc._id) : null,
  );
  const mergeStatus =
    base.mergeStatus === "blocked"
      ? "blocked"
      : duplicateCandidates.length > 0
        ? "duplicate_suspected"
        : base.mergeStatus;

  const nextDoc: GraphMergeCandidateDoc = existingDoc
    ? {
        ...existingDoc,
        ...base,
        mergeStatus,
        duplicateCandidates,
        updatedAt: now,
      }
    : {
        ...base,
        mergeStatus,
        duplicateCandidates,
        createdAt: now,
        updatedAt: now,
      };

  const saved = existingDoc ? await repo.update(nextDoc) : await repo.insert(nextDoc);
  return toCandidate(saved);
}

export async function prepareGraphMergeCandidateFromFactcheckJob(
  job: FactcheckJobLike,
) {
  const repo = getRepo();
  const now = new Date();
  const proposedTitle = summarizeText(job.inputText, 90);
  const proposedSources = Array.from(
    new Set(
      (job.sourceRefs ?? [])
        .map((entry) => entry.url ?? entry.label ?? "")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );
  const truthStatus = job.result?.truthStatus ?? job.truthStatus ?? "review_required";
  const sourceSupport = job.result?.sourceSupport ?? job.sourceSupport ?? "open";
  const sourceStatus = job.result?.sourceStatus ?? job.sourceStatus ?? "Quellenprüfung erfolgt";
  const verificationLabel =
    job.result?.verificationLabel ?? job.verificationLabel ?? "analysiert";
  const reviewRecommended = job.result?.reviewRecommended !== false;
  const candidateKind = (job.claims?.length ?? 0) > 0 ? "claim" : "source";
  const base: Omit<GraphMergeCandidateDoc, "_id" | "createdAt" | "updatedAt"> = {
    sourceType: "factcheck_result",
    sourceId: job.jobId,
    reviewRequestId: null,
    userId: job.userId ?? job.requestedByUserId ?? null,
    text: job.inputText.trim(),
    normalizedText: job.normalizedText?.trim() || normalizeText(job.inputText),
    candidateKind,
    proposedTitle,
    proposedSummary: summarizeText(job.inputText, 180),
    proposedClaims:
      candidateKind === "claim"
        ? (job.claims ?? [])
            .map((claim) => String(claim?.text ?? "").trim())
            .filter(Boolean)
        : [],
    proposedTopics: [],
    proposedSources,
    truthStatus,
    sourceSupport,
    sourceStatus,
    verificationLabel,
    reviewRecommended,
    reviewStatus: deriveReviewStatus({
      truthStatus,
      sourceSupport,
      reviewRecommended,
    }),
    mergeStatus: deriveMergeStatus({
      truthStatus,
      sourceSupport,
      reviewRecommended,
    }),
    duplicateCandidates: [],
    noTruthPromotion: true,
    noAutoPublish: true,
    noAutoGraphPromotion: true,
    requiresEditorialConfirmation: true,
    statusNote: "Aus einem Factcheck-Ergebnis vorbereitet. Kein Auto-Merge.",
    latestAction: null,
    latestActionAt: null,
    latestActionByUserId: null,
    productiveMergeConfirmedAt: null,
    productiveMergeConfirmedByUserId: null,
    productiveMergeOverrideReason: null,
    history: [],
  };

  const allCandidates = await listGraphMergeCandidates({ limit: 200 });
  const existingCandidate = allCandidates.find(
    (candidate) =>
      candidate.sourceType === "factcheck_result" && candidate.sourceId === job.jobId,
  );
  const existingDoc = existingCandidate ? await repo.getById(existingCandidate.id) : null;
  const duplicateCandidates = buildDuplicateCandidates(
    {
      normalizedText: base.normalizedText,
      proposedTitle,
      proposedSources,
    },
    allCandidates,
    existingDoc ? objectIdString(existingDoc._id) : null,
  );
  const mergeStatus =
    base.mergeStatus === "blocked"
      ? "blocked"
      : duplicateCandidates.length > 0
        ? "duplicate_suspected"
        : base.mergeStatus;

  const nextDoc: GraphMergeCandidateDoc = existingDoc
    ? {
        ...existingDoc,
        ...base,
        mergeStatus,
        duplicateCandidates,
        updatedAt: now,
      }
    : {
        ...base,
        mergeStatus,
        duplicateCandidates,
        createdAt: now,
        updatedAt: now,
      };

  const saved = existingDoc ? await repo.update(nextDoc) : await repo.insert(nextDoc);
  return toCandidate(saved);
}

const ACTION_RULES_BY_REVIEW_STATUS: Record<
  GraphMergeCandidateReviewStatus,
  Partial<Record<GraphMergeCandidateAction, GraphMergeCandidateActionRule>>
> = {
  draft_candidate: {
    accept_for_staging: { nextReviewStatus: "accepted_for_staging" },
    mark_duplicate: { nextReviewStatus: "draft_candidate" },
    resolve_duplicate: { nextReviewStatus: "draft_candidate" },
    prepare_productive_merge: { nextReviewStatus: "staged" },
    confirm_productive_merge: { nextReviewStatus: "merged" },
    revert_productive_merge: { nextReviewStatus: "draft_candidate", noteRequired: true },
    return_to_clarification: { nextReviewStatus: "needs_review", noteRequired: true },
    reject: { nextReviewStatus: "rejected", noteRequired: true },
    archive: { nextReviewStatus: "archived" },
  },
  needs_review: {
    accept_for_staging: { nextReviewStatus: "accepted_for_staging" },
    mark_duplicate: { nextReviewStatus: "needs_review" },
    resolve_duplicate: { nextReviewStatus: "needs_review" },
    prepare_productive_merge: { nextReviewStatus: "staged" },
    confirm_productive_merge: { nextReviewStatus: "merged" },
    revert_productive_merge: { nextReviewStatus: "needs_review", noteRequired: true },
    return_to_clarification: { nextReviewStatus: "needs_review", noteRequired: true },
    reject: { nextReviewStatus: "rejected", noteRequired: true },
    archive: { nextReviewStatus: "archived" },
  },
  accepted_for_staging: {
    mark_duplicate: { nextReviewStatus: "accepted_for_staging" },
    resolve_duplicate: { nextReviewStatus: "accepted_for_staging" },
    prepare_productive_merge: { nextReviewStatus: "staged" },
    confirm_productive_merge: { nextReviewStatus: "merged" },
    revert_productive_merge: { nextReviewStatus: "accepted_for_staging", noteRequired: true },
    return_to_clarification: { nextReviewStatus: "needs_review", noteRequired: true },
    reject: { nextReviewStatus: "rejected", noteRequired: true },
    archive: { nextReviewStatus: "archived" },
  },
  staged: {
    mark_duplicate: { nextReviewStatus: "staged" },
    resolve_duplicate: { nextReviewStatus: "staged" },
    prepare_productive_merge: { nextReviewStatus: "staged" },
    confirm_productive_merge: { nextReviewStatus: "merged" },
    revert_productive_merge: { nextReviewStatus: "staged", noteRequired: true },
    return_to_clarification: { nextReviewStatus: "needs_review", noteRequired: true },
    reject: { nextReviewStatus: "rejected", noteRequired: true },
    archive: { nextReviewStatus: "archived" },
  },
  merged: {
    revert_productive_merge: { nextReviewStatus: "staged", noteRequired: true },
    archive: { nextReviewStatus: "archived" },
  },
  rejected: {
    archive: { nextReviewStatus: "archived" },
  },
  archived: {},
};

function resolveActionRule(
  reviewStatus: GraphMergeCandidateReviewStatus,
  action: GraphMergeCandidateAction,
) {
  return ACTION_RULES_BY_REVIEW_STATUS[reviewStatus][action] ?? null;
}

function sourceSupportBlocksStaging(sourceSupport: SourceSupport) {
  return sourceSupport === "none" || sourceSupport === "open";
}

function truthStatusBlocksProductiveMerge(truthStatus: TruthStatus) {
  return (
    truthStatus === "draft_analysis" ||
    truthStatus === "source_open" ||
    truthStatus === "review_required"
  );
}

function duplicateReviewIsOpen(candidate: Pick<GraphMergeCandidateDoc, "mergeStatus" | "duplicateCandidates">) {
  return (
    candidate.mergeStatus === "duplicate_suspected" ||
    Boolean(candidate.duplicateCandidates?.length)
  );
}

function graphMergeGate(
  input: {
    candidate: GraphMergeCandidateDoc;
    isAdminConfirmed: boolean;
    overrideReason?: string | null;
    phase?: "prepare" | "confirm";
  },
): ProductiveGraphMergeGate {
  const overrideReason = normalizeOptionalString(input.overrideReason);
  const phase = input.phase ?? "confirm";
  const requiresSourceSupport = sourceSupportBlocksStaging(input.candidate.sourceSupport);
  const requiresDedupeReview = duplicateReviewIsOpen(input.candidate);
  const missingAdmin = !input.isAdminConfirmed;
  const truthGuardBlocked = truthStatusBlocksProductiveMerge(input.candidate.truthStatus);
  const reviewStateBlocked =
    phase === "confirm"
      ? input.candidate.reviewStatus !== "staged" || input.candidate.mergeStatus !== "merge_ready"
      : !["accepted_for_staging", "staged"].includes(input.candidate.reviewStatus) ||
        !["staged", "merge_ready"].includes(input.candidate.mergeStatus);
  const requiresOverrideReason = Boolean(
    input.candidate.reviewRecommended && phase === "confirm" && !overrideReason,
  );

  let reason: ProductiveGraphMergeGateReason = "merge_ready";
  if (missingAdmin) {
    reason = "blocked_missing_admin";
  } else if (requiresSourceSupport) {
    reason = "blocked_source_open";
  } else if (truthGuardBlocked) {
    reason = "blocked_truth_guard";
  } else if (requiresDedupeReview) {
    reason = "blocked_duplicate_unresolved";
  } else if (reviewStateBlocked) {
    reason = "blocked_review_required";
  } else if (requiresOverrideReason) {
    reason = "override_required";
  }

  return {
    candidateId: objectIdString(input.candidate._id),
    allowed: reason === "merge_ready",
    requiresAdminConfirmation: true,
    requiresDedupeReview,
    requiresSourceSupport,
    requiresReviewCompletion: reviewStateBlocked,
    requiresOverrideReason,
    reason,
    noAutoPublish: true,
    noAutoVote: true,
    auditRequired: true,
  };
}

export function evaluateProductiveGraphMergeGate(
  candidate: GraphMergeCandidate,
  options?: {
    isAdminConfirmed?: boolean;
    overrideReason?: string | null;
    phase?: "prepare" | "confirm";
  },
) {
  const candidateDoc: GraphMergeCandidateDoc = {
    _id: candidate.id,
    sourceType: candidate.sourceType,
    sourceId: candidate.sourceId,
    reviewRequestId: candidate.reviewRequestId ?? null,
    userId: candidate.userId ?? null,
    text: candidate.text,
    normalizedText: candidate.normalizedText,
    candidateKind: candidate.candidateKind,
    proposedTitle: candidate.proposedTitle ?? null,
    proposedSummary: candidate.proposedSummary ?? null,
    proposedClaims: candidate.proposedClaims ?? [],
    proposedTopics: candidate.proposedTopics ?? [],
    proposedSources: candidate.proposedSources ?? [],
    truthStatus: candidate.truthStatus,
    sourceSupport: candidate.sourceSupport,
    sourceStatus: candidate.sourceStatus,
    verificationLabel: candidate.verificationLabel,
    reviewRecommended: candidate.reviewRecommended,
    reviewStatus: candidate.reviewStatus,
    mergeStatus: candidate.mergeStatus,
    duplicateCandidates: candidate.duplicateCandidates ?? [],
    createdAt: asDate(candidate.createdAt),
    updatedAt: asDate(candidate.updatedAt),
    noTruthPromotion: true,
    noAutoPublish: true,
    noAutoGraphPromotion: true,
    requiresEditorialConfirmation: true,
    statusNote: candidate.statusNote ?? null,
    latestAction: candidate.latestAction ?? null,
    latestActionAt: candidate.latestActionAt ?? null,
    latestActionByUserId: candidate.latestActionByUserId ?? null,
    productiveMergeConfirmedAt: candidate.productiveMergeConfirmedAt ?? null,
    productiveMergeConfirmedByUserId: candidate.productiveMergeConfirmedByUserId ?? null,
    productiveMergeOverrideReason: candidate.productiveMergeOverrideReason ?? null,
    history: candidate.history ?? [],
  };

  return graphMergeGate({
    candidate: candidateDoc,
    isAdminConfirmed: options?.isAdminConfirmed ?? false,
    overrideReason: options?.overrideReason ?? null,
    phase: options?.phase ?? "confirm",
  });
}

function nextMergeStatusForAction(input: {
  reviewStatus: GraphMergeCandidateReviewStatus;
  current: GraphMergeCandidateMergeStatus;
  action: GraphMergeCandidateAction;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  duplicateCandidates?: GraphMergeDuplicateCandidate[];
  reviewRecommended: boolean;
  overrideReason?: string | null;
}): GraphMergeCandidateMergeStatus {
  switch (input.action) {
    case "accept_for_staging":
      if (sourceSupportBlocksStaging(input.sourceSupport)) {
        throw new Error("graph_merge_candidate_staging_blocked_by_source_support");
      }
      return input.current === "duplicate_suspected" ? "duplicate_suspected" : "staged";
    case "mark_duplicate":
      return "duplicate_suspected";
    case "resolve_duplicate":
      return input.reviewStatus === "accepted_for_staging" || input.reviewStatus === "staged"
        ? "staged"
        : "not_started";
    case "prepare_productive_merge": {
      const gate = graphMergeGate({
        candidate: {
          _id: "prepare",
          sourceType: "create_analysis",
          sourceId: "prepare",
          text: "",
          normalizedText: "",
          candidateKind: "claim",
          truthStatus: input.truthStatus,
          sourceSupport: input.sourceSupport,
          sourceStatus: "",
          verificationLabel: "analysiert",
          reviewRecommended: input.reviewRecommended,
          reviewStatus: input.reviewStatus,
          mergeStatus: input.current,
          duplicateCandidates: input.duplicateCandidates ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
          noTruthPromotion: true,
          noAutoPublish: true,
          noAutoGraphPromotion: true,
          requiresEditorialConfirmation: true,
        },
        isAdminConfirmed: true,
        phase: "prepare",
      });
      if (!gate.allowed) throw new Error(`graph_merge_candidate_${gate.reason}`);
      return "merge_ready";
    }
    case "confirm_productive_merge": {
      const gate = graphMergeGate({
        candidate: {
          _id: "confirm",
          sourceType: "create_analysis",
          sourceId: "confirm",
          text: "",
          normalizedText: "",
          candidateKind: "claim",
          truthStatus: input.truthStatus,
          sourceSupport: input.sourceSupport,
          sourceStatus: "",
          verificationLabel: "analysiert",
          reviewRecommended: input.reviewRecommended,
          reviewStatus: input.reviewStatus,
          mergeStatus: input.current,
          duplicateCandidates: input.duplicateCandidates ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
          noTruthPromotion: true,
          noAutoPublish: true,
          noAutoGraphPromotion: true,
          requiresEditorialConfirmation: true,
        },
        isAdminConfirmed: true,
        phase: "confirm",
        overrideReason: input.overrideReason ?? null,
      });
      if (!gate.allowed) throw new Error(`graph_merge_candidate_${gate.reason}`);
      return "merged";
    }
    case "revert_productive_merge":
      return "merge_ready";
    case "return_to_clarification":
      return "blocked";
    case "reject":
    case "archive":
      return "blocked";
    default:
      return input.current;
  }
}

export async function applyGraphMergeCandidateAction(input: {
  candidateId: string;
  action: GraphMergeCandidateAction;
  requestedByUserId: string;
  note?: string | null;
}) {
  const repo = getRepo();
  const existing = await repo.getById(input.candidateId);
  if (!existing) throw new Error("graph_merge_candidate_not_found");

  const note = normalizeOptionalString(input.note);
  const actionRule = resolveActionRule(existing.reviewStatus, input.action);
  if (!actionRule) {
    throw new Error("graph_merge_candidate_invalid_transition");
  }
  if (actionRule.noteRequired && !note) {
    throw new Error("graph_merge_candidate_note_required");
  }

  const at = new Date().toISOString();
  const nextReviewStatus = actionRule.nextReviewStatus;
  const nextMergeStatus = nextMergeStatusForAction({
    reviewStatus: existing.reviewStatus,
    current: existing.mergeStatus,
    action: input.action,
    truthStatus: existing.truthStatus,
    sourceSupport: existing.sourceSupport,
    duplicateCandidates: existing.duplicateCandidates ?? [],
    reviewRecommended: existing.reviewRecommended,
    overrideReason: note,
  });
  const historyEntry: GraphMergeCandidateHistoryEntry = {
    id: candidateHistoryId({ candidateId: input.candidateId, action: input.action, at }),
    action: input.action,
    byUserId: input.requestedByUserId,
    at,
    note,
    previousReviewStatus: existing.reviewStatus,
    nextReviewStatus,
    previousMergeStatus: existing.mergeStatus,
    nextMergeStatus,
  };

  const gate =
    input.action === "prepare_productive_merge"
      ? graphMergeGate({
          candidate: existing,
          isAdminConfirmed: true,
          phase: "prepare",
        })
      : input.action === "confirm_productive_merge"
        ? graphMergeGate({
            candidate: existing,
            isAdminConfirmed: true,
            phase: "confirm",
            overrideReason: note,
          })
        : null;

  const nextDuplicateCandidates =
    input.action === "resolve_duplicate" ? [] : existing.duplicateCandidates ?? [];
  const saved = await repo.update({
    ...existing,
    reviewStatus: nextReviewStatus,
    mergeStatus: nextMergeStatus,
    statusNote: note ?? existing.statusNote ?? null,
    duplicateCandidates: nextDuplicateCandidates,
    latestAction: input.action,
    latestActionAt: at,
    latestActionByUserId: input.requestedByUserId,
    productiveMergeConfirmedAt:
      input.action === "confirm_productive_merge"
        ? at
        : input.action === "revert_productive_merge"
          ? null
          : existing.productiveMergeConfirmedAt ?? null,
    productiveMergeConfirmedByUserId:
      input.action === "confirm_productive_merge"
        ? input.requestedByUserId
        : input.action === "revert_productive_merge"
          ? null
          : existing.productiveMergeConfirmedByUserId ?? null,
    productiveMergeOverrideReason:
      input.action === "confirm_productive_merge" && note
        ? note
        : input.action === "revert_productive_merge"
          ? null
          : existing.productiveMergeOverrideReason ?? null,
    history: [...(existing.history ?? []), historyEntry],
    updatedAt: new Date(at),
  });

  const auditEntries: GraphMergeAuditEntry[] = [];
  const previousState = candidateStateSnapshot(existing);
  const nextState = candidateStateSnapshot(saved);

  if (input.action === "resolve_duplicate") {
    auditEntries.push({
      id: auditEntryId({
        candidateId: input.candidateId,
        action: "duplicate_resolved",
        at,
        reason: "merge_ready",
      }),
      candidateId: input.candidateId,
      sourceType: existing.sourceType,
      sourceId: existing.sourceId,
      mergedBy: input.requestedByUserId,
      mergedAt: at,
      action: "duplicate_resolved",
      reason: "merge_ready",
      overrideReason: note ?? null,
      previousState,
      nextState,
      truthStatus: existing.truthStatus,
      sourceSupport: existing.sourceSupport,
      verificationLabel: existing.verificationLabel,
      noAutoPublish: true,
    });
  }

  if (input.action === "confirm_productive_merge" && existing.reviewRecommended && note) {
    auditEntries.push({
      id: auditEntryId({
        candidateId: input.candidateId,
        action: "override_confirmed",
        at,
        reason: "override_required",
      }),
      candidateId: input.candidateId,
      sourceType: existing.sourceType,
      sourceId: existing.sourceId,
      mergedBy: input.requestedByUserId,
      mergedAt: at,
      action: "override_confirmed",
      reason: "override_required",
      overrideReason: note,
      previousState,
      nextState,
      truthStatus: existing.truthStatus,
      sourceSupport: existing.sourceSupport,
      verificationLabel: existing.verificationLabel,
      noAutoPublish: true,
    });
  }

  if (input.action === "confirm_productive_merge") {
    auditEntries.push({
      id: auditEntryId({
        candidateId: input.candidateId,
        action: "merge_confirmed",
        at,
        reason: gate?.reason ?? "merge_ready",
      }),
      candidateId: input.candidateId,
      sourceType: existing.sourceType,
      sourceId: existing.sourceId,
      mergedBy: input.requestedByUserId,
      mergedAt: at,
      action: "merge_confirmed",
      reason: gate?.reason ?? "merge_ready",
      overrideReason: note ?? null,
      previousState,
      nextState,
      truthStatus: existing.truthStatus,
      sourceSupport: existing.sourceSupport,
      verificationLabel: existing.verificationLabel,
      noAutoPublish: true,
    });
  }

  if (input.action === "revert_productive_merge") {
    auditEntries.push({
      id: auditEntryId({
        candidateId: input.candidateId,
        action: "merge_reverted",
        at,
        reason: "merge_ready",
      }),
      candidateId: input.candidateId,
      sourceType: existing.sourceType,
      sourceId: existing.sourceId,
      mergedBy: input.requestedByUserId,
      mergedAt: at,
      action: "merge_reverted",
      reason: "merge_ready",
      overrideReason: note ?? null,
      previousState,
      nextState,
      truthStatus: existing.truthStatus,
      sourceSupport: existing.sourceSupport,
      verificationLabel: existing.verificationLabel,
      noAutoPublish: true,
    });
  }

  for (const auditEntry of auditEntries) {
    await repo.insertAudit(auditEntry);
  }

  return {
    candidate: toCandidate(saved),
    historyEntry,
    auditEntries,
  };
}

export async function listGraphMergeAuditEntries(params?: {
  candidateId?: string | null;
  limit?: number;
}) {
  return getRepo().listAudits(params);
}

export async function prepareProductiveGraphMerge(input: {
  candidateId: string;
  requestedByUserId: string;
  note?: string | null;
}) {
  return applyGraphMergeCandidateAction({
    candidateId: input.candidateId,
    action: "prepare_productive_merge",
    requestedByUserId: input.requestedByUserId,
    note: input.note ?? null,
  });
}

export async function confirmProductiveGraphMerge(
  candidateId: string,
  adminContext: { userId: string; isAdmin: boolean },
  options?: { overrideReason?: string | null },
) {
  const repo = getRepo();
  const existing = await repo.getById(candidateId);
  if (!existing) throw new Error("graph_merge_candidate_not_found");
  const gate = graphMergeGate({
    candidate: existing,
    isAdminConfirmed: adminContext.isAdmin,
    phase: "confirm",
    overrideReason: options?.overrideReason ?? null,
  });

  if (!gate.allowed) {
    const at = new Date().toISOString();
    const auditEntry: GraphMergeAuditEntry = {
      id: auditEntryId({
        candidateId,
        action: "merge_blocked",
        at,
        reason: gate.reason,
      }),
      candidateId,
      sourceType: existing.sourceType,
      sourceId: existing.sourceId,
      mergedBy: adminContext.userId,
      mergedAt: at,
      action: "merge_blocked",
      reason: gate.reason,
      overrideReason: normalizeOptionalString(options?.overrideReason) ?? null,
      previousState: candidateStateSnapshot(existing),
      nextState: candidateStateSnapshot(existing),
      truthStatus: existing.truthStatus,
      sourceSupport: existing.sourceSupport,
      verificationLabel: existing.verificationLabel,
      noAutoPublish: true,
    };
    await repo.insertAudit(auditEntry);
    throw new Error(`graph_merge_candidate_${gate.reason}`);
  }

  return applyGraphMergeCandidateAction({
    candidateId,
    action: "confirm_productive_merge",
    requestedByUserId: adminContext.userId,
    note: options?.overrideReason ?? null,
  });
}

export async function revertProductiveGraphMerge(
  candidateId: string,
  adminContext: { userId: string; isAdmin: boolean },
  options?: { note?: string | null },
) {
  if (!adminContext.isAdmin) {
    throw new Error("graph_merge_candidate_blocked_missing_admin");
  }
  return applyGraphMergeCandidateAction({
    candidateId,
    action: "revert_productive_merge",
    requestedByUserId: adminContext.userId,
    note: options?.note ?? null,
  });
}

export function getGraphMergeCandidateReviewStatusLabel(status: GraphMergeCandidateReviewStatus) {
  switch (status) {
    case "draft_candidate":
      return "Graph-Kandidat vorbereitet";
    case "needs_review":
      return "Duplikatprüfung läuft";
    case "accepted_for_staging":
      return "Für Staging vorgemerkt";
    case "staged":
      return "Für Zusammenführung vorbereitet";
    case "merged":
      return "Zusammenführung bestätigt";
    case "rejected":
      return "Abgelehnt";
    case "archived":
      return "Archiviert";
    default:
      return status;
  }
}

export function getGraphMergeCandidateMergeStatusLabel(status: GraphMergeCandidateMergeStatus) {
  switch (status) {
    case "duplicate_suspected":
      return "Möglicherweise bereits vorhanden";
    case "merge_ready":
      return "Produktiver Merge nach Prüfung möglich";
    case "staged":
      return "Für Zusammenführung vorbereitet";
    case "merged":
      return "Zusammenführung bestätigt";
    case "blocked":
      return "Geblockt";
    case "not_started":
    default:
      return "Noch nicht zusammengeführt";
  }
}

export function getProductiveGraphMergeGateReasonLabel(reason: ProductiveGraphMergeGateReason) {
  switch (reason) {
    case "merge_ready":
      return "Produktiver Merge kann explizit bestätigt werden";
    case "blocked_source_open":
      return "Quellenlage offen";
    case "blocked_review_required":
      return "Redaktionelle Prüfung offen";
    case "blocked_duplicate_unresolved":
      return "Duplikatprüfung offen";
    case "blocked_missing_admin":
      return "Admin-Bestätigung fehlt";
    case "blocked_truth_guard":
      return "Truth-Guard blockiert";
    case "override_required":
      return "Override-Begründung erforderlich";
    default:
      return reason;
  }
}

export function getGraphMergeCandidateKindLabel(kind: GraphMergeCandidateKind) {
  switch (kind) {
    case "claim":
      return "Claim";
    case "theme":
      return "Thema";
    case "dossier":
      return "Dossier";
    case "round":
      return "Runde";
    case "source":
      return "Quelle";
    case "open_question":
      return "Offene Frage";
    default:
      return kind;
  }
}
