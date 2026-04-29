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
  estimatedCostUsd?: number | null;
  estimatedCostEur?: number | null;
  costKnown?: boolean;
  pricingSource?: string | null;
  costReason?: string | null;
  runCostGroup?: string | null;
  smokeMode?: string | null;
  budgetProfile?: string | null;
  fallbackUsed: boolean | null;
  fallbackReason: string | null;
  journeyDecision: string;
  strictStatus: "ok" | "failed" | "blocked" | "not_started";
  strictProviderErrorCode: string | null;
  strictSchemaPath: string | null;
  repairAttempted: boolean;
  repairStatus: "ok" | "failed" | "blocked" | "not_attempted";
  repairProviderErrorCode: string | null;
  repairSchemaPath: string | null;
  repairReason: string | null;
  repairUsed: boolean;
  directStrictStatus: "ok" | "failed" | "blocked" | "not_started";
  draftStatus: "ok" | "failed" | "not_attempted";
  envelopeBuildStatus: "ok" | "failed" | "not_attempted";
  finalSchemaStatus: "ok" | "failed" | "not_started";
  finalContractStatus:
    | "strict_ok"
    | "built_valid"
    | "repaired_degraded"
    | "failed"
    | "blocked"
    | "not_started";
  buildWarnings: string[];
  filledDefaults: string[];
  missingContainers: string[];
  normalizedEnumWarnings: string[];
  generatedIds: string[];
  nativeStrategy: string;
  preferredContractStrategy: string;
  providerStrategy: string;
  fallbackStrategy: string;
  supportsStrictJsonSchema: boolean;
  supportsJsonObjectMode: boolean | "prompt_only";
  supportsPromptEnvelope: boolean;
  supportsRepairAttempt: boolean;
  canBeUsedAsRepairProvider: boolean;
  knownBlockers: string[];
  nonRepairableErrorCodes: string[];
  diagnosticNotes: string[];
  formatUsed: "json_schema" | "json_object" | null;
  didFallback: boolean | null;
  timeoutMs?: number | null;
  maxOutputTokens?: number | null;
  openaiErrorCode?: string | null;
  openaiErrorMessage?: string | null;
  selectedSmokeModel?: string | null;
  smokeModelEnvPresent?: boolean | null;
  effectiveModel?: string | null;
  openAiSmokeModelMismatch?: boolean | null;
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
  if (status === "degraded") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "config_missing") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "skipped") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function contractStatusChipClass(status: ProviderDiagnostic["finalContractStatus"]): string {
  if (status === "strict_ok") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "built_valid") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "repaired_degraded") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "blocked") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "failed") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function formatTokens(row: ProviderDiagnostic): string {
  if (typeof row.tokensIn === "number" || typeof row.tokensOut === "number") {
    return `${row.tokensIn ?? 0}/${row.tokensOut ?? 0}`;
  }
  return "n/a";
}

function formatEstimatedCost(row: ProviderDiagnostic): string {
  if (row.costKnown !== true) return "n/a";
  const eur = typeof row.estimatedCostEur === "number" ? row.estimatedCostEur.toFixed(6) : "n/a";
  const usd = typeof row.estimatedCostUsd === "number" ? row.estimatedCostUsd.toFixed(6) : "n/a";
  return `EUR ${eur} · USD ${usd}`;
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
      row.reason ||
      row.openaiErrorCode ||
      row.openaiErrorMessage ||
      (Array.isArray(row.buildWarnings) && row.buildWarnings.length > 0) ||
      (Array.isArray(row.filledDefaults) && row.filledDefaults.length > 0) ||
      (Array.isArray(row.missingContainers) && row.missingContainers.length > 0) ||
      (Array.isArray(row.normalizedEnumWarnings) && row.normalizedEnumWarnings.length > 0) ||
      (Array.isArray(row.generatedIds) && row.generatedIds.length > 0) ||
      row.selectedSmokeModel ||
      row.effectiveModel ||
      typeof row.smokeModelEnvPresent === "boolean" ||
      row.openAiSmokeModelMismatch === true ||
      typeof row.timeoutMs === "number" ||
      typeof row.maxOutputTokens === "number" ||
      (Array.isArray(row.diagnosticNotes) && row.diagnosticNotes.length > 0),
  );
}

function formatModeLabel(mode: SmokeMode): string {
  if (mode === "provider_probe") return "Provider Probe";
  if (mode === "full_contract") return "Full Contract";
  return "Runtime Smoke";
}

