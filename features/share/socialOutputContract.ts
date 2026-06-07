import {
  resolveVerificationPresentationView,
  type VerificationPresentationView,
} from "@features/ai/e150/verificationPresentation";
import type { E150Lane } from "@features/ai/e150/journeyProfiles";
import type {
  ResearchUsed,
  SourceSupport,
  TruthStatus,
  VerificationMode,
} from "@features/ai/e150/verificationContract";

export type ShareObjectType =
  | "dossier"
  | "factcheck"
  | "companion"
  | "topic_round"
  | "stream"
  | "report"
  | "analyze";

export type ShareVerificationInfo = {
  lane: E150Lane;
  verificationMode: VerificationMode;
  researchUsed: ResearchUsed;
  sealEligible: boolean;
  sealGranted: boolean;
  verificationLabel: "analysiert" | "geprueft" | "verifiziert";
  verificationLabelDisplay: string;
  verificationHint: string;
  truthStatus: TruthStatus;
  truthStatusLabel: string;
  sourceSupport: SourceSupport;
  sourceSupportLabel: string;
  sourceStatus: string;
  reviewRecommended: boolean;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
};

export type ShareOutputAsset = {
  canonicalUrl: string;
  title: string;
  subtitle: string;
  objectType: ShareObjectType;
  objectLabel: string;
  neutralCtaLabel: string;
  verification: ShareVerificationInfo;
  imageUrl: string | null;
  topic: string | null;
  region: string | null;
  deepLinkPath: string | null;
  sharePayload: {
    title: string;
    text: string;
    url: string;
  };
};

export type ShareCardPreview = {
  headline: string;
  subline: string;
  metaLine: string;
  ctaLabel: string;
  canonicalUrl: string;
};

export type ShareCarouselSlide = {
  id: string;
  title: string;
  body: string;
};

export type StreamPreparationOutput = {
  title: string;
  shortSummary: string;
  highlightBullets: string[];
  transcriptSnippetPlaceholders: string[];
  quoteCandidate: string | null;
};

type BuildShareOutputAssetInput = {
  baseUrl?: string;
  canonicalPathOrUrl: string;
  title: string;
  subtitle?: string | null;
  objectType: ShareObjectType;
  imageUrl?: string | null;
  topic?: string | null;
  region?: string | null;
  neutralCtaLabel?: string | null;
  deepLinkPath?: string | null;
  lane?: E150Lane | null;
  status?: string | null;
  verificationMode?: VerificationMode | null;
  researchUsed?: ResearchUsed | null;
  sealEligible?: boolean | null;
  sealGranted?: boolean | null;
  verificationLabel?: "analysiert" | "geprueft" | "verifiziert" | null;
  truthStatus?: TruthStatus | null;
  sourceSupport?: SourceSupport | null;
  sourceStatus?: string | null;
  reviewRecommended?: boolean | null;
};

type BuildCarouselInput = {
  highlights?: readonly string[] | null;
};

type BuildStreamPreparationInput = {
  title: string;
  summary?: string | null;
  highlights?: readonly string[] | null;
  transcriptSnippets?: readonly string[] | null;
  quoteCandidate?: string | null;
};

const OBJECT_LABELS: Record<ShareObjectType, string> = {
  dossier: "Dossier",
  factcheck: "Factcheck",
  companion: "Companion",
  topic_round: "Themenrunde",
  stream: "Stream",
  report: "Report",
  analyze: "Analyse",
};

const DEFAULT_SUBTITLE: Record<ShareObjectType, string> = {
  dossier: "Kontext und Einordnung in strukturierter Form.",
  factcheck: "Prüfstatus und Evidenzlage im Factcheck-Lane.",
  companion: "Begleitender Kontextdialog ohne Wahrheitssiegel.",
  topic_round: "Anlass- und Diskussionskontext mit Anschlussfragen.",
  stream: "Laufende Diskussion mit transparentem Kontext.",
  report: "Sachliche Auswertung mit nachvollziehbarer Basis.",
  analyze: "Analysierte Struktur mit offenen Punkten und Anschlussoptionen.",
};

