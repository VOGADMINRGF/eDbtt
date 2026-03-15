/**
 * Topic/Round canonical terminology:
 * - Topic is the durable productive issue container.
 * - Round is a contextual, medium-specific discussion instance linked to one topic.
 * - Demo routes may guide these flows, but must not own a parallel domain.
 */

export const TOPIC_ROUTE_PATTERN = "/topic/[slug]";
export const ROUND_ROUTE_PATTERN = "/round/[slug]";
export const DEMO_TOPIC_ROUND_WRAPPER_PREFIX = "/demo";

export const ROUND_TYPES = [
  "event",
  "livestream",
  "video",
  "article",
  "podcast",
  "session",
  "open_round",
] as const;
export type RoundType = (typeof ROUND_TYPES)[number];

export const ROUND_CONTRIBUTION_TYPES = [
  "question",
  "source",
  "objection",
  "perspective",
  "option",
  "summary_note",
  "protocol_note",
  "followup_task",
] as const;
export type RoundContributionType = (typeof ROUND_CONTRIBUTION_TYPES)[number];

/**
 * Placeholder categories for future PR phases.
 * These are intentionally coarse and can be refined during implementation.
 */
export const TOPIC_READINESS_STATUSES = [
  "opened",
  "gathering_questions",
  "evidence_growing",
  "conflicts_visible",
  "options_clarifying",
  "next_round_needed",
  "ready_for_vote_check",
  "in_implementation",
  "monitoring_impact",
] as const;
export type TopicReadinessStatus = (typeof TOPIC_READINESS_STATUSES)[number];

export const ROUND_SYNTHESIS_STATUSES = [
  "planned",
  "open",
  "review_pending",
  "merged_to_topic",
  "archived",
] as const;
export type RoundSynthesisStatus = (typeof ROUND_SYNTHESIS_STATUSES)[number];

export const TOPIC_ROADMAP_CATEGORIES = [
  "evidence_missing",
  "counterposition_missing",
  "authority_response_needed",
  "option_needs_detail",
  "implementation_question",
  "legal_check_needed",
  "moderation_followup",
  "next_round_question",
  "ready_for_vote_check",
] as const;
export type TopicRoadmapCategory = (typeof TOPIC_ROADMAP_CATEGORIES)[number];

export const TOPIC_SOURCE_CLASSES = [
  "primary_source",
  "secondary_report",
  "official_document",
  "eyewitness_or_affected_account",
  "media_report",
  "unverified_claim",
  "creator_media_source",
  "community_note",
] as const;
export type TopicSourceClass = (typeof TOPIC_SOURCE_CLASSES)[number];

export const TOPIC_CONFLICT_KINDS = [
  "claim_contradiction",
  "evidence_conflict",
  "option_disagreement",
  "unresolved_dispute",
  "counterposition_missing",
] as const;
export type TopicConflictKind = (typeof TOPIC_CONFLICT_KINDS)[number];

export const TOPIC_REVIEW_LOG_STATUSES = [
  "submitted",
  "under_review",
  "merged_into_existing_item",
  "accepted_as_new_draft",
  "marked_duplicate",
  "deferred_to_next_round",
  "rejected",
] as const;
export type TopicReviewLogStatus = (typeof TOPIC_REVIEW_LOG_STATUSES)[number];
