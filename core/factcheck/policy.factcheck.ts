import type { ProviderOutput } from "./types";

// Betriebsmodus
export const FACTCHECK_MODE = process.env.FACTCHECK_MODE ?? "mock";

// Schwellen (ENV-Overrides möglich)
export const T1 = Number(process.env.FACTCHECK_T1 ?? 0.85);
export const T2 = Number(process.env.FACTCHECK_T2 ?? 0.80);
export const T3 = Number(process.env.FACTCHECK_T3 ?? 0.80);

// Provider-Reihenfolge & Schwellen/Weights
export const PROVIDER_ORDER: Array<"ARI" | "CLAUDE" | "MISTRAL"> = ["ARI", "CLAUDE", "MISTRAL"];
export const PROVIDER_THRESHOLDS: Record<"ARI" | "CLAUDE" | "MISTRAL", number> = { ARI: T1, CLAUDE: T2, MISTRAL: T3 };
export const PROVIDER_WEIGHTS: Record<string, number> = { ARI: 1.0, CLAUDE: 0.9, MISTRAL: 0.85 };

export function thresholdFor(p: keyof typeof PROVIDER_THRESHOLDS) {
  return PROVIDER_THRESHOLDS[p];
}

// Budgets & Concurrency
export const MAX_TOKENS_PER_JOB = Number(process.env.FACTCHECK_MAX_TOKENS_PER_JOB ?? 20000);
export const UNLIMITED_TOKENS = Number.isFinite(MAX_TOKENS_PER_JOB) && MAX_TOKENS_PER_JOB < 0;
export const MAX_CLAIMS_PER_JOB = Number(process.env.FACTCHECK_MAX_CLAIMS_PER_JOB ?? 20);
export const MAX_FALLBACKS = Number(process.env.FACTCHECK_MAX_FALLBACKS ?? 2);
export const WORKER_CONCURRENCY = Number(process.env.FACTCHECK_WORKER_CONCURRENCY ?? 5);

// robuste Token-Schätzung (wenn Provider keine liefert)
export function estimateTokensFromText(text: string): number {
  const base = Math.ceil(text.length / 4);
  return Math.max(300, Math.min(4000, Math.floor(base * 1.1)));
}

// Multi-dimensionales Gating für Provider-Kette
export function evaluateProviderChain(
  outputs: ProviderOutput[],
  claimText: string,
  ctx: { tokensUsed: number; maxTokens: number }
): boolean {
  if (outputs.length === 0) return true;

  // 1) Harte Gate: Wenn erster Provider (meist ARI) über seiner Schwelle ist → stoppen
  const first = outputs[0];
  const thr = thresholdFor(first.provider as any);
  if (first.confidence >= thr) return false;

  // 2) Confidence-Gap & Alignment
  const gap =
    outputs.length > 1 ? Math.abs(outputs[0].confidence - outputs[outputs.length - 1].confidence) : 1;
  const alignment = outputs.every(o => o.verdict === outputs[0].verdict);

  // 3) Kosten-Effizienz
  const costEff = ctx.maxTokens > 0 ? ctx.tokensUsed / ctx.maxTokens : 0;

  // 4) einfache Heuristik: wenn uneinheitlich oder geringer gap und Budget ok → weitermachen
  if (!alignment) return true;
  if (gap < 0.07 && costEff < 0.9) return true;

  // sonst stoppen
  return false;
}
