#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
APP="$ROOT/apps/web"

echo "→ Install utils"
pnpm -w add iconv-lite he fast-xml-parser

mkdir -p "$APP/src/app/api/search/civic" "$APP/src/app/api/_utils"

# Charset/Decode-Utils
cat > "$APP/src/app/api/_utils/charset.ts" <<'TS'
import * as iconv from "iconv-lite";

export function sniffCharsetFromHeaders(h: Headers): string|undefined {
  const ct = h.get("content-type") || "";
  const m = /charset=([^;]+)/i.exec(ct);
  return m?.[1]?.trim()?.toLowerCase();
}

export function sniffCharsetFromXml(buf: Buffer): string|undefined {
  // <?xml version="1.0" encoding="iso-8859-1"?>
  const head = buf.subarray(0, 200).toString("ascii");
  const m = /encoding=["']([^"']+)["']/i.exec(head);
  return m?.[1]?.trim()?.toLowerCase();
}

export function decodeWithCharset(buf: Buffer, charset?: string): string {
  const cs = (charset||"").toLowerCase();
  const tried = new Set<string>();
  const tryDecode = (name: string) => {
    if (tried.has(name)) return undefined;
    tried.add(name);
    try { return iconv.decode(buf, name); } catch { return undefined; }
  };
  return (
    (cs && tryDecode(cs)) ||
    tryDecode("utf-8") ||
    tryDecode("latin1") ||
    tryDecode("win1252") ||
    buf.toString("utf8")
  );
}
TS

# API-Route (robuste Dekodierung + 60s LRU-Cache + Timeout)
cat > "$APP/src/app/api/search/civic/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { decodeWithCharset, sniffCharsetFromHeaders, sniffCharsetFromXml } from "../../_utils/charset";
import { XMLParser } from "fast-xml-parser";
import he from "he";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Req = { topic?: string; region?: string; keywords?: string[]; limit?: number };

const FEEDS: string[] = [
  "https://www.tagesschau.de/xml/rss2/",
  "https://www.deutschlandfunk.de/nachrichten-108.xml",
  "https://rss.golem.de/rss.php?feed=RSS2.0",
];

const LRU = new Map<string, { t: number; data: any }>();
const TTL_MS = 60_000;

function setCache(k: string, v: any) {
  LRU.set(k, { t: Date.now(), data: v });
  if (LRU.size > 64) {
    const first = LRU.keys().next().value; LRU.delete(first);
  }
}
function getCache(k: string) {
  const e = LRU.get(k);
  if (!e) return null;
  if (Date.now() - e.t > TTL_MS) { LRU.delete(k); return null; }
  return e.data;
}

async function fetchTextSmart(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal, next: { revalidate: 60 } });
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  const cs = sniffCharsetFromHeaders(res.headers) || sniffCharsetFromXml(buf);
  return decodeWithCharset(buf, cs || "utf-8");
}

function parseRss(xml: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    decodeHTMLchar: false,
  });
  const j = parser.parse(xml);
  // RSS 2.0 oder Atom minimal unterstützen
  const items =
    j?.rss?.channel?.item ||
    j?.feed?.entry ||
    [];
  return (Array.isArray(items) ? items : [items]).map((it: any) => ({
    title: he.decode(String(it.title?.["#text"] ?? it.title ?? "").trim()),
    link: String(it.link?.["@_href"] ?? it.link ?? it.guid ?? "").trim(),
    score: 0.0,
    source: (j?.rss?.channel?.title || j?.feed?.title || "").toString(),
  })).filter(x => x.title && x.link);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Req;
  const key = JSON.stringify({ feeds: FEEDS, body });
  const cached = getCache(key);
  if (cached) return NextResponse.json(cached);

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 10_000);

  try {
    const texts = await Promise.allSettled(FEEDS.map(u => fetchTextSmart(u, ac.signal)));
    const items = texts.flatMap(r => {
      if (r.status !== "fulfilled") return [];
      try { return parseRss(r.value); } catch { return []; }
    });

    // naive scoring
    const kw = (body.keywords||[]).map(s => s.toLowerCase());
    const filtered = items.map(it => {
      const hay = (it.title + " " + it.source).toLowerCase();
      const hits = kw.length ? kw.reduce((n,k)=>n+(hay.includes(k)?1:0),0) : 0;
      const score = kw.length ? Math.min(1, hits/kw.length) : 0.6;
      return { ...it, score: Number(score.toFixed(2)) };
    }).sort((a,b)=>b.score-a.score).slice(0, Math.max(3, Math.min(20, body.limit ?? 10)));

    const out = { ok:true, items: filtered, errors: [] as string[] };
    setCache(key, out);
    return NextResponse.json(out);
  } finally {
    clearTimeout(to);
  }
}
TS

rm -rf "$APP/.next" 2>/dev/null || true
echo "✓ Civic-Route gefixt (Encoding+Cache). Neustart: pnpm -F @vog/web dev"
