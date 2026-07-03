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

const GLOBAL_GUARDRAILS = [
  "Keine neue Billing-Runtime",
  "Keine Fake-Verbrauchsdaten",
  "Keine automatische Recherche oder Distribution",
  "Review-first bleibt verbindlich",
] as const;

function countByField(
  operations: V3DeepsearchConsumptionTruthOperation[],
  field:
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
        "Analyze speichert einen Run Receipt fuer Provenance und Output-Nachvollziehbarkeit, aber nicht fuer Kosten-, Usage- oder Debit-Wahrheit.",
      correlationKeys: ["runId", "receipt.id", "receiptHash", "snapshotId"],
      correlationTruth:
        "runId existiert im Analyze-Contract, der persistierte Receipt speichert jedoch Hash-/Snapshot-Wahrheit statt per-run Verbrauch oder Debit.",
      hasRunLinkage: {
        status: "resolved_for_scope",
        detail: "Analyze fuehrt runId im Contract; der Receipt bleibt davon getrennte Provenance-Wahrheit.",
      },
      hasJobLinkage: {
        status: "not_applicable",
        detail: "Der Analyze-Receipt ist ein Run-Pfad, kein Job-Pfad.",
      },
      hasUsageLinkage: {
        status: "missing_runtime_truth",
        detail: "Zwischen runId und recorded_usage besteht heute keine kanonische Runtime-Verknuepfung.",
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
        status: "missing_runtime_truth",
        detail: "Der Receipt enthaelt keine token- oder kostenbasierte Recorded-Usage-Zeile.",
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
        detail: "Provenance ist vorhanden, per-run Verbrauchswahrheit fehlt weiterhin.",
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
      nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
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
      nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
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
      nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
      operationalTruth: "operational_basic",
    },
    {
      id: "admin_orchestrator_smoke_run",
      area: "ai_usage",
      label: "Admin Orchestrator Smoke Run",
      runtimeRecord: "AdminAiRunRecord / ProviderDiagnostic",
      currentReality:
        "Admin-Orchestrator-Smokes haben bereits runId/correlationId und eine echte Kostenschaetzung aus Tokens, bleiben aber ohne recorded_usage- oder Debit-Kopplung.",
      correlationKeys: ["runId", "correlationId", "mode", "provider", "model"],
      correlationTruth:
        "Die Admin-Diagnostik hat die sauberste Run-Korrelation im Repo, ist aber absichtlich keine Billing- oder Produktionsdebit-Wahrheit.",
      hasRunLinkage: {
        status: "resolved_for_scope",
        detail: "runId und correlationId werden im Admin-Smoke bereits konsistent gefuehrt.",
      },
      hasJobLinkage: {
        status: "not_applicable",
        detail: "Der Admin-Smoke ist ein Diagnose-Run ohne fachliches Job-Dokument.",
      },
      hasUsageLinkage: {
        status: "missing_runtime_truth",
        detail: "Die Run-Diagnostik ist noch nicht kanonisch mit recorded_usage verknuepft.",
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
        status: "missing_runtime_truth",
        detail: "Die gruppierte Admin-Run-Sicht schreibt costEur derzeit bewusst nicht als recorded_usage fort.",
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
        detail: "Schaetzung und Run-Korrelation sind stark, echte recorded_usage/debit-Wahrheit fehlt.",
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
      nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
      operationalTruth: "operational_basic",
    },
    {
      id: "ai_usage_event_snapshot",
      area: "ai_usage",
      label: "AI Usage Event / Snapshot",
      runtimeRecord: "AiUsageEvent / AiUsageBreakdownSnapshot",
      currentReality:
        "AI Usage zeichnet Tokens, Kosten, Dauer und Erfolgsstatus auf, aber die Snapshot-Sicht bleibt ohne kanonisches runId/jobId-Mapping fuer Research-, Material- oder Export-Operationen.",
      correlationKeys: ["provider", "pipeline", "timestamp", "userId", "tenantId"],
      correlationTruth:
        "Recorded usage ist vorhanden, jedoch nicht pro Job oder Exportlauf auf die fachlichen Runtime-Pfade zurueckgebunden.",
      hasRunLinkage: {
        status: "missing_runtime_truth",
        detail: "AiUsageEvent fuehrt heute keine kanonischen runId-Felder fuer Research-, Material- oder Exportpfade.",
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
        detail: "Recorded usage existiert, aber die Run-/Job-Korrelation in die Fachpfade fehlt.",
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
      nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
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
      nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
      operationalTruth: "operational_basic",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    sectionStatus: "operational_basic",
    summary: {
      totalOperations: operations.length,
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
        label: "AI Usage muss optionale runId-/jobId-Korrelationen aufnehmen",
        nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
        reason:
          "Recorded usage existiert bereits, aber ohne kanonische Verknuepfung zu Research-, Material- und Export-Operationen.",
      },
      {
        label: "Persistierte Run- und Job-Objekte bleiben von Usage-Ereignissen getrennt",
        nextSliceId: V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
        reason:
          "Run Receipts, Factcheck-Jobs, Material-Jobs und Export-Objekte tragen IDs, aber keine kanonischen Usage-Referenzen.",
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
