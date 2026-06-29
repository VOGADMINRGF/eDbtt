import { normalizeGermanSearchText } from "@features/common/utils/textNormalization";
import type {
  CreateHandoffDraft,
} from "@/features/create/createHandoffDrafts";
import type {
  CreateHandoffReviewQueueItem,
} from "@/features/create/createHandoffReviewQueue";
import { createReviewQueueItemFromHandoffDraft } from "@/features/create/createHandoffReviewQueue";
import {
  getVisibleExistingTopicMatches,
  type ExistingTopicMatch,
} from "@/features/create/existingTopicMatches";
import {
  summarizeRecognizedStandpoint,
  type DialogOutcome,
} from "@/features/dialog/dialogIntelligenceContract";

export const TOPIC_DEDUPLICATION_CANDIDATE_KINDS = [
  "possible_duplicate",
  "possible_same_topic",
  "possible_same_branch",
  "possible_opinion_cluster_overlap",
  "possible_followup_branch",
  "possible_split_needed",
] as const;

export type TopicDeduplicationCandidateKind =
  (typeof TOPIC_DEDUPLICATION_CANDIDATE_KINDS)[number];

export const TOPIC_DEDUPLICATION_CONFIDENCE = [
  "low",
  "medium",
  "high",
] as const;

export type TopicDeduplicationConfidence =
  (typeof TOPIC_DEDUPLICATION_CONFIDENCE)[number];

export const TOPIC_DEDUPLICATION_REVIEW_STATUSES = [
  "draft",
  "queued_for_review",
  "needs_editorial_review",
  "approved_for_merge",
  "rejected",
  "split_required",
  "blocked",
] as const;

export type TopicDeduplicationReviewStatus =
  (typeof TOPIC_DEDUPLICATION_REVIEW_STATUSES)[number];

export const TOPIC_DEDUPLICATION_BLOCKERS = [
  "insufficient_similarity",
  "missing_runtime_match",
  "source_review_pending",
  "moderation_pending",
  "community_hint_unreviewed",
  "graph_runtime_unavailable",
  "unsafe_auto_merge",
] as const;

export type TopicDeduplicationBlocker =
  (typeof TOPIC_DEDUPLICATION_BLOCKERS)[number];

export type TopicDeduplicationCandidate = {
  id: string;
  kind: TopicDeduplicationCandidateKind;
  confidence: TopicDeduplicationConfidence;
  reviewStatus: TopicDeduplicationReviewStatus;
  title: string;
  summary: string;
  reason: string;
  topicTitle: string;
  authorStandpoint?: string | null;
  relatedMatchId?: string | null;
  relatedTopicId?: string | null;
  relatedBranchId?: string | null;
  relatedDialogOutcomeId?: string | null;
  supportingMatchIds: string[];
  supportingSignals: string[];
  sourceKinds: Array<"existing_topic_match" | "dialog_intelligence">;
  sourceReviewPending: boolean;
  moderationPending: boolean;
  communityHintUnreviewed: boolean;
  requiresEditorialReview: true;
  autoMerge: false;
  autoGraphMerge: false;
  autoPublish: false;
  autoCreate: false;
  reviewQueueMapping: {
    available: boolean;
    kind: "editorial_review";
    note: string;
  };
};

