import { describe, expect, it } from "vitest";
import {
  buildAiUsageQueryParams,
  hasMeaningfulUsageData,
  rowErrorRate,
  toPositiveNumberInput,
  type AiUsageThresholdInputMap,
} from "@/features/admin/aiUsageView";

const BASE_THRESHOLDS: AiUsageThresholdInputMap = {
  budgetMonthlyEur: "150",
  projectedBudgetWarnPct: "85",
  errorRateWarnPct: "8",
  avgDurationWarnMs: "12000",
  costPerCallWarnEur: "0.05",
  fallbackRelianceWarnSharePct: "40",
  researchHeavyWarnSharePct: "35",
  sealedCostFootprintWarnSharePct: "45",
  timeoutWarnSharePct: "5",
  badJsonWarnSharePct: "3",
};

describe("ai usage view helper contract", () => {
  it("builds filter query with trimmed region and numeric thresholds", () => {
    const query = buildAiUsageQueryParams({
      range: "7",
      provider: "openai",
      pipeline: "factcheck",
      region: "  DE-BE  ",
      thresholdInputs: {
        ...BASE_THRESHOLDS,
        badJsonWarnSharePct: "3.5",
      },
    });

    expect(query.get("range")).toBe("7");
    expect(query.get("provider")).toBe("openai");
    expect(query.get("pipeline")).toBe("factcheck");
    expect(query.get("region")).toBe("DE-BE");
    expect(query.get("badJsonWarnSharePct")).toBe("3.5");
    expect(query.get("budgetMonthlyEur")).toBe("150");
  });

  it("omits all-filter and invalid threshold values", () => {
    const query = buildAiUsageQueryParams({
      range: "30",
      provider: "all",
      pipeline: "all",
      region: "   ",
      thresholdInputs: {
        ...BASE_THRESHOLDS,
        budgetMonthlyEur: "-1",
        errorRateWarnPct: "abc",
      },
    });

    expect(query.get("provider")).toBeNull();
    expect(query.get("pipeline")).toBeNull();
    expect(query.get("region")).toBeNull();
    expect(query.get("budgetMonthlyEur")).toBeNull();
    expect(query.get("errorRateWarnPct")).toBeNull();
    expect(query.get("costPerCallWarnEur")).toBe("0.05");
  });

  it("computes defensive helper metrics for empty snapshots", () => {
    expect(hasMeaningfulUsageData(null)).toBe(false);
    expect(
      hasMeaningfulUsageData({
        totals: { calls: 0, tokens: 0, costEur: 0 },
      }),
    ).toBe(false);
    expect(
      hasMeaningfulUsageData({
        totals: { calls: 1, tokens: 0, costEur: 0 },
      }),
    ).toBe(true);
    expect(rowErrorRate({ calls: 0, errors: 10 })).toBe(0);
    expect(rowErrorRate({ calls: 20, errors: 5 })).toBe(25);
  });

  it("parses positive number inputs only", () => {
    expect(toPositiveNumberInput("12.5")).toBe(12.5);
    expect(toPositiveNumberInput("-1")).toBeNull();
    expect(toPositiveNumberInput("not-a-number")).toBeNull();
  });
});
