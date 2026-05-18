import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { z } from "zod";
import type { Region } from "./contracts";
import {
  REGION_PUBLICATION_VISIBILITY_STATES,
  resolveParticipationVisibilityState,
  type RegionPublicationVisibilityState,
} from "./publicationRiskLadder";
import {
  type RegionFeedSignal,
  parseRegionFeedSignal,
} from "./regionFeedSignals";

export const REGION_PARTICIPATION_SOURCE_CLASSES = [
  "feed",
  "official",
  "community",
  "participation",
] as const;
export type RegionParticipationSignalSourceClass =
  (typeof REGION_PARTICIPATION_SOURCE_CLASSES)[number];

export const REGION_PARTICIPATION_SOURCE_TYPES = [
  "public_claim",
  "public_contribution",
  "public_question",
  "public_source_hint",
  "swipe_interest",
  "swipe_counterpoint",
  "saved_topic",
  "support_signal",
] as const;
export type RegionParticipationSignalSourceType =
  (typeof REGION_PARTICIPATION_SOURCE_TYPES)[number];

export const REGION_PARTICIPATION_AGGREGATION_MODES = [
  "single_review_item",
  "aggregate_only",
  "anonymized_count",
] as const;
export type RegionParticipationAggregationMode =
  (typeof REGION_PARTICIPATION_AGGREGATION_MODES)[number];

export const REGION_PARTICIPATION_PRIVACY_MODES = [
  "no_personal_data",
  "anonymized",
  "review_restricted",
] as const;
export type RegionParticipationPrivacyMode =
  (typeof REGION_PARTICIPATION_PRIVACY_MODES)[number];

export const REGION_PARTICIPATION_REVIEW_STATUSES = [
  "draft",
  "needs_review",
  "needs_region_review",
  "accepted",
  "rejected",
  "archived",
  "revoked",
] as const;
export type RegionParticipationReviewStatus =
  (typeof REGION_PARTICIPATION_REVIEW_STATUSES)[number];

export const NEEDS_REGION_REVIEW_REGION_ID = "needs-region-review";

const RegionParticipationSignalSourceSchema = z
  .object({
    sourceKind: z.enum(["runtime", "fixture", "seed"]),
    sourceCollection: z.string().trim().min(1).nullable().default(null),
    sourceRefId: z.string().trim().min(1).nullable().default(null),
    isFixture: z.boolean(),
    isPilotFixture: z.boolean(),
    notRealNews: z.boolean(),
    notProductionData: z.boolean(),
    notOfficial: z.literal(true),
    notRepresentative: z.literal(true),
  })
  .strict();

export type RegionParticipationSignalSource = z.infer<
  typeof RegionParticipationSignalSourceSchema
>;

const RegionParticipationSignalInputSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    sourceClass: z.enum(REGION_PARTICIPATION_SOURCE_CLASSES),
    sourceType: z.enum(REGION_PARTICIPATION_SOURCE_TYPES),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    relatedClaimIds: z.array(z.string().trim().min(1)).default([]),
    relatedContributionIds: z.array(z.string().trim().min(1)).default([]),
    relatedStatementIds: z.array(z.string().trim().min(1)).default([]),
    relatedDossierIds: z.array(z.string().trim().min(1)).default([]),
    relatedAnlassraumIds: z.array(z.string().trim().min(1)).default([]),
    detectedTopics: z.array(z.string().trim().min(1)).default([]),
    detectedPlaces: z.array(z.string().trim().min(1)).default([]),
    matchedPlaces: z.array(z.string().trim().min(1)).default([]),
    matchedRegionIds: z.array(z.string().trim().min(1)).default([]),
    needsRegionReview: z.boolean().default(false),
    aggregationMode: z.enum(REGION_PARTICIPATION_AGGREGATION_MODES),
    privacyMode: z.enum(REGION_PARTICIPATION_PRIVACY_MODES),
    reviewStatus: z.enum(REGION_PARTICIPATION_REVIEW_STATUSES),
    visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES).optional(),
    confidence: z.number().min(0).max(1),
    source: RegionParticipationSignalSourceSchema,
    noAutoPublish: z.literal(true),
    noAutoCreateDossier: z.literal(true),
    noAutoCreateAnlassraum: z.literal(true),
    noPersonalProfiling: z.literal(true),
    noPoliticalScoring: z.literal(true),
    noRepresentativeClaim: z.literal(true),
    noTenderMonitoring: z.literal(true),
    noProcurementMonitoring: z.literal(true),
  })
  .strict();

const RegionParticipationSignalSchema = RegionParticipationSignalInputSchema.extend({
  visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES),
}).strict();

export type RegionParticipationSignal = z.infer<
  typeof RegionParticipationSignalSchema
>;

const RegionParticipationAggregateInputSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    label: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    signalIds: z.array(z.string().trim().min(1)).default([]),
    sourceTypes: z.array(z.enum(REGION_PARTICIPATION_SOURCE_TYPES)).default([]),
    totalSignals: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
    detectedTopics: z.array(z.string().trim().min(1)).default([]),
    aggregationMode: z.enum(REGION_PARTICIPATION_AGGREGATION_MODES),
    privacyMode: z.enum(REGION_PARTICIPATION_PRIVACY_MODES),
    reviewStatus: z.enum(REGION_PARTICIPATION_REVIEW_STATUSES),
    visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES).optional(),
    noPersonalProfiling: z.literal(true),
    noPoliticalScoring: z.literal(true),
    noRepresentativeClaim: z.literal(true),
  })
  .strict();

const RegionParticipationAggregateSchema = RegionParticipationAggregateInputSchema.extend({
  visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES),
}).strict();

export type RegionParticipationAggregate = z.infer<
  typeof RegionParticipationAggregateSchema
>;

const RegionParticipationReviewItemInputSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    sourceType: z.enum(REGION_PARTICIPATION_SOURCE_TYPES),
    reviewStatus: z.enum(REGION_PARTICIPATION_REVIEW_STATUSES),
    aggregationMode: z.enum(REGION_PARTICIPATION_AGGREGATION_MODES),
    privacyMode: z.enum(REGION_PARTICIPATION_PRIVACY_MODES),
    confidence: z.number().min(0).max(1),
    summary: z.string().trim().min(1),
    visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES).optional(),
    needsRegionReview: z.boolean(),
    noPersonalProfiling: z.literal(true),
    noPoliticalScoring: z.literal(true),
    noRepresentativeClaim: z.literal(true),
  })
  .strict();

const RegionParticipationReviewItemSchema = RegionParticipationReviewItemInputSchema.extend({
  visibilityState: z.enum(REGION_PUBLICATION_VISIBILITY_STATES),
}).strict();

export type RegionParticipationReviewItem = z.infer<
  typeof RegionParticipationReviewItemSchema
>;

function resolveAggregateVisibilityState(params: {
  reviewStatus: RegionParticipationReviewStatus;
  sourceTypes: RegionParticipationSignalSourceType[];
  privacyMode: RegionParticipationPrivacyMode;
}): RegionPublicationVisibilityState {
  if (params.reviewStatus === "accepted") {
    const lowRiskOnly = params.sourceTypes.every(
      (sourceType) =>
        sourceType === "public_question" || sourceType === "public_source_hint",
    );
    return lowRiskOnly ? "public_unverified" : "public_reviewed";
  }
  return resolveParticipationVisibilityState({
    reviewStatus: params.reviewStatus,
    sourceType: params.sourceTypes[0] ?? "public_contribution",
    privacyMode: params.privacyMode,
    needsRegionReview: params.reviewStatus === "needs_region_review",
    regionId:
      params.reviewStatus === "needs_region_review"
        ? null
        : "region-derived-aggregate",
    publicSafeTitle: "aggregate",
    publicSafeSummary: "aggregate",
  });
}

type RegionAssignment = {
  regionId: string | null;
  matchedPlaces: string[];
  matchedRegionIds: string[];
  needsRegionReview: boolean;
};