export type TopicDeduplicationReviewContext = {
  existingMatches?: ExistingTopicMatch[];
  dialogOutcome?: DialogOutcome | null;
  graphRuntimeAvailable?: boolean;
  moderationPending?: boolean;
  communityHintUnreviewed?: boolean;
  phase?: "review_queue" | "public_visibility" | "graph_merge";
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeText(value: string | null | undefined): string {
  return normalizeGermanSearchText(String(value ?? ""));
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized.split(" ").filter((token) => token.length >= 3);
}

function jaccardScore(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }
  const union = leftSet.size + rightSet.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function textSimilarity(left: string, right: string): number {
  const leftNormalized = normalizeText(left);
  const rightNormalized = normalizeText(right);
  if (!leftNormalized || !rightNormalized) return 0;
  if (leftNormalized === rightNormalized) return 1;
  const minLength = Math.min(leftNormalized.length, rightNormalized.length);
  if (
    minLength >= 12 &&
    (leftNormalized.includes(rightNormalized) ||
      rightNormalized.includes(leftNormalized))
  ) {
    return 0.88;
  }
  if (leftNormalized.length >= 28 && rightNormalized.includes(leftNormalized)) {
    return 0.93;
  }
  if (rightNormalized.length >= 28 && leftNormalized.includes(rightNormalized)) {
    return 0.93;
  }
  return Number(
    jaccardScore(tokenize(leftNormalized), tokenize(rightNormalized)).toFixed(4),
  );
}

function confidenceRank(confidence: TopicDeduplicationConfidence): number {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

function kindRank(kind: TopicDeduplicationCandidateKind): number {
  if (kind === "possible_same_topic") return 60;
  if (kind === "possible_same_branch") return 55;
  if (kind === "possible_duplicate") return 52;
  if (kind === "possible_opinion_cluster_overlap") return 48;
  if (kind === "possible_followup_branch") return 44;
  return 40;
}

function mergeStatusRank(status: TopicDeduplicationReviewStatus): number {
  if (status === "approved_for_merge") return 7;
  if (status === "split_required") return 6;
  if (status === "needs_editorial_review") return 5;
  if (status === "queued_for_review") return 4;
  if (status === "draft") return 3;
  if (status === "blocked") return 2;
  return 1;
}

function confidenceFromMatchStrength(
  strength: ExistingTopicMatch["strength"],
): TopicDeduplicationConfidence {
  if (strength === "strong") return "high";
  if (strength === "medium") return "medium";
  return "low";
}

function confidenceFromSimilarity(score: number): TopicDeduplicationConfidence {
  if (score >= 0.86) return "high";
  if (score >= 0.7) return "medium";
  return "low";
}

function reviewStatusFromConfidence(
  confidence: TopicDeduplicationConfidence,
): TopicDeduplicationReviewStatus {
  if (confidence === "high") return "needs_editorial_review";
  if (confidence === "medium") return "queued_for_review";
  return "draft";
}

function createCandidate(input: {
  id: string;
  kind: TopicDeduplicationCandidateKind;
  confidence: TopicDeduplicationConfidence;
  title: string;
  summary: string;
  reason: string;
  topicTitle: string;
  authorStandpoint?: string | null;
  relatedMatchId?: string | null;
  relatedTopicId?: string | null;
  relatedBranchId?: string | null;
  relatedDialogOutcomeId?: string | null;
  supportingMatchIds?: string[];
  supportingSignals?: string[];
  sourceKinds?: Array<"existing_topic_match" | "dialog_intelligence">;
  sourceReviewPending?: boolean;
  moderationPending?: boolean;
  communityHintUnreviewed?: boolean;
  reviewStatus?: TopicDeduplicationReviewStatus;
}): TopicDeduplicationCandidate {
  return {
    id: input.id,
    kind: input.kind,
    confidence: input.confidence,
    reviewStatus: input.reviewStatus ?? reviewStatusFromConfidence(input.confidence),
    title: input.title,
    summary: input.summary,
    reason: input.reason,
    topicTitle: input.topicTitle,
    authorStandpoint: input.authorStandpoint ?? null,
    relatedMatchId: input.relatedMatchId ?? null,
    relatedTopicId: input.relatedTopicId ?? null,
    relatedBranchId: input.relatedBranchId ?? null,
    relatedDialogOutcomeId: input.relatedDialogOutcomeId ?? null,
    supportingMatchIds: unique([
      ...(input.relatedMatchId ? [input.relatedMatchId] : []),
      ...(input.supportingMatchIds ?? []),
    ]),
    supportingSignals: unique(input.supportingSignals ?? []),
    sourceKinds: input.sourceKinds ?? ["existing_topic_match"],
    sourceReviewPending: input.sourceReviewPending ?? false,
    moderationPending: input.moderationPending ?? false,
    communityHintUnreviewed: input.communityHintUnreviewed ?? false,
    requiresEditorialReview: true,
    autoMerge: false,
    autoGraphMerge: false,
    autoPublish: false,
    autoCreate: false,
    reviewQueueMapping: {
      available: true,
      kind: "editorial_review",
      note:
        "Der Kandidat wird nur als redaktioneller Prüfgegenstand vorgemerkt. Es wurde noch nichts automatisch zusammengeführt.",
    },
  };
}

function mergeCandidate(
  left: TopicDeduplicationCandidate,
  right: TopicDeduplicationCandidate,
): TopicDeduplicationCandidate {
  const strongest =
    confidenceRank(right.confidence) > confidenceRank(left.confidence) ? right : left;
  const highestStatus =
    mergeStatusRank(right.reviewStatus) > mergeStatusRank(left.reviewStatus)
      ? right.reviewStatus
      : left.reviewStatus;

  return {
    ...strongest,
    reviewStatus: highestStatus,
    title:
      confidenceRank(right.confidence) > confidenceRank(left.confidence)
        ? right.title
        : left.title,
    summary:
      confidenceRank(right.confidence) > confidenceRank(left.confidence)
        ? right.summary
        : left.summary,
    reason:
      confidenceRank(right.confidence) > confidenceRank(left.confidence)
        ? right.reason
        : left.reason,
    supportingMatchIds: unique([
      ...left.supportingMatchIds,
      ...right.supportingMatchIds,
    ]),
    supportingSignals: unique([
      ...left.supportingSignals,
      ...right.supportingSignals,
    ]),
    sourceKinds: Array.from(new Set([...left.sourceKinds, ...right.sourceKinds])),
    sourceReviewPending: left.sourceReviewPending || right.sourceReviewPending,
    moderationPending: left.moderationPending || right.moderationPending,
    communityHintUnreviewed:
      left.communityHintUnreviewed || right.communityHintUnreviewed,
  };
}

function candidateKey(candidate: TopicDeduplicationCandidate): string {
  return [
    candidate.kind,
    candidate.topicTitle,
    candidate.relatedTopicId ?? "",
    candidate.relatedBranchId ?? "",
    candidate.relatedMatchId ?? "",
  ].join("::");
}

function dedupeCandidates(
  candidates: TopicDeduplicationCandidate[],
): TopicDeduplicationCandidate[] {
  const merged = new Map<string, TopicDeduplicationCandidate>();
  for (const candidate of candidates) {
    const key = candidateKey(candidate);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, candidate);
      continue;
    }
    merged.set(key, mergeCandidate(existing, candidate));
  }

  return Array.from(merged.values()).sort((left, right) => {
    const confidenceDiff = confidenceRank(right.confidence) - confidenceRank(left.confidence);
    if (confidenceDiff !== 0) return confidenceDiff;
    return kindRank(right.kind) - kindRank(left.kind);
  });
}

