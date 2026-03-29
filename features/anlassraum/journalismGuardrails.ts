import type { AnlassraumOriginType } from "@features/anlassraum/types";

export type JournalismAnchorRole = "journalistic_start_context" | "standard_context";

export type JournalismTruthGuardrailsContract = {
  sourceAnchorContext: boolean;
  anchorRole: JournalismAnchorRole;
  allowsWorkflowAccelerationOnly: boolean;
  deniesTruthPrivilege: true;
  deniesPriorityPrivilege: true;
  deniesFactcheckStatusDerivation: true;
  deniesFindingStatusDerivation: true;
  deniesDossierStatusDerivation: true;
  requiresOpenQuestions: true;
  requiresCounterPerspectives: true;
  requiresAuditTrail: true;
  allowsFactcheckQueueConnection: true;
  allowsReviewQueueConnection: true;
  allowsDossierConnection: true;
  forbiddenInferences: readonly string[];
  allowedStrengths: readonly string[];
};

export const JOURNALISM_FORBIDDEN_INFERENCES = [
  "truth_status_from_anchor",
  "priority_weight_from_media_status",
  "factcheck_status_from_anchor",
  "finding_status_from_anchor",
  "dossier_status_from_anchor",
] as const;

export const JOURNALISM_ALLOWED_STRENGTHS = [
  "anlass_ausloesen",
  "debatten_strukturieren",
  "dossier_anstossen",
  "fragen_buendeln",
  "pruefpfade_sichtbar_machen",
  "regionale_und_ueberregionale_anschlussfaehigkeit_staerken",
] as const;

function normalizeOriginType(value: unknown): AnlassraumOriginType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "manual") return "manual";
  if (normalized === "feed") return "feed";
  if (normalized === "source_anchor" || normalized === "source-anchor") return "source_anchor";
  if (normalized === "community") return "community";
  if (normalized === "event") return "event";
  if (normalized === "official") return "official";
  if (normalized === "tip") return "tip";
  if (normalized === "system") return "system";
  return null;
}

export function resolveJournalismTruthGuardrails(
  input: { originType: unknown },
): JournalismTruthGuardrailsContract {
  const originType = normalizeOriginType(input.originType);
  const sourceAnchorContext = originType === "source_anchor";

  return {
    sourceAnchorContext,
    anchorRole: sourceAnchorContext ? "journalistic_start_context" : "standard_context",
    allowsWorkflowAccelerationOnly: sourceAnchorContext,
    deniesTruthPrivilege: true,
    deniesPriorityPrivilege: true,
    deniesFactcheckStatusDerivation: true,
    deniesFindingStatusDerivation: true,
    deniesDossierStatusDerivation: true,
    requiresOpenQuestions: true,
    requiresCounterPerspectives: true,
    requiresAuditTrail: true,
    allowsFactcheckQueueConnection: true,
    allowsReviewQueueConnection: true,
    allowsDossierConnection: true,
    forbiddenInferences: JOURNALISM_FORBIDDEN_INFERENCES,
    allowedStrengths: JOURNALISM_ALLOWED_STRENGTHS,
  };
}
