#!/usr/bin/env bash
set -euo pipefail

APP="apps/web"
FILE="$APP/src/app/api/translate/route.ts"
BACKUP="$FILE.broken.$(date +%s).ts"

# Bestehende (kaputte) Route sichern
if [ -f "$FILE" ]; then
  mkdir -p "$(dirname "$FILE")"
  mv "$FILE" "$BACKUP"
  echo "→ Backup geschrieben: $BACKUP"
fi

# Minimal-Route schreiben (keine Aliase, nur OpenAI)
cat > "$FILE" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.VOG_TX_MODEL || "gpt-4o-mini";

// sehr einfacher In-Memory-Cache
const mem = new Map<string, string>();
const MAX_CACHE = 500;
function cacheSet(k: string, v: string) {
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
  const text  = String(body?.text  ?? "");
  const to    = String(body?.to    ?? "");
  const from  = String(body?.from  ?? "de");
  const style = String(body?.style ?? "neutral");

  if (!text || !to) {
    return NextResponse.json({ error: "Missing 'text' or 'to'" }, { status: 400 });
  }

  const clipped = text.length > 4000 ? text.slice(0, 4000) : text;
  const key = `${from}->${to}:${style}:${clipped}`;
  if (mem.has(key)) return NextResponse.json({ text: mem.get(key), cached: true, model: MODEL });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const sys = "Act as a professional translator. Preserve meaning, tone and formatting (Markdown/HTML). Do NOT invent facts. Keep placeholders like {this} intact. Do not translate URLs or domain names.";

  const r = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `from=\${from} to=\${to} style=\${style}\n---\n\${clipped}` },
    ],
  });

  const out = r.choices[0]?.message?.content?.trim() ?? clipped;
  cacheSet(key, out);
  return NextResponse.json({ text: out, cached: false, model: MODEL });
}
TS

# Next-Build-Cache leeren (sicher)
rm -rf "$APP/.next" 2>/dev/null || true
echo "✓ translate/route.ts repariert. Starte dev neu: pnpm --filter @vog/web dev"
