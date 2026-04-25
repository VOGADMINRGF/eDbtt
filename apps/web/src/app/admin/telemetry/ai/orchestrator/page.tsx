"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";

type SmokeMode = "provider_probe" | "runtime_smoke" | "full_contract";

type ProviderDiagnostic = {
  provider: string;
  displayName: string;
  model: string | null;
  mode: SmokeMode;
  stage: string;
  status: "ok" | "skipped" | "failed" | "degraded" | "config_missing";
  errorKind: string | null;
  providerErrorCode: string | null;
  httpStatus: number | null;
  errorMessage: string | null;
  reason: string | null;
  validationMode: string;
  providerStatus: "reachable" | "down" | "unknown";
  adapterStatus: "ok" | "failed" | "not_started";
  parseStatus: "ok" | "failed" | "not_started";
  schemaStatus: "ok" | "failed" | "not_started";
  parseError: string | null;
  schemaError: string | null;
  schemaPath: string | null;
  rawExcerpt: string | null;
  durationMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  fallbackUsed: boolean | null;
  fallbackReason: string | null;
  journeyDecision: string;
  rootCause: string;
  nextAction: string;
};

type SmokeResponse = {
  ok: boolean;
  mode: SmokeMode;
  runId: string;
  correlationId: string;
  bestProviderId?: string | null;
  orchestratorOk: boolean;
  rows: ProviderDiagnostic[];
  directContractRows?: ProviderDiagnostic[];
  error?: string;
  createAnalyzeApi: {
    state: "ok" | "failed" | "skipped";
    ok: boolean;
    durationMs: number;
    reason: string | null;
    code: string | null;
  };
};

type ModeCard = {
  mode: SmokeMode;
  title: string;
  subtitle: string;
  action: string;
};

const MODE_CARDS: ModeCard[] = [
  {
    mode: "provider_probe",
    title: "Direktprüfung Provider",
    subtitle: "Kann der Provider direkt aufgerufen werden (ohne Journey-Plan)?",
    action: "Direktprobe ausführen",
  },
  {
    mode: "runtime_smoke",
    title: "Runtime Smoke",
    subtitle: "Kann der Orchestrator einen kleinen Lauf ausführen (json_only)?",
    action: "Runtime Smoke ausführen",
  },
  {
    mode: "full_contract",
    title: "Full Analyze Contract Test",
    subtitle: "Erfüllt der Lauf den strikten Analyze-JSON/Schema-Contract?",
    action: "Full Contract ausführen",
  },
];

function modeToQuery(mode: SmokeMode): string {
  if (mode === "provider_probe") return "?mode=probe";
  if (mode === "full_contract") return "?mode=full";
  return "";
}

function statusChipClass(status: ProviderDiagnostic["status"]): string {
  if (status === "ok") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "config_missing") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "skipped") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function formatTokens(row: ProviderDiagnostic): string {
  if (typeof row.tokensIn === "number" || typeof row.tokensOut === "number") {
    return `${row.tokensIn ?? 0}/${row.tokensOut ?? 0}`;
  }
  return "n/a";
}

function compactReason(row: ProviderDiagnostic): string {
  const parts = [
    row.reason,
    row.errorMessage,
    row.errorKind ? `errorKind=${row.errorKind}` : null,
    typeof row.httpStatus === "number" ? `http=${row.httpStatus}` : null,
    row.providerErrorCode ? `code=${row.providerErrorCode}` : null,
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));
  return parts.length ? parts.join(" · ") : "Keine Fehlerdetails";
}

function hasDetail(row: ProviderDiagnostic): boolean {
  return Boolean(
    row.rawExcerpt ||
      row.parseError ||
      row.schemaError ||
      row.schemaPath ||
      row.providerErrorCode ||
      row.errorKind ||
      row.errorMessage ||
      row.reason,
  );
}

function formatModeLabel(mode: SmokeMode): string {
  if (mode === "provider_probe") return "Provider Probe";
  if (mode === "full_contract") return "Full Contract";
  return "Runtime Smoke";
}

