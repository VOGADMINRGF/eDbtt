import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { z } from "zod";
import type {
  RegionIntelligenceSource,
  RegionIntelligenceSourceAdapterOverride,
} from "../intelligence";
import { runRegionIntelligencePreparation } from "../intelligence";
import type { Region } from "../contracts";
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
  regionSourceSnapshotSeedKindLabel,
  type RegionSourceConnection,
  type RegionSourceConnectionSampleItem,
  type RegionSourceConnectionType,
  type RegionSourceEvidenceReference,
  type RegionSourcePossibleClaim,
  type RegionSourceSnapshotSeedKind,
  type RegionSourceSnapshotTemplate,
  type RegionSourceSnapshotTemplateResult,
  type RegionSourceTestResult,
} from "../sourceConnections";

const REGION_SOURCE_CONNECTIONS_COLLECTION = "edebatte_region_source_connections";
const REGION_SOURCE_TEST_RESULTS_COLLECTION = "edebatte_region_source_test_results";
const DEFAULT_SOURCE_CONNECTION_FETCH_TIMEOUT_MS = 8_000;
const MAX_SOURCE_TEXT_LENGTH = 320;
const MAX_SOURCE_SUMMARY_LENGTH = 500;
const MAX_PAGE_TEXT_SCAN = 8_000;

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

export type SourceConnectionRepository = {
  listConnections(regionId?: string | null): Promise<RegionSourceConnection[]>;
  getConnectionById(id: string): Promise<RegionSourceConnection | null>;
  upsertConnection(connection: RegionSourceConnection): Promise<void>;
  getTestResultById(id: string): Promise<RegionSourceTestResult | null>;
  listTestResults(query?: {
    regionId?: string | null;
    connectionId?: string | null;
    limit?: number;
  }): Promise<RegionSourceTestResult[]>;
  saveTestResult(result: RegionSourceTestResult): Promise<void>;
};

export type RegionSourceConnectionRuntimeRepo = SourceConnectionRepository;

let repoSingleton: SourceConnectionRepository | null = null;
let indexesReady = false;

type RegionSourceUrlSnapshot = {
  status: "fetched" | "fetch_failed";
  title: string | null;
  summary: string | null;
  excerpt: string | null;
  evidenceReferences: RegionSourceEvidenceReference[];
  fallbackSampleItem: RegionSourceConnectionSampleItem | null;
};

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

function pickFirst(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return null;
}

