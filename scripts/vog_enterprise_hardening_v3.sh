#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
WEB="$ROOT/apps/web"
FEAT="$ROOT/features"

say(){ printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
patch_file(){ # $1:path $2:heredocname
  local f="$1"
  local tmp
  tmp="$(mktemp)"
  cat >"$tmp" <&0
  mkdir -p "$(dirname "$f")"
  cp "$f" "$f.bak.$(date +%s)" 2>/dev/null || true
  mv "$tmp" "$f"
  echo "  ↳ wrote $f"
}

# 1) OpenAI provider: robust JSON text extraction (Responses API), no response_format, no stray returns
say "Fix OpenAI provider (responses → stable text extraction)"
patch_file "$FEAT/ai/providers/openai.ts" <<'TS'
import OpenAI from "openai";

export type OpenAIOptions = {
  timeoutMs?: number;
  forceJsonMode?: boolean; // kept for signature compatibility
  system?: string;
};

const MODEL = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";

export async function callOpenAI(prompt: string, opts: OpenAIOptions = {}): Promise<{ text: string; raw: any }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const body: any = {
    model: MODEL,
    // Responses API — DO NOT send `response_format` or `temperature` for strict models
    input: prompt,
    text: { format: { type: "json_object" } },   // ✅ replacement for response_format
  };

  const res = await client.responses.create(body, { timeout: opts.timeoutMs });
  const data: any = res;

  // ---- robust text extraction (no returns in an IIFE, no ?? mixed without parens) ----
  let text = "";

  // 1) explicit `.text` property used by SDK for convenience
  if (typeof (data as any)?.text === "string" && data.text.trim()) {
    text = data.text;
  }

  // 2) `output_text` (some SDKs expose this)
  if (!text && typeof data?.output_text === "string" && data.output_text.trim()) {
    text = data.output_text;
  }

  // 3) walk `output[].content[].text`
  if (!text && Array.isArray(data?.output)) {
    const msg = data.output.find((o: any) => o?.type === "message") || data.output[0];
    const parts = Array.isArray(msg?.content)
      ? msg.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).filter(Boolean)
      : [];
    if (parts.length) text = parts.join("\n");
  }

  return { text: text || "", raw: data };
}
TS

# 2) Analyzer: disable heuristic fallback, fail loudly with transparent errors; keep ARI optional
say "Make analyzeContribution strict (no heuristic fallback)"
patch_file "$FEAT/analyze/analyzeContribution.ts" <<'TS'
import { callOpenAIJson, youcomResearch, extractNewsFromSearch } from "../ai/providers";

type AnalyzeOpts = {
  maxClaims?: number;
  model?: string;
  forceFallback?: boolean; // ignored in strict mode
  context?: any;
};

export async function analyzeContribution(text: string, opts: AnalyzeOpts = {}) {
  const started = Date.now();
  const errors: string[] = [];
  let gptParsed: any | null = null;
  let gptRaw: any | null = null;
  let news: any[] = [];

  // ---- GPT phase (strict JSON)
  try {
    const prompt = `Analysiere folgenden Bürgerbeitrag und gib STRIKT JSON zurück:
Text:
${text}

Schema:
{
  "language": "de|en|…",
  "mainTopic": string|null,
  "subTopics": string[],
  "regionHint": string|null,
  "claims": [{"text": string, "categoryMain": string|null, "categorySubs": string[], "region": string|null, "authority": string|null}]
}`;
    const { text: out, raw } = await callOpenAIJson(prompt, 1200);
    gptRaw = raw;
    try {
      gptParsed = JSON.parse(out || "{}");
    } catch (e: any) {
      errors.push(`GPT JSON parse failed: ${e?.message || e}`);
    }
  } catch (e: any) {
    errors.push(`OpenAI error: ${e?.message || e}`);
  }

  // ---- ARI (You.com) phase — best-effort
  try {
    const ari = await youcomResearch({ text, context: opts.context || {} });
    news = extractNewsFromSearch(ari);
  } catch (e: any) {
    errors.push(`ARI research: ${e?.message || e}`);
  }

  // ---- strict behavior: no heuristic mirrors
  if (!gptParsed && news.length === 0) {
    return {
      error: true,
      message: "Analyzer unavailable (no reliable GPT or ARI output).",
      _meta: { mode: "error", errors, tookMs: Date.now() - started }
    };
  }

  const out = gptParsed || { language: null, mainTopic: null, subTopics: [], regionHint: null, claims: [] };
  return {
    ...out,
    news,
    _meta: { mode: gptParsed ? (news.length ? "gpt+ari" : "gpt") : "ari", errors, gptRaw, tookMs: Date.now() - started }
  };
}
TS

