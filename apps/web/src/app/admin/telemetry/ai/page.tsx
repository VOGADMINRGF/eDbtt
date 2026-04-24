"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { AiUsageBreakdownSnapshot } from "@core/telemetry/aiUsageSnapshot";

type UsageResponse = { ok: boolean; snapshot?: AiUsageBreakdownSnapshot; error?: string };

type ProviderDiagnostic = {
  provider: string;
  displayName: string;
  model: string | null;
  mode: "provider_probe" | "runtime_smoke" | "full_contract";
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

type EventsResponse = {
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

const RANGE_OPTIONS = [
  { value: "1", label: "Letzte 24h" },
  { value: "7", label: "Letzte 7 Tage" },
  { value: "30", label: "Letzte 30 Tage" },
];

const nf = new Intl.NumberFormat("de-DE");
const cf = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function toStatusLabel(row: ProviderDiagnostic | null | undefined): string {
  if (!row) return "unbekannt";
  if (row.status === "ok") return "ok";
  if (row.status === "config_missing") return "config_missing";
  if (row.status === "skipped") return row.journeyDecision;
  return `${row.status}${row.errorKind ? ` (${row.errorKind})` : ""}`;
}

export default function AdminAiHubPage() {
  const [range, setRange] = useState<string>("30");
  const [usage, setUsage] = useState<AiUsageBreakdownSnapshot | null>(null);
  const [events, setEvents] = useState<EventsResponse | null>(null);
  const [expandedRuns, setExpandedRuns] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [usageRes, eventsRes] = await Promise.all([
          fetch(`/api/admin/telemetry/ai/usage?range=${range}`, { cache: "no-store" }),
          fetch("/api/admin/telemetry/ai/events", { cache: "no-store" }),
        ]);
        const usageBody = (await usageRes.json().catch(() => null)) as UsageResponse | null;
        const eventsBody = (await eventsRes.json().catch(() => null)) as EventsResponse | null;

        if (!usageRes.ok || !usageBody?.ok || !usageBody.snapshot) {
          throw new Error(usageBody?.error ?? usageRes.statusText);
        }
        if (!eventsRes.ok || !eventsBody?.ok) {
          throw new Error(eventsBody?.error ?? eventsRes.statusText);
        }

        setUsage(usageBody.snapshot);
        setEvents(eventsBody);
      } catch (err: any) {
        setError(err?.message ?? "AI-Daten nicht erreichbar.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [range]);

  const runs = useMemo(() => events?.runs ?? [], [events]);
  const providerProbeRun = useMemo(
    () => runs.find((run) => run.mode === "provider_probe") ?? null,
    [runs],
  );
  const runtimeSuccess = useMemo(
    () => runs.find((run) => run.mode === "runtime_smoke" && run.ok) ?? null,
    [runs],
  );
  const fullSuccess = useMemo(
    () => runs.find((run) => run.mode === "full_contract" && run.ok) ?? null,
    [runs],
  );

  const ariProbe = providerProbeRun?.providers.find((row) => row.provider === "ari") ?? null;
  const openAiProbe = providerProbeRun?.providers.find((row) => row.provider === "openai") ?? null;

  const reachableCount = providerProbeRun
    ? providerProbeRun.providers.filter((row) => row.status === "ok").length
    : 0;
  const failingCount = providerProbeRun
    ? providerProbeRun.providers.filter((row) => row.status !== "ok").length
    : 0;

  const contractFailures = useMemo(
    () =>
      runs
        .filter((run) => run.mode === "full_contract")
        .flatMap((run) => run.providers)
        .filter((row) => row.status !== "ok" && (row.errorKind === "BAD_JSON" || row.schemaStatus === "failed"))
        .length,
    [runs],
  );

  const badJsonCount = usage?.byErrorKind.find((row) => row.key === "BAD_JSON")?.calls ?? 0;
  const modelNotFoundCount = usage?.byErrorKind.find((row) => row.key === "MODEL_NOT_FOUND")?.calls ?? 0;
  const configMissingCount = runs
    .flatMap((run) => run.providers)
    .filter((row) => row.status === "config_missing" || row.rootCause === "CONFIG_MISSING").length;

  const reliabilityRows = usage?.byProvider ?? [];

  const operatorHints = useMemo(() => {
    const seen = new Set<string>();
    const hints: Array<{ rootCause: string; hint: string }> = [];
    for (const run of runs) {
      for (const row of run.providers) {
        if (row.status === "ok") continue;
        const key = `${row.rootCause}:${row.nextAction}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hints.push({ rootCause: row.rootCause, hint: row.nextAction });
      }
    }
    return hints.slice(0, 8);
  }, [runs]);

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Admin · Telemetry · AI
          </p>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">AI Usage & Operations Dashboard</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            Betriebsblick auf Erreichbarkeit, Runtime/Contract, Kosten und Fehlermuster.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="range" className="font-semibold text-[rgb(var(--muted))]">Zeitraum</label>
          <select
            id="range"
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Link href="/admin/telemetry/ai/orchestrator" className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-sky-700">
            Smoke-Steuerung
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Health Summary">
          <Line label="Providers reachable" value={loading ? "…" : String(reachableCount)} />
          <Line label="Providers failing" value={loading ? "…" : String(failingCount)} />
          <Line label="Contract failures" value={loading ? "…" : String(contractFailures)} />
          <Line
            label="Last successful orchestrator run"
            value={runtimeSuccess ? new Date(runtimeSuccess.finishedAt).toLocaleString("de-DE") : "none"}
          />
          <Line
            label="Last full analyze success"
            value={fullSuccess ? new Date(fullSuccess.finishedAt).toLocaleString("de-DE") : "none"}
          />
          <Line label="ARI status" value={toStatusLabel(ariProbe)} />
          <Line label="OpenAI/GPT status" value={toStatusLabel(openAiProbe)} />
        </Card>

        <Card title="Cost & Tokens">
          <Line label="Tokens gesamt" value={loading || !usage ? "…" : nf.format(usage.totals.tokens)} />
          <Line label="Kosten gesamt" value={loading || !usage ? "…" : cf.format(usage.totals.costEur)} />
          <Line label="Calls gesamt" value={loading || !usage ? "…" : nf.format(usage.totals.calls)} />
          <Line label="Errors gesamt" value={loading || !usage ? "…" : nf.format(usage.totals.errors)} />
          <div className="mt-2 text-xs text-[rgb(var(--muted))]">by provider</div>
          <div className="mt-1 space-y-1 text-xs">
            {(usage?.byProvider ?? []).slice(0, 5).map((row) => (
              <div key={`provider-${row.key}`} className="flex items-center justify-between">
                <span>{row.label}</span>
                <span>{nf.format(row.tokens)} · {cf.format(row.costEur)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-[rgb(var(--muted))]">by pipeline</div>
          <div className="mt-1 space-y-1 text-xs">
            {(usage?.byPipeline ?? []).slice(0, 5).map((row) => (
              <div key={`pipe-${row.key}`} className="flex items-center justify-between">
                <span>{row.label}</span>
                <span>{nf.format(row.tokens)} · {cf.format(row.costEur)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Reliability">
          <Line label="BAD_JSON count" value={String(badJsonCount)} />
          <Line label="MODEL_NOT_FOUND count" value={String(modelNotFoundCount)} />
          <Line label="CONFIG_MISSING count" value={String(configMissingCount)} />
          <Line
            label="Median/P95 latency"
            value={usage ? `${Math.round(usage.performance.avgDurationMs)} ms / n/a` : "…"}
          />
          <Line
            label="Fallback usage count"
            value={String(runs.flatMap((run) => run.providers).filter((row) => row.fallbackUsed).length)}
          />
          <div className="mt-2 text-xs text-[rgb(var(--muted))]">Success rate by provider</div>
          <div className="mt-1 space-y-1 text-xs">
            {reliabilityRows.slice(0, 6).map((row) => (
              <div key={`rel-${row.key}`} className="flex items-center justify-between">
                <span>{row.label}</span>
                <span>{row.successRatePct?.toFixed(1) ?? "0.0"}%</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Recent Runs</h2>
          <Link href="/admin/telemetry/ai/dashboard" className="text-sm font-semibold text-sky-700 underline">
            Detailansicht
          </Link>
        </div>
        {runs.length === 0 && <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine Runs vorhanden.</p>}
        {runs.length > 0 && (
          <div className="mt-3 space-y-2">
            {runs.map((run) => {
              const expanded = expandedRuns[run.runId] ?? false;
              return (
                <div key={run.runId} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] md:items-center">
                    <div>
                      <div className="text-xs text-[rgb(var(--muted))]">{new Date(run.startedAt).toLocaleString("de-DE")}</div>
                      <div className="font-mono text-xs text-[rgb(var(--muted))]">{run.runId}</div>
                    </div>
                    <div className="text-sm">{run.mode}</div>
                    <div className="text-sm font-semibold">{run.ok ? "ok" : "failed"}</div>
                    <div className="text-sm">{run.rootCause}</div>
                    <div className="text-sm text-[rgb(var(--muted))]">{run.nextAction}</div>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-sky-700 underline"
                    onClick={() => setExpandedRuns((prev) => ({ ...prev, [run.runId]: !expanded }))}
                  >
                    {expanded ? "Details ausblenden" : "Details anzeigen"}
                  </button>
                  {expanded && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full divide-y divide-[rgb(var(--border))] text-xs">
                        <thead className="text-left text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                          <tr>
                            <th className="px-2 py-1">Provider</th>
                            <th className="px-2 py-1">Model</th>
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Operator Hints</h2>
        {operatorHints.length === 0 && (
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine aktiven Hinweise.</p>
        )}
        {operatorHints.length > 0 && (
          <ul className="mt-2 space-y-2 text-sm">
            {operatorHints.map((hint, index) => (
              <li key={`${hint.rootCause}-${index}`} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <div className="font-semibold text-[rgb(var(--fg))]">{hint.rootCause}</div>
                <div className="text-[rgb(var(--muted))]">{hint.hint}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
      <div className="mt-2 space-y-1 text-sm">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span className="font-semibold text-[rgb(var(--fg))]">{value}</span>
    </div>
  );
}
