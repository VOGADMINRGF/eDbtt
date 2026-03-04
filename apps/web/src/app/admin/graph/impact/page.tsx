"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";
import { GraphAdminNav } from "@/components/admin/GraphAdminNav";

type ImpactSummaryResponse =
  | {
      ok: true;
      summary: ImpactSummary;
    }
  | { ok: false; error: string; missingEnv?: string[]; hint?: string };

type ImpactSummary = {
  totalStatements: number;
  totalEventualities: number;
  totalConsequences: number;
  totalResponsibilities: number;
  totalResponsibilityPaths: number;
  byLevel?: Array<{
    level: string;
    responsibilityCount: number;
    pathCount: number;
  }>;
};

export default function GraphImpactPage() {
  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[] | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      setMissingEnv(null);
      setErrorHint(null);
      try {
        const res = await fetch("/api/admin/graph/impact/summary", { cache: "no-store" });
        const data = (await res.json()) as ImpactSummaryResponse;
        if (!res.ok || !data.ok) {
          const payload = data as { error?: string; missingEnv?: string[]; hint?: string };
          setMissingEnv(payload?.missingEnv ?? null);
          setErrorHint(payload?.hint ?? null);
          throw new Error(payload?.error || res.statusText);
        }
        if (!ignore) setSummary(data.summary);
      } catch (err: any) {
        if (!ignore) {
          setSummary(null);
          setError(err?.message ?? "Impact-Statistiken konnten nicht geladen werden.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Graph Impact</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Impact-Zusammenfassung</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Aggregierte Kennzahlen direkt aus dem Graph. Dient als früher Indikator, dass Eventualitäten,
          Konsequenzen und Zuständigkeiten korrekt synchronisiert werden.
        </p>
        <GraphAdminNav current="/admin/graph/impact" />
      </header>

      {loading && (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-6 text-sm text-[rgb(var(--muted))] shadow-sm">
          Lädt Graph-Daten …
        </div>
      )}

      {error && !loading && (
        <AdminErrorPanel error={error} missingEnv={missingEnv} hint={errorHint} />
      )}

      {!loading && !error && summary && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Statements" value={summary.totalStatements} />
            <KpiCard label="Eventualitäten" value={summary.totalEventualities} />
            <KpiCard label="Consequences" value={summary.totalConsequences} />
            <KpiCard label="Responsibilities" value={summary.totalResponsibilities} />
            <KpiCard label="Responsibility Paths" value={summary.totalResponsibilityPaths} />
          </section>
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Weiterführende Reports</h2>
              <p className="text-xs text-[rgb(var(--muted))]">Demo-Links – Picker folgt.</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/admin/reports/topic/demo-topic"
                className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-4 py-1.5 text-sm font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))]"
              >
                Topic-Impact-Report öffnen →
              </Link>
              <Link
                href="/admin/reports/region/demo-region"
                className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-4 py-1.5 text-sm font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))]"
              >
                Region-Impact-Report öffnen →
              </Link>
            </div>
          </section>

          {summary.byLevel && summary.byLevel.length > 0 && (
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Verteilung nach Ebene</h2>
                <span className="text-xs text-[rgb(var(--muted))]">Responsibility & Path Steps</span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
                  <thead className="bg-[rgb(var(--bg))]">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-[rgb(var(--muted))]">Ebene</th>
                      <th className="px-4 py-2 text-left font-semibold text-[rgb(var(--muted))]">Responsibilities</th>
                      <th className="px-4 py-2 text-left font-semibold text-[rgb(var(--muted))]">Path-Steps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {summary.byLevel.map((entry) => (
                      <tr key={entry.level}>
                        <td className="px-4 py-2 text-[rgb(var(--fg))] font-semibold">{entry.level}</td>
                        <td className="px-4 py-2 text-[rgb(var(--muted))]">{entry.responsibilityCount}</td>
                        <td className="px-4 py-2 text-[rgb(var(--muted))]">{entry.pathCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="text-2xl font-bold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}
