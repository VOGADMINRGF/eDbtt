import {
  DEFAULT_LOCALE,
  getLocaleConfig,
  isSupportedLocale,
  type SupportedLocale,
} from "@/config/locales";

export type CanonicalLanguageBridgeTranslationState =
  | "not_needed"
  | "available"
  | "needs_review"
  | "uncertain";

export type LocalizedContentBridgeState =
  | "translated"
  | "original"
  | "missing_translation";

export type LocalizedContentBridgeStatus =
  | "missing"
  | "pending"
  | "translated"
  | "failed";

type LanguageBridgeSurfaceUiText = {
  uiLocaleLabel: string;
  originalLanguageLabel: string;
  readingLanguageLabel: string;
  statusLabel: string;
  unknownLanguage: string;
  trustHint: string;
  directOriginalState: string;
  translatedState: string;
  missingTranslationState: string;
  pendingTranslationState: string;
  failedTranslationState: string;
  canonicalNotNeededState: string;
  canonicalAvailableState: string;
  canonicalNeedsReviewState: string;
  canonicalUncertainState: string;
};

const LANGUAGE_BRIDGE_SURFACE_TEXTS: Partial<
  Record<SupportedLocale, LanguageBridgeSurfaceUiText>
> = {
  de: {
    uiLocaleLabel: "UI-Sprache",
    originalLanguageLabel: "Originalsprache",
    readingLanguageLabel: "Lesefassung",
    statusLabel: "Status",
    unknownLanguage: "unbekannt",
    trustHint:
      "Original bleibt Evidenz und Review-Grundlage. Lesefassung unterstützt beim Lesen, ersetzt aber weder Quelle noch Prüfung.",
    directOriginalState: "Original wird direkt gelesen",
    translatedState: "Lesefassung vorhanden",
    missingTranslationState: "Lesefassung fehlt",
    pendingTranslationState: "Lesefassung ausstehend",
    failedTranslationState: "Lesefassung fehlgeschlagen",
    canonicalNotNeededState: "keine getrennte Lesefassung nötig",
    canonicalAvailableState: "Lesefassung vorhanden",
    canonicalNeedsReviewState: "Lesefassung fehlt oder braucht Prüfung",
    canonicalUncertainState: "Lesefassung unsicher",
  },
  en: {
    uiLocaleLabel: "UI locale",
    originalLanguageLabel: "Original language",
    readingLanguageLabel: "Reading version",
    statusLabel: "Status",
    unknownLanguage: "unknown",
    trustHint:
      "The original remains the evidence and review basis. A reading version helps with comprehension but never replaces source or review.",
    directOriginalState: "Reading original directly",
    translatedState: "Reading version available",
    missingTranslationState: "Reading version missing",
    pendingTranslationState: "Reading version pending",
    failedTranslationState: "Reading version failed",
    canonicalNotNeededState: "no separate reading version needed",
    canonicalAvailableState: "reading version available",
    canonicalNeedsReviewState: "reading version missing or needs review",
    canonicalUncertainState: "reading version uncertain",
  },
  es: {
    uiLocaleLabel: "Idioma de interfaz",
    originalLanguageLabel: "Idioma original",
    readingLanguageLabel: "Version de lectura",
    statusLabel: "Estado",
    unknownLanguage: "desconocido",
    trustHint:
      "El original sigue siendo la base de evidencia y revision. La version de lectura ayuda a comprender, pero no reemplaza la fuente ni la revision.",
    directOriginalState: "Se lee el original directamente",
    translatedState: "Version de lectura disponible",
    missingTranslationState: "Falta la version de lectura",
    pendingTranslationState: "Version de lectura pendiente",
    failedTranslationState: "Fallo la version de lectura",
    canonicalNotNeededState: "no hace falta una version de lectura aparte",
    canonicalAvailableState: "version de lectura disponible",
    canonicalNeedsReviewState: "falta la version de lectura o necesita revision",
    canonicalUncertainState: "version de lectura incierta",
  },
  fr: {
    uiLocaleLabel: "Langue de l'interface",
    originalLanguageLabel: "Langue d'origine",
    readingLanguageLabel: "Version de lecture",
    statusLabel: "Statut",
    unknownLanguage: "inconnue",
    trustHint:
      "L'original reste la base de preuve et de revue. La version de lecture aide a comprendre, sans remplacer la source ni la revue.",
    directOriginalState: "Lecture directe de l'original",
    translatedState: "Version de lecture disponible",
    missingTranslationState: "Version de lecture manquante",
    pendingTranslationState: "Version de lecture en attente",
    failedTranslationState: "Echec de la version de lecture",
    canonicalNotNeededState: "aucune version de lecture separee necessaire",
    canonicalAvailableState: "version de lecture disponible",
    canonicalNeedsReviewState:
      "version de lecture manquante ou a revoir",
    canonicalUncertainState: "version de lecture incertaine",
  },
  zh: {
    uiLocaleLabel: "界面语言",
    originalLanguageLabel: "原始语言",
    readingLanguageLabel: "阅读版",
    statusLabel: "状态",
    unknownLanguage: "未知",
    trustHint:
      "原文仍然是证据与审核基础。阅读版只帮助理解，不会替代来源或审核。",
    directOriginalState: "直接阅读原文",
    translatedState: "已有阅读版",
    missingTranslationState: "缺少阅读版",
    pendingTranslationState: "阅读版待补充",
    failedTranslationState: "阅读版失败",
    canonicalNotNeededState: "无需单独阅读版",
    canonicalAvailableState: "已有阅读版",
    canonicalNeedsReviewState: "阅读版缺失或需要复核",
    canonicalUncertainState: "阅读版不确定",
  },
};

