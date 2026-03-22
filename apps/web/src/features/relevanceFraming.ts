const SCOPE_ALIAS_TO_CANONICAL: Record<string, "local" | "regional" | "national" | "eu" | "global"> = {
  local: "local",
  kommunal: "local",
  municipality: "local",
  community: "local",
  regional: "regional",
  region: "regional",
  land: "regional",
  landesbezogen: "regional",
  national: "national",
  bundesweit: "national",
  bund: "national",
  federal: "national",
  gesellschaftlich: "national",
  societal: "national",
  institutionell: "national",
  institutional: "national",
  eu: "eu",
  europa: "eu",
  european: "eu",
  global: "global",
  transregional: "global",
};

const SCOPE_LABELS: Record<"local" | "regional" | "national" | "eu" | "global", string> = {
  local: "lokal / kommunal",
  regional: "regional / landesbezogen",
  national: "bundesweit / gesellschaftlich",
  eu: "europäisch / institutionell",
  global: "global / transregional",
};

const SOURCE_MODE_LABELS: Record<string, string> = {
  manual: "manueller Eingang",
  feed: "Feed-Signal",
  single_source: "öffentliche Einzelquelle",
  cluster: "Cluster-/Signalraum",
  ai_assist: "KI-gestützter Hinweis",
};

const ORIGIN_TYPE_LABELS: Record<string, string> = {
  manual: "manuelle Erfassung",
  feed: "Feed-Signal",
  source_anchor: "Quellenanker",
  community: "Community-Hinweis",
  event: "Ereignisbezug",
  official: "öffentliche/amtliche Quelle",
  tip: "Hinweis-Eingang",
  system: "Systemimport",
};

const OWNER_TYPE_LABELS: Record<string, string> = {
  platform: "Plattform",
  municipality: "Kommune",
  government: "Staat/Verwaltung",
  party: "Partei",
  organization: "Organisation",
  association: "Verband",
  ngo: "NGO",
  company: "Unternehmen",
  media: "Medien",
  initiative: "Initiative",
  community: "Community",
  editorial: "Redaktion",
  user: "Nutzerbeitrag",
  system: "System",
  other: "sonstige Trägerschaft",
};

function normalizeToken(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function humanizeFallback(value: string): string {
  return value.replace(/[_-]+/g, " ");
}

export function normalizeScopeForFraming(
  scope: string | null | undefined,
): "local" | "regional" | "national" | "eu" | "global" | null {
  const token = normalizeToken(scope);
  if (!token) return null;
  return SCOPE_ALIAS_TO_CANONICAL[token] ?? null;
}

export function formatRelevanceScopeLabel(
  scope: string | null | undefined,
  fallback = "offen",
): string {
  const normalized = normalizeScopeForFraming(scope);
  if (!normalized) return fallback;
  return SCOPE_LABELS[normalized];
}

export function formatSourceModeLabel(
  sourceMode: string | null | undefined,
  fallback = "Signalraum offen",
): string {
  const token = normalizeToken(sourceMode);
  if (!token) return fallback;
  return SOURCE_MODE_LABELS[token] ?? humanizeFallback(token);
}

export function formatOriginTypeLabel(
  originType: string | null | undefined,
  fallback = "Herkunft offen",
): string {
  const token = normalizeToken(originType);
  if (!token) return fallback;
  return ORIGIN_TYPE_LABELS[token] ?? humanizeFallback(token);
}

export function formatOwnerTypeLabel(
  ownerType: string | null | undefined,
  fallback = "Trägerschaft offen",
): string {
  const token = normalizeToken(ownerType);
  if (!token) return fallback;
  return OWNER_TYPE_LABELS[token] ?? humanizeFallback(token);
}
