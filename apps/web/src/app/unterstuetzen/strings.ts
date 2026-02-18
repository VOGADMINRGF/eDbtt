import type { SupportedLocale } from "@/config/locales";

type Entry<T> = Record<"de", T> & Partial<Record<SupportedLocale, T>>;

const STRINGS = {
  heroTitle: {
    de: "Unterstützen",
    en: "Unterstützen",
  },
  heroIntro: {
    de: "eDebatte ist eine gemeinwohlorientierte Plattform – unabhängig, datensicher und demokratisch. Die Unterstützung läuft über VoiceOpenGov, die Initiative hinter eDebatte.",
    en: "eDebatte ist eine gemeinwohlorientierte Plattform – unabhängig, datensicher und demokratisch. Die Unterstützung läuft über VoiceOpenGov, die Initiative hinter eDebatte.",
  },
  whyTitle: {
    de: "Warum unterstützen?",
    en: "Warum unterstützen?",
  },
  whyList: {
    de: [
      "Barrierefreie Weiterentwicklung",
      "Redaktionelle Aufarbeitung & Moderation",
      "Unabhängige Infrastruktur (DSGVO-konform)",
    ],
    en: [
      "Barrierefreie Weiterentwicklung",
      "Redaktionelle Aufarbeitung & Moderation",
      "Unabhängige Infrastruktur (DSGVO-konform)",
    ],
  },
  membershipTitle: {
    de: "So unterstützt du die Initiative",
    en: "So unterstützt du die Initiative",
  },
  membershipList: {
    de: [
      "Unterstützung läuft über VoiceOpenGov (Initiative hinter eDebatte).",
      "Einmalig oder regelmäßig – ohne Stimmvorteile.",
      "Keine Spendenquittung in der Aufbauphase.",
    ],
    en: [
      "Unterstützung läuft über VoiceOpenGov (Initiative hinter eDebatte).",
      "Einmalig oder regelmäßig – ohne Stimmvorteile.",
      "Keine Spendenquittung in der Aufbauphase.",
    ],
  },
  bundlesNotePrefix: {
    de: "Für Plattform-Kontingente (Beiträge, Swipes, Bundles) siehe",
    en: "Für Plattform-Kontingente (Beiträge, Swipes, Bundles) siehe",
  },
  bundlesNoteSuffix: {
    de: ". Die VoiceOpenGov-Unterstützung bleibt davon getrennt.",
    en: ". Die VoiceOpenGov-Unterstützung bleibt davon getrennt.",
  },
  cta: {
    de: "Bankdaten anzeigen",
    en: "Bankdaten anzeigen",
  },
} as const satisfies Record<string, Entry<string | string[]>>;

export function tSupport<T>(entry: Entry<T>, locale: SupportedLocale | string): T {
  const normalized = locale as SupportedLocale;
  return entry[normalized] ?? (normalized !== "de" ? entry.en : undefined) ?? entry.de;
}

export const SUPPORT_STRINGS = STRINGS;
