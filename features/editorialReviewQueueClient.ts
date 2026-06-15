import type {
  SourceSupport,
  TruthStatus,
  UserFacingVerificationLabel,
} from "@features/ai/e150/verificationContract";

export const EDITORIAL_REVIEW_REQUEST_SOURCE_TYPES = [
  "start_draft",
  "create_analysis",
  "factcheck_request",
  "theme_suggestion",
  "round_draft",
  "user_relevance_appeal",
] as const;

export type EditorialReviewRequestSourceType =
  (typeof EDITORIAL_REVIEW_REQUEST_SOURCE_TYPES)[number];

export const EDITORIAL_REVIEW_REQUEST_REASONS = [
  "user_requested_review",
  "relevance_gate_appeal",
  "source_open",
  "provider_disagreement",
  "fallback_used",
  "insufficient_independent_success",
  "no_source_bluffing_failed",
  "moderation_required",
  "editorial_escalation",
] as const;

export type EditorialReviewRequestReason =
  (typeof EDITORIAL_REVIEW_REQUEST_REASONS)[number];

export const EDITORIAL_REVIEW_REQUEST_STATUSES = [
  "pending_review",
  "in_review",
  "needs_user_clarification",
  "accepted_for_workup",
  "rejected",
  "archived",
] as const;

export type EditorialReviewRequestStatus =
  (typeof EDITORIAL_REVIEW_REQUEST_STATUSES)[number];

export const EDITORIAL_REVIEW_REQUEST_ACTIONS = [
  "assign",
  "unassign",
  "add_note",
  "mark_in_review",
  "needs_user_clarification",
  "accept_for_workup",
  "reject",
  "archive",
] as const;

export type EditorialReviewRequestAction =
  (typeof EDITORIAL_REVIEW_REQUEST_ACTIONS)[number];

export type EditorialReviewRequestActivityAction =
  | EditorialReviewRequestAction
  | "user_replied";

export type EditorialReviewRequestReply = {
  id: string;
  text: string;
  createdAt: string;
  userId?: string | null;
};

export type EditorialReviewRequestHistoryEntry = {
  id: string;
  action: EditorialReviewRequestActivityAction;
  actionLabel: string;
  byUserId: string;
  at: string;
  note: string | null;
  previousStatus: EditorialReviewRequestStatus;
  nextStatus: EditorialReviewRequestStatus;
  previousAssignedToUserId: string | null;
  nextAssignedToUserId: string | null;
};

export type EditorialReviewRequest = {
  id: string;
  sourceType: EditorialReviewRequestSourceType;
  sourceId?: string | null;
  userId?: string | null;
  originalText: string;
  normalizedText?: string | null;
  analysisRunId?: string | null;
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  reviewRecommended: boolean;
  verificationLabel: UserFacingVerificationLabel;
  noTruthPromotion: true;
  reason: EditorialReviewRequestReason;
  userNote?: string | null;
  status: EditorialReviewRequestStatus;
  statusNote?: string | null;
  reviewerNote?: string | null;
  userVisibleNote?: string | null;
  userReplies?: EditorialReviewRequestReply[];
  lastUserReplyAt?: string | null;
  clarificationResolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  noAutoPublish: true;
  noAutoGraphPromotion: true;
  noAutoDossier: true;
  noAutoAnlassraum: true;
  noAutoVote: true;
  assignedToUserId?: string | null;
  assignedAt?: string | null;
  assignedByUserId?: string | null;
  lastAction?: EditorialReviewRequestActivityAction | null;
  lastActionAt?: string | null;
  lastActionByUserId?: string | null;
  latestAction?: EditorialReviewRequestActivityAction | null;
  latestActionAt?: string | null;
  latestActionByUserId?: string | null;
  history?: EditorialReviewRequestHistoryEntry[];
};

