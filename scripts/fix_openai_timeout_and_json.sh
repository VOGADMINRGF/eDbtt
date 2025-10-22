#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

fix_openai_ts() {
  cat > "$ROOT/features/ai/providers/openai.ts" <<'TS'
// features/ai/providers/openai.ts
import OpenAI from "openai";

export type ProviderId = "openai";
export type OpenAIOptions = {
  timeoutMs?: number;    // in ms
  forceJsonMode?: boolean;
  system?: string;
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function toInt(v: any, defVal: number): number {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : defVal;
}

export async function callOpenAI(
  prompt: string,
  opts: OpenAIOptions = {}
): Promise<{ text: string; raw: any }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }
  const model = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  const timeout = toInt(opts.timeoutMs ?? process.env.OPENAI_TIMEOUT_MS ?? 18000, 18000);

  // Responses API – KEIN response_format / KEIN temperature
  const body: any = {
    model,
    input: prompt,
    ...(opts.forceJsonMode ? { text: { format: { type: "json_object" } } } : {})
  };

  const res = await client.responses.create(body, { timeout });

  const data: any = res;
  let text = "";

  if (typeof data.text === "string" && data.text.trim()) {
    text = data.text;
  }
  if (!text && typeof data.output_text === "string" && data.output_text.trim()) {
    text = data.output_text;
  }
  if (!text && Array.isArray(data.output)) {
    const msg = data.output.find((o: any) => o?.type === "message") || data.output[0];
    const parts = Array.isArray(msg?.content)
      ? msg.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).filter(Boolean)
      : [];
    if (parts.length) text = parts.join("\n");
  }

  return { text: text || "", raw: data };
}
TS
  echo "✔ rewrote features/ai/providers/openai.ts"
}

fix_providers_ts() {
  cat > "$ROOT/features/ai/providers.ts" <<'TS'
/**
 * Zentraler Zugriff auf GPT/ARI Provider.
 * Wichtig: Für GPT-5 (Responses API) KEIN response_format/temperature senden.
 */
import { callOpenAI } from "./providers/openai";

export async function callOpenAIJson(prompt: string, maxOutputTokens = 1200) {
  // Hinweis: maxOutputTokens bleibt ungenutzt – Responses API kann per Policy limitieren,
  // hier reicht die JSON-Struktur-Anweisung im Prompt.
  const { text } = await callOpenAI(
    `${prompt}\n\nGib NUR gültiges JSON (RFC8259) zurück.`,
    { forceJsonMode: true }
  );
  return { text };
}

// Platzhalter – ARI-Key ggf. setzen oder diesen Fallback ignorieren
export async function youcomResearch(_args: any) {
  throw new Error("ARI not configured (YOUCOM_ARI_API_KEY missing)");
}
export async function youcomSearch(_args: any) {
  throw new Error("ARI search not configured");
}
export function extractNewsFromSearch() { return []; }
TS
  echo "✔ rewrote features/ai/providers.ts"
}

# Optional: alte response_format/temperature Artefakte in Web-Layer bereinigen (unschädlich, aber sauber)
strip_legacy_flags() {
  sed -i.bak -E 's/,\s*temperature\s*:\s*[^,}\n]+//g; s/"response_format"[[:space:]]*:[[:space:]]*{[^}]*}//g' \
    "$ROOT/apps/web/src/lib/llm.ts" || true
  echo "✔ cleaned legacy flags in apps/web/src/lib/llm.ts (if present)"
}

fix_openai_ts
fix_providers_ts
strip_legacy_flags

echo "All done. Restart your dev server."
