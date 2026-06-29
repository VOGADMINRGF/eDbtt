import { normalizeGermanSearchText } from "@features/common/utils/textNormalization";
import type {
  TopicDeduplicationCandidate,
  TopicDeduplicationReviewStatus,
} from "@/features/create/topicDeduplicationReview";

export const TOPIC_GRAPH_NODE_KINDS = [
  "topic",
  "branch",
  "source_question",
  "dossier_candidate",
  "anlassraum_candidate",
  "participation_space_candidate",
] as const;

export type TopicGraphNodeKind = (typeof TOPIC_GRAPH_NODE_KINDS)[number];

export const TOPIC_GRAPH_EDGE_KINDS = [
  "duplicate_of",
  "same_topic_as",
  "branch_of",
  "follows_from",
  "contradicts",
  "supports",
  "source_question_for",
  "dossier_candidate_for",
  "anlassraum_candidate_for",
  "participation_space_candidate_for",
] as const;

export type TopicGraphEdgeKind = (typeof TOPIC_GRAPH_EDGE_KINDS)[number];

export const TOPIC_GRAPH_MUTATION_STATUSES = [
  "draft",
  "queued_for_review",
  "approved_for_graph_write",
  "written",
  "rejected",
  "blocked",
] as const;

export type TopicGraphMutationStatus =
  (typeof TOPIC_GRAPH_MUTATION_STATUSES)[number];

export const TOPIC_GRAPH_MUTATION_BLOCKERS = [
  "review_not_approved",
  "source_review_pending",
  "moderation_pending",
  "graph_runtime_unavailable",
  "unsafe_auto_merge",
  "missing_target",
  "missing_source",
  "insufficient_audit_context",
] as const;

export type TopicGraphMutationBlocker =
  (typeof TOPIC_GRAPH_MUTATION_BLOCKERS)[number];

export const TOPIC_GRAPH_SIGNAL_SOURCES = [
  "existing_topic_match",
  "dialog_intelligence",
  "community_hint",
  "trust_signal",
  "volume_signal",
] as const;

export type TopicGraphSignalSource = (typeof TOPIC_GRAPH_SIGNAL_SOURCES)[number];

export type TopicGraphNodeRef = {
  nodeType: TopicGraphNodeKind;
  id: string | null;
  title: string;
};

export type TopicGraphAuditContext = {
  actorUserId: string | null;
  reason: string | null;
  origin:
    | "deduplication_review"
    | "existing_topic_match"
    | "dialog_intelligence"
    | "admin_review"
    | "runtime_contract"
    | null;
  approvedAt: string | null;
};

export type TopicGraphEdge = {
  id: string;
  source: TopicGraphNodeRef;
  target: TopicGraphNodeRef;
  kind: TopicGraphEdgeKind;
  mutationStatus: TopicGraphMutationStatus;
  blockers: TopicGraphMutationBlocker[];
  sourceCandidateId: string | null;
  sourceReviewStatus: TopicDeduplicationReviewStatus | null;
  sourceKinds: TopicGraphSignalSource[];
  sourceReviewPending: boolean;
  moderationPending: boolean;
  communityHintUnreviewed: boolean;
  derivedFromAiSimilarity: boolean;
  derivedFromCommunityHint: boolean;
  derivedFromTrustSignal: boolean;
  derivedFromVolumeSignal: boolean;
  approvedForMerge: boolean;
  approvedForGraphWrite: boolean;
  requiresEditorialReview: true;
  requiresExplicitGraphWriteApproval: true;
  autoMerge: false;
  autoGraphWrite: false;
  autoPublish: false;
  autoDelete: false;
  autoCreateDossier: false;
  autoCreateAnlassraum: false;
  autoCreateParticipationSpace: false;
  note: string | null;
  auditContext: TopicGraphAuditContext;
  createdAt: string;
  updatedAt: string;
  writtenAt: string | null;
};

export type TopicGraphMutationPhase =
  | "draft"
  | "graph_write"
  | "public_visibility";

export type TopicGraphMutationContext = {
  phase?: TopicGraphMutationPhase;
  graphRuntimeAvailable?: boolean;
  auditContext?: Partial<TopicGraphAuditContext>;
};

