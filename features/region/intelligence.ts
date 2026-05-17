import type { CommunitySignal, Region } from "./contracts";
import {
  parseRegionFeedSignal,
  type RegionFeedSignal,
  type RegionFeedSourceType,
  type RegionSignalProvenance,
  type RegionSignalReviewState,
  type RegionSignalSuggestedAction,
} from "./regionFeedSignals";

export type RegionIntelligenceOrganizationContext = {
  primaryOrganizationId: string | null;
  organizationIds: string[];
  actorRole: string;
  entitlementStatus: string | null;
  verificationStatus: string | null;
  regionalActorLabels: string[];
};

export type RegionIntelligenceOrientation = {
  audience: "verwaltung_organisation" | "regional_organization" | "neutral";
  goal: string;
  focusTopics: string[];
  expectedOutputs: Array<"topic_clusters" | "dossier_suggestions" | "anlassraum_suggestions" | "open_questions">;
};

export type RegionIntelligenceFeedSignalSource = {
  kind: "feed_signal";
  signal: RegionFeedSignal;
};

export type RegionIntelligenceCommunitySignalSource = {
  kind: "community_signal";
  signal: CommunitySignal;
  regionName: string;
  activeAnlassraumIds: string[];
  defaultAnlassraumTitle: string | null;
};

export type RegionIntelligenceSource =
  | RegionIntelligenceFeedSignalSource
  | RegionIntelligenceCommunitySignalSource;

export type RegionIntelligencePreparationInput = {
  region: Region;
  organization: RegionIntelligenceOrganizationContext;
  orientation: RegionIntelligenceOrientation;
  sources: RegionIntelligenceSource[];
};

export type RegionIntelligenceSignalSeed = {
  id: string;
  regionId: string;
  sourceId: string;
  sourceType: RegionFeedSourceType;
  title: string;
  summary: string;
  url: string | null;
  publishedAt: string | null;
  detectedTopics: string[];
  detectedPlaces: string[];
  relatedClaims: string[];
  relatedDossiers: string[];
  relatedAnlassraumIds: string[];
  suggestedAction: RegionSignalSuggestedAction;
  confidence: number;
  reviewStatus: RegionSignalReviewState;
  clusterKey: string | null;
  openQuestions: string[];
  reviewHint: string | null;
  suggestedAnlassraumTitle: string | null;
  suggestedDossierTitle: string | null;
  provenance: RegionSignalProvenance;
};

export type RegionIntelligenceClusterHint = {
  clusterKey: string;
  label: string;
  signalSeedIds: string[];
  openQuestions: string[];
  confidence: number;
  suggestedAction: RegionSignalSuggestedAction;
  reviewStatus: RegionSignalReviewState;
};

export type RegionIntelligenceSuggestionHint = {
  title: string;
  signalSeedIds: string[];
  openQuestions: string[];
  confidence: number;
  reviewStatus: RegionSignalReviewState;
};

export type RegionIntelligencePreparationResult = {
  adapterId: "deterministic_fixture";
  mode: "deterministic_fixture";
  generatedAt: string;
  prompt: string;
  sourceCount: number;
  signalSeeds: RegionIntelligenceSignalSeed[];
  topicClusterHints: RegionIntelligenceClusterHint[];
  dossierSuggestionHints: RegionIntelligenceSuggestionHint[];
  anlassraumSuggestionHints: RegionIntelligenceSuggestionHint[];
  openQuestions: string[];
  reviewRequired: true;
  noAutoPublish: true;
  noAutoCreateDossier: true;
  noAutoCreateAnlassraum: true;
  noOfficialRating: true;
  noDeepSearchAutoCosts: true;
  noTenderMonitoring: true;
  noProcurementMonitoring: true;
};