function truncateText(value: string, maxLength = MAX_SOURCE_TEXT_LENGTH) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function decodeHtmlEntities(input: string) {
  return String(input ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(input: string) {
  return truncateText(
    decodeHtmlEntities(
      String(input ?? "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
    MAX_PAGE_TEXT_SCAN,
  );
}

function extractMetaContent(html: string, matcher: RegExp) {
  const match = html.match(matcher)?.[1];
  return match ? truncateText(decodeHtmlEntities(match), MAX_SOURCE_SUMMARY_LENGTH) : null;
}

function extractParagraphs(html: string) {
  return Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => truncateText(stripHtml(match[1]), MAX_SOURCE_TEXT_LENGTH))
    .filter((paragraph) => paragraph.length >= 40);
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

function inferDepartmentHints(input: string) {
  const haystack = input.toLowerCase();
  const departments: string[] = [];
  if (haystack.includes("schule") || haystack.includes("schul") || haystack.includes("bildung")) {
    departments.push("Schule/Bildung");
  }
  if (haystack.includes("verkehr") || haystack.includes("mobil") || haystack.includes("straße") || haystack.includes("strasse")) {
    departments.push("Verkehr/Mobilität");
  }
  if (haystack.includes("jugend") || haystack.includes("kita") || haystack.includes("famil")) {
    departments.push("Jugend/Familie");
  }
  if (haystack.includes("umwelt") || haystack.includes("klima") || haystack.includes("grün") || haystack.includes("gruen")) {
    departments.push("Umwelt/Klima");
  }
  if (haystack.includes("bau") || haystack.includes("wohnen") || haystack.includes("stadtentwicklung")) {
    departments.push("Bauen/Stadtentwicklung");
  }
  if (haystack.includes("gesundheit") || haystack.includes("sozial") || haystack.includes("pflege")) {
    departments.push("Soziales/Gesundheit");
  }
  if (haystack.includes("kultur") || haystack.includes("bibliothek")) {
    departments.push("Kultur");
  }
  return uniqueNonEmpty(departments);
}

function inferOrtsteilHints(input: string, regionName: string | null) {
  const regionTokens = uniqueNonEmpty(
    String(regionName ?? "")
      .split(/[\s,/()-]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length >= 3),
  );
  const blocked = new Set(
    uniqueNonEmpty([
      regionName,
      ...regionTokens,
      "Berlin",
      "Bezirksamt",
      "Bezirk",
      "Amt",
      "Verwaltung",
      "Stadt",
      "Gemeinde",
    ]),
  );
  return uniqueNonEmpty(
    Array.from(
      String(input ?? "").matchAll(
        /\b(?:in|im|am|für|bei)\s+([A-ZÄÖÜ][a-zäöüß]+(?:[-\s][A-ZÄÖÜ][a-zäöüß]+){0,2})/g,
      ),
    )
      .map((match) => match[1]?.trim() ?? "")
      .filter((entry) => entry.length >= 3 && !blocked.has(entry)),
  );
}

function buildSampleEvidenceReferences(items: RegionSourceConnectionSampleItem[]) {
  return items
    .slice(0, 3)
    .map((item, index) => ({
      label:
        index === 0
          ? `Quellensnapshot · ${item.title}`
          : `Quellensnapshot ${index + 1}`,
      url: item.url ?? null,
      excerpt: truncateText(item.summary, MAX_SOURCE_TEXT_LENGTH),
    }));
}

async function fetchExplicitUrlSnapshot(url: string | null): Promise<RegionSourceUrlSnapshot | null> {
  if (!String(url ?? "").trim()) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_SOURCE_CONNECTION_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(String(url).trim(), {
      headers: { "user-agent": "eDebatte/region-source-review (+https://edebatte.org)" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`source_fetch_failed_${response.status}`);
    }
    const html = await response.text();
    const paragraphs = extractParagraphs(html);
    const title = pickFirst(
      extractMetaContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i),
      extractMetaContent(html, /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["'][^>]*>/i),
      html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? null,
      paragraphs[0] ?? null,
    );
    const summary = pickFirst(
      extractMetaContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i),
      extractMetaContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i),
      paragraphs[0] ?? null,
      stripHtml(html),
    );
    const evidenceReferences = paragraphs.slice(0, 3).map((excerpt, index) => ({
      label:
        index === 0
          ? `Seitenauszug · ${title ?? "Explizite URL"}`
          : `Seitenauszug ${index + 1}`,
      url: String(url).trim(),
      excerpt,
    }));
    const excerpt =
      evidenceReferences[0]?.excerpt ??
      (truncateText(stripHtml(html), MAX_SOURCE_TEXT_LENGTH) || null);
    return {
      status: "fetched",
      title,
      summary: summary ? truncateText(summary, MAX_SOURCE_SUMMARY_LENGTH) : excerpt,
      excerpt,
      evidenceReferences,
      fallbackSampleItem:
        title || summary || excerpt
          ? {
              title: title ?? "Explizite URL",
              summary: truncateText(summary ?? excerpt ?? "", MAX_SOURCE_SUMMARY_LENGTH),
              url: String(url).trim(),
              detectedTopics: inferTopicsFromText(`${title ?? ""} ${summary ?? ""} ${excerpt ?? ""}`),
            }
          : null,
    };
  } catch {
    return {
      status: "fetch_failed",
      title: null,
      summary: null,
      excerpt: null,
      evidenceReferences: [
        {
          label: "Explizite URL",
          url: String(url).trim(),
          excerpt: null,
        },
      ],
      fallbackSampleItem: null,
    };
  } finally {
    clearTimeout(timeout);
  }
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

function mergeDryRunSampleItems(
  connection: RegionSourceConnection,
  snapshot: RegionSourceUrlSnapshot | null,
) {
  const items = normalizeSampleItems(connection.sampleItems);
  const extra = snapshot?.fallbackSampleItem ? [snapshot.fallbackSampleItem] : [];
  const merged = [...extra, ...items];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = `${String(item.url ?? "").trim()}::${item.title}::${item.summary}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function defaultSnapshotTemplateLabel(seedKind: RegionSourceSnapshotSeedKind) {
  return seedKind === "example_seed" ? "Beispiel-Snapshot" : "Regionales Snapshot-Template";
}

function buildConnectionSnapshotTemplate(input: {
  connectionId: string;
  sourceType: RegionSourceConnectionType;
  url: string | null;
  sampleItems: RegionSourceConnectionSampleItem[];
  snapshotSeedKind?: RegionSourceSnapshotSeedKind | null;
  snapshotTemplateLabel?: string | null;
}): RegionSourceSnapshotTemplate | null {
  if (input.sampleItems.length === 0) return null;
  const seedKind = input.snapshotSeedKind ?? "configured_region_source";
  const mode =
    input.sourceType === "curated_pilot_source" ? "template_only" : "template_plus_explicit_url";
  return {
    id: `region-source-snapshot-template-${input.connectionId}`,
    label:
      String(input.snapshotTemplateLabel ?? "").trim() ||
      defaultSnapshotTemplateLabel(seedKind),
    mode,
    seedKind,
    seedKindLabel: regionSourceSnapshotSeedKindLabel(seedKind),
    configuredUrl: String(input.url ?? "").trim() || null,
    isExampleSeed: seedKind === "example_seed",
    reviewHint:
      mode === "template_only"
        ? "Reproduzierbarer regionaler Snapshot aus explizit gesetzter Quelle. Review-first, kein Live-Crawler, kein Scraping und keine automatische Veröffentlichung."
        : "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
    noLiveCrawlerClaim: true,
    noScraping: true,
    noDeepSearchAutoCosts: true,
    noAutoPublish: true,
    noPublicOfficial: true,
  };
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

export function createMongoRegionSourceConnectionRuntimeRepo(): SourceConnectionRepository {
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

    async getTestResultById(id) {
      await ensureMongoIndexes();
      const col = await coreCol<RegionSourceTestResultDoc>(REGION_SOURCE_TEST_RESULTS_COLLECTION);
      return mapResultDoc(await col.findOne({ _id: id }));
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
}): SourceConnectionRepository {
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

    async getTestResultById(id) {
      const result = results.get(id);
      return result ? clone(result) : null;
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
  repo: SourceConnectionRepository | null,
) {
  repoSingleton = repo;
}

export function getSourceConnectionRepository(): SourceConnectionRepository {
  return getRepo();
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
  organizationId?: string | null;
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
  snapshotSeedKind?: RegionSourceSnapshotSeedKind | null;
  snapshotTemplateLabel?: string | null;
  userId: string | null;
  id?: string | null;
}): RegionSourceConnection {
  const now = buildIsoNow();
  const id =
    String(input.id ?? input.existing?.id ?? "").trim() ||
    `region-source-connection-${input.regionId}-${Date.now()}`;
  const sampleItems = normalizeSampleItems(input.sampleItems);
  return {
    id,
    regionId: input.regionId,
    organizationId: String(input.organizationId ?? input.existing?.organizationId ?? "").trim() || null,
    label: input.label,
    sourceType: input.sourceType,
    adapterId: regionSourceConnectionAdapterId(input.sourceType),
    url: String(input.url ?? "").trim() || null,
    notes: String(input.notes ?? "").trim() || null,
    enabled: input.enabled,
    sampleItems,
    sourceSnapshotTemplate: buildConnectionSnapshotTemplate({
      connectionId: id,
      sourceType: input.sourceType,
      url: String(input.url ?? "").trim() || null,
      sampleItems,
      snapshotSeedKind:
        input.snapshotSeedKind ??
        input.existing?.sourceSnapshotTemplate?.seedKind ??
        null,
      snapshotTemplateLabel:
        input.snapshotTemplateLabel ??
        input.existing?.sourceSnapshotTemplate?.label ??
        null,
    }),
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

function buildSnapshotTemplateResult(params: {
  connection: RegionSourceConnection;
  possibleClaims: RegionSourcePossibleClaim[];
  topicCandidates: Awaited<ReturnType<typeof runRegionIntelligencePreparation>>["topicClusterHints"];
  evidenceHints: RegionSourceEvidenceReference[];
  openQuestions: string[];
}): RegionSourceSnapshotTemplateResult | null {
  if (!params.connection.sourceSnapshotTemplate) return null;
  return {
    ...params.connection.sourceSnapshotTemplate,
    claimCandidates: params.possibleClaims,
    topicCandidates: params.topicCandidates,
    evidenceHints: params.evidenceHints,
    openQuestions: params.openQuestions,
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

function splitCandidateSentences(input: string) {
  return String(input ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => truncateText(sentence, MAX_SOURCE_TEXT_LENGTH))
    .filter((sentence) => sentence.length >= 28 && !sentence.includes("?"));
}

function buildPossibleClaims(params: {
  sourceSnapshot: RegionSourceUrlSnapshot | null;
  sampleItems: RegionSourceConnectionSampleItem[];
}) {
  const claims: RegionSourcePossibleClaim[] = [];
  const pushClaim = (
    text: string | null | undefined,
    confidence: number,
    basisLabel: RegionSourcePossibleClaim["basisLabel"],
    excerpt: string | null,
  ) => {
    const normalized = truncateText(String(text ?? ""), MAX_SOURCE_TEXT_LENGTH);
    if (!normalized || normalized.endsWith("?")) return;
    if (claims.some((claim) => claim.text === normalized)) return;
    claims.push({
      text: normalized,
      confidence: Number(confidence.toFixed(2)),
      basisLabel,
      excerpt: excerpt ? truncateText(excerpt, MAX_SOURCE_TEXT_LENGTH) : null,
      reviewRequired: true,
    });
  };

  pushClaim(params.sourceSnapshot?.title, 0.74, "Titel", params.sourceSnapshot?.excerpt ?? null);
  for (const sentence of splitCandidateSentences(params.sourceSnapshot?.summary ?? "")) {
    pushClaim(sentence, 0.68, "Zusammenfassung", params.sourceSnapshot?.excerpt ?? null);
  }
  for (const reference of params.sourceSnapshot?.evidenceReferences ?? []) {
    for (const sentence of splitCandidateSentences(reference.excerpt ?? "")) {
      pushClaim(sentence, 0.62, "Seitenauszug", reference.excerpt ?? null);
    }
  }
  for (const item of params.sampleItems) {
    pushClaim(item.title, 0.66, "Titel", item.summary);
    for (const sentence of splitCandidateSentences(item.summary)) {
      pushClaim(sentence, 0.6, "Zusammenfassung", item.summary);
    }
  }
  return claims.slice(0, 5);
}

function buildReviewTaskSummary(params: {
  possibleClaims: RegionSourcePossibleClaim[];
  preparation: Awaited<ReturnType<typeof runRegionIntelligencePreparation>>;
  evidenceReferences: RegionSourceEvidenceReference[];
}) {
  const claimCount = params.possibleClaims.length;
  const topicClusterCount = params.preparation.topicClusterHints.length;
  const dossierSuggestionCount = params.preparation.dossierSuggestionHints.length;
  const anlassraumSuggestionCount = params.preparation.anlassraumSuggestionHints.length;
  const openQuestionCount = params.preparation.openQuestions.length;
  const evidenceCount = params.evidenceReferences.length;
  return {
    claimCount,
    topicClusterCount,
    dossierSuggestionCount,
    anlassraumSuggestionCount,
    openQuestionCount,
    evidenceCount,
    label: `${claimCount} mögliche Aussagen · ${topicClusterCount} Themencluster · ${dossierSuggestionCount} Dossier-Vorschläge · ${anlassraumSuggestionCount} Anlassraum-Vorschläge · ${openQuestionCount} offene Fragen`,
  };
}

function buildDryRunSummary(params: {
  connection: RegionSourceConnection;
  sourceSnapshot: RegionSourceUrlSnapshot | null;
  reviewTaskSummary: ReturnType<typeof buildReviewTaskSummary>;
}) {
  if (params.connection.sourceSnapshotTemplate?.mode === "template_only") {
    return `${params.connection.sourceSnapshotTemplate.seedKindLabel} wurde reproduzierbar als reviewpflichtiger regionaler Source-Snapshot ausgewertet. ${params.reviewTaskSummary.label}. Alles bleibt review-first; kein Live-Crawler, kein Scraping, keine DeepSearch-Automatikkosten und keine automatische Veröffentlichung oder Amtlichkeit.`;
  }
  if (params.sourceSnapshot?.status === "fetch_failed" && params.connection.sampleItems.length === 0) {
    return "Explizite URL ist hinterlegt, konnte im kontrollierten Single-Page-Dry-Run aber nicht gelesen werden. Der Eintrag bleibt reviewpflichtig; bitte manuelle Stichpunkte oder einen erreichbaren Link ergänzen.";
  }
  if (params.sourceSnapshot?.status === "fetched") {
    const snapshotTail = params.connection.sourceSnapshotTemplate
      ? ` ${params.connection.sourceSnapshotTemplate.reviewHint}`
      : "";
    return `Explizite URL wurde kontrolliert als einzelne Seite ausgewertet. ${params.reviewTaskSummary.label}. Alles bleibt reviewpflichtig; kein Live-Crawler, kein Link-Following, kein Scraping im Sinne eines offenen Site-Crawls und keine automatische Veröffentlichung.${snapshotTail}`;
  }
  const sampleCount = params.connection.sampleItems.length;
  return sampleCount > 0
    ? `${sampleCount} vorbereitete Quellensnapshots wurden als reviewpflichtige Vorschläge verdichtet. ${params.reviewTaskSummary.label}. Keine automatische Veröffentlichung oder Amtlichkeit.`
    : "Quelle vorbereitet. Dry Run bleibt reviewpflichtig und erzeugt keine automatische Veröffentlichung oder Amtlichkeit.";
}

function buildAffectedScope(params: {
  region: Region;
  sourceSnapshot: RegionSourceUrlSnapshot | null;
  sampleItems: RegionSourceConnectionSampleItem[];
  detectedTopics: string[];
}) {
  const snapshotText = [
    params.sourceSnapshot?.title,
    params.sourceSnapshot?.summary,
    params.sourceSnapshot?.excerpt,
    ...params.sampleItems.map((item) => `${item.title} ${item.summary}`),
  ]
    .filter(Boolean)
    .join(" ");
  const detectedPlaces = uniqueNonEmpty([
    params.region.name,
    ...params.sampleItems.flatMap((item) => inferOrtsteilHints(`${item.title} ${item.summary}`, params.region.name)),
    ...inferOrtsteilHints(snapshotText, params.region.name),
  ]);
  return {
    regionName: params.region.name,
    detectedPlaces,
    ortsteilHints: uniqueNonEmpty(
      inferOrtsteilHints(snapshotText, params.region.name).filter((place) => place !== params.region.name),
    ),
    fachbereichHints: uniqueNonEmpty([
      ...inferDepartmentHints(`${snapshotText} ${params.detectedTopics.join(" ")}`),
      ...params.detectedTopics,
    ]).slice(0, 5),
  };
}

function buildDryRunPreparationInput(params: {
  connection: RegionSourceConnection;
  region: Region;
  sampleItems: RegionSourceConnectionSampleItem[];
  actorRole: string;
  organizationIds: string[];
}) {
  const expectedOutputs: Array<
    "topic_clusters" | "dossier_suggestions" | "anlassraum_suggestions" | "open_questions"
  > = [
    "topic_clusters",
    "dossier_suggestions",
    "anlassraum_suggestions",
    "open_questions",
  ];
  const connectionForSignals: RegionSourceConnection = {
    ...params.connection,
    sampleItems: params.sampleItems,
    enabled: true,
  };
  const sources: RegionIntelligenceSource[] = buildRegionSourceConnectionFeedSignals({
    connections: [connectionForSignals],
    regionNameById: new Map([[params.region.id, params.region.name]]),
  }).map((signal) => ({
    kind: "feed_signal" as const,
    signal,
  }));
  return {
    region: params.region,
    organization: {
      primaryOrganizationId: params.organizationIds[0] ?? null,
      organizationIds: params.organizationIds,
      actorRole: params.actorRole,
      entitlementStatus: null,
      verificationStatus: null,
      regionalActorLabels: uniqueNonEmpty([
        params.region.officialBody?.label ?? null,
        params.connection.label,
      ]),
    },
    orientation: {
      audience: "verwaltung_organisation" as const,
      goal: "Explizite URL reviewpflichtig als regionale Quelle auswerten",
      focusTopics: uniqueNonEmpty(
        params.sampleItems.flatMap((item) => item.detectedTopics),
      ),
      expectedOutputs,
    },
    sources,
    sourceAdapters: buildRegionIntelligenceSourceAdapterOverrides([connectionForSignals]),
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

export async function getRegionSourceTestResultById(id: string) {
  return getRepo().getTestResultById(String(id || "").trim());
}

export async function saveRegionSourceConnection(input: z.input<typeof RegionSourceConnectionUpsertSchema> & {
  userId: string | null;
  organizationId?: string | null;
}) {
  const {
    userId,
    organizationId,
    ...payload
  } = input;
  const parsed = RegionSourceConnectionUpsertSchema.parse(payload);
  const existing = parsed.id ? await getRepo().getConnectionById(parsed.id) : null;
  const connection = normalizeConnection({
    existing,
    regionId: parsed.regionId,
    organizationId,
    label: parsed.label,
    sourceType: parsed.sourceType,
    url: parsed.url ?? null,
    notes: parsed.notes ?? null,
    enabled: parsed.enabled ?? true,
    sampleItems: parsed.sampleItems ?? [],
    snapshotSeedKind: parsed.snapshotSeedKind ?? null,
    snapshotTemplateLabel: parsed.snapshotTemplateLabel ?? null,
    userId,
    id: parsed.id,
  });
  await getRepo().upsertConnection(connection);
  return connection;
}

export async function runRegionSourceConnectionDryRun(params: {
  connectionId: string;
  testedBy: string | null;
  region: Region;
  actorRole?: string | null;
  organizationIds?: string[] | null;
}) {
  const connection = await getRepo().getConnectionById(params.connectionId);
  if (!connection) throw new Error("source_connection_not_found");

  const sourceSnapshot =
    connection.sourceSnapshotTemplate?.mode === "template_only"
      ? null
      : await fetchExplicitUrlSnapshot(connection.url);
  const sampleItems = mergeDryRunSampleItems(connection, sourceSnapshot);
  const preparation = await runRegionIntelligencePreparation(
    buildDryRunPreparationInput({
      connection,
      region: params.region,
      sampleItems,
      actorRole: String(params.actorRole ?? "admin").trim() || "admin",
      organizationIds: uniqueNonEmpty(params.organizationIds ?? []),
    }),
  );
  const evidenceReferences = uniqueNonEmpty(
    [
      ...(sourceSnapshot?.evidenceReferences ?? []).map((reference) =>
        JSON.stringify(reference),
      ),
      ...buildSampleEvidenceReferences(sampleItems).map((reference) => JSON.stringify(reference)),
    ],
  )
    .slice(0, 5)
    .map((value) => JSON.parse(value) as RegionSourceEvidenceReference);
  const possibleClaims = buildPossibleClaims({
    sourceSnapshot,
    sampleItems,
  });
  const detectedTopics = uniqueNonEmpty(
    preparation.signalSeeds.flatMap((seed) => seed.detectedTopics),
  );
  const reviewTaskSummary = buildReviewTaskSummary({
    possibleClaims,
    preparation,
    evidenceReferences,
  });
  const sourceSnapshotTemplate = buildSnapshotTemplateResult({
    connection,
    possibleClaims,
    topicCandidates: preparation.topicClusterHints,
    evidenceHints: evidenceReferences,
    openQuestions: preparation.openQuestions,
  });
  const now = buildIsoNow();
  const result: RegionSourceTestResult = {
    id: `region-source-test-result-${connection.id}-${Date.now()}`,
    connectionId: connection.id,
    regionId: connection.regionId,
    organizationId: connection.organizationId ?? null,
    connectionLabel: connection.label,
    sourceType: connection.sourceType,
    adapterId: connection.adapterId,
    resultMode: "dry_run",
    title: buildDryRunTitle(connection),
    summary: buildDryRunSummary({
      connection,
      sourceSnapshot,
      reviewTaskSummary,
    }),
    configuredUrl: connection.url,
    detectedTopics: detectedTopics.length > 0 ? detectedTopics : buildDryRunTopics(connection),
    visibilityState: "internal_review",
    visibilityLabel: regionSourceResultVisibilityLabel("internal_review"),
    reviewStatus: "needs_review",
    confidence: confidenceForType(connection.sourceType),
    sourceSnapshotStatus:
      sourceSnapshot?.status ??
      (sampleItems.length > 0 ? "manual_only" : "fetch_failed"),
    sourceSnapshotTitle: sourceSnapshot?.title ?? sampleItems[0]?.title ?? null,
    sourceSnapshotSummary: sourceSnapshot?.summary ?? sampleItems[0]?.summary ?? null,
    sourceSnapshotExcerpt: sourceSnapshot?.excerpt ?? evidenceReferences[0]?.excerpt ?? null,
    sourceSnapshotTemplate,
    possibleClaims,
    topicClusters: preparation.topicClusterHints,
    dossierSuggestions: preparation.dossierSuggestionHints,
    anlassraumSuggestions: preparation.anlassraumSuggestionHints,
    evidenceReferences,
    openQuestions: preparation.openQuestions,
    affectedScope: buildAffectedScope({
      region: params.region,
      sourceSnapshot,
      sampleItems,
      detectedTopics,
    }),
    reviewSuggestions: preparation.reviewSuggestions,
    reviewTaskSummary,
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
