import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/config/locales";

export type ContentTranslationStatus = "missing" | "pending" | "translated" | "failed";

export type LocalizedContentRecord = {
  originalLanguage?: string | null;
  originalText?: string | null;
  translations?: Record<string, string | null> | null;
  translationStatus?: ContentTranslationStatus | null;
  translatedAt?: string | Date | null;
  translationProvider?: string | null;
  translationModel?: string | null;
};

export type LocalizedContentRenderState = "translated" | "original" | "missing_translation";

export type LocalizedContentRenderResult = {
  preferredLocale: SupportedLocale;
  originalLanguage: string | null;
  originalText: string;
  translatedText: string | null;
  displayText: string;
  translationStatus: ContentTranslationStatus;
  state: LocalizedContentRenderState;
  showOriginalDisclosure: boolean;
};

export function resolveContentTranslationStatus(value?: unknown): ContentTranslationStatus {
  if (!value) return "missing";
  if (typeof value === "string") {
    return value === "pending" || value === "translated" || value === "failed" ? value : "missing";
  }
  const status =
    typeof value === "object" && value && "translationStatus" in value
      ? (value as { translationStatus?: unknown }).translationStatus
      : null;
  return status === "pending" || status === "translated" || status === "failed" ? status : "missing";
}

function cleanText(value: unknown, maxLength = 4_000): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, maxLength);
}

export function normalizeLocaleTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (isSupportedLocale(normalized)) return normalized;
  const short = normalized.slice(0, 2);
  if (isSupportedLocale(short)) return short;
  return null;
}

export function resolveReaderLocale(value?: string | null): SupportedLocale {
  const normalized = normalizeLocaleTag(value);
  return normalized && isSupportedLocale(normalized) ? normalized : DEFAULT_LOCALE;
}

function normalizeStatus(value: unknown): ContentTranslationStatus {
  return resolveContentTranslationStatus(typeof value === "string" ? value : null);
}

function sanitizeTranslations(
  value: unknown,
  maxTranslationLength = 4_000,
): Record<string, string | null> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>);
  const out: Record<string, string | null> = {};
  for (const [rawKey, rawText] of entries) {
    const locale = normalizeLocaleTag(rawKey);
    if (!locale) continue;
    const text = cleanText(rawText, maxTranslationLength);
    if (!text) continue;
    out[locale] = text;
  }
  return out;
}

export function buildLocalizedContentRecord(params: {
  originalLanguage?: unknown;
  originalText?: unknown;
  fallbackOriginalText?: unknown;
  translations?: unknown;
  translationStatus?: unknown;
  translatedAt?: unknown;
  translationProvider?: unknown;
  translationModel?: unknown;
  maxOriginalLength?: number;
  maxTranslationLength?: number;
}): LocalizedContentRecord | null {
  const originalLanguage = normalizeLocaleTag(params.originalLanguage);
  const originalText =
    cleanText(params.originalText, params.maxOriginalLength ?? 4_000) ||
    cleanText(params.fallbackOriginalText, params.maxOriginalLength ?? 4_000);
  const translations = sanitizeTranslations(params.translations, params.maxTranslationLength ?? 4_000);
  const translationStatus = normalizeStatus(params.translationStatus);
  const translatedAt =
    params.translatedAt instanceof Date || typeof params.translatedAt === "string"
      ? params.translatedAt
      : null;
  const translationProvider = cleanText(params.translationProvider, 160) || null;
  const translationModel = cleanText(params.translationModel, 160) || null;

  if (!originalText && Object.keys(translations).length === 0) {
    return null;
  }

  return {
    originalLanguage,
    originalText: originalText || null,
    translations,
    translationStatus,
    translatedAt,
    translationProvider,
    translationModel,
  };
}

function pickTranslation(
  translations: Record<string, string | null>,
  preferredLocale: SupportedLocale,
): string | null {
  const direct = cleanText(translations[preferredLocale]);
  if (direct) return direct;
  return null;
}

