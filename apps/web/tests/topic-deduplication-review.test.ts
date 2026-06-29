import { describe, expect, it } from "vitest";

import {
  blocksTopicAutoMerge,
  buildTopicDeduplicationCandidates,
  canQueueTopicDeduplicationReview,
  createTopicDeduplicationReviewDraft,
  createTopicDeduplicationReviewQueueItem,
  getTopicDeduplicationBlockers,
  mapDialogResultToDeduplicationCandidates,
  mapExistingTopicMatchesToDeduplicationCandidates,
  summarizeTopicDeduplicationReviewState,
  type TopicDeduplicationCandidate,
} from "@/features/create/topicDeduplicationReview";
import type { ExistingTopicMatch } from "@/features/create/existingTopicMatches";
import type { DialogOutcome } from "@/features/dialog/dialogIntelligenceContract";

function buildMatches(): ExistingTopicMatch[] {
  return [
    {
      id: "topic-strong",
      kind: "topic",
      title: "Sichere Schulwege",
      summary: "Vorhandenes Thema mit sehr ähnlichem Fokus.",
      strength: "strong",
      status: "suggested",
      reason: "Ähnlicher Fokus und ähnliche Stoßrichtung.",
      relatedTopicId: "sichere-schulwege",
      requiresReview: false,
    },
    {
      id: "branch-medium",
      kind: "branch",
      title: "Pilotphase zuerst testen",
      summary: "Vorhandener Zweig mit ähnlichem Vorgehen.",
      strength: "medium",
      status: "suggested",
      reason: "Ähnliche Zweiglogik.",
      relatedTopicId: "kommunale-beteiligung",
      relatedBranchId: "branch-1",
      requiresReview: false,
    },
    {
      id: "opinion-cluster-high",
      kind: "opinion_cluster",
      title: "Ähnliche Meinungen zu Sichere Schulwege",
      summary: "Mehrere ähnliche Beiträge.",
      strength: "strong",
      status: "suggested",
      reason: "Ähnliche Aussagen und Schwerpunktsetzung.",
      countedOpinions: 12,
      requiresReview: false,
    },
    {
      id: "topic-low",
      kind: "topic",
      title: "Entfernt ähnliches Thema",
      summary: "Nur loser Bezug.",
      strength: "weak",
      status: "suggested",
      reason: "Loser Bezug.",
      relatedTopicId: "fern",
      requiresReview: false,
    },
  ];
}

function buildSimilarDialogOutcome(): DialogOutcome {
  return {
    id: "dialog-similar-topic",
    topicTitle: "Sichere Schulwege",
    engagementMode: "explore_perspectives",
    userOpenness: "medium",
    recognizedStandpoint: {
      summary: "Sichere Schulwege sollten zuerst mit klaren Querungen und Pilotmaßnahmen verbessert werden.",
      confidence: "high",
      confirmedByUser: true,
      userCorrection: null,
    },
    arguments: [
      {
        id: "arg-1",
        claim: "Klare Querungen und Tempo-30-Kontrollen sollten priorisiert werden.",
        type: "reform",
        source: "user",
        verificationStatus: "unverified_user_claim",
        linkedPerspectiveIds: [],
      },
    ],
    perspectives: [],
    branches: [
      {
        id: "branch-1",
        title: "Pilotphase zuerst testen",
        reason: "Ein vorhandener Zweig mit ähnlichem Vorgehen.",
        status: "suggested",
      },
    ],
    openQuestions: ["Welche Kreuzungen sollten zuerst gesichert werden?"],
    resultStatus: "confirmed_by_user",
    handoffTargets: ["count_opinion", "editorial_review"],
  };
}

function buildSimilarNeedsSourceDialogOutcome(): DialogOutcome {
  return {
    ...buildSimilarDialogOutcome(),
    id: "dialog-needs-source",
    arguments: [
      {
        id: "arg-needs-source",
        claim: "Die Maßnahme werde sicher zu messbar weniger Unfällen führen.",
        type: "evidence_needed",
        source: "user",
        verificationStatus: "needs_source",
        linkedPerspectiveIds: [],
      },
    ],
    openQuestions: [
      "Welche Belege oder Quellen fehlen noch?",
      "Welche Kreuzungen sollten zuerst gesichert werden?",
    ],
    resultStatus: "review_ready",
    handoffTargets: ["count_opinion", "editorial_review", "factcheck_request"],
  };
}

