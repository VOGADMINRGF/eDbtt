export function mapGovernanceContractError(error: unknown) {
  const message = error instanceof Error ? error.message : "contract_action_failed";

  if (message === "invalid_contract_id" || message === "invalid_anlassraum_id" || message === "invalid_dossier_target") {
    return { status: 400, error: message };
  }

  if (message === "contract_not_found" || message === "anlassraum_not_found") {
    return { status: 404, error: message };
  }

  if (message === "contract_backfill_requires_change") {
    return { status: 400, error: message };
  }

  if (
    message === "contract_missing_target_dossier" ||
    message === "contract_rejected" ||
    message === "contract_already_applied" ||
    message === "contract_already_rejected" ||
    message === "contract_already_handed_off"
  ) {
    return { status: 409, error: message };
  }

  if (
    message === "actor_scope_forbidden" ||
    message === "actor_scope_requires_anlassraum" ||
    message === "forbidden_scope"
  ) {
    return { status: 403, error: message };
  }

  if (message === "unauthorized") {
    return { status: 401, error: message };
  }

  return { status: 400, error: message };
}
