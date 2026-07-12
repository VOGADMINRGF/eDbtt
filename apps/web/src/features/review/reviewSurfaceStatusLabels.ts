export function reviewQueueStateLabel(value: string | null | undefined): string {
  if (value === "queued_for_review") return "Zur Prüfung vorgemerkt";
  if (value === "in_review") return "In Prüfung";
  if (value === "needs_clarification") return "Klärung nötig";
  if (value === "review_ready") return "Bereit für Prüfung";
  if (value === "approval_required") return "Freigabe nötig";
  if (value === "publish_ready") return "Bereit für Freigabe";
  if (value === "approved") return "Freigabe erteilt";
  if (value === "archived") return "Archiviert";
  if (value === "draft") return "Entwurf";
  return "Noch offen";
}

export function preparationStatusLabel(value: string | null | undefined): string {
  if (value === "needs_clarification") return "Klärung nötig";
  if (value === "review_ready") return "Bereit für Prüfung";
  if (value === "publish_ready") return "Bereit für Freigabe";
  if (value === "scheduled_after_review") return "Nach Freigabe planbar";
  if (value === "active_or_published") return "Sichtbar oder historisch veröffentlicht";
  if (value === "archived") return "Archiviert";
  if (value === "failed") return "Technisch blockiert";
  if (value === "draft") return "Entwurf";
  return "Noch offen";
}

export function sourceFactcheckEnrichmentStatusLabel(value: string | null | undefined): string {
  if (value === "prepared") return "Vorbereitet";
  if (value === "needs_source_review") return "Quellenprüfung offen";
  if (value === "needs_factcheck_review") return "Factcheck-Fragen offen";
  if (value === "needs_feed_review") return "Feed-/Research-Hinweis offen";
  if (value === "blocked_by_provider") return "Provider blockiert";
  if (value === "blocked_by_cost_preflight") return "Kosten-/Providerprüfung offen";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Nur Readmodel";
}

export function dossierWorkspaceDecisionStatusLabel(value: string | null | undefined): string {
  if (value === "decision_preview") return "Entscheidungsvorschau";
  if (value === "needs_editorial_review") return "Redaktionelle Prüfung offen";
  if (value === "needs_source_review") return "Quellenprüfung offen";
  if (value === "needs_factcheck_review") return "Factcheck-Fragen offen";
  if (value === "needs_human_input") return "Menschliche Ergänzung offen";
  if (value === "blocked_by_provider") return "Provider blockiert";
  if (value === "blocked_by_missing_review") return "Review fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Nur Readmodel";
}

export function createHandoffReviewStateLabel(value: string | null | undefined): string {
  if (value === "clarification_required") return "Weitere Klärung nötig";
  if (value === "graph_review_required") return "Anschlüsse prüfen";
  if (value === "factcheck_candidate") return "Für Factcheck vorbereitet";
  if (value === "manual_review_required") return "Zur Prüfung eingereicht";
  if (value === "ready_for_confirmation") return "Bereit zur Freigabe";
  return "Entwurf";
}

export function dossierReviewStatusLabel(value: string | null | undefined): string {
  if (value === "draft") return "Entwurf";
  if (value === "needs_review") return "Review erforderlich";
  if (value === "approved") return "Freigegeben";
  if (value === "rejected") return "Abgelehnt";
  if (value === "published") return "Veröffentlicht";
  if (value === "archived") return "Archiviert";
  return value ?? "Noch offen";
}

export const REVIEW_SURFACE_GUARDRAILS = {
  reviewReadyNotApproved: "review_ready ist nicht approved",
  publishReadyNotPublished: "publish_ready ist nicht published",
  factcheckNoAutoRun:
    "Recherche startet nicht automatisch. Kein Factcheck-Siegel, keine DeepSearch und keine Kostenbuchung ohne weitere Bestätigung.",
} as const;
