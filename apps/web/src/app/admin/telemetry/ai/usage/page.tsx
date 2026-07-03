"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildAiUsageQueryParams,
  hasMeaningfulUsageData,
  rowErrorRate,
  toPositiveNumberInput,
  type AiUsageThresholdInputMap,
} from "@/features/admin/aiUsageView";

type AiUsageProviderName = "openai" | "anthropic" | "mistral" | "gemini" | "ari" | "youcom";
type AiUsagePipelineName =
  | "contribution_analyze"
  | "feeds_analyze"
  | "feeds_to_statementCandidate"
  | "factcheck"
  | "news_factcheck"
  | "report_summarize"
  | "content_translate"
  | "content_summarize_news"
  | "admin_orchestrate"
  | "orchestrator_smoke"
  | "provider_probe"
  | "other";

type AiUsageBreakdownRow = {
  key: string;
  label: string;
  tokens: number;
  costEur: number;
  calls: number;
  errors: number;
  errorRatePct?: number;
  successRatePct?: number;
  avgDurationMs?: number;
  costPerCallEur?: number;
};

type AiUsageErrorKindRow = {
  key: string;
  label: string;
  calls: number;
  ratePct: number;
};

type AiUsageInsight = {
  id: string;
  title: string;
  value: string;
  hint: string;
};

type AiUsageThresholds = {
  budgetMonthlyEur: number;
  projectedBudgetWarnPct: number;
  errorRateWarnPct: number;
  avgDurationWarnMs: number;
  costPerCallWarnEur: number;
  fallbackRelianceWarnSharePct: number;
  researchHeavyWarnSharePct: number;
  sealedCostFootprintWarnSharePct: number;
  timeoutWarnSharePct: number;
  badJsonWarnSharePct: number;
};

type AiUsageDerivedMetrics = {
  costPerCallEur: number;
  avgDurationMs: number;
  errorRatePct: number;
  timeoutSharePct: number;
  badJsonSharePct: number;
  researchHeavyWorkloadSharePct: number;
  fallbackRelianceSharePct: number;
  sealedFactcheckCostFootprintPct: number;
  projectedMonthlyCostEur: number;
  projectedBudgetUtilizationPct: number;
};

type AiUsageAttentionFlag = {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  value: string;
  threshold: string;
  hint: string;
};

type AiUsageBreakdownSnapshot = {
  totals: {
    tokens: number;
    costEur: number;
    calls: number;
    errors: number;
  };
  performance: {
    avgDurationMs: number;
    successRatePct: number;
    errorRatePct: number;
    costPerCallEur: number;
  };
  byProvider: AiUsageBreakdownRow[];
  byPipeline: AiUsageBreakdownRow[];
  byLane: AiUsageBreakdownRow[];
  byJourney: AiUsageBreakdownRow[];
  byErrorKind: AiUsageErrorKindRow[];
  recent: Array<{
    timestamp: string;
    provider: string;
    pipeline: string;
    runId?: string | null;
    jobId?: string | null;
    operationId?: string | null;
    operationType?: string | null;
    requestId?: string | null;
    dossierId?: string | null;
    organizationId?: string | null;
    userId?: string | null;
    tokens: number;
    costEur: number;
    durationMs: number;
    success: boolean;
    errorKind?: string | null;
  }>;
  insights: AiUsageInsight[];
  thresholds: AiUsageThresholds;
  derivedMetrics: AiUsageDerivedMetrics;
  attentionFlags: AiUsageAttentionFlag[];
  optimization: {
    savingsCandidates: AiUsageInsight[];
    qualityCandidates: AiUsageInsight[];
    stabilityCandidates: AiUsageInsight[];
  };
};

type ApiResponse = { ok: boolean; snapshot?: AiUsageBreakdownSnapshot; error?: string };
type RangeOption = { value: string; label: string };

const RANGE_OPTIONS: RangeOption[] = [
  { value: "7", label: "Letzte 7 Tage" },
  { value: "30", label: "Letzte 30 Tage" },
  { value: "90", label: "Letzte 90 Tage" },
];

