import type { ConsensusInput, ConsensusResult, Verdict } from "./types";
import { PROVIDER_WEIGHTS } from "./policy.factcheck";

// 1 - HHI; höher = diverser
function diversityIndex(domains: string[]): number {
  const n = domains.length || 1;
  const counts = domains.reduce<Record<string, number>>((acc, d) => ((acc[d] = (acc[d] || 0) + 1), acc), {});
  const hhi = Object.values(counts).reduce((s, c) => s + Math.pow(c / n, 2), 0);
  return Math.max(0, 1 - hhi);
}

// 1 = perfekte Balance For/Against
function balanceScore(evidenceFor: number, evidenceAgainst: number): number {
  const total = Math.max(1, evidenceFor + evidenceAgainst);
  const diff = Math.abs(evidenceFor - evidenceAgainst) / total;
  return Math.max(0, 1 - diff);
}

export function advancedConsensus(input: ConsensusInput): ConsensusResult {
  const { outputs, providerTrusts, evidenceFor, evidenceAgainst, domains } = input;

  // Fallback: alles pending → pending
  if (outputs.length === 0 || outputs.every(o => o.verdict === "pending")) {
    return { verdict: "pending", confidence: 0, balanceScore: 0.5, diversityIndex: 0.5 };
  }

  // Provider-basierter Score mit Trust-Faktor
  const scores: Record<Verdict, number> = { true: 0, false: 0, disputed: 0, pending: 0 };
  outputs.forEach((o, idx) => {
    const base = (PROVIDER_WEIGHTS[o.provider] ?? 0.8) * o.confidence * (providerTrusts[idx] ?? 0.8);
    scores[o.verdict] += base;
  });

  // Bestes Verdict wählen
  const best = (Object.entries(scores) as Array<[Verdict, number]>).sort((a, b) => b[1] - a[1])[0][0];

  // Kalibration durch Diversity & Balance (±0.08 gekappt)
  const di = diversityIndex(domains);
  const bs = balanceScore(evidenceFor, evidenceAgainst);

  const rawTotal = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const rawConf = scores[best] / rawTotal;
  const adjusted = Math.max(0, Math.min(1, rawConf + (di - 0.5) * 0.08 + (bs - 0.5) * 0.08));

  return { verdict: best, confidence: adjusted, balanceScore: bs, diversityIndex: di };
}
