export const ROUND_ASSIST_SUGGESTION_KINDS = [
  "suggestedClaims",
  "suggestedQuestions",
  "suggestedSourceLinks",
  "suggestedOptionRefinements",
  "suggestedRoadmapItems",
  "duplicateAndClusterHints",
  "personaSummaries",
] as const;
export type RoundAssistSuggestionKind = (typeof ROUND_ASSIST_SUGGESTION_KINDS)[number];

export const ROUND_ASSIST_RUN_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
] as const;
export type RoundAssistRunStatus = (typeof ROUND_ASSIST_RUN_STATUSES)[number];

export const ROUND_ASSIST_REVIEW_DECISIONS = [
  "accept",
  "reject",
  "defer",
  "edit_accept",
  "link_existing",
  "mark_duplicate",
] as const;
export type RoundAssistReviewDecision = (typeof ROUND_ASSIST_REVIEW_DECISIONS)[number];

export const ROUND_ASSIST_SUGGESTION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "deferred",
  "edited",
  "linked",
  "duplicate",
] as const;
export type RoundAssistSuggestionStatus = (typeof ROUND_ASSIST_SUGGESTION_STATUSES)[number];

export type RoundAssistConfidence = "low" | "medium" | "high";

export type RoundAssistSuggestion = {
  suggestionId: string;
  runId: string;
  roundSlug: string;
  topicSlug: string;
  kind: RoundAssistSuggestionKind;
  title: string;
  text: string;
  confidence: RoundAssistConfidence;
  status: RoundAssistSuggestionStatus;
  reviewNote?: string;
  editedText?: string;
  targetHint?: string;
  linkedEntityId?: string;
  appliedEntityId?: string;
  createdAt: string;
  updatedAt: string;
};

export type RoundAssistRun = {
  runId: string;
  roundSlug: string;
  topicSlug: string;
  status: RoundAssistRunStatus;
  provider: string;
  model: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  outputJson?: unknown;
  suggestionsCount: number;
};

export type TopicMergeReviewState = {
  runId: string;
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  deferred: number;
  edited: number;
  linked: number;
  duplicate: number;
  canApplyToTopic: boolean;
  reviewCompleted: boolean;
  updatedAt: string;
};

export type RoundAssistRunSnapshot = {
  run: RoundAssistRun;
  suggestions: RoundAssistSuggestion[];
  reviewState: TopicMergeReviewState;
};
