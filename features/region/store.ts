import { z } from "zod";
import {
  buildOfficialRegionalActorsFromDirectory,
  buildOfficialRegionsFromDirectory,
  summarizeOfficialAdministrativeDirectory,
} from "./directory";
import {
  canAttachSignalToDossier,
  canCreateAnlassraumDraft,
  canCreateDossierDraft,
  canCreateRegionDraft,
  canReadRegionDashboard,
  canReviewRegionSignal,
  type RegionAllowedAction,
  type RegionAccessContext,
} from "./access";
import {
  type CommunitySignal,
  type CommunitySignalReviewStatus,
  type Region,
  type RegionalActor,
  type RegionalAdminCockpit,
  type RegionalAnlassraum,
  normalizeCommunitySignalReviewStatus,
  normalizeCommunitySignalSubmitterMode,
  normalizeCommunitySignalType,
  normalizeRegionalActorType,
  normalizeRegionalActorVerificationStatus,
  parseCommunitySignal,
  parseRegionalActor,
} from "./contracts";
import {
  getCommunitySignalById,
  getRegionalAdminCockpitById,
  getRegionById,
  listCommunitySignals,
  listRegions,
  listRegionalAnlassraeume,
} from "./fixtures";
import {
  buildRuntimeRegionSignalProvenance,
  type RegionAnlassraumSuggestion,
  type RegionDossierSuggestion,
  type RegionFeedSignal,
  type RegionSignalReviewState,
  type RegionTopicCluster,
  parseRegionAnlassraumSuggestion,
  parseRegionDossierSuggestion,
  parseRegionFeedSignal,
  parseRegionTopicCluster,
  REGION_FEED_SIGNAL_FIXTURES,
} from "./regionFeedSignals";
import {
  getRegionParticipationSignalById as getFixtureRegionParticipationSignalById,
  type RegionParticipationAggregate,
  type RegionParticipationAggregationMode,
  type RegionParticipationPrivacyMode,
  type RegionParticipationReviewItem,
  type RegionParticipationSignal,
  listRegionParticipationSignalsForRuntime,
  parseRegionParticipationAggregate,
  parseRegionParticipationReviewItem,
} from "./regionParticipationSignals";
import {
  getRegionGuidelineMatrixByProfile,
  resolveGuidelineProfileForRegion,
  type RegionGuidelineMatrix,
} from "./guidelines";
import {
  getRegionDataRepo,
  setRegionDataRepoForTests,
  type CommunitySignalRepoListQuery,
  type RegionalActorRepoListQuery,
} from "./server/repo";

export type RegionalActorRegisterQuery = RegionalActorRepoListQuery;
export type CommunitySignalQueueQuery = CommunitySignalRepoListQuery;

export type RegionDashboardGuardrails = {
  noAutoPublish: true;
  noAutoDossierCreation: true;
  noAutoAnlassraumCreation: true;
  noScrapingByDefault: true;
  noTenderMonitoring: true;
  noProcurementMonitoring: true;
  reviewRequired: true;
};

export type RegionDashboardAccessSummary = {
  actorRole: string;
  isAdmin: boolean;
  authoritySource: RegionAccessContext["authoritySource"];
  adminFallback: boolean;
  verificationStatus: RegionAccessContext["verificationStatus"];
  hintedRegionIds: string[];
  verifiedRegionIds: string[];
  scopedRegionIds: string[];
  organizationIds: string[];
  paidDashboardEntitlement: RegionAccessContext["organization"]["paidDashboardEntitlement"];
  entitlementStatus: RegionAccessContext["organization"]["entitlementStatus"];
  entitlementReason: RegionAccessContext["organization"]["entitlementReason"];
  entitlementPlanId: string | null;
  entitlementPlanLabel: string | null;
  entitlementScope: RegionAccessContext["organization"]["entitlementScope"];
  entitlementSource: RegionAccessContext["organization"]["entitlementSource"];
  entitlementLimits: RegionAccessContext["organization"]["entitlementLimits"];
  entitlementUsage: RegionAccessContext["organization"]["entitlementUsage"];
  allowedActions: RegionAllowedAction[];
  canReadRegionDashboard: boolean;
  canReviewRegionSignal: boolean;
  canCreateRegionDraft: boolean;
  canAttachSignalToDossier: boolean;
  canCreateDossierDraft: boolean;
  canCreateAnlassraumDraft: boolean;
};

export type RegionDashboardOpenReviewItem = {
  id: string;
  title: string;
  sourceClass: "feed" | "participation";
  sourceType: RegionFeedSignal["sourceType"] | RegionParticipationSignal["sourceType"];
  suggestedAction: RegionFeedSignal["suggestedAction"] | "review_public_input";
  reviewStatus: RegionSignalReviewState;
  dataOrigin: RegionFeedSignal["provenance"]["dataOrigin"];
  isFixture: boolean;
  confidence: number;
  aggregationMode: RegionParticipationAggregationMode | null;
  privacyMode: RegionParticipationPrivacyMode | null;
};

export type RegionDashboardActiveDossier = {
  id: string;
  title: string;
  sourceAnlassraumIds: string[];
  status: "reference_only";
};

