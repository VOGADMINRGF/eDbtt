import fs from "node:fs/promises";
import path from "node:path";

export type CivicFeedEntry =
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

export type CivicFeedsFile = {
  version?: number;
  regions?: Record<string, Record<string, string[]>>;
  feeds?: CivicFeedEntry[];
  notes?: string[];
};

export type FeedRef = {
  feedUrl: string;
  regionCode: string | null;
  topicHints: string[];
};

export function getFeedConfigPaths(scope: string): string[] {
  const fileName = `civic_feeds.${scope}.json`;
  const candidates = [
    path.join(process.cwd(), "core", "feeds", fileName),
    path.join(process.cwd(), "..", "core", "feeds", fileName),
    path.join(process.cwd(), "apps", "web", "core", "feeds", fileName),
  ];
  return Array.from(new Set(candidates.map((p) => path.resolve(p))));
}

export async function loadFeeds(scope: string): Promise<{
  config: CivicFeedsFile | null;
  searched: string[];
  source?: string | null;
}> {
  const searched = getFeedConfigPaths(scope);
  for (const file of searched) {
    try {
      const raw = await fs.readFile(file, "utf8");
      return { config: JSON.parse(raw) as CivicFeedsFile, searched, source: file };
    } catch {
      // try next
    }
  }
  return { config: null, searched };
}

export function normalizeFeedUrl(rawUrl?: string | null): string | null {
  const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!trimmed || /[<>]/.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname) return null;
    return trimmed;
  } catch {
    return null;
  }
}

export function collectFeedRefs(
  cfg: CivicFeedsFile,
  opts: { dedupeByRegion?: boolean } = {},
): {
  feedRefs: FeedRef[];
  invalidFeedUrls: string[];
} {
  const dedupeByRegion = Boolean(opts.dedupeByRegion);
  const map = new Map<string, FeedRef>();
  const invalid = new Set<string>();

  const pushRef = (url?: string | null, regionCode?: string | null, topicHint?: string | null) => {
    const normalizedUrl = normalizeFeedUrl(url);
    if (!normalizedUrl) {
      const raw = typeof url === "string" ? url.trim() : "";
      if (raw) invalid.add(raw);
      return;
    }

    const normalizedRegion = regionCode ? String(regionCode).trim() : null;
    const dedupeKey = dedupeByRegion
      ? `${(normalizedRegion ?? "").toUpperCase()}::${normalizedUrl.toLowerCase()}`
      : normalizedUrl.toLowerCase();
    const current = map.get(dedupeKey);
    const nextTopic = typeof topicHint === "string" ? topicHint.trim() : "";

    if (!current) {
      map.set(dedupeKey, {
        feedUrl: normalizedUrl,
        regionCode: normalizedRegion,
        topicHints: nextTopic ? [nextTopic] : [],
      });
      return;
    }

    if (nextTopic && !current.topicHints.includes(nextTopic)) {
      current.topicHints.push(nextTopic);
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

  return {
    feedRefs: Array.from(map.values()),
    invalidFeedUrls: Array.from(invalid.values()),
  };
}
