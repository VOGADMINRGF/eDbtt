#!/usr/bin/env bash
set -euo pipefail
FILE="apps/web/src/store/pipeline.ts"
mkdir -p "$(dirname "$FILE")"

[ -f "$FILE" ] && cp "$FILE" "$FILE.bak.$(date +%s)"

cat > "$FILE" <<'TS'
// eslint-disable-next-line react-refresh/only-export-components
"use client";
import { useSyncExternalStore } from "react";

export type Step = {
  id: string;
  label: string;
  status: "idle" | "run" | "ok" | "err";
  ms?: number;
  doneAt?: number;
};

/** ----- In-Memory State ----- */
const steps = new Map<string, Step>();
let analyzing = false;
let ready = false;

const subs = new Set<() => void>();
const emit = () => { subs.forEach(fn => { try { fn(); } catch {} }); };

/** ----- Mutators / Accessors ----- */
export function setAnalyzing(v: boolean) { analyzing = v; if (!v) ready = true; emit(); }
export function getAnalyzing() { return analyzing; }
export function getReady() { return ready; }

export function reset() {
  analyzing = false;
  ready = false;
  steps.clear();
  emit();
}

export function setStep(s: Step) {
  const prev = steps.get(s.id);
  const finished = s.status === "ok" || s.status === "err";
  steps.set(s.id, { ...prev, ...s, doneAt: finished ? (prev?.doneAt ?? Date.now()) : prev?.doneAt });
  emit();
}

/** ----- Snapshots ----- */
function getSnapshot() {
  return { analyzing, ready, steps: Array.from(steps.values()) };
}

/* WICHTIG: serverseitig IMMER das gleiche Objekt liefern → verhindert Update-Loops */
const SSR_SNAPSHOT = Object.freeze({ analyzing: false, ready: false, steps: [] as Step[] });
function getServerSnapshot() { return SSR_SNAPSHOT; }

/** ----- Subscription ----- */
function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

/** ----- Hook ----- */
export function usePipeline() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
TS

echo "✓ wrote $FILE"
echo "→ Bitte Next neu starten: pnpm -F @vog/web dev"
