import { describe, expect, it } from "vitest";

import {
  V3_DEEPSEARCH_CONSUMPTION_FIELD_STATUSES,
  V3_DEEPSEARCH_CONSUMPTION_TRUTH_REAL_HREFS,
  buildV3DeepsearchConsumptionTruthReadModel,
} from "@/features/admin/v3DeepsearchConsumptionTruthReadModel";

describe("v3 deepsearch consumption truth readmodel contract", () => {
  it("builds an operational-basic per-run truth view without inventing debit data", () => {
    const readModel = buildV3DeepsearchConsumptionTruthReadModel();

    expect(readModel.sectionStatus).toBe("operational_basic");
    expect(readModel.summary.totalOperations).toBe(readModel.operations.length);
    expect(readModel.summary.aiUsageEventOperations).toBeGreaterThan(0);
    expect(readModel.summary.runCorrelatedOperations).toBeGreaterThan(0);
    expect(readModel.summary.jobCorrelatedOperations).toBeGreaterThan(0);
    expect(readModel.summary.dossierCorrelatedOperations).toBeGreaterThan(0);
    expect(readModel.summary.orgOrUserScopedOperations).toBeGreaterThan(0);
    expect(readModel.summary.runLinkedOperations).toBeGreaterThan(0);
    expect(readModel.summary.jobLinkedOperations).toBeGreaterThan(0);
    expect(readModel.summary.usageLinkedOperations).toBeGreaterThan(0);
    expect(readModel.summary.creditLinkedOperations).toBe(0);
    expect(readModel.summary.estimatedOnlyOperations).toBeGreaterThan(0);
    expect(readModel.summary.recordedUsageOperations).toBeGreaterThan(0);
    expect(readModel.summary.creditDebitOperations).toBe(0);
    expect(readModel.summary.missingRuntimeTruthOperations).toBe(readModel.operations.length);
  });

  it("keeps operations on real surfaces and differentiates truth signals explicitly", () => {
    const readModel = buildV3DeepsearchConsumptionTruthReadModel();
    const analyze = readModel.operations.find((entry) => entry.id === "analyze_run_receipt");
    const factcheck = readModel.operations.find((entry) => entry.id === "factcheck_deep_research_job");
    const smoke = readModel.operations.find((entry) => entry.id === "admin_orchestrator_smoke_run");
    const usage = readModel.operations.find((entry) => entry.id === "ai_usage_event_snapshot");

    expect(readModel.semantics).toEqual([...V3_DEEPSEARCH_CONSUMPTION_FIELD_STATUSES]);

    for (const operation of readModel.operations) {
      if (operation.adminHref) expect(V3_DEEPSEARCH_CONSUMPTION_TRUTH_REAL_HREFS).toContain(operation.adminHref);
      if (operation.publicHref) expect(V3_DEEPSEARCH_CONSUMPTION_TRUTH_REAL_HREFS).toContain(operation.publicHref);
      expect(operation.repoEvidence.length).toBeGreaterThan(0);
      expect(operation.tests.length).toBeGreaterThan(0);
      expect(operation.correlationKeys.length).toBeGreaterThan(0);
      expect(operation.nextSliceId).toMatch(/^V3-DEEPSEARCH-/);
    }

    expect(analyze).toMatchObject({
      hasAiUsageEvent: { status: "resolved_for_scope" },
      hasRunCorrelation: { status: "resolved_for_scope" },
      hasDossierCorrelation: { status: "resolved_for_scope" },
      hasOrgOrUserScope: { status: "resolved_for_scope" },
      hasRecordedUsage: { status: "recorded_usage" },
      hasUsageLinkage: { status: "resolved_for_scope" },
      recordedUsage: { status: "recorded_usage" },
    });
    expect(factcheck).toMatchObject({
      hasAiUsageEvent: { status: "missing_runtime_truth" },
      hasJobCorrelation: { status: "resolved_for_scope" },
      hasDossierCorrelation: { status: "resolved_for_scope" },
      hasOrgOrUserScope: { status: "resolved_for_scope" },
      hasRunLinkage: { status: "not_applicable" },
      hasJobLinkage: { status: "resolved_for_scope" },
      hasUsageLinkage: { status: "missing_runtime_truth" },
      reviewRequired: { status: "review_required" },
      blockedByLimit: { status: "blocked_by_limit" },
      creditDebit: { status: "missing_runtime_truth" },
    });
    expect(smoke).toMatchObject({
      hasAiUsageEvent: { status: "resolved_for_scope" },
      hasRunCorrelation: { status: "resolved_for_scope" },
      hasOrgOrUserScope: { status: "resolved_for_scope" },
      hasRecordedUsage: { status: "recorded_usage" },
      hasRunLinkage: { status: "resolved_for_scope" },
      hasUsageLinkage: { status: "resolved_for_scope" },
      estimatedCost: { status: "estimated_only" },
      recordedUsage: { status: "recorded_usage" },
    });
    expect(usage).toMatchObject({
      hasAiUsageEvent: { status: "resolved_for_scope" },
      hasRunCorrelation: { status: "resolved_for_scope" },
      hasJobCorrelation: { status: "missing_runtime_truth" },
      hasDossierCorrelation: { status: "resolved_for_scope" },
      hasOrgOrUserScope: { status: "resolved_for_scope" },
      hasRunLinkage: { status: "resolved_for_scope" },
      hasUsageLinkage: { status: "resolved_for_scope" },
      recordedUsage: { status: "recorded_usage" },
      creditDebit: { status: "missing_runtime_truth" },
    });
  });
});
