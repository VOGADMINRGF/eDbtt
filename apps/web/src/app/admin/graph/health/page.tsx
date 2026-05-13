"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type GraphHealth = {
  ok: boolean;
  status: "ok" | "degraded" | "unavailable";
  reason:
    | "missing_env"
    | "db_unreachable"
    | "adapter_not_configured"
    | "graph_service_disabled"
    | "auth_failed"
    | "schema_missing"
    | "read_failed"
    | "unknown"
    | null;
  source: "real_graph" | "mock" | "seed" | "disabled";
  isMock: boolean;
  read: { ok: boolean; error: string | null };
  write: { ok: boolean; mode: "enabled" | "disabled" | "readonly"; error: string | null };
  metrics: {
    nodes: number | null;
    edges: number | null;
    orphans: number | null;
    duplicates: number | null;
    brokenPaths: number | null;
    unlinkedEvidence: number | null;
  };
  meta: {
    generatedAt: string | null;
    windowDays: number | null;
    lastSync: string | null;
    adapter: string | null;
  };
  nextActions: string[];
  dependentFlows: string[];
};

export default function AdminGraphHealthPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<GraphHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nf = new Intl.NumberFormat("de-DE");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/graph/health", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?next=/admin/graph/health");
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (!body?.ok) throw new Error(body?.error || res.statusText);
        if (active) {
          setSummary(body ?? null);
        }
      } catch (err: any) {
        if (active) setError(err?.message ?? "graph_health_failed");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Graph</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Graph Health</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Übersicht über Knoten, Pfade und Reparatur-Backlog.</p>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {summary ? (
        <section
          className={`rounded-3xl border px-4 py-4 shadow-sm ${
            summary.status === "ok"
              ? "border-emerald-300 bg-emerald-50/80 text-emerald-950"
              : summary.status === "degraded"
                ? "border-amber-300 bg-amber-50/80 text-amber-950"
                : "border-rose-300 bg-rose-50/80 text-rose-950"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            {summary.status === "ok" ? "Graph OK" : summary.status === "degraded" ? "Graph eingeschränkt" : "Graph nicht verfügbar"}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {summary.status === "ok"
              ? "Graph ist verbunden und lesbar."
              : "Graph ist aktuell nicht belastbar verfügbar."}
          </h2>
          <p className="mt-2 text-sm">
            Ursache: <span className="font-semibold">{summary.reason ?? "keine"}</span>
          </p>
          {summary.dependentFlows.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.dependentFlows.map((item) => (
                <span key={item} className="rounded-full border border-current/20 px-3 py-1 text-xs">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        {renderCard("Nodes", summary?.metrics.nodes, loading, nf, summary?.status)}
        {renderCard("Edges", summary?.metrics.edges, loading, nf, summary?.status)}
        {renderCard("Orphans", summary?.metrics.orphans, loading, nf, summary?.status)}
        {renderCard("Duplicates", summary?.metrics.duplicates, loading, nf, summary?.status)}
        {renderCard("Broken Paths", summary?.metrics.brokenPaths, loading, nf, summary?.status)}
        {renderCard("Unlinked Evidence", summary?.metrics.unlinkedEvidence, loading, nf, summary?.status)}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Meta</h2>
          <div className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
            <p>Generated: {summary?.meta.generatedAt ?? "—"}</p>
            <p>Window: {summary?.meta.windowDays ?? "—"} Tage</p>
            <p>Source: {summary?.source ?? "—"}</p>
            <p>Adapter: {summary?.meta.adapter ?? "—"}</p>
            <p>Last sync: {summary?.meta.lastSync ?? "—"}</p>
            <p>Read: {summary?.read.ok ? "OK" : "fehlgeschlagen"}</p>
            <p>Write: {summary?.write.mode ?? "—"}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Nächste Aktionen</h2>
          {summary?.nextActions.length ? (
            <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
              {summary.nextActions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine unmittelbaren Maßnahmen offen.</p>
          )}
          {summary?.read.error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              Read error: {summary.read.error}
            </p>
          ) : null}
        </section>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/graph/repairs"
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
        >
          Repairs öffnen
        </Link>
      </div>
    </div>
  );
}

function renderCard(
  label: string,
  value: number | null | undefined,
  loading: boolean,
  nf: Intl.NumberFormat,
  status?: GraphHealth["status"],
) {
  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      {loading ? (
        <div className="mt-2 h-6 w-16 animate-pulse rounded bg-[rgb(var(--bg))]" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
          {status === "unavailable" || value === null ? "N/A" : nf.format(value ?? 0)}
        </p>
      )}
    </div>
  );
}
