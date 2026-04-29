import type { E150ProviderName } from "@features/ai/orchestratorE150";

export type EstimateAiRunCostInput = {
  provider: E150ProviderName;
  model: string | null | undefined;
  tokensIn: number | null | undefined;
  tokensOut: number | null | undefined;
  eurPerUsd?: number | null | undefined;
};

export type EstimateAiRunCostResult = {
  estimatedCostUsd: number | null;
  estimatedCostEur: number | null;
  costKnown: boolean;
  pricingSource: string;
  reason: string | null;
};

type PriceEntry = {
  provider: E150ProviderName;
  modelPrefix: string;
  inputUsdPer1M: number;
  outputUsdPer1M: number;
};

const PRICING_SOURCE = "internal_smoke_estimate_2026-04-29";
const DEFAULT_EUR_PER_USD = 0.92;
const PRICE_TABLE: readonly PriceEntry[] = [
  { provider: "openai", modelPrefix: "gpt-4.1-mini", inputUsdPer1M: 0.4, outputUsdPer1M: 1.6 },
  { provider: "openai", modelPrefix: "gpt-4.1", inputUsdPer1M: 2.0, outputUsdPer1M: 8.0 },
  { provider: "openai", modelPrefix: "gpt-4o-mini", inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  { provider: "openai", modelPrefix: "gpt-4o", inputUsdPer1M: 2.5, outputUsdPer1M: 10.0 },
  { provider: "anthropic", modelPrefix: "claude-sonnet-4", inputUsdPer1M: 3.0, outputUsdPer1M: 15.0 },
  { provider: "mistral", modelPrefix: "mistral-large", inputUsdPer1M: 2.0, outputUsdPer1M: 6.0 },
];

function roundCost(value: number): number {
  return Number(value.toFixed(8));
}

function findPriceEntry(provider: E150ProviderName, model: string): PriceEntry | null {
  const normalized = model.trim().toLowerCase();
  if (!normalized) return null;
  for (const entry of PRICE_TABLE) {
    if (entry.provider !== provider) continue;
    if (normalized.startsWith(entry.modelPrefix.toLowerCase())) return entry;
  }
  return null;
}

export function estimateAiRunCost(input: EstimateAiRunCostInput): EstimateAiRunCostResult {
  const tokensIn = typeof input.tokensIn === "number" && input.tokensIn >= 0 ? input.tokensIn : null;
  const tokensOut = typeof input.tokensOut === "number" && input.tokensOut >= 0 ? input.tokensOut : null;
  const model = typeof input.model === "string" ? input.model.trim() : "";
  if (!model) {
    return {
      estimatedCostUsd: null,
      estimatedCostEur: null,
      costKnown: false,
      pricingSource: PRICING_SOURCE,
      reason: "model_missing",
    };
  }
  if (tokensIn === null && tokensOut === null) {
    return {
      estimatedCostUsd: null,
      estimatedCostEur: null,
      costKnown: false,
      pricingSource: PRICING_SOURCE,
      reason: "token_usage_missing",
    };
  }

  const entry = findPriceEntry(input.provider, model);
  if (!entry) {
    return {
      estimatedCostUsd: null,
      estimatedCostEur: null,
      costKnown: false,
      pricingSource: PRICING_SOURCE,
      reason: "pricing_unknown_for_model",
    };
  }

  const usd =
    ((tokensIn ?? 0) / 1_000_000) * entry.inputUsdPer1M +
    ((tokensOut ?? 0) / 1_000_000) * entry.outputUsdPer1M;
  const eurRate =
    typeof input.eurPerUsd === "number" && Number.isFinite(input.eurPerUsd) && input.eurPerUsd > 0
      ? input.eurPerUsd
      : DEFAULT_EUR_PER_USD;
  return {
    estimatedCostUsd: roundCost(usd),
    estimatedCostEur: roundCost(usd * eurRate),
    costKnown: true,
    pricingSource: PRICING_SOURCE,
    reason: null,
  };
}
