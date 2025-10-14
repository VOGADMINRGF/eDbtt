// features/factcheck/components/UnitList.tsx
import React from "react";

export type UnitListItem = {
  id: string;
  kind: string;
  text: string;
  confidence: number;
  claim?: { id: string; status: string };
};

export function UnitList({ units }: { units: UnitListItem[] }) {
  return (
    <div className="space-y-3">
      {units.map((u) => (
        <div key={u.id} className="rounded-2xl border p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-full bg-gray-100">{u.kind}</span>
            {u.claim && <span className="px-2 py-0.5 rounded-full bg-indigo-100">{u.claim.status}</span>}
            <span className="ml-auto text-gray-500">conf {u.confidence.toFixed(2)}</span>
          </div>
          <p className="mt-2">{u.text}</p>
          <div className="mt-2 flex gap-2">
            <button className="text-xs underline" data-unit={u.id}>Weiter prüfen</button>
            <button className="text-xs underline opacity-70" data-unit={u.id}>Nicht weiter verfolgen</button>
          </div>
        </div>
      ))}
    </div>
  );
}
