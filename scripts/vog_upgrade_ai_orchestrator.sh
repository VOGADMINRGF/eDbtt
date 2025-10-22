#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "🧭 Root: $ROOT"

mkdir -p "$ROOT/features/ai" "$ROOT/features/analyze" "$ROOT/apps/web/src/app/api/contributions/analyze"

# --- providers: OpenAI (Responses API) + You.com (ARI: research/search) ---
cat > "$ROOT/features/ai/providers.ts" <<'TS'
/**
 * features/ai/providers.ts
 * - OpenAI Responses API (JSON)
 * - You.com ARI: research (chat) + search fallback
 * -> KEIN temperature-Param bei GPT-5 Responses Modellen!
 */

const OPENAI_URL = process.env.OPENAI_URL ?? "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.1-mini"; // oder gpt-5.1, je nach Tarif
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";

const YDC_KEY = process.env.YOUCOM_ARI_API_KEY ?? "";
const YDC_RESEARCH_URL = process.env.YOUCOM_RESEARCH_URL ?? "https://chat-api.you.com";
const YDC_SEARCH_URL   = process.env.YOUCOM_SEARCH_URL   ?? "https://api.ydc-index.io";

function ok(v:any){ return v !== undefined && v !== null; }

export async function callOpenAIJson(prompt: string, maxOutputTokens = 1200) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY missing");
  const body:any = {
    model: OPENAI_MODEL,
    input: prompt,                            // Responses API
    response_format: { type: "json_object" },
    max_output_tokens: maxOutputTokens
    // WICHTIG: KEIN temperature bei GPT-5 Responses
  };
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${OPENAI_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=> "");
    throw new Error(`OpenAI ${res.status} – ${txt}`);
  }
  const j = await res.json();
  // Responses API: text steckt in j.output[0].content[0].text oder j.output_text
  const text =
    j?.output?.[0]?.content?.[0]?.text ??
    j?.output_text ??
    j?.choices?.[0]?.message?.content ??
    "";
  return { raw: j, text };
}

export async function youcomResearch(query: string) {
  if (!YDC_KEY) throw new Error("YOUCOM_ARI_API_KEY missing");
  // Es gibt verschiedene chat-api Pfade; robust auf /research und /query versuchen
  const payload = { query, enable_citations: true, num_results: 5 };
  const urls = [
    `${YDC_RESEARCH_URL}/research`,
    `${YDC_RESEARCH_URL}/query`,
  ];
  let lastErr: any = null;
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": YDC_KEY,
        },
        body: JSON.stringify(payload),
      });
      if (r.ok) return await r.json();
      lastErr = new Error(`ARI ${r.status} – ${await r.text()}`);
    } catch(e:any) { lastErr = e; }
  }
  throw (lastErr ?? new Error("ARI research failed"));
}

export async function youcomSearch(query: string) {
  if (!YDC_KEY) throw new Error("YOUCOM_ARI_API_KEY missing");
  const url = `${YDC_SEARCH_URL}/search?q=${encodeURIComponent(query)}&num_results=5`;
  const r = await fetch(url, {
    headers: { "x-api-key": YDC_KEY },
  });
  if (!r.ok) throw new Error(`Search ${r.status} – ${await r.text()}`);
  return await r.json();
}

export function extractNewsFromSearch(searchJson:any) {
  const items = Array.isArray(searchJson?.results) ? searchJson.results : [];
  return items.slice(0,3).map((it:any)=>({
    title: it.title ?? it.snippet ?? "",
    source: it.source ?? it.domain ?? "",
    url: it.url ?? it.link ?? "",
    time: it.date ?? it.published ?? null,
  })).filter(n => n.title && n.url);
}
TS

# --- analyzer (orchestrator + scoring + gating + transparency) ---
cat > "$ROOT/features/analyze/analyzeContribution.ts" <<'TS'
/**
 * features/analyze/analyzeContribution.ts
 * - GPT-5 (Responses API JSON) -> primär
 * - ARI/You.com research + search -> Orchestrator/Fallback
 * - 3-Claim Gate (Free) + Pro-CTA Hinweis
 * - Stimmengewicht: 0.4 (generisch) / 1.0 / 1.2 (mit Quellen) / 1.4 (systemrelevante Berufe)
 * - News-Seeds + Canonical-Merge-Key
 * - Transparente _meta mit Fehlern/Gründen
 */
import { callOpenAIJson, youcomResearch, youcomSearch, extractNewsFromSearch } from "../ai/providers";