function buildExistingTopicMatchCandidate(
  match: ExistingTopicMatch,
): TopicDeduplicationCandidate | null {
  const confidence = confidenceFromMatchStrength(match.strength);

  if (match.kind === "topic") {
    const kind = confidence === "high" ? "possible_same_topic" : "possible_duplicate";
    return createCandidate({
      id: `topic-dedup:${match.id}`,
      kind,
      confidence,
      title:
        kind === "possible_same_topic"
          ? `Mögliche Zusammenführung prüfen: ${match.title}`
          : `Mögliche Dopplung prüfen: ${match.title}`,
      summary:
        "Ein vorhandenes Thema wirkt dem neuen Beitrag sehr ähnlich. Die Entscheidung bleibt redaktionell und erzeugt keinen automatischen Merge.",
      reason: match.reason,
      topicTitle: match.title,
      relatedMatchId: match.id,
      relatedTopicId: match.relatedTopicId ?? null,
      supportingSignals: [match.title, match.summary],
    });
  }

  if (match.kind === "branch") {
    const kind =
      confidence === "high" ? "possible_same_branch" : "possible_followup_branch";
    return createCandidate({
      id: `topic-dedup:${match.id}`,
      kind,
      confidence,
      title:
        kind === "possible_same_branch"
          ? `Möglichen Zweigabgleich prüfen: ${match.title}`
          : `Ähnlichen Anschlusszweig prüfen: ${match.title}`,
      summary:
        "Ein bestehender Zweig wirkt ähnlich genug, dass eine redaktionelle Zusammenführung oder bewusste Trennung geprüft werden sollte.",
      reason: match.reason,
      topicTitle: match.title,
      relatedMatchId: match.id,
      relatedTopicId: match.relatedTopicId ?? null,
      relatedBranchId: match.relatedBranchId ?? null,
      supportingSignals: [match.title, match.summary],
    });
  }

  if (match.kind === "opinion_cluster") {
    return createCandidate({
      id: `topic-dedup:${match.id}`,
      kind: "possible_opinion_cluster_overlap",
      confidence,
      title: `Möglichen Meinungscluster-Abgleich prüfen: ${match.title}`,
      summary:
        "Ähnliche Beiträge können auf einen Meinungscluster-Overlap hindeuten, bleiben aber ein review-first Hinweis und keine automatische Zusammenführung.",
      reason: match.reason,
      topicTitle: match.title,
      relatedMatchId: match.id,
      supportingSignals: [match.title, match.summary],
    });
  }

  return null;
}

