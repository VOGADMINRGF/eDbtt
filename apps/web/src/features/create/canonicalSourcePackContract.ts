import { normalizeLocaleTag } from "@/features/i18n/contentTranslations";
import {
  resolveCanonicalTrustState,
  type CanonicalTrustState,
} from "@/features/create/languageBridgeTrustFormatContract";

export const CANONICAL_SOURCE_PACK_SOURCE_TYPES = [
  "official",
  "media",
  "civil_society",
  "academic",
  "user_supplied",
  "unknown",
] as const;

export type CanonicalSourcePackSourceType =
  (typeof CANONICAL_SOURCE_PACK_SOURCE_TYPES)[number];

export const CANONICAL_SOURCE_PACK_RELIABILITY_HINTS = [
  "official",
  "primary",
  "secondary",
  "contested",
  "unknown",
] as const;

export type CanonicalSourcePackReliabilityHint =
  (typeof CANONICAL_SOURCE_PACK_RELIABILITY_HINTS)[number];

export const CANONICAL_SOURCE_PACK_TRANSLATION_STATUSES = [
  "not_needed",
  "translated",
  "needs_review",
  "uncertain",
] as const;

export type CanonicalSourcePackTranslationStatus =
  (typeof CANONICAL_SOURCE_PACK_TRANSLATION_STATUSES)[number];

export const CANONICAL_SOURCE_PACK_EVIDENCE_STATES = [
  "source_needed",
  "partial",
  "contested",
  "supported",
  "context_missing",
  "outdated",
] as const;

export type CanonicalSourcePackEvidenceState =
  (typeof CANONICAL_SOURCE_PACK_EVIDENCE_STATES)[number];

export const CANONICAL_SOURCE_PACK_REVIEW_STATES = [
  "review_required",
  "approved",
  "rejected",
] as const;

export type CanonicalSourcePackReviewState =
  (typeof CANONICAL_SOURCE_PACK_REVIEW_STATES)[number];

export type CanonicalSourcePackSource = {
  sourceId: string;
  title: string;
  url?: string;
  sourceLocale?: string | null;
  regionCode?: string | null;
  sourceType: CanonicalSourcePackSourceType;
  reliabilityHint: CanonicalSourcePackReliabilityHint;
  retrievedAt?: string;
  originalSnippet?: string | null;
  translatedSnippet?: string | null;
  translationStatus: CanonicalSourcePackTranslationStatus;
  evidenceState: CanonicalSourcePackEvidenceState;
  reviewState: CanonicalSourcePackReviewState;
};

export type CanonicalSourcePack = {
  sourcePackId: string;
  sources: CanonicalSourcePackSource[];
  openGaps: string[];
  reviewState: CanonicalSourcePackReviewState;
  reviewRequired: true;
  autoPublish: false;
};

export type BuildCanonicalSourcePackInput = {
  sourcePackId: string;
  sources?: readonly {
    sourceId?: string | null;
    title?: string | null;
    url?: string | null;
    sourceLocale?: string | null;
    regionCode?: string | null;
    sourceType?: string | null;
    reliabilityHint?: string | null;
    retrievedAt?: string | null;
    originalSnippet?: string | null;
    translatedSnippet?: string | null;
    translationStatus?: string | null;
    evidenceState?: string | null;
    trustState?: string | null;
    reviewState?: string | null;
  }[];
  openGaps?: readonly string[];
  reviewState?: string | null;
};

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
}

function resolveSourceType(
  value?: string | null,
): CanonicalSourcePackSourceType {
  return CANONICAL_SOURCE_PACK_SOURCE_TYPES.includes(
    value as CanonicalSourcePackSourceType,
  )
    ? (value as CanonicalSourcePackSourceType)
    : "unknown";
}

function resolveReliabilityHint(
  value?: string | null,
): CanonicalSourcePackReliabilityHint {
  return CANONICAL_SOURCE_PACK_RELIABILITY_HINTS.includes(
    value as CanonicalSourcePackReliabilityHint,
  )
    ? (value as CanonicalSourcePackReliabilityHint)
    : "unknown";
}

