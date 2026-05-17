import type { CommunitySignal, Region } from "./contracts";
import {
  parseRegionFeedSignal,
  type RegionFeedSignal,
  type RegionFeedSourceType,
  type RegionSignalProvenance,
  type RegionSignalReviewState,
  type RegionSignalSuggestedAction,
} from "./regionFeedSignals";

export const REGION_INTELLIGENCE_SOURCE_CATEGORIES = [
  "productive",
  "curated",
  "manual",
] as const;

export type RegionIntelligenceSourceCategory =
  (typeof REGION_INTELLIGENCE_SOURCE_CATEGORIES)[number];

export const REGION_INTELLIGENCE_SOURCE_STATUSES = [
  "connected",
  "configured",
  "missing",
] as const;

export type RegionIntelligenceSourceStatus =
  (typeof REGION_INTELLIGENCE_SOURCE_STATUSES)[number];

export const REGION_INTELLIGENCE_SOURCE_ADAPTER_IDS = [
  "productive_regional_source",
  "curated_starting_point",
  "manual_review_queue",
] as const;

export type RegionIntelligenceSourceAdapterId =
  (typeof REGION_INTELLIGENCE_SOURCE_ADAPTER_IDS)[number];

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
  expectedOutputs: Array<
    "topic_clusters" | "dossier_suggestions" | "anlassraum_suggestions" | "open_questions"
  >;
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

export type RegionIntelligenceSourceAdapterOverride = {
  adapterId: RegionIntelligenceSourceAdapterId;
  label?: string;
  description?: string;
  status?: RegionIntelligenceSourceStatus;
  connected?: boolean;
  weight?: number;
};

export type RegionIntelligenceSourceAdapterContract = {
  adapterId: RegionIntelligenceSourceAdapterId;
  label: string;
  category: RegionIntelligenceSourceCategory;
  status: RegionIntelligenceSourceStatus;
  connected: boolean;
  description: string;
  weight: number;
  allowedSourceKinds: Array<RegionIntelligenceSource["kind"]>;
  matchedSourceCount: number;
  matchedSourceLabels: string[];
  reviewOnly: true;
  noLiveCrawlerClaim: true;
  noScraping: true;
  noDeepSearchAutoCosts: true;
};

export type RegionIntelligenceSourceStatusSummary = {
  productiveSourceCount: number;
  curatedSourceCount: number;
  manualSourceCount: number;
  productiveConnectedCount: number;
  curatedConnectedCount: number;
  manualConnectedCount: number;
  productiveConfiguredCount: number;
  curatedConfiguredCount: number;
  manualConfiguredCount: number;
  productiveMissingCount: number;
  productiveLabel: string;
  curatedLabel: string;
  manualLabel: string;
  overallLabel: string;
};

export type RegionIntelligenceWeightingSummary = {
  productiveWeight: number;
  curatedWeight: number;
  manualWeight: number;
  label: string;
  adapterWeights: Array<{
    adapterId: RegionIntelligenceSourceAdapterId;
    label: string;
    category: RegionIntelligenceSourceCategory;
    weight: number;
  }>;
};

export type RegionIntelligencePreparationInput = {
  region: Region;
  organization: RegionIntelligenceOrganizationContext;
  orientation: RegionIntelligenceOrientation;
  sources: RegionIntelligenceSource[];
  sourceAdapters?: RegionIntelligenceSourceAdapterOverride[];
};