export type RegionIntelligenceAdapter = {
  id: "deterministic_fixture";
  prepare(input: RegionIntelligencePreparationInput & { prompt: string }): Promise<RegionIntelligencePreparationResult>;
};

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function slugify(value: string): string {
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

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mapCommunitySignalReviewStatus(status: CommunitySignal["reviewStatus"]): RegionSignalReviewState {
  if (status === "accepted") return "accepted";
  if (status === "rejected") return "rejected";
  return "needs_review";
}

function inferTopicsFromCommunitySignal(signal: CommunitySignal): string[] {
  const haystack = `${signal.title} ${signal.summary}`.toLowerCase();
  const topics: string[] = [];
  if (haystack.includes("schule") || haystack.includes("schul")) topics.push("Schulwege");
  if (haystack.includes("verkehr")) topics.push("Verkehr");
  if (haystack.includes("jugend")) topics.push("Jugend");
  if (haystack.includes("sport")) topics.push("Sport");
  if (haystack.includes("kiez") || haystack.includes("nachbarschaft")) topics.push("Nachbarschaft");
  if (topics.length === 0) topics.push("Lokale Hinweise");
  return uniqueNonEmpty(topics);
}

function inferClusterKey(signal: CommunitySignal, regionName: string): string {
  const haystack = `${signal.title} ${signal.summary}`.toLowerCase();
  if (haystack.includes("schule") || haystack.includes("schul")) return "bildung-schulinfrastruktur";
  if (haystack.includes("verkehr")) return "verkehr-schulwege";
  if (haystack.includes("jugend") || haystack.includes("sport") || haystack.includes("kultur")) {
    return slugify(`${regionName}-jugend-sport-kultur`);
  }
  if (haystack.includes("kiez") || haystack.includes("nachbarschaft")) return "soziale-infrastruktur";
  return slugify(`${regionName}-community-signal`);
}

function inferSuggestedAction(
  signal: CommunitySignal,
  hasExistingAnlassraum: boolean,
): RegionSignalSuggestedAction {
  if (signal.signalType === "source") return "attach_source_to_dossier";
  if (signal.signalType === "topic_proposal") return "create_anlassraum";
  if (signal.signalType === "local_knowledge") return "ask_clarifying_question";
  return hasExistingAnlassraum ? "attach_to_anlassraum" : "create_anlassraum";
}

function sourceLabel(source: RegionIntelligenceSource): string {
  if (source.kind === "feed_signal") return `Feed-Signal: ${source.signal.title}`;
  return `Community-Signal: ${source.signal.title}`;
}

function sourceTopics(source: RegionIntelligenceSource): string[] {
  if (source.kind === "feed_signal") return source.signal.detectedTopics;
  return inferTopicsFromCommunitySignal(source.signal);
}

function sourceToSeed(source: RegionIntelligenceSource): RegionIntelligenceSignalSeed {
  if (source.kind === "feed_signal") {
    const signal = source.signal;
    return {
      id: signal.id,
      regionId: signal.regionId,
      sourceId: signal.sourceId,
      sourceType: signal.sourceType,
      title: signal.title,
      summary: signal.summary,
      url: signal.url ?? null,
      publishedAt: signal.publishedAt ?? null,
      detectedTopics: [...signal.detectedTopics],
      detectedPlaces: [...signal.detectedPlaces],
      relatedClaims: [...signal.relatedClaims],
      relatedDossiers: [...signal.relatedDossiers],
      relatedAnlassraumIds: [...signal.relatedAnlassraumIds],
      suggestedAction: signal.suggestedAction,
      confidence: signal.confidence,
      reviewStatus: signal.reviewStatus,
      clusterKey: signal.clusterKey ?? null,
      openQuestions: [...signal.openQuestions],
      reviewHint: signal.reviewHint ?? null,
      suggestedAnlassraumTitle: signal.suggestedAnlassraumTitle ?? null,
      suggestedDossierTitle: signal.suggestedDossierTitle ?? null,
      provenance: signal.provenance,
    };
  }

  const signal = source.signal;
  const hasExistingAnlassraum = source.activeAnlassraumIds.length > 0;
  return {
    id: `region-feed-runtime-${signal.id}`,
    regionId: signal.regionId,
    sourceId: signal.id,
    sourceType: "community_signal",
    title: signal.title,
    summary: signal.summary,
    url: signal.sourceUrls[0] ?? null,
    publishedAt: signal.createdAt ?? null,
    detectedTopics: inferTopicsFromCommunitySignal(signal),
    detectedPlaces: [source.regionName],
    relatedClaims: [],
    relatedDossiers: [],
    relatedAnlassraumIds: [...source.activeAnlassraumIds],
    suggestedAction: inferSuggestedAction(signal, hasExistingAnlassraum),
    confidence: signal.reviewStatus === "accepted" ? 0.73 : 0.61,
    reviewStatus: mapCommunitySignalReviewStatus(signal.reviewStatus),
    clusterKey: inferClusterKey(signal, source.regionName),
    openQuestions: [],
    reviewHint:
      signal.reviewStatus === "submitted"
        ? "Signal bleibt reviewpflichtig und erzeugt keine automatische Struktur."
        : "Weiterer redaktioneller Review bleibt erforderlich.",
    suggestedAnlassraumTitle: hasExistingAnlassraum ? source.defaultAnlassraumTitle : null,
    suggestedDossierTitle: signal.signalType === "source" ? "Quellenpruefung im bestehenden Dossier" : null,
    provenance: {
      dataOrigin: "runtime_review_queue",
      isFixture: false,
      fixtureMarker: "runtime_review_queue",
    },
  };
}

function buildTopicClusterHints(seeds: RegionIntelligenceSignalSeed[]): RegionIntelligenceClusterHint[] {
  const buckets = new Map<string, RegionIntelligenceSignalSeed[]>();
  for (const seed of seeds) {
    const key = seed.clusterKey ?? slugify(seed.detectedTopics[0] ?? seed.title);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)?.push(seed);
  }

  return Array.from(buckets.entries()).map(([clusterKey, bucket]) => ({
    clusterKey,
    label: bucket[0]?.suggestedAnlassraumTitle ?? bucket[0]?.detectedTopics[0] ?? bucket[0]?.title ?? clusterKey,
    signalSeedIds: uniqueNonEmpty(bucket.map((seed) => seed.id)),
    openQuestions: uniqueNonEmpty(bucket.flatMap((seed) => seed.openQuestions)),
    confidence: Number(average(bucket.map((seed) => seed.confidence)).toFixed(2)),
    suggestedAction: bucket.some((seed) => seed.suggestedAction === "create_dossier")
      ? "create_dossier"
      : bucket[0]?.suggestedAction ?? "ask_clarifying_question",
    reviewStatus: bucket.every((seed) => seed.reviewStatus === "accepted") ? "accepted" : "needs_review",
  }));
}

