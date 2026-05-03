import { z } from "zod";
import type { OutputPackage, SourceState } from "./contracts";

export const MASTER_POST_STATUSES = [
  "draft",
  "review_required",
  "approved",
  "rejected",
] as const;

export const MASTER_POST_AUDIENCES = [
  "allgemeine_oeffentlichkeit",
  "lokale_oeffentlichkeit",
  "kommunale_akteure",
  "fachoeffentlichkeit",
] as const;

export const MASTER_POST_PUBLICATION_STATUSES = [
  "draft_review_required",
  "ready_for_scheduling",
  "scheduled_preparation",
] as const;

export type MasterPostStatus = (typeof MASTER_POST_STATUSES)[number];
export type MasterPostAudience = (typeof MASTER_POST_AUDIENCES)[number];
export type MasterPostPublicationStatus = (typeof MASTER_POST_PUBLICATION_STATUSES)[number];

export type MasterPostHashtag = {
  tag: string;
  rationale: string;
};

export type MasterPostScheduleHint = {
  label: string;
  window: string;
  rationale: string;
};

export type MasterPostReviewGuardrail = {
  id: string;
  level: "hinweis" | "warnung";
  message: string;
};

export type MasterPostChannelVariant = {
  channel: string;
  title: string;
  excerpt: string;
  toneHint: string;
};

export type MasterPost = {
  id: string;
  dossierId: string;
  packageId: string;
  title: string;
  regionalContext: string;
  topic: string;
  overallPicture: string;
  sourceSituation: string;
  openQuestions: string[];
  options: string[];
  hook: string;
  body: string;
  participationQuestion: string;
  cta: string;
  backlinkTarget: string;
  qrTarget: string;
  suggestedHashtags: MasterPostHashtag[];
  suggestedPostingWindows: MasterPostScheduleHint[];
  channelFit: MasterPostChannelVariant[];
  motifHint: string;
  sourceState: SourceState;
  reviewStatus: MasterPostStatus;
  publicationStatus: MasterPostPublicationStatus;
  canAutoPublish: false;
  canRealtimePublish: false;
  externalApisUsed: false;
  createdAt: string;
  reviewGuardrails: MasterPostReviewGuardrail[];
};