export type RegionalAdminCockpitReadModel = {
  region: Region;
  accessSummary: RegionDashboardAccessSummary;
  guidelineProfile: string | null;
  guidelineMatrix: RegionGuidelineMatrix | null;
  actorCount: number;
  verifiedActorCount: number;
  officialDirectoryActorCount: number;
  signalCount: number;
  pendingSignalCount: number;
  directoryStructureBreakdown: Array<{ administrativeUnitType: string; count: number }>;
  cockpit: RegionalAdminCockpit;
  feedSignals: RegionFeedSignal[];
  participationSignals: RegionParticipationSignal[];
  participationAggregates: RegionParticipationAggregate[];
  publicClaimsSummary: {
    total: number;
    reviewPending: number;
    labels: string[];
  };
  publicQuestionsSummary: {
    total: number;
    reviewPending: number;
    labels: string[];
  };
  swipeInterestSummary: {
    totalSignals: number;
    totalCount: number;
    labels: string[];
  };
  counterpointSummary: {
    totalSignals: number;
    totalCount: number;
    labels: string[];
  };
  communitySourceHints: RegionParticipationSignal[];
  reviewItemsFromPublicInput: RegionParticipationReviewItem[];
  topicClusters: RegionTopicCluster[];
  suggestedAnlassraeume: RegionAnlassraumSuggestion[];
  suggestedDossiers: RegionDossierSuggestion[];
  openReviewItems: RegionDashboardOpenReviewItem[];
  activeDossiers: RegionDashboardActiveDossier[];
  activeAnlassraeume: RegionalAnlassraum[];
  communitySignals: CommunitySignal[];
  actorsSummary: {
    total: number;
    verified: number;
    officialDirectory: number;
    manual: number;
    administration: number;
  };
  guardrails: RegionDashboardGuardrails;
};

const DEFAULT_DASHBOARD_GUARDRAILS: RegionDashboardGuardrails = {
  noAutoPublish: true,
  noAutoDossierCreation: true,
  noAutoAnlassraumCreation: true,
  noScrapingByDefault: true,
  noTenderMonitoring: true,
  noProcurementMonitoring: true,
  reviewRequired: true,
};

const CommunitySignalCreateSchema = z
  .object({
    regionId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    signalType: z.string().trim().min(1).optional(),
    sourceActorId: z.string().trim().min(1).nullable().optional(),
    sourceUrls: z.array(z.string().trim().url()).optional(),
    submitter: z.object({
      mode: z.string().trim().min(1).optional(),
      displayName: z.string().trim().min(1).nullable().optional(),
      contactChannel: z.string().trim().min(1).nullable().optional(),
    }),
  })
  .strict();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildActorRegisterMap(entries: RegionalActor[]): Map<string, RegionalActor> {
  return new Map(entries.map((entry) => [entry.id, clone(entry)]));
}

function normalizeLimit(value: unknown, fallback = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.max(1, Math.min(2000, Math.floor(numeric)));
}

function buildIsoNow(): string {
  return new Date().toISOString();
}

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
): RegionFeedSignal["suggestedAction"] {
  if (signal.signalType === "source") return "attach_source_to_dossier";
  if (signal.signalType === "topic_proposal") return "create_anlassraum";
  if (signal.signalType === "local_knowledge") return "ask_clarifying_question";
  return hasExistingAnlassraum ? "attach_to_anlassraum" : "create_anlassraum";
}

function matchesActorQuery(actor: RegionalActor, query: RegionalActorRegisterQuery): boolean {
  if (query.regionId?.trim() && actor.regionId !== query.regionId.trim()) return false;
  if (query.actorType && query.actorType !== "all" && actor.actorType !== query.actorType) return false;
  if (
    query.verificationStatus &&
    query.verificationStatus !== "all" &&
    actor.verificationStatus !== query.verificationStatus
  ) {
    return false;
  }
  if (query.sourceKind && query.sourceKind !== "all" && actor.sourceKind !== query.sourceKind) return false;
  return true;
}

function matchesSignalQuery(signal: CommunitySignal, query: CommunitySignalQueueQuery): boolean {
  if (query.regionId?.trim() && signal.regionId !== query.regionId.trim()) return false;
  if (query.signalType && query.signalType !== "all" && signal.signalType !== query.signalType) return false;
  if (query.reviewStatus && query.reviewStatus !== "all" && signal.reviewStatus !== query.reviewStatus) {
    return false;
  }
  return true;
}

function collectScopedRegionIds(rootRegionId: string, regions: Region[]): string[] {
  const byParent = new Map<string, Region[]>();
  for (const region of regions) {
    const parentRegionId = region.parentRegionId ?? "";
    if (!byParent.has(parentRegionId)) byParent.set(parentRegionId, []);
    byParent.get(parentRegionId)?.push(region);
  }

  const visited = new Set<string>();
  const queue = [rootRegionId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const child of byParent.get(current) ?? []) {
      queue.push(child.id);
    }
  }

  return Array.from(visited);
}

