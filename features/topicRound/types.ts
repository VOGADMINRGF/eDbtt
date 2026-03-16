import type {
  TopicConflictKind,
  CompanionContextType,
  RoundContributionType,
  RoundType,
  TopicReadinessStatus,
  TopicReviewLogStatus,
  TopicRoadmapCategory,
  TopicSourceClass,
} from "@features/common/types/TopicRound";

export type TopicClaim = {
  id: string;
  text: string;
  sourceIds: string[];
};

export type TopicSource = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  sourceClass: TopicSourceClass;
};

export type TopicOption = {
  id: string;
  title: string;
  summary: string;
};

export type TopicRoadmapItem = {
  id: string;
  category: TopicRoadmapCategory;
  title: string;
  unresolved: string;
  evidenceMissing?: string;
  askNext?: string;
  responderHint?: string;
  voteReadinessSignal?: "not_ready" | "review_needed" | "ready_for_check";
  status: "open" | "in_progress" | "blocked" | "done";
};

export type TopicConflictMarker = {
  id: string;
  kind: TopicConflictKind;
  title: string;
  details: string;
  relatedClaimIds?: string[];
  relatedSourceIds?: string[];
  relatedOptionIds?: string[];
  unresolved: boolean;
};

export type TopicReviewLogScope =
  | "round_contribution"
  | "merge_suggestion"
  | "roadmap_action"
  | "claim_update";

export type TopicReviewLogEntry = {
  id: string;
  status: TopicReviewLogStatus;
  scope: TopicReviewLogScope;
  entityId: string;
  title: string;
  summary: string;
  sourceRoundSlug?: string;
  appliedToId?: string;
  publicReason?: string;
  internalReason?: string;
  reviewedBy: string;
  reviewedAt: string;
  visibility: "public" | "management_only";
};

export type TopicReadinessCheck = {
  id: string;
  createdAt: string;
  decidedBy: string;
  decision: "needs_next_round" | "ready_for_vote_check" | "ready_for_mandate_handoff";
  rationale: string;
};

export type TopicExportSnapshot = {
  conciseSummary: string;
  nextRoundAgenda: string[];
  sourceSnapshot: string[];
  roadmapSnapshot: string[];
  handoffNote: string;
};

export type TopicMandateBridge = {
  clarifiedNow: string[];
  ownerNeeded: string[];
  openBeforeImplementation: string[];
  monitoringFocus: string[];
  linkedMandateId?: string;
};

export type Topic = {
  id: string;
  slug: string;
  title: string;
  framingQuestion: string;
  currentState: string;
  readiness: TopicReadinessStatus;
  options: TopicOption[];
  claims: TopicClaim[];
  sources: TopicSource[];
  objections: string[];
  openQuestions: string[];
  roadmap: TopicRoadmapItem[];
  conflicts: TopicConflictMarker[];
  reviewLog: TopicReviewLogEntry[];
  readinessChecks: TopicReadinessCheck[];
  exportSnapshot: TopicExportSnapshot;
  mandateBridge: TopicMandateBridge;
};

export type RoundContribution = {
  id: string;
  type: RoundContributionType;
  text: string;
  authorLabel: string;
  createdAt: string;
  reviewStatus?: TopicReviewLogStatus;
};

export type Round = {
  id: string;
  slug: string;
  topicSlug: string;
  title: string;
  type: RoundType;
  status: "open" | "closed";
  startedAt: string;
  sourceLabel: string;
  sourceUrl?: string;
  sourcePublisher?: string;
  summary: string;
  openPoints: string[];
  contributions: RoundContribution[];
};

export type CompanionVisibility = "exclusive" | "semi_open" | "open";

export type CompanionAccessPolicy =
  | "qr_only"
  | "link_required"
  | "context_first_then_topic"
  | "public_entry";

export type CompanionModerationMode =
  | "editorial_gate"
  | "moderated_public"
  | "public_with_review";

export type CompanionContext = {
  id: string;
  slug: string;
  type: CompanionContextType;
  title: string;
  medium: string;
  format: string;
  author?: string;
  host?: string;
  editorialOwner?: string;
  publishedAt: string;
  issue?: string;
  episode?: string;
  page?: string;
  reference?: string;
  intro: string;
  visibility: CompanionVisibility;
  accessPolicy: CompanionAccessPolicy;
  linkedTopicSlug: string;
  linkedRoundSlug?: string;
  qrTargetPath: string;
  canonicalOpenPath: string;
  moderationMode: CompanionModerationMode;
  mainQuestion: string;
};
