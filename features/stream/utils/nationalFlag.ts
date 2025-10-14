// Robust für Sprache (ISO-639-1), Region/Land (ISO-3166-1), BCP-47 Locales (z. B. "de-DE").
// Backward-compat: getNationalFlag bleibt erhalten (Named Export!).

const COUNTRY_FLAG: Record<string, string> = {
  DE: "🇩🇪", FR: "🇫🇷", ES: "🇪🇸", IT: "🇮🇹", PT: "🇵🇹", NL: "🇳🇱", BE: "🇧🇪",
  PL: "🇵🇱", RO: "🇷🇴", CZ: "🇨🇿", EL: "🇬🇷", SE: "🇸🇪", DK: "🇩🇰", FI: "🇫🇮",
  HU: "🇭🇺", NO: "🇳🇴", SK: "🇸🇰", BG: "🇧🇬", LT: "🇱🇹", EE: "🇪🇪", SI: "🇸🇮",
  LV: "🇱🇻", HR: "🇭🇷", AL: "🇦🇱", RS: "🇷🇸", GE: "🇬🇪", IR: "🇮🇷", KR: "🇰🇷",
  CN: "🇨🇳", JP: "🇯🇵", SA: "🇸🇦", IN: "🇮🇳", UA: "🇺🇦", AT: "🇦🇹", CH: "🇨🇭",
  IE: "🇮🇪", GB: "🇬🇧", UK: "🇬🇧", US: "🇺🇸",
  EU: "🇪🇺", UN: "🇺🇳"
};

const LANGUAGE_ICON: Record<string, string> = {
  de: "🇩🇪", en: "🇬🇧", es: "🇪🇸", fr: "🇫🇷", pt: "🇵🇹", it: "🇮🇹", nl: "🇳🇱",
  pl: "🇵🇱", ru: "🇷🇺", uk: "🇺🇦", tr: "🇹🇷", hi: "🇮🇳", zh: "🇨🇳", ja: "🇯🇵",
  ar: "🇸🇦", ro: "🇷🇴", cs: "🇨🇿", el: "🇬🇷", sv: "🇸🇪", da: "🇩🇰", fi: "🇫🇮",
  hu: "🇭🇺", no: "🇳🇴", sk: "🇸🇰", bg: "🇧🇬", lt: "🇱🇹", et: "🇪🇪", sl: "🇸🇮",
  lv: "🇱🇻", hr: "🇭🇷", sq: "🇦🇱", sr: "🇷🇸", ka: "🇬🇪", fa: "🇮🇷", ko: "🇰🇷",
  eu: "🇪🇺", un: "🇺🇳"
};

export const SUPPORTED_FLAGS = Object.entries(LANGUAGE_ICON).map(([code, label]) => ({ code, label }));

export function parseLocale(input: string) {
  if (!input) return { lang: undefined as string | undefined, region: undefined as string | undefined };
  const parts = input.replace("_", "-").split("-");
  const lang = parts[0]?.toLowerCase();
  const region = parts.find(p => p.length === 2 && p.toUpperCase() === p)?.toUpperCase();
  return { lang, region };
}

export function getFlag(input: string): string {
  if (!input) return "🏳️";
  // Direkter Ländercode?
  const direct = COUNTRY_FLAG[input.toUpperCase()];
  if (direct) return direct;
  // Locale → Region → Sprache
  const { lang, region } = parseLocale(input);
  if (region && COUNTRY_FLAG[region]) return COUNTRY_FLAG[region];
  if (lang && LANGUAGE_ICON[lang]) return LANGUAGE_ICON[lang];
  // Reiner Sprachcode?
  const langOnly = LANGUAGE_ICON[input.toLowerCase()];
  if (langOnly) return langOnly;
  return "🏳️";
}

// Backward-compat: gleicher Name wie zuvor verwendet
export function getNationalFlag(code: string) {
  return getFlag(code);
}

export function getLanguageName(lang: string, displayLang = "de") {
  try {
    const dn = new Intl.DisplayNames([displayLang], { type: "language" });
    return dn.of(lang) || lang;
  } catch { return lang; }
}

export function getRegionName(region: string, displayLang = "de") {
  try {
    const dn = new Intl.DisplayNames([displayLang], { type: "region" });
    return dn.of(region.toUpperCase()) || region;
  } catch { return region; }
}
