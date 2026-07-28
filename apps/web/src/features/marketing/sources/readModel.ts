export type MarketingSourceDecisionState = "decided" | "open" | "manual_gate";

export type MarketingSourceCoverageGroup = {
  id: "international" | "eu" | "germany" | "neighbours" | "states";
  labelDe: string;
  labelEn: string;
  areaCount: number;
  rawCandidateLimit: number;
  operatorTopLimit: number;
};

export type MarketingSourceDecision = {
  id: string;
  state: MarketingSourceDecisionState;
  titleDe: string;
  titleEn: string;
  detailDe: string;
  detailEn: string;
};

export type MarketingSourceDecisionReadModel = {
  contractStatus: "decision_contract";
  liveIngestionEnabled: false;
  coverageAreaCount: 29;
  rawCandidateCapacity: 560;
  candidateLimitPerArea: 20;
  operatorTopLimitPerArea: 20;
  phase1SourcePolicy: "official_public_machine_readable_sources";
  phase2ProviderCandidate: "gdelt-cloud";
  coverage: MarketingSourceCoverageGroup[];
  decisions: MarketingSourceDecision[];
  regionalSourceRoute: "/admin/regions";
  connectionsRouteAvailable: false;
  liveTopicRouteAvailable: false;
};

const COVERAGE: MarketingSourceCoverageGroup[] = [
  {
    id: "international",
    labelDe: "International",
    labelEn: "International",
    areaCount: 1,
    rawCandidateLimit: 20,
    operatorTopLimit: 20,
  },
  {
    id: "eu",
    labelDe: "Europäische Union",
    labelEn: "European Union",
    areaCount: 1,
    rawCandidateLimit: 20,
    operatorTopLimit: 20,
  },
  {
    id: "germany",
    labelDe: "Deutschland national",
    labelEn: "Germany national",
    areaCount: 1,
    rawCandidateLimit: 20,
    operatorTopLimit: 20,
  },
  {
    id: "neighbours",
    labelDe: "Neun Nachbarländer",
    labelEn: "Nine neighbouring countries",
    areaCount: 9,
    rawCandidateLimit: 180,
    operatorTopLimit: 20,
  },
  {
    id: "states",
    labelDe: "16 Bundesländer",
    labelEn: "16 German states",
    areaCount: 16,
    rawCandidateLimit: 320,
    operatorTopLimit: 20,
  },
];

const DECISIONS: MarketingSourceDecision[] = [
  {
    id: "phase1-policy",
    state: "decided",
    titleDe: "Phase-1-Quellenpolitik",
    titleEn: "Phase 1 source policy",
    detailDe:
      "Amtliche und ausdrücklich veröffentlichte RSS-, Atom-, JSON-Feed- oder Public-API-Quellen ohne Credentials bilden den Startpunkt.",
    detailEn:
      "Official and explicitly published RSS, Atom, JSON feed or public API sources without credentials form the starting point.",
  },
  {
    id: "source-allowlist",
    state: "open",
    titleDe: "Konkrete Source-Allowlist",
    titleEn: "Concrete source allowlist",
    detailDe:
      "Für International, EU, Deutschland, Nachbarländer und Bundesländer müssen die konkreten Herausgeber und Endpunkte freigegeben werden.",
    detailEn:
      "Concrete publishers and endpoints must be approved for international, EU, German, neighbouring-country and state coverage.",
  },
  {
    id: "license-storage",
    state: "open",
    titleDe: "Lizenz, Speicherung und Retention",
    titleEn: "Licensing, storage and retention",
    detailDe:
      "Je Quelle sind erlaubte Metadaten, mögliche Kurztexte, Aufbewahrung, Löschung und Pausenregeln festzulegen.",
    detailEn:
      "Allowed metadata, possible excerpts, retention, deletion and pause rules must be defined for every source.",
  },
  {
    id: "fetch-freshness",
    state: "open",
    titleDe: "Abruf, Freshness und Fehlerbetrieb",
    titleEn: "Fetch, freshness and failure operation",
    detailDe:
      "Abrufintervall, Stale-Grenze, Rate-Limit-Verhalten, Caching und sichtbare Fehlerzustände sind noch zu bestätigen.",
    detailEn:
      "Fetch cadence, stale thresholds, rate-limit behaviour, caching and visible failure states still require confirmation.",
  },
  {
    id: "phase2-provider",
    state: "manual_gate",
    titleDe: "Breiter Medienprovider",
    titleEn: "Broader media provider",
    detailDe:
      "GDELT Cloud ist nur der bevorzugte Phase-2-Kandidat. API-Key, Tarif, Kostenlimit, Lizenz und Retention sind nicht freigegeben.",
    detailEn:
      "GDELT Cloud is only the preferred Phase 2 candidate. API key, plan, cost cap, licensing and retention are not approved.",
  },
  {
    id: "live-activation",
    state: "manual_gate",
    titleDe: "Live-Ingestion aktivieren",
    titleEn: "Enable live ingestion",
    detailDe:
      "Reale automatische Erfassung und ein Live-Themenradar starten erst nach Allowlist-, Provider- und Betriebsfreigabe.",
    detailEn:
      "Automated collection and a live topic radar start only after allowlist, provider and operating approval.",
  },
];

export function buildMarketingSourceDecisionReadModel(): MarketingSourceDecisionReadModel {
  return {
    contractStatus: "decision_contract",
    liveIngestionEnabled: false,
    coverageAreaCount: 29,
    rawCandidateCapacity: 560,
    candidateLimitPerArea: 20,
    operatorTopLimitPerArea: 20,
    phase1SourcePolicy: "official_public_machine_readable_sources",
    phase2ProviderCandidate: "gdelt-cloud",
    coverage: COVERAGE,
    decisions: DECISIONS,
    regionalSourceRoute: "/admin/regions",
    connectionsRouteAvailable: false,
    liveTopicRouteAvailable: false,
  };
}
