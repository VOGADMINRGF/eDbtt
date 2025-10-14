// features/report/components/ReportExplorer.client.tsx
"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import type { ReportListItem } from "./ReportPage";
import ReportCard from "./ReportCard";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
// Optional: StatementCard nur einhängen, wenn du die Daten dafür auch holst
// import StatementCard from "@features/statement/components/StatementCard";

export default function ReportExplorer({
  initialReports,
  initialLanguage = "de",
}: {
  initialReports: ReportListItem[];
  initialLanguage?: string;
}) {
  const [search, setSearch] = useState("");
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [language, setLanguage] = useState(initialLanguage);

  const themes = useMemo(() => {
    const s = new Set<string>();
    for (const r of initialReports) r.tags?.forEach((t) => t && s.add(t));
    return Array.from(s);
  }, [initialReports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialReports.filter((r) => {
      const okTheme = activeTheme ? r.tags?.includes(activeTheme) : true;
      const okSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.summary ?? "").toLowerCase().includes(q);
      return okTheme && okSearch;
    });
  }, [initialReports, search, activeTheme]);

  const [selectedId, setSelectedId] = useState<string | null>(
    filtered[0]?.id ?? initialReports[0]?.id ?? null
  );

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  const relatedStatementsIds = selected?.statementIds ?? [];
  const news = selected?.news ?? [];

  return (
    <div className="min-h-screen py-16 bg-neutral-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-2 lg:flex-row lg:px-6">
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <LeftSidebar />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="mb-6 flex flex-col items-center gap-4 md:flex-row">
            <h1 className="flex-shrink-0 text-3xl font-bold text-indigo-800">
              Reports & Analysen
            </h1>
            <div className="relative w-full max-w-md flex-1">
              <FiSearch className="absolute left-3 top-3 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-neutral-300 pl-10 pr-4 py-2 shadow-sm"
                placeholder="Suche Reports..."
                aria-label="Reports durchsuchen"
              />
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTheme(null)}
              className={`rounded-full px-4 py-1 text-sm transition ${
                !activeTheme ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              Alle Themen
            </button>
            {themes.map((label) => (
              <button
                key={label}
                onClick={() => setActiveTheme(label)}
                className={`rounded-full px-4 py-1 text-sm transition ${
                  activeTheme === label ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedId(report.id)}
                className={`cursor-pointer ${
                  selected?.id === report.id ? "ring-2 ring-indigo-400" : ""
                }`}
                tabIndex={0}
                aria-label={`Report: ${report.title}`}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && setSelectedId(report.id)
                }
              >
                <ReportCard report={report as any} language={language} />
              </div>
            ))}
          </div>

          {/* Statements-Block (optional aktivieren, wenn Daten vorhanden) */}
          {relatedStatementsIds.length > 0 && (
            <section className="mx-auto mt-8 max-w-4xl space-y-3">
              <h2 className="mb-2 text-xl font-bold text-indigo-700">
                Statements zu „{selected?.title}“
              </h2>
              {/* TODO: hole die Statements per IDs (Client-Query oder Server-Prop) */}
              {/* {statements.map((st) => (
                <StatementCard key={st.id} statement={st} language={language} />
              ))} */}
              <ul className="text-sm text-neutral-600">
                {relatedStatementsIds.map((id) => (
                  <li key={id} className="list-disc pl-4">{id}</li>
                ))}
              </ul>
            </section>
          )}
        </main>

        <aside className="hidden w-80 flex-shrink-0 xl:block">
          <RightSidebar news={news} />
        </aside>
      </div>
    </div>
  );
}
