import type { EDebattePackageDefinition } from "./types";
import type { PricingLocale } from "./i18n";

type PriceLabelInput = Pick<EDebattePackageDefinition, "preisMonat" | "preisJahr" | "mitgliederPreisMonat" | "preisLabel">;

function formatCurrency(value: number, locale: PricingLocale) {
  const formatter = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
}

export function formatPackagePriceLabel(pkg: PriceLabelInput, locale: PricingLocale = "de") {
  if (typeof pkg.preisLabel === "string" && pkg.preisLabel.trim()) {
    return pkg.preisLabel.trim();
  }
  if (typeof pkg.mitgliederPreisMonat === "number" && typeof pkg.preisMonat === "number") {
    if (locale === "en") {
      return `${formatCurrency(pkg.mitgliederPreisMonat, locale)} for VoiceOpenGov members · ${formatCurrency(pkg.preisMonat, locale)} regular`;
    }
    return `${formatCurrency(pkg.mitgliederPreisMonat, locale)} für VoiceOpenGov-Mitglieder · ${formatCurrency(pkg.preisMonat, locale)} regulär`;
  }
  if (typeof pkg.preisMonat === "number") return `${formatCurrency(pkg.preisMonat, locale)} / ${locale === "en" ? "month" : "Monat"}`;
  if (typeof pkg.preisJahr === "number") return `${formatCurrency(pkg.preisJahr, locale)} / ${locale === "en" ? "year" : "Jahr"}`;
  return locale === "en" ? "Price depends on model" : "Preis nach Modell";
}
