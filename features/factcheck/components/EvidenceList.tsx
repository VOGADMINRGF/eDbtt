// features/factcheck/components/EvidenceList.tsx
import React from "react";
import SourceBadge from "./SourceBadge";
import type { Evidence } from "../types";

export function EvidenceList({ items }: { items: Evidence[] }) {
  const groups = {
    FOR: items.filter(x => x.stance === "FOR"),
    AGAINST: items.filter(x => x.stance === "AGAINST"),
    NEUTRAL: items.filter(x => x.stance === "NEUTRAL"),
  };
  const Block = ({ title, arr, color }: { title: string; arr: Evidence[]; color: string }) => (
    arr.length ? (
      <div>
        <div className={`text-xs font-bold mb-1 ${color}`}>{title}</div>
        <ul className="space-y-1">
          {arr.map(e => (
            <li key={e.id} className="flex items-center gap-2 text-xs">
              <SourceBadge domain={e.source.domain} trust={e.trustHint}/>
              <a className="underline" href={e.source.url} target="_blank" rel="noopener noreferrer">
                {e.source.title ?? e.source.url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null
  );
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <Block title="Pro" arr={groups.FOR} color="text-emerald-700"/>
      <Block title="Neutral" arr={groups.NEUTRAL} color="text-slate-600"/>
      <Block title="Contra" arr={groups.AGAINST} color="text-rose-700"/>
    </div>
  );
}