function resolveRegionFeedSignals(params: {
  region: Region;
  scopedRegionIds: string[];
  activeAnlassraeume: RegionalAnlassraum[];
  communitySignals: CommunitySignal[];
  regionMap: Map<string, Region>;
}): RegionFeedSignal[] {
  const activeAnlassraumIds = params.activeAnlassraeume.map((entry) => entry.id);
  const pilotSignals = REGION_FEED_SIGNAL_FIXTURES.filter((signal) =>
    params.scopedRegionIds.includes(signal.regionId),
  ).map((signal) => clone(signal));

  const runtimeSignals = params.communitySignals.map((signal) => {
    const signalRegionName = params.regionMap.get(signal.regionId)?.name ?? params.region.name;
    return parseRegionFeedSignal({
      id: `region-feed-runtime-${signal.id}`,
      kind: "region_feed_signal",
      regionId: signal.regionId,
      sourceId: signal.id,
      sourceType: "community_signal",
      title: signal.title,
      summary: signal.summary,
      url: signal.sourceUrls[0] ?? null,
      publishedAt: signal.createdAt ?? null,
      detectedTopics: inferTopicsFromCommunitySignal(signal),
      detectedPlaces: [signalRegionName],
      relatedClaims: [],
      relatedDossiers: [],
      relatedAnlassraumIds: activeAnlassraumIds,
      suggestedAction: inferSuggestedAction(signal, activeAnlassraumIds.length > 0),
      confidence: signal.reviewStatus === "accepted" ? 0.73 : 0.61,
      reviewStatus: mapCommunitySignalReviewStatus(signal.reviewStatus),
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
      provenance: buildRuntimeRegionSignalProvenance(),
      clusterKey: inferClusterKey(signal, signalRegionName),
      openQuestions: [],
      reviewHint:
        signal.reviewStatus === "submitted"
          ? "Signal bleibt reviewpflichtig und erzeugt keine automatische Struktur."
          : "Weiterer redaktioneller Review bleibt erforderlich.",
      suggestedAnlassraumTitle:
        activeAnlassraumIds.length > 0 ? params.activeAnlassraeume[0]?.title ?? null : null,
      suggestedDossierTitle: signal.signalType === "source" ? "Quellenpruefung im bestehenden Dossier" : null,
    });
  });

  return [...pilotSignals, ...runtimeSignals].sort((left, right) => right.confidence - left.confidence);
}

function resolveParticipationSignals(params: {
  region: Region;
  scopedRegionIds: string[];
  allSignals: RegionParticipationSignal[];
}): RegionParticipationSignal[] {
  return params.allSignals
    .filter(
      (signal) =>
        params.scopedRegionIds.includes(signal.regionId) && !signal.needsRegionReview,
    )
    .map((signal) => clone(signal))
    .sort((left, right) => right.confidence - left.confidence);
}

function buildParticipationAggregates(
  regionId: string,
  signals: RegionParticipationSignal[],
): RegionParticipationAggregate[] {
  const buckets = new Map<string, RegionParticipationSignal[]>();
  for (const signal of signals) {
    const key =
      signal.sourceType === "swipe_interest"
        ? "swipe-interest"
        : signal.sourceType === "swipe_counterpoint"
          ? "swipe-counterpoint"
          : signal.sourceType === "public_claim"
            ? "public-claims"
            : signal.sourceType === "public_question"
              ? "public-questions"
              : signal.sourceType === "public_source_hint"
                ? "public-source-hints"
                : "public-contributions";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)?.push(signal);
  }

  return Array.from(buckets.entries()).map(([key, bucket]) =>
    parseRegionParticipationAggregate({
      id: `region-participation-aggregate-${regionId}-${key}`,
      regionId,
      label:
        key === "swipe-interest"
          ? "Swipe-/Interesse-Signale"
          : key === "swipe-counterpoint"
            ? "Gegenpositionen"
            : key === "public-claims"
              ? "Claims aus der Öffentlichkeit"
              : key === "public-questions"
                ? "Fragen aus der Öffentlichkeit"
                : key === "public-source-hints"
                  ? "Quellenhinweise aus der Community"
                  : "Öffentliche Beiträge",
      summary:
        key === "swipe-interest" || key === "swipe-counterpoint"
          ? `${bucket.length} anonymisierte Hinweise ohne Personenbezug und ohne Repräsentativitätsbehauptung.`
          : `${bucket.length} reviewpflichtige öffentliche Hinweise, ungeprüft und nicht amtlich.`,
      signalIds: uniqueNonEmpty(bucket.map((signal) => signal.id)),
      sourceTypes: bucket.map((signal) => signal.sourceType),
      totalSignals: bucket.length,
      totalCount: bucket.length,
      detectedTopics: uniqueNonEmpty(bucket.flatMap((signal) => signal.detectedTopics)),
      aggregationMode:
        bucket.every((signal) => signal.aggregationMode === "anonymized_count")
          ? "anonymized_count"
          : bucket.some((signal) => signal.aggregationMode === "aggregate_only")
            ? "aggregate_only"
            : "single_review_item",
      privacyMode:
        bucket.every((signal) => signal.privacyMode === "anonymized")
          ? "anonymized"
          : bucket.some((signal) => signal.privacyMode === "review_restricted")
            ? "review_restricted"
            : "no_personal_data",
      reviewStatus: bucket.every((signal) => signal.reviewStatus === "accepted")
        ? "accepted"
        : "needs_review",
      noPersonalProfiling: true,
      noPoliticalScoring: true,
      noRepresentativeClaim: true,
    }),
  );
}

