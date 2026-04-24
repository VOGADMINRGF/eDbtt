export type AiUsageThresholdInputKey =
  | "budgetMonthlyEur"
  | "projectedBudgetWarnPct"
  | "errorRateWarnPct"
  | "avgDurationWarnMs"
  | "costPerCallWarnEur"
  | "fallbackRelianceWarnSharePct"
  | "researchHeavyWarnSharePct"
  | "sealedCostFootprintWarnSharePct"
  | "timeoutWarnSharePct"
  | "badJsonWarnSharePct";

export type AiUsageThresholdInputMap = Record<AiUsageThresholdInputKey, string>;

export function toPositiveNumberInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function rowErrorRate(row: { calls: number; errors: number }): number {
  if (!row.calls) return 0;
  return (row.errors / row.calls) * 100;
}

export function hasMeaningfulUsageData(snapshot: {
  totals: { calls: number; tokens: number; costEur: number };
} | null): boolean {
  if (!snapshot) return false;
  return snapshot.totals.calls > 0 || snapshot.totals.tokens > 0 || snapshot.totals.costEur > 0;
}

export function buildAiUsageQueryParams(args: {
  range: string;
  provider: string;
  pipeline: string;
  region: string;
  thresholdInputs: AiUsageThresholdInputMap;
}): URLSearchParams {
  const query = new URLSearchParams({ range: args.range });
  if (args.provider !== "all") query.set("provider", args.provider);
  if (args.pipeline !== "all") query.set("pipeline", args.pipeline);
  const region = args.region.trim();
  if (region) query.set("region", region);

  (Object.entries(args.thresholdInputs) as Array<[AiUsageThresholdInputKey, string]>).forEach(
    ([key, rawValue]) => {
      const parsed = toPositiveNumberInput(rawValue);
      if (parsed !== null) query.set(key, String(parsed));
    },
  );

  return query;
}
