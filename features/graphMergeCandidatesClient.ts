import type {
  SourceSupport,
  TruthStatus,
  UserFacingVerificationLabel,
} from "@features/ai/e150/verificationContract";

export const GRAPH_MERGE_CANDIDATE_SOURCE_TYPES = [
  "create_analysis",
  "editorial_review_request",
  "factcheck_result",
  "theme_suggestion",
  "round_draft",
  "dossier_candidate",
] as const;

export type GraphMergeCandidateSourceType =
  (typeof GRAPH_MERGE_CANDIDATE_SOURCE_TYPES)[number];

export const GRAPH_MERGE_CANDIDATE_KINDS = [
  "claim",
  "theme",
  "dossier",
  "round",
  "source",
  "open_question",
] as const;

export type GraphMergeCandidateKind = (typeof GRAPH_MERGE_CANDIDATE_KINDS)[number];

export const GRAPH_MERGE_CANDIDATE_REVIEW_STATUSES = [
  "draft_candidate",
  "needs_review",
  "accepted_for_staging",
  "staged",
  "merged",
  "rejected",
  "archived",
] as const;

export type GraphMergeCandidateReviewStatus =
  (typeof GRAPH_MERGE_CANDIDATE_REVIEW_STATUSES)[number];

export const GRAPH_MERGE_CANDIDATE_MERGE_STATUSES = [
  "not_started",
  "duplicate_suspected",
  "merge_ready",
  "staged",
  "merged",
  "blocked",
] as const;

export type GraphMergeCandidateMergeStatus =
  (typeof GRAPH_MERGE_CANDIDATE_MERGE_STATUSES)[number];

export const GRAPH_MERGE_CANDIDATE_ACTIONS = [
  "accept_for_staging",
  "mark_duplicate",
  "resolve_duplicate",
  "prepare_productive_merge",
  "confirm_productive_merge",
  "revert_productive_merge",
  "return_to_clarification",
  "reject",
  "archive",
] as const;

export type GraphMergeCandidateAction =
  (typeof GRAPH_MERGE_CANDIDATE_ACTIONS)[number];

export const PRODUCTIVE_GRAPH_MERGE_GATE_REASONS = [
  "merge_ready",
  "blocked_source_open",
  "blocked_review_required",
  "blocked_duplicate_unresolved",
  "blocked_missing_admin",
  "blocked_truth_guard",
  "override_required",
] as const;

export type ProductiveGraphMergeGateReason =
  (typeof PRODUCTIVE_GRAPH_MERGE_GATE_REASONS)[number];

export const GRAPH_MERGE_AUDIT_ACTIONS = [
  "merge_confirmed",
  "merge_blocked",
  "merge_reverted",
  "duplicate_resolved",
  "override_confirmed",
] as const;

export type GraphMergeAuditAction = (typeof GRAPH_MERGE_AUDIT_ACTIONS)[number];

export type GraphMergeDuplicateCandidate = {
  id: string;
  label: string;
  matchType: "normalized_text" | "title_similarity" | "source_overlap";
  sourceType: GraphMergeCandidateSourceType;
  candidateKind: GraphMergeCandidateKind;
  reviewStatus: GraphMergeCandidateReviewStatus;
  mergeStatus: GraphMergeCandidateMergeStatus;
};

export type GraphMergeCandidateHistoryEntry = {
  id: string;
  action: GraphMergeCandidateAction;
  byUserId: string;
  at: string;
  note: string | null;
  previousReviewStatus: GraphMergeCandidateReviewStatus;
  nextReviewStatus: GraphMergeCandidateReviewStatus;
  previousMergeStatus: GraphMergeCandidateMergeStatus;
  nextMergeStatus: GraphMergeCandidateMergeStatus;
};

export type GraphMergeStateSnapshot = {
  reviewStatus: GraphMergeCandidateReviewStatus;
  mergeStatus: GraphMergeCandidateMergeStatus;
  productiveMergeConfirmedAt: string | null;
  productiveMergeConfirmedByUserId: string | null;
};

export type GraphMergeAuditEntry = {
  id: string;
  candidateId: string;
  sourceType: GraphMergeCandidateSourceType;
  sourceId: string;
  mergedBy: string;
  mergedAt: string;
  action: GraphMergeAuditAction;
  reason: ProductiveGraphMergeGateReason;
  overrideReason?: string | null;
  previousState?: GraphMergeStateSnapshot | null;
  nextState?: GraphMergeStateSnapshot | null;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  verificationLabel: UserFacingVerificationLabel;
  noAutoPublish: true;
};