function buildParticipationSummary(
  signals: RegionParticipationSignal[],
  sourceType: RegionParticipationSignal["sourceType"],
) {
  const filtered = signals.filter((signal) => signal.sourceType === sourceType);
  return {
    total: filtered.length,
    reviewPending: filtered.filter((signal) => signal.reviewStatus !== "accepted").length,
    labels: uniqueNonEmpty(
      filtered.flatMap((signal) => [
        signal.title,
        ...signal.detectedTopics,
      ]),
    ).slice(0, 4),
  };
}

function buildSwipeSummary(
  signals: RegionParticipationSignal[],
  sourceType: "swipe_interest" | "swipe_counterpoint",
) {
  const filtered = signals.filter((signal) => signal.sourceType === sourceType);
  return {
    totalSignals: filtered.length,
    totalCount: filtered.length,
    labels: uniqueNonEmpty(filtered.map((signal) => signal.title)).slice(0, 4),
  };
}

function buildParticipationReviewItems(
  signals: RegionParticipationSignal[],
): RegionParticipationReviewItem[] {
  return signals
    .filter((signal) => signal.reviewStatus === "draft" || signal.reviewStatus === "needs_review")
    .map((signal) =>
      parseRegionParticipationReviewItem({
        id: signal.id,
        regionId: signal.regionId,
        title: signal.title,
        sourceType: signal.sourceType,
        reviewStatus: signal.reviewStatus,
        aggregationMode: signal.aggregationMode,
        privacyMode: signal.privacyMode,
        confidence: signal.confidence,
        summary: signal.summary,
        needsRegionReview: signal.needsRegionReview,
        noPersonalProfiling: true,
        noPoliticalScoring: true,
        noRepresentativeClaim: true,
      }),
    );
}

function buildTopicClusters(regionId: string, signals: RegionFeedSignal[]): RegionTopicCluster[] {
  const buckets = new Map<string, RegionFeedSignal[]>();
  for (const signal of signals) {
    const key = signal.clusterKey ?? slugify(signal.detectedTopics[0] ?? signal.title);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)?.push(signal);
  }

  return Array.from(buckets.entries()).map(([key, bucket]) =>
    parseRegionTopicCluster({
      id: `region-topic-cluster-${regionId}-${key}`,
      regionId,
      label: bucket[0]?.suggestedAnlassraumTitle ?? bucket[0]?.detectedTopics[0] ?? bucket[0]?.title,
      summary: `${bucket.length} reviewpflichtige Signale werden als Themencluster gebuendelt.`,
      signalIds: uniqueNonEmpty(bucket.map((signal) => signal.id)),
      sourceIds: uniqueNonEmpty(bucket.map((signal) => signal.sourceId)),
      detectedTopics: uniqueNonEmpty(bucket.flatMap((signal) => signal.detectedTopics)),
      openQuestions: uniqueNonEmpty(bucket.flatMap((signal) => signal.openQuestions ?? [])),
      suggestedAction: bucket.some((signal) => signal.suggestedAction === "create_dossier")
        ? "create_dossier"
        : bucket[0]?.suggestedAction ?? "ask_clarifying_question",
      confidence: Number(average(bucket.map((signal) => signal.confidence)).toFixed(2)),
      reviewStatus: bucket.every((signal) => signal.reviewStatus === "accepted") ? "accepted" : "needs_review",
      provenance:
        bucket.every((signal) => signal.provenance.dataOrigin === "runtime_review_queue")
          ? buildRuntimeRegionSignalProvenance()
          : bucket[0]?.provenance,
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
    }),
  );
}

function buildSuggestedDossiers(regionId: string, signals: RegionFeedSignal[]): RegionDossierSuggestion[] {
  const buckets = new Map<string, RegionFeedSignal[]>();
  for (const signal of signals.filter((entry) => entry.suggestedDossierTitle)) {
    const key = signal.suggestedDossierTitle ?? signal.title;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)?.push(signal);
  }

  return Array.from(buckets.entries()).map(([title, bucket]) =>
    parseRegionDossierSuggestion({
      id: `region-dossier-suggestion-${regionId}-${slugify(title)}`,
      regionId,
      title,
      summary: `${bucket.length} Signale sprechen fuer einen reviewpflichtigen Dossier-Entwurf. Kein automatisches Dossier.`,
      relatedSignalIds: uniqueNonEmpty(bucket.map((signal) => signal.id)),
      relatedDossiers: uniqueNonEmpty(bucket.flatMap((signal) => signal.relatedDossiers)),
      openQuestions: uniqueNonEmpty(bucket.flatMap((signal) => signal.openQuestions ?? [])),
      suggestedAction: bucket.some((signal) => signal.suggestedAction === "create_dossier")
        ? "create_dossier"
        : "attach_source_to_dossier",
      confidence: Number(average(bucket.map((signal) => signal.confidence)).toFixed(2)),
      reviewStatus: bucket.every((signal) => signal.reviewStatus === "accepted") ? "accepted" : "needs_review",
      provenance: bucket[0]?.provenance,
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
    }),
  );
}