type RuntimeContributionDoc = {
  _id?: unknown;
  text?: string | null;
  content?: string | null;
  summary?: string | null;
  source?: string | null;
  reviewStatus?: string | null;
  status?: string | null;
  userContext?: {
    region?: string | null;
  } | null;
  analysis?: {
    topics?: string[] | null;
  } | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type RuntimeStatementDoc = {
  _id?: unknown;
  id?: string | null;
  title?: string | null;
  text?: string | null;
  category?: string | null;
  analysis?: {
    topics?: Array<{ name?: string | null } | string> | null;
  } | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type RuntimeSwipeAggregateDoc = {
  _id?: {
    statementId?: string | null;
  } | null;
  agreeCount?: number | null;
  neutralCount?: number | null;
  disagreeCount?: number | null;
  totalCount?: number | null;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function truncateText(value: string, max = 180) {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function parseIsoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function looksLikeQuestion(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    normalized.includes("?") ||
    /^(wer|wie|wann|warum|welche|welcher|welches|wieso|where|why|how)\b/.test(
      normalized,
    )
  );
}

function looksLikeSourceHint(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  return /quelle|quellen|beleg|belege|nachweis|nachweise|source|evidence|https?:\/\//.test(
    normalized,
  );
}

function deriveTopicsFromText(value: string): string[] {
  const haystack = String(value || "").toLowerCase();
  const topics: string[] = [];
  if (haystack.includes("schule") || haystack.includes("schul")) topics.push("Schulsanierung");
  if (haystack.includes("verkehr") || haystack.includes("schulweg"))
    topics.push("Verkehr & Schulwege");
  if (haystack.includes("bürgeramt") || haystack.includes("wartezeit"))
    topics.push("Verwaltungszugang");
  if (haystack.includes("jugend") || haystack.includes("sport") || haystack.includes("kultur"))
    topics.push("Jugend, Sport & Kultur");
  if (haystack.includes("wohnen") || haystack.includes("nachbarschaft"))
    topics.push("Wohnen & Nachbarschaft");
  if (haystack.includes("grün") || haystack.includes("sauberkeit"))
    topics.push("Grünflächen & öffentlicher Raum");
  return topics;
}

function buildRegionTokens(region: Region): string[] {
  const rawParts = [
    region.name,
    region.slug,
    region.id,
  ]
    .join(" ")
    .split(/[\s/-]+/);
  const blocked = new Set([
    "bezirk",
    "berlin",
    "kommune",
    "stadt",
    "gemeinde",
    "landkreis",
    "district",
    "municipality",
    "city",
    "county",
    "region",
  ]);
  return uniqueNonEmpty(
    rawParts
      .map((entry) => slugify(entry))
      .filter((entry) => entry.length >= 4 && !blocked.has(entry)),
  );
}

function regionMatchesExplicitHint(region: Region, explicitHint: string) {
  const normalizedHint = slugify(explicitHint);
  if (!normalizedHint) return false;
  return (
    normalizedHint === slugify(region.id) ||
    normalizedHint === slugify(region.slug) ||
    normalizedHint === slugify(region.name) ||
    buildRegionTokens(region).includes(normalizedHint)
  );
}

export function inferParticipationRegionAssignment(input: {
  text: string;
  regions: Region[];
  explicitRegionHint?: string | null;
  detectedPlaces?: string[] | null;
}): RegionAssignment {
  const explicitHint = String(input.explicitRegionHint ?? "").trim();
  if (explicitHint) {
    const directMatches = input.regions.filter((region) =>
      regionMatchesExplicitHint(region, explicitHint),
    );
    if (directMatches.length === 1) {
      return {
        regionId: directMatches[0]?.id ?? null,
        matchedPlaces: [directMatches[0]?.name ?? explicitHint].filter(Boolean),
        matchedRegionIds: directMatches.map((region) => region.id),
        needsRegionReview: false,
      };
    }
  }

  const haystack = slugify(
    [input.text, ...(input.detectedPlaces ?? [])].filter(Boolean).join(" "),
  );
  const matches = input.regions.filter((region) =>
    buildRegionTokens(region).some((token) => haystack.includes(token)),
  );

  if (matches.length === 1) {
    return {
      regionId: matches[0]?.id ?? null,
      matchedPlaces: [matches[0]?.name ?? ""].filter(Boolean),
      matchedRegionIds: matches.map((region) => region.id),
      needsRegionReview: false,
    };
  }

  return {
    regionId: null,
    matchedPlaces: uniqueNonEmpty(input.detectedPlaces ?? []),
    matchedRegionIds: matches.map((region) => region.id),
    needsRegionReview: true,
  };
}

export function parseRegionParticipationSignal(
  input: z.input<typeof RegionParticipationSignalInputSchema>,
): RegionParticipationSignal {
  const parsed = RegionParticipationSignalInputSchema.parse(input);
  return RegionParticipationSignalSchema.parse({
    ...parsed,
    visibilityState:
      parsed.visibilityState ??
      resolveParticipationVisibilityState({
        reviewStatus: parsed.reviewStatus,
        sourceType: parsed.sourceType,
        privacyMode: parsed.privacyMode,
        needsRegionReview: parsed.needsRegionReview,
        regionId: parsed.regionId,
      }),
  });
}

export function parseRegionParticipationAggregate(
  input: z.input<typeof RegionParticipationAggregateInputSchema>,
): RegionParticipationAggregate {
  const parsed = RegionParticipationAggregateInputSchema.parse(input);
  return RegionParticipationAggregateSchema.parse({
    ...parsed,
    visibilityState:
      parsed.visibilityState ??
      resolveAggregateVisibilityState({
        reviewStatus: parsed.reviewStatus,
        sourceTypes: parsed.sourceTypes,
        privacyMode: parsed.privacyMode,
      }),
  });
}

export function parseRegionParticipationReviewItem(
  input: z.input<typeof RegionParticipationReviewItemInputSchema>,
): RegionParticipationReviewItem {
  const parsed = RegionParticipationReviewItemInputSchema.parse(input);
  return RegionParticipationReviewItemSchema.parse({
    ...parsed,
    visibilityState:
      parsed.visibilityState ??
      resolveParticipationVisibilityState({
        reviewStatus: parsed.reviewStatus,
        sourceType: parsed.sourceType,
        privacyMode: parsed.privacyMode,
        needsRegionReview: parsed.needsRegionReview,
        regionId:
          parsed.reviewStatus === "needs_region_review"
            ? null
            : parsed.regionId,
      }),
  });
}

function buildFixtureSource(
  sourceCollection: string | null,
): RegionParticipationSignalSource {
  return RegionParticipationSignalSourceSchema.parse({
    sourceKind: "fixture",
    sourceCollection,
    sourceRefId: null,
    isFixture: true,
    isPilotFixture: true,
    notRealNews: true,
    notProductionData: true,
    notOfficial: true,
    notRepresentative: true,
  });
}

function buildRuntimeSource(input: {
  sourceCollection: string;
  sourceRefId: string;
}): RegionParticipationSignalSource {
  return RegionParticipationSignalSourceSchema.parse({
    sourceKind: "runtime",
    sourceCollection: input.sourceCollection,
    sourceRefId: input.sourceRefId,
    isFixture: false,
    isPilotFixture: false,
    notRealNews: false,
    notProductionData: false,
    notOfficial: true,
    notRepresentative: true,
  });
}

function shouldSkipRuntimeParticipationDatabaseLookups() {
  return shouldUseInMemoryMongoFallback();
}

function defaultReviewStatusFromContribution(
  reviewStatus: string | null | undefined,
  status: string | null | undefined,
): RegionParticipationReviewStatus {
  const normalizedReview = String(reviewStatus ?? "").trim().toLowerCase();
  const normalizedStatus = String(status ?? "").trim().toLowerCase();
  if (normalizedReview === "approved") return "accepted";
  if (normalizedReview === "rejected") return "rejected";
  if (normalizedStatus === "archived" || normalizedReview === "archived") return "archived";
  return "needs_review";
}

function deriveParticipationSourceType(
  text: string,
  fallback: Exclude<
    RegionParticipationSignalSourceType,
    "swipe_interest" | "swipe_counterpoint" | "saved_topic" | "support_signal"
  > = "public_contribution",
): RegionParticipationSignalSourceType {
  if (looksLikeQuestion(text)) return "public_question";
  if (looksLikeSourceHint(text)) return "public_source_hint";
  if (fallback === "public_claim") return "public_claim";
  return fallback;
}

function buildDraftTitleFromParticipationSourceType(
  sourceType: RegionParticipationSignalSourceType,
  summary: string,
): string {
  switch (sourceType) {
    case "public_claim":
      return `Öffentlicher Claim: ${truncateText(summary, 80)}`;
    case "public_question":
      return `Öffentliche Frage: ${truncateText(summary, 80)}`;
    case "public_source_hint":
      return `Öffentlicher Quellenhinweis: ${truncateText(summary, 80)}`;
    case "swipe_interest":
      return `Aggregiertes Interesse: ${truncateText(summary, 80)}`;
    case "swipe_counterpoint":
      return `Aggregierte Gegenposition: ${truncateText(summary, 80)}`;
    case "saved_topic":
      return `Gespeichertes Thema: ${truncateText(summary, 80)}`;
    case "support_signal":
      return `Unterstütztes Thema: ${truncateText(summary, 80)}`;
    default:
      return `Öffentlicher Beitrag: ${truncateText(summary, 80)}`;
  }
}

export const REGION_PARTICIPATION_SIGNAL_FIXTURES: RegionParticipationSignal[] = [
  parseRegionParticipationSignal({
    id: "region-participation-reinickendorf-claim-001",
    regionId: "bezirk-berlin-reinickendorf",
    sourceClass: "participation",
    sourceType: "public_claim",
    title: "Öffentlicher Claim zu Schulsanierung und Bauzustand",
    summary:
      "Pilot-Fall: mehrere öffentliche Hinweise deuten auf wiederkehrenden Klärungsbedarf zu Sanierungsstand und Bauzustand von Schulen im Bezirk hin.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Schulsanierung", "Bildung"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    needsRegionReview: false,
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "needs_review",
    confidence: 0.68,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionParticipationSignal({
    id: "region-participation-reinickendorf-question-001",
    regionId: "bezirk-berlin-reinickendorf",
    sourceClass: "participation",
    sourceType: "public_question",
    title: "Welche Zuständigkeit liegt beim Bezirk, welche beim Land Berlin?",
    summary:
      "Pilot-Fall: öffentliche Frage zur Zuständigkeit bei Schulsanierung und Bauunterhaltung im Bezirk. Review bleibt Pflicht.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Zuständigkeiten", "Schulsanierung"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    needsRegionReview: false,
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "needs_review",
    confidence: 0.66,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionParticipationSignal({
    id: "region-participation-needs-region-review-001",
    regionId: NEEDS_REGION_REVIEW_REGION_ID,
    sourceClass: "participation",
    sourceType: "public_contribution",
    title: "Öffentlicher Beitrag mit möglichem Bezug zu Schulwegen",
    summary:
      "Pilot-Fall: Der Hinweis nennt Schulwege und Verkehr, aber der konkrete Bezirksbezug muss erst bestätigt werden.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Verkehr & Schulwege"],
    detectedPlaces: ["Nordwesten Berlin"],
    matchedPlaces: ["Nordwesten Berlin"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    needsRegionReview: true,
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "needs_region_review",
    confidence: 0.31,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionParticipationSignal({
    id: "region-participation-reinickendorf-question-accepted-001",
    regionId: "bezirk-berlin-reinickendorf",
    sourceClass: "participation",
    sourceType: "public_question",
    title: "Welche Schulen in Reinickendorf sind zuerst betroffen?",
    summary:
      "Pilot-Fall: akzeptierte öffentliche Frage zur Priorisierung von Schulstandorten und Zuständigkeiten im Bezirk.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Schulsanierung", "Zuständigkeiten"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    needsRegionReview: false,
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "accepted",
    confidence: 0.74,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionParticipationSignal({
    id: "region-participation-reinickendorf-source-hint-001",
    regionId: "bezirk-berlin-reinickendorf",
    sourceClass: "participation",
    sourceType: "public_source_hint",
    title: "Community-Hinweis auf Bezirks- und Schulquellen",
    summary:
      "Pilot-Fall: öffentliche Hinweise auf Bezirksdokumente, Schulverzeichnisse und weitere Quellen, die vor einer amtlichen Einordnung geprüft werden müssen.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Quellenprüfung", "Schulsanierung"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    needsRegionReview: false,
    aggregationMode: "single_review_item",
    privacyMode: "review_restricted",
    reviewStatus: "needs_review",
    confidence: 0.62,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionParticipationSignal({
    id: "region-participation-reinickendorf-swipe-interest-001",
    regionId: "bezirk-berlin-reinickendorf",
    sourceClass: "participation",
    sourceType: "swipe_interest",
    title: "Aggregiertes Interesse zu Bürgeramt und Verwaltungszugang",
    summary:
      "Pilot-Fall: anonymisierte Swipe-Reaktionen deuten auf wiederkehrendes Interesse am Zugang zu Bürgerämtern und Wartezeiten hin. Nicht repräsentativ.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Verwaltungszugang", "Bürgerämter"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    needsRegionReview: false,
    aggregationMode: "anonymized_count",
    privacyMode: "anonymized",
    reviewStatus: "needs_review",
    confidence: 0.59,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionParticipationSignal({
    id: "region-participation-reinickendorf-counterpoint-001",
    regionId: "bezirk-berlin-reinickendorf",
    sourceClass: "participation",
    sourceType: "swipe_counterpoint",
    title: "Aggregierte Gegenpositionen zu Schulwegen und Verkehr",
    summary:
      "Pilot-Fall: anonymisierte Gegenpositionen zeigen, dass Verkehrslösungen rund um Schulwege nicht einseitig bewertet werden dürfen. Nicht repräsentativ.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Verkehr & Schulwege", "Gegenpositionen"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    needsRegionReview: false,
    aggregationMode: "anonymized_count",
    privacyMode: "anonymized",
    reviewStatus: "needs_review",
    confidence: 0.57,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionParticipationSignal({
    id: "region-participation-magdeburg-contribution-001",
    regionId: "kommune-magdeburg",
    sourceClass: "participation",
    sourceType: "public_contribution",
    title: "Öffentlicher Beitrag zu Jugend-, Sport- und Kulturangeboten",
    summary:
      "Pilot-Fall: öffentliche Beiträge aus Magdeburg verdichten Hinweise auf soziale Infrastruktur und Jugendangebote. Review bleibt Pflicht.",
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: ["Jugend, Sport & Kultur", "Soziale Infrastruktur"],
    detectedPlaces: ["Magdeburg"],
    matchedPlaces: ["Magdeburg"],
    matchedRegionIds: ["kommune-magdeburg"],
    needsRegionReview: false,
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "needs_review",
    confidence: 0.63,
    source: buildFixtureSource("participation_fixtures"),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
];

export function getRegionParticipationSignalById(
  id: string,
): RegionParticipationSignal | null {
  const match = REGION_PARTICIPATION_SIGNAL_FIXTURES.find((signal) => signal.id === id);
  return match ? clone(match) : null;
}

function mapContributionDocToParticipationSignal(
  doc: RuntimeContributionDoc,
  regions: Region[],
): RegionParticipationSignal {
  const text = truncateText(doc.summary ?? doc.text ?? doc.content ?? "", 220);
  const sourceType = deriveParticipationSourceType(text, "public_contribution");
  const topicHints = uniqueNonEmpty([
    ...(Array.isArray(doc.analysis?.topics) ? doc.analysis?.topics ?? [] : []),
    ...deriveTopicsFromText(text),
  ]);
  const assignment = inferParticipationRegionAssignment({
    text,
    regions,
    explicitRegionHint: doc.userContext?.region ?? null,
  });
  const regionId = assignment.regionId ?? NEEDS_REGION_REVIEW_REGION_ID;
  const sourceRefId = String(doc._id ?? "").trim() || stableRuntimeRef("contribution", text);

  return parseRegionParticipationSignal({
    id: `region-participation-runtime-contribution-${sourceRefId}`,
    regionId,
    sourceClass: "participation",
    sourceType,
    title: buildDraftTitleFromParticipationSourceType(sourceType, text),
    summary: text,
    relatedClaimIds: [],
    relatedContributionIds: [sourceRefId],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: topicHints,
    detectedPlaces: assignment.matchedPlaces,
    matchedPlaces: assignment.matchedPlaces,
    matchedRegionIds: assignment.matchedRegionIds,
    needsRegionReview: assignment.needsRegionReview,
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: defaultReviewStatusFromContribution(doc.reviewStatus, doc.status),
    confidence: assignment.regionId ? 0.63 : 0.24,
    source: buildRuntimeSource({
      sourceCollection: "contributions",
      sourceRefId,
    }),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  });
}

function extractStatementTopics(
  topics: RuntimeStatementDoc["analysis"] extends { topics?: infer T } ? T : never,
): string[] {
  if (!Array.isArray(topics)) return [];
  return uniqueNonEmpty(
    topics.map((entry) =>
      typeof entry === "string" ? entry : String(entry?.name ?? "").trim(),
    ),
  );
}

function stableRuntimeRef(prefix: string, text: string) {
  return slugify(`${prefix}-${text}`).slice(0, 48) || `${prefix}-runtime`;
}

function mapStatementDocToParticipationSignal(
  doc: RuntimeStatementDoc,
  regions: Region[],
): RegionParticipationSignal {
  const title = String(doc.title ?? "").trim() || "Öffentlicher Hinweis";
  const body = truncateText(doc.text ?? title, 220);
  const summary = body || title;
  const sourceType = deriveParticipationSourceType(
    `${title} ${body}`,
    looksLikeQuestion(title) ? "public_question" : "public_claim",
  );
  const topicHints = uniqueNonEmpty([
    ...extractStatementTopics(doc.analysis?.topics),
    String(doc.category ?? "").trim(),
    ...deriveTopicsFromText(`${title} ${body}`),
  ]);
  const assignment = inferParticipationRegionAssignment({
    text: `${title} ${body} ${topicHints.join(" ")}`,
    regions,
  });
  const sourceRefId =
    String(doc.id ?? "").trim() ||
    String(doc._id ?? "").trim() ||
    stableRuntimeRef("statement", title);

  return parseRegionParticipationSignal({
    id: `region-participation-runtime-statement-${sourceRefId}`,
    regionId: assignment.regionId ?? NEEDS_REGION_REVIEW_REGION_ID,
    sourceClass: "participation",
    sourceType,
    title: title || buildDraftTitleFromParticipationSourceType(sourceType, summary),
    summary,
    relatedClaimIds: sourceType === "public_claim" ? [sourceRefId] : [],
    relatedContributionIds: [],
    relatedStatementIds: [sourceRefId],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: topicHints,
    detectedPlaces: assignment.matchedPlaces,
    matchedPlaces: assignment.matchedPlaces,
    matchedRegionIds: assignment.matchedRegionIds,
    needsRegionReview: assignment.needsRegionReview,
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "needs_review",
    confidence: assignment.regionId ? 0.6 : 0.22,
    source: buildRuntimeSource({
      sourceCollection: "statements",
      sourceRefId,
    }),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  });
}

function buildSwipeParticipationSignal(params: {
  statementId: string;
  title: string;
  summary: string;
  regionId: string;
  matchedPlaces: string[];
  matchedRegionIds: string[];
  topicHints: string[];
  totalCount: number;
  disagreeCount: number;
  sourceType: "swipe_interest" | "swipe_counterpoint";
}): RegionParticipationSignal {
  return parseRegionParticipationSignal({
    id: `region-participation-runtime-${params.sourceType}-${params.statementId}`,
    regionId: params.regionId,
    sourceClass: "participation",
    sourceType: params.sourceType,
    title:
      params.sourceType === "swipe_interest"
        ? `Aggregiertes Interesse zu ${truncateText(params.title, 80)}`
        : `Aggregierte Gegenpositionen zu ${truncateText(params.title, 80)}`,
    summary: params.summary,
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [params.statementId],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    detectedTopics: params.topicHints,
    detectedPlaces: params.matchedPlaces,
    matchedPlaces: params.matchedPlaces,
    matchedRegionIds: params.matchedRegionIds,
    needsRegionReview: false,
    aggregationMode: "anonymized_count",
    privacyMode: "anonymized",
    reviewStatus: "needs_review",
    confidence:
      params.sourceType === "swipe_interest"
        ? Math.min(0.79, 0.45 + params.totalCount / 100)
        : Math.min(0.74, 0.42 + params.disagreeCount / 80),
    source: buildRuntimeSource({
      sourceCollection: "swipe_votes",
      sourceRefId: params.statementId,
    }),
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  });
}

async function loadRuntimeContributionSignals(
  regions: Region[],
): Promise<RegionParticipationSignal[]> {
  if (shouldSkipRuntimeParticipationDatabaseLookups()) return [];
  try {
    const contributions = await coreCol<RuntimeContributionDoc>("contributions");
    const docs = await contributions
      .find(
        {},
        {
          projection: {
            text: 1,
            content: 1,
            summary: 1,
            source: 1,
            reviewStatus: 1,
            status: 1,
            "userContext.region": 1,
            "analysis.topics": 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(40)
      .toArray();
    return docs.map((doc) => mapContributionDocToParticipationSignal(doc, regions));
  } catch {
    return [];
  }
}

async function loadRuntimeStatementSignals(
  regions: Region[],
): Promise<RegionParticipationSignal[]> {
  if (shouldSkipRuntimeParticipationDatabaseLookups()) return [];
  try {
    const statements = await coreCol<RuntimeStatementDoc>("statements");
    const docs = await statements
      .find(
        {},
        {
          projection: {
            id: 1,
            title: 1,
            text: 1,
            category: 1,
            "analysis.topics": 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(40)
      .toArray();
    return docs.map((doc) => mapStatementDocToParticipationSignal(doc, regions));
  } catch {
    return [];
  }
}

async function loadRuntimeSwipeSignals(
  regions: Region[],
): Promise<RegionParticipationSignal[]> {
  if (shouldSkipRuntimeParticipationDatabaseLookups()) return [];
  try {
    const votes = await coreCol("swipe_votes");
    const rows = (await votes
      .aggregate<RuntimeSwipeAggregateDoc>([
        {
          $group: {
            _id: { statementId: "$statementId" },
            agreeCount: {
              $sum: { $cond: [{ $eq: ["$decision", "agree"] }, 1, 0] },
            },
            neutralCount: {
              $sum: { $cond: [{ $eq: ["$decision", "neutral"] }, 1, 0] },
            },
            disagreeCount: {
              $sum: { $cond: [{ $eq: ["$decision", "disagree"] }, 1, 0] },
            },
            totalCount: { $sum: 1 },
          },
        },
        { $sort: { totalCount: -1 } },
        { $limit: 20 },
      ])
      .toArray()) as RuntimeSwipeAggregateDoc[];

    const statementIds = uniqueNonEmpty(
      rows.map((row) => String(row?._id?.statementId ?? "").trim()),
    );
    if (statementIds.length === 0) return [];

    const statements = await coreCol<RuntimeStatementDoc>("statements");
    const statementDocs = await statements
      .find(
        {
          $or: [
            { _id: { $in: statementIds } as any },
            { id: { $in: statementIds } },
          ],
        },
        {
          projection: {
            _id: 1,
            id: 1,
            title: 1,
            text: 1,
            category: 1,
            "analysis.topics": 1,
          },
        },
      )
      .toArray();
    const statementMap = new Map(
      statementDocs.flatMap((doc) => {
        const keys = uniqueNonEmpty([
          String(doc.id ?? "").trim(),
          String(doc._id ?? "").trim(),
        ]);
        return keys.map((key) => [key, doc] as const);
      }),
    );

    const signals: RegionParticipationSignal[] = [];
    for (const row of rows) {
      const statementId = String(row?._id?.statementId ?? "").trim();
      if (!statementId) continue;
      const statement = statementMap.get(statementId);
      if (!statement) continue;
      const title = String(statement.title ?? "").trim() || "Öffentliche Reaktion";
      const body = truncateText(statement.text ?? title, 180);
      const topicHints = uniqueNonEmpty([
        ...extractStatementTopics(statement.analysis?.topics),
        String(statement.category ?? "").trim(),
        ...deriveTopicsFromText(`${title} ${body}`),
      ]);
      const assignment = inferParticipationRegionAssignment({
        text: `${title} ${body} ${topicHints.join(" ")}`,
        regions,
      });
      if (!assignment.regionId) continue;

      const totalCount = Number(row.totalCount ?? 0);
      const disagreeCount = Number(row.disagreeCount ?? 0);
      const neutralCount = Number(row.neutralCount ?? 0);
      const agreeCount = Number(row.agreeCount ?? 0);

      signals.push(
        buildSwipeParticipationSignal({
          statementId,
          title,
          summary: `${totalCount} eingegangene Swipe-Reaktionen zu diesem Thema, anonymisiert und nicht repräsentativ.`,
          regionId: assignment.regionId,
          matchedPlaces: assignment.matchedPlaces,
          matchedRegionIds: assignment.matchedRegionIds,
          topicHints,
          totalCount,
          disagreeCount,
          sourceType: "swipe_interest",
        }),
      );

      if (disagreeCount > 0 || neutralCount > 0) {
        signals.push(
          buildSwipeParticipationSignal({
            statementId,
            title,
            summary: `${disagreeCount + neutralCount} anonymisierte Gegenpositionen oder Zurückhaltungen zu diesem Thema. Keine Einzelprofile, nicht repräsentativ.`,
            regionId: assignment.regionId,
            matchedPlaces: assignment.matchedPlaces,
            matchedRegionIds: assignment.matchedRegionIds,
            topicHints,
            totalCount: disagreeCount + neutralCount,
            disagreeCount,
            sourceType: "swipe_counterpoint",
          }),
        );
      }

      if (agreeCount > 2) {
        signals.push(
          parseRegionParticipationSignal({
            id: `region-participation-runtime-support-${statementId}`,
            regionId: assignment.regionId,
            sourceClass: "participation",
            sourceType: "support_signal",
            title: `Unterstütztes Thema: ${truncateText(title, 80)}`,
            summary: `${agreeCount} anonymisierte Zustimmungsreaktionen verdichten das Thema als reviewpflichtigen Hinweis. Nicht amtlich, nicht repräsentativ.`,
            relatedClaimIds: [],
            relatedContributionIds: [],
            relatedStatementIds: [statementId],
            relatedDossierIds: [],
            relatedAnlassraumIds: [],
            detectedTopics: topicHints,
            detectedPlaces: assignment.matchedPlaces,
            matchedPlaces: assignment.matchedPlaces,
            matchedRegionIds: assignment.matchedRegionIds,
            needsRegionReview: false,
            aggregationMode: "aggregate_only",
            privacyMode: "anonymized",
            reviewStatus: "needs_review",
            confidence: Math.min(0.72, 0.4 + agreeCount / 40),
            source: buildRuntimeSource({
              sourceCollection: "swipe_votes",
              sourceRefId: statementId,
            }),
            noAutoPublish: true,
            noAutoCreateDossier: true,
            noAutoCreateAnlassraum: true,
            noPersonalProfiling: true,
            noPoliticalScoring: true,
            noRepresentativeClaim: true,
            noTenderMonitoring: true,
            noProcurementMonitoring: true,
          }),
        );
      }
    }

    return signals;
  } catch {
    return [];
  }
}

export async function listDerivedRegionParticipationSignals(
  regions: Region[],
): Promise<RegionParticipationSignal[]> {
  const [runtimeContributions, runtimeStatements, runtimeSwipes] =
    await Promise.all([
      loadRuntimeContributionSignals(regions),
      loadRuntimeStatementSignals(regions),
      loadRuntimeSwipeSignals(regions),
    ]);

  const merged = new Map<string, RegionParticipationSignal>();
  for (const signal of [
    ...REGION_PARTICIPATION_SIGNAL_FIXTURES,
    ...runtimeContributions,
    ...runtimeStatements,
    ...runtimeSwipes,
  ]) {
    merged.set(signal.id, clone(signal));
  }
  return Array.from(merged.values()).sort((left, right) => {
    if (left.source.sourceKind !== right.source.sourceKind) {
      return left.source.sourceKind === "runtime" ? -1 : 1;
    }
    return right.confidence - left.confidence;
  });
}

export function mapParticipationSignalToFeedSignalForDraft(
  signal: RegionParticipationSignal,
): RegionFeedSignal {
  const defaultAction =
    signal.sourceType === "public_source_hint"
      ? "attach_source_to_dossier"
      : signal.sourceType === "public_question"
        ? "ask_clarifying_question"
        : signal.sourceType === "swipe_counterpoint"
          ? "create_anlassraum"
          : "create_dossier";
  const topicLabel = signal.detectedTopics[0] ?? "Öffentliche Hinweise";
  const provenance =
    signal.source.sourceKind === "fixture"
      ? {
          dataOrigin: "pilot_fixture" as const,
          isFixture: true,
          fixtureMarker: "pilot_fixture_only" as const,
        }
      : {
          dataOrigin: "runtime_review_queue" as const,
          isFixture: false,
          fixtureMarker: "runtime_review_queue" as const,
        };

  return parseRegionFeedSignal({
    id: signal.id,
    kind: "region_feed_signal",
    regionId: signal.regionId,
    sourceId: signal.source.sourceRefId ?? signal.id,
    sourceType: "community_signal",
    title: signal.title,
    summary: signal.summary,
    url: null,
    publishedAt: null,
    detectedTopics: signal.detectedTopics,
    detectedPlaces: signal.detectedPlaces,
    relatedClaims: signal.relatedClaimIds,
    relatedDossiers: signal.relatedDossierIds,
    relatedAnlassraumIds: signal.relatedAnlassraumIds,
    suggestedAction: defaultAction,
    confidence: signal.confidence,
    reviewStatus: signal.reviewStatus,
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    provenance,
    clusterKey: slugify(topicLabel),
    openQuestions:
      signal.sourceType === "public_question" ? [signal.title] : [],
    reviewHint:
      "Öffentliches Beteiligungssignal bleibt nicht amtlich, nicht repräsentativ und reviewpflichtig.",
    suggestedAnlassraumTitle:
      signal.sourceType === "swipe_counterpoint" ? topicLabel : null,
    suggestedDossierTitle:
      signal.sourceType === "public_source_hint" || signal.sourceType === "public_claim"
        ? topicLabel
        : null,
  });
}
