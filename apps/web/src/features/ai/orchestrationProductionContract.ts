import {
  LEGACY_DIRECT_PROVIDER_ROUTES,
  ORCHESTRATION_ROUTE_CONTRACTS,
} from "@/features/ai/orchestrationRouteContract";
import {
  CREATE_ANALYZE_ORCHESTRATOR,
  CREATE_ANALYZE_SCHEMA_VERSION,
  CREATE_ANALYZE_STAGE_KEYS,
} from "@/features/create/analyzeBoundaryContract";

export type OrchestrationMainflowStepKind =
  | "mandatory_stage"
  | "mandatory_handoff"
  | "conditional_followup";

export type OrchestrationMainflowStepContract = {
  id: string;
  kind: OrchestrationMainflowStepKind;
  notes: string;
};

export const ORCHESTRATION_MAINFLOW_STEP_CONTRACTS: readonly OrchestrationMainflowStepContract[] = [
  {
    id: "intake",
    kind: "mandatory_stage",
    notes: "Input-Aufnahme im strict-staged Hauptpfad.",
  },
  {
    id: "analyze_quality",
    kind: "mandatory_stage",
    notes: "Analyse-/Qualitaetsstufe mit review_required-Option.",
  },
  {
    id: "graph_match",
    kind: "mandatory_stage",
    notes: "Graph-Match als staged Pflichtstufe vor CTA-Handoff.",
  },
  {
    id: "cta_handoff",
    kind: "mandatory_handoff",
    notes: "Konservativer CTA-Handoff mit no-auto-publish/no-silent-merge.",
  },
  {
    id: "factcheck_review_connection",
    kind: "conditional_followup",
    notes: "Pruef-/Review-Anschluss bleibt transparent und auditierbar.",
  },
  {
    id: "dossier_finding_open_questions_connection",
    kind: "conditional_followup",
    notes: "Dossier-/Finding-/offene-Fragen-Anschluss ohne impliziten Vollzug.",
  },
] as const;

export const ORCHESTRATION_BOUNDARY_REQUIRED_FIELDS = [
  "schemaVersion",
  "orchestrator",
  "runId",
  "inputRef",
  "createdAt",
  "phases",
  "matchSourceState",
  "noAutoPublish",
  "noSilentMerge",
  "provenanceRefs",
] as const;

export const ORCHESTRATION_ENVELOPE_SYNC_REQUIREMENTS = [
  "meta.runId must equal createAnalyze.runId",
  "providerMatrix only accepted when runId matches",
  "degraded remains visible in envelope and createAnalyze.matchSourceState",
] as const;

export const ORCHESTRATION_PROVIDER_OPERATIONAL_BASELINE = {
  schemaVersion: "orchestration_operational.v1",
  stagedMainflow: {
    route: "/api/contributions/analyze",
    wrapperRoute: "/api/create/analyze",
    primaryClass: "orchestrated_reasoning_generalist",
    fallbackClass: "degraded_contract_response",
    providerAllowlistEnv: "E150_PROVIDER_ALLOWLIST",
  },
  directExceptionPolicy: {
    allowedRoutes: LEGACY_DIRECT_PROVIDER_ROUTES,
    cannotOverrideStagedMainflow: true as const,
    requiresExplicitExceptionContract: true as const,
  },
  boundaryContract: {
    schemaVersion: CREATE_ANALYZE_SCHEMA_VERSION,
    orchestrator: CREATE_ANALYZE_ORCHESTRATOR,
    requiredFields: ORCHESTRATION_BOUNDARY_REQUIRED_FIELDS,
    stageKeys: CREATE_ANALYZE_STAGE_KEYS,
  },
  envelopeContract: {
    requiredSyncRules: ORCHESTRATION_ENVELOPE_SYNC_REQUIREMENTS,
  },
} as const;

export function isStagedMainflowRoute(route: string): boolean {
  return ORCHESTRATION_ROUTE_CONTRACTS.some(
    (entry) => entry.route === route && entry.mode !== "legacy_direct_provider_exception",
  );
}

export function isOrchestrationExceptionRoute(route: string): boolean {
  return LEGACY_DIRECT_PROVIDER_ROUTES.includes(route);
}