export type ProductiveGraphMergeGate = {
  candidateId: string;
  allowed: boolean;
  requiresAdminConfirmation: true;
  requiresDedupeReview: boolean;
  requiresSourceSupport: boolean;
  requiresReviewCompletion: boolean;
  requiresOverrideReason: boolean;
  reason: ProductiveGraphMergeGateReason;
  noAutoPublish: true;
  noAutoVote: true;
  auditRequired: true;
};

export type GraphMergeCandidate = {
  id: string;
  sourceType: GraphMergeCandidateSourceType;
  sourceId: string;
  reviewRequestId?: string | null;
  userId?: string | null;
  text: string;
  normalizedText: string;
  candidateKind: GraphMergeCandidateKind;
  proposedTitle?: string | null;
  proposedSummary?: string | null;
  proposedClaims?: string[];
  proposedTopics?: string[];
  proposedSources?: string[];
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  verificationLabel: UserFacingVerificationLabel;
  reviewRecommended: boolean;
  reviewStatus: GraphMergeCandidateReviewStatus;
  mergeStatus: GraphMergeCandidateMergeStatus;
  duplicateCandidates?: GraphMergeDuplicateCandidate[];
  createdAt: string;
  updatedAt: string;
  noTruthPromotion: true;
  noAutoPublish: true;
  noAutoGraphPromotion: true;
  requiresEditorialConfirmation: true;
  statusNote?: string | null;
  latestAction?: GraphMergeCandidateAction | null;
  latestActionAt?: string | null;
  latestActionByUserId?: string | null;
  productiveMergeConfirmedAt?: string | null;
  productiveMergeConfirmedByUserId?: string | null;
  productiveMergeOverrideReason?: string | null;
  history?: GraphMergeCandidateHistoryEntry[];
};

export function getGraphMergeCandidateReviewStatusLabel(status: GraphMergeCandidateReviewStatus) {
  switch (status) {
    case "draft_candidate":
      return "Graph-Kandidat vorbereitet";
    case "needs_review":
      return "Duplikatprüfung läuft";
    case "accepted_for_staging":
      return "Für Staging vorgemerkt";
    case "staged":
      return "Für Zusammenführung vorbereitet";
    case "merged":
      return "Zusammenführung bestätigt";
    case "rejected":
      return "Abgelehnt";
    case "archived":
      return "Archiviert";
    default:
      return status;
  }
}

export function getGraphMergeCandidateMergeStatusLabel(status: GraphMergeCandidateMergeStatus) {
  switch (status) {
    case "duplicate_suspected":
      return "Möglicherweise bereits vorhanden";
    case "merge_ready":
      return "Produktiver Merge nach Prüfung möglich";
    case "staged":
      return "Für Zusammenführung vorbereitet";
    case "merged":
      return "Zusammenführung bestätigt";
    case "blocked":
      return "Geblockt";
    case "not_started":
    default:
      return "Noch nicht zusammengeführt";
  }
}

export function getProductiveGraphMergeGateReasonLabel(reason: ProductiveGraphMergeGateReason) {
  switch (reason) {
    case "merge_ready":
      return "Produktiver Merge kann explizit bestätigt werden";
    case "blocked_source_open":
      return "Quellenlage offen";
    case "blocked_review_required":
      return "Redaktionelle Prüfung offen";
    case "blocked_duplicate_unresolved":
      return "Duplikatprüfung offen";
    case "blocked_missing_admin":
      return "Admin-Bestätigung fehlt";
    case "blocked_truth_guard":
      return "Truth-Guard blockiert";
    case "override_required":
      return "Override-Begründung erforderlich";
    default:
      return reason;
  }
}

export function getGraphMergeCandidateKindLabel(kind: GraphMergeCandidateKind) {
  switch (kind) {
    case "claim":
      return "Claim";
    case "theme":
      return "Thema";
    case "dossier":
      return "Dossier";
    case "round":
      return "Runde";
    case "source":
      return "Quelle";
    case "open_question":
      return "Offene Frage";
    default:
      return kind;
  }
}