function buildSuggestedAnlassraeume(
  regionId: string,
  signals: RegionFeedSignal[],
): RegionAnlassraumSuggestion[] {
  const buckets = new Map<string, RegionFeedSignal[]>();
  for (const signal of signals.filter((entry) => entry.suggestedAnlassraumTitle)) {
    const key = signal.suggestedAnlassraumTitle ?? signal.title;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)?.push(signal);
  }

  return Array.from(buckets.entries()).map(([title, bucket]) =>
    parseRegionAnlassraumSuggestion({
      id: `region-anlassraum-suggestion-${regionId}-${slugify(title)}`,
      regionId,
      title,
      summary: `${bucket.length} Signale koennen in einen Anlassraum-Vorschlag ueberfuehrt werden. Review bleibt Pflicht.`,
      relatedSignalIds: uniqueNonEmpty(bucket.map((signal) => signal.id)),
      relatedAnlassraumIds: uniqueNonEmpty(bucket.flatMap((signal) => signal.relatedAnlassraumIds)),
      openQuestions: uniqueNonEmpty(bucket.flatMap((signal) => signal.openQuestions ?? [])),
      suggestedAction: bucket.some((signal) => signal.suggestedAction === "create_anlassraum")
        ? "create_anlassraum"
        : "attach_to_anlassraum",
      confidence: Number(average(bucket.map((signal) => signal.confidence)).toFixed(2)),
      reviewStatus: bucket.every((signal) => signal.reviewStatus === "accepted") ? "accepted" : "needs_review",
      provenance: bucket[0]?.provenance,
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
    }),
  );
}

function buildOpenReviewItems(
  feedSignals: RegionFeedSignal[],
  participationSignals: RegionParticipationSignal[],
): RegionDashboardOpenReviewItem[] {
  const feedItems = feedSignals
    .filter((signal) => signal.reviewStatus === "draft" || signal.reviewStatus === "needs_review")
    .map((signal) => ({
      id: signal.id,
      title: signal.title,
      sourceClass: "feed" as const,
      sourceType: signal.sourceType,
      suggestedAction: signal.suggestedAction,
      reviewStatus: signal.reviewStatus,
      dataOrigin: signal.provenance.dataOrigin,
      isFixture: signal.provenance.isFixture,
      confidence: signal.confidence,
      aggregationMode: null,
      privacyMode: null,
    }));

  const participationItems = participationSignals
    .filter((signal) => signal.reviewStatus === "draft" || signal.reviewStatus === "needs_review")
    .map((signal) => ({
      id: signal.id,
      title: signal.title,
      sourceClass: "participation" as const,
      sourceType: signal.sourceType,
      suggestedAction: "review_public_input" as const,
      reviewStatus: signal.reviewStatus,
      dataOrigin:
        signal.source.sourceKind === "fixture"
          ? ("pilot_fixture" as const)
          : ("runtime_review_queue" as const),
      isFixture: signal.source.isFixture,
      confidence: signal.confidence,
      aggregationMode: signal.aggregationMode,
      privacyMode: signal.privacyMode,
    }));

  return [...feedItems, ...participationItems].sort((left, right) => right.confidence - left.confidence);
}

function buildActiveDossiers(activeAnlassraeume: RegionalAnlassraum[]): RegionDashboardActiveDossier[] {
  const dossierMap = new Map<string, RegionDashboardActiveDossier>();
  for (const anlassraum of activeAnlassraeume) {
    for (const dossierId of anlassraum.links.dossierIds) {
      const existing = dossierMap.get(dossierId);
      if (existing) {
        existing.sourceAnlassraumIds = uniqueNonEmpty([...existing.sourceAnlassraumIds, anlassraum.id]);
        continue;
      }
      dossierMap.set(dossierId, {
        id: dossierId,
        title: `Referenzdossier ${dossierId}`,
        sourceAnlassraumIds: [anlassraum.id],
        status: "reference_only",
      });
    }
  }

  return Array.from(dossierMap.values());
}

function buildAccessSummary(regionId: string, context: RegionAccessContext): RegionDashboardAccessSummary {
  return {
    actorRole: context.actorRole,
    isAdmin: context.isAdmin,
    authoritySource: context.authoritySource,
    adminFallback: context.adminFallback,
    verificationStatus: context.verificationStatus,
    hintedRegionIds: context.hintedRegionIds,
    verifiedRegionIds: context.verifiedRegionIds,
    scopedRegionIds: context.scopedRegionIds,
    organizationIds: context.organization.organizationIds,
    paidDashboardEntitlement: context.organization.paidDashboardEntitlement,
    entitlementStatus: context.organization.entitlementStatus,
    entitlementReason: context.organization.entitlementReason,
    entitlementPlanId: context.organization.entitlementPlanId,
    entitlementPlanLabel: context.organization.entitlementPlanLabel,
    entitlementScope: context.organization.entitlementScope,
    entitlementSource: context.organization.entitlementSource,
    entitlementLimits: context.organization.entitlementLimits,
    entitlementUsage: context.organization.entitlementUsage,
    allowedActions: context.allowedActions,
    canReadRegionDashboard: canReadRegionDashboard(context, regionId),
    canReviewRegionSignal: canReviewRegionSignal(context, regionId),
    canCreateRegionDraft: canCreateRegionDraft(context, regionId),
    canAttachSignalToDossier: canAttachSignalToDossier(context, regionId),
    canCreateDossierDraft: canCreateDossierDraft(context, regionId),
    canCreateAnlassraumDraft: canCreateAnlassraumDraft(context, regionId),
  };
}

