export type AccessTier =
  | "public"
  | "basis"
  | "erweitert"
  | "premium"
  | "institutionBasic"
  | "institutionPremium"
  | "staff";

export const ACCESS_TIERS: AccessTier[] = [
  "public",
  "basis",
  "erweitert",
  "premium",
  "institutionBasic",
  "institutionPremium",
  "staff",
];

export const LEGACY_ACCESS_TIER_ALIASES: Record<string, AccessTier> = {
  public: "public",
  basis: "basis",
  erweitert: "erweitert",
  premium: "premium",
  institutionBasic: "institutionBasic",
  institutionPremium: "institutionPremium",
  staff: "staff",

  // Legacy (Run B2C)
  citizenBasic: "basis",
  citizenPremium: "erweitert",
  citizenPro: "premium",
  citizenUltra: "premium",

  // Legacy package keys
  "edb-basis": "basis",
  "edb-start": "erweitert",
  "edb-pro": "premium",
  start: "erweitert",
  pro: "premium",
};

export function isAccessTier(value: string | null | undefined): value is AccessTier {
  if (!value) return false;
  return ACCESS_TIERS.includes(value as AccessTier);
}

export function normalizeAccessTier(value?: string | null): AccessTier {
  const key = (value ?? "").trim();
  if (!key) return "public";
  if (isAccessTier(key)) return key;
  return LEGACY_ACCESS_TIER_ALIASES[key] ?? "public";
}
