import {
  buildCanonicalLanguageBridgeRecord,
  usesCanonicalRtlLayout,
  type BuildCanonicalLanguageBridgeRecordInput,
  type CanonicalLanguageBridgeRecord,
} from "@/features/create/languageBridgeTrustFormatContract";

export const MULTILINGUAL_THREAD_ENTRY_KINDS = [
  "statement",
  "comment",
  "reply",
] as const;

export type MultilingualThreadEntryKind =
  (typeof MULTILINGUAL_THREAD_ENTRY_KINDS)[number];

export const MULTILINGUAL_THREAD_QUOTE_STATUSES = [
  "original_only",
  "translation_attached",
  "summary_attached",
] as const;

export type MultilingualThreadQuoteStatus =
  (typeof MULTILINGUAL_THREAD_QUOTE_STATUSES)[number];

export type MultilingualStatementThreadEntry = {
  entryId: string;
  kind: MultilingualThreadEntryKind;
  bridge: CanonicalLanguageBridgeRecord;
  readingLocale: string;
  quoteStatus: MultilingualThreadQuoteStatus;
  translationReviewType: "translation_review";
  originalPreserved: true;
  translationReplacesOriginal: false;
  summaryReplacesSource: false;
  rtlHint: boolean;
  reviewRequired: true;
  autoPublish: false;
};

export type BuildMultilingualStatementThreadEntryInput =
  BuildCanonicalLanguageBridgeRecordInput & {
    entryId: string;
    kind?: MultilingualThreadEntryKind;
    readingLocale?: string | null;
  };

export function buildMultilingualStatementThreadEntry(
  input: BuildMultilingualStatementThreadEntryInput,
): MultilingualStatementThreadEntry {
  const bridge = buildCanonicalLanguageBridgeRecord(input);
  const readingLocale =
    input.readingLocale?.trim().toLowerCase() ??
    bridge.translation.language ??
    bridge.summary.language;
  const quoteStatus: MultilingualThreadQuoteStatus =
    bridge.translation.text !== null
      ? "translation_attached"
      : bridge.summary.text !== null
        ? "summary_attached"
        : "original_only";

  return {
    entryId: input.entryId.trim(),
    kind: input.kind ?? "statement",
    bridge,
    readingLocale,
    quoteStatus,
    translationReviewType: "translation_review",
    originalPreserved: true,
    translationReplacesOriginal: false,
    summaryReplacesSource: false,
    rtlHint:
      usesCanonicalRtlLayout(bridge.original.language) ||
      usesCanonicalRtlLayout(readingLocale),
    reviewRequired: true,
    autoPublish: false,
  };
}
