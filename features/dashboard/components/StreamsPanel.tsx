// features/dashboard/components/StreamsPanel.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Interval = "minute" | "hour" | "day";
type Metrics = {
  from: string; to: string; interval: Interval;
  totals?: { events?: number; errors?: number };
  topProviders?: { provider: string; n: number }[];
  timeseries?: { t: string; n: number }[];
};

export default function StreamsPanel() {
  const [from, setFrom] = useState<string>(isoNowMinus(24 * 3600_000)); // -24h
  const [to, setTo] = useState<string>(new Date().toISOString());
  const [interval, setInterval] = useState<Interval>("hour");
  const [provider, setProvider] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // QS bauen (nur gültige Datumswerte nutzen)
  const qs = useMemo(() => {
    const sp = new URLSearchParams({
      from: isValidIso(from) ? from : isoNowMinus(24 * 3600_000),
      to: isValidIso(to) ? to : new Date().toISOString(),
      interval,
    });
    if (provider.trim()) sp.set("provider", provider.trim());
    return sp.toString();
  }, [from, to, interval, provider]);

  // Debounce + AbortController
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const load = useCallback((immediate = false) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const doFetch = async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/dev/streams/metrics?${qs}`, {
          cache: "no-store",
          signal: ac.signal,
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const m = (await res.json()) as Metrics;
        setMetrics(m);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    if (immediate) doFetch();
    else debounceRef.current = window.setTimeout(doFetch, 250);
  }, [qs]);

  // Initial & on filter change
  useEffect(() => { load(false); }, [qs, load]);

  // Auto-Refresh alle 15s (abschaltbar)
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => load(true), 15_000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  const totals = metrics?.totals ?? { events: 0, errors: 0 };
  const topProviders = metrics?.topProviders ?? [];

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm font-medium">Streams Monitor</div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="datetime-local"
            value={toLocalDT(from)}
            onChange={e => setFrom(fromLocalDT(e.target.value))}
            className="px-2 py-1 rounded border"
            aria-label="Von"
          />
          <span>–</span>
          <input
            type="datetime-local"
            value={toLocalDT(to)}
            onChange={e => setTo(fromLocalDT(e.target.value))}
            className="px-2 py-1 rounded border"
            aria-label="Bis"
          />
          <select
            value={interval}
            onChange={e => setInterval(e.target.value as Interval)}
            className="px-2 py-1 rounded border"
            aria-label="Intervall"
          >
            <option value="minute">Minute</option>
            <option value="hour">Stunde</option>
            <option value="day">Tag</option>
          </select>
          <input
            placeholder="provider (optional)"
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="px-2 py-1 rounded border"
            aria-label="Provider"
          />
          <label className="inline-flex items-center gap-1 ml-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto
          </label>
          <button
            onClick={() => load(true)}
            className="px-3 py-1.5 rounded border"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Lädt…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Fehler-/Hinweisleiste */}
      {err && (
        <div className="mt-3 text-sm text-red-600">
          Fehler beim Laden: {err}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi title="Events" value={safeNum(totals.events)} loading={loading}/>
        <Kpi title="Errors" value={safeNum(totals.errors)} loading={loading}/>
        <Kpi title="Providers" value={topProviders.length} loading={loading}/>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Provider</th>
              <th className="py-2 pr-4">Events</th>
            </tr>
          </thead>
          <tbody>
            {topProviders.length > 0 ? (
              topProviders.map(p => (
                <tr key={p.provider} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">{p.provider}</td>
                  <td className="py-2 pr-4">{safeNum(p.n)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 text-neutral-500" colSpan={2}>–</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------- Helpers ----------------- */

function Kpi({ title, value, loading }: { title: string; value: number; loading?: boolean }) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="text-2xl font-bold tabular-nums">
        {loading ? "…" : value}
      </div>
    </div>
  );
}

function safeNum(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

// Für <input type="datetime-local">: lokale Eingabe ⇄ ISO (UTC)
function toLocalDT(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
function fromLocalDT(local: string) {
  // local ist ohne TZ; interpretiere als lokale Zeit und konvertiere zu ISO UTC
  const d = new Date(local);
  if (isNaN(d.getTime())) return new Date().toISOString();
  const utc = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return utc.toISOString();
}
function isoNowMinus(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}
function isValidIso(s: string) {
  const t = Date.parse(s);
  return Number.isFinite(t);
}
