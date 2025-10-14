import type { ConsensusResult, ProviderOutput } from "../types";
import { CLAIMTRUST_VERSION } from "../version";

export function buildClaimTrustExport(
  claimId: string,
  claimText: string,
  language: string | undefined,
  topic: string | undefined,
  providers: ProviderOutput[],
  consensus: ConsensusResult
) {
  return {
    claimId,
    claimText,
    language,
    topic,
    results: providers.map((p: ProviderOutput) => ({
      provider: p.provider,
      verdict: p.verdict,
      confidence: p.confidence,
      rawOutput: p.raw,
      costTokens: p.costTokens ?? 0
    })),
    consensus: {
      method: providers.length > 1 ? "multi-ki" : "ari",
      verdict: consensus.verdict,
      confidence: consensus.confidence,
      explanation:
        "Advanced consensus: provider*confidence*trust, calibrated by diversity and evidence balance."
    },
    sources: providers.flatMap((p) =>
      p.sources.map((s) => ({
        url: s.url,
        domain: s.domain,
        trustScore: undefined,
        hash: undefined,
        timestamp: new Date().toISOString()
      }))
    ),
    audit: {
      createdAt: new Date().toISOString(),
      signatures: [],
      version: CLAIMTRUST_VERSION
    }
  };
}
