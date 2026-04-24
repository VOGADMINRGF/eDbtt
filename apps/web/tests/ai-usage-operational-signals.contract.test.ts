import { describe, expect, it } from "vitest";

import {
  deriveAiUsageOperationalSignals,
  type AiUsageBreakdownRow,
  type AiUsageErrorKindRow,
} from "@core/telemetry/aiUsageSnapshot";
import type { AiUsageDailyRow } from "@core/telemetry/aiUsageTypes";

function makeRow(overrides: Partial<AiUsageBreakdownRow>): AiUsageBreakdownRow {
  return {
    key: "row",
    label: "Row",
    tokens: 0,
    costEur: 0,
    calls: 0,
    errors: 0,
    errorRatePct: 0,
    successRatePct: 100,
    avgDurationMs: 0,
    costPerCallEur: 0,
    ...overrides,
  };
}

function makeErrorRow(overrides: Partial<AiUsageErrorKindRow>): AiUsageErrorKindRow {
  return {
    key: "none",
    label: "Ohne Fehler",
    calls: 0,
    ratePct: 0,
    ...overrides,
  } as AiUsageErrorKindRow;
}

describe("ai usage operational signals", () => {
  it("derives cost/error/latency/research/fallback metrics with optimization candidates", () => {
    const rows: AiUsageDailyRow[] = [
      {
        date: "2026-04-20",
        provider: "openai",
        pipeline: "contribution_analyze",
        tokensTotal: 1_000,
        costTotalEur: 20,
        callsTotal: 40,
        callsError: 4,
        region: "DE-BE",
      },
      {
        date: "2026-04-20",
        provider: "anthropic",
        pipeline: "contribution_analyze",
        tokensTotal: 800,
        costTotalEur: 16,
        callsTotal: 40,
        callsError: 2,
        region: "DE-BE",
      },
      {
        date: "2026-04-20",
        provider: "ari",
        pipeline: "factcheck",
        tokensTotal: 1_200,
        costTotalEur: 24,
        callsTotal: 20,
        callsError: 1,
        region: "DE-BE",
      },
      {
        date: "2026-04-20",
        provider: "openai",
        pipeline: "provider_probe",
        tokensTotal: 0,
        costTotalEur: 0,
        callsTotal: 12,
        callsError: 0,
        region: "DE-BE",
      },
    ];

    const result = deriveAiUsageOperationalSignals({
      rangeDays: 30,
      totals: { tokens: 3_000, costEur: 60, calls: 100, errors: 7 },
      performance: {
        avgDurationMs: 14_000,
        successRatePct: 93,
        errorRatePct: 7,
        costPerCallEur: 0.6,
      },
      byProvider: [
        makeRow({
          key: "openai",
          label: "OpenAI",
          calls: 52,
          errors: 4,
          costEur: 20,
          errorRatePct: 7.7,
          avgDurationMs: 13_500,
          costPerCallEur: 0.3846,
        }),
        makeRow({
          key: "anthropic",
          label: "Anthropic",
          calls: 40,
          errors: 2,
          costEur: 16,
          errorRatePct: 5,
          avgDurationMs: 8_000,
          costPerCallEur: 0.4,
        }),
        makeRow({
          key: "ari",
          label: "ARI",
          calls: 20,
          errors: 1,
          costEur: 24,
          errorRatePct: 5,
          avgDurationMs: 15_000,
          costPerCallEur: 1.2,
        }),
      ],
      byPipeline: [
        makeRow({
          key: "contribution_analyze",
          label: "Beiträge",
          calls: 80,
          errors: 6,
          costEur: 36,
          avgDurationMs: 9_000,
          costPerCallEur: 0.45,
        }),
        makeRow({
          key: "factcheck",
          label: "Factcheck",
          calls: 20,
          errors: 1,
          costEur: 24,
          avgDurationMs: 18_000,
          costPerCallEur: 1.2,
        }),
      ],
      byLane: [
        makeRow({ key: "standard", label: "Standard", calls: 80, costEur: 36 }),
        makeRow({
          key: "sealed_factcheck",
          label: "Sealed",
          calls: 20,
          costEur: 24,
        }),
      ],
      byErrorKind: [
        makeErrorRow({ key: "TIMEOUT", label: "Timeout", calls: 5, ratePct: 8 }),
        makeErrorRow({ key: "BAD_JSON", label: "Bad JSON", calls: 2, ratePct: 3.5 }),
      ],
      rows,
    });

    expect(result.derivedMetrics.fallbackRelianceSharePct).toBe(40);
    expect(result.derivedMetrics.researchHeavyWorkloadSharePct).toBe(20);
    expect(result.derivedMetrics.sealedFactcheckCostFootprintPct).toBe(40);
    expect(result.derivedMetrics.projectedMonthlyCostEur).toBe(60);
    expect(result.optimization.savingsCandidates.length).toBeGreaterThan(0);
    expect(result.optimization.qualityCandidates.length).toBeGreaterThan(0);
    expect(result.optimization.stabilityCandidates.length).toBeGreaterThan(0);
    expect(
      result.attentionFlags.some((flag) => flag.id === "cost_per_call"),
    ).toBe(true);
    expect(result.attentionFlags.some((flag) => flag.id === "latency")).toBe(true);
  });

  it("supports threshold overrides for budget and fallback warnings", () => {
    const result = deriveAiUsageOperationalSignals({
      rangeDays: 10,
      totals: { tokens: 100, costEur: 50, calls: 50, errors: 0 },
      performance: {
        avgDurationMs: 500,
        successRatePct: 100,
        errorRatePct: 0,
        costPerCallEur: 1,
      },
      byProvider: [makeRow({ key: "openai", label: "OpenAI", calls: 40, costEur: 40 })],
      byPipeline: [makeRow({ key: "factcheck", label: "Factcheck", calls: 50, costEur: 50 })],
      byLane: [makeRow({ key: "sealed_factcheck", label: "Sealed", calls: 50, costEur: 50 })],
      byErrorKind: [],
      rows: [
        {
          date: "2026-04-20",
          provider: "openai",
          pipeline: "factcheck",
          tokensTotal: 100,
          costTotalEur: 50,
          callsTotal: 50,
          callsError: 0,
          region: "DE-BE",
        },
      ],
      thresholds: {
        budgetMonthlyEur: 1000,
        projectedBudgetWarnPct: 200,
        fallbackRelianceWarnSharePct: 95,
      },
    });

    expect(result.thresholds.budgetMonthlyEur).toBe(1000);
    expect(result.attentionFlags.some((flag) => flag.id === "budget_projection")).toBe(
      false,
    );
    expect(result.attentionFlags.some((flag) => flag.id === "fallback_reliance")).toBe(
      true,
    );
  });

  it("stays defensive with empty inputs", () => {
    const result = deriveAiUsageOperationalSignals({
      rangeDays: 30,
      totals: { tokens: 0, costEur: 0, calls: 0, errors: 0 },
      performance: {
        avgDurationMs: 0,
        successRatePct: 0,
        errorRatePct: 0,
        costPerCallEur: 0,
      },
      byProvider: [],
      byPipeline: [],
      byLane: [],
      byErrorKind: [],
      rows: [],
    });

    expect(result.derivedMetrics.fallbackRelianceSharePct).toBe(0);
    expect(result.derivedMetrics.researchHeavyWorkloadSharePct).toBe(0);
    expect(result.derivedMetrics.sealedFactcheckCostFootprintPct).toBe(0);
    expect(result.attentionFlags.length).toBe(0);
  });
});
