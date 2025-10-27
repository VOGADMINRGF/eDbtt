#!/usr/bin/env bash
set -euo pipefail
F="apps/web/src/ui/PipelineHUD.tsx"
[ -f "$F" ] && cp "$F" "$F.bak.$(date +%s)"
mkdir -p "$(dirname "$F")"
cat > "$F" <<'TS'
"use client";
import React from "react";
import { usePipeline } from "@/store/pipeline";

export default function PipelineHUD(){
  const s = usePipeline(); // { analyzing, ready, steps }
  // HUD erst zeigen, wenn aktiv oder mindestens ein Step existiert.
  if (!s?.analyzing && !(Array.isArray(s?.steps) && s.steps.length)) return null;

  return (
    <div className="fixed right-4 top-4 z-40 w-[280px] rounded-xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur px-3 py-2">
      <div className="text-xs font-semibold text-slate-700 mb-1">Analyse läuft…</div>
      <ul className="space-y-1">
        {(s?.steps||[]).map((st: any) => (
          <li key={st.id} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-slate-600">{st.label}</span>
              <span className={
                st.status==="ok" ? "text-emerald-600"
                : st.status==="err" ? "text-rose-600"
                : "text-sky-600"
              }>
                {st.status==="ok"?"✓":st.status==="err"?"!" :"…"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
TS
echo "✓ Patched $F"
