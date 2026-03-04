"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

type ProviderSmokeResult = {
  providerId: string;
  state: "success" | "failed" | "skipped" | "disabled" | "unconfigured";
  ok: boolean;
  configured: boolean;
  durationMs: number | null;
  errorMessage?: string | null;
  errorKind?: string | null;
  status?: number | null;
  checkedAt?: string;
  requestMode?: "quick" | "full";
};

type SmokeResponse = {
  ok: boolean;
  bestProviderId?: string | null;
  bestRawText?: string | null;
  results: ProviderSmokeResult[];
  error?: string;
  checkedAt?: string;
  mode?: "quick" | "full";
};

export default function OrchestratorTelemetryPage() {
  const [data, setData] = useState<SmokeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSmoke(mode?: "full") {
    setLoading(true);
    setError(null);
    try {
      const suffix = mode === "full" ? "?mode=full" : "";
      const res = await fetch(`/api/admin/ai/orchestrator-smoke${suffix}`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as SmokeResponse | null;
      if (!res.ok || !body) throw new Error(body?.error || res.statusText);
      setData(body);
      if (body.ok === false) {
        setError(body.error ?? "Smoke-Test fehlgeschlagen");
      }
    } catch (err: any) {
      setError(err?.message ?? "Smoke-Test fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Telemetry · AI
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Orchestrator-Status</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Teste, welche Provider aktuell erreichbar sind und wie lange sie brauchen.
          Ergebnisse werden nicht gespeichert – für langfristige Zahlen siehe{" "}
          <Link href="/dashboard/usage" className="text-sky-600 underline">
            /dashboard/usage
          </Link>
          .
        </p>
      </header>

      <div className="flex items-center gap-3">
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => runSmoke()}
          disabled={loading}
        >
          {loading ? "Test läuft …" : "Smoke-Test ausführen"}
        </button>
        <button
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))]"
          onClick={() => runSmoke("full")}
          disabled={loading}
        >
          {loading ? "…" : "Volltest"}
        </button>
        {error && <AdminErrorPanel error={error} />}
      </div>

      {data && (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
          <div className="text-sm text-[rgb(var(--muted))]">
            <p>
              Best Provider:{" "}
              <span className="font-semibold text-[rgb(var(--fg))]">
                {data.bestProviderId ?? "—"}
              </span>
            </p>
            <p>
              Erfolgreich:{" "}
              <span className={data.ok ? "text-emerald-600" : "text-rose-600"}>
                {data.ok ? "Ja" : "Nein"}
              </span>
            </p>
            {data.mode && (
              <p>
                Modus: <span className="font-semibold text-[rgb(var(--fg))]">{data.mode}</span>
              </p>
            )}
            {data.checkedAt && (
              <p>
                Letzter Check:{" "}
                <span className="font-semibold text-[rgb(var(--fg))]">{data.checkedAt}</span>
              </p>
            )}
          </div>

          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              <tr>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Config</th>
                <th className="px-3 py-2">Smoke</th>
                <th className="px-3 py-2">Dauer</th>
                <th className="px-3 py-2">Fehlermeldung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {data.results.map((result) => (
                <tr key={result.providerId}>
                  <td className="px-3 py-2 font-semibold text-[rgb(var(--fg))]">{result.providerId}</td>
                  <td className="px-3 py-2">
                    {result.configured ? (
                      <span className="text-emerald-600">konfiguriert</span>
                    ) : (
                      <span className="text-[rgb(var(--muted))]">unconfigured</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {result.state === "success" ? (
                      <span className="text-emerald-600">✅ OK</span>
                    ) : result.state === "failed" ? (
                      <span className="text-rose-600">❌ Fehler</span>
                    ) : result.state === "skipped" ? (
                      <span className="text-amber-600">⤼ übersprungen</span>
                    ) : result.state === "unconfigured" ? (
                      <span className="text-[rgb(var(--muted))]">⚪ unconfigured</span>
                    ) : (
                      <span className="text-[rgb(var(--muted))]">⏸ deaktiviert</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{result.durationMs ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-[rgb(var(--muted))]">
                    {result.errorMessage ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}