export function mapExistingTopicMatchesToDeduplicationCandidates(input: {
  matches: ExistingTopicMatch[];
}): TopicDeduplicationCandidate[] {
  return dedupeCandidates(
    getVisibleExistingTopicMatches({
      topicTitle: "",
      introText: "",
      matches: input.matches,
      suggestedDecision: "start_new_branch",
      openQuestions: [],
      guardrailNote: "",
    })
      .map(buildExistingTopicMatchCandidate)
      .filter(Boolean) as TopicDeduplicationCandidate[],
  );
}

export function mapDialogResultToDeduplicationCandidates(input: {
  outcome: DialogOutcome;
  matches: ExistingTopicMatch[];
}): TopicDeduplicationCandidate[] {
  const visibleMatches = getVisibleExistingTopicMatches({
    topicTitle: input.outcome.topicTitle,
    introText: "",
    matches: input.matches,
    suggestedDecision: "start_new_branch",
    openQuestions: [],
    guardrailNote: "",
    outcomeResultStatus: input.outcome.resultStatus,
  }).filter(
    (match) =>
      match.kind === "topic" ||
      match.kind === "branch" ||
      match.kind === "opinion_cluster",
  );
  const standpoint = summarizeRecognizedStandpoint(input.outcome);
  const branchLabels = input.outcome.branches.map((branch) => branch.title);
  const signals = unique([
    input.outcome.topicTitle,
    standpoint,
    ...branchLabels,
    ...input.outcome.openQuestions,
  ]);
  const sourceReviewPending =
    input.outcome.arguments.some(
      (argument) => argument.verificationStatus === "needs_source",
    ) || input.outcome.handoffTargets.includes("factcheck_request");
  const candidates: TopicDeduplicationCandidate[] = [];

  for (const match of visibleMatches) {
    const haystack = `${match.title} ${match.summary}`;
    const bestSignal = signals
      .map((signal) => ({
        signal,
        score: textSimilarity(signal, haystack),
      }))
      .sort((left, right) => right.score - left.score)[0];
    if (!bestSignal || bestSignal.score < 0.58) continue;

    if (match.kind === "topic") {
      const confidence = confidenceFromSimilarity(bestSignal.score);
      candidates.push(
        createCandidate({
          id: `topic-dedup-dialog:${input.outcome.id}:${match.id}`,
          kind:
            confidence === "high"
              ? "possible_same_topic"
              : "possible_duplicate",
          confidence,
          title:
            confidence === "high"
              ? `Mögliche Zusammenführung prüfen: ${match.title}`
              : `Mögliche Dopplung prüfen: ${match.title}`,
          summary:
            "Die Runtime-KI erkennt einen stark ähnlichen Themenfokus. Das bleibt ein Prüfhinweis und keine automatische Zusammenführung.",
          reason: `Dialogsignal „${bestSignal.signal}“ ähnelt dem vorhandenen Thema deutlich.`,
          topicTitle: input.outcome.topicTitle,
          authorStandpoint: standpoint || null,
          relatedMatchId: match.id,
          relatedTopicId: match.relatedTopicId ?? null,
          relatedDialogOutcomeId: input.outcome.id,
          supportingSignals: [bestSignal.signal, match.title],
          sourceKinds: ["dialog_intelligence"],
          sourceReviewPending,
        }),
      );
      continue;
    }

    if (match.kind === "branch") {
      const confidence = confidenceFromSimilarity(bestSignal.score);
      candidates.push(
        createCandidate({
          id: `topic-dedup-dialog:${input.outcome.id}:${match.id}`,
          kind:
            confidence === "high"
              ? "possible_same_branch"
              : "possible_followup_branch",
          confidence,
          title:
            confidence === "high"
              ? `Möglichen Zweigabgleich prüfen: ${match.title}`
              : `Ähnlichen Anschlusszweig prüfen: ${match.title}`,
          summary:
            "Die Runtime-KI erkennt einen ähnlichen Zweig oder Folgepfad. Review entscheidet, ob getrennt oder gemeinsam weitergeführt wird.",
          reason: `Dialogsignal „${bestSignal.signal}“ ähnelt einem vorhandenen Zweig.`,
          topicTitle: input.outcome.topicTitle,
          authorStandpoint: standpoint || null,
          relatedMatchId: match.id,
          relatedTopicId: match.relatedTopicId ?? null,
          relatedBranchId: match.relatedBranchId ?? null,
          relatedDialogOutcomeId: input.outcome.id,
          supportingSignals: [bestSignal.signal, match.title],
          sourceKinds: ["dialog_intelligence"],
          sourceReviewPending,
        }),
      );
      continue;
    }

    const confidence = confidenceFromSimilarity(bestSignal.score);
    candidates.push(
      createCandidate({
        id: `topic-dedup-dialog:${input.outcome.id}:${match.id}`,
        kind: "possible_opinion_cluster_overlap",
        confidence,
        title: `Möglichen Meinungscluster-Abgleich prüfen: ${match.title}`,
        summary:
          "Die Runtime-KI erkennt eine starke Nähe zu einem vorhandenen Meinungscluster. Das bleibt ein Review-Hinweis und keine Zusammenführung.",
        reason: `Dialogsignal „${bestSignal.signal}“ ähnelt einem vorhandenen Meinungscluster.`,
        topicTitle: input.outcome.topicTitle,
        authorStandpoint: standpoint || null,
        relatedMatchId: match.id,
        relatedDialogOutcomeId: input.outcome.id,
        supportingSignals: [bestSignal.signal, match.title],
        sourceKinds: ["dialog_intelligence"],
        sourceReviewPending,
      }),
    );
  }

  const strongOrMedium = candidates.filter(
    (candidate) => confidenceRank(candidate.confidence) >= 2,
  );
  if (strongOrMedium.length >= 2 && input.outcome.branches.length > 0) {
    candidates.push(
      createCandidate({
        id: `topic-dedup-dialog-split:${input.outcome.id}`,
        kind: "possible_split_needed",
        confidence: "medium",
        reviewStatus: "split_required",
        title: `Getrennte Behandlung prüfen: ${input.outcome.topicTitle}`,
        summary:
          "Mehrere ähnliche Anschlusskandidaten sprechen dafür, nicht still zusammenzuführen, sondern eine bewusste redaktionelle Trennung zu prüfen.",
        reason:
          "Mehrere ähnliche Themen- oder Zweigsignale wurden erkannt; Split bleibt eine menschliche Review-Entscheidung.",
        topicTitle: input.outcome.topicTitle,
        authorStandpoint: standpoint || null,
        relatedDialogOutcomeId: input.outcome.id,
        supportingMatchIds: strongOrMedium.flatMap(
          (candidate) => candidate.supportingMatchIds,
        ),
        supportingSignals: [
          input.outcome.topicTitle,
          ...input.outcome.branches.map((branch) => branch.title),
        ],
        sourceKinds: ["dialog_intelligence"],
        sourceReviewPending,
      }),
    );
  }

  return dedupeCandidates(candidates);
}