export type BuildTopicGraphEdgeDraftInput = {
  id?: string | null;
  source: TopicGraphNodeRef;
  target: TopicGraphNodeRef;
  kind: TopicGraphEdgeKind;
  mutationStatus?: TopicGraphMutationStatus;
  sourceCandidateId?: string | null;
  sourceReviewStatus?: TopicDeduplicationReviewStatus | null;
  sourceKinds?: TopicGraphSignalSource[];
  sourceReviewPending?: boolean;
  moderationPending?: boolean;
  communityHintUnreviewed?: boolean;
  derivedFromCommunityHint?: boolean;
  derivedFromTrustSignal?: boolean;
  derivedFromVolumeSignal?: boolean;
  approvedForMerge?: boolean;
  approvedForGraphWrite?: boolean;
  note?: string | null;
  auditContext?: Partial<TopicGraphAuditContext>;
  graphRuntimeAvailable?: boolean;
};

export type MapDeduplicationCandidateToGraphEdgeDraftOptions = {
  sourceNodeId?: string | null;
  sourceNodeTitle?: string | null;
  targetNodeId?: string | null;
  targetNodeTitle?: string | null;
  approvedForGraphWrite?: boolean;
  auditContext?: Partial<TopicGraphAuditContext>;
  graphRuntimeAvailable?: boolean;
  includeCommunityHintSignal?: boolean;
  includeTrustSignal?: boolean;
  includeVolumeSignal?: boolean;
};

export type TopicGraphWriteAuditContext = Required<TopicGraphAuditContext>;

export type TopicGraphWriteResult =
  | {
      ok: true;
      edge: TopicGraphEdge;
      blockers: [];
      writtenAt: string;
    }
  | {
      ok: false;
      edge: TopicGraphEdge;
      blockers: TopicGraphMutationBlocker[];
      error: "blocked" | "graph_write_failed";
      message: string;
    };

export type TopicGraphWriter = (
  edge: TopicGraphEdge,
  auditContext: TopicGraphWriteAuditContext,
) => Promise<
  | {
      ok: true;
      writtenAt?: string | null;
    }
  | {
      ok: false;
      blocker?: TopicGraphMutationBlocker;
      error?: string;
    }
>;

export type WriteTopicGraphEdgeAfterReviewOptions = {
  graphRuntimeAvailable?: boolean;
  auditContext?: Partial<TopicGraphAuditContext>;
  graphWriter?: TopicGraphWriter;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeToken(value: string | null | undefined): string {
  const normalized = normalizeGermanSearchText(String(value ?? ""))
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
  return normalized || "draft";
}

function trimOrNull(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values.filter(Boolean))) as T[];
}

function mergeAuditContext(
  base?: Partial<TopicGraphAuditContext>,
  override?: Partial<TopicGraphAuditContext>,
): TopicGraphAuditContext {
  return {
    actorUserId: trimOrNull(override?.actorUserId ?? base?.actorUserId),
    reason: trimOrNull(override?.reason ?? base?.reason),
    origin: (override?.origin ?? base?.origin ?? null) as TopicGraphAuditContext["origin"],
    approvedAt: trimOrNull(override?.approvedAt ?? base?.approvedAt),
  };
}

function mapReviewStatusToMutationStatus(input: {
  reviewStatus: TopicDeduplicationReviewStatus | null | undefined;
  approvedForGraphWrite: boolean;
}): TopicGraphMutationStatus {
  if (input.approvedForGraphWrite) return "approved_for_graph_write";
  if (input.reviewStatus === "rejected") return "rejected";
  if (input.reviewStatus === "split_required" || input.reviewStatus === "blocked") {
    return "blocked";
  }
  if (
    input.reviewStatus === "approved_for_merge" ||
    input.reviewStatus === "queued_for_review" ||
    input.reviewStatus === "needs_editorial_review"
  ) {
    return "queued_for_review";
  }
  return "draft";
}

function buildEdgeId(input: {
  kind: TopicGraphEdgeKind;
  source: TopicGraphNodeRef;
  target: TopicGraphNodeRef;
}): string {
  return [
    "topic-graph-edge",
    input.kind,
    normalizeToken(input.source.id ?? input.source.title),
    normalizeToken(input.target.id ?? input.target.title),
  ].join(":");
}

function mapCandidateKindToGraphEdgeKind(
  kind: TopicDeduplicationCandidate["kind"],
): TopicGraphEdgeKind | null {
  if (kind === "possible_duplicate") return "duplicate_of";
  if (kind === "possible_same_topic") return "same_topic_as";
  if (kind === "possible_same_branch") return "branch_of";
  if (kind === "possible_followup_branch") return "follows_from";
  return null;
}

