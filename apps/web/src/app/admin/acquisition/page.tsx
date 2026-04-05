"use client";

import { useEffect, useMemo, useState } from "react";

type RegionSummary = {
  regionCode: string;
  feedCount: number;
  lastFetchedAt?: string | null;
  status: "ok" | "warning" | "error";
  topTopics?: string[];
};

type FetchRun = {
  startedAt: string;
  finishedAt?: string | null;
  totalFeeds: number;
  okFeeds: number;
  emptyFeeds: number;
  errorFeeds: number;
};

type ApiResponse = {
  ok: boolean;
  regions?: RegionSummary[];
  latestRun?: FetchRun | null;
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.valueOf())) return "—";
  return dt.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

function statusBadge(status: RegionSummary["status"]) {
  switch (status) {
    case "error":
      return "bg-rose-100 text-rose-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

export default function AcquisitionAdminPage() {
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [latestRun, setLatestRun] = useState<FetchRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/acquisition", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok || !body.ok) {
        throw new Error(body?.error || res.statusText);
      }
      setRegions(body.regions ?? []);
      setLatestRun(body.latestRun ?? null);
    } catch (err: any) {
      setError(err?.message ?? "Akquise-Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  const runFetch = async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/acquisition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok || !body.ok) {
        throw new Error(body?.error || res.statusText);
      }
      setRegions(body.regions ?? []);
      setLatestRun(body.latestRun ?? null);
    } catch (err: any) {
      setError(err?.message ?? "Test-Fetch fehlgeschlagen.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hasRegions = useMemo(() => regions.length > 0, [regions]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Akquise</p>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Akquise Dashboard</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            Feed-Status, Regionen und Top-Themen für Outreach & Pilot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            className="rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--border))] disabled:opacity-60"
            disabled={loading}
          >
            Aktualisieren
          </button>
          <button
            onClick={runFetch}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            disabled={fetching}
          >
            {fetching ? "Test Fetch…" : "Test Fetch"}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" aria-live="polite">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Letzter Fetch-Run</h2>
        {!latestRun ? (
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">Noch kein Fetch-Run gespeichert.</p>
        ) : (
          <div className="mt-3 grid gap-2 text-sm text-[rgb(var(--muted))] md:grid-cols-4">
            <div>
              <div className="text-xs text-[rgb(var(--muted))]">Gestartet</div>
              <div className="font-semibold text-[rgb(var(--fg))]">{formatDate(latestRun.startedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-[rgb(var(--muted))]">Beendet</div>
              <div className="font-semibold text-[rgb(var(--fg))]">{formatDate(latestRun.finishedAt ?? null)}</div>
            </div>
            <div>
              <div className="text-xs text-[rgb(var(--muted))]">Feeds</div>
              <div className="font-semibold text-[rgb(var(--fg))]">{latestRun.totalFeeds}</div>
            </div>
            <div>
              <div className="text-xs text-[rgb(var(--muted))]">OK / Empty / Error</div>
              <div className="font-semibold text-[rgb(var(--fg))]">
                {latestRun.okFeeds} / {latestRun.emptyFeeds} / {latestRun.errorFeeds}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Regionen & Feed-Status</h2>
          <span className="text-xs text-[rgb(var(--muted))]">{regions.length} Regionen</span>
        </div>

        {loading && <p className="mt-4 text-sm text-[rgb(var(--muted))]">Lädt …</p>}
        {!loading && !hasRegions && (
          <p className="mt-4 text-sm text-[rgb(var(--muted))]">Keine Feed-Regionen gefunden.</p>
        )}
        {!loading && hasRegions && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
              <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                <tr>
                  <th className="px-3 py-2">Region</th>
                  <th className="px-3 py-2">Feeds</th>
                  <th className="px-3 py-2">Letzter Fetch</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Top-Themen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {regions.map((region) => (
                  <tr key={region.regionCode}>
                    <td className="px-3 py-2 font-semibold text-[rgb(var(--fg))]">{region.regionCode}</td>
                    <td className="px-3 py-2">{region.feedCount}</td>
                    <td className="px-3 py-2 text-[rgb(var(--muted))]">{formatDate(region.lastFetchedAt ?? null)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(region.status)}`}>
                        {region.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[rgb(var(--muted))]">
                      {region.topTopics?.length ? region.topTopics.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
