import { afterEach, describe, expect, it } from "vitest";

import type { TopicDeduplicationCandidate } from "@/features/create/topicDeduplicationReview";
import {
  blocksUnsafeTopicGraphMutation,
  buildTopicGraphEdgeDraft,
  canWriteTopicGraphEdge,
  getTopicGraphMutationBlockers,
  mapDeduplicationCandidateToGraphEdgeDraft,
  summarizeTopicGraphMutationState,
  writeTopicGraphEdgeAfterReview,
} from "@/features/create/topicGraphRuntime";
import {
  createInMemoryTopicGraphRuntimeRepository,
  getTopicGraphRuntimePersistenceState,
  listTopicGraphEdgeDrafts,
  listTopicGraphMutationAudits,
  persistTopicGraphEdgeDraft,
  setTopicGraphRuntimeRepositoryForTests,
} from "@/features/create/topicGraphRuntimeServer";

function buildCandidate(
  overrides: Partial<TopicDeduplicationCandidate> = {},
): TopicDeduplicationCandidate {
  return {
    id: overrides.id ?? "topic-dedup-1",
    kind: overrides.kind ?? "possible_same_topic",
    confidence: overrides.confidence ?? "high",
    reviewStatus: overrides.reviewStatus ?? "needs_editorial_review",
    title: overrides.title ?? "Mögliche Zusammenführung prüfen: Sichere Schulwege",
    summary:
      overrides.summary ??
      "Ähnliche Beiträge können redaktionell zusammengeführt oder getrennt gehalten werden.",
    reason: overrides.reason ?? "Starker Themenüberlapp wurde erkannt.",
    topicTitle: overrides.topicTitle ?? "Sichere Schulwege",
    authorStandpoint: overrides.authorStandpoint ?? "Mehr sichere Querungen zuerst.",
    relatedMatchId: overrides.relatedMatchId ?? "match-1",
    relatedMatchTitle: overrides.relatedMatchTitle ?? "Sichere Schulwege",
    relatedTopicId: overrides.relatedTopicId ?? "topic-existing-1",
    relatedBranchId: overrides.relatedBranchId ?? null,
    relatedDialogOutcomeId: overrides.relatedDialogOutcomeId ?? "dialog-1",
    supportingMatchIds: overrides.supportingMatchIds ?? ["match-1"],
    supportingSignals: overrides.supportingSignals ?? ["Sichere Schulwege"],
    sourceKinds: overrides.sourceKinds ?? ["existing_topic_match"],
    sourceReviewPending: overrides.sourceReviewPending ?? false,
    moderationPending: overrides.moderationPending ?? false,
    communityHintUnreviewed: overrides.communityHintUnreviewed ?? false,
    requiresEditorialReview: true,
    autoMerge: false,
    autoGraphMerge: false,
    autoPublish: false,
    autoCreate: false,
    reviewQueueMapping: overrides.reviewQueueMapping ?? {
      available: true,
      kind: "editorial_review",
      note: "Review-first.",
    },
  };
}

afterEach(() => {
  setTopicGraphRuntimeRepositoryForTests(null);
});

