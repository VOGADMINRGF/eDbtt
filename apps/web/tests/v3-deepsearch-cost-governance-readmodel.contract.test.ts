import { describe, expect, it } from "vitest";

import {
  V3_DEEPSEARCH_COST_GOVERNANCE_AREAS,
  V3_DEEPSEARCH_COST_GOVERNANCE_STATUSES,
  V3_DEEPSEARCH_COST_REAL_HREFS,
  buildV3DeepsearchCostGovernanceReadModel,
} from "@/features/admin/v3DeepsearchCostGovernanceReadModel";

describe("v3 deepsearch cost governance readmodel contract", () => {
  it("builds an operational-basic governance view from existing gates without inventing billing runtime", () => {
    const readModel = buildV3DeepsearchCostGovernanceReadModel();

    expect(readModel.sectionStatus).toBe("operational_basic");
    expect(readModel.summary.totalChecks).toBe(readModel.checks.length);
    expect(readModel.summary.byStatus.review_required).toBeGreaterThan(0);
    expect(readModel.summary.byStatus.blocked).toBeGreaterThan(0);
    expect(readModel.summary.byStatus.missing_runtime_truth).toBeGreaterThan(0);
  });

  it("keeps checks on real areas, real surfaces and explicit follow-up slices", () => {
    const readModel = buildV3DeepsearchCostGovernanceReadModel();

    expect(readModel.semantics).toEqual([...V3_DEEPSEARCH_COST_GOVERNANCE_STATUSES]);

    for (const check of readModel.checks) {
      expect(V3_DEEPSEARCH_COST_GOVERNANCE_AREAS).toContain(check.area);
      expect(V3_DEEPSEARCH_COST_GOVERNANCE_STATUSES).toContain(check.status);
      if (check.adminHref) expect(V3_DEEPSEARCH_COST_REAL_HREFS).toContain(check.adminHref);
      if (check.publicHref) expect(V3_DEEPSEARCH_COST_REAL_HREFS).toContain(check.publicHref);
      expect(check.repoEvidence.length).toBeGreaterThan(0);
      expect(check.tests.length).toBeGreaterThan(0);
      expect(check.guardrails.length).toBeGreaterThan(0);
      expect(check.nextSliceId).toBe("V3-DEEPSEARCH-REAL-RUNTIME-WRITER-COVERAGE-07");
    }
  });
});