const PROVIDERS: AiUsageProviderName[] = [
  "openai",
  "anthropic",
  "mistral",
  "gemini",
  "ari",
  "youcom",
];

const PROVIDER_LABELS: Record<AiUsageProviderName, string> = {
  openai: "GPT-4 / OpenAI",
  anthropic: "Claude / Anthropic",
  mistral: "Mistral",
  gemini: "Gemini",
  ari: "ARI",
  youcom: "ARI / You.com",
};

const PIPELINE_LABELS: Record<AiUsagePipelineName, string> = {
  contribution_analyze: "Beiträge",
  feeds_analyze: "Feeds",
  feeds_to_statementCandidate: "Feeds → Statements",
  factcheck: "Factcheck",
  news_factcheck: "News Factcheck",
  report_summarize: "Reports",
  content_translate: "Übersetzung",
  content_summarize_news: "News-Summary",
  admin_orchestrate: "Admin Orchestrate",
  orchestrator_smoke: "Orchestrator Smoke",
  provider_probe: "Provider Probe",
  other: "Andere",
};

const PIPELINES = Object.keys(PIPELINE_LABELS) as AiUsagePipelineName[];

const PROVIDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Alle Provider" },
  ...PROVIDERS.map((provider) => ({ value: provider, label: PROVIDER_LABELS[provider] })),
];

const PIPELINE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Alle Pipelines" },
  ...PIPELINES.map((pipeline) => ({ value: pipeline, label: PIPELINE_LABELS[pipeline] })),
];

const DEFAULT_THRESHOLD_INPUTS = {
  budgetMonthlyEur: "150",
  projectedBudgetWarnPct: "85",
  errorRateWarnPct: "8",
  avgDurationWarnMs: "12000",
  costPerCallWarnEur: "0.05",
  fallbackRelianceWarnSharePct: "40",
  researchHeavyWarnSharePct: "35",
  sealedCostFootprintWarnSharePct: "45",
  timeoutWarnSharePct: "5",
  badJsonWarnSharePct: "3",
};

function formatNumber(value: number) {
  return value.toLocaleString("de-DE");
}