function buildDefaultCockpit(params: {
  region: Region;
  feedSignals: RegionFeedSignal[];
  actors: RegionalActor[];
  openReviewItems: RegionDashboardOpenReviewItem[];
  topicClusters: RegionTopicCluster[];
  suggestedDossiers: RegionDossierSuggestion[];
}): RegionalAdminCockpit {
  const fixtureCockpit = getRegionalAdminCockpitById(`admin-cockpit-${params.region.slug}`);
  const base = fixtureCockpit ?? getRegionalAdminCockpitById(`admin-cockpit-${params.region.id}`);

  return {
    id: base?.id ?? `admin-cockpit-${params.region.id}`,
    regionId: params.region.id,
    title: base?.title ?? `Verwaltungscockpit ${params.region.name}`,
    modules: {
      themenlage: {
        headline: "Themenlage",
        summary: `${params.feedSignals.length} kuratierte Signale und ${params.topicClusters.length} Themencluster liegen fuer ${params.region.name} vor.`,
      },
      akteurskarte: {
        headline: "Akteurskarte",
        summary: `${params.actors.length} regionale Akteure sind sichtbar, davon ${params.actors.filter((actor) => actor.actorType === "verwaltung").length} Verwaltungseintraege.`,
      },
      beteiligungsstatus: {
        headline: "Beteiligungsstatus",
        summary: `${params.openReviewItems.length} Signale oder Vorschlaege warten auf Sichtung, Review oder Zuordnung.`,
      },
      offene_fragen: {
        headline: "Offene Fragen",
        summary: `${params.suggestedDossiers.length} Dossier-Vorschlaege bleiben ohne automatische Erstellung und brauchen redaktionelle Klaerung.`,
      },
      teilhabegaps: {
        headline: "Teilhabegaps",
        summary: "Das Lagebild bleibt ausdruecklich ohne Scoring und markiert nur reviewpflichtige Beteiligungs- und Informationsluecken.",
      },
      naechste_rueckmeldungen: {
        headline: "Naechste Rueckmeldungen",
        summary: "Feed-Signale, Buergerhinweise und Verwaltungsnotizen werden erst nach Review weitergefuehrt.",
      },
      mandatsstatus: {
        headline: "Mandatsstatus",
        summary: "Kein Auto-Mandat und keine Auto-Freigabe: jede Weitergabe bleibt ein bewusster Freigabeschritt.",
      },
    },
    guardrails: {
      noCitizenScoring: true,
      noAssociationScoring: true,
      noAutomatedEnforcement: true,
    },
    createdAt: base?.createdAt ?? buildIsoNow(),
    updatedAt: buildIsoNow(),
  };
}

export async function listOperationalRegions(): Promise<Region[]> {
  const fixtureMap = new Map(listRegions().map((region) => [region.id, clone(region)]));
  for (const region of buildOfficialRegionsFromDirectory()) {
    if (!fixtureMap.has(region.id)) fixtureMap.set(region.id, region);
  }
  return Array.from(fixtureMap.values());
}

export async function getOperationalRegionById(id: string): Promise<Region | null> {
  const normalized = String(id || "").trim();
  if (!normalized) return null;

  const fixture = getRegionById(normalized);
  if (fixture) return clone(fixture);

  const regions = await listOperationalRegions();
  return regions.find((region) => region.id === normalized || region.slug === normalized) ?? null;
}

export async function listRegionalActorRegister(query: RegionalActorRegisterQuery = {}): Promise<RegionalActor[]> {
  const repo = getRegionDataRepo();
  const officialActors = buildOfficialRegionalActorsFromDirectory();
  const manualActors = await repo.listManualActors({
    ...query,
    sourceKind: query.sourceKind === "official_directory" ? "all" : query.sourceKind,
  });

  const merged = buildActorRegisterMap(officialActors);
  for (const actor of manualActors) merged.set(actor.id, clone(actor));

  return Array.from(merged.values())
    .filter((actor) => matchesActorQuery(actor, query))
    .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
    .slice(0, normalizeLimit(query.limit));
}

export async function getRegionalActorRegisterEntry(id: string): Promise<RegionalActor | null> {
  const repo = getRegionDataRepo();
  const manual = await repo.getManualActorById(id);
  if (manual) return manual;
  return buildOfficialRegionalActorsFromDirectory().find((entry) => entry.id === id) ?? null;
}

export async function saveRegionalActorRegisterEntry(
  input: Partial<RegionalActor> & {
    id: string;
    regionId: string;
    slug: string;
    name: string;
  },
): Promise<RegionalActor> {
  const repo = getRegionDataRepo();
  const actor = parseRegionalActor({
    ...input,
    actorType: normalizeRegionalActorType(input.actorType ?? "sonstige"),
    verificationStatus: normalizeRegionalActorVerificationStatus(input.verificationStatus ?? "review_required"),
    sourceKind: input.sourceKind ?? "manual_admin",
    publicVisibility: input.publicVisibility ?? "restricted",
    address: input.address ?? null,
    officialDirectoryEntry: input.officialDirectoryEntry ?? null,
    administrativeUnitType: input.administrativeUnitType ?? null,
    description: input.description ?? null,
    tags: input.tags ?? [],
    guardrails: input.guardrails ?? {
      noAutomaticPoliticalAssignment: true,
      noAutomaticVoiceOpenGovMembership: true,
      verificationStatusRequired: true,
    },
    createdAt: input.createdAt ?? buildIsoNow(),
    updatedAt: buildIsoNow(),
  });
  await repo.upsertManualActor(actor);
  return actor;
}