describe("topic graph runtime", () => {
  it("maps supported deduplication candidate kinds onto review-approved graph edge drafts", () => {
    const duplicateEdge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        kind: "possible_duplicate",
      }),
    );
    const sameTopicEdge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        kind: "possible_same_topic",
      }),
    );
    const sameBranchEdge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        kind: "possible_same_branch",
        relatedBranchId: "branch-existing-1",
        relatedTopicId: "topic-existing-1",
        relatedMatchTitle: "Pilotphase zuerst testen",
      }),
    );
    const followupBranchEdge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        kind: "possible_followup_branch",
        relatedBranchId: "branch-existing-2",
        relatedTopicId: "topic-existing-2",
        relatedMatchTitle: "Zweig Schulwegsicherheit",
      }),
    );

    expect(duplicateEdge?.kind).toBe("duplicate_of");
    expect(sameTopicEdge?.kind).toBe("same_topic_as");
    expect(sameBranchEdge?.kind).toBe("branch_of");
    expect(followupBranchEdge?.kind).toBe("follows_from");
  });

  it("requires explicit graph-write approval instead of treating approved_for_merge as sufficient", () => {
    const edge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        reviewStatus: "approved_for_merge",
      }),
      {
        sourceNodeId: "topic-new-1",
      },
    );

    expect(edge).toBeTruthy();
    expect(edge?.approvedForMerge).toBe(true);
    expect(edge?.approvedForGraphWrite).toBe(false);
    expect(blocksUnsafeTopicGraphMutation(edge!)).toBe(true);
    expect(canWriteTopicGraphEdge(edge!, { graphRuntimeAvailable: true })).toBe(false);
    expect(
      getTopicGraphMutationBlockers(edge!, {
        phase: "graph_write",
        graphRuntimeAvailable: true,
      }),
    ).toEqual(
      expect.arrayContaining(["review_not_approved", "unsafe_auto_merge"]),
    );
  });

  it("blocks final graph writes while source review is still pending", async () => {
    const edge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        sourceReviewPending: true,
      }),
      {
        sourceNodeId: "topic-new-2",
        approvedForGraphWrite: true,
        auditContext: {
          actorUserId: "editor-1",
          reason: "Quellenlage noch offen.",
          origin: "admin_review",
          approvedAt: "2026-06-29T12:00:00.000Z",
        },
      },
    );

    expect(edge).toBeTruthy();
    expect(
      getTopicGraphMutationBlockers(edge!, {
        phase: "graph_write",
        graphRuntimeAvailable: true,
      }),
    ).toContain("source_review_pending");

    const result = await writeTopicGraphEdgeAfterReview(edge!, {
      graphRuntimeAvailable: true,
      auditContext: edge!.auditContext,
      graphWriter: async () => ({
        ok: true,
        writtenAt: "2026-06-29T12:01:00.000Z",
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("blocked");
    expect(result.blockers).toContain("source_review_pending");
  });

  it("blocks public visibility while moderation is pending", () => {
    const edge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        moderationPending: true,
      }),
      {
        sourceNodeId: "topic-new-3",
        approvedForGraphWrite: true,
        auditContext: {
          actorUserId: "editor-2",
          reason: "Review bestätigt, Moderation steht noch aus.",
          origin: "admin_review",
          approvedAt: "2026-06-29T12:00:00.000Z",
        },
      },
    );

    expect(edge).toBeTruthy();
    expect(
      getTopicGraphMutationBlockers(edge!, {
        phase: "public_visibility",
      }),
    ).toContain("moderation_pending");
  });

  it("keeps ai, community, trust and volume signals as reviewed hints instead of direct graph writes", () => {
    const aiEdge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        sourceKinds: ["dialog_intelligence"],
        communityHintUnreviewed: true,
      }),
      {
        sourceNodeId: "topic-new-4",
        includeCommunityHintSignal: true,
        includeTrustSignal: true,
        includeVolumeSignal: true,
      },
    );

    expect(aiEdge).toBeTruthy();
    expect(aiEdge?.derivedFromAiSimilarity).toBe(true);
    expect(aiEdge?.derivedFromCommunityHint).toBe(true);
    expect(aiEdge?.derivedFromTrustSignal).toBe(true);
    expect(aiEdge?.derivedFromVolumeSignal).toBe(true);
    expect(blocksUnsafeTopicGraphMutation(aiEdge!)).toBe(true);
    expect(
      getTopicGraphMutationBlockers(aiEdge!, {
        phase: "graph_write",
        graphRuntimeAvailable: true,
      }),
    ).toEqual(
      expect.arrayContaining(["review_not_approved", "unsafe_auto_merge"]),
    );
  });

  it("requires audit context and reports graph runtime outages instead of fake success", async () => {
    const edge = buildTopicGraphEdgeDraft({
      source: {
        nodeType: "topic",
        id: "topic-new-5",
        title: "Sichere Schulwege",
      },
      target: {
        nodeType: "topic",
        id: "topic-existing-5",
        title: "Schulwegsicherheit",
      },
      kind: "same_topic_as",
      sourceCandidateId: "candidate-5",
      sourceReviewStatus: "approved_for_merge",
      sourceKinds: ["existing_topic_match"],
      approvedForMerge: true,
      approvedForGraphWrite: true,
    });

    expect(
      getTopicGraphMutationBlockers(edge, {
        phase: "graph_write",
        graphRuntimeAvailable: true,
      }),
    ).toContain("insufficient_audit_context");

    const runtimeBlocked = await writeTopicGraphEdgeAfterReview(edge, {
      graphRuntimeAvailable: false,
      auditContext: {
        actorUserId: "editor-3",
        reason: "Freigabe dokumentiert.",
        origin: "admin_review",
        approvedAt: "2026-06-29T12:00:00.000Z",
      },
    });

    expect(runtimeBlocked.ok).toBe(false);
    expect(runtimeBlocked.error).toBe("blocked");
    expect(runtimeBlocked.blockers).toContain("graph_runtime_unavailable");
  });

  it("writes a graph edge only after explicit approval and complete audit context", async () => {
    const edge = buildTopicGraphEdgeDraft({
      source: {
        nodeType: "topic",
        id: "topic-new-6",
        title: "Sichere Schulwege",
      },
      target: {
        nodeType: "topic",
        id: "topic-existing-6",
        title: "Schulwegsicherheit",
      },
      kind: "same_topic_as",
      sourceCandidateId: "candidate-6",
      sourceReviewStatus: "approved_for_merge",
      sourceKinds: ["existing_topic_match"],
      approvedForMerge: true,
      approvedForGraphWrite: true,
      auditContext: {
        actorUserId: "editor-4",
        reason: "Explizite Graph-Freigabe nach Review.",
        origin: "admin_review",
        approvedAt: "2026-06-29T12:00:00.000Z",
      },
    });

    const result = await writeTopicGraphEdgeAfterReview(edge, {
      graphRuntimeAvailable: true,
      auditContext: edge.auditContext,
      graphWriter: async () => ({
        ok: true,
        writtenAt: "2026-06-29T12:05:00.000Z",
      }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.edge.mutationStatus).toBe("written");
      expect(result.edge.writtenAt).toBe("2026-06-29T12:05:00.000Z");
      expect(result.edge.autoMerge).toBe(false);
      expect(result.edge.autoGraphWrite).toBe(false);
      expect(result.edge.autoPublish).toBe(false);
      expect(result.edge.autoDelete).toBe(false);
      expect(result.edge.autoCreateDossier).toBe(false);
      expect(result.edge.autoCreateAnlassraum).toBe(false);
      expect(result.edge.autoCreateParticipationSpace).toBe(false);
    }
  });

  it("persists graph edge drafts and audit entries via the topic graph runtime store", async () => {
    setTopicGraphRuntimeRepositoryForTests(
      createInMemoryTopicGraphRuntimeRepository(),
    );
    const state = getTopicGraphRuntimePersistenceState();
    const edge = buildTopicGraphEdgeDraft({
      source: {
        nodeType: "topic",
        id: "topic-new-7",
        title: "Sichere Schulwege",
      },
      target: {
        nodeType: "topic",
        id: "topic-existing-7",
        title: "Schulwegsicherheit",
      },
      kind: "duplicate_of",
      sourceCandidateId: "candidate-7",
      sourceReviewStatus: "needs_editorial_review",
      sourceKinds: ["existing_topic_match"],
      note: "Review-first Draft",
    });

    await persistTopicGraphEdgeDraft(edge);

    const drafts = await listTopicGraphEdgeDrafts();
    const audits = await listTopicGraphMutationAudits({
      edgeId: edge.id,
    });

    expect(state.repositoryInterface).toBe("TopicGraphRuntimeRepository");
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.id).toBe(edge.id);
    expect(audits).toHaveLength(1);
    expect(audits[0]?.action).toBe("draft_saved");
  });

  it("summarizes review-first graph preparation honestly", () => {
    const edge = mapDeduplicationCandidateToGraphEdgeDraft(
      buildCandidate({
        reviewStatus: "needs_editorial_review",
      }),
    );

    expect(edge).toBeTruthy();
    expect(summarizeTopicGraphMutationState(edge!)).toContain(
      "Graph-Verknüpfung kann nach redaktioneller Freigabe vorbereitet werden.",
    );
    expect(summarizeTopicGraphMutationState(edge!)).toContain(
      "Es wurde noch keine Zusammenführung und keine Graph-Änderung vorgenommen.",
    );
  });
});
