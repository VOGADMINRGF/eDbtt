import type { V3DeepsearchCostGovernanceArea } from "@/features/admin/v3DeepsearchCostGovernanceReadModel";
import { MATERIAL_EXTRACTION_COST_GUARDS } from "@/features/material/materialExtractionJobs";

export const V3_DEEPSEARCH_CONSUMPTION_TRUTH_REAL_HREFS = [
  "/admin",
  "/admin/review",
  "/admin/feeds",
  "/admin/telemetry/ai",
  "/admin/telemetry/ai/usage",
  "/admin/telemetry/ai/orchestrator",
  "/admin/pricing/orders",
  "/admin/entitlements",
  "/pricing",
  "/atlas/social-review",
] as const;

export type V3DeepsearchConsumptionTruthHref =
  (typeof V3_DEEPSEARCH_CONSUMPTION_TRUTH_REAL_HREFS)[number];

export const V3_DEEPSEARCH_CONSUMPTION_FIELD_STATUSES = [
  "estimated_only",
  "recorded_usage",
  "credit_debit",
  "review_required",
  "not_required",
  "blocked_by_limit",
  "not_blocked",
  "missing_runtime_truth",
  "resolved_for_scope",
  "not_applicable",
] as const;

export type V3DeepsearchConsumptionFieldStatus =
  (typeof V3_DEEPSEARCH_CONSUMPTION_FIELD_STATUSES)[number];

export type V3DeepsearchConsumptionTruthField = {
  status: V3DeepsearchConsumptionFieldStatus;
  detail: string;
};

export type V3DeepsearchConsumptionTruthOperation = {
  id:
    | "analyze_run_receipt"
    | "factcheck_deep_research_job"
    | "material_extraction_job"
    | "admin_orchestrator_smoke_run"
    | "ai_usage_event_snapshot"
    | "export_distribution_item";
  area: V3DeepsearchCostGovernanceArea;
  label: string;
  runtimeRecord: string;
  currentReality: string;
  correlationKeys: string[];
  correlationTruth: string;
  hasAiUsageEvent: V3DeepsearchConsumptionTruthField;
  hasRunCorrelation: V3DeepsearchConsumptionTruthField;
  hasJobCorrelation: V3DeepsearchConsumptionTruthField;
  hasDossierCorrelation: V3DeepsearchConsumptionTruthField;
  hasOrgOrUserScope: V3DeepsearchConsumptionTruthField;
  hasCostEstimate: V3DeepsearchConsumptionTruthField;
  hasRecordedUsage: V3DeepsearchConsumptionTruthField;
  hasRunLinkage: V3DeepsearchConsumptionTruthField;
  hasJobLinkage: V3DeepsearchConsumptionTruthField;
  hasUsageLinkage: V3DeepsearchConsumptionTruthField;
  hasCreditDebit: V3DeepsearchConsumptionTruthField;
  estimatedCost: V3DeepsearchConsumptionTruthField;
  recordedUsage: V3DeepsearchConsumptionTruthField;
  creditDebit: V3DeepsearchConsumptionTruthField;
  reviewRequired: V3DeepsearchConsumptionTruthField;
  blockedByLimit: V3DeepsearchConsumptionTruthField;
  missingRuntimeTruth: V3DeepsearchConsumptionTruthField;
  existingGates: string[];
  repoEvidence: string[];
  tests: string[];
  adminHref?: V3DeepsearchConsumptionTruthHref;
  publicHref?: V3DeepsearchConsumptionTruthHref;
  nextSliceId: string;
  operationalTruth: "operational_basic";
};

export type V3DeepsearchConsumptionTruthReadModel = {
  generatedAt: string;
  sectionStatus: "operational_basic";
  summary: {
    totalOperations: number;
    aiUsageEventOperations: number;
    runCorrelatedOperations: number;
    jobCorrelatedOperations: number;
    dossierCorrelatedOperations: number;
    orgOrUserScopedOperations: number;
    costEstimateOperations: number;
    recordedUsageTruthOperations: number;
    runLinkedOperations: number;
    jobLinkedOperations: number;
    usageLinkedOperations: number;
    creditLinkedOperations: number;
    estimatedOnlyOperations: number;
    recordedUsageOperations: number;
    creditDebitOperations: number;
    reviewRequiredOperations: number;
    blockedByLimitOperations: number;
    missingRuntimeTruthOperations: number;
  };
  semantics: V3DeepsearchConsumptionFieldStatus[];
  operations: V3DeepsearchConsumptionTruthOperation[];
  openTruths: Array<{
    label: string;
    nextSliceId: string;
    reason: string;
  }>;
  guardrails: string[];
};

export const V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID =
  "V3-DEEPSEARCH-AI-USAGE-CORRELATION-04";

