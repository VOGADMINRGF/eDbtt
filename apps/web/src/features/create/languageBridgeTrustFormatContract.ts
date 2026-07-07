import {
  resolveCreateLanguageContext,
  type CreateLanguageContextTriplet,
  type ResolveCreateLanguageContextInput,
} from "@/features/create/languageContextContract";

export const CANONICAL_LANGUAGE_BRIDGE_LAYERS = [
  "original",
  "translation",
  "summary",
  "voxy_classification",
  "source_grounding",
  "open_questions",
  "uncertainty",
] as const;

export type CanonicalLanguageBridgeLayer =
  (typeof CANONICAL_LANGUAGE_BRIDGE_LAYERS)[number];

export const CANONICAL_TRUST_STATES = [
  "source_needed",
  "source_present",
  "context_missing",
  "contested",
  "partially_supported",
  "supported",
  "normative_position",
  "jurisdiction_unclear",
  "translation_uncertain",
  "outdated",
] as const;

export type CanonicalTrustState = (typeof CANONICAL_TRUST_STATES)[number];

export const CANONICAL_FORMAT_RECOMMENDATIONS = [
  "clarify",
  "debate_and_arguments",
  "comment_thread",
  "poll",
  "live_question",
  "mitmachraum",
  "statement_review",
  "source_review",
] as const;

export type CanonicalFormatRecommendation =
  (typeof CANONICAL_FORMAT_RECOMMENDATIONS)[number];

export const CANONICAL_RTL_LANGUAGES = ["ar", "fa", "he", "ur"] as const;

export type CanonicalTranslationState =
  | "not_needed"
  | "available"
  | "needs_review"
  | "uncertain";

export type CanonicalFormatRecommendationDecision = {
  recommendation: CanonicalFormatRecommendation;
  isSuggestion: true;
  reviewRequired: true;
  autoPublish: false;
};

export type CanonicalLanguageBridgeRecord = {
  languageContext: CreateLanguageContextTriplet;
  original: {
    language: string;
    text: string;
    preserved: true;
  };
  translation: {
    language: string;
    text: string | null;
    state: CanonicalTranslationState;
    replacesOriginal: false;
    rtl: boolean;
  };
  summary: {
    language: string;
    text: string | null;
    replacesOriginal: false;
    replacesSource: false;
  };
  voxyClassification: {
    language: string;
    text: string | null;
    reviewRequired: true;
  };
  sourceGrounding: {
    trustState: CanonicalTrustState;
    sourcePresent: boolean;
    summaryReplacesSource: false;
  };
  openQuestions: string[];
  uncertaintyNotes: string[];
  reviewRequired: true;
  autoPublish: false;
};

export type BuildCanonicalLanguageBridgeRecordInput =
  ResolveCreateLanguageContextInput & {
    originalText: string;
    translationText?: string | null;
    translationLanguage?: string | null;
    summaryText?: string | null;
    voxyClassificationText?: string | null;
    trustState?: string | null;
    openQuestions?: readonly string[];
    uncertaintyNotes?: readonly string[];
  };

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
}

function normalizeLanguageTag(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  const short = normalized.split(/[-_]/)[0] ?? "";
  if (!short) return null;
  if (!/^[a-z]{2,16}$/.test(short)) return null;
  return short;
}

export function isCanonicalTrustState(
  value: string,
): value is CanonicalTrustState {
  return CANONICAL_TRUST_STATES.includes(value as CanonicalTrustState);
}

export function resolveCanonicalTrustState(
  value?: string | null,
): CanonicalTrustState {
  return value && isCanonicalTrustState(value) ? value : "source_needed";
}

export function isCanonicalFormatRecommendation(
  value: string,
): value is CanonicalFormatRecommendation {
  return CANONICAL_FORMAT_RECOMMENDATIONS.includes(
    value as CanonicalFormatRecommendation,
  );
}

export function resolveCanonicalFormatRecommendationDecision(
  value?: string | null,
): CanonicalFormatRecommendationDecision {
  const recommendation =
    value && isCanonicalFormatRecommendation(value) ? value : "clarify";

  return {
    recommendation,
    isSuggestion: true,
    reviewRequired: true,
    autoPublish: false,
  };
}

export function usesCanonicalRtlLayout(value?: string | null): boolean {
  const language = normalizeLanguageTag(value);
  return Boolean(
    language &&
      CANONICAL_RTL_LANGUAGES.includes(
        language as (typeof CANONICAL_RTL_LANGUAGES)[number],
      ),
  );
}

export function buildCanonicalLanguageBridgeRecord(
  input: BuildCanonicalLanguageBridgeRecordInput,
): CanonicalLanguageBridgeRecord {
  const languageContext = resolveCreateLanguageContext(input);
  const originalText = input.originalText.trim();
  const translationText = normalizeOptionalText(input.translationText);
  const summaryText = normalizeOptionalText(input.summaryText);
  const voxyClassificationText = normalizeOptionalText(
    input.voxyClassificationText,
  );
  const translationLanguage =
    normalizeLanguageTag(input.translationLanguage) ??
    languageContext.contentLanguage;
  const trustState = resolveCanonicalTrustState(input.trustState);
  const translationState: CanonicalTranslationState =
    translationText === null
      ? translationLanguage === languageContext.sourceLanguage
        ? "not_needed"
        : "needs_review"
      : trustState === "translation_uncertain"
        ? "uncertain"
        : "available";

  return {
    languageContext,
    original: {
      language: languageContext.sourceLanguage,
      text: originalText,
      preserved: true,
    },
    translation: {
      language: translationLanguage,
      text: translationText,
      state: translationState,
      replacesOriginal: false,
      rtl: usesCanonicalRtlLayout(translationLanguage),
    },
    summary: {
      language: languageContext.contentLanguage,
      text: summaryText,
      replacesOriginal: false,
      replacesSource: false,
    },
    voxyClassification: {
      language: languageContext.uiLocale,
      text: voxyClassificationText,
      reviewRequired: true,
    },
    sourceGrounding: {
      trustState,
      sourcePresent: trustState !== "source_needed",
      summaryReplacesSource: false,
    },
    openQuestions: unique(input.openQuestions ?? []),
    uncertaintyNotes: unique(input.uncertaintyNotes ?? []),
    reviewRequired: true,
    autoPublish: false,
  };
}
