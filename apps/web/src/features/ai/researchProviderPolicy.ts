export type ResearchProviderId = "perplexity" | "ari" | "openai_deep_research";
export type ResearchProviderRole =
  | "research_discovery"
  | "deep_research_optional"
  | "premium_deep_research_fallback";

export type ResearchProviderPolicy = {
  provider: ResearchProviderId;
  role: ResearchProviderRole;
  strictPrimary: false;
  analyzeProvider: false;
  coreOrchestrator: false;
  notes: string[];
};

export const RESEARCH_ENTITLEMENT_KEYS = [
  "search_credit",
  "deep_research_credit",
  "dossier_boost",
  "research_supporter",
  "initiator",
] as const;

export type ResearchEntitlementKey = (typeof RESEARCH_ENTITLEMENT_KEYS)[number];

export const OPTIONAL_RESEARCH_PROVIDER_POLICIES: readonly ResearchProviderPolicy[] = [
  {
    provider: "perplexity",
    role: "research_discovery",
    strictPrimary: false,
    analyzeProvider: false,
    coreOrchestrator: false,
    notes: [
      "Optional search/research discovery provider.",
      "Not a strict AnalyzeResult provider.",
      "Not required for standard_analyze.",
    ],
  },
  {
    provider: "ari",
    role: "deep_research_optional",
    strictPrimary: false,
    analyzeProvider: false,
    coreOrchestrator: false,
    notes: [
      "Optional premium deep research provider.",
      "Not a strict AnalyzeResult provider.",
      "Never core orchestrator.",
    ],
  },
  {
    provider: "openai_deep_research",
    role: "premium_deep_research_fallback",
    strictPrimary: false,
    analyzeProvider: false,
    coreOrchestrator: false,
    notes: [
      "Optional premium deep research fallback provider.",
      "Separate from normal OpenAI analyze/smoke provider.",
      "Never default and never standard_analyze fallback.",
    ],
  },
];
