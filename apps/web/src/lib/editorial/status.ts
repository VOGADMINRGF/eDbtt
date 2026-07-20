export type EditorialStatus = "pending" | "approved" | "rejected" | "needs_review" | "unknown";

export type EditorialStatusInput = {
  reviewStatus?: string | null;
  redaktionFreigabe?: boolean | null;
  reviewed?: boolean | null;
  moderationReviewed?: boolean | null;
};

const STATUS_LABELS: Record<EditorialStatus, string> = {
  pending: "offen",
  approved: "geprüft",
  rejected: "abgelehnt",
  needs_review: "umstritten",
  unknown: "unbekannt",
};

const APPROVED = new Set(["approved", "geprueft", "geprüft", "freigegeben", "ok", "review_ok"]);
const REJECTED = new Set(["rejected", "abgelehnt"]);
const PENDING = new Set(["pending", "queued", "in-review", "review", "offen", "ausstehend", "unbestaetigt", "fehlt"]);
const NEEDS_REVIEW = new Set(["umstritten", "needs_review"]);

const REVIEW_REQUIRED_ACTION_TYPES = new Set([
  "manual_factcheck_submit",
  "manual_factcheck_update",
  "mandate_update_submit",
  "mandate_risk_submit",
  "mandate_responsibility_submit",
  "mandate_impact_submit",
]);

export function resolveEditorialFeedbackReviewStatus(
  actionType: string,
): "pending" | undefined {
  const normalized = actionType.trim().toLowerCase();
  return REVIEW_REQUIRED_ACTION_TYPES.has(normalized) ? "pending" : undefined;
}


export function resolveEditorialStatus(input: EditorialStatusInput): EditorialStatus {
  if (input.redaktionFreigabe === true) return "approved";

  const raw = (input.reviewStatus ?? "").trim().toLowerCase();
  if (raw) {
    if (APPROVED.has(raw)) return "approved";
    if (REJECTED.has(raw)) return "rejected";
    if (NEEDS_REVIEW.has(raw)) return "needs_review";
    if (PENDING.has(raw)) return "pending";
  }

  if (input.reviewed === true || input.moderationReviewed === true) return "approved";
  if (input.reviewed === false || input.moderationReviewed === false) return "pending";

  return "unknown";
}

export function formatEditorialStatus(input: EditorialStatusInput): {
  status: EditorialStatus;
  label: string;
} {
  const status = resolveEditorialStatus(input);
  return { status, label: STATUS_LABELS[status] };
}
