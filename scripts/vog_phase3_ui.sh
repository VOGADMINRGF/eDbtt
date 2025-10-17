#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
WEB="$ROOT/apps/web"

echo ">>> Phase 3: UI overlay + activity console (Transparency/Customer Journey)"

mkdir -p "$WEB/src/components/analyze"

# Overlay (Rheinschrift)
cat > "$WEB/src/components/analyze/AnalyzeOverlay.tsx" <<'TSX'
"use client";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
export type Step = { id:number; title:string; status:"idle"|"running"|"done"|"error" };

export function AnalyzeOverlay({ steps, text, activeSentenceIndex }:{
  steps:Step[]; text:string; activeSentenceIndex:number
}) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return (
    <div className="fixed inset-0 pointer-events-none z-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl bg-black/70 text-white rounded-2xl shadow-xl p-4 sm:p-6 backdrop-blur">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="text-lg sm:text-xl font-semibold">Aktivität</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {steps.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <div className={
                    s.status === "running" ? "w-2 h-2 rounded-full bg-white animate-pulse" :
                    s.status === "done"    ? "w-2 h-2 rounded-full bg-green-400" :
                    s.status === "error"   ? "w-2 h-2 rounded-full bg-red-400"   :
                                             "w-2 h-2 rounded-full bg-gray-400"
                  }/>
                  <div className={s.status === "running" ? "font-semibold" : ""}>{s.title}</div>
                </div>
              ))}
            </div>
            <div className="bg-white text-black rounded-lg p-3 text-sm overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeSentenceIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[64px]"
                >
                  <span>
                    {sentences.map((s, i) => (
                      <mark key={i} className={
                        "rounded px-1 " + (i === activeSentenceIndex ? "bg-yellow-200" : "bg-transparent")
                      }>{s + (i < sentences.length-1 ? " " : "")}</mark>
                    ))}
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="mt-3 text-xs text-gray-600">Live-Analyse – hervorgehoben = aktueller Schritt</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
TSX
echo " - AnalyzeOverlay.tsx written"

# Activity Console (Progress/Logs/News)
cat > "$WEB/src/components/analyze/ActivityConsole.tsx" <<'TSX'
"use client";
import React from "react";
export function ActivityConsole({ progress, logs, news }:{
  progress:number; logs:string[]; news:{title:string;url:string;score?:number}[];
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="w-full h-2 bg-gray-200 rounded"><div className="h-2 bg-blue-500 rounded" style={{width:`${progress}%`}} /></div>
      <div className="bg-white rounded border p-3 text-sm max-h-40 overflow-auto">
        {logs.length===0 ? <div className="text-gray-500">Warte auf Ereignisse…</div> :
          logs.map((l,i)=><div key={i} className="text-gray-800">{l}</div>)}
      </div>
      <div className="bg-white rounded border p-3 text-sm">
        <div className="font-semibold mb-1">Quellen (live)</div>
        {news.length===0 ? <div className="text-gray-500">Noch keine Treffer…</div> :
          <ul className="list-disc ml-4">{news.map((n,i)=><li key={i}><a className="underline" href={n.url} target="_blank" rel="noreferrer">{n.title}</a>{typeof n.score==="number" ? ` · Relevanz ${Math.round(n.score*100)}%`:""}</li>)}</ul>}
      </div>
    </div>
  );
}
TSX
echo " - ActivityConsole.tsx written"

# Hook
cat > "$WEB/src/components/analyze/useAnalyzeOverlay.ts" <<'TS'
"use client";
import { useEffect, useMemo, useState } from "react";
export function useAnalyzeOverlay(text: string, totalSteps: number) {
  const sentences = useMemo(() => text.split(/(?<=[.!?])\s+/).filter(Boolean), [text]);
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveIdx(i => (i+1) % Math.max(1, sentences.length)), 900);
    return () => clearInterval(id);
  }, [sentences.length]);
  return { activeIdx };
}
TS
echo " - useAnalyzeOverlay.ts written"

echo ">>> Phase 3 done"
