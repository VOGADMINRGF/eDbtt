import { z } from "zod";
import {
  OUTPUT_REVIEW_STATUSES,
  SOURCE_STATE_STATUSES,
  type OutputPackage,
  type SourceStateStatus,
} from "./contracts";

export const SOCIAL_CAROUSEL_SLIDE_KINDS = [
  "headline",
  "anlass",
  "documented",
  "disputed",
  "options",
  "cta",
  "note",
] as const;

export const SOCIAL_CAROUSEL_VARIANTS = [
  "square",
  "story",
  "linkedin",
  "print_preview",
] as const;

export const SOCIAL_CAROUSEL_PUBLICATION_STATUSES = ["draft_review_required"] as const;

export type SocialCarouselSlideKind = (typeof SOCIAL_CAROUSEL_SLIDE_KINDS)[number];
export type SocialCarouselVariant = (typeof SOCIAL_CAROUSEL_VARIANTS)[number];
export type SocialCarouselPublicationStatus =
  (typeof SOCIAL_CAROUSEL_PUBLICATION_STATUSES)[number];

export type SocialCarouselVariantMeta = {
  variant: SocialCarouselVariant;
  label: string;
  aspectRatio: string;
  width: number;
  height: number;
};

export type SocialCarouselSlide = {
  id: string;
  kind: SocialCarouselSlideKind;
  title: string;
  body: string;
  eyebrow?: string;
  sourceState?: SourceStateStatus;
  cta?: {
    label: string;
    target: string;
  };
  backlinkTarget?: string;
  reviewWarning?: string;
};

export type SocialCarouselOutput = {
  format: "social_carousel";
  dossierId: string;
  packageId: string;
  generatedAt: string;
  reviewStatus: OutputPackage["reviewStatus"];
  sourceState: SourceStateStatus;
  slideCount: number;
  slides: SocialCarouselSlide[];
  backlinkTarget: string;
  defaultVariant: SocialCarouselVariant;
  variants: SocialCarouselVariantMeta[];
  suggestedPostText: string;
  suggestedHashtags: string[];
  suggestedPostingWindows: string[];
  suggestedChannelFit: string[];
  regionalContext: string;
  participationQuestion: string;
  motifHint: string;
  publicationStatus: SocialCarouselPublicationStatus;
  canAutoPublish: false;
  automationHint: string;
  autoPublish: false;
  externalApisUsed: false;
  trackingEnabled: false;
};

