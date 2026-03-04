"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

type RegionReportResponse =
  | { ok: true; summary: ReportSummary; meta: { regionId: string } }
  | { ok: false; error: string };

type ReportSummary = {
  statements: number;
  eventualities: number;
  consequences: number;
  responsibilities: number;
  byLevel: Array<{ level: string; responsibilityCount: number }>;
};

export default function RegionReportPage() {
  const params = useParams<{ id: string }>();
  const regionId = params?.id ?? "";
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/reports/region/${encodeURIComponent(regionId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!isRegionReportResponse(json)) {
          throw new Error(res.statusText);
        }
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        if (json.ok === false) {
          throw new Error(json.error || res.statusText);
        }
        if (!ignore) setSummary(json.summary);
      } catch (err: unknown) {
        if (!ignore) {
          setSummary(null);
          setError(getErrorMessage(err, "Region-Report konnte nicht geladen werden."));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (regionId) {
      load();
    }
    return () => {
      ignore = true;
    };
  }, [regionId]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Region Report</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Region Impact · {regionId}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Kennzahlen für Statements in Region {regionId}. Zeigt Impact-Dichte und Zuständigkeits-Ebenen.
        </p>
      </header>

      {loading && (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-6 text-sm text-[rgb(var(--muted))] shadow-sm">
          Lädt Region-Report …
        </div>
      )}

      {error && !loading && <AdminErrorPanel error={error} />}

      {!loading && !error && summary && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Statements" value={summary.statements} />
            <KpiCard label="Eventualitäten" value={summary.eventualities} />
            <KpiCard label="Consequences" value={summary.consequences} />
            <KpiCard label="Responsibility Steps" value={summary.responsibilities} />
          </section>

          {summary.byLevel?.length > 0 && (
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Ebene / Verantwortungen</h2>
                <span className="text-xs text-[rgb(var(--muted))]">Graph-Aggregate</span>
              </div>
              <table className="mt-3 min-w-full divide-y divide-[rgb(var(--border))] text-sm">
                <thead className="bg-[rgb(var(--bg))]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-[rgb(var(--muted))]">Ebene</th>
                    <th className="px-4 py-2 text-left font-semibold text-[rgb(var(--muted))]">Responsibility Steps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))]">
                  {summary.byLevel.map((entry) => (
                    <tr key={entry.level}>
                      <td className="px-4 py-2 font-semibold text-[rgb(var(--fg))]">{entry.level}</td>
                      <td className="px-4 py-2 text-[rgb(var(--muted))]">{entry.responsibilityCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function isRegionReportResponse(value: unknown): value is RegionReportResponse {
  return Boolean(value) && typeof value === "object" && "ok" in value;
}