const MasterPostHashtagSchema = z
  .object({
    tag: z.string().trim().regex(/^#[\p{L}\p{N}_-]{2,}$/u),
    rationale: z.string().trim().min(1),
  })
  .strict();

const MasterPostScheduleHintSchema = z
  .object({
    label: z.string().trim().min(1),
    window: z.string().trim().min(1),
    rationale: z.string().trim().min(1),
  })
  .strict();

const MasterPostReviewGuardrailSchema = z
  .object({
    id: z.string().trim().min(1),
    level: z.enum(["hinweis", "warnung"]),
    message: z.string().trim().min(1),
  })
  .strict();

const MasterPostChannelVariantSchema = z
  .object({
    channel: z.string().trim().min(1),
    title: z.string().trim().min(1),
    excerpt: z.string().trim().min(1),
    toneHint: z.string().trim().min(1),
  })
  .strict();

export const MasterPostSchema = z
  .object({
    id: z.string().trim().min(1),
    dossierId: z.string().trim().min(1),
    packageId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    regionalContext: z.string().trim().min(1),
    topic: z.string().trim().min(1),
    overallPicture: z.string().trim().min(1),
    sourceSituation: z.string().trim().min(1),
    openQuestions: z.array(z.string().trim().min(1)),
    options: z.array(z.string().trim().min(1)),
    hook: z.string().trim().min(1),
    body: z.string().trim().min(1),
    participationQuestion: z.string().trim().min(1),
    cta: z.string().trim().min(1),
    backlinkTarget: z.string().trim().min(1),
    qrTarget: z.string().trim().min(1),
    suggestedHashtags: z.array(MasterPostHashtagSchema).min(3),
    suggestedPostingWindows: z.array(MasterPostScheduleHintSchema).min(1),
    channelFit: z.array(MasterPostChannelVariantSchema).min(1),
    motifHint: z.string().trim().min(1),
    sourceState: z.any(),
    reviewStatus: z.enum(MASTER_POST_STATUSES),
    publicationStatus: z.enum(MASTER_POST_PUBLICATION_STATUSES),
    canAutoPublish: z.literal(false),
    canRealtimePublish: z.literal(false),
    externalApisUsed: z.literal(false),
    createdAt: z.string().datetime({ offset: true }),
    reviewGuardrails: z.array(MasterPostReviewGuardrailSchema),
  })
  .strict();

const CITY_CANDIDATES = [
  "Lübeck",
  "Berlin",
  "Hamburg",
  "München",
  "Köln",
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

function compact(value: string, max = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function stableKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function ensureQuestionMark(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Welche Frage soll öffentlich diskutiert werden?";
  if (normalized.includes("?")) return normalized;
  return `${normalized}?`;
}

function findLocation(texts: string[]): string | null {
  const merged = texts.filter(Boolean).join(" ");
  for (const city of CITY_CANDIDATES) {
    if (new RegExp(`\\b${city}\\b`, "u").test(merged)) return city;
  }
  const match = merged.match(/\b(?:in|aus|bei)\s+([A-ZÄÖÜ][\p{L}-]{2,})\b/u);
  return match?.[1] ?? null;
}

function toHashtag(value: string): string {
  const cleaned = value.replace(/[^\p{L}\p{N}]/gu, "").trim();
  if (!cleaned) return "";
  return `#${cleaned}`;
}

function mapReviewStatus(reviewStatus: OutputPackage["reviewStatus"]): MasterPostStatus {
  if (reviewStatus === "approved") return "approved";
  if (reviewStatus === "rejected") return "rejected";
  return "review_required";
}

export function generateMasterPost(
  outputPackage: OutputPackage,
  options?: {
    now?: string;
    audience?: MasterPostAudience;
  },
): MasterPost {
  const location = findLocation([
    outputPackage.title,
    outputPackage.shortSummary,
    ...outputPackage.sourceTraces.map((source) => source.title),
  ]);

  const regionalContext = location ? `in ${location}` : "in Ihrer Region";
  const topic = compact(outputPackage.shortSummary, 150) || "ein kommunales Thema";
  const participationQuestion = ensureQuestionMark(
    outputPackage.openQuestions[0] ||
      `Wie sehen Sie die Lage ${regionalContext}, und was sollte als nächstes umgesetzt werden`,
  );

  const hook = location
    ? `In ${location} wird aktuell über ${topic} diskutiert.`
    : `Aktuell wird ${regionalContext} über ${topic} diskutiert.`;

  const overallPicture =
    compact(outputPackage.structuredSummary[0] ?? outputPackage.shortSummary, 240) ||
    "Gesamtbild wird aus dem Dossier laufend präzisiert.";

  const sourceSituation =
    outputPackage.sourceState.status === "missing"
      ? "Quellenlage ist noch unvollständig und bleibt review-pflichtig."
      : `Quellenlage mit ${outputPackage.sourceState.sourceCount} verknüpften Quellen dokumentiert.`;

  const openQuestions =
    outputPackage.openQuestions.length > 0
      ? outputPackage.openQuestions.slice(0, 6)
      : ["Offene Fragen sind aktuell noch zu ergänzen."];

  const decisionOptions =
    outputPackage.options.length > 0
      ? outputPackage.options.slice(0, 6)
      : ["Optionen/Eventualitäten sind noch zu ergänzen."];

  const body = [
    `${hook} Das Dossier bündelt den bisherigen Sachstand, macht Quellen sichtbar und markiert offene Fragen.`,
    `Damit Beteiligung nachvollziehbar bleibt, werden Optionen und Eventualitäten transparent gegenübergestellt.`,
    `Beteiligungsfrage: ${participationQuestion}`,
  ].join(" ");

  const cta = "Prüfen, ergänzen, abstimmen.";

  const hashtags: MasterPostHashtag[] = [
    { tag: "#eDebatte", rationale: "Produkt- und Prozessbezug" },
    { tag: "#Beteiligung", rationale: "Beteiligungscharakter klar benennen" },
    { tag: "#Kommunal", rationale: "Lokaler Gemeinwohlbezug" },
  ];
  if (location) {
    const regionTag = toHashtag(location);
    if (regionTag) hashtags.push({ tag: regionTag, rationale: "Regionaler Anlass" });
  }

  const suggestedPostingWindows: MasterPostScheduleHint[] = [
    {
      label: "Morgenslot",
      window: "Mo-Fr 07:30-09:00",
      rationale: "Gute Sichtbarkeit für Pendel- und Arbeitsbeginnzeiten.",
    },
    {
      label: "Mittagsslot",
      window: "Mo-Do 12:00-13:30",
      rationale: "Kurze Informationsfenster mit hoher mobiler Nutzung.",
    },
    {
      label: "Abendslot",
      window: "Di-Do 18:00-20:00",
      rationale: "Höhere Beteiligungsbereitschaft nach Arbeitszeit.",
    },
  ];

  const channelFit: MasterPostChannelVariant[] = [
    {
      channel: "website_embed",
      title: "Dossier-Post (Website)",
      excerpt: compact(body, 220),
      toneHint: "neutral, sachlich, anschlussfähig",
    },
    {
      channel: "linkedin",
      title: "LinkedIn Sachpost",
      excerpt: compact(`${hook} ${cta}`, 180),
      toneHint: "professionell, faktenbasiert, dialogorientiert",
    },
    {
      channel: "instagram",
      title: "Instagram Caption",
      excerpt: compact(`${hook} ${participationQuestion}`, 170),
      toneHint: "niedrigschwellig, lokal, einladend",
    },
  ];

  const reviewGuardrails: MasterPostReviewGuardrail[] = [];
  if (outputPackage.sourceState.status === "missing") {
    reviewGuardrails.push({
      id: "source_missing",
      level: "warnung",
      message: "Quellenlage unvollständig: vor externer Nutzung Review verpflichtend.",
    });
  }
  if (outputPackage.openQuestions.length > 0) {
    reviewGuardrails.push({
      id: "open_questions_present",
      level: "hinweis",
      message: "Offene Fragen sind sichtbar und müssen vor Veröffentlichung eingeordnet werden.",
    });
  }
  if (outputPackage.options.length === 0) {
    reviewGuardrails.push({
      id: "options_missing",
      level: "warnung",
      message: "Optionen/Eventualitäten fehlen: Beteiligungskontext vor Veröffentlichung ergänzen.",
    });
  }

  const createdAt = (() => {
    const candidate = options?.now ? new Date(options.now) : new Date(outputPackage.generatedAt);
    return Number.isNaN(candidate.getTime()) ? new Date().toISOString() : candidate.toISOString();
  })();

  const post: MasterPost = {
    id: `masterpost_${stableKey(`${outputPackage.packageId}|${outputPackage.dossierId}`)}`,
    dossierId: outputPackage.dossierId,
    packageId: outputPackage.packageId,
    title: outputPackage.title,
    regionalContext,
    topic,
    overallPicture,
    sourceSituation,
    openQuestions,
    options: decisionOptions,
    hook,
    body,
    participationQuestion,
    cta,
    backlinkTarget: outputPackage.dossierBacklinkTarget,
    qrTarget: outputPackage.qrCodeTarget.target,
    suggestedHashtags: hashtags,
    suggestedPostingWindows,
    channelFit,
    motifHint: "Kontrast aus lokalem Anlass, Quellenlage und offener Beteiligungsfrage.",
    sourceState: outputPackage.sourceState,
    reviewStatus: mapReviewStatus(outputPackage.reviewStatus),
    publicationStatus: "draft_review_required",
    canAutoPublish: false,
    canRealtimePublish: false,
    externalApisUsed: false,
    createdAt,
    reviewGuardrails,
  };

  return MasterPostSchema.parse(post);
}
