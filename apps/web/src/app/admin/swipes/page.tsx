"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SwipeSummary = {
  totals: {
    swipeVotes: number;
    swipeVotes30d: number;
    statementSwipes: number;
  };
  timeseries?: Array<{ date: string; count: number }>;
  topStatements: Array<{ id: string; title: string; count: number }>;
};

export default function AdminSwipesPage() {
  const [data, setData] = useState<SwipeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nf = new Intl.NumberFormat("de-DE");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/swipes/summary", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) throw new Error(body?.error ?? res.statusText);
        if (active) setData(body as SwipeSummary);
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err, "Swipe-Analytics konnten nicht geladen werden."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin · Swipes</p>
        <h1 className="text-2xl font-bold text-slate-900">Swipe Analytics</h1>
        <p className="text-sm text-slate-600">
          Überblick über Swipe-Votes und die aktivsten Statements.
        </p>
      </header>

      <section className="rounded-3xl bg-white/90 p-4 shadow ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Kernzahlen</h2>
        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Swipe Votes gesamt" value={data?.totals.swipeVotes} loading={loading} />
          <Metric label="Swipe Votes (30d)" value={data?.totals.swipeVotes30d} loading={loading} />
          <Metric label="Statement Swipes" value={data?.totals.statementSwipes} loading={loading} />
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-4 shadow ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Swipe Votes (30 Tage)</h2>
        {loading && <SkeletonLines lines={2} />}
        {!loading && data?.timeseries?.length ? (
          <div className="mt-3 flex items-end gap-1 min-h-[80px]">
            {data.timeseries.map((entry) => (
              <div key={entry.date} className="flex flex-col items-center gap-1">
                <div
                  className="w-3 rounded-full bg-gradient-to-t from-sky-500 via-cyan-500 to-emerald-500"
                  style={{ height: `${Math.max(6, entry.count * 4)}px` }}
                  title={`${entry.date}: ${entry.count}`}
                />
                <span className="text-[10px] text-slate-400">{entry.date.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <p className="mt-2 text-sm text-slate-500">Keine Swipe-Aktivitaet im Zeitraum.</p>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white/90 p-4 shadow ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Top Statements</h2>
          <span className="text-xs text-slate-500">letzte Auswertung</span>
        </div>
        {loading && <SkeletonLines lines={4} />}
        {!loading && data?.topStatements?.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">Noch keine Swipe-Daten vorhanden.</p>
        )}
        {!loading && data?.topStatements?.length ? (
          <div className="mt-3 space-y-2 text-sm">
            {data.topStatements.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div className="max-w-[65%]">
                  <p className="font-semibold text-slate-900 line-clamp-1">{row.title}</p>
                  <Link href={`/statements/${encodeURIComponent(row.id)}`} className="text-xs text-sky-700 underline">
                    Statement öffnen
                  </Link>
                </div>
                <span className="font-semibold text-slate-700">{nf.format(row.count)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value, loading }: { label: string; value?: number; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{loading ? "…" : new Intl.NumberFormat("de-DE").format(value ?? 0)}</p>
    </div>
  );
}

function SkeletonLines({ lines }: { lines: number }) {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} className="h-5 w-full rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
