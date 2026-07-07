import { normalizeLocaleTag } from "@/features/i18n/contentTranslations";
import {
  getCanonicalSourcePackOverallEvidenceState,
  type CanonicalSourcePack,
  type CanonicalSourcePackEvidenceState,
  type CanonicalSourcePackTranslationStatus,
} from "@/features/create/canonicalSourcePackContract";
import type { CanonicalTrustState } from "@/features/create/languageBridgeTrustFormatContract";

export const MULTILINGUAL_EVIDENCE_UNCERTAINTY_REASONS = [
  "none",
  "translation_uncertain",
  "source_needed",
  "context_missing",
  "contested",
  "outdated",
] as const;

export type MultilingualEvidenceUncertaintyReason =
  (typeof MULTILINGUAL_EVIDENCE_UNCERTAINTY_REASONS)[number];

export type MultilingualEvidenceTrustEntry = {
  sourceId: string;
  title: string;
  sourceLocale: string | null;
  userLocale: string;
  readingLocale: string;
  originalSnippet: string | null;
  translatedEvidence: string | null;
  translationStatus: CanonicalSourcePackTranslationStatus;
  trustStatus: CanonicalTrustState;
  uncertaintyReason: MultilingualEvidenceUncertaintyReason;
};

export type MultilingualEvidenceTrustRecord = {
  sourcePackId: string;
  entries: MultilingualEvidenceTrustEntry[];
  overallTrustStatus: CanonicalTrustState;
  overallUncertaintyReasons: MultilingualEvidenceUncertaintyReason[];
  reviewRequired: true;
  autoPublish: false;
};

export type BuildMultilingualEvidenceTrustRecordInput = {
  sourcePack: CanonicalSourcePack;
  userLocale?: string | null;
  readingLocale?: string | null;
};

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values.filter(Boolean))) as T[];
}

function mapEvidenceStateToTrustStatus(
  evidenceState: CanonicalSourcePackEvidenceState,
): CanonicalTrustState {
  if (evidenceState === "supported") return "supported";
  if (evidenceState === "partial") return "partially_supported";
  if (evidenceState === "contested") return "contested";
  if (evidenceState === "context_missing") return "context_missing";
  if (evidenceState === "outdated") return "outdated";
  return "source_needed";
}

function resolveUncertaintyReason(
  translationStatus: CanonicalSourcePackTranslationStatus,
  evidenceState: CanonicalSourcePackEvidenceState,
): MultilingualEvidenceUncertaintyReason {
  if (translationStatus === "uncertain") return "translation_uncertain";
  if (evidenceState === "context_missing") return "context_missing";
  if (evidenceState === "contested") return "contested";
  if (evidenceState === "outdated") return "outdated";
  if (evidenceState === "source_needed") return "source_needed";
  return "none";
}

function normalizeLocale(
  value: string | null | undefined,
  fallback: string,
): string {
  return normalizeLocaleTag(value) ?? fallback;
}

export function buildMultilingualEvidenceTrustRecord(
  input: BuildMultilingualEvidenceTrustRecordInput,
): MultilingualEvidenceTrustRecord {
  const userLocale = normalizeLocale(input.userLocale, "de");
  const readingLocale = normalizeLocale(input.readingLocale, userLocale);
  const entries = input.sourcePack.sources.map((source) => {
    const uncertaintyReason = resolveUncertaintyReason(
      source.translationStatus,
      source.evidenceState,
    );
    const trustStatus =
      source.translationStatus === "uncertain"
        ? "translation_uncertain"
        : mapEvidenceStateToTrustStatus(source.evidenceState);

    return {
      sourceId: source.sourceId,
      title: source.title,
      sourceLocale: normalizeLocaleTag(source.sourceLocale) ?? null,
      userLocale,
      readingLocale,
      originalSnippet: source.originalSnippet ?? null,
      translatedEvidence: source.translatedSnippet ?? null,
      translationStatus: source.translationStatus,
      trustStatus,
      uncertaintyReason,
    } satisfies MultilingualEvidenceTrustEntry;
  });

  const overallEvidenceState = getCanonicalSourcePackOverallEvidenceState(
    input.sourcePack,
  );
  const overallUncertaintyReasons = unique(
    entries.map((entry) => entry.uncertaintyReason),
  ).filter((reason) => reason !== "none");
  const overallTrustStatus =
    entries.some((entry) => entry.trustStatus === "translation_uncertain")
      ? "translation_uncertain"
      : mapEvidenceStateToTrustStatus(overallEvidenceState);

  return {
    sourcePackId: input.sourcePack.sourcePackId,
    entries,
    overallTrustStatus,
    overallUncertaintyReasons,
    reviewRequired: true,
    autoPublish: false,
  };
}
