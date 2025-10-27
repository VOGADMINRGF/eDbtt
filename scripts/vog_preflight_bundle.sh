#!/usr/bin/env bash
set -euo pipefail

ROOT="${PWD}"
APP="apps/web"
SRC="$APP/src"

echo "→ Root: $ROOT"
test -d "$APP" || { echo "❌ $APP nicht gefunden"; exit 1; }

mkdir -p "$SRC/store" "$SRC/ui" "$SRC/lib/hooks" "$SRC/lib/net" "$SRC/lib/safety" "$SRC/lib/cache" "$SRC/app/api/statements/similar" || true

# ──────────────────────────────────────────────────────────────────────────────
# 1) SSR-sicherer Pipeline-Store + klare Step-Labels
# ──────────────────────────────────────────────────────────────────────────────
STORE_FILE="$SRC/store/pipeline.ts"
if ! rg -q "export function usePipeline" "$STORE_FILE" 2>/dev/null; then
  cat > "$STORE_FILE" <<'TS'
// @ts-nocheck
"use client";
import {useEffect, useSyncExternalStore} from "react";

type StepState = "idle"|"running"|"done"|"error";
type Step = {
  id: string;
  label: string;         // menschlich verständlich
  state: StepState;
  startedAt?: number;
  finishedAt?: number;
  error?: string|null;
};

const steps = new Map<string, Step>([
  ["variants", { id:"variants", label:"Varianten & Lager prüfen", state:"idle" }],
  ["research", { id:"research", label:"Recherche / Newsfeeds", state:"idle" }],
  ["quality",  { id:"quality",  label:"Claim-Qualität & Grammatik", state:"idle" }],
  ["similar",  { id:"similar",  label:"Ähnliche / Duplikate finden", state:"idle" }],
  ["canon",    { id:"canon",    label:"Kanon & Zuständigkeit", state:"idle" }],
]);

let analyzing = false;
let ready = false;

const subs = new Set<() => void>();
function emit(){ subs.forEach(cb=>cb()); }

export function markStart(id:string){
  const s = steps.get(id); if(!s) return;
  s.state = "running"; s.startedAt = Date.now(); s.error=null;
  analyzing = true; ready = false; emit();
}
export function markDone(id:string){
  const s = steps.get(id); if(!s) return;
  s.state = "done"; s.finishedAt = Date.now();
  if ([...steps.values()].every(x => x.state==="done")) { analyzing=false; ready=true; }
  emit();
}
export function markError(id:string, msg:string){
  const s = steps.get(id); if(!s) return;
  s.state = "error"; s.error = msg; analyzing=false; ready=false; emit();
}
export function resetAll(){
  for (const s of steps.values()){ s.state="idle"; s.startedAt=undefined; s.finishedAt=undefined; s.error=null; }
  analyzing=false; ready=false; emit();
}

function subscribe(cb:()=>void){ subs.add(cb); return ()=>subs.delete(cb); }
const getSnapshot = ()=>({ analyzing, ready, steps: Array.from(steps.values()) });
const getServerSnapshot = getSnapshot; // stabil, damit SSR/Next nicht meckert

/** Client-Hook */
export function usePipeline(){
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// optional: globale Helfer (nur wenn ihr sie aufruft)
export const Pipeline = { markStart, markDone, markError, resetAll };
TS
  echo "  ✓ wrote: $STORE_FILE"
else
  echo "  • skip: $STORE_FILE schon vorhanden"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 2) HUD, das nur bei laufender Analyse sichtbar ist – und Klartext zeigt
# ──────────────────────────────────────────────────────────────────────────────
HUD_FILE="$SRC/ui/PipelineHUD.tsx"
cat > "$HUD_FILE" <<'TS'
"use client";
import {usePipeline} from "@/store/pipeline";

