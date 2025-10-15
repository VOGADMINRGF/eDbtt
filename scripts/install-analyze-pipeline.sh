#!/usr/bin/env bash
set -euo pipefail

APP="apps/web"
SRC="$APP/src"

# macOS/GNU sed in-place
if sed --version >/dev/null 2>&1; then SED_I=(-i); else SED_I=(-i ''); fi

mkdir -p "$SRC/analyze" "$SRC/types" "$SRC/app/api/analyze/jobs" "$SRC/app/api/analyze/status" "$SRC/app/api/analyze/events" "$SRC/app/contributions/new"

# ---- types -------------------------------------------------------------------
cat > "$SRC/types/analyze.ts" <<'TS'
export type PipelineStepKey =
  | "parse"
  | "canon"
  | "db"
  | "ext"
  | "experts"
  | "fact"
  | "trust";

export type StepStatus = "queued" | "in_progress" | "done" | "failed";

export interface PipelineStep {
  key: PipelineStepKey;
  label: string;
  status: StepStatus;
  startedAt?: string;
  finishedAt?: string;
  detail?: string;
  result?: any;
}

export interface AnalyzeJob {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  progress: number; // 0..100
  steps: PipelineStep[];
  error?: string | null;
}
TS

# ---- jobStore ----------------------------------------------------------------
cat > "$SRC/analyze/jobStore.ts" <<'TS'
import { AnalyzeJob, PipelineStep, PipelineStepKey } from "@/types/analyze";

const JOBS = new Map<string, AnalyzeJob>();
const SUBS = new Map<string, Set<(job: AnalyzeJob)=>void>>();

const STEP_DEFS: { key: PipelineStepKey; label: string }[] = [
  { key: "parse",   label: "Vorverarbeitung" },
  { key: "canon",   label: "Kanon-Mapping (Tier-1/Tier-2)" },
  { key: "db",      label: "Interner Abgleich" },
  { key: "ext",     label: "Externe Quellen" },
  { key: "experts", label: "Virtuelle Experten" },
  { key: "fact",    label: "Faktencheck" },
  { key: "trust",   label: "Trust-Score" },
];

export function createJob(id: string, text: string): AnalyzeJob {
  const now = new Date().toISOString();
  const steps: PipelineStep[] = STEP_DEFS.map(d => ({ ...d, status: "queued" }));
  const job: AnalyzeJob = { id, text, createdAt: now, updatedAt: now, progress: 0, steps };
  JOBS.set(id, job);
  return job;
}

export function getJob(id: string): AnalyzeJob | undefined {
  return JOBS.get(id);
}

export function updateJob(id: string, mutate: (j: AnalyzeJob) => void) {
  const job = JOBS.get(id);
  if (!job) return;
  mutate(job);
  job.updatedAt = new Date().toISOString();
  // Progress berechnen: Anteil done/failed
  const done = job.steps.filter(s => s.status === "done").length;
  const total = job.steps.length;
  job.progress = Math.round((done / total) * 100);
  notify(id, job);
}

export function setStepStatus(id: string, key: PipelineStepKey, status: "in_progress" | "done" | "failed", patch?: Partial<PipelineStep>) {
  updateJob(id, job => {
    const step = job.steps.find(s => s.key === key)!;
    if (status === "in_progress") step.startedAt = new Date().toISOString();
    if (status === "done" || status === "failed") step.finishedAt = new Date().toISOString();
    step.status = status;
    Object.assign(step, patch || {});
  });
}

export function subscribe(id: string, cb: (job: AnalyzeJob)=>void): () => void {
  const set = SUBS.get(id) ?? new Set();
  set.add(cb);
  SUBS.set(id, set);
  return () => {
    const s = SUBS.get(id);
    if (!s) return;
    s.delete(cb);
    if (s.size === 0) SUBS.delete(id);
  };
}

function notify(id: string, job: AnalyzeJob) {
  const subs = SUBS.get(id);
  if (!subs) return;
  subs.forEach(cb => cb(job));
}
TS

# ---- orchestrator ------------------------------------------------------------
cat > "$SRC/analyze/orchestrator.ts" <<'TS'
import { randomUUID } from "crypto";
import { createJob, setStepStatus, updateJob, getJob } from "@/analyze/jobStore";
import { analyzeContribution } from "@/features/analyze/analyzeContribution";
import type { AnalyzeJob } from "@/types/analyze";

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

