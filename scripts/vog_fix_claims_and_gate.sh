#!/usr/bin/env bash
set -euo pipefail
ROOT="apps/web/src"

# 1) Provider – callOpenAIJson ergänzen (nur falls nicht vorhanden)
FILE="$ROOT/features/ai/providers/openai.ts"
if ! rg -n "export async function callOpenAIJson" "$FILE" >/dev/null 2>&1; then
  cp "$FILE" "$FILE.bak.$(date +%s)"
  cat >> "$FILE" <<'TS'

// === added by script: enforced JSON ===
export async function callOpenAIJson(
  prompt: string,
  maxOutputTokens = 700,
  opts: OpenAIOptions = {}
): Promise<{ text: string; raw: any }> {
  const key = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  const body: any = {
    model,
    input: String(prompt || ""),
    text: { format: { type: "json_object" } },
    ...(opts.system ? { instructions: String(opts.system) } : {}),
    temperature: 0.2,
    max_output_tokens: maxOutputTokens,
    reasoning: { effort: "low" },
  };
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    throw new Error(`OpenAI ${res.status} – ${msg}`);
  }
  const data = await res.json();
  let out = "";
  if (typeof data?.text === "string" && data.text.trim()) out = data.text;
  else if (typeof data?.output_text === "string" && data.output_text.trim()) out = data.output_text;
  else if (Array.isArray(data?.output)) {
    const parts = data.output
      .flatMap((o: any) => (Array.isArray(o?.content) ? o.content : []))
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean);
    out = parts.join("\n");
  }
  return { text: out || "", raw: data };
}
// === end added ===
TS
  echo "✓ openai.ts: callOpenAIJson ergänzt"
else
  echo "• openai.ts: callOpenAIJson bereits vorhanden"
fi

# 2) Usage-Logger – Datei anlegen, falls fehlt
USAGE="$ROOT/lib/metrics/usage.ts"
if [ ! -f "$USAGE" ]; then
  mkdir -p "$(dirname "$USAGE")"
  cat > "$USAGE" <<'TS'
import fs from "node:fs/promises";
import path from "node:path";
export type UsageEvent = { ts:number; route:string; userId:string|null; model:string|null; totalTokens:number|null; ms:number; ok:boolean; err:string|null; meta?:any };
const FILE = process.env.VOG_USAGE_FILE || ".next-cache/usage.log.jsonl";
export async function recordUsage(ev: UsageEvent){
  try{ await fs.mkdir(path.dirname(FILE),{recursive:true}); await fs.appendFile(FILE, JSON.stringify(ev)+"\n","utf8"); }catch{}
}
TS
  echo "✓ usage.ts angelegt"
else
  echo "• usage.ts vorhanden"
fi

# 3) ClaimPanelsGate – UI Gate
GATE="$ROOT/ui/ClaimPanelsGate.tsx"
if [ ! -f "$GATE" ]; then
  mkdir -p "$(dirname "$GATE")"
  cat > "$GATE" <<'TSX'
"use client";
export default function ClaimPanelsGate({ analysis }:{ analysis:any }){
  if(!analysis) return null;
  const ok = Array.isArray(analysis?.claims) && analysis.claims.length>0;
  if(!ok){
    return <div className="vog-card p-4 text-sm">
      <div className="font-semibold mb-1">Noch keine klaren Aussagen erkannt</div>
      <div>Präzisiere bitte („Welche Preise? Wo? Zeitraum?“) und starte die Analyse erneut.</div>
    </div>;
  }
  return null;
}
TSX
  echo "✓ ClaimPanelsGate.tsx angelegt"
else
  echo "• ClaimPanelsGate.tsx vorhanden"
fi

echo "=== Fertig (keine env.local verändert) ==="
