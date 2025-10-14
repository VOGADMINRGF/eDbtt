export type Verdict = "true" | "false" | "disputed" | "pending";

export interface SourceRef {
  url: string;
  domain: string;
}

export interface ProviderOutput<TRaw = unknown> {
  provider: "ARI" | "CLAUDE" | "MISTRAL";
  verdict: Verdict;
  confidence: number;               // 0..1
  sources: SourceRef[];
  raw: TRaw;
  costTokens?: number;              // optional (geschätzt möglich)
}

export interface RhetoricFlag {
  type: string;                     // z. B. "AdHominem"
  confidence: number;               // 0..1
}

export interface ClaimMeta {
  text: string;
  language?: string;
  topic?: string;
  falsifiable: boolean;
  frames: string[];
  rhetoricalFlags: RhetoricFlag[];
}

export interface ConsensusInput {
  outputs: ProviderOutput[];
  providerTrusts: number[];         // 0..1 pro ProviderOutput
  evidenceFor: number;
  evidenceAgainst: number;
  domains: string[];
}

export interface ConsensusResult {
  verdict: Verdict;
  confidence: number;               // kalibriert (0..1)
  balanceScore: number;             // For/Against Balance (0..1)
  diversityIndex: number;           // 1 - HHI (0..1)
}
