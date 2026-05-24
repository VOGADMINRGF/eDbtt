import {
  coreCol,
  shouldUseInMemoryMongoFallback,
  type ObjectId,
} from "@core/db/triMongo";
import type { StatementRecord } from "@features/analyze/schemas";
import type { FactVerdict } from "./types";
import type { SerpResultLite } from "@features/ai/providers/ari_search";
import type {
  ResearchUsed,
  VerificationMode,
} from "@features/ai/e150/verificationContract";
import type {
  E150ConfidenceMeta,
  E150DisagreementMeta,
} from "@features/ai/e150/disagreementConfidence";

export const FACTCHECK_STATUSES = [
  "draft",
  "requested",
  "queued",
  "provider_review_required",
  "running",
  "needs_source",
  "completed",
  "rejected",
  "seal_review_required",
  "sealed",
  "not_seal_eligible",
  "archived",
] as const;

export type FactcheckStatus = (typeof FACTCHECK_STATUSES)[number];
export type FactcheckJobStatus = FactcheckStatus;

export const FACTCHECK_VERIFICATION_MODES = [
  "none",
  "intake_only",
  "manual_review",
  "provider_assisted",
  "operator_verified",
  "sealed",
] as const;

export type FactcheckVerificationMode =
  (typeof FACTCHECK_VERIFICATION_MODES)[number];

export const FACTCHECK_RESEARCH_MODES = [
  "none",
  "light_metadata",
  "manual_review",
  "provider_assisted",
  "deep_research_requested",
  "deep_research_approved",
] as const;

export type FactcheckResearchMode = (typeof FACTCHECK_RESEARCH_MODES)[number];

export const FACTCHECK_SEAL_ELIGIBILITY = [
  "unknown",
  "eligible",
  "needs_review",
  "not_eligible",
] as const;

export type FactcheckSealEligibility =
  (typeof FACTCHECK_SEAL_ELIGIBILITY)[number];

export const FACTCHECK_SEAL_DECISIONS = [
  "none",
  "requested",
  "granted",
  "revoked",
] as const;

export type FactcheckSealDecision = (typeof FACTCHECK_SEAL_DECISIONS)[number];

export const FACTCHECK_AUDIT_EVENT_TYPES = [
  "request",
  "queue",
  "approve-provider",
  "complete",
  "reject",
  "request-seal",
  "grant-seal",
  "revoke-seal",
  "archive",
] as const;

export type FactcheckAuditEventType =
  (typeof FACTCHECK_AUDIT_EVENT_TYPES)[number];

export type FactcheckSourceRef = {
  id: string;
  label: string;
  url: string | null;
  sourceType: "link" | "document_url" | "youtube_video_url" | "source_snapshot_reference" | "manual_reference";
};

export type FactcheckAuditEvent = {
  id: string;
  eventType: FactcheckAuditEventType;
  actorId: string;
  actorLabel: string;
  actorMode: "user" | "organization" | "operator" | "system";
  note: string | null;
  createdAt: string;
};

export type FactcheckAccessContext = {
  scope: "requester_only" | "organization" | "operator";
  productionAccess: "allowed" | "limited" | "blocked";
  reason:
    | "none"
    | "membership_pending"
    | "membership_blocked"
    | "contract_pending"
    | "contract_blocked"
    | "entitlement_missing";
};

