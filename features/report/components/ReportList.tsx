// features/report/components/ReportList.tsx
// Finale Version 04.08.2025 – Demo-Quelle: features/report/data/demoReports
"use client";

import React, { useMemo, useState } from "react";
import ReportCard from "./ReportCard";
import demoReports from "../data/demoReports";
import type { ReportFull } from "../data/types";

type Props = {
  /** Optional: eigene Startdaten (überschreibt Demo, wenn gesetzt) */
  initial?: ReportFull[];
  /** Optional: Anfangs-Suchtext */
  query?: string;
  /** Optional: Start-Tagfilter */
  tag?: string;
};

export default function ReportList({ initial, query = "", tag = "" }: Props) {
  const [q, setQ] = useState(query);
  const [activeTag, setActiveTag] = useState(tag);

  // Quelle: bevorzugt Props.initial, sonst Demo
  const source = (initial?.length ? initial : demoReports) as ReportFull[];

  // Alle Tags (für Chips)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    source.forEach(r => r.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [source]);

  // Gefilterte Items
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return source.filter(r => {
      const matchesTag = !activeTag || r.tags?.includes(activeTag);
      if (!needle) return matchesTag;
      const hay =
        (r.title ?? "") + " " +
        (r.subtitle ?? "") + " " +
        (r.summary ?? "") + " " +
        (r.tags?.join(" ") ?? "");
      return matchesTag && hay.toLowerCase().includes(needle);
    });
  }, [source, q, activeTag]);

  return (
    <section className="max-w-5xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Titel, Stichwort, Zusammenfassung…"
          className="w-full sm:w-2/3 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Reports durchsuchen"
        />
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTag("")}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${activeTag ? "border-neutral-300 text-neutral-600" : "bg-indigo-600 text-white border-indigo-600"}`}
            >
              Alle
            </button>
            {allTags.map(t => (
              <button
                key={t}
                onClick={() => setActiveTag(t === activeTag ? "" : t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                  t === activeTag ? "bg-indigo-600 text-white border-indigo-600" : "border-neutral-300 text-neutral-700 hover:border-indigo-400"
                }`}
                aria-pressed={t === activeTag}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Liste */}
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Keine Reports gefunden{q ? ` für „${q}“` : ""}{activeTag ? ` (Tag: ${activeTag})` : ""}.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <li key={r.id}>
              <ReportCard report={r as any} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