type ProviderHealthStatus = "green" | "yellow" | "red" | "gray";

type ProviderHealthRow = {
  provider: string;
  displayName: string;
  overall: ProviderHealthStatus;
  connection: ProviderHealthStatus;
  runtime: ProviderHealthStatus;
  strictContract: ProviderHealthStatus;
  journey: ProviderHealthStatus;
  account: ProviderHealthStatus;
  rootCause: string;
  nextAction: string;
  detail: string;
};

const HEALTH_PROVIDERS = ["openai", "anthropic", "mistral", "gemini", "ari"];

function healthDotClass(status: ProviderHealthStatus): string {
  if (status === "green") return "bg-emerald-500";
  if (status === "yellow") return "bg-amber-500";
  if (status === "red") return "bg-rose-500";
  return "bg-slate-300";
}

function healthLabel(status: ProviderHealthStatus): string {
  if (status === "green") return "grün";
  if (status === "yellow") return "gelb";
  if (status === "red") return "rot";
  return "grau";
}

function StatusDot({ status, label }: { status: ProviderHealthStatus; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[rgb(var(--muted))]">
      <span className={`h-2.5 w-2.5 rounded-full ${healthDotClass(status)}`} />
      <span>{label}</span>
    </span>
  );
}

function providerOf(row: ProviderDiagnostic | undefined): string {
  return row?.displayName || row?.provider || "Provider";
}

function isAccountProblem(row: ProviderDiagnostic | undefined): boolean {
  if (!row) return false;
  const text = [
    row.errorKind,
    row.providerErrorCode,
    row.reason,
    row.errorMessage,
    typeof row.httpStatus === "number" ? String(row.httpStatus) : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("429") ||
    text.includes("quota") ||
    text.includes("rate") ||
    text.includes("402") ||
    text.includes("payment") ||
    text.includes("billing") ||
    text.includes("invalid_api_key") ||
    text.includes("config_missing")
  );
}

function statusFromDiagnostic(row: ProviderDiagnostic | undefined, skippedAsGray = true): ProviderHealthStatus {
  if (!row) return "gray";
  if (row.status === "ok") return "green";
  if (row.status === "degraded") return "yellow";
  if (row.status === "skipped" && skippedAsGray) return "gray";
  if (row.status === "config_missing") return "red";
  if (isAccountProblem(row)) return "red";
  return "red";
}

function accountStatusFor(rows: Array<ProviderDiagnostic | undefined>): ProviderHealthStatus {
  const present = rows.filter(Boolean) as ProviderDiagnostic[];
  if (present.some(isAccountProblem)) return "red";
  if (present.some((row) => row.status === "ok" || row.providerStatus === "reachable")) return "green";
  return "gray";
}

function firstProblem(rows: Array<ProviderDiagnostic | undefined>): ProviderDiagnostic | undefined {
  return rows.find((row) => row && row.status !== "ok" && row.status !== "skipped");
}