export type RegionIntelligenceSignalSeed = {
  id: string;
  regionId: string;
  sourceId: string;
  sourceType: RegionFeedSourceType;
  sourceAdapterId: RegionIntelligenceSourceAdapterId;
  sourceCategory: RegionIntelligenceSourceCategory;
  sourceLabel: string;
  sourceWeight: number;
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

export type RegionIntelligenceReviewSuggestion = {
  id: string;
  suggestionType: "topic_cluster" | "dossier_suggestion" | "anlassraum_suggestion";
  title: string;
  summary: string;
  signalSeedIds: string[];
  confidence: number;
  reviewStatus: RegionSignalReviewState;
  visibilityState: "internal_review";
  sourceCategories: RegionIntelligenceSourceCategory[];
  sourceLabels: string[];
  sourceStatusLabel: string;
};

export type RegionIntelligencePreparationResult = {
  adapterId: "deterministic_fixture";
  mode: "deterministic_fixture";
  generatedAt: string;
  prompt: string;
  sourceCount: number;
  configuredSources: RegionIntelligenceSourceAdapterContract[];
  sourceStatusSummary: RegionIntelligenceSourceStatusSummary;
  weightingSummary: RegionIntelligenceWeightingSummary;
  signalSeeds: RegionIntelligenceSignalSeed[];
  topicClusterHints: RegionIntelligenceClusterHint[];
  dossierSuggestionHints: RegionIntelligenceSuggestionHint[];
  anlassraumSuggestionHints: RegionIntelligenceSuggestionHint[];
  reviewSuggestions: RegionIntelligenceReviewSuggestion[];
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
  prepare(
    input: RegionIntelligencePreparationInput & { prompt: string },
  ): Promise<RegionIntelligencePreparationResult>;
};

const DEFAULT_SOURCE_ADAPTERS: ReadonlyArray<
  Omit<
    RegionIntelligenceSourceAdapterContract,
    "matchedSourceCount" | "matchedSourceLabels" | "connected" | "status"
  > & {
    defaultStatus: RegionIntelligenceSourceStatus;
    defaultConnected: boolean;
  }
> = [
  {
    adapterId: "productive_regional_source",
    label: "Produktive regionale Quelle",
    category: "productive",
    defaultStatus: "missing",
    defaultConnected: false,
    description:
      "Vorbereitet für echte regionale Quellenadapter. Solange keine produktive Quelle verbunden ist, bleibt dieser Pfad bewusst leer.",
    weight: 1,
    allowedSourceKinds: ["feed_signal"],
    reviewOnly: true,
    noLiveCrawlerClaim: true,
    noScraping: true,
    noDeepSearchAutoCosts: true,
  },
  {
    adapterId: "curated_starting_point",
    label: "Kuratierte Startlage",
    category: "curated",
    defaultStatus: "configured",
    defaultConnected: false,
    description:
      "Kuratierte Pilotvorschau oder redaktionell vorbereitete Startlage. Kein Live-Crawler und keine automatische Amtlichkeit.",
    weight: 0.82,
    allowedSourceKinds: ["feed_signal"],
    reviewOnly: true,
    noLiveCrawlerClaim: true,
    noScraping: true,
    noDeepSearchAutoCosts: true,
  },
  {
    adapterId: "manual_review_queue",
    label: "Manuelle Hinweise / Review-Queue",
    category: "manual",
    defaultStatus: "configured",
    defaultConnected: false,
    description:
      "Manuelle oder öffentliche Hinweise aus bestehender Review-Queue. Sichtbar, aber weiterhin reviewpflichtig.",
    weight: 0.66,
    allowedSourceKinds: ["community_signal"],
    reviewOnly: true,
    noLiveCrawlerClaim: true,
    noScraping: true,
    noDeepSearchAutoCosts: true,
  },
] as const;

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

function clampConfidence(value: number): number {
  return Number(Math.max(0.35, Math.min(0.98, value)).toFixed(2));
}

function mapCommunitySignalReviewStatus(
  status: CommunitySignal["reviewStatus"],
): RegionSignalReviewState {
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
  if (haystack.includes("schule") || haystack.includes("schul")) {
    return "bildung-schulinfrastruktur";
  }
  if (haystack.includes("verkehr")) return "verkehr-schulwege";
  if (haystack.includes("jugend") || haystack.includes("sport") || haystack.includes("kultur")) {
    return slugify(`${regionName}-jugend-sport-kultur`);
  }
  if (haystack.includes("kiez") || haystack.includes("nachbarschaft")) {
    return "soziale-infrastruktur";
  }
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

function inferSourceAdapterId(
  source: RegionIntelligenceSource,
): RegionIntelligenceSourceAdapterId {
  if (source.kind === "community_signal") return "manual_review_queue";
  return source.signal.provenance.isFixture
    ? "curated_starting_point"
    : "productive_regional_source";
}

function mergeSourceAdapterOverrides(
  overrides: RegionIntelligenceSourceAdapterOverride[] | undefined,
) {
  const overrideMap = new Map<
    RegionIntelligenceSourceAdapterId,
    RegionIntelligenceSourceAdapterOverride
  >();
  for (const override of overrides ?? []) {
    overrideMap.set(override.adapterId, override);
  }
  return overrideMap;
}

function resolveConfiguredSources(
  input: RegionIntelligencePreparationInput,
): RegionIntelligenceSourceAdapterContract[] {
  const overrides = mergeSourceAdapterOverrides(input.sourceAdapters);
  const matchedLabelsByAdapter = new Map<RegionIntelligenceSourceAdapterId, string[]>();

  for (const source of input.sources) {
    const adapterId = inferSourceAdapterId(source);
    if (!matchedLabelsByAdapter.has(adapterId)) matchedLabelsByAdapter.set(adapterId, []);
    matchedLabelsByAdapter.get(adapterId)?.push(sourceLabel(source));
  }

  return DEFAULT_SOURCE_ADAPTERS.map((entry) => {
    const override = overrides.get(entry.adapterId);
    const matchedSourceLabels = uniqueNonEmpty(matchedLabelsByAdapter.get(entry.adapterId) ?? []);
    const matchedSourceCount = matchedSourceLabels.length;
    const connected = matchedSourceCount > 0 ? true : override?.connected ?? entry.defaultConnected;
    const status =
      matchedSourceCount > 0
        ? "connected"
        : override?.status ?? entry.defaultStatus;

    return {
      adapterId: entry.adapterId,
      label: override?.label ?? entry.label,
      category: entry.category,
      status,
      connected,
      description: override?.description ?? entry.description,
      weight: Number((override?.weight ?? entry.weight).toFixed(2)),
      allowedSourceKinds: [...entry.allowedSourceKinds],
      matchedSourceCount,
      matchedSourceLabels,
      reviewOnly: true,
      noLiveCrawlerClaim: true,
      noScraping: true,
      noDeepSearchAutoCosts: true,
    };
  });
}

function buildSourceStatusSummary(
  configuredSources: RegionIntelligenceSourceAdapterContract[],
): RegionIntelligenceSourceStatusSummary {
  const sourceCountFor = (category: RegionIntelligenceSourceCategory) =>
    configuredSources
      .filter((entry) => entry.category === category)
      .reduce((sum, entry) => sum + entry.matchedSourceCount, 0);

  const productiveSourceCount = sourceCountFor("productive");
  const curatedSourceCount = sourceCountFor("curated");
  const manualSourceCount = sourceCountFor("manual");
  const productiveConnectedCount = configuredSources.filter(
    (entry) => entry.category === "productive" && entry.status === "connected",
  ).length;
  const curatedConnectedCount = configuredSources.filter(
    (entry) => entry.category === "curated" && entry.status === "connected",
  ).length;
  const manualConnectedCount = configuredSources.filter(
    (entry) => entry.category === "manual" && entry.status === "connected",
  ).length;
  const productiveConfiguredCount = configuredSources.filter(
    (entry) => entry.category === "productive" && entry.status === "configured",
  ).length;
  const curatedConfiguredCount = configuredSources.filter(
    (entry) => entry.category === "curated" && entry.status === "configured",
  ).length;
  const manualConfiguredCount = configuredSources.filter(
    (entry) => entry.category === "manual" && entry.status === "configured",
  ).length;
  const productiveMissingCount = configuredSources.filter(
    (entry) => entry.category === "productive" && entry.status === "missing",
  ).length;

  const productiveLabel =
    productiveConnectedCount > 0
      ? `${productiveSourceCount} produktive Quelle${
          productiveSourceCount === 1 ? "" : "n"
        } verbunden`
      : productiveConfiguredCount > 0
        ? `${productiveConfiguredCount} produktive Quelle${
            productiveConfiguredCount === 1 ? "" : "n"
          } konfiguriert`
      : "Keine produktive Quelle verbunden";
  const curatedLabel =
    curatedConnectedCount > 0
      ? `${curatedSourceCount} kuratierte Quelle${
          curatedSourceCount === 1 ? "" : "n"
        } aktiv`
      : curatedConfiguredCount > 0
        ? `${curatedConfiguredCount} kuratierte Quelle${
            curatedConfiguredCount === 1 ? "" : "n"
          } konfiguriert`
      : "Kuratierte Quellen vorbereitet";
  const manualLabel =
    manualConnectedCount > 0
      ? `${manualSourceCount} manuelle Quelle${
          manualSourceCount === 1 ? "" : "n"
        } aktiv`
      : manualConfiguredCount > 0
        ? `${manualConfiguredCount} manuelle Quelle${
            manualConfiguredCount === 1 ? "" : "n"
          } konfiguriert`
      : "Manuelle Quellen vorbereitet";
  const overallLabel =
    productiveConnectedCount > 0
      ? `${productiveLabel} · ${curatedLabel} · ${manualLabel}`
      : `${productiveLabel}. ${curatedLabel} · ${manualLabel}.`;

  return {
    productiveSourceCount,
    curatedSourceCount,
    manualSourceCount,
    productiveConnectedCount,
    curatedConnectedCount,
    manualConnectedCount,
    productiveConfiguredCount,
    curatedConfiguredCount,
    manualConfiguredCount,
    productiveMissingCount,
    productiveLabel,
    curatedLabel,
    manualLabel,
    overallLabel,
  };
}

function buildWeightingSummary(
  configuredSources: RegionIntelligenceSourceAdapterContract[],
): RegionIntelligenceWeightingSummary {
  const byCategory = (category: RegionIntelligenceSourceCategory, fallback: number) => {
    const values = configuredSources
      .filter((entry) => entry.category === category)
      .map((entry) => entry.weight);
    return values.length > 0 ? Number(average(values).toFixed(2)) : fallback;
  };

  const productiveWeight = byCategory("productive", 1);
  const curatedWeight = byCategory("curated", 0.82);
  const manualWeight = byCategory("manual", 0.66);

  return {
    productiveWeight,
    curatedWeight,
    manualWeight,
    label: `Gewichtung vorbereitet: produktiv ${productiveWeight.toFixed(
      2,
    )} · kuratiert ${curatedWeight.toFixed(2)} · manuell ${manualWeight.toFixed(2)}`,
    adapterWeights: configuredSources.map((entry) => ({
      adapterId: entry.adapterId,
      label: entry.label,
      category: entry.category,
      weight: entry.weight,
    })),
  };
}

function applySourceWeight(baseConfidence: number, weight: number) {
  return clampConfidence(baseConfidence * (0.55 + weight * 0.45));
}

function sourceContractFor(
  source: RegionIntelligenceSource,
  configuredSources: RegionIntelligenceSourceAdapterContract[],
) {
  const adapterId = inferSourceAdapterId(source);
  return (
    configuredSources.find((entry) => entry.adapterId === adapterId) ??
    configuredSources[0]
  );
}

function sourceToSeed(
  source: RegionIntelligenceSource,
  configuredSources: RegionIntelligenceSourceAdapterContract[],
): RegionIntelligenceSignalSeed {
  const contract = sourceContractFor(source, configuredSources);
  if (source.kind === "feed_signal") {
    const signal = source.signal;
    return {
      id: signal.id,
      regionId: signal.regionId,
      sourceId: signal.sourceId,
      sourceType: signal.sourceType,
      sourceAdapterId: contract.adapterId,
      sourceCategory: contract.category,
      sourceLabel: contract.label,
      sourceWeight: contract.weight,
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
      confidence: applySourceWeight(signal.confidence, contract.weight),
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
  const baseConfidence = signal.reviewStatus === "accepted" ? 0.73 : 0.61;
  return {
    id: `region-feed-runtime-${signal.id}`,
    regionId: signal.regionId,
    sourceId: signal.id,
    sourceType: "community_signal",
    sourceAdapterId: contract.adapterId,
    sourceCategory: contract.category,
    sourceLabel: contract.label,
    sourceWeight: contract.weight,
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
    confidence: applySourceWeight(baseConfidence, contract.weight),
    reviewStatus: mapCommunitySignalReviewStatus(signal.reviewStatus),
    clusterKey: inferClusterKey(signal, source.regionName),
    openQuestions: [],
    reviewHint:
      signal.reviewStatus === "submitted"
        ? "Signal bleibt reviewpflichtig und erzeugt keine automatische Struktur."
        : "Weiterer redaktioneller Review bleibt erforderlich.",
    suggestedAnlassraumTitle: hasExistingAnlassraum ? source.defaultAnlassraumTitle : null,
    suggestedDossierTitle:
      signal.signalType === "source"
        ? "Quellenprüfung im bestehenden Dossier"
        : null,
    provenance: {
      dataOrigin: "runtime_review_queue",
      isFixture: false,
      fixtureMarker: "runtime_review_queue",
    },
  };
}

function buildTopicClusterHints(
  seeds: RegionIntelligenceSignalSeed[],
): RegionIntelligenceClusterHint[] {
  const buckets = new Map<string, RegionIntelligenceSignalSeed[]>();
  for (const seed of seeds) {
    const key = seed.clusterKey ?? slugify(seed.detectedTopics[0] ?? seed.title);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)?.push(seed);
  }

  return Array.from(buckets.entries()).map(([clusterKey, bucket]) => ({
    clusterKey,
    label:
      bucket[0]?.suggestedAnlassraumTitle ??
      bucket[0]?.detectedTopics[0] ??
      bucket[0]?.title ??
      clusterKey,
    signalSeedIds: uniqueNonEmpty(bucket.map((seed) => seed.id)),
    openQuestions: uniqueNonEmpty(bucket.flatMap((seed) => seed.openQuestions)),
    confidence: Number(average(bucket.map((seed) => seed.confidence)).toFixed(2)),
    suggestedAction: bucket.some((seed) => seed.suggestedAction === "create_dossier")
      ? "create_dossier"
      : bucket[0]?.suggestedAction ?? "ask_clarifying_question",
    reviewStatus: bucket.every((seed) => seed.reviewStatus === "accepted")
      ? "accepted"
      : "needs_review",
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
    reviewStatus: bucket.every((seed) => seed.reviewStatus === "accepted")
      ? "accepted"
      : "needs_review",
  }));
}

function sourceInsightForSeedIds(
  seedIds: string[],
  seeds: RegionIntelligenceSignalSeed[],
  sourceStatusSummary: RegionIntelligenceSourceStatusSummary,
) {
  const selected = seeds.filter((seed) => seedIds.includes(seed.id));
  return {
    sourceCategories: uniqueNonEmpty(selected.map((seed) => seed.sourceCategory)) as RegionIntelligenceSourceCategory[],
    sourceLabels: uniqueNonEmpty(selected.map((seed) => seed.sourceLabel)),
    sourceStatusLabel:
      selected.some((seed) => seed.sourceCategory === "productive")
        ? sourceStatusSummary.productiveLabel
        : selected.some((seed) => seed.sourceCategory === "curated")
          ? sourceStatusSummary.curatedLabel
          : sourceStatusSummary.manualLabel,
  };
}

function buildReviewSuggestions(params: {
  topicClusterHints: RegionIntelligenceClusterHint[];
  dossierSuggestionHints: RegionIntelligenceSuggestionHint[];
  anlassraumSuggestionHints: RegionIntelligenceSuggestionHint[];
  signalSeeds: RegionIntelligenceSignalSeed[];
  sourceStatusSummary: RegionIntelligenceSourceStatusSummary;
}): RegionIntelligenceReviewSuggestion[] {
  const items: RegionIntelligenceReviewSuggestion[] = [];

  for (const hint of params.topicClusterHints) {
    const insight = sourceInsightForSeedIds(
      hint.signalSeedIds,
      params.signalSeeds,
      params.sourceStatusSummary,
    );
    items.push({
      id: `region-intelligence-topic-cluster-${hint.clusterKey}`,
      suggestionType: "topic_cluster",
      title: hint.label,
      summary: `${hint.signalSeedIds.length} Signale verdichten sich zu einem reviewpflichtigen Themencluster. ${insight.sourceStatusLabel}.`,
      signalSeedIds: hint.signalSeedIds,
      confidence: hint.confidence,
      reviewStatus: hint.reviewStatus,
      visibilityState: "internal_review",
      sourceCategories: insight.sourceCategories,
      sourceLabels: insight.sourceLabels,
      sourceStatusLabel: insight.sourceStatusLabel,
    });
  }

  for (const hint of params.dossierSuggestionHints) {
    const insight = sourceInsightForSeedIds(
      hint.signalSeedIds,
      params.signalSeeds,
      params.sourceStatusSummary,
    );
    items.push({
      id: `region-intelligence-dossier-${slugify(hint.title)}`,
      suggestionType: "dossier_suggestion",
      title: hint.title,
      summary: `${hint.signalSeedIds.length} Signale sprechen für einen reviewpflichtigen Dossier-Vorschlag. ${insight.sourceStatusLabel}.`,
      signalSeedIds: hint.signalSeedIds,
      confidence: hint.confidence,
      reviewStatus: hint.reviewStatus,
      visibilityState: "internal_review",
      sourceCategories: insight.sourceCategories,
      sourceLabels: insight.sourceLabels,
      sourceStatusLabel: insight.sourceStatusLabel,
    });
  }

  for (const hint of params.anlassraumSuggestionHints) {
    const insight = sourceInsightForSeedIds(
      hint.signalSeedIds,
      params.signalSeeds,
      params.sourceStatusSummary,
    );
    items.push({
      id: `region-intelligence-anlassraum-${slugify(hint.title)}`,
      suggestionType: "anlassraum_suggestion",
      title: hint.title,
      summary: `${hint.signalSeedIds.length} Signale sprechen für einen reviewpflichtigen Anlassraum-Vorschlag. ${insight.sourceStatusLabel}.`,
      signalSeedIds: hint.signalSeedIds,
      confidence: hint.confidence,
      reviewStatus: hint.reviewStatus,
      visibilityState: "internal_review",
      sourceCategories: insight.sourceCategories,
      sourceLabels: insight.sourceLabels,
      sourceStatusLabel: insight.sourceStatusLabel,
    });
  }

  return items.sort((left, right) => right.confidence - left.confidence);
}

export function resolveRegionIntelligenceSourceContracts(
  input: Pick<RegionIntelligencePreparationInput, "sources" | "sourceAdapters">,
) {
  const configuredSources = resolveConfiguredSources({
    region: {} as Region,
    organization: {
      primaryOrganizationId: null,
      organizationIds: [],
      actorRole: "system",
      entitlementStatus: null,
      verificationStatus: null,
      regionalActorLabels: [],
    },
    orientation: {
      audience: "neutral",
      goal: "Region Intelligence Quellenstatus",
      focusTopics: [],
      expectedOutputs: ["topic_clusters"],
    },
    sources: input.sources,
    sourceAdapters: input.sourceAdapters,
  });
  return {
    configuredSources,
    sourceStatusSummary: buildSourceStatusSummary(configuredSources),
    weightingSummary: buildWeightingSummary(configuredSources),
  };
}

export function buildRegionIntelligencePrompt(
  input: RegionIntelligencePreparationInput,
): string {
  const focusTopics =
    input.orientation.focusTopics.length > 0
      ? input.orientation.focusTopics.join(", ")
      : "keine vorgegebenen Fokus-Themen";
  const outputs = input.orientation.expectedOutputs.join(", ");
  const sourceContracts = resolveRegionIntelligenceSourceContracts({
    sources: input.sources,
    sourceAdapters: input.sourceAdapters,
  });
  const sourceContractLines = sourceContracts.configuredSources
    .map(
      (source) =>
        `- ${source.label} | Status: ${source.status} | Kategorie: ${source.category} | Gewicht: ${source.weight.toFixed(
          2,
        )} | Treffer: ${source.matchedSourceCount}`,
    )
    .join("\n");
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
    `Quellenstatus: ${sourceContracts.sourceStatusSummary.overallLabel}`,
    `Gewichtung: ${sourceContracts.weightingSummary.label}`,
    "Guardrails: keine Live-Crawler-Behauptung, kein Scraping, keine DeepSearch-Automatikkosten, kein GeoReferenceLayer, kein Payment, kein Publishing, keine automatische Dossier-/Anlassraum-Erstellung, keine automatische amtliche Bewertung, keine Ausschreibungs-/Vergabelogik.",
    "Alle Vorschlaege bleiben reviewpflichtig und duerfen keine amtliche Wahrheit oder automatische Freigabe behaupten.",
    "Quellenadapter:",
    sourceContractLines || "- keine Quellenadapter",
    "Quellenuebersicht:",
    sourceLines || "- keine Quellen",
  ].join("\n");
}

const deterministicFixtureAdapter: RegionIntelligenceAdapter = {
  id: "deterministic_fixture",
  async prepare(input) {
    const configuredSources = resolveConfiguredSources(input);
    const sourceStatusSummary = buildSourceStatusSummary(configuredSources);
    const weightingSummary = buildWeightingSummary(configuredSources);
    const signalSeeds = input.sources
      .map((source) => sourceToSeed(source, configuredSources))
      .sort((left, right) => right.confidence - left.confidence);
    const topicClusterHints = buildTopicClusterHints(signalSeeds);
    const dossierSuggestionHints = buildSuggestionHints(
      signalSeeds,
      (seed) => seed.suggestedDossierTitle,
    );
    const anlassraumSuggestionHints = buildSuggestionHints(
      signalSeeds,
      (seed) => seed.suggestedAnlassraumTitle,
    );

    return {
      adapterId: "deterministic_fixture",
      mode: "deterministic_fixture",
      generatedAt: new Date().toISOString(),
      prompt: input.prompt,
      sourceCount: input.sources.length,
      configuredSources,
      sourceStatusSummary,
      weightingSummary,
      signalSeeds,
      topicClusterHints,
      dossierSuggestionHints,
      anlassraumSuggestionHints,
      reviewSuggestions: buildReviewSuggestions({
        topicClusterHints,
        dossierSuggestionHints,
        anlassraumSuggestionHints,
        signalSeeds,
        sourceStatusSummary,
      }),
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
