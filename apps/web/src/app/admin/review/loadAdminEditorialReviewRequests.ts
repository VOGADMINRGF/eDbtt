import {
  listEditorialReviewRequests,
  matchesEditorialReviewFilter,
} from "@features/editorialReviewQueue";

export const ADMIN_EDITORIAL_FILTER_OPTIONS = [
  "all",
  "review_recommended",
  "source_open",
  "user_appeal",
  "provider_conflict",
  "factcheck_requested",
] as const;

export async function loadAdminEditorialReviewRequests(editorialFilter: string) {
  return (
    await listEditorialReviewRequests({
      statuses: [
        "pending_review",
        "in_review",
        "needs_user_clarification",
        "accepted_for_workup",
        "rejected",
      ],
      limit: 80,
    })
  ).filter((request) => matchesEditorialReviewFilter(request, editorialFilter));
}