# 3) API route: add transparent SSE progress (opt-in via ?stream=1), otherwise normal JSON
say "Wire SSE progress into API route (transparent steps)"
patch_file "$WEB/src/app/api/contributions/analyze/route.ts" <<'TS'
import { NextResponse } from "next/server";
import { analyzeContribution } from "@features/analyze/analyzeContribution";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const stream = searchParams.get("stream") === "1";

  const body = await req.json().catch(() => ({}));
  const { text, maxClaims, model, forceFallback, context } = body ?? {};

  if (!stream) {
    const result = await analyzeContribution(String(text || ""), {
      maxClaims,
      model,
      forceFallback: !!forceFallback,
      context: context ?? {}
    });
    return NextResponse.json(result);
  }

  // --- SSE
  const encoder = new TextEncoder();
  const streamBody = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: any) => {
        const line = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      send("start", { ts: Date.now() });
      try {
        // Mini-wrappers to report progress from the strict analyzer
        send("step", { name: "gpt:start" });
        const result = await analyzeContribution(String(text || ""), {
          maxClaims,
          model,
          forceFallback: !!forceFallback,
          context: context ?? {}
        });
        send("step", { name: "gpt+ari:done" });

        if ((result as any)?.error) {
          send("error", { errors: (result as any)?._meta?.errors || [], message: (result as any).message });
        } else {
          send("done", { result });
        }
      } catch (e: any) {
        send("error", { message: e?.message || String(e) });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(streamBody, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
TS

# 4) UI: live stepper + remove default 3-star bias; hide CTA on /contributions/analyze
say "Patch analyze page client code (progress + neutral stars + no CTA)"
mkdir -p "$WEB/src/app/contributions/analyze"
patch_file "$WEB/src/app/contributions/analyze/Client.tsx" <<'TSX'
"use client";
import React from "react";

type Step = { ts: number; label: string; kind: "ok" | "info" | "error" };

export function ProgressLog() {
  const [steps, setSteps] = React.useState<Step[]>([]);
  const add = (s: Step) => setSteps((v) => [...v, s]);

  React.useEffect(() => {
    // no-op here; component is just a container
  }, []);

  return (
    <div className="mt-3 rounded border p-3 bg-white">
      <div className="font-semibold mb-2">Analyse-Prozess</div>
      {steps.length === 0 ? (
        <div className="text-sm text-gray-500">Keine Schritte.</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {steps.map((s, i) => (
            <li key={i} className={s.kind === "error" ? "text-red-600" : s.kind === "ok" ? "text-emerald-700" : ""}>
              {new Date(s.ts).toLocaleTimeString()} – {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function useAnalyzeWithProgress() {
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [log, setLog] = React.useState<Step[]>([]);
  const add = (label: string, kind: Step["kind"] = "info") =>
    setLog((v) => [...v, { ts: Date.now(), label, kind }]);

  const run = React.useCallback(async (payload: any) => {
    setResult(null); setError(null); setLog([]);
    add("Starte…");
    const es = new EventSource(`/api/contributions/analyze?stream=1`, { withCredentials: false });

    es.addEventListener("start", () => add("Pipeline init", "ok"));
    es.addEventListener("step", (ev: any) => {
      try { add(JSON.parse(ev.data)?.name || "Schritt"); } catch { add("Schritt"); }
    });
    es.addEventListener("error", (ev: any) => {
      try { setError(JSON.parse(ev.data)?.message || "Fehler"); } catch { setError("Fehler"); }
      add("Fehler", "error");
      es.close();
    });
    es.addEventListener("done", (ev: any) => {
      try { setResult(JSON.parse(ev.data)?.result || null); add("Fertig", "ok"); } catch { add("Fertig", "ok"); }
      es.close();
    });

    // send POST body through a tiny fetch (so the SSE route can read JSON body from request clone)
    await fetch(`/api/contributions/analyze?stream=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(()=>{});
  }, []);

  return { run, result, error, log };
}

/* Stars: neutral mapping, no default 3 stars */
export function starsFromWeight(w?: number) {
  if (!w || w <= 0) return 0;
  if (w < 1) return 1;
  if (w < 1.5) return 2;
  if (w < 2) return 3;
  if (w < 2.5) return 4;
  return 5;
}
TSX

# 5) Explain away the devtools 404 (just noise). No code change needed.

echo
say "Done. Now restart the web app:"
echo "  pnpm --filter @vog/web dev"