export const V3_DEEPSEARCH_DEBIT_TRUTH_SLICE_ID =
  "V3-DEEPSEARCH-DEBIT-TRUTH-05";

export const V3_DEEPSEARCH_CROSS_SURFACE_USAGE_WRITERS_SLICE_ID =
  "V3-DEEPSEARCH-CROSS-SURFACE-USAGE-WRITERS-06";

const GLOBAL_GUARDRAILS = [
  "Keine neue Billing-Runtime",
  "Keine Fake-Verbrauchsdaten",
  "Keine automatische Recherche oder Distribution",
  "Review-first bleibt verbindlich",
] as const;

function countByField(
  operations: V3DeepsearchConsumptionTruthOperation[],
  field:
    | "hasAiUsageEvent"
    | "hasRunCorrelation"
    | "hasJobCorrelation"
    | "hasDossierCorrelation"
    | "hasOrgOrUserScope"
    | "hasCostEstimate"
    | "hasRecordedUsage"
    | "hasRunLinkage"
    | "hasJobLinkage"
    | "hasUsageLinkage"
    | "hasCreditDebit"
    | "estimatedCost"
    | "recordedUsage"
    | "creditDebit"
    | "reviewRequired"
    | "blockedByLimit"
    | "missingRuntimeTruth",
  status: V3DeepsearchConsumptionFieldStatus,
) {
  return operations.filter((operation) => operation[field].status === status).length;
}