function cleanLanguageTag(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  const short = normalized.split(/[-_]/)[0] ?? "";
  if (!short || !/^[a-z]{2,16}$/.test(short)) return null;
  return short;
}

export function resolveLanguageBridgeUiLocale(
  value: string | null | undefined,
): SupportedLocale {
  const normalized = cleanLanguageTag(value);
  if (normalized && isSupportedLocale(normalized)) return normalized;
  return DEFAULT_LOCALE;
}

function getLanguageBridgeSurfaceUiText(
  locale: string | null | undefined,
): LanguageBridgeSurfaceUiText {
  const resolved = resolveLanguageBridgeUiLocale(locale);
  return (
    LANGUAGE_BRIDGE_SURFACE_TEXTS[resolved] ??
    LANGUAGE_BRIDGE_SURFACE_TEXTS.en!
  );
}

export function formatLanguageBridgeLanguageLabel(
  language: string | null | undefined,
  uiLocale?: string | null,
): string {
  const normalized = cleanLanguageTag(language);
  const ui = getLanguageBridgeSurfaceUiText(uiLocale);
  if (!normalized) return ui.unknownLanguage;
  if (isSupportedLocale(normalized)) return getLocaleConfig(normalized).label;
  return normalized.toUpperCase();
}

export function formatLocalizedContentBridgeStateLabel(input: {
  uiLocale?: string | null;
  state: LocalizedContentBridgeState;
  translationStatus?: LocalizedContentBridgeStatus | null;
}): string {
  const ui = getLanguageBridgeSurfaceUiText(input.uiLocale);
  if (input.state === "translated") return ui.translatedState;
  if (input.state === "original") return ui.directOriginalState;
  if (input.translationStatus === "pending") return ui.pendingTranslationState;
  if (input.translationStatus === "failed") return ui.failedTranslationState;
  return ui.missingTranslationState;
}

export function formatCanonicalLanguageBridgeStateLabel(input: {
  uiLocale?: string | null;
  state: CanonicalLanguageBridgeTranslationState;
}): string {
  const ui = getLanguageBridgeSurfaceUiText(input.uiLocale);
  if (input.state === "available") return ui.canonicalAvailableState;
  if (input.state === "uncertain") return ui.canonicalUncertainState;
  if (input.state === "needs_review") return ui.canonicalNeedsReviewState;
  return ui.canonicalNotNeededState;
}

export function buildLanguageBridgeSurfaceLine(input: {
  uiLocale?: string | null;
  originalLanguage?: string | null;
  readingLanguage?: string | null;
  statusLabel: string;
}): string {
  const ui = getLanguageBridgeSurfaceUiText(input.uiLocale);
  return [
    `${ui.uiLocaleLabel}: ${formatLanguageBridgeLanguageLabel(input.uiLocale, input.uiLocale)}`,
    `${ui.originalLanguageLabel}: ${formatLanguageBridgeLanguageLabel(
      input.originalLanguage,
      input.uiLocale,
    )}`,
    `${ui.readingLanguageLabel}: ${formatLanguageBridgeLanguageLabel(
      input.readingLanguage,
      input.uiLocale,
    )}`,
    `${ui.statusLabel}: ${input.statusLabel}`,
  ].join(" · ");
}

export function buildLanguageBridgeTrustHint(
  uiLocale?: string | null,
): string {
  return getLanguageBridgeSurfaceUiText(uiLocale).trustHint;
}
