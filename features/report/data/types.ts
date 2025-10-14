export type VoteTotals = { agree: number; neutral: number; disagree: number };

export type CountryVotes = {
  code: string;            // "DE" | "FR" | "EU" ...
  region: string;          // "Deutschland", "Frankreich", ...
  agree: number;
  neutral: number;
  disagree: number;
};

export type ReportLite = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  createdAt?: string;      // ISO
  updatedAt?: string;      // ISO
  author?: string;
  status?: "active" | "draft" | "archived";
  visibility?: "public" | "private";
  language?: string;       // "de" | "en" | ...
  tags?: string[];
  imageUrl?: string;
  regionScope?: string[];  // ["Deutschland","EU","Global"]
};

export type ReportFull = ReportLite & {
  context?: {
    scientific?: string;
    societal?: string;
    economic?: string;
  };
  startingPoint?: Record<string, string>;
  statements?: string[];     // IDs der Statements
  votes?: {
    total: VoteTotals;
    countries?: CountryVotes[];
  };
  facts?: { text: string; source?: { name: string; url?: string; trust?: number } }[];
  analytics?: unknown;
  voices?: { type: string; name: string; quote: string; url?: string; date?: string }[];
  relevance?: Record<string, string>;
  editorialSummary?: { pro?: string[]; contra?: string[]; neutral?: string[] };
  globalTrend?: string;
  metaRelevance?: string;
  legalBasis?: string[];
  responsibleBodies?: string[];
  timeline?: { date: string }[] & Partial<VoteTotals>[];
  moderation?: { reviewed?: boolean; reviewedBy?: string[]; qualityScore?: number; aiNotes?: string };
};
