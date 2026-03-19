export function statusForOutputPrepError(error: string): number {
  if (
    error === "invalid_anlassraum_id" ||
    error === "invalid_seed_id" ||
    error === "invalid_action" ||
    error === "invalid_status" ||
    error === "invalid_output_type" ||
    error === "invalid_review_state" ||
    error === "invalid_limit" ||
    error === "publish_target_required"
  ) {
    return 400;
  }

  if (
    error === "anlassraum_not_found" ||
    error === "output_seed_not_found" ||
    error === "output_seed_not_found_after_update"
  ) {
    return 404;
  }

  if (error === "forbidden_scope" || error === "actor_cannot_approve_prep") {
    return 403;
  }

  if (
    error === "seed_not_in_anlassraum" ||
    error === "output_seed_review_not_approved" ||
    error.startsWith("invalid_transition_from_status") ||
    error.startsWith("publish_gate_failed")
  ) {
    return 409;
  }

  return 400;
}
