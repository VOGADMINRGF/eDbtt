export type CreateLinkKind = "youtube" | "video" | "article" | "web" | "multiple" | "unknown";

export type CreateLinkIntentOptionId =
  | "summarize"
  | "extract_claims"
  | "prepare_factcheck"
  | "add_source_to_dossier"
  | "derive_vote_questions";

export type CreateLinkLocale = "de" | "en";

export type CreateLinkIntentOption = {
  id: CreateLinkIntentOptionId;
  label: Record<CreateLinkLocale, string>;
};

export type CreateLinkIntakeDetection = {
  normalizedInput: string;
  hasLink: boolean;
  linkKind: CreateLinkKind;
  primaryUrl: string | null;
  urls: string[];
  linkOnly: boolean;
  mostlyLinkOnly: boolean;
  remainingText: string;
  remainingWordCount: number;
};

export type CreateLinkIntakeMeta = {
  primaryUrl: string;
  urls: string[];
  linkKind: CreateLinkKind;
  selectedIntentId?: CreateLinkIntentOptionId;
  additionalContext?: string;
};

export const CREATE_LINK_INTENT_OPTIONS: readonly CreateLinkIntentOption[] = [
  {
    id: "summarize",
    label: {
      de: "Inhalt zusammenfassen",
      en: "Summarize content",
    },
  },
  {
    id: "extract_claims",
    label: {
      de: "Aussagen / Claims extrahieren",
      en: "Extract claims",
    },
  },
  {
    id: "prepare_factcheck",
    label: {
      de: "Faktencheck vorbereiten",
      en: "Prepare fact-check",
    },
  },
  {
    id: "add_source_to_dossier",
    label: {
      de: "Als Quelle zu einem Dossier hinzufügen",
      en: "Add as dossier source",
    },
  },
  {
    id: "derive_vote_questions",
    label: {
      de: "Abstimmungsfragen ableiten",
      en: "Derive vote questions",
    },
  },
] as const;

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"'`]+|\bwww\.[^\s<>"'`]+/gi;
const TRAILING_PUNCTUATION_PATTERN = /[),.;:!?]+$/;

function normalizeDetectedUrl(raw: string): string {
  const normalized = raw.trim().replace(TRAILING_PUNCTUATION_PATTERN, "");
  if (!normalized) return normalized;
  if (normalized.toLowerCase().startsWith("www.")) {
    return `https://${normalized}`;
  }
  return normalized;
}

function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  const urls: string[] = [];
  for (const match of matches) {
    const normalized = normalizeDetectedUrl(match);
    if (!normalized || urls.includes(normalized)) continue;
    urls.push(normalized);
  }
  return urls;
}

function countMeaningfulWords(text: string): number {
  return text.match(/[0-9A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß]+/g)?.length ?? 0;
}

function resolveCreateLinkKind(urls: string[]): CreateLinkKind {
  if (urls.length === 0) return "unknown";
  if (urls.length > 1) return "multiple";

  const primaryUrl = urls[0];
  if (!primaryUrl) return "unknown";

  const lowerUrl = primaryUrl.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "youtube";
  if (
    lowerUrl.includes("vimeo.com") ||
    lowerUrl.includes("/video/") ||
    /\.(mp4|mov|avi|mkv|webm)(?:$|[?#])/i.test(lowerUrl)
  ) {
    return "video";
  }
  if (/(article|artikel|news|story|bericht|blog|post)/i.test(lowerUrl)) return "article";
  return "web";
}

export function detectCreateLinkIntake(text: string): CreateLinkIntakeDetection {
  const normalizedInput = text.trim();
  const urls = extractUrls(normalizedInput);
  const withoutUrls = normalizedInput.replace(URL_PATTERN, " ");
  const remainingText = withoutUrls.replace(/\s+/g, " ").trim();
  const remainingWordCount = countMeaningfulWords(remainingText);
  const hasLink = urls.length > 0;
  const linkOnly = hasLink && remainingWordCount === 0;
  const mostlyLinkOnly =
    hasLink &&
    (linkOnly || (remainingWordCount <= 6 && remainingText.length <= 48));

  return {
    normalizedInput,
    hasLink,
    linkKind: resolveCreateLinkKind(urls),
    primaryUrl: urls[0] ?? null,
    urls,
    linkOnly,
    mostlyLinkOnly,
    remainingText,
    remainingWordCount,
  };
}

export function resolveCreateLinkIntentOptionLabel(
  id: CreateLinkIntentOptionId,
  locale: CreateLinkLocale,
): string {
  return (
    CREATE_LINK_INTENT_OPTIONS.find((option) => option.id === id)?.label[locale] ??
    CREATE_LINK_INTENT_OPTIONS.find((option) => option.id === id)?.label.de ??
    id
  );
}

export function buildCreateLinkSourceNotice(params: {
  locale: CreateLinkLocale;
  selectedIntentId?: CreateLinkIntentOptionId | null;
}): string {
  const selection = params.selectedIntentId
    ? resolveCreateLinkIntentOptionLabel(params.selectedIntentId, params.locale)
    : null;

  if (params.locale === "en") {
    const prefix = selection ? `Selected: ${selection}. ` : "";
    const factcheckGuardrail =
      params.selectedIntentId === "prepare_factcheck"
        ? " Fact-check / Deep Search only starts after explicit confirmation. No automatic cost booking."
        : "";
    return `${prefix}The link is treated as a source signal. Its content has not been automatically evaluated yet.${factcheckGuardrail}`;
  }

  const prefix = selection ? `Gewählt: ${selection}. ` : "";
  const factcheckGuardrail =
    params.selectedIntentId === "prepare_factcheck"
      ? " Faktencheck / Deep Search startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung."
      : "";
  return `${prefix}Der Link wird als Quelle/Hinweis behandelt. Der Inhalt wurde noch nicht automatisch ausgewertet.${factcheckGuardrail}`;
}

export function buildCreateLinkIntakeMeta(params: {
  detection: CreateLinkIntakeDetection;
  selectedIntentId?: CreateLinkIntentOptionId | null;
  additionalContext?: string | null;
}): CreateLinkIntakeMeta | null {
  if (!params.detection.hasLink || !params.detection.primaryUrl) return null;
  const additionalContext = String(params.additionalContext ?? "").trim();
  return {
    primaryUrl: params.detection.primaryUrl,
    urls: params.detection.urls,
    linkKind: params.detection.linkKind,
    selectedIntentId: params.selectedIntentId ?? undefined,
    additionalContext: additionalContext || undefined,
  };
}
