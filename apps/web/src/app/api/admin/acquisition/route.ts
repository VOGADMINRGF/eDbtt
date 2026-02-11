import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  createAcquisitionFetchRun,
  getLatestAcquisitionFetchRun,
  listAcquisitionFeedSources,
  updateAcquisitionFeedSource,
  upsertAcquisitionFeedSources,
  type AcquisitionFeedSource,
  type AcquisitionFeedStatus,
} from "@core/acquisition";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { adminConfig } from "@/config/admin-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CivicFeedsFile = {
  regions?: Record<string, Record<string, string[]>>;
  feeds?: CivicFeedEntry[];
};

type CivicFeedEntry =
  | string
  | {
      url?: string;
      feedUrl?: string;
      region?: string;
      regionCode?: string;
      topic?: string;
      topicHint?: string;
      source_type?: string;
      sourceType?: string;
    };

type FeedRef = {
  sourceKey: string;
  feedUrl: string;
  regionCode: string | null;
  topicHints: string[];
};

type ParsedArticle = {
  title: string;
  url: string;
  summary?: string | null;
  publishedAt?: string | null;
};

const FetchBodySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  timeoutMs: z.number().int().min(1000).max(30000).optional(),
});

const DEFAULT_TIMEOUT_MS = 8000;
const STOPWORDS = new Set([
  "und",
  "oder",
  "der",
  "die",
  "das",
  "mit",
  "von",
  "auf",
  "für",
  "aus",
  "bei",
  "nach",
  "über",
  "nicht",
  "mehr",
  "eine",
  "einer",
  "eines",
  "ein",
  "im",
  "in",
  "am",
  "an",
  "zu",
  "the",
  "and",
  "with",
  "from",
  "into",
  "for",
  "this",
  "that",
  "are",
  "was",
  "were",
  "has",
  "have",
  "will",
  "its",
]);

function getFeedConfigPaths(scope: string): string[] {
  const fileName = `civic_feeds.${scope}.json`;
  const candidates = [
    path.join(process.cwd(), "core", "feeds", fileName),
    path.join(process.cwd(), "..", "core", "feeds", fileName),
    path.join(process.cwd(), "apps", "web", "core", "feeds", fileName),
  ];
  return Array.from(new Set(candidates.map((p) => path.resolve(p))));
}

async function loadFeeds(scope: string): Promise<CivicFeedsFile | null> {
  const searched = getFeedConfigPaths(scope);
  for (const file of searched) {
    try {
      const raw = await fs.readFile(file, "utf8");
      return JSON.parse(raw) as CivicFeedsFile;
    } catch {
      // try next
    }
  }
  return null;
}

function normalizeTopicHints(hints: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const hint of hints) {
    const clean = String(hint ?? "").trim();
    if (clean) out.add(clean);
  }
  return Array.from(out);
}

function buildSourceKey(feedUrl: string, regionCode: string | null) {
  return `${(regionCode || "GLOBAL").toUpperCase()}::${feedUrl.toLowerCase()}`;
}

function collectFeedRefs(cfg: CivicFeedsFile | null): FeedRef[] {
  if (!cfg) return [];
  const map = new Map<string, FeedRef>();

  const pushRef = (url?: string | null, regionCode?: string | null, topicHint?: string | null) => {
    const feedUrl = typeof url === "string" ? url.trim() : "";
    if (!feedUrl) return;
    const key = buildSourceKey(feedUrl, regionCode ?? null);
    const existing = map.get(key);
    const nextHints = normalizeTopicHints([topicHint, ...(existing?.topicHints ?? [])]);
    if (existing) {
      existing.topicHints = nextHints;
    } else {
      map.set(key, {
        sourceKey: key,
        feedUrl,
        regionCode: regionCode ? String(regionCode).trim() : null,
        topicHints: nextHints,
      });
    }
  };

  for (const [regionCode, topics] of Object.entries(cfg.regions ?? {})) {
    for (const [topic, urls] of Object.entries(topics ?? {})) {
      for (const feedUrl of urls ?? []) {
        pushRef(feedUrl, regionCode, topic);
      }
    }
  }

  for (const entry of cfg.feeds ?? []) {
    if (!entry) continue;
    if (typeof entry === "string") {
      pushRef(entry, null, null);
      continue;
    }
    const url = entry.url ?? entry.feedUrl ?? null;
    const region = entry.regionCode ?? entry.region ?? null;
    const topicHint = entry.topicHint ?? entry.topic ?? entry.source_type ?? entry.sourceType ?? null;
    pushRef(url, region, topicHint);
  }

  return Array.from(map.values());
}

function unescapeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pickFirst(...vals: Array<string | null | undefined>): string | null {
  for (const v of vals) {
    const t = (v ?? "").trim();
    if (t) return t;
  }
  return null;
}

function toIsoDate(input?: string | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseRss(xml: string): ParsedArticle[] {
  const items = Array.from(xml.matchAll(/<item[\s\S]*?<\/item>/gi)).map((m) => m[0]);
  const out: ParsedArticle[] = [];

  for (const item of items) {
    const title = pickFirst(item.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
    const link = pickFirst(
      item.match(/<link>([\s\S]*?)<\/link>/i)?.[1],
      item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1],
    );
    const desc = pickFirst(
      item.match(/<description>([\s\S]*?)<\/description>/i)?.[1],
      item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1],
    );
    const pubDate = pickFirst(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]);

    if (!title || !link) continue;
    out.push({
      title: unescapeXml(title).trim(),
      url: unescapeXml(link).trim(),
      summary: desc ? unescapeXml(desc).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800) : null,
      publishedAt: toIsoDate(pubDate),
    });
  }
  return out;
}

function parseAtom(xml: string): ParsedArticle[] {
  const entries = Array.from(xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)).map((m) => m[0]);
  const out: ParsedArticle[] = [];

  for (const entry of entries) {
    const title = pickFirst(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
    const link = pickFirst(entry.match(/<link[^>]+href="([^"]+)"[^>]*\/?\s*>/i)?.[1]);
    const summary = pickFirst(
      entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1],
      entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1],
    );
    const updated = pickFirst(
      entry.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1],
      entry.match(/<published>([\s\S]*?)<\/published>/i)?.[1],
    );

    if (!title || !link) continue;
    out.push({
      title: unescapeXml(title).trim(),
      url: unescapeXml(link).trim(),
      summary: summary ? unescapeXml(summary).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800) : null,
      publishedAt: toIsoDate(updated),
    });
  }
  return out;
}

async function fetchAndParseFeed(feedUrl: string, timeoutMs: number): Promise<ParsedArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(feedUrl, {
      headers: { "user-agent": "eDebatte/acquisition (+https://edebatte.org)" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`feed_fetch_failed ${res.status}`);
    const xml = await res.text();
    const lower = xml.toLowerCase();
    if (lower.includes("<feed") && lower.includes("http://www.w3.org/2005/atom")) {
      return parseAtom(xml);
    }
    return parseRss(xml);
  } finally {
    clearTimeout(timeout);
  }
}

function extractTopTopics(items: ParsedArticle[], fallback: string[]): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const words = item.title
      .toLowerCase()
      .split(/[^a-z0-9äöüß]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length > 3 && !STOPWORDS.has(word));
    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  const topics: string[] = [];
  for (const hint of fallback) {
    if (!topics.includes(hint)) topics.push(hint);
  }
  for (const word of ranked) {
    if (topics.length >= 3) break;
    if (!topics.includes(word)) topics.push(word);
  }
  return topics.slice(0, 3);
}

function summarizeRegions(sources: AcquisitionFeedSource[]) {
  const map = new Map<
    string,
    {
      regionCode: string;
      feedCount: number;
      lastFetchedAt: string | null;
      status: "ok" | "warning" | "error";
      topTopics: Map<string, number>;
    }
  >();

  for (const source of sources) {
    const regionCode = (source.regionCode || "GLOBAL").toUpperCase();
    const entry = map.get(regionCode) ?? {
      regionCode,
      feedCount: 0,
      lastFetchedAt: null,
      status: "ok" as const,
      topTopics: new Map<string, number>(),
    };

    entry.feedCount += 1;
    const lastFetched = source.lastFetchedAt ? new Date(source.lastFetchedAt).toISOString() : null;
    if (lastFetched && (!entry.lastFetchedAt || lastFetched > entry.lastFetchedAt)) {
      entry.lastFetchedAt = lastFetched;
    }

    if (source.status === "error") entry.status = "error";
    else if (source.status === "empty" && entry.status === "ok") entry.status = "warning";

    const topics = source.topTopics?.length ? source.topTopics : source.topicHints ?? [];
    for (const topic of topics) {
      const key = topic.trim();
      if (!key) continue;
      entry.topTopics.set(key, (entry.topTopics.get(key) ?? 0) + 1);
    }

    map.set(regionCode, entry);
  }

  return Array.from(map.values())
    .map((entry) => ({
      regionCode: entry.regionCode,
      feedCount: entry.feedCount,
      lastFetchedAt: entry.lastFetchedAt,
      status: entry.status,
      topTopics: Array.from(entry.topTopics.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([topic]) => topic)
        .slice(0, 3),
    }))
    .sort((a, b) => a.regionCode.localeCompare(b.regionCode));
}

