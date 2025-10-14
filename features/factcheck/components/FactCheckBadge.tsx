// features/factcheck/components/FactCheckBadge.tsx
import React from "react";
import type { FactVerdict } from "../types";

const MAP: Record<FactVerdict, { label: string; cls: string }> = {
  LIKELY_TRUE:  { label: "Wahrscheinlich wahr", cls: "bg-emerald-100 text-emerald-800" },
  LIKELY_FALSE: { label: "Wahrscheinlich falsch", cls: "bg-rose-100 text-rose-700" },
  MIXED:        { label: "Gemischt", cls: "bg-amber-100 text-amber-800" },
  UNDETERMINED: { label: "Unbestimmt", cls: "bg-slate-100 text-slate-700" },
};

export default function FactCheckBadge({ verdict, confidence }: { verdict: FactVerdict; confidence: number }) {
  const v = MAP[verdict];
  const pct = Math.round(confidence * 100);
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${v.cls}`} title={`${v.label} (${pct}%)`}>
      {v.label} • {pct}%
    </span>
  );
}
