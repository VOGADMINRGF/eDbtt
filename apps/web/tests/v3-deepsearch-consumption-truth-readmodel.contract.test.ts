import { describe, expect, it } from "vitest";

import {
  V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID,
  V3_DEEPSEARCH_CONSUMPTION_FIELD_STATUSES,
  V3_DEEPSEARCH_CONSUMPTION_TRUTH_REAL_HREFS,
  buildV3DeepsearchConsumptionTruthReadModel,
} from "@/features/admin/v3DeepsearchConsumptionTruthReadModel";

describe("v3 deepsearch consumption truth readmodel contract", () => {
  it("builds an operational-basic per-run truth view without inventing debit data", () => {
    const readModel = buildV3DeepsearchConsumptionTruthReadModel();

    expect(readModel.sectionStatus).toBe("operational_basic");
    expect(readModel.summary.totalOperations).toBe(readModel.operations.length);
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
      expect(operation.nextSliceId).toBe(V3_DEEPSEARCH_AI_USAGE_CORRELATION_SLICE_ID);
    }

    expect(factcheck).toMatchObject({
      hasRunLinkage: { status: "not_applicable" },
      hasJobLinkage: { status: "resolved_for_scope" },
      hasUsageLinkage: { status: "missing_runtime_truth" },
      reviewRequired: { status: "review_required" },
      blockedByLimit: { status: "blocked_by_limit" },
      creditDebit: { status: "missing_runtime_truth" },
    });
    expect(smoke).toMatchObject({
      hasRunLinkage: { status: "resolved_for_scope" },
      hasUsageLinkage: { status: "missing_runtime_truth" },
      estimatedCost: { status: "estimated_only" },
      recordedUsage: { status: "missing_runtime_truth" },
    });
    expect(usage).toMatchObject({
      hasRunLinkage: { status: "missing_runtime_truth" },
      hasUsageLinkage: { status: "resolved_for_scope" },
      recordedUsage: { status: "recorded_usage" },
      creditDebit: { status: "missing_runtime_truth" },
    });
  });
});