function buildTopicGraphNodeRef(
  nodeType: TopicGraphNodeKind,
  id: string | null | undefined,
  title: string | null | undefined,
): TopicGraphNodeRef {
  return {
    nodeType,
    id: trimOrNull(id),
    title: String(title ?? "").trim() || "Unbenannter Bezug",
  };
}

function describeWriteBlockers(
  blockers: TopicGraphMutationBlocker[],
): string {
  if (blockers.includes("review_not_approved")) {
    return "Graph-Verknüpfung bleibt blockiert, bis eine explizite Freigabe für den Graph-Write vorliegt.";
  }
  if (blockers.includes("source_review_pending")) {
    return "Graph-Verknüpfung bleibt blockiert, bis die Quellenprüfung abgeschlossen ist.";
  }
  if (blockers.includes("graph_runtime_unavailable")) {
    return "Graph-Runtime ist nicht verfügbar. Es wurde keine Graph-Änderung vorgetäuscht.";
  }
  if (blockers.includes("missing_source") || blockers.includes("missing_target")) {
    return "Es fehlt noch ein belastbarer Quell- oder Zielknoten. Es wurde keine Graph-Änderung vorgenommen.";
  }
  if (blockers.includes("insufficient_audit_context")) {
    return "Für den Graph-Write fehlen belastbarer Audit-Kontext und begründete Freigabe.";
  }
  return "Die Graph-Verknüpfung bleibt blockiert. Es wurde keine Graph-Änderung vorgenommen.";
}

export function buildTopicGraphEdgeDraft(
  input: BuildTopicGraphEdgeDraftInput,
): TopicGraphEdge {
  const timestamp = nowIso();
  const approvedForGraphWrite = Boolean(
    input.approvedForGraphWrite || input.mutationStatus === "approved_for_graph_write",
  );
  const edge: TopicGraphEdge = {
    id:
      trimOrNull(input.id) ??
      buildEdgeId({
        kind: input.kind,
        source: input.source,
        target: input.target,
      }),
    source: buildTopicGraphNodeRef(
      input.source.nodeType,
      input.source.id,
      input.source.title,
    ),
    target: buildTopicGraphNodeRef(
      input.target.nodeType,
      input.target.id,
      input.target.title,
    ),
    kind: input.kind,
    mutationStatus:
      input.mutationStatus ??
      mapReviewStatusToMutationStatus({
        reviewStatus: input.sourceReviewStatus,
        approvedForGraphWrite,
      }),
    blockers: [],
    sourceCandidateId: trimOrNull(input.sourceCandidateId),
    sourceReviewStatus: input.sourceReviewStatus ?? null,
    sourceKinds: unique([
      ...(input.sourceKinds ?? []),
      ...(input.derivedFromCommunityHint ? ["community_hint" as const] : []),
      ...(input.derivedFromTrustSignal ? ["trust_signal" as const] : []),
      ...(input.derivedFromVolumeSignal ? ["volume_signal" as const] : []),
    ]),
    sourceReviewPending: Boolean(input.sourceReviewPending),
    moderationPending: Boolean(input.moderationPending),
    communityHintUnreviewed: Boolean(input.communityHintUnreviewed),
    derivedFromAiSimilarity: (input.sourceKinds ?? []).includes("dialog_intelligence"),
    derivedFromCommunityHint: Boolean(input.derivedFromCommunityHint),
    derivedFromTrustSignal: Boolean(input.derivedFromTrustSignal),
    derivedFromVolumeSignal: Boolean(input.derivedFromVolumeSignal),
    approvedForMerge: Boolean(input.approvedForMerge),
    approvedForGraphWrite,
    requiresEditorialReview: true,
    requiresExplicitGraphWriteApproval: true,
    autoMerge: false,
    autoGraphWrite: false,
    autoPublish: false,
    autoDelete: false,
    autoCreateDossier: false,
    autoCreateAnlassraum: false,
    autoCreateParticipationSpace: false,
    note: trimOrNull(input.note),
    auditContext: mergeAuditContext(input.auditContext),
    createdAt: timestamp,
    updatedAt: timestamp,
    writtenAt: null,
  };

  return {
    ...edge,
    blockers: getTopicGraphMutationBlockers(edge, {
      phase: "draft",
      graphRuntimeAvailable: input.graphRuntimeAvailable,
    }),
  };
}