function buildProviderHealthRows(dataByMode: Partial<Record<SmokeMode, SmokeResponse>>): ProviderHealthRow[] {
  const probeRows = dataByMode.provider_probe?.rows ?? [];
  const runtimeRows = dataByMode.runtime_smoke?.rows ?? [];
  const journeyRows = dataByMode.full_contract?.rows ?? [];
  const strictRows = dataByMode.full_contract?.directContractRows ?? [];

  return HEALTH_PROVIDERS.map((provider) => {
    const isPrimaryContractProvider =
      provider === "openai" || provider === "anthropic" || provider === "mistral";
    const probe = probeRows.find((row) => row.provider === provider);
    const runtime = runtimeRows.find((row) => row.provider === provider);
    const journey = journeyRows.find((row) => row.provider === provider);
    const strict = strictRows.find((row) => row.provider === provider);

    const connection = statusFromDiagnostic(probe);
    const runtimeStatus = statusFromDiagnostic(runtime);
    const journeyStatus = statusFromDiagnostic(journey);
    const strictStatus = statusFromDiagnostic(strict, false);
    const account = accountStatusFor([probe, runtime, journey, strict]);

    const relevant = [probe, runtime, strict, journey];
    const problem = firstProblem(relevant);

    let overall: ProviderHealthStatus = "gray";
    if (account === "red") {
      overall = "red";
    } else if (isPrimaryContractProvider) {
      if (strictStatus === "green" && connection === "green" && (runtimeStatus === "green" || runtimeStatus === "gray")) {
        overall = "green";
      } else if (strictStatus === "yellow" && connection === "green" && runtimeStatus !== "red") {
        overall = "yellow";
      } else if (strictStatus === "red" || [connection, runtimeStatus].includes("red")) {
        overall = "red";
      }
    } else if (connection === "green" && runtimeStatus === "green" && strictStatus === "green") {
      overall = "green";
    } else if (connection === "green" && (runtimeStatus === "green" || runtimeStatus === "gray") && strictStatus !== "green") {
      overall = "yellow";
    } else if ([connection, runtimeStatus, strictStatus, journeyStatus].some((status) => status === "red")) {
      overall = "red";
    }

    const displayName =
      providerOf(probe) !== "Provider"
        ? providerOf(probe)
        : providerOf(runtime) !== "Provider"
          ? providerOf(runtime)
          : providerOf(strict) !== "Provider"
            ? providerOf(strict)
            : providerOf(journey) !== "Provider"
              ? providerOf(journey)
              : provider;

    const detailParts = [
      probe ? `Probe=${probe.status}` : "Probe=n/a",
      runtime ? `Runtime=${runtime.status}` : "Runtime=n/a",
      strict ? `Strict=${strict.status}${strict.schemaPath ? ` @ ${strict.schemaPath}` : ""}` : "Strict=n/a",
      journey ? `Journey=${journey.status}` : "Journey=n/a",
    ];

    return {
      provider,
      displayName,
      overall,
      connection,
      runtime: runtimeStatus,
      strictContract: strictStatus,
      journey: journeyStatus,
      account,
      rootCause: problem?.rootCause ?? (overall === "green" ? "OK" : "Noch nicht vollständig geprüft"),
      nextAction:
        problem?.nextAction ??
        (overall === "green"
          ? "Keine Aktion nötig."
          : "Provider-Probe, Runtime und Full Contract ausführen."),
      detail: detailParts.join(" · "),
    };
  });
}

