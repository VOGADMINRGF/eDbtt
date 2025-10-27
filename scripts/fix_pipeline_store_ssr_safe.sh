#!/usr/bin/env bash
set -euo pipefail
FILE="apps/web/src/store/pipeline.ts"
mkdir -p "$(dirname "$FILE")"

BACKUP(){
  cp "$FILE" "$FILE.bak.$(date +%s)"
  echo "↳ Backup: $FILE.bak.*"
}

NEED_WRITE=true
if [ -f "$FILE" ]; then
  # schon sauber? (3. Argument an useSyncExternalStore + 'subs' korrekt)
  if grep -q 'useSyncExternalStore(.*getSnapshot.*getSnapshot' "$FILE" 2>/dev/null \
     && ! grep -q 'sub\.add' "$FILE" 2>/dev/null; then
    NEED_WRITE=false
    echo "✓ Store scheint bereits SSR-sicher zu sein: $FILE"
  fi
fi

if $NEED_WRITE; then
  [ -f "$FILE" ] && BACKUP
  cat > "$FILE" <<'TS'
// eslint-disable-next-line react-refresh/only-export-components
"use client";
import { useSyncExternalStore } from "react";

export type Step = { id:string; label:string; status:"idle"|"run"|"ok"|"err"; ms?:number; doneAt?:number };

const steps = new Map<string, Step>();
let analyzing = false;
let ready = false;

const subs = new Set<() => void>();
const emit = () => { subs.forEach(fn => { try { fn(); } catch {} }); };

export function setAnalyzing(v:boolean){ analyzing = v; if (!v) ready = true; emit(); }
export function getAnalyzing(){ return analyzing; }
export function getReady(){ return ready; }

export function reset(){
  analyzing = false;
  ready = false;
  steps.clear();
  emit();
}

export function setStep(s: Step){
  const prev = steps.get(s.id);
  const finished = (s.status === "ok" || s.status === "err");
  steps.set(s.id, {
    ...prev, ...s,
    doneAt: finished ? (prev?.doneAt ?? Date.now()) : prev?.doneAt
  });
  emit();
}

function getSnapshot(){
  return { analyzing, ready, steps: Array.from(steps.values()) };
}
function subscribe(cb: () => void){
  subs.add(cb);
  return () => subs.delete(cb);
}

/** Client-Hook – inkl. getServerSnapshot für SSR-Sicherheit */
export function usePipeline(){
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
TS
  echo "✓ Store geschrieben: $FILE"
fi

echo "Fertig. Starte dev neu: pnpm -F @vog/web dev"
