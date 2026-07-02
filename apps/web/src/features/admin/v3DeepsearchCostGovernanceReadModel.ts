import {
  getFactcheckEntitlementReasonLabel,
  resolveFactcheckEntitlementGate,
} from "@features/factcheck/entitlementGate";
import {
  MATERIAL_EXTRACTION_COST_GUARDS,
} from "@/features/material/materialExtractionJobs";
import {
  OPTIONAL_RESEARCH_PROVIDER_POLICIES,
  RESEARCH_ENTITLEMENT_KEYS,
} from "@/features/ai/researchProviderPolicy";

export const V3_DEEPSEARCH_COST_REAL_HREFS = [
  "/admin",
  "/admin/telemetry/ai/usage",
  "/admin/telemetry/ai/orchestrator",
  "/admin/pricing/orders",
  "/admin/entitlements",
  "/pricing",
  "/order",
  "/atlas/social-review",
] as const;

export type V3DeepsearchCostHref = (typeof V3_DEEPSEARCH_COST_REAL_HREFS)[number];

export const V3_DEEPSEARCH_COST_GOVERNANCE_STATUSES = [
  "allowed",
  "blocked",
  "review_required",
  "limit_reached",
  "missing_runtime_truth",
] as const;

export type V3DeepsearchCostGovernanceStatus =
  (typeof V3_DEEPSEARCH_COST_GOVERNANCE_STATUSES)[number];

export const V3_DEEPSEARCH_COST_GOVERNANCE_AREAS = [
  "research",
  "material_extraction",
  "ai_usage",
  "export",
] as const;

export type V3DeepsearchCostGovernanceArea =
  (typeof V3_DEEPSEARCH_COST_GOVERNANCE_AREAS)[number];

export type V3DeepsearchCostGovernanceCheck = {
  id:
    | "research_request_gate"
    | "hidden_deepsearch_fallback"
    | "material_extraction_cost_gate"
    | "ai_usage_threshold_visibility"
    | "export_review_gate"
    | "per_run_consumption_truth";
  area: V3DeepsearchCostGovernanceArea;
  label: string;
  status: V3DeepsearchCostGovernanceStatus;
  currentReality: string;
  whyThisStatus: string;
  existingGates: string[];
  repoEvidence: string[];
  tests: string[];
  adminHref?: V3DeepsearchCostHref;
  publicHref?: V3DeepsearchCostHref;
  nextSliceId: string;
  guardrails: string[];
};

export type V3DeepsearchCostGovernanceReadModel = {
  generatedAt: string;
  sectionStatus: "operational_basic";
  summary: {
    totalChecks: number;
    byStatus: Record<V3DeepsearchCostGovernanceStatus, number>;
    byArea: Record<V3DeepsearchCostGovernanceArea, number>;
  };
  semantics: V3DeepsearchCostGovernanceStatus[];
  checks: V3DeepsearchCostGovernanceCheck[];
  guardrails: string[];
  openTruths: Array<{
    label: string;
    nextSliceId: string;
    reason: string;
  }>;
};

const FOLLOW_UP_SLICE_ID = "V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03";

const GLOBAL_GUARDRAILS = [
  "Kein Auto-Publish",
  "Keine hidden DeepSearch",
  "Keine unkontrollierte Deep-Research-Automation",
  "Keine neue Billing-Runtime",
] as const;

const AI_USAGE_WARNING_KEYS = [
  "budgetMonthlyEur",
  "projectedBudgetWarnPct",
  "costPerCallWarnEur",
  "researchHeavyWarnSharePct",
  "sealedCostFootprintWarnSharePct",
  "timeoutWarnSharePct",
  "badJsonWarnSharePct",
] as const;

function createStatusSummary() {
  return {
    allowed: 0,
    blocked: 0,
    review_required: 0,
    limit_reached: 0,
    missing_runtime_truth: 0,
  } satisfies Record<V3DeepsearchCostGovernanceStatus, number>;
}

