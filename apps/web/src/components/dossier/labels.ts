export const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  review: "Prüfung",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

export const VOTE_POLICY_LABELS: Record<string, string> = {
  quick: "Kurz",
  standard: "Standard",
  civic: "Bürgerbeteiligung",
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
  municipal: "Kommunal",
  state: "Land",
  federal: "Bund",
  eu: "EU",
  global: "International",
};

export const SECTION_TITLES = {
  options: "Optionenraum",
  statements: "Statement-Landschaft",
  evidence: "Evidenz & Quellen",
  report: "Berichtszusammenfassung",
  decisionTrees: "Entscheidungsbäume",
  metadata: "Akte",
  methodology: "Methodik & Protokoll",
  sources: "Quellen",
  questions: "Offene Fragen",
  responsibilityPaths: "Verantwortungswege",
  graph: "Evidenz-Mindmap",
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
};
