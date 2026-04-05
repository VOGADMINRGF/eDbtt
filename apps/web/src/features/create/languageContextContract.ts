export type CreateLanguageContextTriplet = {
  uiLocale: string;
  contentLanguage: string;
  sourceLanguage: string;
};

type ResolveCreateLanguageContextInput = {
  locale?: string | null;
  uiLocale?: string | null;
  contentLanguage?: string | null;
  sourceLanguage?: string | null;
  inferredSourceLanguage?: string | null;
};

const DEFAULT_LANGUAGE = "de";

function cleanLanguageTag(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const short = normalized.split(/[-_]/)[0] ?? "";
  if (!short) return null;
  if (!/^[a-z]{2,16}$/.test(short)) return null;
  return short;
}

function normalizeLanguageTag(
  value: string | null | undefined,
  fallback?: string | null,
): string | null {
  if (typeof value === "string") {
    const cleaned = cleanLanguageTag(value);
    if (cleaned) return cleaned;
  }
  if (typeof fallback === "string") {
    const cleanedFallback = cleanLanguageTag(fallback);
    if (cleanedFallback) return cleanedFallback;
  }
  return null;
}

export function resolveCreateLanguageContext(
  input: ResolveCreateLanguageContextInput = {},
): CreateLanguageContextTriplet {
  const locale = normalizeLanguageTag(input.locale, null);

  const contentLanguage =
    normalizeLanguageTag(input.contentLanguage, locale) ?? DEFAULT_LANGUAGE;
  const uiLocale =
    normalizeLanguageTag(input.uiLocale, locale ?? contentLanguage) ??
    contentLanguage;
  const sourceLanguage =
    normalizeLanguageTag(
      input.sourceLanguage,
      input.inferredSourceLanguage ?? contentLanguage,
    ) ?? contentLanguage;

  return {
    uiLocale,
    contentLanguage,
    sourceLanguage,
  };
}

