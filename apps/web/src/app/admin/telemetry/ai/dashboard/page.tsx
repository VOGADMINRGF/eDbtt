"use client";

import { useEffect, useState } from "react";

type ProviderDiagnostic = {
  provider: string;
  displayName: string;
  model: string | null;
  mode: "provider_probe" | "runtime_smoke" | "full_contract";
  stage: string;
  status: "ok" | "skipped" | "failed" | "degraded" | "config_missing";
  errorKind: string | null;
  providerErrorCode: string | null;
  httpStatus: number | null;
  reason: string | null;
  errorMessage: string | null;
  rootCause: string;
  nextAction: string;
  durationMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  parseStatus: "ok" | "failed" | "not_started";
  schemaStatus: "ok" | "failed" | "not_started";
  providerStatus: "reachable" | "down" | "unknown";
  adapterStatus: "ok" | "failed" | "not_started";
  journeyDecision: string;
  validationMode: string;
  parseError: string | null;
  schemaError: string | null;
  schemaPath: string | null;
  rawExcerpt: string | null;
  fallbackUsed: boolean | null;
  fallbackReason: string | null;
};

type ApiResponse = {
  ok: boolean;
  runs: Array<{
    runId: string;
    correlationId: string;
    mode: "provider_probe" | "runtime_smoke" | "full_contract";
    startedAt: number;
    finishedAt: number;
    ok: boolean;
    bestProviderId: string | null;
    rootCause: string;
    nextAction: string;
    durationMs: number;
    tokensIn: number;
    tokensOut: number;
    costEur: number;
    providers: ProviderDiagnostic[];
  }>;
  error?: string;
};

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export default function AiTelemetryDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/telemetry/ai/events", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!res.ok || !body?.ok) throw new Error(body?.error ?? res.statusText);
      setData(body);
    } catch (err: any) {
      setError(err?.message ?? "Telemetry nicht erreichbar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const runs = data?.runs ?? [];

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Telemetry · AI
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Recent Runs (Grouped by runId)</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Jeder Testlauf wird als zusammengehöriger Run dargestellt. Details pro Provider sind aufklappbar.
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Aktualisiere …" : "Aktualisieren"}
        </button>
        {error && <div className="text-sm text-rose-700">{error}</div>}
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Runs</h2>
        {runs.length === 0 && <p className="mt-3 text-sm text-[rgb(var(--muted))]">Keine Runs verfügbar.</p>}

        <div className="mt-3 space-y-3">
          {runs.map((run) => {
            const isOpen = expanded[run.runId] ?? false;
            return (
              <article key={run.runId} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                <div className="grid gap-2 md:grid-cols-[1.2fr_0.9fr_0.8fr_1fr_1fr_0.8fr] md:items-center">
                  <div>
                    <div className="text-xs text-[rgb(var(--muted))]">Time</div>
                    <div className="text-sm">{dateFormatter.format(new Date(run.startedAt))}</div>
                    <div className="font-mono text-xs text-[rgb(var(--muted))]">runId={run.runId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--muted))]">Mode</div>
                    <div className="text-sm">{run.mode}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--muted))]">Result</div>
                    <div className={`text-sm font-semibold ${run.ok ? "text-emerald-700" : "text-rose-700"}`}>
                      {run.ok ? "ok" : "failed"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--muted))]">Root Cause</div>
                    <div className="text-sm">{run.rootCause}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--muted))]">Next Action</div>
                    <div className="text-sm text-[rgb(var(--muted))]">{run.nextAction}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[rgb(var(--muted))]">Duration</div>
                    <div className="text-sm">{run.durationMs} ms</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-sky-700 underline"
                  onClick={() => setExpanded((prev) => ({ ...prev, [run.runId]: !isOpen }))}
                >
                  {isOpen ? "Provider-Details ausblenden" : "Provider-Details anzeigen"}
                </button>

                {isOpen && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-[rgb(var(--border))] text-xs">
                      <thead className="text-left uppercase tracking-wide text-[rgb(var(--muted))]">
                        <tr>
                          <th className="px-2 py-1">Provider</th>
                          <th className="px-2 py-1">Model</th>
                          <th className="px-2 py-1">Stage</th>
                          <th className="px-2 py-1">Result</th>
                          <th className="px-2 py-1">Root Cause</th>
                          <th className="px-2 py-1">Next Action</th>
                          <th className="px-2 py-1">Duration</th>
                          <th className="px-2 py-1">Tokens</th>
                          <th className="px-2 py-1">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgb(var(--border))]">
                        {run.providers.map((row) => (
                          <tr key={`${run.runId}-${row.provider}`}>
                            <td className="px-2 py-1">
                              <div className="font-semibold">{row.provider}</div>
                              <div className="text-[11px] text-[rgb(var(--muted))]">{row.displayName}</div>
                            </td>
                            <td className="px-2 py-1">{row.model ?? "unknown"}</td>
                            <td className="px-2 py-1">{row.stage}</td>
                            <td className="px-2 py-1">{row.status}</td>
                            <td className="px-2 py-1">{row.rootCause}</td>
                            <td className="px-2 py-1">{row.nextAction}</td>
                            <td className="px-2 py-1">{typeof row.durationMs === "number" ? `${row.durationMs} ms` : "n/a"}</td>
                            <td className="px-2 py-1">{`${row.tokensIn ?? 0}/${row.tokensOut ?? 0}`}</td>
                            <td className="px-2 py-1">n/a</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-2 rounded-xl border border-[rgb(var(--border))] bg-white/40 p-2 text-xs text-[rgb(var(--muted))]">
                      correlationId={run.correlationId}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
