export function statusForFeedReviewError(error: string): number {
  if (
    error === "invalid_action" ||
    error === "invalid_body" ||
    error === "invalid_id" ||
    error === "invalid_draft_id" ||
    error === "invalid_anlassraum_id" ||
    error === "draft_ids_required" ||
    error === "too_many_draft_ids" ||
    error === "anlassraum_id_required" ||
    error === "owner_id_required"
  ) {
    return 400;
  }
  if (
    error === "draft_not_found" ||
    error === "candidate_not_found" ||
    error === "analyze_result_not_found" ||
    error === "anlassraum_not_found"
  ) {
    return 404;
  }
  if (
    error === "actor_scope_forbidden" ||
    error === "forbidden_scope" ||
    error === "forbidden_legacy_backfill_requires_admin"
  ) {
    return 403;
  }
  if (
    error === "candidate_already_attached_other_anlassraum" ||
    error === "draft_already_has_anlassraum"
  ) {
    return 409;
  }
  return 400;
}
