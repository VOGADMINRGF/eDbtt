import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale, type SupportedLocale } from "@/config/locales";
import { translateBatchOpenAI } from "@/lib/i18n/translateOpenAI";
import {
  buildLocalizedContentRecord,
  normalizeLocaleTag,
  resolveContentTranslationStatus,
  type ContentTranslationStatus,
  type LocalizedContentRecord,
} from "./contentTranslations";

const CONTENT_TRANSLATION_DEFAULT_TARGET_LOCALES: SupportedLocale[] = ["de", "en", "es", "fr", "zh"];

const TRANSLATION_PROVIDER = "openai";
const TRANSLATION_MODEL = process.env.VOG_TRANSLATE_MODEL ?? "gpt-4o-mini";

type ProductionTargetLocaleInput = Array<string | null | undefined> | null | undefined;

export type ContentTranslationPreparation = {
  content: LocalizedContentRecord | null;
  targetLocales: SupportedLocale[];
  missingLocales: SupportedLocale[];
};

export type ContentTranslationProductionResult = ContentTranslationPreparation & {
  attemptedLocales: SupportedLocale[];
  producedLocales: SupportedLocale[];
  failedLocales: SupportedLocale[];
};

function sanitizeLocaleList(input: ProductionTargetLocaleInput): SupportedLocale[] {
  if (!Array.isArray(input)) return [];
  const out: SupportedLocale[] = [];
  const seen = new Set<SupportedLocale>();
  for (const raw of input) {
    const normalized = normalizeLocaleTag(raw);
    if (!normalized || !isSupportedLocale(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function parseEnvTargetLocales(): SupportedLocale[] {
  const raw = process.env.VOG_CONTENT_TRANSLATION_TARGET_LOCALES;
  if (!raw || typeof raw !== "string") return [];
  return sanitizeLocaleList(raw.split(",").map((entry) => entry.trim()));
}

function resolveOriginalLanguage(
  content: LocalizedContentRecord | null,
  explicitOriginalLanguage?: string | null,
): string | null {
  const normalizedExplicit = normalizeLocaleTag(explicitOriginalLanguage);
  if (normalizedExplicit) return normalizedExplicit;
  return normalizeLocaleTag(content?.originalLanguage);
}

export function resolveContentTranslationTargetLocales(params?: {
  targetLocales?: ProductionTargetLocaleInput;
  originalLanguage?: string | null;
}): SupportedLocale[] {
  const originalLanguage = normalizeLocaleTag(params?.originalLanguage);
  const explicit = sanitizeLocaleList(params?.targetLocales);
  const envLocales = parseEnvTargetLocales();
  const base = explicit.length
    ? explicit
    : envLocales.length
      ? envLocales
      : CONTENT_TRANSLATION_DEFAULT_TARGET_LOCALES;
  return base.filter((locale) => locale !== originalLanguage);
}

export function detectMissingTranslationLocales(params: {
  content: LocalizedContentRecord | null;
  targetLocales: SupportedLocale[];
  originalLanguage?: string | null;
}): SupportedLocale[] {
  if (!params.content?.originalText) return [];
  const originalLanguage = resolveOriginalLanguage(params.content, params.originalLanguage);
  const translations = params.content.translations ?? {};
  const missing: SupportedLocale[] = [];
  for (const locale of params.targetLocales) {
    if (locale === originalLanguage) continue;
    const translated = typeof translations[locale] === "string" ? translations[locale]?.trim() : "";
    if (!translated) missing.push(locale);
  }
  return missing;
}

export function prepareContentTranslationForWrite(params: {
  originalText?: string | null;
  originalLanguage?: string | null;
  existingContent?: LocalizedContentRecord | null;
  targetLocales?: ProductionTargetLocaleInput;
  maxLength?: number;
}): ContentTranslationPreparation {
  const content = buildLocalizedContentRecord({
    originalLanguage: params.originalLanguage ?? params.existingContent?.originalLanguage,
    originalText: params.originalText ?? params.existingContent?.originalText,
    fallbackOriginalText: params.originalText ?? params.existingContent?.originalText,
    translations: params.existingContent?.translations,
    translationStatus: params.existingContent?.translationStatus,
    translatedAt: params.existingContent?.translatedAt,
    translationProvider: params.existingContent?.translationProvider,
    translationModel: params.existingContent?.translationModel,
    maxOriginalLength: params.maxLength ?? 4_000,
    maxTranslationLength: params.maxLength ?? 4_000,
  });
  const originalLanguage = resolveOriginalLanguage(content, params.originalLanguage);
  const targetLocales = resolveContentTranslationTargetLocales({
    targetLocales: params.targetLocales,
    originalLanguage,
  });
  const missingLocales = detectMissingTranslationLocales({
    content,
    targetLocales,
    originalLanguage,
  });
  const status: ContentTranslationStatus = missingLocales.length > 0 ? "missing" : "translated";
  const normalizedContent = content ? { ...content, translationStatus: status } : null;
  return { content: normalizedContent, targetLocales, missingLocales };
}

export function markContentTranslationPending(
  content: LocalizedContentRecord | null,
): LocalizedContentRecord | null {
  if (!content?.originalText) return content;
  return {
    ...content,
    translationStatus: "pending",
  };
}

export function markContentTranslationFailed(
  content: LocalizedContentRecord | null,
): LocalizedContentRecord | null {
  if (!content?.originalText) return content;
  return {
    ...content,
    translationStatus: "failed",
  };
}

function mergeProducedTranslations(params: {
  content: LocalizedContentRecord;
  producedTranslations: Record<string, string>;
}): LocalizedContentRecord {
  const nextTranslations: Record<string, string | null> = {
    ...(params.content.translations ?? {}),
  };
  for (const [locale, text] of Object.entries(params.producedTranslations)) {
    if (typeof nextTranslations[locale] === "string" && nextTranslations[locale]?.trim()) continue;
    const normalizedLocale = normalizeLocaleTag(locale);
    const normalizedText = typeof text === "string" ? text.trim() : "";
    if (!normalizedLocale || !normalizedText) continue;
    nextTranslations[normalizedLocale] = normalizedText;
  }
  return { ...params.content, translations: nextTranslations };
}

export function applyContentTranslationLifecycle(params: {
  content: LocalizedContentRecord | null;
  targetLocales: SupportedLocale[];
  producedTranslations?: Record<string, string>;
  attemptedLocales?: SupportedLocale[];
  failedLocales?: SupportedLocale[];
  provider?: string | null;
  model?: string | null;
}): ContentTranslationPreparation {
  if (!params.content?.originalText) {
    return { content: params.content, targetLocales: params.targetLocales, missingLocales: [] };
  }
  const mergedContent = mergeProducedTranslations({
    content: params.content,
    producedTranslations: params.producedTranslations ?? {},
  });
  const missingLocales = detectMissingTranslationLocales({
    content: mergedContent,
    targetLocales: params.targetLocales,
    originalLanguage: mergedContent.originalLanguage,
  });
  const attempted = params.attemptedLocales?.length ? params.attemptedLocales : [];
  const failed = params.failedLocales?.length ? params.failedLocales : [];
  const hasProduced = Object.keys(params.producedTranslations ?? {}).length > 0;
  const status: ContentTranslationStatus =
    missingLocales.length === 0
      ? "translated"
      : attempted.length > 0 || failed.length > 0
        ? "failed"
        : resolveContentTranslationStatus(mergedContent.translationStatus);
  return {
    content: {
      ...mergedContent,
      translationStatus: status,
      translatedAt: hasProduced ? new Date() : mergedContent.translatedAt ?? null,
      translationProvider: hasProduced
        ? params.provider ?? TRANSLATION_PROVIDER
        : mergedContent.translationProvider ?? null,
      translationModel: hasProduced ? params.model ?? TRANSLATION_MODEL : mergedContent.translationModel ?? null,
    },
    targetLocales: params.targetLocales,
    missingLocales,
  };
}

export async function runContentTranslationProduction(params: {
  originalText?: string | null;
  originalLanguage?: string | null;
  existingContent?: LocalizedContentRecord | null;
  targetLocales?: ProductionTargetLocaleInput;
  maxLength?: number;
}): Promise<ContentTranslationProductionResult> {
  const prepared = prepareContentTranslationForWrite({
    originalText: params.originalText,
    originalLanguage: params.originalLanguage,
    existingContent: params.existingContent,
    targetLocales: params.targetLocales,
    maxLength: params.maxLength,
  });
  if (!prepared.content?.originalText || prepared.missingLocales.length === 0) {
    return {
      ...prepared,
      attemptedLocales: [],
      producedLocales: [],
      failedLocales: [],
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ...prepared,
      attemptedLocales: [],
      producedLocales: [],
      failedLocales: [],
    };
  }

  const pending = markContentTranslationPending(prepared.content) ?? prepared.content;
  const sourceLang = resolveOriginalLanguage(pending, params.originalLanguage) ?? DEFAULT_LOCALE;
  const attemptedLocales: SupportedLocale[] = [];
  const failedLocales: SupportedLocale[] = [];
  const produced: Record<string, string> = {};

  for (const locale of prepared.missingLocales) {
    attemptedLocales.push(locale);
    try {
      const translated = await translateBatchOpenAI({
        srcLang: sourceLang,
        tgtLang: locale,
        items: [{ key: "content", text: pending.originalText }],
      });
      const candidate = typeof translated.content === "string" ? translated.content.trim() : "";
      if (!candidate || candidate === pending.originalText) {
        failedLocales.push(locale);
        continue;
      }
      produced[locale] = candidate;
    } catch {
      failedLocales.push(locale);
    }
  }

  const finalized = applyContentTranslationLifecycle({
    content: pending,
    targetLocales: prepared.targetLocales,
    producedTranslations: produced,
    attemptedLocales,
    failedLocales,
    provider: TRANSLATION_PROVIDER,
    model: TRANSLATION_MODEL,
  });

  return {
    ...finalized,
    attemptedLocales,
    producedLocales: Object.keys(produced).filter((locale): locale is SupportedLocale =>
      isSupportedLocale(locale),
    ),
    failedLocales,
  };
}