function buildSuggestionHints(
  seeds: RegionIntelligenceSignalSeed[],
  keySelector: (seed: RegionIntelligenceSignalSeed) => string | null,
): RegionIntelligenceSuggestionHint[] {
  const buckets = new Map<string, RegionIntelligenceSignalSeed[]>();
  for (const seed of seeds) {
    const key = keySelector(seed);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)?.push(seed);
  }

  return Array.from(buckets.entries()).map(([title, bucket]) => ({
    title,
    signalSeedIds: uniqueNonEmpty(bucket.map((seed) => seed.id)),
    openQuestions: uniqueNonEmpty(bucket.flatMap((seed) => seed.openQuestions)),
    confidence: Number(average(bucket.map((seed) => seed.confidence)).toFixed(2)),
    reviewStatus: bucket.every((seed) => seed.reviewStatus === "accepted") ? "accepted" : "needs_review",
  }));
}

export function buildRegionIntelligencePrompt(input: RegionIntelligencePreparationInput): string {
  const focusTopics = input.orientation.focusTopics.length > 0 ? input.orientation.focusTopics.join(", ") : "keine vorgegebenen Fokus-Themen";
  const outputs = input.orientation.expectedOutputs.join(", ");
  const sourceLines = input.sources
    .map((source, index) => {
      const topics = sourceTopics(source);
      const topicSuffix = topics.length > 0 ? ` | Themen: ${topics.join(", ")}` : "";
      return `${index + 1}. ${sourceLabel(source)}${topicSuffix}`;
    })
    .join("\n");

  return [
    "Erstelle eine reviewpflichtige regionale Startlage fuer eDebatte.",
    `Region: ${input.region.name} (${input.region.type})`,
    `Organisation/Rolle: ${input.organization.actorRole}`,
    `Organisationen: ${input.organization.organizationIds.join(", ") || "keine hinterlegt"}`,
    `Freischaltung: ${input.organization.entitlementStatus ?? "unbekannt"}`,
    `Verifikation: ${input.organization.verificationStatus ?? "unbekannt"}`,
    `Ausrichtung: ${input.orientation.goal}`,
    `Publikum: ${input.orientation.audience}`,
    `Fokusthemen: ${focusTopics}`,
    `Erwartete Outputs: ${outputs}`,
    "Guardrails: keine Live-Crawler-Behauptung, kein Scraping, keine DeepSearch-Automatikkosten, kein GeoReferenceLayer, kein Payment, kein Publishing, keine automatische Dossier-/Anlassraum-Erstellung, keine automatische amtliche Bewertung, keine Ausschreibungs-/Vergabelogik.",
    "Alle Vorschlaege bleiben reviewpflichtig und duerfen keine amtliche Wahrheit oder automatische Freigabe behaupten.",
    "Quellenuebersicht:",
    sourceLines || "- keine Quellen",
  ].join("\n");
}