export async function listRegionalCommunitySignals(query: CommunitySignalQueueQuery = {}): Promise<CommunitySignal[]> {
  const repo = getRegionDataRepo();
  const fixtureSignals = listCommunitySignals();
  const storedSignals = await repo.listSignals(query);
  const merged = new Map<string, CommunitySignal>();

  for (const signal of fixtureSignals) merged.set(signal.id, clone(signal));
  for (const signal of storedSignals) merged.set(signal.id, clone(signal));

  return Array.from(merged.values())
    .filter((signal) => matchesSignalQuery(signal, query))
    .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
    .slice(0, normalizeLimit(query.limit));
}

export async function getRegionalCommunitySignalById(id: string): Promise<CommunitySignal | null> {
  const repo = getRegionDataRepo();
  const stored = await repo.getSignalById(id);
  if (stored) return stored;
  return getCommunitySignalById(id);
}

export async function getRegionalParticipationSignalById(
  id: string,
): Promise<RegionParticipationSignal | null> {
  const regions = await listOperationalRegions();
  const runtimeSignals = await listRegionParticipationSignalsForRuntime(regions);
  const runtimeMatch = runtimeSignals.find((signal) => signal.id === id) ?? null;
  if (runtimeMatch) return clone(runtimeMatch);
  return getFixtureRegionParticipationSignalById(id);
}

export async function createRegionalCommunitySignal(
  input: z.input<typeof CommunitySignalCreateSchema>,
): Promise<CommunitySignal> {
  const repo = getRegionDataRepo();
  const parsedInput = CommunitySignalCreateSchema.parse(input);
  const signal = parseCommunitySignal({
    id: `signal-${parsedInput.regionId}-${Date.now()}`,
    regionId: parsedInput.regionId,
    title: parsedInput.title,
    summary: parsedInput.summary,
    signalType: normalizeCommunitySignalType(parsedInput.signalType),
    reviewStatus: "submitted",
    sourceActorId: parsedInput.sourceActorId ?? null,
    sourceUrls: parsedInput.sourceUrls ?? [],
    submitter: {
      mode: normalizeCommunitySignalSubmitterMode(parsedInput.submitter.mode),
      displayName: parsedInput.submitter.displayName ?? null,
      contactChannel: parsedInput.submitter.contactChannel ?? null,
    },
    guardrails: {
      moderationRequired: true,
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticDossierCreation: true,
    },
    createdAt: buildIsoNow(),
    updatedAt: buildIsoNow(),
  });
  await repo.upsertSignal(signal);
  return signal;
}

export async function reviewRegionalCommunitySignal(params: {
  id: string;
  reviewStatus: CommunitySignalReviewStatus;
}): Promise<CommunitySignal> {
  const repo = getRegionDataRepo();
  const existing = await getRegionalCommunitySignalById(params.id);
  if (!existing) {
    throw new Error("community_signal_not_found");
  }
  const updated = parseCommunitySignal({
    ...existing,
    reviewStatus: normalizeCommunitySignalReviewStatus(params.reviewStatus),
    updatedAt: buildIsoNow(),
  });
  await repo.upsertSignal(updated);
  return updated;
}