export function buildTopicDeduplicationCandidates(
  context: TopicDeduplicationReviewContext,
): TopicDeduplicationCandidate[] {
  const matchCandidates = context.existingMatches
    ? mapExistingTopicMatchesToDeduplicationCandidates({
        matches: context.existingMatches,
      })
    : [];
  const dialogCandidates =
    context.dialogOutcome && context.existingMatches
      ? mapDialogResultToDeduplicationCandidates({
          outcome: context.dialogOutcome,
          matches: context.existingMatches,
        })
      : [];

  return dedupeCandidates(
    [...matchCandidates, ...dialogCandidates].map((candidate) => ({
      ...candidate,
      moderationPending:
        candidate.moderationPending || Boolean(context.moderationPending),
      communityHintUnreviewed:
        candidate.communityHintUnreviewed ||
        Boolean(context.communityHintUnreviewed),
    })),
  );
}

export function getTopicDeduplicationBlockers(
  candidate: TopicDeduplicationCandidate,
  context: TopicDeduplicationReviewContext = {},
): TopicDeduplicationBlocker[] {
  const blockers: TopicDeduplicationBlocker[] = [];
  const phase = context.phase ?? "review_queue";

  if (candidate.confidence === "low") {
    blockers.push("insufficient_similarity");
  }
  if (
    !candidate.relatedMatchId &&
    candidate.supportingMatchIds.length === 0 &&
    candidate.kind !== "possible_split_needed"
  ) {
    blockers.push("missing_runtime_match");
  }
  if (phase !== "review_queue" && candidate.sourceReviewPending) {
    blockers.push("source_review_pending");
  }
  if (phase === "public_visibility" && (candidate.moderationPending || context.moderationPending)) {
    blockers.push("moderation_pending");
  }
  if (phase !== "review_queue" && (candidate.communityHintUnreviewed || context.communityHintUnreviewed)) {
    blockers.push("community_hint_unreviewed");
  }
  if (
    phase === "graph_merge" &&
    context.graphRuntimeAvailable === false
  ) {
    blockers.push("graph_runtime_unavailable");
  }
  if (phase === "graph_merge") {
    blockers.push("unsafe_auto_merge");
  }

  return unique(blockers) as TopicDeduplicationBlocker[];
}

