import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { getGraphDriver } from "@core/graph/driver";
import { stableHash } from "@core/utils/hash";
import {
  getTopicGraphMutationBlockers,
  type TopicGraphEdge,
  type TopicGraphMutationBlocker,
  writeTopicGraphEdgeAfterReview,
} from "@/features/create/topicGraphRuntime";

export type TopicGraphMutationAuditEntry = {
  id: string;
  edgeId: string;
  action:
    | "draft_saved"
    | "graph_write_approved"
    | "graph_write_rejected"
    | "graph_write_blocked"
    | "graph_write_written";
  actorUserId: string | null;
  reason: string | null;
  blockers: TopicGraphMutationBlocker[];
  mutationStatus: TopicGraphEdge["mutationStatus"];
  at: string;
};

export type TopicGraphRuntimePersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  label: string;
  summary: string;
  repositoryInterface: "TopicGraphRuntimeRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
};

type TopicGraphRuntimeRepository = {
  upsertEdge(edge: TopicGraphEdge): Promise<TopicGraphEdge>;
  getEdgeById(id: string): Promise<TopicGraphEdge | null>;
  listEdges(limit?: number): Promise<TopicGraphEdge[]>;
  insertAudit(entry: TopicGraphMutationAuditEntry): Promise<TopicGraphMutationAuditEntry>;
  listAudits(params?: {
    edgeId?: string | null;
    limit?: number;
  }): Promise<TopicGraphMutationAuditEntry[]>;
  getPersistenceState(): TopicGraphRuntimePersistenceState;
};

const TOPIC_GRAPH_EDGE_COLLECTION = "topic_graph_edge_mutations";
const TOPIC_GRAPH_AUDIT_COLLECTION = "topic_graph_edge_mutation_audits";

let repoSingleton: TopicGraphRuntimeRepository | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function buildPersistenceState(
  mode: TopicGraphRuntimePersistenceState["mode"],
): TopicGraphRuntimePersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent
      ? "Persistenter Topic-Graph-Mutation-Store"
      : "In-Memory-Fallback für Topic-Graph-Mutationen",
    summary: persistent
      ? "Review-bestätigte Topic-Graph-Entwürfe und Audit-Spuren liegen dauerhaft vor. Auto-Graph, Auto-Merge, Auto-Publish und automatische Entitätserzeugung bleiben ausgeschlossen."
      : "Nur Dev-/Test-Fallback: Topic-Graph-Entwürfe und Audit-Spuren leben pro Runtime und dürfen nicht als produktiver Graph-Write-Beleg ausgegeben werden.",
    repositoryInterface: "TopicGraphRuntimeRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    restartReconstructable: persistent,
    deploymentReconstructable: persistent,
  };
}

function buildAuditId(input: {
  edgeId: string;
  action: TopicGraphMutationAuditEntry["action"];
  at: string;
}) {
  return `topic-graph-audit-${stableHash(
    `${input.edgeId}:${input.action}:${input.at}`,
  ).slice(0, 22)}`;
}

function getRepo() {
  if (repoSingleton) return repoSingleton;
  repoSingleton = shouldUseInMemoryMongoFallback()
    ? createInMemoryTopicGraphRuntimeRepository()
    : createMongoTopicGraphRuntimeRepository();
  return repoSingleton;
}

export function setTopicGraphRuntimeRepositoryForTests(
  repo: TopicGraphRuntimeRepository | null,
) {
  repoSingleton = repo;
}

