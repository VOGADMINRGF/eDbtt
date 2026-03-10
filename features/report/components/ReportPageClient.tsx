"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import ReportCard from "./ReportCard";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import StatementCard from "../../statement/components/StatementCard";
import rawDemoStatements from "../../statement/data/statements_demo";
import { INPUT } from "@/lib/ui/inputs";

type NewsItem = { id: string; title: string; url?: string; source?: string; at?: string | Date };

type ReportE150 = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  tags?: string[];
  imageUrl?: string;
  language?: string;
  status?: string;
  visibility?: string;
  regionScope?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  statements?: string[];
  news?: NewsItem[];
  [key: string]: any;
};

const demoStatements = rawDemoStatements as Array<{ id: string }> & Record<string, unknown>;

type StatementRecord = {
  core: {
    text: string;
    responsibility?: string | null;
    topicKanonId?: string | null;
    reviewStatus?: string | null;
  };
  evidence: Array<{
    id: string;
    sourceType: string;
    status?: string | null;
    baseCountry?: string | null;
    compareCountry?: string | null;
    tradeAspect?: string | null;
    searchQuery?: string | null;
    domainTags?: string[] | null;
    stakeholderTags?: string[] | null;
  }>;
  perspectives: { items: Array<{ text: string; stance: "pro" | "contra" | "alternative" }> };
  quality: {
    precision: number;
    checkability: number;
    readability: number;
    balance: number;
    evidenceStrength: number;
  };
};

function toStatementRecord(statement: Record<string, any>): StatementRecord {
  return {
    core: {
      text: statement?.title || statement?.shortText || "Statement",
      responsibility: statement?.category ?? null,
      topicKanonId: statement?.tags?.[0] ?? null,
      reviewStatus: statement?.reviewStatus ?? "pending",
    },
    evidence: [],
    perspectives: { items: [] },
    quality: {
      precision: 0.7,
      checkability: 0.7,
      readability: 0.7,
      balance: 0.7,
      evidenceStrength: 0.7,
    },
  };
}

export default function ReportPageClient({ initial }: { initial: ReportE150[] }) {
  const [language, setLanguage] = useState("de");
  const [search, setSearch] = useState("");
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportE150 | null>(initial[0] ?? null);

  const themes = useMemo(() => {
    const s = new Set<string>();
    for (const r of initial) (r.tags ?? []).forEach((t) => s.add(t));
    return Array.from(s).sort((a, b) => a.localeCompare(b)).map((t) => ({ id: t, label: t }));
  }, [initial]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initial.filter((r) => {
      const matchesTag = !activeTheme || (r.tags ?? []).includes(activeTheme);
      if (!q) return matchesTag;
      const hay = [r.title ?? "", r.subtitle ?? "", r.summary ?? "", (r.tags ?? []).join(" ")].join(" ").toLowerCase();
      return matchesTag && hay.includes(q);
    });
  }, [initial, search, activeTheme]);

  const relatedStatements = useMemo(() => {
    if (!selectedReport) return [];
    const ids = Array.isArray(selectedReport.statements) ? selectedReport.statements : [];
    return ids.length
      ? (demoStatements as any[])
          .filter((s) => ids.includes((s as any).id))
          .map((s) => toStatementRecord(s as any))
      : [];
  }, [selectedReport]);

  const allNews = useMemo(() => selectedReport?.news || [], [selectedReport]);

  return (
    <div className="min-h-screen py-16 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-2 lg:px-6 flex flex-col lg:flex-row gap-6">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <LeftSidebar />
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
            <h1 className="font-bold text-3xl text-slate-900 dark:text-slate-100 flex-shrink-0">Reports & Analysen</h1>

            <div className="relative flex-1 max-w-md w-full">
              <FiSearch className="absolute left-3 top-3 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT} pl-10 pr-4`}
                placeholder="Suche Reports..."
                aria-label="Reports durchsuchen"
              />
            </div>
          </div>

          {themes.length > 0 && (
            <div className="flex overflow-x-auto gap-2 scrollbar-hide mb-6 pb-2">
              <button
                onClick={() => setActiveTheme(null)}
                className={`text-sm px-4 py-1 rounded-full transition ${
                  !activeTheme
                    ? "bg-sky-600 text-white"
                    : "bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
                }`}
                aria-pressed={!activeTheme}
              >
                Alle Themen
              </button>
              {themes.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTheme((prev) => (prev === label ? null : label))}
                  className={`text-sm px-4 py-1 rounded-full transition ${
                    activeTheme === label
                      ? "bg-sky-600 text-white"
                      : "bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
                  }`}
                  aria-pressed={activeTheme === label}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`cursor-pointer ${selectedReport?.id === report.id ? "ring-2 ring-sky-400" : ""}`}
                tabIndex={0}
                aria-label={`Report: ${report.title}`}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedReport(report)}
              >
                {/* ReportCard exakt passende Props nicht bekannt → compat cast */}
                <ReportCard {...({ report, language } as any)} />
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-300">
                Keine Treffer{search ? ` für „${search}“` : ""}{activeTheme ? ` (Thema: ${activeTheme})` : ""}.
              </div>
            )}
          </div>

          <section className="mt-8 max-w-4xl mx-auto space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {selectedReport ? `Statements zu „${selectedReport.title}“` : "Statements"}
            </h2>
            {selectedReport && relatedStatements.length > 0 ? (
              relatedStatements.map((statement: any, idx: number) => (
                <StatementCard key={`${selectedReport?.id ?? "report"}-${idx}`} statement={statement} language={language} />
              ))
            ) : (
              <div className="italic text-slate-500 dark:text-slate-300">Keine passenden Statements verfügbar.</div>
            )}
          </section>
        </main>

        <aside className="hidden xl:block w-80 flex-shrink-0">
          <RightSidebar news={allNews} />
        </aside>
      </div>
    </div>
  );
}