const DEFAULT_CTA: Record<ShareObjectType, string> = {
  dossier: "Dossier öffnen",
  factcheck: "Factcheck öffnen",
  companion: "Companion öffnen",
  topic_round: "Themenrunde öffnen",
  stream: "Stream öffnen",
  report: "Report öffnen",
  analyze: "Analyse öffnen",
};

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeSentence(value: unknown, max = 220): string {
  const normalized = toStringSafe(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([!?.,;:])\1+/g, "$1")
    .trim();
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function normalizePath(pathOrUrl: string): string {
  const raw = toStringSafe(pathOrUrl);
  if (!raw) return "/";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      return `${parsed.pathname || "/"}${parsed.search || ""}${parsed.hash || ""}`;
    } catch {
      return "/";
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function absoluteUrl(baseUrl: string | undefined, pathOrUrl: string): string {
  const raw = toStringSafe(pathOrUrl);
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const normalizedPath = normalizePath(raw);
  if (!baseUrl) return normalizedPath;
  try {
    return new URL(normalizedPath, baseUrl).toString();
  } catch {
    return normalizedPath;
  }
}

function asNonEmptyOrNull(value: unknown): string | null {
  const cleaned = sanitizeSentence(value, 140);
  return cleaned.length > 0 ? cleaned : null;
}

function resolveVerificationForObject(
  input: BuildShareOutputAssetInput,
): VerificationPresentationView {
  if (input.objectType !== "factcheck") {
    const mode = input.verificationMode === "precheck" ? "precheck" : "none";
    return resolveVerificationPresentationView({
      lane: "standard",
      status: input.status ?? null,
      verificationMode: mode,
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
      verificationLabel: input.verificationLabel ?? null,
      truthStatus: input.truthStatus ?? null,
      sourceSupport: input.sourceSupport ?? null,
      sourceStatus: input.sourceStatus ?? null,
      reviewRecommended: input.reviewRecommended ?? null,
    });
  }

  return resolveVerificationPresentationView({
    lane: input.lane ?? "sealed_factcheck",
    status: input.status ?? null,
    verificationMode: input.verificationMode ?? "sealed",
    researchUsed: input.researchUsed ?? "search",
    sealEligible: input.sealEligible ?? true,
    sealGranted: input.sealGranted ?? false,
    verificationLabel: input.verificationLabel ?? null,
    truthStatus: input.truthStatus ?? null,
    sourceSupport: input.sourceSupport ?? null,
    sourceStatus: input.sourceStatus ?? null,
    reviewRecommended: input.reviewRecommended ?? null,
  });
}

function buildNeutralShareText(
  objectLabel: string,
  title: string,
  subtitle: string,
  verificationLabelDisplay: string,
): string {
  const line = `${objectLabel}: ${title}. ${subtitle} Status: ${verificationLabelDisplay}.`;
  return sanitizeSentence(line, 260);
}

export function buildShareOutputAsset(
  input: BuildShareOutputAssetInput,
): ShareOutputAsset {
  const title = sanitizeSentence(input.title, 120) || "Kontextbeitrag";
  const subtitle =
    sanitizeSentence(input.subtitle, 220) ||
    DEFAULT_SUBTITLE[input.objectType];
  const objectLabel = OBJECT_LABELS[input.objectType];
  const ctaLabel =
    sanitizeSentence(input.neutralCtaLabel, 40) ||
    DEFAULT_CTA[input.objectType];

  const verificationView = resolveVerificationForObject(input);
  const canonicalUrl = absoluteUrl(input.baseUrl, input.canonicalPathOrUrl);
  const deepLinkPath = asNonEmptyOrNull(input.deepLinkPath ?? normalizePath(input.canonicalPathOrUrl));
  const shareText = buildNeutralShareText(
    objectLabel,
    title,
    subtitle,
    verificationView.verificationLabelDisplay,
  );

  return {
    canonicalUrl,
    title,
    subtitle,
    objectType: input.objectType,
    objectLabel,
    neutralCtaLabel: ctaLabel,
    verification: {
      lane: verificationView.lane,
      verificationMode: verificationView.verificationMode,
      researchUsed: verificationView.researchUsed,
      sealEligible: verificationView.sealEligible,
      sealGranted: verificationView.sealGranted,
      verificationLabel: verificationView.verificationLabel,
      verificationLabelDisplay: verificationView.verificationLabelDisplay,
      verificationHint: verificationView.verificationHint,
      truthStatus: verificationView.truthStatus,
      truthStatusLabel: verificationView.truthStatusLabel,
      sourceSupport: verificationView.sourceSupport,
      sourceSupportLabel: verificationView.sourceSupportLabel,
      sourceStatus: verificationView.sourceStatus,
      reviewRecommended: verificationView.reviewRecommended,
      noTruthPromotion: verificationView.noTruthPromotion,
      noAutoGraphPromotion: verificationView.noAutoGraphPromotion,
    },
    imageUrl: asNonEmptyOrNull(input.imageUrl),
    topic: asNonEmptyOrNull(input.topic),
    region: asNonEmptyOrNull(input.region),
    deepLinkPath,
    sharePayload: {
      title,
      text: shareText,
      url: canonicalUrl,
    },
  };
}

export function buildShareCardPreview(asset: ShareOutputAsset): ShareCardPreview {
  const contextBits = [asset.objectLabel, asset.verification.verificationLabelDisplay];
  if (asset.topic) contextBits.push(asset.topic);
  if (asset.region) contextBits.push(asset.region);

  return {
    headline: asset.title,
    subline: sanitizeSentence(asset.subtitle, 160),
    metaLine: contextBits.join(" · "),
    ctaLabel: asset.neutralCtaLabel,
    canonicalUrl: asset.canonicalUrl,
  };
}

export function buildNeutralCarouselDraft(
  asset: ShareOutputAsset,
  input?: BuildCarouselInput,
): ShareCarouselSlide[] {
  const highlights = (input?.highlights ?? [])
    .map((item) => sanitizeSentence(item, 150))
    .filter((item) => item.length > 0)
    .slice(0, 2);

  const slides: ShareCarouselSlide[] = [
    {
      id: "context",
      title: asset.objectLabel,
      body: sanitizeSentence(`${asset.title}. ${asset.subtitle}`, 180),
    },
  ];

  const primaryHighlight = highlights[0];
  if (primaryHighlight) {
    slides.push({
      id: "highlight_1",
      title: "Hinweis",
      body: primaryHighlight,
    });
  }

  slides.push({
    id: "status",
    title: "Status",
    body: sanitizeSentence(
      `${asset.verification.verificationLabelDisplay}. ${asset.verification.verificationHint}`,
      180,
    ),
  });

  return slides;
}

export function buildStreamPreparationOutput(
  input: BuildStreamPreparationInput,
): StreamPreparationOutput {
  const title = sanitizeSentence(input.title, 120) || "Stream";
  const shortSummary =
    sanitizeSentence(input.summary, 220) ||
    "Neutraler Stream-Kontext mit nachvollziehbaren Anschlussfragen.";

  const highlights = (input.highlights ?? [])
    .map((item) => sanitizeSentence(item, 140))
    .filter((item) => item.length > 0)
    .slice(0, 3);

  const safeHighlights =
    highlights.length > 0
      ? highlights
      : [
          sanitizeSentence("Kernaussage präzisieren und offene Punkte sichtbar halten.", 140),
          sanitizeSentence("Relevante Gegenpositionen und Evidenzbedarf dokumentieren.", 140),
        ];

  const transcriptSnippets = (input.transcriptSnippets ?? [])
    .map((item) => sanitizeSentence(item, 180))
    .filter((item) => item.length > 0)
    .slice(0, 2);

  const placeholders =
    transcriptSnippets.length > 0
      ? transcriptSnippets
      : [
          "[Transkriptstelle 1: zentrale Passage]",
          "[Transkriptstelle 2: Anschlussfrage oder Einordnung]",
        ];

  return {
    title,
    shortSummary,
    highlightBullets: safeHighlights.slice(0, 3),
    transcriptSnippetPlaceholders: placeholders,
    quoteCandidate: asNonEmptyOrNull(input.quoteCandidate),
  };
}