function overallCardClass(status: ProviderHealthStatus): string {
  if (status === "green") return "border-l-4 border-l-emerald-500 bg-[rgb(var(--card))]";
  if (status === "yellow") return "border-l-4 border-l-amber-500 bg-[rgb(var(--card))]";
  if (status === "red") return "border-l-4 border-l-rose-500 bg-[rgb(var(--card))]";
  return "border-l-4 border-l-slate-500 bg-[rgb(var(--card))]";
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

  const providerHealthRows = useMemo(() => buildProviderHealthRows(dataByMode), [dataByMode]);

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

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Anbieter-Ampel</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Provider-zentrierte Zusammenfassung aus Verbindung, Runtime, Strict Contract, Journey und Account-Status.
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Grün bedeutet: erreichbar, Runtime ok und Strict Analyze Contract ok. Gelb bedeutet: nutzbar/teilweise, aber Contract-Qualität nicht sauber. Rot bedeutet: blockierend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 font-semibold text-[rgb(var(--fg))]"
              disabled={loadingMode !== null}
              onClick={() => run("provider_probe")}
            >
              Probe
            </button>
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 font-semibold text-[rgb(var(--fg))]"
              disabled={loadingMode !== null}
              onClick={() => run("runtime_smoke")}
            >
              Runtime
            </button>
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 font-semibold text-[rgb(var(--fg))]"
              disabled={loadingMode !== null}
              onClick={() => run("full_contract")}
            >
              Full Contract
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              <tr>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Gesamt</th>
                <th className="px-3 py-2">Verbindung</th>
                <th className="px-3 py-2">Runtime</th>
                <th className="px-3 py-2">Strict Contract</th>
                <th className="px-3 py-2">Journey</th>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Hauptursache</th>
                <th className="px-3 py-2">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {providerHealthRows.map((row) => (
                <tr key={row.provider} className={overallCardClass(row.overall)}>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-[rgb(var(--fg))]">{row.provider}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{row.displayName}</div>
                    <div className="mt-1 text-[10px] text-[rgb(var(--muted))]">{row.detail}</div>
                  </td>
                  <td className="px-3 py-2"><StatusDot status={row.overall} label={healthLabel(row.overall)} /></td>
                  <td className="px-3 py-2"><StatusDot status={row.connection} label={healthLabel(row.connection)} /></td>
                  <td className="px-3 py-2"><StatusDot status={row.runtime} label={healthLabel(row.runtime)} /></td>
                  <td className="px-3 py-2"><StatusDot status={row.strictContract} label={healthLabel(row.strictContract)} /></td>
                  <td className="px-3 py-2"><StatusDot status={row.journey} label={healthLabel(row.journey)} /></td>
                  <td className="px-3 py-2"><StatusDot status={row.account} label={healthLabel(row.account)} /></td>
                  <td className="px-3 py-2 text-xs font-semibold text-[rgb(var(--fg))]">{row.rootCause}</td>
                  <td className="px-3 py-2 text-xs text-[rgb(var(--muted))]">{row.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
                                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${contractStatusChipClass(row.finalContractStatus)}`}>
                                    {row.finalContractStatus}
                                  </span>
                                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                                    strict={row.strictStatus} · draft={row.draftStatus} · build={row.envelopeBuildStatus} · repair={row.repairStatus}
                                  </div>
                                  <div className="mt-1 text-[10px] text-[rgb(var(--muted))]">
                                    native={row.nativeStrategy} · preferred={row.preferredContractStrategy} · format={row.formatUsed ?? "none"} · fallback={String(row.didFallback)}
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
                                        <div>mode={formatModeLabel(row.mode)} · stage=direct_provider_contract · finalContractStatus={row.finalContractStatus}</div>
                                        <div>nativeStrategy={row.nativeStrategy} · providerStrategy={row.providerStrategy} · preferredContractStrategy={row.preferredContractStrategy} · fallbackStrategy={row.fallbackStrategy}</div>
                                        <div>model={row.model ?? "unknown"} · timeoutMs={row.timeoutMs ?? "n/a"} · maxOutputTokens={row.maxOutputTokens ?? "n/a"}</div>
                                        <div>smokeMode={row.smokeMode ?? "n/a"} · budgetProfile={row.budgetProfile ?? "n/a"} · runCostGroup={row.runCostGroup ?? "n/a"} · estimatedCost={formatEstimatedCost(row)}</div>
                                        <div>selectedSmokeModel={row.selectedSmokeModel ?? "n/a"} · smokeModelEnvPresent={typeof row.smokeModelEnvPresent === "boolean" ? String(row.smokeModelEnvPresent) : "n/a"} · effectiveModel={row.effectiveModel ?? "n/a"} · openAiSmokeModelMismatch={String(row.openAiSmokeModelMismatch ?? false)}</div>
                                        <div>strictStatus={row.strictStatus} · strictProviderCode={row.strictProviderErrorCode ?? "none"} · strictSchemaPath={row.strictSchemaPath ?? "none"}</div>
                                        <div>directStrictStatus={row.directStrictStatus} · draftStatus={row.draftStatus} · envelopeBuildStatus={row.envelopeBuildStatus} · finalSchemaStatus={row.finalSchemaStatus}</div>
                                        <div>repairStatus={row.repairStatus} · repairUsed={String(row.repairUsed)} · repairProviderCode={row.repairProviderErrorCode ?? "none"} · repairSchemaPath={row.repairSchemaPath ?? "none"} · repairReason={row.repairReason ?? "none"}</div>
                                        <div>filledDefaults={row.filledDefaults.join(",") || "none"} · missingContainers={row.missingContainers.join(",") || "none"}</div>
                                        <div>normalizedEnumWarnings={row.normalizedEnumWarnings.join(" | ") || "none"} · generatedIds={row.generatedIds.join(",") || "none"}</div>
                                        <div>buildWarnings={row.buildWarnings.join(" | ") || "none"}</div>
                                        <div>formatUsed={row.formatUsed ?? "none"} · didFallback={String(row.didFallback)} · supportsPromptEnvelope={String(row.supportsPromptEnvelope)}</div>
                                        <div>openaiErrorCode={row.openaiErrorCode ?? "none"} · openaiErrorMessage={row.openaiErrorMessage ?? "none"}</div>
                                        <div>errorKind={row.errorKind ?? "none"} · providerCode={row.providerErrorCode ?? "none"} · httpStatus={row.httpStatus ?? "none"}</div>
                                        <div>parseError={row.parseError ?? "none"} · schemaError={row.schemaError ?? "none"} · schemaPath={row.schemaPath ?? "none"}</div>
                                        <div>fallbackUsed={String(row.fallbackUsed)} · fallbackReason={row.fallbackReason ?? "none"}</div>
                                        <div>knownBlockers={row.knownBlockers.join(",") || "none"} · nonRepairable={row.nonRepairableErrorCodes.join(",") || "none"}</div>
                                        {row.diagnosticNotes.length > 0 && (
                                          <div className="mt-1">diagnosticNotes: {row.diagnosticNotes.join(" | ")}</div>
                                        )}
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