export function mapDeduplicationCandidateToGraphEdgeDraft(
  candidate: TopicDeduplicationCandidate,
  options: MapDeduplicationCandidateToGraphEdgeDraftOptions = {},
): TopicGraphEdge | null {
  const kind = mapCandidateKindToGraphEdgeKind(candidate.kind);
  if (!kind) return null;

  const branchCandidate =
    candidate.kind === "possible_same_branch" ||
    candidate.kind === "possible_followup_branch";

  return buildTopicGraphEdgeDraft({
    source: buildTopicGraphNodeRef(
      branchCandidate ? "branch" : "topic",
      options.sourceNodeId ?? null,
      options.sourceNodeTitle ?? candidate.topicTitle,
    ),
    target: buildTopicGraphNodeRef(
      branchCandidate ? "branch" : "topic",
      options.targetNodeId ??
        (branchCandidate ? candidate.relatedBranchId : candidate.relatedTopicId) ??
        null,
      options.targetNodeTitle ??
        candidate.relatedMatchTitle ??
        candidate.topicTitle,
    ),
    kind,
    sourceCandidateId: candidate.id,
    sourceReviewStatus: candidate.reviewStatus,
    sourceKinds: candidate.sourceKinds,
    sourceReviewPending: candidate.sourceReviewPending,
    moderationPending: candidate.moderationPending,
    communityHintUnreviewed: candidate.communityHintUnreviewed,
    derivedFromCommunityHint:
      Boolean(options.includeCommunityHintSignal) ||
      candidate.communityHintUnreviewed,
    derivedFromTrustSignal: Boolean(options.includeTrustSignal),
    derivedFromVolumeSignal: Boolean(options.includeVolumeSignal),
    approvedForMerge: candidate.reviewStatus === "approved_for_merge",
    approvedForGraphWrite: Boolean(options.approvedForGraphWrite),
    note: candidate.reason,
    auditContext: options.auditContext,
    graphRuntimeAvailable: options.graphRuntimeAvailable,
  });
}

export function blocksUnsafeTopicGraphMutation(
  edge: TopicGraphEdge,
): boolean {
  if (edge.autoMerge !== false) return true;
  if (edge.autoGraphWrite !== false) return true;
  if (edge.autoPublish !== false) return true;
  if (edge.autoDelete !== false) return true;
  if (
    edge.autoCreateDossier !== false ||
    edge.autoCreateAnlassraum !== false ||
    edge.autoCreateParticipationSpace !== false
  ) {
    return true;
  }
  if (edge.approvedForMerge && !edge.approvedForGraphWrite) {
    return true;
  }
  if (
    !edge.approvedForGraphWrite &&
    (edge.derivedFromAiSimilarity ||
      edge.derivedFromCommunityHint ||
      edge.derivedFromTrustSignal ||
      edge.derivedFromVolumeSignal)
  ) {
    return true;
  }
  return false;
}

export function getTopicGraphMutationBlockers(
  edge: TopicGraphEdge,
  context: TopicGraphMutationContext = {},
): TopicGraphMutationBlocker[] {
  const blockers: TopicGraphMutationBlocker[] = [];
  const phase = context.phase ?? "graph_write";
  const auditContext = mergeAuditContext(edge.auditContext, context.auditContext);

  if (!trimOrNull(edge.source.id)) blockers.push("missing_source");
  if (!trimOrNull(edge.target.id)) blockers.push("missing_target");

  if (phase !== "draft" && !edge.approvedForGraphWrite) {
    blockers.push("review_not_approved");
  }
  if (phase === "graph_write" && edge.sourceReviewPending) {
    blockers.push("source_review_pending");
  }
  if (phase === "public_visibility" && edge.moderationPending) {
    blockers.push("moderation_pending");
  }
  if (phase === "graph_write" && context.graphRuntimeAvailable === false) {
    blockers.push("graph_runtime_unavailable");
  }
  if (phase === "graph_write" && blocksUnsafeTopicGraphMutation(edge)) {
    blockers.push("unsafe_auto_merge");
  }
  if (
    phase === "graph_write" &&
    (!auditContext.actorUserId || !auditContext.reason || !auditContext.origin)
  ) {
    blockers.push("insufficient_audit_context");
  }

  return unique(blockers);
}

export function canWriteTopicGraphEdge(
  edge: TopicGraphEdge,
  context: Omit<TopicGraphMutationContext, "phase"> = {},
): boolean {
  return getTopicGraphMutationBlockers(edge, {
    ...context,
    phase: "graph_write",
  }).length === 0;
}

