export type PricingLocale = "de" | "en";

export function normalizePricingLocale(value?: string | null): PricingLocale {
  if (!value) return "de";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "de";
  return normalized.startsWith("en") ? "en" : "de";
}
