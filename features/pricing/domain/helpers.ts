import { EDEBATTE_PACKAGES_DE, EDEBATTE_PACKAGE_IDS } from "./plans.de";
import { EDEBATTE_PACKAGES_EN } from "./plans.en";
import { normalizePricingLocale, type PricingLocale } from "./i18n";
import type { EDebattePackageId } from "./types";

const PACKAGE_ID_SET = new Set<EDebattePackageId>(EDEBATTE_PACKAGE_IDS);
const LEGACY_PACKAGE_ALIASES: Record<string, EDebattePackageId> = {
  "pilot-b2g": "b2g_basis",
  "pilot-b2b": "b2b_basis",
};

export function normalizePackageId(value?: string | null): EDebattePackageId | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/^edb-/, "");
  if (LEGACY_PACKAGE_ALIASES[normalized]) {
    return LEGACY_PACKAGE_ALIASES[normalized];
  }
  if (PACKAGE_ID_SET.has(normalized as EDebattePackageId)) {
    return normalized as EDebattePackageId;
  }
  return null;
}

export function getPackagesForLocale(locale: PricingLocale = "de") {
  return locale === "en" ? EDEBATTE_PACKAGES_EN : EDEBATTE_PACKAGES_DE;
}

export function getEdebatePackageById(id: string, locale: PricingLocale = "de") {
  return getPackagesForLocale(locale).find((pkg) => pkg.id === id) ?? null;
}

export const PRIVATE_PACKAGE_IDS = ["basis", "start", "pro"] as const;
export const JOURNALIST_PACKAGE_IDS = ["journal_basis", "journal_pro"] as const;
export const B2B_PACKAGE_IDS = ["b2b_basis", "b2b_pro"] as const;
export const B2G_PACKAGE_IDS = ["b2g_basis", "b2g_pro"] as const;

export function getPackagesByIds(ids: readonly EDebattePackageId[], locale: PricingLocale = "de") {
  const wanted = new Set(ids);
  return getPackagesForLocale(locale).filter((pkg) => wanted.has(pkg.id));
}

export function resolvePricingLocaleFromLangParam(value?: string | null): PricingLocale {
  return normalizePricingLocale(value ?? null);
}

export function toEdebatePlanId(id: EDebattePackageId) {
  return `edb-${id}` as const;
}
