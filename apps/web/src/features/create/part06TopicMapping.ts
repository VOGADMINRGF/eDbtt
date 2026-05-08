/**
 * Part06 SSOT mirror for create topic mapping.
 *
 * Source of truth:
 * docs/E150/Part06_Themenkatalog_und_Zustaendigkeiten.md
 *
 * This file exists as a stable mirror for UI usage and contract tests only.
 * It is not a parallel taxonomy. Changes here must follow Part06 changes.
 */

export type Part06CategoryKey =
  | "democracy_elections"
  | "budget_finance"
  | "work_economy"
  | "social_family"
  | "education_research"
  | "health_care"
  | "climate_environment"
  | "energy_infrastructure"
  | "mobility_urban"
  | "interior_security"
  | "justice_law"
  | "migration_integration"
  | "digital_media"
  | "europe_foreign"
  | "local_community";

export const PART06_CATEGORY_LABEL_BY_KEY: Record<Part06CategoryKey, string> = {
  democracy_elections: "Demokratie & Wahlen",
  budget_finance: "Haushalt & Finanzen",
  work_economy: "Arbeit & Wirtschaft",
  social_family: "Soziales & Familie",
  education_research: "Bildung & Forschung",
  health_care: "Gesundheit & Pflege",
  climate_environment: "Klima & Umwelt",
  energy_infrastructure: "Energie & Infrastruktur",
  mobility_urban: "Mobilität & Stadtentwicklung",
  interior_security: "Inneres & Sicherheit",
  justice_law: "Justiz & Recht",
  migration_integration: "Migration & Integration",
  digital_media: "Digitalisierung & Medien",
  europe_foreign: "Europa & Außenpolitik",
  local_community: "Kommunales & Lebensumfeld",
};

export const PART06_CATEGORY_KEYS = Object.keys(PART06_CATEGORY_LABEL_BY_KEY) as Part06CategoryKey[];

export function resolvePart06CategoryLabels(keys: readonly Part06CategoryKey[]): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    const label = PART06_CATEGORY_LABEL_BY_KEY[key];
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }

  return labels;
}