function now(){ return Date.now(); }
function trim(s:string){ return (s||"").replace(/\s+/g," ").trim(); }
function slug(s:string){ return trim(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g,"-").slice(0,160); }
function canonicalKey(text:string){ return slug(text).replace(/-(der|die|das|und|oder|mit|ohne|zu|im|in|am|auf|von|für|gegen|nicht)-/g,"-"); }
function dedupe<T>(arr:T[], key:(x:T)=>string){ const seen=new Set<string>(); const out:T[]=[]; for(const a of arr){ const k=key(a); if(!seen.has(k)){ seen.add(k); out.push(a);} } return out; }
function looksGeneric(text:string){ return /\b(gegen|dafür|finde gut|finde schlecht|allgemein|insgesamt|zu teuer|zu billig)\b/i.test(text) || text.split(/\s+/).length < 6; }

const SYSTEM_BERUFE = ["altenpfleger","pflegekraft","krankenschwester","krankenpfleger","rettungssanitäter","feuerwehr","lehrkraft","erzieher","arzt","ärztin"];

function pickWeight(text:string, ctx:any){
  const reasons: string[] = [];
  let w = 1.0;

  if (looksGeneric(text)) { w = 0.4; reasons.push("sehr allgemeine Aussage"); }

  const providedSources = !!ctx?.providedSources?.length;
  if (providedSources && w < 1.0) { w = 1.0; }
  if (providedSources) { w = Math.max(w, 1.2); reasons.push("Quellen/Belege geliefert"); }

  const role = String(ctx?.userRole || "").toLowerCase();
  if (SYSTEM_BERUFE.some(b => role.includes(b))) {
    w = 1.4; reasons.push("systemrelevante Berufsgruppe");
  }

  return { baseWeight: w, reasons: reasons.length? reasons : ["Standardgewichtung – keine zusätzlichen Nachweise"] };
}

function gptPrompt(text:string, maxClaims:number) {
  return `
Du extrahierst aus dem folgenden deutschen Input bis zu ${maxClaims} Kernaussagen (Claims).
Gib REINES JSON zurück im Schema:
{
  "language": "de",
  "mainTopic": "string|null",
  "subTopics": ["string", ...],
  "regionHint": "string|null",
  "claims": [
    {
      "text": "string",
      "categoryMain": "string|null",
      "categorySubs": ["string", ...],
      "region": "string|null",
      "authority": "string|null"
    }
  ]
}

Text:
"""${text}"""
`.trim();
}

function coerce(result:any, fallbackText:string, ctx:any, maxClaims:number){
  const language = result?.language ?? "de";
  const claims = Array.isArray(result?.claims) ? result.claims : [];
  const normClaims = (claims.length? claims : [{
    text: trim(fallbackText).slice(0,180),
    categoryMain: null, categorySubs: [], region: null, authority: null
  }]).map((c:any)=>({
    text: trim(c?.text || ""),
    categoryMain: c?.categoryMain ?? null,
    categorySubs: Array.isArray(c?.categorySubs) ? c.categorySubs : [],
    region: c?.region ?? null,
    authority: c?.authority ?? null,
    canon: canonicalKey(c?.text || ""),
  })).filter((c:any)=>c.text);

  const unique = dedupe(normClaims, c=>c.canon);
  const limited = unique.slice(0, maxClaims);
  const more = Math.max(0, unique.length - limited.length);

  // Stimmengewicht pro Claim
  const withWeights = limited.map((c:any)=>({
    ...c,
    scoreHints: pickWeight(c.text, ctx)
  }));

  return {
    language,
    mainTopic: result?.mainTopic ?? null,
    subTopics: Array.isArray(result?.subTopics) ? result.subTopics : [],
    regionHint: result?.regionHint ?? null,
    claims: withWeights,
    moreClaimsAvailable: more
  };
}

