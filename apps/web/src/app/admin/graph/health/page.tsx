"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";
import { GraphAdminNav } from "@/components/admin/GraphAdminNav";

type GraphHealth = {
  nodes: number;
  edges: number;
  orphans: number;
  duplicatesSuggested: number;
  brokenPaths: number;
  unlinkedEvidence: number;
  lastSyncAt?: string | null;
};

type Meta = {
  generatedAt: string;
  windowDays: number;
  source: string;
};

type GraphHealthResponse =
  | {
      ok: true;
      summary: GraphHealth;
      _meta: Meta;
    }
  | { ok: false; error: string; missingEnv?: string[]; hint?: string };

export default function AdminGraphHealthPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<GraphHealth | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[] | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const nf = new Intl.NumberFormat("de-DE");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setMissingEnv(null);
      setErrorHint(null);
      try {
        const res = await fetch("/api/admin/graph/health", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?next=/admin/graph/health");
          return;
        }
        const body = (await res.json().catch(() => ({}))) as GraphHealthResponse;
        if (!res.ok || !body?.ok) {
          const payload = body as { error?: string; missingEnv?: string[]; hint?: string };
          setMissingEnv(payload?.missingEnv ?? null);
          setErrorHint(payload?.hint ?? null);
          throw new Error(payload?.error || res.statusText);
        }
        if (active) {
          setSummary(body.summary ?? null);
          setMeta(body._meta ?? null);
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
        <p className="text-sm text-[rgb(var(--muted))]">Uebersicht ueber Knoten, Pfade und Reparatur-Backlog.</p>
        <GraphAdminNav current="/admin/graph/health" />
      </header>

      {error && (<AdminErrorPanel error={error} missingEnv={missingEnv} hint={errorHint} />)}

      <section className="grid gap-3 md:grid-cols-2">
        {renderCard("Nodes", summary?.nodes, loading, nf)}
        {renderCard("Edges", summary?.edges, loading, nf)}
        {renderCard("Orphans", summary?.orphans, loading, nf)}
        {renderCard("Duplicates", summary?.duplicatesSuggested, loading, nf)}
        {renderCard("Broken Paths", summary?.brokenPaths, loading, nf)}
        {renderCard("Unlinked Evidence", summary?.unlinkedEvidence, loading, nf)}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Meta</h2>
        <div className="mt-2 text-sm text-[rgb(var(--muted))]">
          <p>Generated: {meta?.generatedAt ?? "—"}</p>
          <p>Window: {meta?.windowDays ?? "—"} Tage</p>
          <p>Source: {meta?.source ?? "—"}</p>
          <p>Last sync: {summary?.lastSyncAt ?? "—"}</p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/graph/repairs"
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
        >
          Repairs oeffnen
        </Link>
      </div>
    </div>
  );
}

function renderCard(label: string, value: number | undefined, loading: boolean, nf: Intl.NumberFormat) {
  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      {loading ? (
        <div className="mt-2 h-6 w-16 animate-pulse rounded bg-[rgb(var(--bg))]" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">{nf.format(value ?? 0)}</p>
      )}
    </div>
  );
}
