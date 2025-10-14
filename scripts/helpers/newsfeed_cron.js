#!/usr/bin/env node
// Newsfeed Dry-Run / Ingest Driver (robust ohne ts-node-Zwang)

const fs = require("fs");
const path = require("path");

// tiny arg parser
const args = process.argv.slice(2);
const flags = new Map();
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const k = args[i].slice(2);
    const v = (i + 1 < args.length && !args[i + 1].startsWith("--")) ? args[i + 1] : "true";
    flags.set(k, v);
    if (v !== "true") i++;
  }
}
const limit = Number(flags.get("limit") || 25);
const region = flags.get("region") || "";
const dry = flags.has("dry");

// util (fixed!)
function pathJoin(...parts) {
  return parts.join("/").replace(/\\/g, "/");
}

// Try to load pipeline from TS (with ts-node) or JS fallback or inline minimal runner
(async () => {
  let fetchFeeds = null;
  let toDraftVotes = null;

  const tsPath = pathJoin(process.cwd(), "apps/web/src/features/newsfeed/pipeline.ts");
  const jsPath = tsPath.replace(/\.ts$/, ".js");

  // 1) Try ts-node
  try {
    try { require("ts-node/register/transpile-only"); } catch { require("ts-node/register"); }
    const mod = await import("file://" + tsPath);
    fetchFeeds = mod.fetchFeeds || null;
    toDraftVotes = mod.toDraftVotes || null;
  } catch {
    // ignore, try JS or inline
  }

  // 2) Try compiled JS sibling
  if (!fetchFeeds && fs.existsSync(jsPath)) {
    const mod = require(jsPath);
    fetchFeeds = mod.fetchFeeds || null;
    toDraftVotes = mod.toDraftVotes || null;
  }

  // 3) Inline minimal fallback (uses rss-parser directly)
  if (!fetchFeeds) {
    const Parser = require("rss-parser");
    const crypto = require("crypto");
    const parser = new Parser();

    // Simple default feeds (region wird nur durchgereicht)
    const DEFAULT_FEEDS = [
      { url: "https://www.bundestag.de/static/aktuell/rss", regionKey: "DE" },
      { url: "https://www.tagesschau.de/xml/rss2", regionKey: "DE" },
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml", regionKey: "GLOBAL" },
    ];

    fetchFeeds = async (lim = 25, regionKey = "") => {
      const out = [];
      for (const f of DEFAULT_FEEDS) {
        try {
          const feed = await parser.parseURL(f.url);
          for (const it of feed.items.slice(0, lim)) {
            const id = crypto.createHash("sha256").update((it.link || it.title || "")).digest("hex");
            out.push({
              id,
              title: it.title || "",
              link: it.link || "",
              isoDate: it.isoDate,
              contentSnippet: it.contentSnippet,
              regionKey: f.regionKey,
            });
          }
        } catch { /* skip */ }
      }
      // dedupe
      const byId = new Map();
      for (const i of out) if (!byId.has(i.id)) byId.set(i.id, i);
      return Array.from(byId.values()).slice(0, lim);
    };

    toDraftVotes = async (items) => {
      // naive trust placeholder
      const score = (url) => {
        try {
          const host = new URL(url).hostname;
          if (/(bundestag\.de|tagesschau\.de|bbc\.co\.uk)$/.test(host)) return 5;
        } catch {}
        return 3;
      };
      return items.map((i) => ({
        title: i.title,
        link: i.link,
        regionKey: i.regionKey || region,
        trust: score(i.link),
        factState: "unverified",
      }));
    };
  }

  // Run
  const items = await fetchFeeds(limit, region || undefined);
  const drafts = await toDraftVotes(items);
  const result = { ok: true, count: drafts.length, sample: drafts.slice(0, 3) };

  console.log(JSON.stringify(result, null, 2));

  // Persistenz ist absichtlich aus – dieser Driver bleibt dry unless you wire it
  if (!dry) {
    // Hier könntest du Mongo-Upserts einfügen (news_drafts) – siehe vorherige Nachricht (#2 API-Route)
  }
})();
