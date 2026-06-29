import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import {
  createCommunitySourceReviewContributionDraft,
  getCommunitySourceReviewContributionBlockers,
  type CommunitySourceReviewContribution,
  type CommunitySourceReviewContributionBlocker,
} from "@/features/create/communitySourceReviewContribution";
import {
  getCommunitySourceReviewModerationBlockers,
  type CommunitySourceReviewModerationBlocker,
  type CommunitySourceReviewModerationInput,
} from "@/features/create/communitySourceReviewModeration";

export const COMMUNITY_SOURCE_REVIEW_DECISION_STATUSES = [
  "pending_review",
  "allowed_as_hint",
  "hidden",
  "rejected",
  "escalated",
] as const;

export type CommunitySourceReviewDecisionStatus =
  (typeof COMMUNITY_SOURCE_REVIEW_DECISION_STATUSES)[number];

export const COMMUNITY_SOURCE_REVIEW_ROUTE_TARGETS = [
  "none",
  "source_review",
  "editorial_review",
] as const;

export type CommunitySourceReviewRouteTarget =
  (typeof COMMUNITY_SOURCE_REVIEW_ROUTE_TARGETS)[number];

export const COMMUNITY_SOURCE_REVIEW_ADMIN_BLOCKERS = [
  "hidden_hint",
  "rejected_hint",
] as const;

export type CommunitySourceReviewAdminBlocker =
  (typeof COMMUNITY_SOURCE_REVIEW_ADMIN_BLOCKERS)[number];

export type CommunitySourceReviewHintBlocker =
  | Exclude<
      CommunitySourceReviewContributionBlocker,
      "missing_runtime_contract"
    >
  | CommunitySourceReviewModerationBlocker
  | CommunitySourceReviewAdminBlocker;

export type CommunitySourceReviewAuditEntry = {
  id: string;
  contributionId: string;
  action:
    | "draft_saved"
    | "hint_allowed"
    | "hint_hidden"
    | "hint_rejected"
    | "hint_escalated"
    | "source_review_requested"
    | "editorial_review_requested";
  actorUserId: string | null;
  reason: string | null;
  decisionStatus: CommunitySourceReviewDecisionStatus;
  routeTarget: CommunitySourceReviewRouteTarget;
  blockers: CommunitySourceReviewHintBlocker[];
  at: string;
};

export type CommunitySourceReviewPersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  label: string;
  summary: string;
  repositoryInterface: "CommunitySourceReviewRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
};

export type CommunitySourceReviewRecord = {
  id: string;
  contribution: CommunitySourceReviewContribution;
  decisionStatus: CommunitySourceReviewDecisionStatus;
  routeTarget: CommunitySourceReviewRouteTarget;
  latestDecisionNote: string | null;
  latestActorUserId: string | null;
  latestDecisionAt: string | null;
  blockers: CommunitySourceReviewHintBlocker[];
  createdAt: string;
  updatedAt: string;
};

type CommunitySourceReviewRepository = {
  upsertRecord(record: CommunitySourceReviewRecord): Promise<CommunitySourceReviewRecord>;
  getRecordById(id: string): Promise<CommunitySourceReviewRecord | null>;
  listRecords(limit?: number): Promise<CommunitySourceReviewRecord[]>;
  insertAudit(entry: CommunitySourceReviewAuditEntry): Promise<CommunitySourceReviewAuditEntry>;
  listAudits(params?: {
    contributionId?: string | null;
    limit?: number;
  }): Promise<CommunitySourceReviewAuditEntry[]>;
  getPersistenceState(): CommunitySourceReviewPersistenceState;
};

const COMMUNITY_SOURCE_REVIEW_RECORD_COLLECTION =
  "community_source_review_records";
const COMMUNITY_SOURCE_REVIEW_AUDIT_COLLECTION =
  "community_source_review_audits";

let repoSingleton: CommunitySourceReviewRepository | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function unique<T extends string>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function buildPersistenceState(
  mode: CommunitySourceReviewPersistenceState["mode"],
): CommunitySourceReviewPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Community-Source-Review-Store"
      : "In-Memory-Fallback für Community-Source-Review",
    summary: persistent
      ? "Community-Hinweise, Moderationsentscheidungen und Audit-Spuren liegen dauerhaft für die bestehende Admin-Review-Workbench vor. Weder Community-Mehrheit noch Trust-Level noch vorgeschlagene Quellen erzeugen Wahrheit, Verifikation, Graph-Write, Merge, Publish oder Entitätserstellung."
      : "Nur Dev-/Test-Fallback: Community-Hinweise und Moderationsentscheidungen leben pro Runtime und dürfen nicht als produktive Intake- oder Moderationswahrheit ausgegeben werden.",
    repositoryInterface: "CommunitySourceReviewRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
  };
}

