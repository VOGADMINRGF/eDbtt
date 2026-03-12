"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { demoVotes, type DemoVote, type DemoVoteStatus } from "@features/votes/demoVotes";

type SortMode = "new" | "updated" | "controversial" | "reactions";

const STATUS_LABELS: Record<DemoVoteStatus, string> = {
  draft: "draft",
  review: "in Prüfung",
  published: "published",
};

const SIGNAL_LABELS = {
  fresh: "neu",
  controversial: "strittig",
  review: "in Prüfung",
  relevant: "relevant",
};

function deriveTheme(vote: DemoVote) {
  const text = `${vote.title} ${vote.summary}`.toLowerCase();
  if (text.includes("rad") || text.includes("tempo") || text.includes("verkehr")) return "Mobilität";
  if (text.includes("schule") || text.includes("schul")) return "Bildung";
  if (text.includes("klima") || text.includes("co2") || text.includes("energie")) return "Klima";
  return "Kommunalpolitik";
}

function reactionScore(vote: DemoVote) {
  return vote.claims.length * 8 + vote.evidence.length * 6 + vote.options.length * 5;
}

function controversialScore(vote: DemoVote) {
  return vote.options.length * 4 + vote.claims.length * 2;
}

export default function DemoVotesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DemoVoteStatus | "all">("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("new");

  const regions = useMemo(() => Array.from(new Set(demoVotes.map((vote) => vote.regionLabel))), []);
  const themes = useMemo(() => Array.from(new Set(demoVotes.map((vote) => deriveTheme(vote)))), []);
  const newestTimestamp = useMemo(
    () => Math.max(...demoVotes.map((vote) => new Date(vote.updatedAt).getTime())),
    [],
  );

  const visibleVotes = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = demoVotes.filter((vote) => {
      if (statusFilter !== "all" && vote.status !== statusFilter) return false;
      if (regionFilter !== "all" && vote.regionLabel !== regionFilter) return false;
      if (themeFilter !== "all" && deriveTheme(vote) !== themeFilter) return false;
      if (!search) return true;
      const haystack = `${vote.title} ${vote.summary} ${deriveTheme(vote)} ${vote.regionLabel}`.toLowerCase();
      return haystack.includes(search);
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "updated") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortMode === "controversial") {
        return controversialScore(b) - controversialScore(a);
      }
      if (sortMode === "reactions") {
        return reactionScore(b) - reactionScore(a);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [query, regionFilter, sortMode, statusFilter, themeFilter]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Demo - Abstimmungen</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Votes Preview</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Journalistische Schnellansicht mit Status, Evidenzlage, offenen Fragen und Signals.
        </p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <div className="grid gap-3 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Suche nach Titel, Region oder Thema"
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as DemoVoteStatus | "all")}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Status: alle</option>
            <option value="draft">draft</option>
            <option value="review">review</option>
            <option value="published">published</option>
          </select>
          <select
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Region: alle</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <select
            value={themeFilter}
            onChange={(event) => setThemeFilter(event.target.value)}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Thema: alle</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" className={`vog-chip ${sortMode === "new" ? "border-[rgb(var(--grad-from))]" : ""}`} onClick={() => setSortMode("new")}>neu</button>
          <button type="button" className={`vog-chip ${sortMode === "updated" ? "border-[rgb(var(--grad-from))]" : ""}`} onClick={() => setSortMode("updated")}>zuletzt geändert</button>
          <button type="button" className={`vog-chip ${sortMode === "controversial" ? "border-[rgb(var(--grad-from))]" : ""}`} onClick={() => setSortMode("controversial")}>kontrovers</button>
          <button type="button" className={`vog-chip ${sortMode === "reactions" ? "border-[rgb(var(--grad-from))]" : ""}`} onClick={() => setSortMode("reactions")}>viele Reaktionen</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {visibleVotes.map((vote) => {
          const theme = deriveTheme(vote);
          const updatedMs = new Date(vote.updatedAt).getTime();
          const isFresh = newestTimestamp - updatedMs <= 21 * 24 * 60 * 60 * 1000;
          const isControversial = controversialScore(vote) >= 12;
          const reaction = reactionScore(vote);

          return (
            <article
              key={vote.id}
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[rgb(var(--muted))]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
                    {vote.regionLabel}
                  </span>
                  <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
                    {theme}
                  </span>
                </div>
                <span>Status: {STATUS_LABELS[vote.status]}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {isFresh ? <span className="vog-chip">{SIGNAL_LABELS.fresh}</span> : null}
                {vote.status === "review" ? <span className="vog-chip">{SIGNAL_LABELS.review}</span> : null}
                {isControversial ? <span className="vog-chip">{SIGNAL_LABELS.controversial}</span> : null}
                {reaction >= 40 ? <span className="vog-chip">{SIGNAL_LABELS.relevant}</span> : null}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{vote.title}</h2>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{vote.summary}</p>
              </div>
              <div className="grid gap-2 text-xs text-[rgb(var(--muted))] sm:grid-cols-2">
                <p>Optionen: {vote.options.length}</p>
                <p>Evidenz: {vote.evidence.length}</p>
                <p>Offene Fragen (Demo): {Math.max(1, vote.claims.length - 1)}</p>
                <p>Letzter Stand: {new Date(vote.updatedAt).toLocaleDateString("de-DE")}</p>
              </div>
              <div className="text-xs text-[rgb(var(--muted))]">{vote.participationTarget}</div>
              <Link
                href={`/demo/votes/${vote.id}`}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Details ansehen
              </Link>
            </article>
          );
        })}
      </section>
      {!visibleVotes.length ? (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Keine Treffer fuer die aktuelle Filterkombination.
        </div>
      ) : null}
    </main>
  );
}