export default function OrchestratorTelemetryPage() {
  const [dataByMode, setDataByMode] = useState<Partial<Record<SmokeMode, SmokeResponse>>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [loadingMode, setLoadingMode] = useState<SmokeMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderedRows = useMemo(() => {
    const byMode: Record<SmokeMode, ProviderDiagnostic[]> = {
      provider_probe: dataByMode.provider_probe?.rows ?? [],
      runtime_smoke: dataByMode.runtime_smoke?.rows ?? [],
      full_contract: dataByMode.full_contract?.rows ?? [],
    };
    return byMode;
  }, [dataByMode]);

  async function run(mode: SmokeMode) {
    setLoadingMode(mode);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ai/orchestrator-smoke${modeToQuery(mode)}`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as SmokeResponse | null;
      if (!res.ok || !body) throw new Error(body?.error || res.statusText);
      setDataByMode((prev) => ({ ...prev, [mode]: body }));
    } catch (err: any) {
      setError(err?.message ?? "Smoke-Test fehlgeschlagen");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Telemetry · AI
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Orchestrator-Diagnose</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Getrennte Sicht auf Provider-Probe, Runtime und strikten Analyze-Contract.
          ARI kann direkt geprüft werden, auch wenn ARI im Journey-Plan übersprungen wird.
        </p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Ergänzende Live-Übersicht: <Link href="/admin/telemetry/ai/dashboard" className="text-sky-700 underline">Recent Runs</Link>
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4">
        {MODE_CARDS.map((card) => {
          const data = dataByMode[card.mode] ?? null;
          const rows = orderedRows[card.mode];
          return (
            <article
              key={card.mode}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{card.title}</h2>
                  <p className="text-sm text-[rgb(var(--muted))]">{card.subtitle}</p>
                  {data && (
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      runId: <span className="font-mono">{data.runId}</span> · Ergebnis: {data.ok ? "OK" : "Fehler"}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => run(card.mode)}
                  disabled={loadingMode !== null}
                >
                  {loadingMode === card.mode ? "läuft …" : card.action}
                </button>
              </div>

              {data && card.mode === "full_contract" && (
                <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                  createAnalyzeApi: {data.createAnalyzeApi.state} · code={data.createAnalyzeApi.code ?? "none"} · reason={data.createAnalyzeApi.reason ?? "none"}
                </div>
              )}

              {data && card.mode === "full_contract" && (data.directContractRows?.length ?? 0) > 0 && (
                <div className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Direkter Provider-Contract</h3>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Prüft OpenAI/GPT, Anthropic, Mistral, Gemini und ARI direkt gegen den AnalyzeResultSchema-Contract – unabhängig vom Journey-Plan.
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
                      <thead className="bg-[rgb(var(--card))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        <tr>
                          <th className="px-3 py-2">Provider</th>
                          <th className="px-3 py-2">Modell</th>
                          <th className="px-3 py-2">Result</th>
                          <th className="px-3 py-2">Root Cause</th>
                          <th className="px-3 py-2">Next Action</th>
                          <th className="px-3 py-2">Diagnose</th>
                          <th className="px-3 py-2">Dauer</th>
                          <th className="px-3 py-2">Tokens in/out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgb(var(--border))]">
                        {data.directContractRows?.map((row) => {
                          const rowKey = `${card.mode}-direct-${row.provider}`;
                          const expanded = expandedRows[rowKey] ?? false;
                          return (
                            <Fragment key={rowKey}>
                              <tr>
                                <td className="px-3 py-2">
                                  <div className="font-semibold text-[rgb(var(--fg))]">{row.provider}</div>
                                  <div className="text-xs text-[rgb(var(--muted))]">{row.displayName}</div>
                                </td>
                                <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.model ?? "unknown"}</td>
                                <td className="px-3 py-2">
                                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusChipClass(row.status)}`}>
                                    {row.status}
                                  </span>
                                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                                    provider={row.providerStatus} · adapter={row.adapterStatus} · parse={row.parseStatus} · schema={row.schemaStatus}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs font-semibold text-[rgb(var(--fg))]">{row.rootCause}</td>
                                <td className="px-3 py-2 text-xs text-[rgb(var(--muted))]">{row.nextAction}</td>
                                <td className="px-3 py-2 text-xs text-[rgb(var(--muted))]">{compactReason(row)}</td>
                                <td className="px-3 py-2">{typeof row.durationMs === "number" ? `${row.durationMs} ms` : "n/a"}</td>
                                <td className="px-3 py-2">{formatTokens(row)}</td>
                              </tr>
                              {hasDetail(row) && (
                                <tr>
                                  <td className="px-3 pb-3" colSpan={8}>
                                    <button
                                      type="button"
                                      className="text-xs font-semibold text-sky-700 underline"
                                      onClick={() => setExpandedRows((prev) => ({ ...prev, [rowKey]: !expanded }))}
                                    >
                                      {expanded ? "Details ausblenden" : "Details anzeigen"}
                                    </button>
                                    {expanded && (
                                      <div className="mt-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-xs text-[rgb(var(--muted))]">
                                        <div>mode={formatModeLabel(row.mode)} · stage=direct_provider_contract · journeyDecision={row.journeyDecision} · validationMode={row.validationMode}</div>
                                        <div>errorKind={row.errorKind ?? "none"} · providerCode={row.providerErrorCode ?? "none"} · httpStatus={row.httpStatus ?? "none"}</div>
                                        <div>parseError={row.parseError ?? "none"} · schemaError={row.schemaError ?? "none"} · schemaPath={row.schemaPath ?? "none"}</div>
                                        <div>fallbackUsed={String(row.fallbackUsed)} · fallbackReason={row.fallbackReason ?? "none"}</div>
                                        <div className="mt-1">rawExcerpt: {row.rawExcerpt ?? "none"}</div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {rows.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
                    <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      <tr>
                        <th className="px-3 py-2">Provider</th>
                        <th className="px-3 py-2">Modell</th>
                        <th className="px-3 py-2">Result</th>
                        <th className="px-3 py-2">Root Cause</th>
                        <th className="px-3 py-2">Next Action</th>
                        <th className="px-3 py-2">Diagnose</th>
                        <th className="px-3 py-2">Dauer</th>
                        <th className="px-3 py-2">Tokens in/out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {rows.map((row) => {
                        const rowKey = `${card.mode}-${row.stage}-${row.provider}`;
                        const expanded = expandedRows[rowKey] ?? false;
                        return (
                          <Fragment key={rowKey}>
                            <tr key={rowKey}>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-[rgb(var(--fg))]">{row.provider}</div>
                                <div className="text-xs text-[rgb(var(--muted))]">{row.displayName}</div>
                              </td>
                              <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.model ?? "unknown"}</td>
                              <td className="px-3 py-2">
                                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusChipClass(row.status)}`}>
                                  {row.status}
                                </span>
                                <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                                  provider={row.providerStatus} · adapter={row.adapterStatus} · parse={row.parseStatus} · schema={row.schemaStatus}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs font-semibold text-[rgb(var(--fg))]">{row.rootCause}</td>
                              <td className="px-3 py-2 text-xs text-[rgb(var(--muted))]">{row.nextAction}</td>
                              <td className="px-3 py-2 text-xs text-[rgb(var(--muted))]">{compactReason(row)}</td>
                              <td className="px-3 py-2">{typeof row.durationMs === "number" ? `${row.durationMs} ms` : "n/a"}</td>
                              <td className="px-3 py-2">{formatTokens(row)}</td>
                            </tr>
                            {hasDetail(row) && (
                              <tr>
                                <td className="px-3 pb-3" colSpan={8}>
                                  <button
                                    type="button"
                                    className="text-xs font-semibold text-sky-700 underline"
                                    onClick={() => setExpandedRows((prev) => ({ ...prev, [rowKey]: !expanded }))}
                                  >
                                    {expanded ? "Details ausblenden" : "Details anzeigen"}
                                  </button>
                                  {expanded && (
                                    <div className="mt-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
                                      <div>mode={formatModeLabel(row.mode)} · stage={row.stage} · journeyDecision={row.journeyDecision} · validationMode={row.validationMode}</div>
                                      <div>errorKind={row.errorKind ?? "none"} · providerCode={row.providerErrorCode ?? "none"} · httpStatus={row.httpStatus ?? "none"}</div>
                                      <div>parseError={row.parseError ?? "none"} · schemaError={row.schemaError ?? "none"} · schemaPath={row.schemaPath ?? "none"}</div>
                                      <div>fallbackUsed={String(row.fallbackUsed)} · fallbackReason={row.fallbackReason ?? "none"}</div>
                                      <div className="mt-1">rawExcerpt: {row.rawExcerpt ?? "none"}</div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