export function buildV3DeepsearchConsumptionTruthReadModel(): V3DeepsearchConsumptionTruthReadModel {
  const operations: V3DeepsearchConsumptionTruthOperation[] = [
    {
      id: "analyze_run_receipt",
      area: "research",
      label: "Create / Analyze Run Receipt",
      runtimeRecord: "RunReceipt",
      currentReality:
        "Analyze speichert einen Run Receipt fuer Provenance und Output-Nachvollziehbarkeit; AI Usage kann jetzt optionale Run-/Operation-/Dossier-Korrelation tragen, aber Debit-Wahrheit fehlt weiter.",
      correlationKeys: ["runId", "operationId", "dossierId", "userId", "receipt.id", "receiptHash", "snapshotId"],
      correlationTruth:
        "runId existiert im Analyze-Contract; AI Usage kann denselben Run sowie optionale Dossier-/User-Kontexte lesen, waehrend der persistierte Receipt weiter Hash-/Snapshot-Wahrheit statt Debit speichert.",
      hasAiUsageEvent: {
        status: "resolved_for_scope",
        detail: "Analyze laeuft ueber den E150-Orchestrator und schreibt recorded AI Usage pro Provider-Outcome.",
      },
      hasRunCorrelation: {
        status: "resolved_for_scope",
        detail: "runId wird aus dem Analyze-Contract in AI Usage uebernommen.",
      },
      hasJobCorrelation: {
        status: "not_applicable",
        detail: "Der Analyze-Receipt bleibt ein Run-Pfad ohne fachliches Job-Dokument.",
      },
      hasDossierCorrelation: {
        status: "resolved_for_scope",
        detail: "dossierId wird optional aus der Analyze-Anfrage in AI Usage uebernommen, wenn der Request diesen Kontext real fuehrt.",
      },
      hasOrgOrUserScope: {
        status: "resolved_for_scope",
        detail: "userId wird aus dem Request uebernommen, sobald ein Nutzerkontext real vorhanden ist.",
      },
      hasCostEstimate: {
        status: "missing_runtime_truth",
        detail: "Analyze fuehrt keine per-run Kostenschaetzung als kanonische Runtime-Wahrheit.",
      },
      hasRecordedUsage: {
        status: "recorded_usage",
        detail: "AI Usage zeichnet Tokens, costEur und Erfolgsstatus jetzt pro Analyze-Run mit optionaler Korrelation auf.",
      },
      hasRunLinkage: {
        status: "resolved_for_scope",
        detail: "Analyze fuehrt runId im Contract; der Receipt bleibt davon getrennte Provenance-Wahrheit.",
      },
      hasJobLinkage: {
        status: "not_applicable",
        detail: "Der Analyze-Receipt ist ein Run-Pfad, kein Job-Pfad.",
      },
      hasUsageLinkage: {
        status: "resolved_for_scope",
        detail: "AI Usage kann runId, operationId und optional dossierId aus dem Analyze-Pfad jetzt kanonisch mitfuehren.",
      },
      hasCreditDebit: {
        status: "missing_runtime_truth",
        detail: "Am Analyze-Run existiert kein echter Credit-/Debit-Beleg.",
      },
      estimatedCost: {
        status: "missing_runtime_truth",
        detail: "Im Run Receipt wird keine geschaetzte Kostenwahrheit gespeichert.",
      },
      recordedUsage: {
        status: "recorded_usage",
        detail: "Recorded usage liegt in AI Usage vor; der Receipt selbst bleibt davon getrennte Provenance-Wahrheit.",
      },
      creditDebit: {
        status: "missing_runtime_truth",
        detail: "Es gibt keinen Credit-/Debit-Eintrag am Analyze-Run.",
      },
      reviewRequired: {
        status: "not_required",
        detail: "Der Receipt selbst ist Provenance, nicht ein reviewpflichtiger Kostenfreigabeschritt.",
      },
      blockedByLimit: {
        status: "not_blocked",
        detail: "Der Basis-Analyze-Run wird nicht als kreditgebundener Debit-Lauf blockiert.",
      },
      missingRuntimeTruth: {
        status: "missing_runtime_truth",
        detail: "Run-/Usage-Korrelation ist jetzt sichtbar, aber Credit-/Debit- und Settlement-Wahrheit fehlen weiterhin.",
      },
      existingGates: [
        "Run Receipt sichert Input-/Source-/Output-Hashes",
        "Research-Entitlement-Gate bleibt getrennt vom Basis-Analyze-Receipt",
      ],
      repoEvidence: [
        "apps/web/src/app/api/contributions/analyze/route.ts",
        "apps/web/src/lib/db/runReceiptsRepo.ts",
        "features/analyze/runReceipt.ts",
      ],
      tests: [
        "apps/web/tests/orchestration-production-contract.test.ts",
        "apps/web/tests/create-analyze-entitlement-gate.route.test.ts",
      ],
      adminHref: "/admin/telemetry/ai",
      nextSliceId: V3_DEEPSEARCH_DEBIT_TRUTH_SLICE_ID,
      operationalTruth: "operational_basic",
    },
    {
      id: "factcheck_deep_research_job",
      area: "research",
      label: "Factcheck / Deep Research Job",
      runtimeRecord: "FactcheckJobDoc",
      currentReality:
        "Factcheck-/Deep-Research-Anfragen erhalten bereits eine belastbare Job-Korrelation und harte Gates, aber keine debitierbare Verbrauchszeile.",
      correlationKeys: ["jobId", "dossierId", "organizationId", "regionId", "userId"],
      correlationTruth:
        "Der Job ist ueber Job-, Nutzer-, Dossier- und Organisationskontext sichtbar; Kosten- und Debit-Wahrheit werden daran noch nicht gekoppelt.",
      hasAiUsageEvent: {
        status: "missing_runtime_truth",
        detail: "Der Factcheck-/Deep-Research-Job erzeugt heute noch keine kanonisch korrelierten AI-Usage-Events.",
      },
      hasRunCorrelation: {
        status: "not_applicable",
        detail: "Factcheck nutzt heute Job-Wahrheit statt runId-basierter Laufwahrheit.",
      },
      hasJobCorrelation: {
        status: "resolved_for_scope",
        detail: "jobId ist am Factcheck-Job belastbar vorhanden.",
      },
      hasDossierCorrelation: {
        status: "resolved_for_scope",
        detail: "dossierId ist bereits Teil des Factcheck-Job-Kontexts.",
      },
      hasOrgOrUserScope: {
        status: "resolved_for_scope",
        detail: "organizationId, regionId und userId werden am Job bereits sichtbar gefuehrt.",
      },
      hasCostEstimate: {
        status: "missing_runtime_truth",
        detail: "Vor dem Start wird keine per-job Kostenschaetzung gespeichert.",
      },
      hasRecordedUsage: {
        status: "missing_runtime_truth",
        detail: "Es existiert keine recorded_usage-Zeile pro Factcheck-Job.",
      },
      hasRunLinkage: {
        status: "not_applicable",
        detail: "Factcheck nutzt heute eine Job-Wahrheit, keinen separaten runId-Pfad.",
      },
      hasJobLinkage: {
        status: "resolved_for_scope",
        detail: "jobId, dossierId, organizationId, regionId und userId sind bereits im Job-Dokument sichtbar.",
      },
      hasUsageLinkage: {
        status: "missing_runtime_truth",
        detail: "Der Job verlinkt noch nicht auf recorded_usage-Events oder Token-/Kostenbelege.",
      },
      hasCreditDebit: {
        status: "missing_runtime_truth",
        detail: "Pricing-Gates entscheiden vor dem Lauf, schreiben aber keinen Debit-Beleg.",
      },
      estimatedCost: {
        status: "missing_runtime_truth",
        detail: "Vor dem Start wird keine per-job Kostenschaetzung gespeichert.",
      },
      recordedUsage: {
        status: "missing_runtime_truth",
        detail: "Der Factcheck-Job speichert keine recorded_usage mit Tokens oder Kosten.",
      },
      creditDebit: {
        status: "missing_runtime_truth",
        detail: "Pricing-/Entitlement-Gates blocken oder erlauben, erzeugen aber keinen Debit-Eintrag.",
      },
      reviewRequired: {
        status: "review_required",
        detail: "Deep Research bleibt bestaetigungs- und review-first.",
      },
      blockedByLimit: {
        status: "blocked_by_limit",
        detail: "Login-, Entitlement-, Pricing- und Confirm-Gates koennen den Lauf vor Start blockieren.",
      },
      missingRuntimeTruth: {
        status: "missing_runtime_truth",
        detail: "Erlaubnis- und Blocklogik ist stark, echter Verbrauch pro Job bleibt unverbunden.",
      },
      existingGates: [
        "login_required",
        "entitlement_required",
        "pricing_required",
        "confirmation_required",
        "noSilentCost",
      ],
      repoEvidence: [
        "features/factcheck/entitlementGate.ts",
        "apps/web/src/app/api/factcheck/enqueue/route.ts",
        "apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts",
      ],
      tests: [
        "apps/web/tests/factcheck-entitlement-gate.contract.test.ts",
        "apps/web/tests/factcheck-enqueue.auth.route.test.ts",
        "apps/web/tests/create-analyze-entitlement-gate.route.test.ts",
      ],
      adminHref: "/admin/review",
      publicHref: "/pricing",
      nextSliceId: V3_DEEPSEARCH_CROSS_SURFACE_USAGE_WRITERS_SLICE_ID,
      operationalTruth: "operational_basic",
    },
    {
      id: "material_extraction_job",
      area: "material_extraction",
      label: "Material Extraction Job",
      runtimeRecord: "MaterialExtractionJob",
      currentReality:
        "Material-Extraktionsjobs tragen bereits Job-, Material-, Dossier-, Organisations- und Review-Kontext, aber keine per-job Verbrauchsabrechnung.",
      correlationKeys: ["job.id", "materialId", "dossierId", "organizationId", "regionId", "submittedBy"],
      correlationTruth:
        "Job-Korrelation und Review-Handoffs sind belastbar, Kostenwahrheit bleibt auf Guardrail-Status statt auf Verbrauch.",
      hasAiUsageEvent: {
        status: "missing_runtime_truth",
        detail: "Material-Extraktionsjobs schreiben heute keine kanonisch korrelierten AI-Usage-Events.",
      },
      hasRunCorrelation: {
        status: "not_applicable",
        detail: "Material Extraction nutzt heute Job- statt Run-Korrelation.",
      },
      hasJobCorrelation: {
        status: "resolved_for_scope",
        detail: "job.id ist fuer Material Extraction belastbar vorhanden.",
      },
      hasDossierCorrelation: {
        status: "resolved_for_scope",
        detail: "dossierId ist bereits Teil des Material-Job-Kontexts.",
      },
      hasOrgOrUserScope: {
        status: "resolved_for_scope",
        detail: "organizationId, regionId und submittedBy werden am Job bereits sichtbar gefuehrt.",
      },
      hasCostEstimate: {
        status: "missing_runtime_truth",
        detail: "Der Job speichert Guardrails und Freigabe, aber keine geschaetzte Kostenzeile.",
      },
      hasRecordedUsage: {
        status: "missing_runtime_truth",
        detail: "Es existiert keine recorded_usage-Zeile pro Material-Job.",
      },
      hasRunLinkage: {
        status: "not_applicable",
        detail: "Material Extraction nutzt heute Job- statt Run-Korrelation.",
      },
      hasJobLinkage: {
        status: "resolved_for_scope",
        detail: "Job-, Material-, Dossier-, Organisations- und Review-Kontext sind im Job-Dokument vorhanden.",
      },
      hasUsageLinkage: {
        status: "missing_runtime_truth",
        detail: "Material-Jobs verweisen nicht auf recorded_usage oder providerseitige Verbrauchszeilen.",
      },
      hasCreditDebit: {
        status: "missing_runtime_truth",
        detail: "Cost Guards blocken oder verlangen Freigabe, erzeugen aber keinen Debit-Beleg.",
      },
      estimatedCost: {
        status: "missing_runtime_truth",
        detail: "Der Job speichert Cost Guard und Freigabepflicht, aber keine geschaetzte Kostenzeile.",
      },
      recordedUsage: {
        status: "missing_runtime_truth",
        detail: "Es wird bewusst kein externer Usage- oder Provider-Verbrauch pro Job verbucht.",
      },
      creditDebit: {
        status: "missing_runtime_truth",
        detail: "Es gibt keinen Credit-/Debit-Abzug am Material-Job.",
      },
      reviewRequired: {
        status: "review_required",
        detail: "Extraktionspfade und Handoffs bleiben review-first.",
      },
      blockedByLimit: {
        status: "blocked_by_limit",
        detail: "blocked bzw. requires_approval verhindert teurere Extraktion ohne bewusste Freigabe.",
      },
      missingRuntimeTruth: {
        status: "missing_runtime_truth",
        detail: "Approval- und Blockwahrheit ist vorhanden; Verbrauchs- und Debit-Wahrheit fehlt weiter.",
      },
      existingGates: [
        `Cost Guards: ${MATERIAL_EXTRACTION_COST_GUARDS.join(", ")}`,
        "approveCost entscheidet ueber teurere Pfade",
        "noAutoDeepSearch",
        "noAutoPublish",
      ],
      repoEvidence: [
        "apps/web/src/features/material/materialExtractionJobs.ts",
        "apps/web/src/app/api/material/extraction-jobs/route.ts",
      ],
      tests: [
        "apps/web/tests/material-extraction-cost-guardrail.contract.test.ts",
        "apps/web/tests/material-extraction-review-first.contract.test.ts",
        "apps/web/tests/material-extraction-no-autopublish.contract.test.ts",
      ],
      adminHref: "/admin/feeds",
      nextSliceId: V3_DEEPSEARCH_CROSS_SURFACE_USAGE_WRITERS_SLICE_ID,
      operationalTruth: "operational_basic",
    },
    {
      id: "admin_orchestrator_smoke_run",
      area: "ai_usage",
      label: "Admin Orchestrator Smoke Run",
      runtimeRecord: "AdminAiRunRecord / ProviderDiagnostic",
      currentReality:
        "Admin-Orchestrator-Smokes haben bereits runId/correlationId und eine echte Kostenschaetzung aus Tokens; AI Usage kann diese Runs jetzt optional korrelieren, waehrend Debit-Wahrheit weiter fehlt.",
      correlationKeys: ["runId", "correlationId", "operationId", "operationType", "userId", "mode", "provider", "model"],
      correlationTruth:
        "Die Admin-Diagnostik hat die sauberste Run-Korrelation im Repo; AI Usage kann dieselbe runId/correlationId jetzt mittragen, bleibt aber absichtlich keine Billing- oder Produktionsdebit-Wahrheit.",
      hasAiUsageEvent: {
        status: "resolved_for_scope",
        detail: "Der Orchestrator-Smoke schreibt recorded AI Usage fuer seine Provider-Outcomes.",
      },
      hasRunCorrelation: {
        status: "resolved_for_scope",
        detail: "runId wird aus dem Admin-Smoke in AI Usage uebernommen.",
      },
      hasJobCorrelation: {
        status: "not_applicable",
        detail: "Der Admin-Smoke ist ein Diagnose-Run ohne fachliches Job-Dokument.",
      },
      hasDossierCorrelation: {
        status: "not_applicable",
        detail: "Der Admin-Smoke fuehrt bewusst keinen Dossier-Kontext.",
      },
      hasOrgOrUserScope: {
        status: "resolved_for_scope",
        detail: "userId aus dem Admin-Gate kann in AI Usage mitgefuehrt werden.",
      },
      hasCostEstimate: {
        status: "estimated_only",
        detail: "estimatedCostEur/USD wird aus Tokens und Pricing-Quelle abgeleitet.",
      },
      hasRecordedUsage: {
        status: "recorded_usage",
        detail: "Die Provider-Outcomes schreiben recorded usage; die gruppierte Admin-Run-Sicht bleibt davon getrennt.",
      },
      hasRunLinkage: {
        status: "resolved_for_scope",
        detail: "runId und correlationId werden im Admin-Smoke bereits konsistent gefuehrt.",
      },
      hasJobLinkage: {
        status: "not_applicable",
        detail: "Der Admin-Smoke ist ein Diagnose-Run ohne fachliches Job-Dokument.",
      },
      hasUsageLinkage: {
        status: "resolved_for_scope",
        detail: "AI Usage kann runId, operationId und userId aus dem Admin-Smoke jetzt kanonisch mitfuehren.",
      },
      hasCreditDebit: {
        status: "missing_runtime_truth",
        detail: "Admin-Smokes sind Diagnose und schreiben bewusst keinen Debit-Beleg.",
      },
      estimatedCost: {
        status: "estimated_only",
        detail: "estimatedCostEur/USD wird aus Tokens und Pricing-Quelle abgeleitet.",
      },
      recordedUsage: {
        status: "recorded_usage",
        detail: "Recorded usage liegt in AI Usage vor; die gruppierte Admin-Run-Sicht bleibt davon getrennt.",
      },
      creditDebit: {
        status: "missing_runtime_truth",
        detail: "Admin-Smokes erzeugen keinen Credit-/Debit-Fluss.",
      },
      reviewRequired: {
        status: "not_required",
        detail: "Der Smoke-Run ist Diagnose, keine reviewpflichtige Publishing- oder Research-Freigabe.",
      },
      blockedByLimit: {
        status: "not_blocked",
        detail: "Es gibt Budgetprofile und Cost Groups, aber keinen echten Debit- oder Limitabzug.",
      },
      missingRuntimeTruth: {
        status: "missing_runtime_truth",
        detail: "Run-/Usage-Korrelation ist jetzt sichtbar, aber die Admin-Run-Sicht bleibt ohne Debit-/Settlement-Wahrheit.",
      },
      existingGates: [
        "estimateAiRunCost",
        "runId / correlationId",
        "Budgetprofile und RunCostGroup",
      ],
      repoEvidence: [
        "apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts",
        "apps/web/src/features/ai/adminTelemetryDiagnostics.ts",
        "apps/web/src/features/ai/adminTelemetryStore.ts",
        "apps/web/src/app/api/admin/telemetry/ai/events/route.ts",
      ],
      tests: [
        "apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts",
        "apps/web/tests/admin-ai-usage.route.test.ts",
      ],
      adminHref: "/admin/telemetry/ai/orchestrator",
      nextSliceId: V3_DEEPSEARCH_DEBIT_TRUTH_SLICE_ID,
      operationalTruth: "operational_basic",
    },
    {
      id: "ai_usage_event_snapshot",
      area: "ai_usage",
      label: "AI Usage Event / Snapshot",
      runtimeRecord: "AiUsageEvent / AiUsageBreakdownSnapshot",
      currentReality:
        "AI Usage zeichnet Tokens, Kosten, Dauer und Erfolgsstatus auf; fuer Analyze- und Admin-Smoke-Events sind jetzt optionale Run-/Operation-/Dossier-Korrelationen sichtbar, waehrend Job-Korrelation fuer Factcheck/Material/Export fehlt.",
      correlationKeys: ["provider", "pipeline", "timestamp", "runId", "jobId", "operationId", "dossierId", "organizationId", "userId", "tenantId"],
      correlationTruth:
        "Recorded usage ist vorhanden; Snapshot und Admin-Telemetry koennen jetzt reale Run-/Operation-/Dossier-Felder lesen, aber Job-/Export-Korrelation bleibt lueckenhaft.",
      hasAiUsageEvent: {
        status: "resolved_for_scope",
        detail: "AiUsageEvent ist selbst die vorhandene recorded-usage-Wahrheit.",
      },
      hasRunCorrelation: {
        status: "resolved_for_scope",
        detail: "AI Usage fuehrt runId dort, wo Analyze- oder Admin-Smoke-Runtime diesen Kontext heute real kennt.",
      },
      hasJobCorrelation: {
        status: "missing_runtime_truth",
        detail: "AiUsageEvent fuehrt heute weiterhin keine kanonischen jobId-Felder fuer Factcheck- oder Material-Jobs.",
      },
      hasDossierCorrelation: {
        status: "resolved_for_scope",
        detail: "Analyze kann dossierId optional in AI Usage tragen; andere DeepSearch-Pfade bleiben ohne diese Korrelation.",
      },
      hasOrgOrUserScope: {
        status: "resolved_for_scope",
        detail: "userId ist bereits vorhanden; organizationId bleibt nur dort befuellbar, wo die Runtime ihn real kennt.",
      },
      hasCostEstimate: {
        status: "not_applicable",
        detail: "Die Snapshot-Sicht zeigt recorded usage statt nur Schaetzung.",
      },
      hasRecordedUsage: {
        status: "recorded_usage",
        detail: "AI Usage speichert Tokens und costEur pro Event und aggregiert sie im Snapshot.",
      },
      hasRunLinkage: {
        status: "resolved_for_scope",
        detail: "AiUsageEvent fuehrt jetzt optionale runId-Felder fuer Analyze- und Admin-Smoke-Pfade.",
      },
      hasJobLinkage: {
        status: "missing_runtime_truth",
        detail: "AiUsageEvent fuehrt heute keine kanonischen jobId-Felder fuer Factcheck- oder Material-Jobs.",
      },
      hasUsageLinkage: {
        status: "resolved_for_scope",
        detail: "Die Snapshot-Sicht ist selbst die vorhandene Usage-Wahrheit, aber ohne Fachpfad-Korrelation.",
      },
      hasCreditDebit: {
        status: "missing_runtime_truth",
        detail: "Recorded usage fuehrt nicht zu einem debitierbaren Kreditbeleg.",
      },
      estimatedCost: {
        status: "not_applicable",
        detail: "Die Snapshot-Sicht zeigt bereits recorded usage statt nur Schaetzung.",
      },
      recordedUsage: {
        status: "recorded_usage",
        detail: "AI Usage speichert Tokens und costEur pro Event und aggregiert sie im Snapshot.",
      },
      creditDebit: {
        status: "missing_runtime_truth",
        detail: "Recorded usage fuehrt noch zu keinem kanonischen Credit-/Debit-Eintrag.",
      },
      reviewRequired: {
        status: "not_required",
        detail: "Die Telemetry-Zeile ist Beobachtung, kein Freigabeschritt.",
      },
      blockedByLimit: {
        status: "not_applicable",
        detail: "Warnschwellen sind sichtbar, aber kein per-event Limit-Stopp wird protokolliert.",
      },
      missingRuntimeTruth: {
        status: "missing_runtime_truth",
        detail: "Recorded usage existiert; Job-/Export-Korrelation und Debit-Wahrheit fehlen weiterhin.",
      },
      existingGates: [
        "attentionFlags fuer Budget, Cost-per-Call, Timeout und Research-heavy Share",
        "Provider-/Pipeline-Filter",
        "Keine automatische Debit-Interpretation aus Telemetry",
      ],
      repoEvidence: [
        "core/telemetry/aiUsageTypes.ts",
        "core/telemetry/aiUsageSnapshot.ts",
        "apps/web/src/app/api/admin/telemetry/ai/usage/route.ts",
        "apps/web/src/app/admin/telemetry/ai/usage/page.tsx",
      ],
      tests: [
        "apps/web/tests/admin-ai-usage.route.test.ts",
        "apps/web/tests/ai-usage-operational-signals.contract.test.ts",
      ],
      adminHref: "/admin/telemetry/ai/usage",
      nextSliceId: V3_DEEPSEARCH_CROSS_SURFACE_USAGE_WRITERS_SLICE_ID,
      operationalTruth: "operational_basic",
    },
    {
      id: "export_distribution_item",
      area: "export",
      label: "Export / Social Distribution Item",
      runtimeRecord: "SocialDistributionQueueEntry",
      currentReality:
        "Export- und Social-Distribution-Items sind review-first, dossierbezogen und statusklar, aber nicht als kostenrelevante Verbrauchsoperation instrumentiert.",
      correlationKeys: ["entry.id", "dossierId", "targetHref", "channels"],
      correlationTruth:
        "Dossier- und Queue-Korrelation ist sichtbar; Verbrauchs-, Usage- oder Debit-Wahrheit existiert auf diesem Pfad noch nicht.",
      hasAiUsageEvent: {
        status: "missing_runtime_truth",
        detail: "Export-/Distribution-Items erzeugen heute keine kanonisch korrelierten AI-Usage-Events.",
      },
      hasRunCorrelation: {
        status: "not_applicable",
        detail: "Der Export-/Distribution-Pfad fuehrt keine runId-basierte Runtime.",
      },
      hasJobCorrelation: {
        status: "not_applicable",
        detail: "Export und Distribution arbeiten heute mit Queue-/Post-Objekten statt Job-Dokumenten.",
      },
      hasDossierCorrelation: {
        status: "resolved_for_scope",
        detail: "dossierId bleibt am Export-/Distribution-Objekt sichtbar.",
      },
      hasOrgOrUserScope: {
        status: "missing_runtime_truth",
        detail: "Der sichtbare Export-Readpath zeigt keinen kanonischen Org-/User-Scope als AI-Usage-Korrelation.",
      },
      hasCostEstimate: {
        status: "not_applicable",
        detail: "Der Export-/Distribution-Pfad fuehrt keine Kostenschaetzung.",
      },
      hasRecordedUsage: {
        status: "missing_runtime_truth",
        detail: "Es gibt keine recorded_usage pro Export oder Distribution-Entwurf.",
      },
      hasRunLinkage: {
        status: "not_applicable",
        detail: "Der Export-/Distribution-Pfad fuehrt keine runId-basierte Runtime.",
      },
      hasJobLinkage: {
        status: "not_applicable",
        detail: "Export und Distribution arbeiten heute mit Queue-/Post-Objekten statt Job-Dokumenten.",
      },
      hasUsageLinkage: {
        status: "missing_runtime_truth",
        detail: "Zwischen Export-/Distribution-Objekten und recorded_usage existiert keine kanonische Verknuepfung.",
      },
      hasCreditDebit: {
        status: "missing_runtime_truth",
        detail: "Exports erzeugen keinen echten Credit-/Debit-Beleg.",
      },
      estimatedCost: {
        status: "not_applicable",
        detail: "Der Export-/Distribution-Pfad fuehrt keine Kostenschaetzung.",
      },
      recordedUsage: {
        status: "missing_runtime_truth",
        detail: "Es gibt keine recorded_usage pro Export oder Distribution-Entwurf.",
      },
      creditDebit: {
        status: "missing_runtime_truth",
        detail: "Exports erzeugen keinen Credit-/Debit-Satz.",
      },
      reviewRequired: {
        status: "review_required",
        detail: "Distribution bleibt review-first und ohne Auto-Publish.",
      },
      blockedByLimit: {
        status: "not_applicable",
        detail: "Der aktuelle Exportpfad wird ueber Review und Status statt ueber Verbrauchslimits begrenzt.",
      },
      missingRuntimeTruth: {
        status: "missing_runtime_truth",
        detail: "Review- und Queue-Wahrheit ist da; Verbrauchswahrheit fehlt weiter.",
      },
      existingGates: [
        "reviewRequired",
        "noAutoPublish",
        "exportReady / schedulingReady nur als Statussicht",
      ],
      repoEvidence: [
        "features/outputEngine/socialDistributionQueueReadModel.ts",
        "apps/web/src/app/api/dossier/[id]/export/route.ts",
      ],
      tests: [
        "apps/web/tests/output-engine-export.test.ts",
        "apps/web/tests/social-manual-export-fallback.contract.test.ts",
        "apps/web/tests/social-export-scheduling-ready.contract.test.ts",
      ],
      adminHref: "/atlas/social-review",
      nextSliceId: V3_DEEPSEARCH_CROSS_SURFACE_USAGE_WRITERS_SLICE_ID,
      operationalTruth: "operational_basic",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    sectionStatus: "operational_basic",
    summary: {
      totalOperations: operations.length,
      aiUsageEventOperations: countByField(operations, "hasAiUsageEvent", "resolved_for_scope"),
      runCorrelatedOperations: countByField(operations, "hasRunCorrelation", "resolved_for_scope"),
      jobCorrelatedOperations: countByField(operations, "hasJobCorrelation", "resolved_for_scope"),
      dossierCorrelatedOperations: countByField(operations, "hasDossierCorrelation", "resolved_for_scope"),
      orgOrUserScopedOperations: countByField(
        operations,
        "hasOrgOrUserScope",
        "resolved_for_scope",
      ),
      costEstimateOperations: countByField(operations, "hasCostEstimate", "estimated_only"),
      recordedUsageTruthOperations: countByField(
        operations,
        "hasRecordedUsage",
        "recorded_usage",
      ),
      runLinkedOperations: countByField(operations, "hasRunLinkage", "resolved_for_scope"),
      jobLinkedOperations: countByField(operations, "hasJobLinkage", "resolved_for_scope"),
      usageLinkedOperations: countByField(operations, "hasUsageLinkage", "resolved_for_scope"),
      creditLinkedOperations: countByField(operations, "hasCreditDebit", "credit_debit"),
      estimatedOnlyOperations: countByField(operations, "estimatedCost", "estimated_only"),
      recordedUsageOperations: countByField(operations, "recordedUsage", "recorded_usage"),
      creditDebitOperations: countByField(operations, "creditDebit", "credit_debit"),
      reviewRequiredOperations: countByField(operations, "reviewRequired", "review_required"),
      blockedByLimitOperations: countByField(operations, "blockedByLimit", "blocked_by_limit"),
      missingRuntimeTruthOperations: countByField(
        operations,
        "missingRuntimeTruth",
        "missing_runtime_truth",
      ),
    },
    semantics: [...V3_DEEPSEARCH_CONSUMPTION_FIELD_STATUSES],
    operations,
    openTruths: [
      {
        label: "Factcheck-, Material- und Export-Pfade haben weiter keine AI-Usage-Writer",
        nextSliceId: V3_DEEPSEARCH_CROSS_SURFACE_USAGE_WRITERS_SLICE_ID,
        reason:
          "Die Korrelation ist fuer Analyze und Admin-Smoke real sichtbar, aber weitere DeepSearch-/Material-/Export-Pfade erzeugen noch keine korrelierbaren AI-Usage-Events.",
      },
      {
        label: "Persistierte Run- und Job-Objekte bleiben ausserhalb der Writer-Pfade getrennt",
        nextSliceId: V3_DEEPSEARCH_CROSS_SURFACE_USAGE_WRITERS_SLICE_ID,
        reason:
          "Run Receipts, Factcheck-Jobs, Material-Jobs und Export-Objekte tragen IDs, aber ohne eigene AI-Usage-Writers noch keine durchgehenden Usage-Referenzen.",
      },
      {
        label: "Echte Credit-/Debit-Wahrheit bleibt separat offen",
        nextSliceId: V3_DEEPSEARCH_DEBIT_TRUTH_SLICE_ID,
        reason:
          "blocked_by_limit und review_required sind Guardrails; eine belastbare Debit-Wahrheit existiert weiterhin nicht.",
      },
    ],
    guardrails: [...GLOBAL_GUARDRAILS],
  };
}