export type FactcheckJobDoc = {
  _id?: ObjectId;
  jobId: string;
  draftId?: string | null;
  contributionId?: string | null;
  dossierId?: string | null;
  handoffId?: string | null;
  organizationId?: string | null;
  regionId?: string | null;
  requestedByUserId?: string | null;
  requestedByRole?: string | null;
  requestedInOperatorMode?: boolean;
  sourceOfTruth?: string | null;
  confidence?: string | null;
  accessContext?: FactcheckAccessContext | null;
  language: string;
  inputText: string;
  status: FactcheckStatus;
  verdict: FactVerdict;
  confidenceScore: number;
  claims: StatementRecord[];
  sourceRefs: FactcheckSourceRef[];
  materialRefs: string[];
  serpResults?: SerpResultLite[];
  factcheckVerificationMode: FactcheckVerificationMode;
  factcheckResearchMode: FactcheckResearchMode;
  factcheckSealEligibility: FactcheckSealEligibility;
  factcheckSealDecision: FactcheckSealDecision;
  publicSealVisible: boolean;
  limitations: string[];
  verificationMode?: VerificationMode;
  researchUsed?: ResearchUsed;
  sealEligible?: boolean;
  sealGranted?: boolean;
  sealedAt?: Date | null;
  fallbackUsed?: boolean;
  disagreement?: E150DisagreementMeta | null;
  orchestrationConfidence?: E150ConfidenceMeta | null;
  auditEvents: FactcheckAuditEvent[];
  error?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  finishedAt?: Date | null;
};

export type FactcheckWorkflowRepo = {
  save(record: FactcheckJobDoc): Promise<void>;
  get(jobId: string): Promise<FactcheckJobDoc | null>;
  list(): Promise<FactcheckJobDoc[]>;
  listByContributionId(contributionId: string): Promise<FactcheckJobDoc[]>;
};

const JOBS_COLLECTION = "factcheck_jobs";

let ensured = false;
let repoSingleton: FactcheckWorkflowRepo | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function ensureIndexes() {
  if (ensured) return;
  const col = await coreCol<FactcheckJobDoc>(JOBS_COLLECTION);
  await Promise.all([
    col.createIndex({ jobId: 1 }, { unique: true }),
    col.createIndex({ createdAt: -1 }),
    col.createIndex({ contributionId: 1, createdAt: -1 }),
    col.createIndex({ organizationId: 1, createdAt: -1 }),
    col.createIndex({ requestedByUserId: 1, createdAt: -1 }),
  ]);
  ensured = true;
}

export async function factcheckJobsCol() {
  await ensureIndexes();
  return coreCol<FactcheckJobDoc>(JOBS_COLLECTION);
}

function createMongoRepo(): FactcheckWorkflowRepo {
  return {
    async save(record) {
      const col = await factcheckJobsCol();
      await col.updateOne(
        { jobId: record.jobId },
        { $set: clone(record) as any },
        { upsert: true },
      );
    },
    async get(jobId) {
      const col = await factcheckJobsCol();
      const doc = await col.findOne({ jobId });
      return doc ? clone(doc) : null;
    },
    async list() {
      const col = await factcheckJobsCol();
      const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
      return docs.map((doc) => clone(doc));
    },
    async listByContributionId(contributionId) {
      const col = await factcheckJobsCol();
      const docs = await col
        .find({ contributionId })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((doc) => clone(doc));
    },
  };
}

export function createInMemoryFactcheckWorkflowRepo(seed?: {
  records?: FactcheckJobDoc[];
}): FactcheckWorkflowRepo {
  const records = new Map<string, FactcheckJobDoc>();
  for (const record of seed?.records ?? []) {
    records.set(record.jobId, clone(record));
  }
  return {
    async save(record) {
      records.set(record.jobId, clone(record));
    },
    async get(jobId) {
      return records.has(jobId) ? clone(records.get(jobId) as FactcheckJobDoc) : null;
    },
    async list() {
      return Array.from(records.values())
        .map((record) => clone(record))
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    },
    async listByContributionId(contributionId) {
      return Array.from(records.values())
        .filter((record) => record.contributionId === contributionId)
        .map((record) => clone(record))
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    },
  };
}

export function getFactcheckWorkflowRepo(): FactcheckWorkflowRepo {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryFactcheckWorkflowRepo()
    : createMongoRepo();
  return repoSingleton;
}

export function setFactcheckWorkflowRepoForTests(repo: FactcheckWorkflowRepo | null) {
  repoSingleton = repo;
  ensured = false;
}