export function createInMemoryTopicGraphRuntimeRepository(): TopicGraphRuntimeRepository {
  const edges = new Map<string, TopicGraphEdge>();
  const audits = new Map<string, TopicGraphMutationAuditEntry>();

  return {
    async upsertEdge(edge) {
      edges.set(edge.id, clone(edge));
      return clone(edge);
    },
    async getEdgeById(id) {
      const edge = edges.get(id);
      return edge ? clone(edge) : null;
    },
    async listEdges(limit) {
      const list = Array.from(edges.values()).sort((left, right) =>
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
          if (params?.edgeId && entry.edgeId !== params.edgeId) return false;
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

function createMongoTopicGraphRuntimeRepository(): TopicGraphRuntimeRepository {
  return {
    async upsertEdge(edge) {
      const col = await coreCol<TopicGraphEdge>(TOPIC_GRAPH_EDGE_COLLECTION);
      await col.updateOne({ id: edge.id } as any, { $set: clone(edge) as any }, { upsert: true });
      return clone(edge);
    },
    async getEdgeById(id) {
      const col = await coreCol<TopicGraphEdge>(TOPIC_GRAPH_EDGE_COLLECTION);
      const edge = await col.findOne({ id } as any);
      return edge ? clone(edge) : null;
    },
    async listEdges(limit) {
      const col = await coreCol<TopicGraphEdge>(TOPIC_GRAPH_EDGE_COLLECTION);
      const cursor = col.find({} as any).sort({ updatedAt: -1 });
      if (typeof limit === "number") cursor.limit(limit);
      const items = await cursor.toArray();
      return items.map(clone);
    },
    async insertAudit(entry) {
      const col = await coreCol<TopicGraphMutationAuditEntry>(
        TOPIC_GRAPH_AUDIT_COLLECTION,
      );
      await col.updateOne({ id: entry.id } as any, { $set: clone(entry) as any }, { upsert: true });
      return clone(entry);
    },
    async listAudits(params) {
      const col = await coreCol<TopicGraphMutationAuditEntry>(
        TOPIC_GRAPH_AUDIT_COLLECTION,
      );
      const filter: Record<string, unknown> = {};
      if (params?.edgeId) filter.edgeId = params.edgeId;
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

async function recordAudit(
  entry: Omit<TopicGraphMutationAuditEntry, "id">,
): Promise<TopicGraphMutationAuditEntry> {
  const auditEntry: TopicGraphMutationAuditEntry = {
    ...entry,
    id: buildAuditId({
      edgeId: entry.edgeId,
      action: entry.action,
      at: entry.at,
    }),
  };
  return getRepo().insertAudit(auditEntry);
}

async function writeTopicGraphRelationship(edge: TopicGraphEdge) {
  const driver = getGraphDriver();
  if (!driver) {
    return { ok: false, blocker: "graph_runtime_unavailable" as const };
  }

  const session = driver.session();
  try {
    const existence = await session.run(
      `
      OPTIONAL MATCH (source {id: $sourceId})
      OPTIONAL MATCH (target {id: $targetId})
      RETURN source IS NOT NULL AS hasSource, target IS NOT NULL AS hasTarget
      `,
      {
        sourceId: edge.source.id,
        targetId: edge.target.id,
      },
    );
    const record = existence.records[0];
    const hasSource = Boolean(record?.get("hasSource"));
    const hasTarget = Boolean(record?.get("hasTarget"));

    if (!hasSource) return { ok: false, blocker: "missing_source" as const };
    if (!hasTarget) return { ok: false, blocker: "missing_target" as const };

    await session.run(
      `
      MATCH (source {id: $sourceId}), (target {id: $targetId})
      MERGE (source)-[rel:TOPIC_GRAPH_EDGE {kind: $kind, sourceId: $sourceId, targetId: $targetId}]->(target)
      SET rel.edgeKind = $kind,
          rel.sourceNodeType = $sourceNodeType,
          rel.targetNodeType = $targetNodeType,
          rel.mutationStatus = $mutationStatus,
          rel.sourceCandidateId = $sourceCandidateId,
          rel.sourceReviewStatus = $sourceReviewStatus,
          rel.auditActorUserId = $actorUserId,
          rel.auditReason = $reason,
          rel.auditOrigin = $origin,
          rel.auditApprovedAt = $approvedAt,
          rel.noAutoMerge = true,
          rel.noAutoPublish = true,
          rel.noAutoDelete = true,
          rel.noAutoCreate = true,
          rel.updatedAt = datetime(),
          rel.createdAt = coalesce(rel.createdAt, datetime())
      `,
      {
        sourceId: edge.source.id,
        targetId: edge.target.id,
        kind: edge.kind,
        sourceNodeType: edge.source.nodeType,
        targetNodeType: edge.target.nodeType,
        mutationStatus: edge.mutationStatus,
        sourceCandidateId: edge.sourceCandidateId,
        sourceReviewStatus: edge.sourceReviewStatus,
        actorUserId: edge.auditContext.actorUserId,
        reason: edge.auditContext.reason,
        origin: edge.auditContext.origin,
        approvedAt: edge.auditContext.approvedAt,
      },
    );

    return {
      ok: true,
      writtenAt: new Date().toISOString(),
    } as const;
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message ?? "graph_write_failed",
    } as const;
  } finally {
    await session.close();
  }
}

export function getTopicGraphRuntimePersistenceState() {
  return getRepo().getPersistenceState();
}

export function topicGraphRuntimeAvailable() {
  return Boolean(getGraphDriver());
}

export async function persistTopicGraphEdgeDraft(
  edge: TopicGraphEdge,
): Promise<TopicGraphEdge> {
  const persisted = await getRepo().upsertEdge(edge);
  await recordAudit({
    edgeId: persisted.id,
    action: "draft_saved",
    actorUserId: persisted.auditContext.actorUserId,
    reason: persisted.auditContext.reason,
    blockers: persisted.blockers,
    mutationStatus: persisted.mutationStatus,
    at: persisted.updatedAt,
  });
  return persisted;
}

export async function listTopicGraphEdgeDrafts(limit?: number) {
  return getRepo().listEdges(limit);
}

export async function getTopicGraphEdgeDraft(edgeId: string) {
  const normalized = String(edgeId ?? "").trim();
  if (!normalized) return null;
  return getRepo().getEdgeById(normalized);
}

export async function listTopicGraphMutationAudits(params?: {
  edgeId?: string | null;
  limit?: number;
}) {
  return getRepo().listAudits(params);
}

export async function approveTopicGraphEdgeDraft(input: {
  edgeId: string;
  actorUserId: string;
  reason: string;
}) {
  const existing = await getTopicGraphEdgeDraft(input.edgeId);
  if (!existing) {
    throw new Error("topic_graph_edge_not_found");
  }

  const approvedAt = nowIso();
  const nextAuditContext = {
    actorUserId: input.actorUserId,
    reason: input.reason,
    origin: "admin_review" as const,
    approvedAt,
  };
  const nextEdge: TopicGraphEdge = {
    ...existing,
    approvedForGraphWrite: true,
    mutationStatus: "approved_for_graph_write",
    auditContext: nextAuditContext,
    blockers: getTopicGraphMutationBlockers(
      {
        ...existing,
        approvedForGraphWrite: true,
        mutationStatus: "approved_for_graph_write",
        auditContext: nextAuditContext,
      },
      {
        phase: "graph_write",
        graphRuntimeAvailable: topicGraphRuntimeAvailable(),
        auditContext: nextAuditContext,
      },
    ),
    updatedAt: approvedAt,
  };

  await getRepo().upsertEdge(nextEdge);
  await recordAudit({
    edgeId: nextEdge.id,
    action: "graph_write_approved",
    actorUserId: input.actorUserId,
    reason: input.reason,
    blockers: nextEdge.blockers,
    mutationStatus: nextEdge.mutationStatus,
    at: approvedAt,
  });

  return nextEdge;
}

export async function rejectTopicGraphEdgeDraft(input: {
  edgeId: string;
  actorUserId: string;
  reason: string;
}) {
  const existing = await getTopicGraphEdgeDraft(input.edgeId);
  if (!existing) {
    throw new Error("topic_graph_edge_not_found");
  }

  const updatedAt = nowIso();
  const nextEdge: TopicGraphEdge = {
    ...existing,
    approvedForGraphWrite: false,
    mutationStatus: "rejected",
    blockers: [],
    note: input.reason,
    auditContext: {
      actorUserId: input.actorUserId,
      reason: input.reason,
      origin: "admin_review",
      approvedAt: existing.auditContext.approvedAt ?? updatedAt,
    },
    updatedAt,
  };

  await getRepo().upsertEdge(nextEdge);
  await recordAudit({
    edgeId: nextEdge.id,
    action: "graph_write_rejected",
    actorUserId: input.actorUserId,
    reason: input.reason,
    blockers: [],
    mutationStatus: nextEdge.mutationStatus,
    at: updatedAt,
  });

  return nextEdge;
}

export async function writeApprovedTopicGraphEdgeToRuntime(
  edge: TopicGraphEdge,
): Promise<Awaited<ReturnType<typeof writeTopicGraphEdgeAfterReview>>> {
  await getRepo().upsertEdge(edge);

  const result = await writeTopicGraphEdgeAfterReview(edge, {
    graphRuntimeAvailable: Boolean(getGraphDriver()),
    graphWriter: async (nextEdge) => writeTopicGraphRelationship(nextEdge),
  });

  await getRepo().upsertEdge(result.edge);
  await recordAudit({
    edgeId: result.edge.id,
    action: result.ok ? "graph_write_written" : "graph_write_blocked",
    actorUserId: result.edge.auditContext.actorUserId,
    reason: result.edge.auditContext.reason,
    blockers: result.blockers,
    mutationStatus: result.edge.mutationStatus,
    at: result.edge.updatedAt,
  });

  return result;
}
