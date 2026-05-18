import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { z } from "zod";
import type {
  RegionIntelligenceSourceAdapterOverride,
} from "../intelligence";
import {
  parseRegionFeedSignal,
  type RegionFeedSignal,
  buildSourceConnectionRegionSignalProvenance,
} from "../regionFeedSignals";
import {
  RegionSourceConnectionUpsertSchema,
  regionSourceConnectionAdapterId,
  regionSourceConnectionTypeLabel,
  regionSourceResultVisibilityLabel,
  type RegionSourceConnection,
  type RegionSourceConnectionSampleItem,
  type RegionSourceConnectionType,
  type RegionSourceTestResult,
} from "../sourceConnections";

const REGION_SOURCE_CONNECTIONS_COLLECTION = "edebatte_region_source_connections";
const REGION_SOURCE_TEST_RESULTS_COLLECTION = "edebatte_region_source_test_results";

type RegionSourceConnectionDoc = {
  _id: string;
  connection: RegionSourceConnection;
  createdAt: Date;
  updatedAt: Date;
};

type RegionSourceTestResultDoc = {
  _id: string;
  result: RegionSourceTestResult;
  createdAt: Date;
  updatedAt: Date;
};

export type RegionSourceConnectionRuntimeRepo = {
  listConnections(regionId?: string | null): Promise<RegionSourceConnection[]>;
  getConnectionById(id: string): Promise<RegionSourceConnection | null>;
  upsertConnection(connection: RegionSourceConnection): Promise<void>;
  listTestResults(query?: {
    regionId?: string | null;
    connectionId?: string | null;
    limit?: number;
  }): Promise<RegionSourceTestResult[]>;
  saveTestResult(result: RegionSourceTestResult): Promise<void>;
};

let repoSingleton: RegionSourceConnectionRuntimeRepo | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildIsoNow() {
  return new Date().toISOString();
}

function normalizeLimit(value: unknown, fallback = 50) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.max(1, Math.min(200, Math.floor(numeric)));
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
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

function inferTopicsFromText(input: string) {
  const haystack = input.toLowerCase();
  const topics: string[] = [];
  if (haystack.includes("schule") || haystack.includes("schul")) topics.push("Schule");
  if (haystack.includes("verkehr")) topics.push("Verkehr");
  if (haystack.includes("jugend")) topics.push("Jugend");
  if (haystack.includes("klima")) topics.push("Klima");
  if (haystack.includes("kultur")) topics.push("Kultur");
  if (haystack.includes("nachbarschaft") || haystack.includes("kiez")) topics.push("Nachbarschaft");
  return uniqueNonEmpty(topics);
}

function normalizeSampleItems(
  items:
    | Array<{
        title: string;
        summary: string;
        url?: string | null;
        detectedTopics?: string[];
      }>
    | undefined,
): RegionSourceConnectionSampleItem[] {
  return (items ?? []).map((item) => ({
    title: String(item.title ?? "").trim(),
    summary: String(item.summary ?? "").trim(),
    url: String(item.url ?? "").trim() || null,
    detectedTopics: uniqueNonEmpty(
      item.detectedTopics?.length
        ? item.detectedTopics
        : inferTopicsFromText(`${item.title} ${item.summary}`),
    ),
  }));
}

function isProductiveSourceConnection(connection: RegionSourceConnection) {
  return connection.sourceType === "official_feed" || connection.sourceType === "municipal_news";
}

function hasConnectedSnapshot(connection: RegionSourceConnection) {
  return connection.enabled && isProductiveSourceConnection(connection) && connection.sampleItems.length > 0;
}