export function startJob(text: string): AnalyzeJob {
  const id = randomUUID();
  const job = createJob(id, text);
  // Fire-and-forget
  runPipeline(id).catch(err => {
    updateJob(id, j => { j.error = String(err?.message || err); });
  });
  return job;
}

export async function runPipeline(id: string) {
  const job = getJob(id);
  if (!job) throw new Error("Job not found");
  const input = job.text;

  // 1) parse / analyzeContribution
  setStepStatus(id, "parse", "in_progress", { detail: "Extrahiere Claims…" });
  const analysis = await analyzeContribution(String(input || ""));
  setStepStatus(id, "parse", "done", { result: analysis, detail: `Claims: ${analysis.claims?.length ?? 0}` });

  // 2) canon (hier nur zusammenfassen)
  setStepStatus(id, "canon", "in_progress", { detail: "Map auf Domain/Topics…" });
  await sleep(200); // Platzhalter
  const topics = {
    mainTopic: analysis.mainTopic ?? null,
    subTopics: analysis.subTopics ?? [],
  };
  setStepStatus(id, "canon", "done", { result: topics });

  // 3) db – interner Abgleich (Stub)
  setStepStatus(id, "db", "in_progress", { detail: "Suche ähnliche Einträge…" });
  await sleep(200);
  const duplicates: any[] = []; // später: echte DB-Suche
  setStepStatus(id, "db", "done", { result: { duplicates } });

  // 4) ext – externe Quellen (Stub)
  setStepStatus(id, "ext", "in_progress", { detail: "Recherchiere externe Quellen…" });
  await sleep(300);
  setStepStatus(id, "ext", "done", { result: { sources: [] } });

  // 5) Expertenpanel (Stub)
  setStepStatus(id, "experts", "in_progress", { detail: "Mehrperspektivische Bewertung…" });
  await sleep(300);
  setStepStatus(id, "experts", "done", { result: { opinions: [] } });

  // 6) Faktencheck (Stub – später echte Checks)
  setStepStatus(id, "fact", "in_progress", { detail: "Prüfe Behauptungen…" });
  await sleep(300);
  const fact = (analysis.claims || []).map(c => ({ text: c.text, verdict: "unbewertet" }));
  setStepStatus(id, "fact", "done", { result: fact });

  // 7) Trust-Score (Heuristik)
  setStepStatus(id, "trust", "in_progress", { detail: "Bewerte Vertrauensindikatoren…" });
  await sleep(150);
  const base = 0.5;
  const bonus = Math.min((analysis.claims?.length || 0) * 0.03, 0.2);
  const trust = Math.max(0, Math.min(1, base + bonus));
  setStepStatus(id, "trust", "done", { result: { trust } });
}
TS

# ---- API: POST /api/analyze/jobs --------------------------------------------
cat > "$SRC/app/api/analyze/jobs/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { startJob } from "@/analyze/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || String(text).trim().length < 6) {
    return NextResponse.json({ error: "Input zu kurz" }, { status: 400 });
  }
  const job = startJob(String(text));
  return NextResponse.json({ id: job.id });
}
TS

# ---- API: GET /api/analyze/status?id=... ------------------------------------
cat > "$SRC/app/api/analyze/status/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/analyze/jobStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(job);
}
TS

# ---- API: GET /api/analyze/events?id=... (SSE) ------------------------------
cat > "$SRC/app/api/analyze/events/route.ts" <<'TS'
import { NextRequest } from "next/server";
import { subscribe, getJob } from "@/analyze/jobStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toEvent(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("id missing", { status: 400 });

  const job = getJob(id);
  if (!job) return new Response("not found", { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: any) => controller.enqueue(new TextEncoder().encode(toEvent(payload)));
      // sofort initialen Stand senden
      send(job);
      // subscribe auf Änderungen
      const unsub = subscribe(id, (j) => send(j));
      // Heartbeat
      const iv = setInterval(() => controller.enqueue(new TextEncoder().encode(": ping\n\n")), 15000);
      // close handler
      (controller as any)._cleanup = () => { clearInterval(iv); unsub(); };
    },
    cancel(reason) {
      const c: any = this as any;
      if (c._cleanup) c._cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
TS

# ---- UI: /contributions/new --------------------------------------------------
cat > "$SRC/app/contributions/new/page.tsx" <<'TSX'
"use client";
import React from "react";

type AnalyzeResult = {
  language: string;
  mainTopic?: string | null;
  subTopics: string[];
  regionHint?: string | null;
  claims: { text: string; categoryMain?: string | null; categorySubs: string[]; region?: string | null; authority?: string | null }[];
};

type AnalyzeJob = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  steps: { key: string; label: string; status: "queued"|"in_progress"|"done"|"failed"; detail?: string; result?: any }[];
  error?: string|null;
};