const deterministicFixtureAdapter: RegionIntelligenceAdapter = {
  id: "deterministic_fixture",
  async prepare(input) {
    const signalSeeds = input.sources
      .map((source) => sourceToSeed(source))
      .sort((left, right) => right.confidence - left.confidence);

    return {
      adapterId: "deterministic_fixture",
      mode: "deterministic_fixture",
      generatedAt: new Date().toISOString(),
      prompt: input.prompt,
      sourceCount: input.sources.length,
      signalSeeds,
      topicClusterHints: buildTopicClusterHints(signalSeeds),
      dossierSuggestionHints: buildSuggestionHints(signalSeeds, (seed) => seed.suggestedDossierTitle),
      anlassraumSuggestionHints: buildSuggestionHints(signalSeeds, (seed) => seed.suggestedAnlassraumTitle),
      openQuestions: uniqueNonEmpty(signalSeeds.flatMap((seed) => seed.openQuestions)),
      reviewRequired: true,
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
      noOfficialRating: true,
      noDeepSearchAutoCosts: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
    };
  },
};

export async function runRegionIntelligencePreparation(
  input: RegionIntelligencePreparationInput,
  adapter: RegionIntelligenceAdapter = deterministicFixtureAdapter,
): Promise<RegionIntelligencePreparationResult> {
  const prompt = buildRegionIntelligencePrompt(input);
  return adapter.prepare({
    ...input,
    prompt,
  });
}

export function mapRegionIntelligenceToSignals(
  preparation: RegionIntelligencePreparationResult,
): RegionFeedSignal[] {
  return preparation.signalSeeds.map((seed) =>
    parseRegionFeedSignal({
      id: seed.id,
      kind: "region_feed_signal",
      regionId: seed.regionId,
      sourceId: seed.sourceId,
      sourceType: seed.sourceType,
      title: seed.title,
      summary: seed.summary,
      url: seed.url,
      publishedAt: seed.publishedAt,
      detectedTopics: seed.detectedTopics,
      detectedPlaces: seed.detectedPlaces,
      relatedClaims: seed.relatedClaims,
      relatedDossiers: seed.relatedDossiers,
      relatedAnlassraumIds: seed.relatedAnlassraumIds,
      suggestedAction: seed.suggestedAction,
      confidence: seed.confidence,
      reviewStatus: seed.reviewStatus,
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
      provenance: seed.provenance,
      clusterKey: seed.clusterKey,
      openQuestions: seed.openQuestions,
      reviewHint: seed.reviewHint,
      suggestedAnlassraumTitle: seed.suggestedAnlassraumTitle,
      suggestedDossierTitle: seed.suggestedDossierTitle,
    }),
  );
}