async function ensureMongoIndexes() {
  if (indexesReady) return;
  const [connections, results] = await Promise.all([
    coreCol<RegionSourceConnectionDoc>(REGION_SOURCE_CONNECTIONS_COLLECTION),
    coreCol<RegionSourceTestResultDoc>(REGION_SOURCE_TEST_RESULTS_COLLECTION),
  ]);
  await Promise.all([
    connections.createIndex({ "connection.regionId": 1, "connection.updatedAt": -1 }),
    connections.createIndex({ "connection.sourceType": 1, "connection.enabled": 1 }),
    results.createIndex({ "result.regionId": 1, "result.updatedAt": -1 }),
    results.createIndex({ "result.connectionId": 1, "result.updatedAt": -1 }),
  ]);
  indexesReady = true;
}

function mapConnectionDoc(doc: RegionSourceConnectionDoc | null): RegionSourceConnection | null {
  if (!doc?.connection) return null;
  return clone(doc.connection);
}

function mapResultDoc(doc: RegionSourceTestResultDoc | null): RegionSourceTestResult | null {
  if (!doc?.result) return null;
  return clone(doc.result);
}

export function createMongoRegionSourceConnectionRuntimeRepo(): RegionSourceConnectionRuntimeRepo {
  return {
    async listConnections(regionId) {
      await ensureMongoIndexes();
      const col = await coreCol<RegionSourceConnectionDoc>(REGION_SOURCE_CONNECTIONS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (String(regionId ?? "").trim()) filter["connection.regionId"] = String(regionId).trim();
      const docs = await col.find(filter).sort({ "connection.updatedAt": -1 }).toArray();
      return docs
        .map((doc) => mapConnectionDoc(doc))
        .filter((entry): entry is RegionSourceConnection => Boolean(entry));
    },

    async getConnectionById(id) {
      await ensureMongoIndexes();
      const col = await coreCol<RegionSourceConnectionDoc>(REGION_SOURCE_CONNECTIONS_COLLECTION);
      return mapConnectionDoc(await col.findOne({ _id: id }));
    },

    async upsertConnection(connection) {
      await ensureMongoIndexes();
      const col = await coreCol<RegionSourceConnectionDoc>(REGION_SOURCE_CONNECTIONS_COLLECTION);
      const now = new Date();
      await col.updateOne(
        { _id: connection.id },
        {
          $set: {
            connection: clone(connection),
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );
    },

    async listTestResults(query = {}) {
      await ensureMongoIndexes();
      const col = await coreCol<RegionSourceTestResultDoc>(REGION_SOURCE_TEST_RESULTS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (String(query.regionId ?? "").trim()) filter["result.regionId"] = String(query.regionId).trim();
      if (String(query.connectionId ?? "").trim()) {
        filter["result.connectionId"] = String(query.connectionId).trim();
      }
      const docs = await col
        .find(filter)
        .sort({ "result.updatedAt": -1 })
        .limit(normalizeLimit(query.limit))
        .toArray();
      return docs
        .map((doc) => mapResultDoc(doc))
        .filter((entry): entry is RegionSourceTestResult => Boolean(entry));
    },

    async saveTestResult(result) {
      await ensureMongoIndexes();
      const col = await coreCol<RegionSourceTestResultDoc>(REGION_SOURCE_TEST_RESULTS_COLLECTION);
      const now = new Date();
      await col.updateOne(
        { _id: result.id },
        {
          $set: {
            result: clone(result),
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );
    },
  };
}

export function createInMemoryRegionSourceConnectionRuntimeRepo(seed?: {
  connections?: RegionSourceConnection[];
  results?: RegionSourceTestResult[];
}): RegionSourceConnectionRuntimeRepo {
  const connections = new Map<string, RegionSourceConnection>();
  const results = new Map<string, RegionSourceTestResult>();
  for (const connection of seed?.connections ?? []) {
    connections.set(connection.id, clone(connection));
  }
  for (const result of seed?.results ?? []) {
    results.set(result.id, clone(result));
  }

  return {
    async listConnections(regionId) {
      return Array.from(connections.values())
        .map((entry) => clone(entry))
        .filter((entry) => (String(regionId ?? "").trim() ? entry.regionId === String(regionId).trim() : true))
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },

    async getConnectionById(id) {
      const entry = connections.get(id);
      return entry ? clone(entry) : null;
    },

    async upsertConnection(connection) {
      connections.set(connection.id, clone(connection));
    },

    async listTestResults(query = {}) {
      return Array.from(results.values())
        .map((entry) => clone(entry))
        .filter((entry) => (String(query.regionId ?? "").trim() ? entry.regionId === String(query.regionId).trim() : true))
        .filter((entry) =>
          String(query.connectionId ?? "").trim()
            ? entry.connectionId === String(query.connectionId).trim()
            : true,
        )
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
        .slice(0, normalizeLimit(query.limit));
    },

    async saveTestResult(result) {
      results.set(result.id, clone(result));
    },
  };
}

function getRepo() {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryRegionSourceConnectionRuntimeRepo();
    return repoSingleton;
  }
  if (!repoSingleton) repoSingleton = createMongoRegionSourceConnectionRuntimeRepo();
  return repoSingleton;
}

export function setRegionSourceConnectionRuntimeRepoForTests(
  repo: RegionSourceConnectionRuntimeRepo | null,
) {
  repoSingleton = repo;
}

function confidenceForType(sourceType: RegionSourceConnectionType) {
  switch (sourceType) {
    case "curated_pilot_source":
      return 0.76;
    case "official_feed":
    case "municipal_news":
      return 0.68;
    case "manual_source":
    default:
      return 0.61;
  }
}

function buildDryRunSummary(connection: RegionSourceConnection) {
  const sampleCount = connection.sampleItems.length;
  if (connection.sourceType === "official_feed" || connection.sourceType === "municipal_news") {
    return sampleCount > 0
      ? `Explizite URL vorbereitet. ${sampleCount} Testeintraege wurden nur als reviewpflichtige Quelle ausgewertet. Kein Live-Crawler, kein Scraping.`
      : `Explizite URL vorbereitet. Dry Run bleibt reviewpflichtig und fuehrt keine automatische Abfrage aus. Kein Live-Crawler, kein Scraping.`;
  }
  if (connection.sourceType === "curated_pilot_source") {
    return sampleCount > 0
      ? `${sampleCount} kuratierte Testeintraege wurden als Pilotvorschau ausgewertet. Keine automatische Veroeffentlichung.`
      : "Kuratierte Pilotquelle vorbereitet. Dry Run bleibt reviewpflichtig und nicht amtlich.";
  }
  return sampleCount > 0
    ? `${sampleCount} manuelle Testeintraege wurden reviewpflichtig ausgewertet. Keine automatische Veroeffentlichung.`
    : "Manuelle Quelle vorbereitet. Dry Run bleibt reviewpflichtig und nicht amtlich.";
}

function buildDryRunTitle(connection: RegionSourceConnection) {
  return `${connection.label} · Dry Run`;
}

function buildDryRunTopics(connection: RegionSourceConnection) {
  const fromSamples = uniqueNonEmpty(
    connection.sampleItems.flatMap((item) => item.detectedTopics),
  );
  if (fromSamples.length > 0) return fromSamples;
  return uniqueNonEmpty(
    inferTopicsFromText(
      `${connection.label} ${connection.notes ?? ""} ${connection.url ?? ""} ${regionSourceConnectionTypeLabel(connection.sourceType)}`,
    ),
  );
}

function normalizeConnection(input: {
  existing?: RegionSourceConnection | null;
  regionId: string;
  label: string;
  sourceType: RegionSourceConnectionType;
  url: string | null;
  notes: string | null;
  enabled: boolean;
  sampleItems: Array<{
    title: string;
    summary: string;
    url?: string | null;
    detectedTopics?: string[];
  }>;
  userId: string | null;
  id?: string | null;
}): RegionSourceConnection {
  const now = buildIsoNow();
  const id =
    String(input.id ?? input.existing?.id ?? "").trim() ||
    `region-source-connection-${input.regionId}-${Date.now()}`;
  return {
    id,
    regionId: input.regionId,
    label: input.label,
    sourceType: input.sourceType,
    adapterId: regionSourceConnectionAdapterId(input.sourceType),
    url: String(input.url ?? "").trim() || null,
    notes: String(input.notes ?? "").trim() || null,
    enabled: input.enabled,
    sampleItems: normalizeSampleItems(input.sampleItems),
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: input.existing?.createdBy ?? input.userId,
    updatedBy: input.userId,
    reviewRequired: true,
    noLiveCrawlerClaim: true,
    noScraping: true,
    noDeepSearchAutoCosts: true,
  };
}

function feedSignalSourceType(connection: RegionSourceConnection): RegionFeedSignal["sourceType"] {
  return connection.sourceType === "official_feed" ? "official_update" : "news";
}

function feedSignalConfidence(connection: RegionSourceConnection) {
  return connection.sourceType === "official_feed" ? 0.74 : 0.69;
}

function feedSignalSuggestedAction(
  connection: RegionSourceConnection,
): RegionFeedSignal["suggestedAction"] {
  return connection.sourceType === "official_feed"
    ? "attach_source_to_dossier"
    : "ask_clarifying_question";
}

function buildOpenQuestions(
  connection: RegionSourceConnection,
  detectedTopics: string[],
) {
  if (detectedTopics.length > 0) {
    return [`Welche nächsten Prüfschritte ergeben sich aus ${detectedTopics[0]}?`];
  }
  return [`Welche nächsten Prüfschritte ergeben sich aus ${connection.label}?`];
}

function buildSuggestedTitles(params: {
  connection: RegionSourceConnection;
  regionName: string;
  detectedTopics: string[];
}) {
  const topic = params.detectedTopics[0] ?? params.connection.label;
  return {
    anlassraum:
      params.connection.sourceType === "municipal_news"
        ? `${topic} ${params.regionName}`
        : null,
    dossier: `${params.regionName}: ${topic}`,
  };
}

export async function listRegionSourceConnections(regionId?: string | null) {
  return getRepo().listConnections(regionId);
}

export async function listRegionSourceTestResults(query: {
  regionId?: string | null;
  connectionId?: string | null;
  limit?: number;
} = {}) {
  return getRepo().listTestResults(query);
}

export async function saveRegionSourceConnection(input: z.input<typeof RegionSourceConnectionUpsertSchema> & {
  userId: string | null;
}) {
  const parsed = RegionSourceConnectionUpsertSchema.parse(input);
  const existing = parsed.id ? await getRepo().getConnectionById(parsed.id) : null;
  const connection = normalizeConnection({
    existing,
    regionId: parsed.regionId,
    label: parsed.label,
    sourceType: parsed.sourceType,
    url: parsed.url ?? null,
    notes: parsed.notes ?? null,
    enabled: parsed.enabled ?? true,
    sampleItems: parsed.sampleItems ?? [],
    userId: input.userId,
    id: parsed.id,
  });
  await getRepo().upsertConnection(connection);
  return connection;
}

export async function runRegionSourceConnectionDryRun(params: {
  connectionId: string;
  testedBy: string | null;
}) {
  const connection = await getRepo().getConnectionById(params.connectionId);
  if (!connection) throw new Error("source_connection_not_found");

  const now = buildIsoNow();
  const result: RegionSourceTestResult = {
    id: `region-source-test-result-${connection.id}-${Date.now()}`,
    connectionId: connection.id,
    regionId: connection.regionId,
    connectionLabel: connection.label,
    sourceType: connection.sourceType,
    adapterId: connection.adapterId,
    resultMode: "dry_run",
    title: buildDryRunTitle(connection),
    summary: buildDryRunSummary(connection),
    configuredUrl: connection.url,
    detectedTopics: buildDryRunTopics(connection),
    visibilityState: "internal_review",
    visibilityLabel: regionSourceResultVisibilityLabel("internal_review"),
    reviewStatus: "needs_review",
    confidence: confidenceForType(connection.sourceType),
    createdAt: now,
    updatedAt: now,
    testedBy: params.testedBy,
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
  };
  await getRepo().saveTestResult(result);
  return result;
}

export function buildRegionSourceConnectionFeedSignals(params: {
  connections: RegionSourceConnection[];
  regionNameById?: Map<string, string> | Record<string, string>;
}) {
  const nameForRegion = (regionId: string) => {
    if (params.regionNameById instanceof Map) {
      return params.regionNameById.get(regionId) ?? regionId;
    }
    return params.regionNameById?.[regionId] ?? regionId;
  };

  return params.connections
    .filter((connection) => hasConnectedSnapshot(connection))
    .flatMap((connection) =>
      connection.sampleItems.map((item, index) => {
        const regionName = nameForRegion(connection.regionId);
        const detectedTopics = uniqueNonEmpty(
          item.detectedTopics?.length
            ? item.detectedTopics
            : inferTopicsFromText(`${item.title} ${item.summary} ${connection.notes ?? ""}`),
        );
        const suggestedTitles = buildSuggestedTitles({
          connection,
          regionName,
          detectedTopics,
        });
        return parseRegionFeedSignal({
          id: `region-source-feed-signal-${connection.id}-${index + 1}`,
          kind: "region_feed_signal",
          regionId: connection.regionId,
          sourceId: connection.id,
          sourceType: feedSignalSourceType(connection),
          title: item.title,
          summary: item.summary,
          url: item.url ?? connection.url ?? null,
          publishedAt: connection.updatedAt ?? null,
          detectedTopics,
          detectedPlaces: [regionName],
          relatedClaims: [],
          relatedDossiers: [],
          relatedAnlassraumIds: [],
          suggestedAction: feedSignalSuggestedAction(connection),
          confidence: feedSignalConfidence(connection),
          reviewStatus: "needs_review",
          noAutoPublish: true,
          noAutoCreateDossier: true,
          noAutoCreateAnlassraum: true,
          noTenderMonitoring: true,
          noProcurementMonitoring: true,
          provenance: buildSourceConnectionRegionSignalProvenance(),
          clusterKey: slugify(`${regionName}-${detectedTopics[0] ?? connection.label}`),
          openQuestions: buildOpenQuestions(connection, detectedTopics),
          reviewHint:
            "Explizit verbundene produktive Quelle. Sichtbar heißt nicht automatisch geprüft oder amtlich.",
          suggestedAnlassraumTitle: suggestedTitles.anlassraum,
          suggestedDossierTitle: suggestedTitles.dossier,
        });
      }),
    );
}

export function buildRegionIntelligenceSourceAdapterOverrides(
  connections: RegionSourceConnection[],
): RegionIntelligenceSourceAdapterOverride[] {
  const activeConnections = connections.filter((connection) => connection.enabled);
  const byAdapter = new Map<
    RegionSourceConnection["adapterId"],
    RegionSourceConnection[]
  >();
  for (const connection of activeConnections) {
    if (!byAdapter.has(connection.adapterId)) byAdapter.set(connection.adapterId, []);
    byAdapter.get(connection.adapterId)?.push(connection);
  }

  return Array.from(byAdapter.entries()).map(([adapterId, entries]) => ({
    adapterId,
    label:
      entries.length === 1
        ? entries[0]?.label
        : `${entries.length} ${regionSourceConnectionTypeLabel(entries[0]?.sourceType ?? "manual_source")} konfiguriert`,
    status: entries.some((entry) => hasConnectedSnapshot(entry)) ? "connected" : "configured",
    connected: entries.some((entry) => hasConnectedSnapshot(entry)),
  }));
}
