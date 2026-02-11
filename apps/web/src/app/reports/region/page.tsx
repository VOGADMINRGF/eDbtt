"use client";

import { useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

type ReportSummary = {
  statements: number;
  eventualities: number;
  consequences: number;
  responsibilities: number;
  byLevel: Array<{ level: string; responsibilityCount: number }>;
};

export default function RegionReportPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "reports-region" });

  const [region, setRegion] = useState("");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReport() {
    const regionId = region.trim();
    if (!regionId) {
      setError(t("Bitte eine Region angeben.", "error.missing"));
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ region: regionId });
      const res = await fetch(`/api/reports/region?${params.toString()}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || !body?.ok) throw new Error(body?.error ?? res.statusText);
      setSummary(body.summary ?? null);
    } catch (err: any) {
      setError(err?.message ?? t("Report konnte nicht geladen werden.", "error.load"));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("Reports · Region", "header.kicker")}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          {t("Region Report", "header.title")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("Aggregierte Graph-Daten nach Region.", "header.subtitle")}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            loadReport();
          }}
        >
          <label className="text-sm text-slate-600 md:col-span-2">
            {t("Region-ID oder Code", "form.region.label")}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="z.B. DE-BE"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? t("Lade …", "form.loading") : t("Report laden", "form.submit")}
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-2 text-sm text-rose-600" aria-live="polite">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {t("Zusammenfassung", "summary.title")}
        </h2>
        {!summary ? (
          <p className="mt-2 text-sm text-slate-500">
            {t("Noch keine Daten geladen.", "summary.empty")}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <div className="text-xs text-slate-500">{t("Statements", "summary.statements")}</div>
              <div className="text-lg font-semibold text-slate-900">{summary.statements}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <div className="text-xs text-slate-500">{t("Eventualities", "summary.eventualities")}</div>
              <div className="text-lg font-semibold text-slate-900">{summary.eventualities}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <div className="text-xs text-slate-500">{t("Consequences", "summary.consequences")}</div>
              <div className="text-lg font-semibold text-slate-900">{summary.consequences}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <div className="text-xs text-slate-500">{t("Responsibilities", "summary.responsibilities")}</div>
              <div className="text-lg font-semibold text-slate-900">{summary.responsibilities}</div>
            </div>
          </div>
        )}

        {summary?.byLevel?.length ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700">
              {t("Verantwortung nach Level", "summary.byLevel")}
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t("Level", "table.level")}</th>
                    <th className="px-3 py-2">{t("Anzahl", "table.count")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.byLevel
                    .slice()
                    .sort((a, b) => b.responsibilityCount - a.responsibilityCount)
                    .map((row) => (
                      <tr key={row.level}>
                        <td className="px-3 py-2">{row.level}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{row.responsibilityCount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