export function canQueueTopicDeduplicationReview(
  candidate: TopicDeduplicationCandidate,
  context: TopicDeduplicationReviewContext = {},
): boolean {
  const blockers = getTopicDeduplicationBlockers(candidate, {
    ...context,
    phase: "review_queue",
  });

  return !blockers.includes("insufficient_similarity") &&
    !blockers.includes("missing_runtime_match");
}

export function blocksTopicAutoMerge(
  _candidate: TopicDeduplicationCandidate,
): boolean {
  return true;
}

export function summarizeTopicDeduplicationReviewState(
  candidate: TopicDeduplicationCandidate,
  context: TopicDeduplicationReviewContext = {},
): string {
  const blockers = getTopicDeduplicationBlockers(candidate, context);
  if (candidate.reviewStatus === "approved_for_merge") {
    return "Redaktionell als möglicher Merge freigegeben. Es wurde weiterhin keine Runtime- oder Graph-Zusammenführung ausgelöst.";
  }
  if (candidate.reviewStatus === "split_required") {
    return "Mehrere ähnliche Signale sprechen eher für eine bewusste Trennung als für einen stillen Merge.";
  }
  if (blockers.includes("insufficient_similarity")) {
    return "Die Ähnlichkeit reicht nur für einen Hinweis, nicht für einen belastbaren Merge-Kandidaten.";
  }
  if (blockers.includes("source_review_pending")) {
    return "Die redaktionelle Prüfung kann vorgemerkt werden, aber vor einer finalen Zusammenführung bleibt zuerst Quellenprüfung offen.";
  }
  if (blockers.includes("graph_runtime_unavailable")) {
    return "Ein Review-Kandidat ist vorbereitet, aber Graph-Merge bleibt bewusst unverfügbar.";
  }
  return "Ähnliche Beiträge können redaktionell zusammengeführt oder getrennt gehalten werden. Es wurde noch nichts automatisch zusammengeführt.";
}

export function createTopicDeduplicationReviewDraft(
  candidate: TopicDeduplicationCandidate,
): CreateHandoffDraft {
  const timestamp = nowIso();
  return {
    id: `create-handoff-draft-topic-dedup-${candidate.id}`,
    source: candidate.relatedMatchId ? "existing_topic_match" : "manual_author_choice",
    target: "editorial_review",
    status: "prepared",
    title: candidate.title,
    summary: candidate.summary,
    authorStandpoint: candidate.authorStandpoint ?? null,
    topicTitle: candidate.topicTitle,
    relatedMatchId: candidate.relatedMatchId ?? null,
    relatedDialogOutcomeId: candidate.relatedDialogOutcomeId ?? null,
    selectedPerspectiveIds: [],
    selectedBranchIds: candidate.relatedBranchId ? [candidate.relatedBranchId] : [],
    selectedArgumentIds: [],
    authorProvidedSources: [],
    authorProvidedExamples: [],
    openQuestions: unique([
      "Soll redaktionell zusammengeführt oder getrennt gehalten werden?",
      candidate.kind === "possible_split_needed"
        ? "Welche Unterschiede müssen als eigener Zweig sichtbar bleiben?"
        : "Welche Unterschiede sprechen gegen eine automatische Gleichsetzung?",
      candidate.sourceReviewPending
        ? "Welche Belege oder Quellen müssen vor einer finalen Zusammenführung noch geprüft werden?"
        : "",
    ]),
    requiresEditorialReview: true,
    requiresFactcheck: false,
    autoCreate: false,
    autoPublish: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createTopicDeduplicationReviewQueueItem(
  candidate: TopicDeduplicationCandidate,
): CreateHandoffReviewQueueItem {
  return createReviewQueueItemFromHandoffDraft(
    createTopicDeduplicationReviewDraft(candidate),
  );
}