function createAreaSummary() {
  return {
    research: 0,
    material_extraction: 0,
    ai_usage: 0,
    export: 0,
  } satisfies Record<V3DeepsearchCostGovernanceArea, number>;
}

function buildDeepResearchGateLabels() {
  const login = resolveFactcheckEntitlementGate("deep_research", {
    isAuthenticated: false,
  });
  const entitlement = resolveFactcheckEntitlementGate("deep_research", {
    isAuthenticated: true,
    hasEntitlement: false,
    hasPricingAccess: false,
    confirmationProvided: false,
  });
  const confirmation = resolveFactcheckEntitlementGate("deep_research", {
    isAuthenticated: true,
    hasEntitlement: true,
    hasPricingAccess: true,
    confirmationProvided: false,
  });

  return [
    getFactcheckEntitlementReasonLabel(login.reason),
    getFactcheckEntitlementReasonLabel(entitlement.reason),
    getFactcheckEntitlementReasonLabel(confirmation.reason),
    "Explizite Bestätigung vor kostenrelevantem Start",
  ];
}

export function buildV3DeepsearchCostGovernanceReadModel(): V3DeepsearchCostGovernanceReadModel {
  const checks: V3DeepsearchCostGovernanceCheck[] = [
    {
      id: "research_request_gate",
      area: "research",
      label: "Research / DeepSearch Request Gate",
      status: "review_required",
      currentReality:
        "Vertiefte Research- und DeepSearch-Pfade sind nur nach Login, Entitlement/Pricing und expliziter Bestätigung erreichbar.",
      whyThisStatus:
        "Die Runtime erlaubt keinen stillen Premium-Research-Start; der nächste Schritt bleibt bewusst bestätigungs- und reviewpflichtig.",
      existingGates: buildDeepResearchGateLabels(),
      repoEvidence: [
        "features/factcheck/entitlementGate.ts",
        "apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts",
        "apps/web/src/app/api/factcheck/enqueue/route.ts",
        "apps/web/src/features/start/draftNextActionGate.ts",
      ],
      tests: [
        "apps/web/tests/factcheck-entitlement-gate.contract.test.ts",
        "apps/web/tests/create-analyze-entitlement-gate.route.test.ts",
        "apps/web/tests/factcheck-enqueue.auth.route.test.ts",
      ],
      adminHref: "/admin/telemetry/ai/usage",
      publicHref: "/pricing",
      nextSliceId: FOLLOW_UP_SLICE_ID,
      guardrails: [
        "Kein DeepSearch ohne bewusste Bestätigung",
        "Kein Auto-Start aus Draft, Analyze oder Factcheck",
      ],
    },
    {
      id: "hidden_deepsearch_fallback",
      area: "research",
      label: "Hidden DeepSearch Fallback Block",
      status: "blocked",
      currentReality:
        "Optionale Research-Provider sind getrennt vom Standard-Analyze-Pfad und bleiben lane- sowie provider-gated.",
      whyThisStatus:
        "Premium-Research darf heute nicht als stiller Fallback für Standard-Analyse, Material oder Public-Flows einspringen.",
      existingGates: [
        `Research Keys: ${RESEARCH_ENTITLEMENT_KEYS.join(", ")}`,
        `Optionale Provider: ${OPTIONAL_RESEARCH_PROVIDER_POLICIES.map((entry) => entry.provider).join(", ")}`,
        "Standard Analyze bleibt ohne Premium-Research-Fallback",
      ],
      repoEvidence: [
        "apps/web/src/features/ai/researchProviderPolicy.ts",
        "apps/web/src/features/ai/providerRoleRouting.ts",
        "apps/web/src/features/ai/v2OrchestrationPolicy.ts",
      ],
      tests: [
        "apps/web/tests/ai-cost-research-guardrail.contract.test.ts",
        "apps/web/tests/ai-lane-policy.contract.test.ts",
        "apps/web/tests/ai-provider-role-routing.contract.test.ts",
      ],
      adminHref: "/admin/telemetry/ai/orchestrator",
      publicHref: "/pricing",
      nextSliceId: FOLLOW_UP_SLICE_ID,
      guardrails: [
        "Keine hidden DeepSearch",
        "Kein Premium-Provider als Standard-Analyze-Default",
      ],
    },
    {
      id: "material_extraction_cost_gate",
      area: "material_extraction",
      label: "Material Extraction Cost Gate",
      status: "blocked",
      currentReality:
        "Kostenrelevante Extraktion bleibt blockiert, bis eine explizite Kostenfreigabe vorliegt; Ergebnisse bleiben danach weiter review-first.",
      whyThisStatus:
        "Die bestehende Material-Runtime erzwingt eine Kostenfreigabe, statt PDF-/YouTube-/Dokumentpfade unkontrolliert laufen zu lassen.",
      existingGates: [
        `Cost Guards: ${MATERIAL_EXTRACTION_COST_GUARDS.join(", ")}`,
        "requires_approval blockiert teure Extraktion bis zur Freigabe",
        "noAutoDeepSearch und noAutoPublish bleiben aktiv",
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
      adminHref: "/admin",
      publicHref: "/order",
      nextSliceId: FOLLOW_UP_SLICE_ID,
      guardrails: [
        "Keine Extraktion ohne Kostenfreigabe",
        "Kein Auto-Publish aus Material-Jobs",
      ],
    },
    {
      id: "ai_usage_threshold_visibility",
      area: "ai_usage",
      label: "AI Usage Threshold Visibility",
      status: "allowed",
      currentReality:
        "AI-Usage-, Budget-, Cost-per-Call-, Timeout- und Research-Heavy-Signale sind auf bestehenden Telemetry-Pfaden sichtbar.",
      whyThisStatus:
        "Operatoren sehen Budget- und Kostenwarnungen bereits, auch wenn diese Sicht heute noch keine harte per-run Stop- oder Debit-Wahrheit darstellt.",
      existingGates: [
        `Threshold Inputs: ${AI_USAGE_WARNING_KEYS.join(", ")}`,
        "Attention Flags für Budget, Cost-per-Call, Timeout und Fallback-Relevanz",
        "Research-heavy und sealed-cost-footprint bleiben sichtbar",
      ],
      repoEvidence: [
        "apps/web/src/app/api/admin/telemetry/ai/usage/route.ts",
        "apps/web/src/features/admin/aiUsageView.ts",
        "apps/web/src/app/admin/telemetry/ai/usage/page.tsx",
      ],
      tests: [
        "apps/web/tests/admin-ai-usage.route.test.ts",
        "apps/web/tests/ai-usage-operational-signals.contract.test.ts",
        "apps/web/tests/ai-usage-view.contract.test.ts",
      ],
      adminHref: "/admin/telemetry/ai/usage",
      nextSliceId: FOLLOW_UP_SLICE_ID,
      guardrails: [
        "Warn-Sicht ersetzt keine automatische Kostenfreigabe",
        "Keine stille Erhöhung von Research-Budgets",
      ],
    },
    {
      id: "export_review_gate",
      area: "export",
      label: "Export / Social Output Review Gate",
      status: "review_required",
      currentReality:
        "Export-, Social- und Output-Pfade sind review-first sichtbar, aber weiterhin ohne Auto-Publish und ohne automatische Kostenfreigabe.",
      whyThisStatus:
        "Exports bleiben manuell geprüft; eine V3-Kosten- oder Verbrauchsfreigabe für Assets und Social-Drafts existiert noch nicht als produktive Runtime-Wahrheit.",
      existingGates: [
        "review_required vor externen Ausgaben",
        "noAutoPublish auf Output- und Social-Pfaden",
        "Manual fallback statt Connector-Autopilot",
      ],
      repoEvidence: [
        "features/outputEngine/distributionExport.ts",
        "features/outputEngine/socialDistribution.ts",
        "features/outputEngine/socialDistributionQueueReadModel.ts",
      ],
      tests: [
        "apps/web/tests/output-engine-export.test.ts",
        "apps/web/tests/social-manual-export-fallback.contract.test.ts",
        "apps/web/tests/social-export-scheduling-ready.contract.test.ts",
      ],
      adminHref: "/atlas/social-review",
      publicHref: "/pricing",
      nextSliceId: FOLLOW_UP_SLICE_ID,
      guardrails: [
        "Kein Auto-Publish aus Export- oder Social-Drafts",
        "Keine externe Connector-Pflicht als Kostenwahrheit",
      ],
    },
    {
      id: "per_run_consumption_truth",
      area: "research",
      label: "Per-run Consumption Truth",
      status: "missing_runtime_truth",
      currentReality:
        "Die bestehende Operator-Konsole zeigt jetzt eine kanonische per-run/per-job/per-operation Sicht über estimated_cost, recorded_usage, credit_debit, review_required, blocked_by_limit und missing_runtime_truth.",
      whyThisStatus:
        "Die Sichtbarkeit ist hergestellt, aber die eigentliche Runtime-Verknüpfung zwischen Job/Run, recorded_usage und echtem Debit fehlt weiter.",
      existingGates: [
        "Eigene V3-Consumption-Truth-Sicht auf /admin",
        "AI Usage zeigt recorded_usage, aber ohne fachliche Run-/Job-Kopplung",
        "Packages zeigen Credits, aber keine laufzeitgebundene Verbrauchsledger-Wahrheit",
      ],
      repoEvidence: [
        "apps/web/src/features/admin/v3DeepsearchConsumptionTruthReadModel.ts",
        "apps/web/src/features/admin/v3PricingCreditsReadModel.ts",
        "apps/web/src/lib/server/entitlements/createEntitlements.ts",
        "apps/web/src/app/api/admin/telemetry/ai/usage/route.ts",
      ],
      tests: [
        "apps/web/tests/v3-deepsearch-consumption-truth-readmodel.contract.test.ts",
        "apps/web/tests/v3-deepsearch-consumption-truth-admin.page.test.tsx",
        "apps/web/tests/v3-pricing-credits-readmodel.contract.test.ts",
        "apps/web/tests/pricing-no-hidden-ai-costs.contract.test.ts",
        "apps/web/tests/admin-ai-usage.route.test.ts",
      ],
      adminHref: "/admin",
      publicHref: "/pricing",
      nextSliceId: FOLLOW_UP_SLICE_ID,
      guardrails: [
        "Keine erfundene Verbrauchsabrechnung",
        "Keine Verwechslung von Gate-Status mit echtem Debit",
      ],
    },
  ];

  const byStatus = createStatusSummary();
  const byArea = createAreaSummary();

  for (const check of checks) {
    byStatus[check.status] += 1;
    byArea[check.area] += 1;
  }

  return {
    generatedAt: "2026-07-02T00:00:00.000Z",
    sectionStatus: "operational_basic",
    summary: {
      totalChecks: checks.length,
      byStatus,
      byArea,
    },
    semantics: [...V3_DEEPSEARCH_COST_GOVERNANCE_STATUSES],
    checks,
    guardrails: [...GLOBAL_GUARDRAILS],
    openTruths: [
      {
        label: "Per-run Consumption Truth",
        nextSliceId: FOLLOW_UP_SLICE_ID,
        reason:
          "Approval-, Debit-, Limit- und Nachaudit-Wahrheit ist jetzt sichtbar kartiert, fehlt aber weiterhin als durchgehende Runtime-Verknüpfung.",
      },
      {
        label: "Operator Approval and Audit Trail",
        nextSliceId: FOLLOW_UP_SLICE_ID,
        reason:
          "Die sichtbaren Gates sind jetzt kanonisch gebündelt, aber noch nicht als durchgehender Approval- und Nachaudit-Workflow pro Lauf geschlossen.",
      },
    ],
  };
}