const SocialCarouselVariantMetaSchema = z
  .object({
    variant: z.enum(SOCIAL_CAROUSEL_VARIANTS),
    label: z.string().trim().min(1),
    aspectRatio: z.string().trim().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

export const SocialCarouselSlideSchema = z
  .object({
    id: z.string().trim().min(1),
    kind: z.enum(SOCIAL_CAROUSEL_SLIDE_KINDS),
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    eyebrow: z.string().trim().min(1).optional(),
    sourceState: z.enum(SOURCE_STATE_STATUSES).optional(),
    cta: z
      .object({
        label: z.string().trim().min(1),
        target: z.string().trim().min(1),
      })
      .strict()
      .optional(),
    backlinkTarget: z.string().trim().min(1).optional(),
    reviewWarning: z.string().trim().min(1).optional(),
  })
  .strict();

export const SocialCarouselOutputSchema = z
  .object({
    format: z.literal("social_carousel"),
    dossierId: z.string().trim().min(1),
    packageId: z.string().trim().min(1),
    generatedAt: z.string().datetime({ offset: true }),
    reviewStatus: z.enum(OUTPUT_REVIEW_STATUSES),
    sourceState: z.enum(SOURCE_STATE_STATUSES),
    slideCount: z.number().int().min(5).max(7),
    slides: z.array(SocialCarouselSlideSchema).min(5).max(7),
    backlinkTarget: z.string().trim().min(1),
    defaultVariant: z.enum(SOCIAL_CAROUSEL_VARIANTS),
    variants: z.array(SocialCarouselVariantMetaSchema).length(4),
    suggestedPostText: z.string().trim().min(1),
    suggestedHashtags: z.array(z.string().trim().min(2)).min(3),
    suggestedPostingWindows: z.array(z.string().trim().min(1)).min(1),
    suggestedChannelFit: z.array(z.string().trim().min(1)).min(1),
    regionalContext: z.string().trim().min(1),
    participationQuestion: z.string().trim().min(1),
    motifHint: z.string().trim().min(1),
    publicationStatus: z.enum(SOCIAL_CAROUSEL_PUBLICATION_STATUSES),
    canAutoPublish: z.literal(false),
    automationHint: z.string().trim().min(1),
    autoPublish: z.literal(false),
    externalApisUsed: z.literal(false),
    trackingEnabled: z.literal(false),
  })
  .strict();

export const SOCIAL_CAROUSEL_VARIANT_META: SocialCarouselVariantMeta[] = [
  {
    variant: "square",
    label: "Quadrat 1:1",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
  },
  {
    variant: "story",
    label: "Story 9:16",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
  },
  {
    variant: "linkedin",
    label: "LinkedIn 4:5",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
  },
  {
    variant: "print_preview",
    label: "Druckvorschau A4",
    aspectRatio: "210:297",
    width: 1240,
    height: 1754,
  },
];

const CITY_CANDIDATES = [
  "Lübeck",
  "Berlin",
  "Hamburg",
  "München",
  "Köln",
  "Frankfurt",
  "Leipzig",
  "Dresden",
  "Stuttgart",
  "Bremen",
  "Hannover",
  "Kiel",
  "Rostock",
  "Bonn",
  "Aachen",
];

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function compactSentence(value: string, maxLength = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function ensureQuestionMark(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Welche Frage soll öffentlich diskutiert werden?";
  if (normalized.includes("?")) return normalized;
  return `${normalized}?`;
}

function joinList(values: string[], emptyText: string, max = 3): string {
  const clean = values.map(trim).filter(Boolean).slice(0, max);
  if (clean.length === 0) return emptyText;
  return clean.map((entry) => `• ${entry}`).join("\n");
}

function buildReviewWarning(input: {
  sourceState: SourceStateStatus;
  optionsCount: number;
  openQuestionCount: number;
}): string | undefined {
  const warnings: string[] = [];
  if (input.sourceState === "missing") warnings.push("Quellenstand unvollständig");
  if (input.optionsCount === 0) warnings.push("Optionen fehlen");
  if (input.openQuestionCount > 0) warnings.push("offene Fragen sichtbar");
  return warnings.length > 0 ? `Review erforderlich: ${warnings.join(", ")}.` : undefined;
}

function findLocation(texts: string[]): string | undefined {
  const merged = texts.filter(Boolean).join(" ");

  for (const city of CITY_CANDIDATES) {
    if (new RegExp(`\\b${city}\\b`, "u").test(merged)) {
      return city;
    }
  }

  const match = merged.match(/\b(?:in|aus|bei)\s+([A-ZÄÖÜ][\p{L}-]{2,})\b/u);
  return match?.[1];
}

function extractTopicPhrase(outputPackage: OutputPackage): string {
  const source = compactSentence(outputPackage.shortSummary, 110);
  if (source) return source;
  return "dieses Thema";
}

function buildParticipationQuestion(outputPackage: OutputPackage): {
  regionalContext: string;
  participationQuestion: string;
} {
  const location = findLocation([
    outputPackage.title,
    outputPackage.shortSummary,
    ...outputPackage.sourceTraces.map((trace) => trace.title),
  ]);

  const topic = extractTopicPhrase(outputPackage);

  if (location) {
    return {
      regionalContext: `in ${location}`,
      participationQuestion: `${location} diskutiert aktuell: ${topic}. Wie sehen Sie das vor Ort, und was ist aus Ihrer Sicht für die Zukunft sinnvoll?`,
    };
  }

  return {
    regionalContext: "in Ihrer Region",
    participationQuestion:
      "Dieses Thema wird aktuell vor Ort diskutiert. Welche Lösung ist aus Ihrer Sicht sinnvoll, und was sollte als Nächstes geprüft werden?",
  };
}

function toHashtag(value: string): string {
  const cleaned = value.replace(/[^\p{L}\p{N}]/gu, "").trim();
  if (!cleaned) return "";
  return `#${cleaned}`;
}

function buildSuggestedHashtags(outputPackage: OutputPackage, regionalContext: string): string[] {
  const base = ["#eDebatte", "#Beteiligung", "#Dossier", "#Mitreden"];

  const regionToken = regionalContext.startsWith("in ")
    ? toHashtag(regionalContext.replace(/^in\s+/u, ""))
    : "";

  const topicTokens = outputPackage.title
    .split(/\s+/)
    .map((word) => word.replace(/[.,:;!?]/g, ""))
    .filter((word) => word.length >= 6)
    .map((word) => toHashtag(word))
    .filter(Boolean)
    .slice(0, 2);

  const deduped = new Set([...base, regionToken, ...topicTokens]);
  return Array.from(deduped).filter(Boolean).slice(0, 6);
}

export function generateSocialCarouselOutput(outputPackage: OutputPackage): SocialCarouselOutput {
  const reviewWarning = buildReviewWarning({
    sourceState: outputPackage.sourceState.status,
    optionsCount: outputPackage.options.length,
    openQuestionCount: outputPackage.openQuestions.length,
  });

  const framing = buildParticipationQuestion(outputPackage);
  const suggestedHashtags = buildSuggestedHashtags(outputPackage, framing.regionalContext);

  const slides: SocialCarouselSlide[] = [
    {
      id: "slide_1",
      kind: "headline",
      eyebrow: "Öffentliche Frage",
      title: ensureQuestionMark(compactSentence(framing.participationQuestion, 140)),
      body: compactSentence(outputPackage.shortSummary, 220),
      backlinkTarget: outputPackage.dossierBacklinkTarget,
      reviewWarning,
    },
    {
      id: "slide_2",
      kind: "anlass",
      eyebrow: "Anlass",
      title: "Was war der Anlass?",
      body: "Ein Beitrag aus der Bürgerschaft macht sichtbar, worüber vor Ort gesprochen wird.",
      backlinkTarget: outputPackage.dossierBacklinkTarget,
    },
    {
      id: "slide_3",
      kind: "documented",
      eyebrow: "Belegt",
      title: "Was ist belegt?",
      body: joinList(
        outputPackage.sourceTraces.map((source) => source.title),
        "• Noch keine belastbaren Quellen verknüpft.",
        3,
      ),
      sourceState: outputPackage.sourceState.status,
      backlinkTarget: outputPackage.dossierBacklinkTarget,
      reviewWarning:
        outputPackage.sourceState.status === "missing"
          ? "Review erforderlich: Quellenstand ist noch nicht ausreichend."
          : undefined,
    },
    {
      id: "slide_4",
      kind: "disputed",
      eyebrow: "Offen / strittig",
      title: "Was ist offen?",
      body: joinList(outputPackage.openQuestions, "• Aktuell keine offenen Fragen markiert.", 3),
      backlinkTarget: outputPackage.dossierBacklinkTarget,
      reviewWarning:
        outputPackage.openQuestions.length > 0
          ? "Review erforderlich: offene Fragen müssen sichtbar bleiben."
          : undefined,
    },
    {
      id: "slide_5",
      kind: "options",
      eyebrow: "Entscheidungswege",
      title: "Welche Optionen gibt es?",
      body: joinList(outputPackage.options, "• Noch keine tragfähigen Optionen dokumentiert.", 3),
      backlinkTarget: outputPackage.dossierBacklinkTarget,
      reviewWarning:
        outputPackage.options.length === 0
          ? "Review erforderlich: Entscheidungsoptionen fehlen."
          : undefined,
    },
    {
      id: "slide_6",
      kind: "cta",
      eyebrow: "Beteiligung",
      title: "Prüfen, ergänzen, abstimmen",
      body: "Beteiligen Sie sich im offenen Dossier. Veröffentlichung erst nach Review.",
      cta: {
        label: "Prüfen, ergänzen, abstimmen",
        target: outputPackage.cta.target,
      },
      backlinkTarget: outputPackage.dossierBacklinkTarget,
      reviewWarning,
    },
  ];

  if (outputPackage.sourceState.notes.length > 0 || outputPackage.needsInputMarkers.length > 0) {
    slides.push({
      id: "slide_7",
      kind: "note",
      eyebrow: "Quellenstand / Review-Hinweis",
      title: "Quellenstand und Review-Hinweis",
      body: joinList(
        [...outputPackage.sourceState.notes, ...outputPackage.needsInputMarkers],
        "• Keine zusätzlichen Hinweise.",
        4,
      ),
      cta: {
        label: "Zurück zum Dossier",
        target: outputPackage.dossierBacklinkTarget,
      },
      backlinkTarget: outputPackage.dossierBacklinkTarget,
      reviewWarning,
    });
  }

  const suggestedPostText = compactSentence(
    `${framing.participationQuestion} ${outputPackage.cta.label} ${outputPackage.dossierBacklinkTarget}`,
    300,
  );

  const output: SocialCarouselOutput = {
    format: "social_carousel",
    dossierId: outputPackage.dossierId,
    packageId: outputPackage.packageId,
    generatedAt: outputPackage.generatedAt,
    reviewStatus: outputPackage.reviewStatus,
    sourceState: outputPackage.sourceState.status,
    slideCount: slides.length,
    slides,
    backlinkTarget: outputPackage.dossierBacklinkTarget,
    defaultVariant: "square",
    variants: SOCIAL_CAROUSEL_VARIANT_META,
    suggestedPostText,
    suggestedHashtags,
    suggestedPostingWindows: [
      "Mo-Fr 07:30-09:00",
      "Mo-Do 12:00-13:30",
      "Di-Do 18:00-20:00",
    ],
    suggestedChannelFit: [
      "Instagram Carousel: klare 6-7 Folien mit kurzer Leitfrage",
      "LinkedIn 4:5: Kontext + Quellenhinweis für sachliche Diskussion",
      "Story 9:16: kompakter Einstieg mit Verweis auf das Dossier",
    ],
    regionalContext: framing.regionalContext,
    participationQuestion: framing.participationQuestion,
    motifHint:
      "Abstrakte Stadtkontur mit cyan-blau-violettem Verlauf und klarer Typografie, ohne Personenfokus.",
    publicationStatus: "draft_review_required",
    canAutoPublish: false,
    automationHint: "Automatisierung erst nach Freigabe/Policy möglich.",
    autoPublish: false,
    externalApisUsed: false,
    trackingEnabled: false,
  };

  return SocialCarouselOutputSchema.parse(output);
}
