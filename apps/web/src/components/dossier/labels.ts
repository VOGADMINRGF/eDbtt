export const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  review: "Prüfung",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

export const VOTE_POLICY_LABELS: Record<string, string> = {
  quick: "Kurz",
  standard: "Standard",
  civic: "Bürgerbeteiligung (mindestens 5 Optionen)",
};

export const STANCE_LABELS: Record<string, string> = {
  pro: "Pro",
  neutral: "Neutral",
  contra: "Contra",
};

export const RESPONSIBILITY_LABELS: Record<string, string> = {
  municipality: "Kommune",
  district: "Kreis",
  state: "Land",
  federal: "Bund",
  eu: "EU",
  global: "International",
  ngo: "Zivilgesellschaft",
  private: "Privat",
  unknown: "Unklar",
};

export const JURISDICTION_LABELS: Record<string, string> = {
  municipal: "Kommune",
  state: "Land",
  federal: "Bund",
  eu: "EU",
  global: "International",
};

export const UI_DE = {
  levelMunicipal: "Ebene: Kommune",
  level: "Ebene",
  municipalityRegion: "Kommune/Region",
  created: "Erstellt",
  updated: "Aktualisiert",
  analysisMethod: "Analyseverfahren: Standardisierte Dossieranalyse",
  voteMode: "Abstimmungsmodus: Bürgerbeteiligung",
  minOptions: "Mindestoptionen",
  communityOptions: "Community-Optionen",
  methodProtocol: "Methode & Protokoll",
  evidence: "Evidenz",
  evidenceField: "Evidenzfeld",
  coreStatements: "Kernaussagen",
  decisionPaths: "Entscheidungswege",
  scenarios: "Szenarien",
  material: "Material",
  streams: "Themenströme",
  contributions: "Beiträge",
} as const;

export const SECTION_TITLES = {
  options: "Optionenraum",
  statements: "Kernaussagen-Landschaft",
  evidence: "Evidenz & Quellen",
  report: "Berichtszusammenfassung",
  decisionTrees: "Entscheidungswege",
  metadata: "Akte",
  methodology: "Methode & Protokoll",
  sources: "Quellen",
  questions: "Offene Fragen & Zuständigkeit",
  responsibilityPaths: "Verantwortungswege",
  graph: "Evidenzfeld",
  clusters: "Cluster & Spannungen",
};

export const OPTION_TYPE_LABELS: Record<string, string> = {
  status_quo: "Status quo",
  reform_strong: "Reform (stark)",
  reform_moderate: "Reform (moderat)",
  pilot: "Pilot/Übergang",
  sovereignty: "Souveränität",
  custom: "Maßnahme",
};

export const EDGE_KIND_LABELS: Record<string, string> = {
  supports: "stützt",
  refutes: "widerlegt",
  mentions: "erwähnt",
  contradicts: "widerspricht",
  unknown: "unklar",
};