function formatCurrency(value: number) {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function AiUsageTelemetryPage() {
  const [range, setRange] = useState<string>("30");
  const [provider, setProvider] = useState<string>("all");
  const [pipeline, setPipeline] = useState<string>("all");
  const [region, setRegion] = useState<string>("");
  const [thresholdInputs, setThresholdInputs] = useState<AiUsageThresholdInputMap>({
    ...DEFAULT_THRESHOLD_INPUTS,
  });
  const [snapshot, setSnapshot] = useState<AiUsageBreakdownSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasData = hasMeaningfulUsageData(snapshot);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const query = buildAiUsageQueryParams({
          range,
          provider,
          pipeline,
          region,
          thresholdInputs,
        });

        const res = await fetch(`/api/admin/telemetry/ai/usage?${query.toString()}`, {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => null)) as ApiResponse | null;
        if (!res.ok || !body?.ok || !body.snapshot) {
          throw new Error(body?.error || res.statusText);
        }
        setSnapshot(body.snapshot);
      } catch (err: any) {
        setError(err?.message ?? "Usage-Daten konnten nicht geladen werden.");
        setSnapshot(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [range, provider, pipeline, region, thresholdInputs]);

  const effectiveInsights = useMemo<AiUsageInsight[]>(() => {
    if (!snapshot) return [];
    return snapshot.insights ?? [];
  }, [snapshot]);
  const effectiveAttentionFlags = useMemo<AiUsageAttentionFlag[]>(() => {
    if (!snapshot) return [];
    return snapshot.attentionFlags ?? [];
  }, [snapshot]);
  const optimization = snapshot?.optimization ?? {
    savingsCandidates: [],
    qualityCandidates: [],
    stabilityCandidates: [],
  };

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Telemetry · AI
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">AI Usage & Operations</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Verbrauch, Kosten, Performance und Fehlerbilder pro Provider, Pipeline, Lane und Journey.
        </p>
      </header>

      <section className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:grid-cols-4">
        <FilterSelect
          id="usage-range"
          label="Zeitraum"
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
        />
        <FilterSelect
          id="usage-provider"
          label="Provider"
          value={provider}
          onChange={setProvider}
          options={PROVIDER_OPTIONS}
        />
        <FilterSelect
          id="usage-pipeline"
          label="Pipeline"
          value={pipeline}
          onChange={setPipeline}
          options={PIPELINE_OPTIONS}
        />
        <FilterInput
          id="usage-region"
          label="Region (optional)"
          value={region}
          onChange={setRegion}
          placeholder="z. B. DE-BE"
        />
      </section>

      <section className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:grid-cols-2 xl:grid-cols-5">
        <ThresholdInput
          id="threshold-budget-monthly"
          label="Budget (Monat, EUR)"
          value={thresholdInputs.budgetMonthlyEur}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, budgetMonthlyEur: value }))
          }
        />
        <ThresholdInput
          id="threshold-error-rate"
          label="Warnung Fehlerquote (%)"
          value={thresholdInputs.errorRateWarnPct}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, errorRateWarnPct: value }))
          }
        />
        <ThresholdInput
          id="threshold-latency"
          label="Warnung Ø Latenz (ms)"
          value={thresholdInputs.avgDurationWarnMs}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, avgDurationWarnMs: value }))
          }
        />
        <ThresholdInput
          id="threshold-cost-per-call"
          label="Warnung Cost/Call (EUR)"
          value={thresholdInputs.costPerCallWarnEur}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, costPerCallWarnEur: value }))
          }
        />
        <ThresholdInput
          id="threshold-fallback-share"
          label="Warnung Fallback-Share (%)"
          value={thresholdInputs.fallbackRelianceWarnSharePct}
          onChange={(value) =>
            setThresholdInputs((prev) => ({
              ...prev,
              fallbackRelianceWarnSharePct: value,
            }))
          }
        />
        <ThresholdInput
          id="threshold-projected-budget"
          label="Warnung Budget-Projektion (%)"
          value={thresholdInputs.projectedBudgetWarnPct}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, projectedBudgetWarnPct: value }))
          }
        />
        <ThresholdInput
          id="threshold-research-share"
          label="Warnung Research-Share (%)"
          value={thresholdInputs.researchHeavyWarnSharePct}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, researchHeavyWarnSharePct: value }))
          }
        />
        <ThresholdInput
          id="threshold-sealed-cost"
          label="Warnung Sealed-Kosten (%)"
          value={thresholdInputs.sealedCostFootprintWarnSharePct}
          onChange={(value) =>
            setThresholdInputs((prev) => ({
              ...prev,
              sealedCostFootprintWarnSharePct: value,
            }))
          }
        />
        <ThresholdInput
          id="threshold-timeout-share"
          label="Warnung Timeout-Share (%)"
          value={thresholdInputs.timeoutWarnSharePct}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, timeoutWarnSharePct: value }))
          }
        />
        <ThresholdInput
          id="threshold-bad-json-share"
          label="Warnung BAD_JSON-Share (%)"
          value={thresholdInputs.badJsonWarnSharePct}
          onChange={(value) =>
            setThresholdInputs((prev) => ({ ...prev, badJsonWarnSharePct: value }))
          }
        />
      </section>

      {loading && (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Lädt AI-Usage-Snapshot …
        </section>
      )}

      {error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      )}

      {!loading && !error && snapshot && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <UsageTile label="Calls" value={formatNumber(snapshot.totals.calls)} />
            <UsageTile label="Tokens gesamt" value={formatNumber(snapshot.totals.tokens)} />
            <UsageTile label="Kosten gesamt" value={formatCurrency(snapshot.totals.costEur)} />
            <UsageTile label="Fehlerquote" value={formatPercent(snapshot.performance.errorRatePct)} />
            <UsageTile label="Erfolgsquote" value={formatPercent(snapshot.performance.successRatePct)} />
            <UsageTile label="Ø Latenz" value={`${formatNumber(snapshot.performance.avgDurationMs)} ms`} />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <UsageTile
              label="Cost / Call"
              value={`${snapshot.derivedMetrics.costPerCallEur.toFixed(4)} €/Call`}
            />
            <UsageTile
              label="Fallback-Reliance (Proxy)"
              value={formatPercent(snapshot.derivedMetrics.fallbackRelianceSharePct)}
            />
            <UsageTile
              label="Research-heavy Share"
              value={formatPercent(snapshot.derivedMetrics.researchHeavyWorkloadSharePct)}
            />
            <UsageTile
              label="Sealed Cost Footprint"
              value={formatPercent(snapshot.derivedMetrics.sealedFactcheckCostFootprintPct)}
            />
            <UsageTile
              label="Budget-Projektion (Monat)"
              value={formatCurrency(snapshot.derivedMetrics.projectedMonthlyCostEur)}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 xl:col-span-2">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Operative Hinweise</h2>
              {effectiveInsights.length === 0 ? (
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine Hinweise verfügbar.</p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {effectiveInsights.map((insight) => (
                    <div key={insight.id} className="rounded-xl bg-[rgb(var(--bg))] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        {insight.title}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{insight.value}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{insight.hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Error Hotspots</h2>
              <ErrorKindList rows={snapshot.byErrorKind ?? []} />
            </section>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <SignalList
              title="Einsparungskandidaten"
              rows={optimization.savingsCandidates}
              emptyText="Keine Einsparungskandidaten aus dem aktuellen Filter ableitbar."
            />
            <SignalList
              title="Qualitätskandidaten"
              rows={optimization.qualityCandidates}
              emptyText="Keine Qualitätskandidaten aus dem aktuellen Filter ableitbar."
            />
            <SignalList
              title="Stabilitätskandidaten"
              rows={optimization.stabilityCandidates}
              emptyText="Keine Stabilitätskandidaten aus dem aktuellen Filter ableitbar."
            />
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Attention Needed</h2>
            {effectiveAttentionFlags.length === 0 ? (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Keine aktiven Warnflags im aktuellen Filter.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {effectiveAttentionFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`rounded-xl px-3 py-3 ${
                      flag.severity === "critical"
                        ? "border border-rose-300 bg-rose-50 text-rose-800"
                        : flag.severity === "warning"
                          ? "border border-amber-300 bg-amber-50 text-amber-800"
                          : "border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide">{flag.title}</p>
                    <p className="mt-1 text-sm font-semibold">{flag.value}</p>
                    <p className="mt-1 text-xs">Schwelle: {flag.threshold}</p>
                    <p className="mt-1 text-xs opacity-90">{flag.hint}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {hasData ? (
            <>
              <section className="grid gap-4 lg:grid-cols-2">
                <UsageTable title="Breakdown nach Provider" rows={snapshot.byProvider} />
                <UsageTable title="Breakdown nach Pipeline" rows={snapshot.byPipeline} />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <UsageTable title="Breakdown nach Lane" rows={snapshot.byLane} />
                <UsageTable title="Breakdown nach Journey" rows={snapshot.byJourney} />
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-6 text-sm text-[rgb(var(--muted))]">
              <p className="font-semibold text-[rgb(var(--fg))]">Keine AI-Usage im gewählten Filter</p>
              <p className="mt-1">
                Der Snapshot enthält aktuell keine Calls/Tokens/Kosten für die gesetzten Filter.
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Recent Events</h2>
            <RecentEventsTable rows={snapshot.recent ?? []} />
          </section>
        </>
      )}
    </main>
  );
}

function FilterSelect(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={props.id}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        {props.label}
      </span>
      <select
        id={props.id}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterInput(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={props.id}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        {props.label}
      </span>
      <input
        id={props.id}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
      />
    </label>
  );
}

function ThresholdInput(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={props.id}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        {props.label}
      </span>
      <input
        id={props.id}
        type="number"
        min={0}
        step="any"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
      />
    </label>
  );
}

function UsageTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function UsageTable({ title, rows }: { title: string; rows: AiUsageBreakdownRow[] }) {
  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
      <div className="border-b border-[rgb(var(--border))] px-4 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
          <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Calls</th>
              <th className="px-4 py-2">Tokens</th>
              <th className="px-4 py-2">Kosten</th>
              <th className="px-4 py-2">Cost/Call</th>
              <th className="px-4 py-2">Fehlerquote</th>
              <th className="px-4 py-2">Ø Latenz</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm text-[rgb(var(--muted))]" colSpan={7}>
                  Keine Zeilen im gewählten Filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-2 font-semibold text-[rgb(var(--fg))]">{row.label}</td>
                  <td className="px-4 py-2">{formatNumber(row.calls)}</td>
                  <td className="px-4 py-2">{formatNumber(row.tokens)}</td>
                  <td className="px-4 py-2">{formatCurrency(row.costEur)}</td>
                  <td className="px-4 py-2">
                    {typeof row.costPerCallEur === "number"
                      ? `${row.costPerCallEur.toFixed(4)} €/Call`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{formatPercent(rowErrorRate(row))}</td>
                  <td className="px-4 py-2">
                    {typeof row.avgDurationMs === "number"
                      ? `${formatNumber(row.avgDurationMs)} ms`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ErrorKindList({ rows }: { rows: AiUsageErrorKindRow[] }) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine Error-Kinds im Zeitraum.</p>;
  }
  return (
    <div className="mt-2 space-y-2">
      {rows.slice(0, 6).map((row) => (
        <div key={row.key} className="rounded-xl bg-[rgb(var(--bg))] px-3 py-2 text-sm">
          <p className="font-semibold text-[rgb(var(--fg))]">{row.label}</p>
          <p className="text-xs text-[rgb(var(--muted))]">
            {formatNumber(row.calls)} Events · {formatPercent(row.ratePct)}
          </p>
        </div>
      ))}
    </div>
  );
}

function SignalList(props: {
  title: string;
  rows: AiUsageInsight[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{props.title}</h2>
      {props.rows.length === 0 ? (
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{props.emptyText}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {props.rows.map((row) => (
            <div key={row.id} className="rounded-xl bg-[rgb(var(--bg))] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {row.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{row.value}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{row.hint}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentEventsTable({ rows }: { rows: AiUsageBreakdownSnapshot["recent"] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
        <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          <tr>
            <th className="px-3 py-2">Zeit</th>
            <th className="px-3 py-2">Provider</th>
            <th className="px-3 py-2">Pipeline</th>
            <th className="px-3 py-2">Korrelation</th>
            <th className="px-3 py-2">Tokens</th>
            <th className="px-3 py-2">Kosten</th>
            <th className="px-3 py-2">Latenz</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgb(var(--border))]">
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-sm text-[rgb(var(--muted))]" colSpan={8}>
                Keine Recent Events im Filter.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={`${row.timestamp}-${row.provider}-${row.pipeline}`}>
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(row.timestamp).toLocaleString("de-DE")}
                </td>
                <td className="px-3 py-2">{row.provider}</td>
                <td className="px-3 py-2">{row.pipeline}</td>
                <td className="px-3 py-2 text-xs text-[rgb(var(--muted))]">
                  <div>{row.operationType ?? "ohne operation_type"}</div>
                  <div>{row.runId ?? row.jobId ?? row.operationId ?? row.requestId ?? "ohne run/job/op"}</div>
                  <div>{row.dossierId ?? row.organizationId ?? row.userId ?? "ohne Dossier-/Scope-Kontext"}</div>
                </td>
                <td className="px-3 py-2">{formatNumber(row.tokens)}</td>
                <td className="px-3 py-2">{formatCurrency(row.costEur)}</td>
                <td className="px-3 py-2">{formatNumber(row.durationMs)} ms</td>
                <td className="px-3 py-2">
                  {row.success ? (
                    <span className="text-emerald-600">OK</span>
                  ) : (
                    <span className="text-rose-600">{row.errorKind ?? "Fehler"}</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
