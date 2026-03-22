import {
  getContentRenderUiText,
  resolveLocalizedContentForReader,
  type LocalizedContentRecord,
} from "@/features/i18n/contentTranslations";

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
};

function truncateText(value: string, maxLength?: number): string {
  if (!maxLength || maxLength < 1 || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
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

  return (
    <div className={className}>
      <p className={textClassName}>{displayText}</p>
      {resolved.state === "translated" ? (
        <>
          <p className={metaClassName}>{ui.translatedFrom(resolved.originalLanguage)}</p>
          {resolved.showOriginalDisclosure ? (
            <details className={metaClassName}>
              <summary>{ui.showOriginal}</summary>
              <p className={originalTextClassName}>{originalText}</p>
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