async function ensureSourcesFromConfig(): Promise<FeedRef[]> {
  const cfgDe = await loadFeeds("de");
  const cfgGlobal = await loadFeeds("global");
  const refs = [...collectFeedRefs(cfgDe), ...collectFeedRefs(cfgGlobal)];
  await upsertAcquisitionFeedSources(
    refs.map((ref) => ({
      sourceKey: ref.sourceKey,
      feedUrl: ref.feedUrl,
      regionCode: ref.regionCode,
      topicHints: ref.topicHints,
    })),
  );
  return refs;
}

async function checkFeed(ref: FeedRef, timeoutMs: number) {
  const now = new Date();
  if (!/^https?:\/\//i.test(ref.feedUrl) || /<|>/.test(ref.feedUrl)) {
    return {
      status: "error" as AcquisitionFeedStatus,
      itemCount: 0,
      lastItemAt: null,
      topTopics: ref.topicHints,
      error: "invalid_feed_url",
      lastFetchedAt: now,
    };
  }

  try {
    const items = await fetchAndParseFeed(ref.feedUrl, timeoutMs);
    const itemCount = items.length;
    const lastItemAt =
      items
        .map((item) => item.publishedAt)
        .filter(Boolean)
        .map((value) => new Date(value as string))
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    const topTopics = extractTopTopics(items.slice(0, 12), ref.topicHints);
    return {
      status: itemCount > 0 ? ("ok" as AcquisitionFeedStatus) : ("empty" as AcquisitionFeedStatus),
      itemCount,
      lastItemAt: lastItemAt ? lastItemAt.toISOString() : null,
      topTopics,
      error: itemCount > 0 ? null : "no_items",
      lastFetchedAt: now,
    };
  } catch (err: any) {
    const message = err?.name === "AbortError" ? "feed_timeout" : err?.message ?? "feed_error";
    return {
      status: "error" as AcquisitionFeedStatus,
      itemCount: 0,
      lastItemAt: null,
      topTopics: ref.topicHints,
      error: message,
      lastFetchedAt: now,
    };
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  await ensureSourcesFromConfig();
  const sources = await listAcquisitionFeedSources();
  const latestRun = await getLatestAcquisitionFetchRun();
  const regions = summarizeRegions(sources);

  return NextResponse.json({ ok: true, regions, sources, latestRun });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const raw = await req.json().catch(() => ({}));
  const parsed = FetchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  const refs = await ensureSourcesFromConfig();
  const sources = await listAcquisitionFeedSources();
  const limit = Math.min(
    parsed.data.limit ?? adminConfig.limits.newsfeedMaxPerRun,
    adminConfig.limits.newsfeedMaxPerRun,
    refs.length,
  );
  const timeoutMs = parsed.data.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let okFeeds = 0;
  let emptyFeeds = 0;
  let errorFeeds = 0;

  const startedAt = new Date();
  const toFetch = refs.slice(0, limit);

  for (const ref of toFetch) {
    const result = await checkFeed(ref, timeoutMs);
    await updateAcquisitionFeedSource(ref.sourceKey, {
      status: result.status,
      itemCount: result.itemCount,
      lastFetchedAt: result.lastFetchedAt,
      lastItemAt: result.lastItemAt,
      topTopics: result.topTopics,
      error: result.error,
    });
    if (result.status === "ok") okFeeds += 1;
    else if (result.status === "empty") emptyFeeds += 1;
    else errorFeeds += 1;
  }

  const finishedAt = new Date();
  await createAcquisitionFetchRun({
    startedAt,
    finishedAt,
    totalFeeds: toFetch.length,
    okFeeds,
    emptyFeeds,
    errorFeeds,
  });

  logger.info({
    msg: "admin.acquisition.fetch_run",
    totalFeeds: toFetch.length,
    okFeeds,
    emptyFeeds,
    errorFeeds,
  });

  const updatedSources = await listAcquisitionFeedSources();
  const regions = summarizeRegions(updatedSources);
  const latestRun = await getLatestAcquisitionFetchRun();

  return NextResponse.json({
    ok: true,
    regions,
    sources: updatedSources,
    latestRun,
  });
}
