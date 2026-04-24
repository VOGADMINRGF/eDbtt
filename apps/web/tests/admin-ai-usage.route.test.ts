import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  getAiUsageSnapshot: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@core/telemetry/aiUsageSnapshot", () => ({
  getAiUsageSnapshot: (...args: unknown[]) => mocks.getAiUsageSnapshot(...args),
}));

import { GET as USAGE_GET } from "@/app/api/admin/telemetry/ai/usage/route";

describe("/api/admin/telemetry/ai/usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ userId: "admin-1" });
    mocks.getAiUsageSnapshot.mockResolvedValue({
      totals: { calls: 0, tokens: 0, costEur: 0, errors: 0 },
      byProvider: [],
      byPipeline: [],
      byLane: [],
      byJourney: [],
      byErrorKind: [],
      recent: [],
      insights: [],
      attentionFlags: [],
      optimization: {
        savingsCandidates: [],
        qualityCandidates: [],
        stabilityCandidates: [],
      },
      thresholds: {
        budgetMonthlyEur: 150,
        projectedBudgetWarnPct: 85,
        errorRateWarnPct: 8,
        avgDurationWarnMs: 12_000,
        costPerCallWarnEur: 0.05,
        fallbackRelianceWarnSharePct: 40,
        researchHeavyWarnSharePct: 35,
        sealedCostFootprintWarnSharePct: 45,
        timeoutWarnSharePct: 5,
        badJsonWarnSharePct: 3,
      },
      derivedMetrics: {
        costPerCallEur: 0,
        avgDurationMs: 0,
        errorRatePct: 0,
        timeoutSharePct: 0,
        badJsonSharePct: 0,
        researchHeavyWorkloadSharePct: 0,
        fallbackRelianceSharePct: 0,
        sealedFactcheckCostFootprintPct: 0,
        projectedMonthlyCostEur: 0,
        projectedBudgetUtilizationPct: 0,
      },
    });
  });

  it("passes parsed filters and threshold overrides to snapshot", async () => {
    const req = new NextRequest(
      "http://localhost/api/admin/telemetry/ai/usage?range=week&provider=openai&pipeline=factcheck&region=DE-BE&budgetMonthlyEur=300&errorRateWarnPct=9&costPerCallWarnEur=0.2&timeoutWarnSharePct=6&badJsonWarnSharePct=2",
    );

    const res = await USAGE_GET(req);
    expect(res.status).toBe(200);
    expect(mocks.getAiUsageSnapshot).toHaveBeenCalledWith(
      7,
      "DE-BE",
      "openai",
      "factcheck",
      expect.objectContaining({
        budgetMonthlyEur: 300,
        errorRateWarnPct: 9,
        costPerCallWarnEur: 0.2,
        timeoutWarnSharePct: 6,
        badJsonWarnSharePct: 2,
      }),
    );
  });

  it("falls back to defaults and strips invalid threshold values", async () => {
    const req = new NextRequest(
      "http://localhost/api/admin/telemetry/ai/usage?range=unknown&provider=all&pipeline=all&budgetMonthlyEur=-10&errorRateWarnPct=abc",
    );

    const res = await USAGE_GET(req);
    expect(res.status).toBe(200);
    expect(mocks.getAiUsageSnapshot).toHaveBeenCalledWith(
      30,
      null,
      null,
      null,
      expect.objectContaining({
        budgetMonthlyEur: undefined,
        errorRateWarnPct: undefined,
      }),
    );
  });

  it("passes through auth gate failures", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const req = new NextRequest("http://localhost/api/admin/telemetry/ai/usage");

    const res = await USAGE_GET(req);
    expect(res.status).toBe(403);
    expect(mocks.getAiUsageSnapshot).not.toHaveBeenCalled();
  });
});