describe("topic deduplication review", () => {
  it("builds review-first candidates from existing topic matches", () => {
    const candidates = mapExistingTopicMatchesToDeduplicationCandidates({
      matches: buildMatches(),
    });

    expect(candidates.map((candidate) => candidate.kind)).toEqual(
      expect.arrayContaining([
        "possible_same_topic",
        "possible_followup_branch",
        "possible_opinion_cluster_overlap",
        "possible_duplicate",
      ]),
    );
    expect(candidates.find((candidate) => candidate.relatedMatchId === "topic-strong")).toMatchObject({
      confidence: "high",
      reviewStatus: "needs_editorial_review",
      autoMerge: false,
      autoGraphMerge: false,
      autoPublish: false,
      autoCreate: false,
    });
  });

  it("derives deduplication candidates from dialog runtime signals when topic or branch similarity is strong", () => {
    const candidates = mapDialogResultToDeduplicationCandidates({
      outcome: buildSimilarDialogOutcome(),
      matches: buildMatches(),
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceKinds: expect.arrayContaining(["dialog_intelligence"]),
        }),
      ]),
    );
    expect(
      candidates.some(
        (candidate) =>
          candidate.kind === "possible_same_branch" ||
          candidate.kind === "possible_followup_branch",
      ),
    ).toBe(true);
  });

  it("keeps low confidence as a hint and does not allow review queueing", () => {
    const lowConfidenceCandidate = mapExistingTopicMatchesToDeduplicationCandidates({
      matches: [buildMatches()[3]!],
    })[0] as TopicDeduplicationCandidate;

    expect(lowConfidenceCandidate.confidence).toBe("low");
    expect(canQueueTopicDeduplicationReview(lowConfidenceCandidate)).toBe(false);
    expect(getTopicDeduplicationBlockers(lowConfidenceCandidate)).toContain(
      "insufficient_similarity",
    );
  });

  it("lets high-confidence candidates enter review while still blocking auto-merge and graph mutation", () => {
    const highConfidenceCandidate = mapExistingTopicMatchesToDeduplicationCandidates({
      matches: [buildMatches()[0]!],
    })[0] as TopicDeduplicationCandidate;

    expect(canQueueTopicDeduplicationReview(highConfidenceCandidate)).toBe(true);
    expect(blocksTopicAutoMerge(highConfidenceCandidate)).toBe(true);
    expect(
      getTopicDeduplicationBlockers(highConfidenceCandidate, {
        phase: "graph_merge",
        graphRuntimeAvailable: false,
      }),
    ).toEqual(
      expect.arrayContaining([
        "graph_runtime_unavailable",
        "unsafe_auto_merge",
      ]),
    );
  });

  it("treats source review, moderation and community hints as blockers for finalization but not for review queueing", () => {
    const [candidate] = buildTopicDeduplicationCandidates({
      existingMatches: [buildMatches()[0]!],
      dialogOutcome: buildSimilarNeedsSourceDialogOutcome(),
      moderationPending: true,
      communityHintUnreviewed: true,
    });

    expect(candidate).toBeDefined();
    expect(canQueueTopicDeduplicationReview(candidate!)).toBe(true);
    expect(
      getTopicDeduplicationBlockers(candidate!, { phase: "graph_merge", graphRuntimeAvailable: false }),
    ).toEqual(
      expect.arrayContaining([
        "source_review_pending",
        "community_hint_unreviewed",
        "graph_runtime_unavailable",
        "unsafe_auto_merge",
      ]),
    );
    expect(
      getTopicDeduplicationBlockers(candidate!, { phase: "public_visibility", moderationPending: true }),
    ).toContain("moderation_pending");
  });

  it("maps review candidates onto the existing editorial review queue semantics without inventing a merge runtime", () => {
    const candidate = mapExistingTopicMatchesToDeduplicationCandidates({
      matches: [buildMatches()[0]!],
    })[0] as TopicDeduplicationCandidate;

    const draft = createTopicDeduplicationReviewDraft(candidate);
    const queueItem = createTopicDeduplicationReviewQueueItem(candidate);

    expect(draft.target).toBe("editorial_review");
    expect(draft.requiresEditorialReview).toBe(true);
    expect(queueItem.kind).toBe("editorial_review");
    expect(queueItem.autoCreate).toBe(false);
    expect(queueItem.autoPublish).toBe(false);
    expect(summarizeTopicDeduplicationReviewState({
      ...candidate,
      reviewStatus: "approved_for_merge",
    })).toContain("keine Runtime- oder Graph-Zusammenführung");
  });
});