export function resolveLocalizedContentForReader(params: {
  content?: LocalizedContentRecord | null;
  preferredLocale?: string | null;
  fallbackOriginalText?: string | null;
}): LocalizedContentRenderResult | null {
  const preferredLocale = resolveReaderLocale(params.preferredLocale);
  const normalized = buildLocalizedContentRecord({
    originalLanguage: params.content?.originalLanguage,
    originalText: params.content?.originalText,
    fallbackOriginalText: params.fallbackOriginalText,
    translations: params.content?.translations,
    translationStatus: params.content?.translationStatus,
    translatedAt: params.content?.translatedAt,
    translationProvider: params.content?.translationProvider,
    translationModel: params.content?.translationModel,
  });
  if (!normalized?.originalText) return null;

  const originalLanguage = normalizeLocaleTag(normalized.originalLanguage);
  const translatedText = pickTranslation(normalized.translations ?? {}, preferredLocale);
  const localeDiffersFromOriginal = !originalLanguage || preferredLocale !== originalLanguage;
  const canShowTranslated = localeDiffersFromOriginal && Boolean(translatedText);
  const state: LocalizedContentRenderState = canShowTranslated
    ? "translated"
    : localeDiffersFromOriginal
      ? "missing_translation"
      : "original";
  const translationStatus =
    state === "translated" ? "translated" : normalizeStatus(normalized.translationStatus);

  return {
    preferredLocale,
    originalLanguage,
    originalText: normalized.originalText,
    translatedText: translatedText ?? null,
    displayText: canShowTranslated && translatedText ? translatedText : normalized.originalText,
    translationStatus,
    state,
    showOriginalDisclosure: canShowTranslated && normalized.originalText.length > 0,
  };
}

type ContentRenderUiText = {
  showOriginal: string;
  originalLabel: string;
  translatedFrom: (language: string | null) => string;
  translationMissing: (locale: SupportedLocale) => string;
};

const CONTENT_RENDER_UI_TEXTS: Partial<Record<SupportedLocale, ContentRenderUiText>> = {
  de: {
    showOriginal: "Original anzeigen",
    originalLabel: "Original",
    translatedFrom: (language) => `Uebersetzt aus ${language ?? "unbekannt"}`,
    translationMissing: (locale) => `Keine Uebersetzung fuer ${locale.toUpperCase()} vorhanden.`,
  },
  en: {
    showOriginal: "Show original",
    originalLabel: "Original",
    translatedFrom: (language) => `Translated from ${language ?? "unknown"}`,
    translationMissing: (locale) => `No translation available for ${locale.toUpperCase()}.`,
  },
  es: {
    showOriginal: "Mostrar original",
    originalLabel: "Original",
    translatedFrom: (language) => `Traducido desde ${language ?? "desconocido"}`,
    translationMissing: (locale) => `No hay traduccion para ${locale.toUpperCase()}.`,
  },
  fr: {
    showOriginal: "Afficher l'original",
    originalLabel: "Original",
    translatedFrom: (language) => `Traduit depuis ${language ?? "inconnu"}`,
    translationMissing: (locale) => `Aucune traduction pour ${locale.toUpperCase()}.`,
  },
  zh: {
    showOriginal: "查看原文",
    originalLabel: "原文",
    translatedFrom: (language) => `译自 ${language ?? "未知语言"}`,
    translationMissing: (locale) => `暂无 ${locale.toUpperCase()} 翻译。`,
  },
};

export function getContentRenderUiText(locale?: string | null): ContentRenderUiText {
  const resolved = resolveReaderLocale(locale);
  return CONTENT_RENDER_UI_TEXTS[resolved] ?? CONTENT_RENDER_UI_TEXTS.en!;
}

const CONTENT_STATUS_LABELS: Partial<Record<SupportedLocale, Record<ContentTranslationStatus, string>>> = {
  de: {
    missing: "Uebersetzung fehlt",
    pending: "Uebersetzung ausstehend",
    translated: "Uebersetzt",
    failed: "Uebersetzung fehlgeschlagen",
  },
  en: {
    missing: "Translation missing",
    pending: "Translation pending",
    translated: "Translated",
    failed: "Translation failed",
  },
  es: {
    missing: "Traduccion faltante",
    pending: "Traduccion pendiente",
    translated: "Traducido",
    failed: "Traduccion fallida",
  },
  fr: {
    missing: "Traduction manquante",
    pending: "Traduction en attente",
    translated: "Traduit",
    failed: "Echec de traduction",
  },
  zh: {
    missing: "缺少翻译",
    pending: "翻译处理中",
    translated: "已翻译",
    failed: "翻译失败",
  },
};

export function formatContentTranslationStatusLabel(
  status: ContentTranslationStatus,
  locale?: string | null,
): string {
  const resolvedLocale = resolveReaderLocale(locale);
  const map = CONTENT_STATUS_LABELS[resolvedLocale] ?? CONTENT_STATUS_LABELS.en!;
  return map[resolveContentTranslationStatus(status)];
}
