// core/locale/locales.ts
export const SUPPORTED_LOCALES = ["de", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "de";

export function isSupportedLocale(v: string | null | undefined): v is SupportedLocale {
  return !!v && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

// Für spätere RTL-Sprachen erweiterbar
export function getDir(locale: SupportedLocale): "ltr" | "rtl" {
  // if (locale === "ar" || locale === "he") return "rtl";
  return "ltr";
}
