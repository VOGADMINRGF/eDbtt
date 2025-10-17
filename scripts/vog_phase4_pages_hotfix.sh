#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
WEB="$ROOT/apps/web"

echo ">>> Phase 4: Hotfix pages + final bson->mongodb"

# portable sed
if command -v gsed >/dev/null 2>&1; then SED="gsed"; else SED="sed"; fi

# --- A) bson -> mongodb endgültig fixen (ENV statt argv!)
if [ -f "$WEB/src/server/drafts.ts" ]; then
  FILE="$WEB/src/server/drafts.ts" node <<'NODE'
const fs=require('fs'); const p=process.env.FILE;
let s=fs.readFileSync(p,'utf8');
s=s.replace(/from\s*['"]bson['"]/g,'from "mongodb"');  // alle Importe hart ersetzen
fs.writeFileSync(p,s);
console.log(" - drafts.ts: bson->mongodb patched");
NODE
else
  echo " - drafts.ts nicht gefunden (übersprungen)"
fi

# --- B) Gemeinsame AnalyzeUI (Client) bereitstellen
mkdir -p "$WEB/src/components/analyze"

cat > "$WEB/src/components/analyze/AnalyzeUI.tsx" <<'TSX'
"use client";
import { useEffect, useRef, useState } from "react";
import { ActivityConsole } from "@/components/analyze/ActivityConsole";
import { AnalyzeOverlay } from "@/components/analyze/AnalyzeOverlay";
import { useAnalyzeOverlay } from "@/components/analyze/useAnalyzeOverlay";

type Step = { id:number; title:string; status:"idle"|"running"|"done"|"error" };
const BASE: Step[] = [
  {id:1,title:"Vorverarbeitung",status:"idle"},
  {id:2,title:"Kanon-Mapping",status:"idle"},
  {id:3,title:"Interner Abgleich",status:"idle"},
  {id:4,title:"Externe Quellen",status:"idle"},
  {id:5,title:"Experten-Panel",status:"idle"},
  {id:6,title:"Faktencheck",status:"idle"},
  {id:7,title:"Trust-Score",status:"idle"},
];

export default function AnalyzeUI() {
  const [text, setText] = useState("");
  const [steps, setSteps] = useState<Step[]>(BASE);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [news, setNews] = useState<{title:string;url:string;score?:number}[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const { activeIdx } = useAnalyzeOverlay(text, steps.length);

  function updateStep(i:number, status:Step["status"]) {
    setSteps(prev => prev.map(s => s.id===i+1 ? {...s, status} : s));
  }

  async function fallback() {
    const res = await fetch("/api/contributions/analyze", {
      method: "POST",
      headers: {"content-type":"application/json"},
      body: JSON.stringify({ text })
    });
    const data = await res.json().catch(()=> ({}));
    setProgress(100);
    setLogs(prev => [...prev, "Analyse abgeschlossen (Fallback)", JSON.stringify(data).slice(0,200)+"…"]);
  }

  async function run() {
    setSteps(BASE.map((s,i)=> ({...s, status: i===0?"running":"idle"})));
    setProgress(0); setLogs([]); setNews([]);

    // 1) Live-Stream per SSE
    try {
      const es = new EventSource(`/api/contributions/analyze/stream?text=${encodeURIComponent(text)}`);
      esRef.current = es;
      es.addEventListener("step",(e:any)=>{
        const { i } = JSON.parse(e.data);
        updateStep(i,"running");
        if (i>0) updateStep(i-1,"done");
      });
      es.addEventListener("progress",(e:any)=> setProgress(JSON.parse(e.data).p ?? 0));
      es.addEventListener("log",(e:any)=> setLogs(prev => [...prev, JSON.parse(e.data).msg]));
      es.addEventListener("news",(e:any)=> setNews(JSON.parse(e.data).items ?? []));
      es.addEventListener("done",()=>{ updateStep(steps.length-1,"done"); es.close(); esRef.current=null; });
      es.onerror = () => { es.close(); esRef.current=null; fallback(); };
      return;
    } catch { /* blockiert -> POST-Fallback */ }

    // 2) POST-Fallback
    await fallback();
  }

  useEffect(()=>()=>{ esRef.current?.close(); },[]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Beitrag erstellen & analysieren</h1>
      <textarea
        className="w-full h-56 border p-3 rounded"
        value={text}
        onChange={e=>setText(e.target.value)}
        placeholder="Text hier einfügen…"
      />
      <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={run}>
        Analyse starten
      </button>

      <div className="mt-6">
        <div className="text-xl font-semibold mb-2">Analyse-Pipeline</div>
        <ul className="list-disc ml-6 space-y-1">
          {steps.map(s =>
            <li key={s.id}>
              <span className={
                s.status==="running" ? "font-semibold" :
                s.status==="done" ? "text-green-700" :
                s.status==="error" ? "text-red-700" : ""
              }>{s.title}</span>
            </li>
          )}
        </ul>
      </div>

      <ActivityConsole progress={progress} logs={logs} news={news} />
      <AnalyzeOverlay steps={steps} text={text} activeSentenceIndex={activeIdx} />
    </div>
  );
}
TSX

# --- C) Beide Pages auf die gemeinsame UI umstellen (mit Backup)
ANALYZE_PAGE="$WEB/src/app/contributions/analyze/page.tsx"
if [ -f "$ANALYZE_PAGE" ]; then cp "$ANALYZE_PAGE" "$ANALYZE_PAGE.bak"; fi
mkdir -p "$(dirname "$ANALYZE_PAGE")"
cat > "$ANALYZE_PAGE" <<'TSX'
import dynamic from "next/dynamic";
const AnalyzeUI = dynamic(() => import("@/components/analyze/AnalyzeUI"), { ssr:false });
export default function Page(){ return <AnalyzeUI />; }
TSX
echo " - rewired /contributions/analyze to AnalyzeUI (backup: page.tsx.bak if existed)"

NEW_PAGE="$WEB/src/app/contributions/new/page.tsx"
if [ -f "$NEW_PAGE" ]; then cp "$NEW_PAGE" "$NEW_PAGE.bak"; fi
mkdir -p "$(dirname "$NEW_PAGE")"
cat > "$NEW_PAGE" <<'TSX'
import dynamic from "next/dynamic";
const AnalyzeUI = dynamic(() => import("@/components/analyze/AnalyzeUI"), { ssr:false });
export default function Page(){ return <AnalyzeUI />; }
TSX
echo " - rewired /contributions/new to AnalyzeUI (backup: page.tsx.bak if existed)"

echo ">>> Phase 4 done"
