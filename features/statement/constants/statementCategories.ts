// v1-Variante, aber typsicher & wiederverwendbar

export const MAIN_CATEGORIES = [
  "Klima", "Arbeit", "Bildung", "Digitalisierung", "Gesundheit",
  "Soziales", "Wirtschaft", "Verkehr", "Energie",
  "Migration", "Recht", "Sicherheit", "Landwirtschaft",
  "Verbraucher", "Kultur",
] as const;

export type MainCategory = typeof MAIN_CATEGORIES[number];

export const REGIONS = [
  { label: "Global",   value: "global"   },
  { label: "National", value: "national" },
  { label: "Regional", value: "regional" },
  { label: "Lokal",    value: "local"    },
] as const;

export type RegionValue = typeof REGIONS[number]["value"];

// Nützliche Helfer (optional)
export const MAIN_CATEGORY_OPTIONS = MAIN_CATEGORIES.map(v => ({ value: v, label: v }));
export const REGION_OPTIONS = REGIONS; // alias