function resolveTranslationStatus(
  value?: string | null,
): CanonicalSourcePackTranslationStatus {
  return CANONICAL_SOURCE_PACK_TRANSLATION_STATUSES.includes(
    value as CanonicalSourcePackTranslationStatus,
  )
    ? (value as CanonicalSourcePackTranslationStatus)
    : "not_needed";
}

function resolveReviewState(
  value?: string | null,
): CanonicalSourcePackReviewState {
  return CANONICAL_SOURCE_PACK_REVIEW_STATES.includes(
    value as CanonicalSourcePackReviewState,
  )
    ? (value as CanonicalSourcePackReviewState)
    : "review_required";
}

export function resolveCanonicalSourcePackEvidenceState(
  value?: string | null,
): CanonicalSourcePackEvidenceState {
  if (
    value &&
    CANONICAL_SOURCE_PACK_EVIDENCE_STATES.includes(
      value as CanonicalSourcePackEvidenceState,
    )
  ) {
    return value as CanonicalSourcePackEvidenceState;
  }

  const trustState = resolveCanonicalTrustState(value);
  return mapTrustStateToSourcePackEvidenceState(trustState);
}

export function mapTrustStateToSourcePackEvidenceState(
  trustState: CanonicalTrustState,
): CanonicalSourcePackEvidenceState {
  if (trustState === "supported") return "supported";
  if (trustState === "contested") return "contested";
  if (trustState === "context_missing") return "context_missing";
  if (trustState === "outdated") return "outdated";
  if (
    trustState === "partially_supported" ||
    trustState === "source_present"
  ) {
    return "partial";
  }
  return "source_needed";
}

export function buildCanonicalSourcePack(
  input: BuildCanonicalSourcePackInput,
): CanonicalSourcePack {
  const sources = (input.sources ?? []).map((source, index) => {
    const normalizedOriginalSnippet = normalizeOptionalText(
      source.originalSnippet,
    );
    const normalizedTranslatedSnippet = normalizeOptionalText(
      source.translatedSnippet,
    );
    const normalizedTitle =
      normalizeOptionalText(source.title) ??
      normalizeOptionalText(source.url) ??
      normalizeOptionalText(source.sourceId) ??
      `source-${index + 1}`;

    return {
      sourceId:
        normalizeOptionalText(source.sourceId) ?? `source-${index + 1}`,
      title: normalizedTitle,
      url: normalizeOptionalText(source.url) ?? undefined,
      sourceLocale: normalizeLocaleTag(source.sourceLocale) ?? null,
      regionCode: normalizeOptionalText(source.regionCode)?.toUpperCase() ?? null,
      sourceType: resolveSourceType(source.sourceType),
      reliabilityHint: resolveReliabilityHint(source.reliabilityHint),
      retrievedAt: normalizeOptionalText(source.retrievedAt) ?? undefined,
      originalSnippet: normalizedOriginalSnippet,
      translatedSnippet: normalizedTranslatedSnippet,
      translationStatus: resolveTranslationStatus(source.translationStatus),
      evidenceState: resolveCanonicalSourcePackEvidenceState(
        source.evidenceState ?? source.trustState,
      ),
      reviewState: resolveReviewState(source.reviewState),
    } satisfies CanonicalSourcePackSource;
  });

  const defaultGap = sources.length === 0 ? ["source_needed"] : [];

  return {
    sourcePackId: input.sourcePackId.trim(),
    sources,
    openGaps: unique([...(input.openGaps ?? []), ...defaultGap]),
    reviewState: resolveReviewState(input.reviewState),
    reviewRequired: true,
    autoPublish: false,
  };
}

export function getCanonicalSourcePackOverallEvidenceState(
  pack: CanonicalSourcePack,
): CanonicalSourcePackEvidenceState {
  if (pack.sources.length === 0) return "source_needed";
  if (pack.sources.some((source) => source.evidenceState === "contested")) {
    return "contested";
  }
  if (pack.sources.some((source) => source.evidenceState === "context_missing")) {
    return "context_missing";
  }
  if (pack.sources.some((source) => source.evidenceState === "outdated")) {
    return "outdated";
  }
  if (pack.sources.some((source) => source.evidenceState === "partial")) {
    return "partial";
  }
  if (pack.sources.every((source) => source.evidenceState === "supported")) {
    return "supported";
  }
  return "source_needed";
}