export default function NewContributionPage() {
  const [text, setText] = React.useState("");
  const [job, setJob] = React.useState<AnalyzeJob | null>(null);
  const [analysis, setAnalysis] = React.useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function start() {
    setLoading(true); setErr(null); setAnalysis(null); setJob(null);
    try {
      const r = await fetch("/api/analyze/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { id } = await r.json();
      attachSSE(id);
    } catch(e:any) {
      setErr(e?.message||"Fehler beim Start");
      setLoading(false);
    }
  }

  function attachSSE(id: string) {
    const es = new EventSource(`/api/analyze/events?id=${encodeURIComponent(id)}`);
    es.onmessage = (ev) => {
      const j: AnalyzeJob = JSON.parse(ev.data);
      setJob(j);
      // parse step result anzeigen
      const parse = j.steps.find(s => s.key === "parse" && s.result);
      if (parse?.result) setAnalysis(parse.result as AnalyzeResult);
      if (j.progress >= 100 || j.error) {
        es.close();
        setLoading(false);
      }
    };
    es.onerror = () => {
      es.close();
      setLoading(false);
    };
  }

  const allSteps = [
    "parse","canon","db","ext","experts","fact","trust"
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Beitrag erstellen & analysieren</h1>

      <div className="space-y-3">
        <textarea
          className="w-full min-h-[160px] p-3 border rounded"
          placeholder="Schreibe deinen Beitrag/These…"
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        <button
          onClick={start}
          disabled={loading || text.trim().length < 6}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Analysiere …" : "Analyse starten"}
        </button>
        {err && <div className="text-red-600">{err}</div>}
      </div>

      {/* Pipeline-Status */}
      {job && (
        <div className="border rounded p-4 space-y-3">
          <div className="font-medium">Pipeline</div>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="bg-green-600 h-2 rounded" style={{width: `${job.progress}%`}} />
          </div>
          <ul className="text-sm space-y-1">
            {allSteps.map(k => {
              const s = job.steps.find(x=>x.key===k);
              const dot = s?.status === "done" ? "bg-green-600" : s?.status === "in_progress" ? "bg-amber-500" : s?.status==="failed" ? "bg-red-600":"bg-gray-400";
              return (
                <li key={k} className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
                  <span className="font-medium">{s?.label || k}</span>
                  {s?.detail && <span className="text-gray-600">– {s.detail}</span>}
                </li>
              );
            })}
          </ul>
          {job.error && <div className="text-red-600">Fehler: {job.error}</div>}
        </div>
      )}

      {/* Ergebnisse aus parse */}
      {analysis && (
        <div className="border rounded p-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <div>Sprache: <b>{analysis.language || "—"}</b></div>
            <div>Hauptthema: <b>{analysis.mainTopic || "—"}</b></div>
            {!!analysis.subTopics?.length && (
              <div>Subthemen: <b>{analysis.subTopics.join(", ")}</b></div>
            )}
          </div>
          <div>
            <div className="font-medium mb-2">Extrahierte Claims</div>
            <ol className="list-decimal pl-5 space-y-2">
              {(analysis.claims || []).map((c, i) => (
                <li key={i}>
                  <div className="font-medium">{c.text}</div>
                  <div className="text-sm text-gray-600">
                    {c.categoryMain ? <>Kategorie: <b>{c.categoryMain}</b> · </> : null}
                    {c.categorySubs?.length ? <>Sub: {c.categorySubs.join(", ")} · </> : null}
                    {c.region ? <>Region: {c.region} · </> : null}
                    {c.authority ? <>Institution: {c.authority}</> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="text-sm text-gray-700">
            Nach Abschluss siehst du zusätzlich Faktencheck-Ergebnis & einen vorläufigen Trust-Score.
          </div>
        </div>
      )}
    </div>
  );
}
TSX

# tsconfig sichergehen: DOM/ES libs sind i.d.R. schon aktiv – nichts zu tun

echo "Analyze pipeline installed."