export default function PipelineHUD(){
  const { analyzing, steps } = usePipeline();
  const show = analyzing || steps.some(s=>s.state==="running");

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] rounded-xl bg-white/90 backdrop-blur shadow-lg border border-gray-200 p-3 w-[320px]">
      <div className="text-sm font-medium mb-2">Analyse läuft…</div>
      <ul className="space-y-2">
        {steps.map(s=>{
          const dot = s.state==="done" ? "✅" : s.state==="running" ? "🟢" : s.state==="error" ? "⛔️" : "⏸️";
          return (
            <li key={s.id} className="flex items-start gap-2 text-sm">
              <span className="mt-[2px]">{dot}</span>
              <span>{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
TS
echo "  ✓ wrote: $HUD_FILE"

# ──────────────────────────────────────────────────────────────────────────────
# 3) Instrumentierung für Fetch (optional nutzbar)
# ──────────────────────────────────────────────────────────────────────────────
NET_FILE="$SRC/lib/net/fetchInstrument.ts"
if [ ! -f "$NET_FILE" ]; then
cat > "$NET_FILE" <<'TS'
"use client";
export default function FetchInstrument({ children }:{children:React.ReactNode}){ return <>{children}</>; }
TS
echo "  ✓ wrote: $NET_FILE"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 4) Civic-Search Hook (debounce + abort + Err/Loading)
# ──────────────────────────────────────────────────────────────────────────────
HOOK_FILE="$SRC/lib/hooks/useCivicSearch.ts"
if [ ! -f "$HOOK_FILE" ]; then
cat > "$HOOK_FILE" <<'TS'
"use client";
import { useEffect, useRef, useState } from "react";
type Params = { topic?: string; region?: string; keywords?: string[]; limit?: number };

export function useCivicSearch(p: Params, enabled=true){
  const [data,setData] = useState<any[]>([]);
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState<string|undefined>();
  const timer = useRef<any>();
  const ctrl  = useRef<AbortController|null>(null);
  const lastKey = useRef<string>("");

  useEffect(()=>{
    if (!enabled) return;
    const key = JSON.stringify(p||{});
    if (key===lastKey.current) return;
    lastKey.current = key;

    clearTimeout(timer.current);
    timer.current = setTimeout(async ()=>{
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      setLoading(true); setErr(undefined);
      try{
        const res = await fetch("/api/search/civic", {
          method:"POST", headers:{ "content-type":"application/json" },
          body: JSON.stringify(p||{}), signal: ctrl.current.signal
        });
        const j = await res.json();
        setData(Array.isArray(j.items)?j.items:[]);
      }catch(e:any){
        if (e?.name!=="AbortError") setErr(String(e.message||e));
      }finally{ setLoading(false); }
    }, 700);

    return ()=>{ clearTimeout(timer.current); ctrl.current?.abort(); };
  },[p?.topic, p?.region, JSON.stringify(p?.keywords||[]), p?.limit, enabled]);

  return { data, loading, err };
}
TS
echo "  ✓ wrote: $HOOK_FILE"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 5) Similar-Route: Diakritik-Normalizer für robuste Treffer
# ──────────────────────────────────────────────────────────────────────────────
SIM_FILE="$SRC/app/api/statements/similar/route.ts"
if [ ! -f "$SIM_FILE" ]; then
cat > "$SIM_FILE" <<'TS'
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

function normalize(s: string) {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
export async function GET(req: NextRequest) {
  const raw = String(req.nextUrl.searchParams.get("text") ?? "");
  const text = normalize(raw);
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
echo "  ✓ wrote: $SIM_FILE"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 6) Safety: NO-OP Moderation (keine Heuristik) – per Flag umschaltbar
# ──────────────────────────────────────────────────────────────────────────────
SAFE_FILE="$SRC/lib/safety/moderation.ts"
cat > "$SAFE_FILE" <<'TS'
export type ModerationResult = { allow: boolean; note?: string|null; hard?: boolean };
const STRICT = process.env.VOG_SAFETY_STRICT === "1";

/** Standard: keine Heuristik, kein Block. Nur Hinweisstring für ganz harte Fälle, wenn STRICT=1. */
export function runModeration(text: string): ModerationResult {
  if (!STRICT) return { allow: true, note: null };
  // Minimaler harter Filter (nur bei STRICT): Beispielwortliste
  const hard = /(kinderpornographie|bombenbauanleitung|aufruf zu gewalt)/i.test(text);
  if (hard) return { allow: false, hard: true, note: "Hard-Block (STRICT) – bitte umformulieren." };
  return { allow: true, note: null };
}
TS
echo "  ✓ wrote: $SAFE_FILE"

# ──────────────────────────────────────────────────────────────────────────────
# 7) Mini In-Memory TTL Cache (für Feeds/Similar), 10–30 Min
# ──────────────────────────────────────────────────────────────────────────────
CACHE_FILE="$SRC/lib/cache/ttl.ts"
if [ ! -f "$CACHE_FILE" ]; then
cat > "$CACHE_FILE" <<'TS'
type Entry<T> = { t: number; ttl: number; v: T };
const mem = new Map<string, Entry<any>>();
export function ttlGet<T>(k:string): T|undefined {
  const e = mem.get(k); if (!e) return;
  if (Date.now() - e.t > e.ttl) { mem.delete(k); return; }
  return e.v as T;
}
export function ttlSet<T>(k:string, v:T, ttlMs:number){ mem.set(k, { t: Date.now(), ttl: ttlMs, v }); }
TS
echo "  ✓ wrote: $CACHE_FILE"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 8) Dev-Origins Warnung entschärfen (optional)
# ──────────────────────────────────────────────────────────────────────────────
NCFG="$APP/next.config.ts"
if [ -f "$NCFG" ] && ! rg -q "allowedDevOrigins" "$NCFG"; then
  cat >> "$NCFG" <<'TS'

// --- added by vog_preflight_bundle ---
export const experimental = {
  ...(typeof experimental!=="undefined" ? experimental : {}),
  allowedDevOrigins: ["http://localhost:3000"],
};
TS
  echo "  ✓ patched: allowedDevOrigins in next.config.ts (falls Next 15.3 Warnung kam)"
else
  echo "  • skip: next.config.ts (unverändert)"
fi

echo "→ Done. Neustart:  pnpm -F @vog/web dev"