export async function analyzeContribution(text:string, options:any = {}) {
  const started = now();
  const maxClaims = Math.max(1, Math.floor(options?.maxClaims ?? 3));
  const ctx = options?.context ?? {};

  const meta:any = { mode: "gpt", errors: [] as string[], timings:{} as any };

  let gpt:any = null;
  try {
    const t0 = now();
    const { text: outText, raw } = await callOpenAIJson(gptPrompt(text, Math.max(10, maxClaims+5)));
    meta.timings.gptMs = now()-t0;
    meta.gptRaw = raw;
    // JSON parsen
    try { gpt = JSON.parse(outText); }
    catch(e:any){ throw new Error("GPT JSON parse failed: " + String(e?.message||e)); }
  } catch(e:any){
    meta.errors.push(String(e?.message||e));
  }

  // Qualität check: leere Felder oder 1:1 Echo -> dann ARI
  let useAri = false;
  if (!gpt?.claims?.length) useAri = true;
  if (gpt?.claims?.length === 1) {
    const only = String(gpt.claims[0]?.text||"").toLowerCase();
    if (only === String(text).toLowerCase()) useAri = true;
  }

  let ari:any = null, news:any[] = [];
  if (useAri) {
    meta.mode = "ari";
    try {
      const t1 = now();
      ari = await youcomResearch(text);
      meta.timings.ariMs = now()-t1;
    } catch(e:any){
      meta.errors.push("ARI research: " + String(e?.message||e));
      try {
        const t2 = now();
        const search = await youcomSearch(text);
        meta.timings.searchMs = now()-t2;
        news = extractNewsFromSearch(search);
      } catch(se:any){
        meta.errors.push("Search fallback: " + String(se?.message||se));
      }
    }
  } else {
    // Auch wenn GPT gut war: News für Kontext
    try {
      const t2 = now();
      const search = await youcomSearch(text);
      meta.timings.searchMs = now()-t2;
      news = extractNewsFromSearch(search);
    } catch(se:any){
      meta.errors.push("Search news: " + String(se?.message||se));
    }
  }

  // Ergebnis zusammenbauen (GPT bevorzugt; ARI nur rudimentär heuristisch extrahieren)
  let base = coerce(gpt, text, ctx, maxClaims);

  if (!gpt?.claims?.length && ari?.answer) {
    const sentences = String(ari.answer).split(/[\.\!\?]\s+/).map(s=>trim(s)).filter(Boolean);
    const ariClaims = sentences.slice(0, 6).map(s=>({ text: s, categoryMain:null, categorySubs:[], region:null, authority:null }));
    base = coerce({ language:"de", claims: ariClaims }, text, ctx, maxClaims);
  }

  // Pro-Gate / CTA
  const cta = base.moreClaimsAvailable > 0 ? {
    kind: "pro_gate",
    title: `${base.moreClaimsAvailable} weitere Kernaussagen gefunden`,
    text: "Schalte die vollständige Analyse frei (Coins sammeln oder Pro aktivieren).",
    actions: [
      { type: "route", label: "Pro freischalten", href: "/pro" },
      { type: "route", label: "Coins verdienen", href: "/rewards" }
    ]
  } : null;

  // News/Seeds dran
  const out = {
    language: base.language,
    mainTopic: base.mainTopic,
    subTopics: base.subTopics,
    regionHint: base.regionHint,
    claims: base.claims,
    news: news,
    scoreHints: pickWeight(text, ctx), // Gesamttext (optional)
    cta,
    _meta: { ...meta, tookMs: now()-started }
  };
  return out;
}
TS

# --- API route (keine Type-only Imports; holt nur features/analyze) ---
cat > "$ROOT/apps/web/src/app/api/contributions/analyze/route.ts" <<'TS'
// apps/web/src/app/api/contributions/analyze/route.ts
import { NextResponse } from "next/server";
import { analyzeContribution } from "../../../../../../features/analyze/analyzeContribution";

export async function POST(req: Request) {
  const body = await req.json().catch(()=> ({}));
  const { text, maxClaims, model, forceFallback, context } = body ?? {};
  try {
    const result = await analyzeContribution(String(text||""), {
      maxClaims: Number.isFinite(maxClaims) ? maxClaims : 3,
      model,
      forceFallback: !!forceFallback,
      context: context ?? {}
    });
    return NextResponse.json(result);
  } catch(e:any) {
    const fallback = {
      language: "de",
      mainTopic: null,
      subTopics: [],
      regionHint: null,
      claims: text ? [{
        text: String(text).slice(0,180),
        categoryMain: null, categorySubs: [], region: null, authority: null,
        scoreHints: { baseWeight: 0.4, reasons: ["Fallback – minimale Echo-Aussage"] }
      }] : [],
      _meta: { mode: "fallback", error: String(e?.message||e) }
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}
TS

# kleine Aufräumhilfe (alte .bak/dupes nicht anfassen außer Hinweis)
echo "✅ Dateien geschrieben."
echo "➡  Starte dev neu:"
echo "   pnpm --filter @vog/web dev"
echo
echo "🔎 Test:"
echo "curl -sS -X POST http://127.0.0.1:3000/api/contributions/analyze \\"
echo "  -H 'content-type: application/json' \\"
echo "  -d '{\"text\":\"Ich bin gegen weitere Preiserhöhungen.\",\"maxClaims\":3,\"context\":{\"userRole\":\"Krankenschwester\"}}' | jq ."
