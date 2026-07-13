import type {
  AccountContributionHandoffCorrelationBasis,
  AccountContributionHandoffCorrelationStrength,
} from "@features/account/contributionHandoffCorrelationTypes";
import type {
  AccountUserScopedRuntimeLinkageStatus,
  AccountUserScopedRuntimeTruthLevel,
} from "@features/account/userScopedRuntimeLinkageTypes";
import { reviewQueueStateLabel } from "@/features/review/reviewSurfaceStatusLabels";

export function accountRuntimeLinkageStatusLabel(
  value: AccountUserScopedRuntimeLinkageStatus,
) {
  if (value === "linked") return "Belastbar verknüpft";
  if (value === "partially_linked") return "Teilweise verknüpft";
  if (value === "blocked_by_runtime_truth") return "Belastbare Anschlussdaten fehlen";
  if (value === "blocked_by_review") return "Durch Review blockiert";
  if (value === "blocked_by_provider") return "Durch Provider-Gate blockiert";
  if (value === "not_available") return "Noch nicht verfügbar";
  return "Noch nicht verknüpft";
}

export function accountRuntimeTruthLevelLabel(
  value: AccountUserScopedRuntimeTruthLevel,
) {
  if (value === "runtime_confirmed") return "Folge-Arbeitsstand belastbar";
  if (value === "output_readmodel") return "Output- oder Briefing-Arbeitsstand sichtbar";
  if (value === "participation_readmodel") return "Beteiligungs-Arbeitsstand sichtbar";
  if (value === "dossier_readmodel") return "Dossier-Arbeitsstand sichtbar";
  if (value === "review_readmodel") return "Review-Arbeitsstand gesichert";
  if (value === "ledger") return "Server-Arbeitsstand";
  return "Lokaler Arbeitsstand";
}

export function accountCorrelationStrengthLabel(
  value: AccountContributionHandoffCorrelationStrength,
) {
  if (value === "exact") return "Exakt verbunden";
  if (value === "strong") return "Belastbar verbunden";
  if (value === "partial") return "Teilweise verbunden";
  if (value === "suggested") return "Mögliche Verbindung";
  if (value === "blocked") return "Blockiert";
  return "Noch nicht verbunden";
}

export function accountCorrelationBasisLabel(
  value: AccountContributionHandoffCorrelationBasis | string,
) {
  if (value === "shared_id") return "Gemeinsame Kennung";
  if (value === "source_handoff_id") return "Explizite Handoff-Referenz";
  if (value === "source_draft_id") return "Explizite Draft-Referenz";
  if (value === "ledger_branch_id") return "Gemeinsamer Arbeitszweig";
  if (value === "provenance") return "Bestehende Herkunftsspur";
  if (value === "created_by_and_dossier_id") return "Dossier- und Nutzerkontext";
  if (value === "existing_review_context") return "Bestehender Review-Kontext";
  if (value === "existing_runtime_readmodel") return "Bestehender Folge-Arbeitsstand";
  if (value === "text_similarity_suggestion") return "Nur ähnliche Formulierung";
  return "Keine belastbare Basis";
}

export function createFlowTargetCarrierLabel(value: string) {
  if (value === "participation_space_runtime_record") return "Beteiligungsraum-Arbeitsstand";
  if (value === "dossier_runtime_record") return "Dossier-Arbeitsstand";
  return "Review-Handoff";
}

export function createFlowTransitionLabel(value: string) {
  if (value === "review_draft") return "Zur Prüfung vorbereitet";
  if (value === "candidate_only") return "Als Kandidat vorgemerkt";
  if (value === "planned_handoff") return "Für den nächsten Arbeitsstand vorgemerkt";
  if (value === "persisted_review_record") return "Review-Arbeitsstand gesichert";
  if (value === "missing_persistence_truth") return "Noch nicht serverseitig gesichert";
  if (value === "dossier_runtime_draft") return "Dossier-Arbeitsstand vorbereitet";
  if (value === "participation_space_runtime_draft")
    return "Beteiligungs-Arbeitsstand vorbereitet";
  if (value === "dossier_review_draft") return "Im Dossier-Review";
  if (value === "dossier_candidate") return "Als Dossier-Kandidat vorgemerkt";
  if (value === "dossier_handoff_prepared") return "Dossier-Handoff vorbereitet";
  if (value === "persisted_dossier_runtime_record") return "Dossier-Arbeitsstand gespeichert";
  if (value === "participation_candidate") return "Als Beteiligungsformat vorgeschlagen";
  if (value === "planned_not_active") return "Als nächster Arbeitsstand vorgemerkt";
  if (value === "missing_graph_runtime_truth") return "Graph-Anschluss noch offen";
  if (value === "branch_workspace_candidate") return "Als Workspace-Kandidat vorgemerkt";
  if (value === "missing_anlassraum_runtime_truth") return "Anlassraum-Anschluss noch offen";
  if (value === "needs_source_review") return "Quellenprüfung offen";
  if (value === "needs_factcheck_review") return "Factcheck-Fragen offen";
  if (value === "review_required") return "Review erforderlich";
  if (value === "not_published") return "Nicht veröffentlicht";
  if (value === "no_auto_publish") return "Keine Veröffentlichung";
  return "Noch nicht eingeordnet";
}

export function createFlowRuntimeStatusLabel(value: string | null | undefined) {
  if (!value || value === "missing_runtime_truth") return "Noch nicht belegt";
  if (value === "queued_for_review") return reviewQueueStateLabel(value);
  if (value === "draft") return "Entwurf";
  if (value === "created") return "Arbeitsstand erstellt";
  if (value === "published") return "Veröffentlicht";
  return "Noch nicht belegt";
}

export function createFlowProviderTruthLabel(value: string | null | undefined) {
  return value ?? "noch nicht belegt";
}

function createFlowOpenTruthLabel(value: string) {
  if (value === "missing_runtime_truth") return "belastbare Anschlussdaten fehlen";
  if (value === "provider_model_missing_runtime_truth")
    return "Provider- oder Modelldaten fehlen";
  if (value === "source_provenance_missing_runtime_truth")
    return "Quellenherkunft ist noch nicht belastbar";
  if (value === "material_extraction_missing_runtime_truth")
    return "Materialableitung ist noch nicht belastbar";
  if (value === "candidate_handoff_not_persisted")
    return "Handoff ist noch nicht serverseitig gesichert";
  if (value === "missing_dossier_runtime_truth")
    return "Dossier-Arbeitsstand ist noch nicht belegt";
  if (value === "missing_graph_runtime_truth") return "Graph-Anschluss ist noch offen";
  if (value === "missing_anlassraum_runtime_truth")
    return "Anlassraum-Anschluss ist noch offen";
  if (value === "missing_source_truth") return "Quellenhinweis ist noch offen";
  return "weitere Anschlussdaten offen";
}

export function createFlowOpenTruthListLabel(values: string[]) {
  return Array.from(new Set(values)).map(createFlowOpenTruthLabel).join(", ");
}
