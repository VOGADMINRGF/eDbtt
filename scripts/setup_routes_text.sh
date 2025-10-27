#!/usr/bin/env bash
set -euo pipefail

# Root bestimmen
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  ROOT="$(git rev-parse --show-toplevel)"
else
  ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
fi
echo "→ Root: $ROOT"

APP="$ROOT/apps/web"
SRC="$APP/src"

# Verzeichnisse
mkdir -p "$SRC/lib/text" \
         "$SRC/lib" \
         "$SRC/app/api/statements/similar" \
         "$SRC/app/api/translate"

########################################
# A) Unicode-Folding Utils (ohne i18n)
########################################
cat > "$SRC/lib/text/normalize.ts" <<'TS'
/**
 * Suche/Match ohne i18n-Framework:
 * - NFKD + Combining Marks weg
 * - lower
 * - gängige Folds (de/latin)
 * - Whitespace bündeln
 */
export const fold = (s: string) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ö/g, "oe").replace(/ä/g, "ae").replace(/ü/g, "ue")
    .replace(/ç/g, "c").replace(/ñ/g, "n")
    .replace(/[־–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

export const safeQuery = (raw: string | null | undefined) => {
  try { return fold(decodeURIComponent(String(raw ?? ""))); }
  catch { return fold(String(raw ?? "")); }
};
TS
echo "✓ wrote: lib/text/normalize.ts"

########################################
# B) /api/statements/similar (robust)
########################################
cat > "$SRC/app/api/statements/similar/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
// relative Import (vermeidet Alias-/tsconfig-Abhängigkeiten)
import { safeQuery } from "../../../lib/text/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const text = safeQuery(req.nextUrl.searchParams.get("text"));

  // Beispiel: verifiziert (Touristen/Abzocke)
  if (/(tourist|touristen|abzocke)/.test(text)) {
    return NextResponse.json({
      kind: "verified",
      stmt: {
        id: "stmt-verified-001",
        title: "Faire Preise in Tourismuslagen der EU",
        trust: 0.92,
        version: 3,
        evidenceCount: 7,
        sim: 0.91,
      },
    });
  }

  // Beispiel: Cluster (ÖPNV/Tram/Strassenbahn …)
  if (/(opnv|oepnv|tram|strassenbahn|nahverkehr|bvg|koepenick|kopenick)/.test(text)) {
    return NextResponse.json({
      kind: "cluster",
      clusterId: "clu-berlin-tram",
      top: [
        { id: "stmt-berlin-tram-a", title: "Straßenbahn Ostkreuz–Köpenick ausbauen", trust: 0.62, evidenceCount: 2, sim: 0.82 },
        { id: "stmt-berlin-tram-b", title: "Kostenloser ÖPNV in Berlin", trust: 0.55, evidenceCount: 1, sim: 0.78 },
      ],
    });
  }

  return NextResponse.json({ kind: "none" });
}
TS
echo "✓ wrote: api/statements/similar/route.ts"

########################################
# C) /api/translate (GPT-only, kleiner Cache)
########################################
cat > "$SRC/app/api/translate/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.VOG_TX_MODEL || "gpt-4o-mini";

// sehr simpler In-Memory-Cache
const mem = new Map<string, string>();
const MAX_CACHE = 500;
function setCache(k: string, v: string) {
  if (mem.size >= MAX_CACHE) {
    const first = mem.keys().next().value;
    mem.delete(first);
  }
  mem.set(k, v);
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "");
  const to = String(body?.to ?? "");
  const from = String(body?.from ?? "de");
  const style = String(body?.style ?? "neutral");

  if (!text || !to) {
    return NextResponse.json({ error: "Missing 'text' or 'to'" }, { status: 400 });
  }

  const clipped = text.length > 4000 ? text.slice(0, 4000) : text;
  const key = `${from}->${to}:${style}:${clipped}`;
  if (mem.has(key)) return NextResponse.json({ text: mem.get(key), cached: true, model: MODEL });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const sys = [
    "Act as a professional translator.",
    "Preserve meaning, tone and formatting (Markdown/HTML).",
    "Do NOT invent facts. Keep placeholders like {this} intact.",
    "Do not translate URLs or domain names."
  ].join(" ");

  const r = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `from=${from} to=${to} style=${style}\n---\n${clipped}` }
    ],
  });

  const out = r.choices[0]?.message?.content?.trim() ?? clipped;
  setCache(key, out);
  return NextResponse.json({ text: out, cached: false, model: MODEL });
}
TS
echo "✓ wrote: api/translate/route.ts"

########################################
# D) Client-Helper (optional)
########################################
cat > "$SRC/lib/tx.ts" <<'TS'
export async function tx(text: string, to: string, from = "de", style = "neutral") {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, to, from, style }),
  });
  if (!res.ok) throw new Error("translate failed");
  const j = await res.json();
  return j.text as string;
}
TS
echo "✓ wrote: lib/tx.ts"

# Next.js Cache leeren (safe)
rm -rf "$APP/.next" 2>/dev/null || true
echo "✓ Done. Starte neu: pnpm --filter @vog/web dev"
