// features/factcheck/components/SourceBadge.tsx
import React from "react";

export default function SourceBadge({ domain, trust }: { domain: string; trust?: number }) {
  const pct = trust != null ? Math.round(trust * 100) : undefined;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs">
      <span className="font-mono">{domain}</span>
      {pct != null && (
        <span aria-label={`Quelle Vertrauen ${pct}%`} className="opacity-70">{pct}%</span>
      )}
    </span>
  );
}