function buildAuditId(input: {
  contributionId: string;
  action: CommunitySourceReviewAuditEntry["action"];
  at: string;
}) {
  return `community-source-review-audit-${stableHash(
    `${input.contributionId}:${input.action}:${input.at}`,
  ).slice(0, 24)}`;
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryCommunitySourceReviewRepository()
    : createMongoCommunitySourceReviewRepository();
  return repoSingleton;
}

export function setCommunitySourceReviewRepositoryForTests(
  repo: CommunitySourceReviewRepository | null,
) {
  repoSingleton = repo;
}

export function createInMemoryCommunitySourceReviewRepository(): CommunitySourceReviewRepository {
  const records = new Map<string, CommunitySourceReviewRecord>();
  const audits = new Map<string, CommunitySourceReviewAuditEntry>();

  return {
    async upsertRecord(record) {
      records.set(record.id, clone(record));
      return clone(record);
    },
    async getRecordById(id) {
      const record = records.get(id);
      return record ? clone(record) : null;
    },
    async listRecords(limit) {
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
          if (params?.contributionId && entry.contributionId !== params.contributionId) {
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

function createMongoCommunitySourceReviewRepository(): CommunitySourceReviewRepository {
  return {
    async upsertRecord(record) {
      const col = await coreCol<CommunitySourceReviewRecord>(
        COMMUNITY_SOURCE_REVIEW_RECORD_COLLECTION,
      );
      await col.updateOne({ id: record.id } as any, { $set: clone(record) as any }, { upsert: true });
      return clone(record);
    },
    async getRecordById(id) {
      const col = await coreCol<CommunitySourceReviewRecord>(
        COMMUNITY_SOURCE_REVIEW_RECORD_COLLECTION,
      );
      const record = await col.findOne({ id } as any);
      return record ? clone(record) : null;
    },
    async listRecords(limit) {
      const col = await coreCol<CommunitySourceReviewRecord>(
        COMMUNITY_SOURCE_REVIEW_RECORD_COLLECTION,
      );
      const cursor = col.find({} as any).sort({ updatedAt: -1 });
      if (typeof limit === "number") cursor.limit(limit);
      const items = await cursor.toArray();
      return items.map(clone);
    },
    async insertAudit(entry) {
      const col = await coreCol<CommunitySourceReviewAuditEntry>(
        COMMUNITY_SOURCE_REVIEW_AUDIT_COLLECTION,
      );
      await col.updateOne({ id: entry.id } as any, { $set: clone(entry) as any }, { upsert: true });
      return clone(entry);
    },
    async listAudits(params) {
      const col = await coreCol<CommunitySourceReviewAuditEntry>(
        COMMUNITY_SOURCE_REVIEW_AUDIT_COLLECTION,
      );
      const filter: Record<string, unknown> = {};
      if (params?.contributionId) filter.contributionId = params.contributionId;
      const cursor = col.find(filter as any).sort({ at: -1 });
      if (typeof params?.limit === "number") cursor.limit(params.limit);
      const items = await cursor.toArray();
      return items.map(clone);
    },
    getPersistenceState() {
      return buildPersistenceState("persistent_primary");
    },
  };
}

function mapDecisionStatusFromContribution(
  contribution: CommunitySourceReviewContribution,
): CommunitySourceReviewDecisionStatus {
  if (
    contribution.status === "accepted_as_hint" ||
    contribution.moderation.moderationStatus === "allowed_as_hint"
  ) {
    return "allowed_as_hint";
  }
  if (contribution.status === "rejected") return "rejected";
  if (contribution.moderation.moderationStatus === "hidden_pending_review") {
    return "hidden";
  }
  if (contribution.moderation.moderationStatus === "escalated_to_editorial") {
    return "escalated";
  }
  if (contribution.moderation.moderationStatus === "rejected_abuse") {
    return "rejected";
  }
  return "pending_review";
}

function getAdminBlockers(
  record: Pick<CommunitySourceReviewRecord, "contribution" | "decisionStatus">,
): CommunitySourceReviewHintBlocker[] {
  const blockers = [
    ...getCommunitySourceReviewContributionBlockers(record.contribution, {
      runtimeAvailable: true,
    }).filter((blocker) => blocker !== "missing_runtime_contract"),
    ...getCommunitySourceReviewModerationBlockers(record.contribution.moderation),
  ] as CommunitySourceReviewHintBlocker[];

  if (record.decisionStatus === "hidden") blockers.push("hidden_hint");
  if (record.decisionStatus === "rejected") blockers.push("rejected_hint");

  return unique(blockers);
}

function rebuildContribution(
  contribution: CommunitySourceReviewContribution,
  input: {
    status?: CommunitySourceReviewContribution["status"];
    moderationStatus?: CommunitySourceReviewModerationInput["moderationStatus"];
    updatedAt: string;
  },
) {
  return createCommunitySourceReviewContributionDraft({
    id: contribution.id,
    kind: contribution.kind,
    status: input.status ?? contribution.status,
    target: contribution.target,
    targetId: contribution.targetId,
    title: contribution.title,
    text: contribution.text,
    language: contribution.language,
    claimText: contribution.claimText,
    sourceRefs: contribution.sourceRefs,
    materialRefs: contribution.materialRefs,
    notes: contribution.notes,
    relatedContributionCount: contribution.relatedContributionCount,
    moderationFlags: contribution.moderationFlags,
    moderation: {
      moderationStatus:
        input.moderationStatus ?? contribution.moderation.moderationStatus,
      trustLevel: contribution.moderation.trustLevel,
      riskLevel: contribution.moderation.riskLevel,
      abuseReasons: contribution.moderation.abuseReasons,
    },
    createdAt: contribution.createdAt,
    updatedAt: input.updatedAt,
    submittedAt: contribution.submittedAt,
  });
}

function buildRecord(
  contribution: CommunitySourceReviewContribution,
  overrides?: Partial<
    Pick<
      CommunitySourceReviewRecord,
      | "decisionStatus"
      | "routeTarget"
      | "latestDecisionNote"
      | "latestActorUserId"
      | "latestDecisionAt"
      | "updatedAt"
    >
  >,
): CommunitySourceReviewRecord {
  const updatedAt = overrides?.updatedAt ?? contribution.updatedAt;
  const record: CommunitySourceReviewRecord = {
    id: contribution.id,
    contribution,
    decisionStatus:
      overrides?.decisionStatus ?? mapDecisionStatusFromContribution(contribution),
    routeTarget: overrides?.routeTarget ?? "none",
    latestDecisionNote: overrides?.latestDecisionNote ?? null,
    latestActorUserId: overrides?.latestActorUserId ?? null,
    latestDecisionAt: overrides?.latestDecisionAt ?? null,
    blockers: [],
    createdAt: contribution.createdAt,
    updatedAt,
  };
  return {
    ...record,
    blockers: getAdminBlockers(record),
  };
}

async function recordAudit(
  entry: Omit<CommunitySourceReviewAuditEntry, "id">,
) {
  const auditEntry: CommunitySourceReviewAuditEntry = {
    ...entry,
    id: buildAuditId({
      contributionId: entry.contributionId,
      action: entry.action,
      at: entry.at,
    }),
  };
  return getRepo().insertAudit(auditEntry);
}

export function getCommunitySourceReviewPersistenceState() {
  return getRepo().getPersistenceState();
}

export function communitySourceReviewSubmissionRuntimeStatus() {
  return "blocked_unwired" as const;
}

export function getCommunitySourceReviewDecisionStatusLabel(
  status: CommunitySourceReviewDecisionStatus,
): string {
  if (status === "pending_review") return "wartet auf Moderation";
  if (status === "allowed_as_hint") return "als Hinweis erlaubt";
  if (status === "hidden") return "ausgeblendet";
  if (status === "rejected") return "zurückgewiesen";
  return "eskaliert";
}

export function getCommunitySourceReviewRouteTargetLabel(
  target: CommunitySourceReviewRouteTarget,
): string {
  if (target === "none") return "noch kein Folgepfad";
  if (target === "source_review") return "Quellenprüfung";
  return "redaktionelle Prüfung";
}

export function getCommunitySourceReviewHintBlockerLabel(
  blocker: CommunitySourceReviewHintBlocker,
): string {
  if (blocker === "hidden_hint") {
    return "Hinweis ist ausgeblendet und zählt nicht als Review-Hinweis oder Evidenz.";
  }
  if (blocker === "rejected_hint") {
    return "Hinweis ist zurückgewiesen und darf nicht als Review-Hinweis oder Evidenz genutzt werden.";
  }
  return blocker;
}

export async function persistCommunitySourceReviewContributionDraft(
  contribution: CommunitySourceReviewContribution,
) {
  const record = buildRecord(contribution);
  await getRepo().upsertRecord(record);
  await recordAudit({
    contributionId: record.id,
    action: "draft_saved",
    actorUserId: null,
    reason: null,
    decisionStatus: record.decisionStatus,
    routeTarget: record.routeTarget,
    blockers: record.blockers,
    at: record.updatedAt,
  });
  return record;
}

export async function listCommunitySourceReviewRecords(limit?: number) {
  return getRepo().listRecords(limit);
}

export async function getCommunitySourceReviewRecord(contributionId: string) {
  const normalized = String(contributionId ?? "").trim();
  if (!normalized) return null;
  return getRepo().getRecordById(normalized);
}

export async function listCommunitySourceReviewAudits(params?: {
  contributionId?: string | null;
  limit?: number;
}) {
  return getRepo().listAudits(params);
}

async function updateRecordWithDecision(input: {
  contributionId: string;
  actorUserId: string;
  reason: string;
  action: CommunitySourceReviewAuditEntry["action"];
  decisionStatus?: CommunitySourceReviewDecisionStatus;
  routeTarget?: CommunitySourceReviewRouteTarget;
  status?: CommunitySourceReviewContribution["status"];
  moderationStatus?: CommunitySourceReviewModerationInput["moderationStatus"];
  blockedDecisionStatuses?: CommunitySourceReviewDecisionStatus[];
}) {
  const existing = await getCommunitySourceReviewRecord(input.contributionId);
  if (!existing) {
    throw new Error("community_source_review_not_found");
  }
  if (input.blockedDecisionStatuses?.includes(existing.decisionStatus)) {
    throw new Error("community_source_review_decision_blocked");
  }

  const updatedAt = nowIso();
  const contribution = rebuildContribution(existing.contribution, {
    status: input.status,
    moderationStatus: input.moderationStatus,
    updatedAt,
  });
  const record = buildRecord(contribution, {
    decisionStatus: input.decisionStatus ?? existing.decisionStatus,
    routeTarget: input.routeTarget ?? existing.routeTarget,
    latestDecisionNote: input.reason,
    latestActorUserId: input.actorUserId,
    latestDecisionAt: updatedAt,
    updatedAt,
  });

  await getRepo().upsertRecord(record);
  await recordAudit({
    contributionId: record.id,
    action: input.action,
    actorUserId: input.actorUserId,
    reason: input.reason,
    decisionStatus: record.decisionStatus,
    routeTarget: record.routeTarget,
    blockers: record.blockers,
    at: updatedAt,
  });

  return record;
}

export async function allowCommunitySourceReviewHint(input: {
  contributionId: string;
  actorUserId: string;
  reason: string;
}) {
  return updateRecordWithDecision({
    contributionId: input.contributionId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: "hint_allowed",
    decisionStatus: "allowed_as_hint",
    status: "accepted_as_hint",
    moderationStatus: "allowed_as_hint",
  });
}

export async function hideCommunitySourceReviewHint(input: {
  contributionId: string;
  actorUserId: string;
  reason: string;
}) {
  return updateRecordWithDecision({
    contributionId: input.contributionId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: "hint_hidden",
    decisionStatus: "hidden",
    status: "needs_moderation",
    moderationStatus: "hidden_pending_review",
    routeTarget: "none",
  });
}

export async function rejectCommunitySourceReviewHint(input: {
  contributionId: string;
  actorUserId: string;
  reason: string;
}) {
  return updateRecordWithDecision({
    contributionId: input.contributionId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: "hint_rejected",
    decisionStatus: "rejected",
    status: "rejected",
    routeTarget: "none",
  });
}

export async function escalateCommunitySourceReviewHint(input: {
  contributionId: string;
  actorUserId: string;
  reason: string;
}) {
  return updateRecordWithDecision({
    contributionId: input.contributionId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: "hint_escalated",
    decisionStatus: "escalated",
    status: "needs_moderation",
    moderationStatus: "escalated_to_editorial",
  });
}

export async function markCommunitySourceReviewHintNeedsSourceReview(input: {
  contributionId: string;
  actorUserId: string;
  reason: string;
}) {
  return updateRecordWithDecision({
    contributionId: input.contributionId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: "source_review_requested",
    routeTarget: "source_review",
    blockedDecisionStatuses: ["hidden", "rejected"],
  });
}

export async function markCommunitySourceReviewHintNeedsEditorialReview(input: {
  contributionId: string;
  actorUserId: string;
  reason: string;
}) {
  return updateRecordWithDecision({
    contributionId: input.contributionId,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: "editorial_review_requested",
    routeTarget: "editorial_review",
    blockedDecisionStatuses: ["hidden", "rejected"],
  });
}