export async function getRegionalAdminCockpitReadModel(
  regionId: string,
  input: { accessContext?: RegionAccessContext | null } = {},
): Promise<RegionalAdminCockpitReadModel> {
  const [regions, allSignals, allActors] = await Promise.all([
    listOperationalRegions(),
    listRegionalCommunitySignals({ limit: 2000 }),
    listRegionalActorRegister({ limit: 2000 }),
  ]);

  const region = (await getOperationalRegionById(regionId)) ?? regions.find((entry) => entry.slug === regionId) ?? null;
  if (!region) throw new Error("region_not_found");

  const scopedRegionIds = collectScopedRegionIds(region.id, regions);
  const scopedSet = new Set(scopedRegionIds);
  const regionMap = new Map(regions.map((entry) => [entry.id, entry]));
  const allParticipationSignals = await listRegionParticipationSignalsForRuntime(regions);
  const communitySignals = allSignals.filter((signal) => scopedSet.has(signal.regionId));
  const actors = allActors.filter((actor) => scopedSet.has(actor.regionId));
  const activeAnlassraeume = listRegionalAnlassraeume()
    .filter((anlassraum) => scopedSet.has(anlassraum.regionId))
    .map((anlassraum) => clone(anlassraum));
  const guidelineProfile = resolveGuidelineProfileForRegion({
    region,
    activeAnlassraeume,
  });
  const guidelineMatrix = getRegionGuidelineMatrixByProfile(guidelineProfile);
  const accessContext =
    input.accessContext ??
    ({
      userId: null,
      actorRole: "admin",
      isAdmin: true,
      authoritySource: "admin_fallback",
      adminFallback: true,
      verificationStatus: "admin_fallback",
      roles: ["admin"],
      hintedRegionIds: [],
      verifiedRegionIds: scopedRegionIds,
      scopedRegionIds,
      organization: {
        organizationIds: [],
        primaryOrganizationId: null,
        paidDashboardEntitlement: "admin_fallback",
        entitlementSource: "admin_fallback",
        entitlementStatus: "admin_fallback",
        entitlementReason: "admin_fallback",
        entitlementPlanId: null,
        entitlementPlanLabel: "Admin-Fallback",
        entitlementScope: null,
        entitlementLimits: null,
        entitlementUsage: null,
        requiresVerifiedMembership: true,
        dashboard: {
          allowed: true,
          reason: "admin_fallback",
          status: "admin_fallback",
          planId: null,
          planLabel: "Admin-Fallback",
          scope: null,
          source: "admin_fallback",
          limits: null,
          usage: null,
        },
        dossierDraft: {
          allowed: true,
          reason: "admin_fallback",
          status: "admin_fallback",
          planId: null,
          planLabel: "Admin-Fallback",
          scope: null,
          source: "admin_fallback",
          limits: null,
          usage: null,
        },
        anlassraumDraft: {
          allowed: true,
          reason: "admin_fallback",
          status: "admin_fallback",
          planId: null,
          planLabel: "Admin-Fallback",
          scope: null,
          source: "admin_fallback",
          limits: null,
          usage: null,
        },
      },
      allowedActions: [
        "read_region_dashboard",
        "review_region_signal",
        "create_region_draft",
        "attach_signal_to_dossier",
        "create_dossier_draft",
        "create_anlassraum_draft",
        "submit_for_review",
        "approve_publication",
        "manage_organization_members",
      ],
    } satisfies RegionAccessContext);
  const feedSignals = resolveRegionFeedSignals({
    region,
    scopedRegionIds,
    activeAnlassraeume,
    communitySignals,
    regionMap,
  });
  const participationSignals = resolveParticipationSignals({
    region,
    scopedRegionIds,
    allSignals: allParticipationSignals,
  });
  const participationAggregates = buildParticipationAggregates(region.id, participationSignals);
  const reviewItemsFromPublicInput = buildParticipationReviewItems(participationSignals);
  const topicClusters = buildTopicClusters(region.id, feedSignals);
  const suggestedDossiers = buildSuggestedDossiers(region.id, feedSignals);
  const suggestedAnlassraeume = buildSuggestedAnlassraeume(region.id, feedSignals);
  const openReviewItems = buildOpenReviewItems(feedSignals, participationSignals);
  const cockpit = buildDefaultCockpit({
    region,
    feedSignals,
    actors,
    openReviewItems,
    topicClusters,
    suggestedDossiers,
  });

  const structureCounts = new Map<string, number>();
  for (const actor of actors) {
    const key = actor.administrativeUnitType ?? "sonstige";
    structureCounts.set(key, (structureCounts.get(key) ?? 0) + 1);
  }

  return {
    region,
    accessSummary: buildAccessSummary(region.id, accessContext),
    guidelineProfile,
    guidelineMatrix,
    actorCount: actors.length,
    verifiedActorCount: actors.filter((actor) => actor.verificationStatus === "verified").length,
    officialDirectoryActorCount: actors.filter((actor) => actor.sourceKind === "official_directory").length,
    signalCount: feedSignals.length + participationSignals.length,
    pendingSignalCount: openReviewItems.length,
    directoryStructureBreakdown:
      actors.length > 0
        ? Array.from(structureCounts.entries())
            .map(([administrativeUnitType, count]) => ({ administrativeUnitType, count }))
            .sort((left, right) => right.count - left.count)
        : summarizeOfficialAdministrativeDirectory().slice(0, 12).map((entry) => ({
            administrativeUnitType: entry.administrativeUnitType,
            count: entry.count,
          })),
    cockpit,
    feedSignals,
    participationSignals,
    participationAggregates,
    publicClaimsSummary: buildParticipationSummary(participationSignals, "public_claim"),
    publicQuestionsSummary: buildParticipationSummary(participationSignals, "public_question"),
    swipeInterestSummary: buildSwipeSummary(participationSignals, "swipe_interest"),
    counterpointSummary: buildSwipeSummary(participationSignals, "swipe_counterpoint"),
    communitySourceHints: participationSignals.filter(
      (signal) => signal.sourceType === "public_source_hint",
    ),
    reviewItemsFromPublicInput,
    topicClusters,
    suggestedAnlassraeume,
    suggestedDossiers,
    openReviewItems,
    activeDossiers: buildActiveDossiers(activeAnlassraeume),
    activeAnlassraeume,
    communitySignals,
    actorsSummary: {
      total: actors.length,
      verified: actors.filter((actor) => actor.verificationStatus === "verified").length,
      officialDirectory: actors.filter((actor) => actor.sourceKind === "official_directory").length,
      manual: actors.filter((actor) => actor.sourceKind === "manual_admin").length,
      administration: actors.filter((actor) => actor.actorType === "verwaltung").length,
    },
    guardrails: DEFAULT_DASHBOARD_GUARDRAILS,
  };
}

export { setRegionDataRepoForTests };
