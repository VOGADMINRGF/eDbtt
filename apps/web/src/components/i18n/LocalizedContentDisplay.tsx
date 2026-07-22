import { getDir, isSupportedLocale } from "@/config/locales";
import {
  getContentRenderUiText,
  resolveLocalizedContentForReader,
  type LocalizedContentRecord,
} from "@/features/i18n/contentTranslations";
import {
  buildLanguageBridgeSurfaceLine,
  buildLanguageBridgeTrustHint,
  formatLocalizedContentBridgeStateLabel,
} from "@/features/i18n/languageBridgeSurfaceTruth";

type LocalizedContentDisplayProps = {
  content?: LocalizedContentRecord | null;
  preferredLocale?: string | null;
  fallbackText?: string | null;
  emptyFallback?: string | null;
  truncateTo?: number;
  className?: string;
  textClassName?: string;
  metaClassName?: string;
  originalTextClassName?: string;
  missingClassName?: string;
  showLanguageBridgeMeta?: boolean;
};

function truncateText(value: string, maxLength?: number): string {
  if (!maxLength || maxLength < 1 || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveTextDirection(locale: string | null | undefined): "ltr" | "rtl" | "auto" {
  return isSupportedLocale(locale) ? getDir(locale) : "auto";
}

export function LocalizedContentDisplay({
  content,
  preferredLocale,
  fallbackText,
  emptyFallback = null,
  truncateTo,
  className = "",
  textClassName = "",
  metaClassName = "",
  originalTextClassName = "",
  missingClassName = "",
  showLanguageBridgeMeta = false,
}: LocalizedContentDisplayProps) {
  const resolved = resolveLocalizedContentForReader({
    content,
    preferredLocale,
    fallbackOriginalText: fallbackText,
  });

  if (!resolved) {
    if (!emptyFallback) return null;
    return <p className={textClassName}>{emptyFallback}</p>;
  }

  const ui = getContentRenderUiText(resolved.preferredLocale);
  const displayText = truncateText(resolved.displayText, truncateTo);
  const originalText = truncateText(resolved.originalText, truncateTo);
  const readingLanguage =
    resolved.state === "translated"
      ? resolved.preferredLocale
      : resolved.originalLanguage ?? resolved.preferredLocale;
  const languageBridgeStateLabel = formatLocalizedContentBridgeStateLabel({
    uiLocale: resolved.preferredLocale,
    state: resolved.state,
    translationStatus: resolved.translationStatus,
  });
  const languageBridgeLine = buildLanguageBridgeSurfaceLine({
    uiLocale: resolved.preferredLocale,
    originalLanguage: resolved.originalLanguage,
    readingLanguage,
    statusLabel: languageBridgeStateLabel,
  });
  const trustHint = buildLanguageBridgeTrustHint(resolved.preferredLocale);
  const showTrustMeta =
    showLanguageBridgeMeta &&
    (resolved.state !== "original" ||
      Boolean(resolved.originalLanguage && resolved.originalLanguage !== resolved.preferredLocale));
  const readingDir = resolveTextDirection(readingLanguage);
  const originalDir = resolveTextDirection(resolved.originalLanguage);

  return (
    <div className={className}>
      <p className={textClassName} lang={readingLanguage ?? undefined} dir={readingDir}>
        {displayText}
      </p>
      {showLanguageBridgeMeta ? (
        <p className={metaClassName}>{languageBridgeLine}</p>
      ) : null}
      {showTrustMeta ? <p className={metaClassName}>{trustHint}</p> : null}
      {resolved.state === "translated" ? (
        <>
          <p className={metaClassName}>{ui.translatedFrom(resolved.originalLanguage)}</p>
          {resolved.showOriginalDisclosure ? (
            <details className={metaClassName}>
              <summary>{ui.showOriginal}</summary>
              <p
                className={originalTextClassName}
                lang={resolved.originalLanguage ?? undefined}
                dir={originalDir}
              >
                {originalText}
              </p>
            </details>
          ) : null}
        </>
      ) : null}
      {resolved.state === "missing_translation" ? (
        <p className={missingClassName}>{ui.translationMissing(resolved.preferredLocale)}</p>
      ) : null}
    </div>
  );
}

export default LocalizedContentDisplay;