export async function writeTopicGraphEdgeAfterReview(
  edge: TopicGraphEdge,
  options: WriteTopicGraphEdgeAfterReviewOptions,
): Promise<TopicGraphWriteResult> {
  const auditContext = mergeAuditContext(edge.auditContext, options.auditContext);
  const graphRuntimeAvailable =
    options.graphRuntimeAvailable ?? Boolean(options.graphWriter);
  const writeCandidate: TopicGraphEdge = {
    ...edge,
    auditContext,
    blockers: [],
    updatedAt: nowIso(),
  };
  const blockers = getTopicGraphMutationBlockers(writeCandidate, {
    phase: "graph_write",
    graphRuntimeAvailable,
    auditContext,
  });

  if (blockers.length > 0) {
    return {
      ok: false,
      edge: {
        ...writeCandidate,
        mutationStatus: "blocked",
        blockers,
        updatedAt: nowIso(),
      },
      blockers,
      error: "blocked",
      message: describeWriteBlockers(blockers),
    };
  }

  if (!options.graphWriter) {
    const missingWriterBlockers = unique<TopicGraphMutationBlocker>([
      ...blockers,
      "graph_runtime_unavailable",
    ]);
    return {
      ok: false,
      edge: {
        ...writeCandidate,
        mutationStatus: "blocked",
        blockers: missingWriterBlockers,
        updatedAt: nowIso(),
      },
      blockers: missingWriterBlockers,
      error: "blocked",
      message: describeWriteBlockers(missingWriterBlockers),
    };
  }

  const result = await options.graphWriter(
    writeCandidate,
    auditContext as TopicGraphWriteAuditContext,
  );

  if (result.ok === false) {
    const nextBlockers = result.blocker
      ? unique<TopicGraphMutationBlocker>([result.blocker])
      : [];
    return {
      ok: false,
      edge: {
        ...writeCandidate,
        mutationStatus: nextBlockers.length > 0 ? "blocked" : writeCandidate.mutationStatus,
        blockers: nextBlockers,
        updatedAt: nowIso(),
      },
      blockers: nextBlockers,
      error: nextBlockers.length > 0 ? "blocked" : "graph_write_failed",
      message:
        nextBlockers.length > 0
          ? describeWriteBlockers(nextBlockers)
          : result.error ?? "graph_write_failed",
    };
  }

  const writtenAt = trimOrNull(result.writtenAt) ?? nowIso();
  return {
    ok: true,
    edge: {
      ...writeCandidate,
      mutationStatus: "written",
      blockers: [],
      approvedForGraphWrite: true,
      writtenAt,
      updatedAt: writtenAt,
    },
    blockers: [],
    writtenAt,
  };
}

export function summarizeTopicGraphMutationState(
  edge: TopicGraphEdge,
  context: TopicGraphMutationContext = {},
): string {
  const phase = context.phase ?? "draft";
  const blockers = getTopicGraphMutationBlockers(edge, {
    ...context,
    phase,
  });

  if (edge.mutationStatus === "written") {
    return "Graph-Verknüpfung wurde nach redaktioneller Freigabe und Audit-Kontext geschrieben.";
  }
  if (phase === "public_visibility" && blockers.includes("moderation_pending")) {
    return "Die öffentliche Graph-Sichtbarkeit bleibt bis zur Moderationsfreigabe blockiert.";
  }
  if (
    blockers.includes("review_not_approved") ||
    blockers.includes("unsafe_auto_merge")
  ) {
    return "Graph-Verknüpfung kann nach redaktioneller Freigabe vorbereitet werden. Es wurde noch keine Zusammenführung und keine Graph-Änderung vorgenommen.";
  }
  if (blockers.includes("source_review_pending")) {
    return "Graph-Verknüpfung bleibt bis zur Quellenprüfung blockiert. Es wurde noch keine Zusammenführung und keine Graph-Änderung vorgenommen.";
  }
  if (blockers.includes("graph_runtime_unavailable")) {
    return "Graph-Runtime ist derzeit nicht verfügbar. Es wurde keine Graph-Änderung vorgetäuscht.";
  }
  if (blockers.includes("missing_source") || blockers.includes("missing_target")) {
    return "Graph-Verknüpfung kann nach redaktioneller Freigabe vorbereitet werden. Es wurde noch keine Zusammenführung und keine Graph-Änderung vorgenommen.";
  }
  return "Graph-Verknüpfung kann nach redaktioneller Freigabe vorbereitet werden. Es wurde noch keine Zusammenführung und keine Graph-Änderung vorgenommen.";
}