export function getEditorialReviewStatusLabel(status: EditorialReviewRequestStatus) {
  switch (status) {
    case "pending_review":
      return "Zur manuellen Prüfung vorgemerkt";
    case "in_review":
      return "In Prüfung";
    case "needs_user_clarification":
      return "Rückfrage erforderlich";
    case "accepted_for_workup":
      return "Zur Weiterarbeit freigegeben";
    case "rejected":
      return "Abgelehnt";
    case "archived":
      return "Archiviert";
    default:
      return status;
  }
}

export function getEditorialReviewReasonLabel(reason: EditorialReviewRequestReason) {
  switch (reason) {
    case "relevance_gate_appeal":
      return "Nutzer-Einspruch";
    case "source_open":
      return "Quellenlage offen";
    case "provider_disagreement":
      return "Provider-Konflikt";
    case "fallback_used":
      return "Fallback verwendet";
    case "insufficient_independent_success":
      return "Unabhängige Gegenprobe fehlt";
    case "no_source_bluffing_failed":
      return "Quellenbezug nicht belastbar";
    case "moderation_required":
      return "Moderation erforderlich";
    case "editorial_escalation":
      return "Redaktionelle Eskalation";
    case "user_requested_review":
    default:
      return "Prüfung angefragt";
  }
}

export function getEditorialReviewSourceTypeLabel(sourceType: EditorialReviewRequestSourceType) {
  switch (sourceType) {
    case "start_draft":
      return "Start-Entwurf";
    case "create_analysis":
      return "Create-Analyse";
    case "factcheck_request":
      return "Factcheck-Anfrage";
    case "theme_suggestion":
      return "Themenvorschlag";
    case "round_draft":
      return "Runden-Entwurf";
    case "user_relevance_appeal":
      return "Relevanz-Einspruch";
    default:
      return sourceType;
  }
}

export function getEditorialReviewNextStepLabel(input: {
  sourceType: EditorialReviewRequestSourceType;
  status: EditorialReviewRequestStatus;
}) {
  if (input.status === "accepted_for_workup") {
    if (input.sourceType === "factcheck_request") return "Quellenprüfung vorbereiten";
    if (input.sourceType === "theme_suggestion") return "Manuell als Thema weiter vorbereiten";
    if (input.sourceType === "round_draft") return "Manuell als Anlassraum-Entwurf weiter vorbereiten";
    return "Manuell weiter bearbeiten";
  }
  if (input.status === "needs_user_clarification") return "Auf Rückmeldung warten";
  if (input.sourceType === "theme_suggestion") return "Themenzuschnitt prüfen";
  if (input.sourceType === "round_draft") return "Anlassraum-Entwurf prüfen";
  if (input.sourceType === "factcheck_request") return "Quellenprüfung vorbereiten";
  return "Manuell prüfen";
}

export function getEditorialReviewFilterLabel(filter: string) {
  switch (filter) {
    case "review_recommended":
      return "Prüfung empfohlen";
    case "source_open":
      return "Quellenlage offen";
    case "user_appeal":
      return "Nutzer-Einspruch";
    case "provider_conflict":
      return "Fallback/Provider-Konflikt";
    case "factcheck_requested":
      return "Factcheck angefragt";
    default:
      return "Alle";
  }
}

export function matchesEditorialReviewFilter(
  request: Pick<
    EditorialReviewRequest,
    "reason" | "sourceType" | "sourceSupport" | "reviewRecommended"
  >,
  filter: string,
) {
  switch (filter) {
    case "review_recommended":
      return request.reviewRecommended;
    case "source_open":
      return request.reason === "source_open" || request.sourceSupport === "none" || request.sourceSupport === "open";
    case "user_appeal":
      return request.reason === "relevance_gate_appeal";
    case "provider_conflict":
      return request.reason === "fallback_used" ||
        request.reason === "provider_disagreement" ||
        request.reason === "insufficient_independent_success";
    case "factcheck_requested":
      return request.sourceType === "factcheck_request";
    default:
      return true;
  }
}
