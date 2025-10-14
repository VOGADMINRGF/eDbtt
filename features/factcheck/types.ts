// features/factcheck/types.ts
export type EvidenceStance = "FOR" | "AGAINST" | "NEUTRAL";

export type SourceRef = {
  url: string;
  domain: string;         // z.B. "bundestag.de", "who.int"
  title?: string;
  publishedAt?: string;   // ISO
  archivedUrl?: string;
  author?: string;
};

export type Evidence = {
  id: string;
  stance: EvidenceStance;
  source: SourceRef;
  trustHint?: number;     // 0..1 optional override je Quelle
};

export type FactVerdict =
  | "LIKELY_TRUE"
  | "LIKELY_FALSE"
  | "MIXED"
  | "UNDETERMINED";

export type FactCheck = {
  verdict: FactVerdict;
  confidence: number;    // 0..1
  reviewedBy?: string[];
  reviewedAt?: string;   // ISO
  evidences: Evidence[];
};
