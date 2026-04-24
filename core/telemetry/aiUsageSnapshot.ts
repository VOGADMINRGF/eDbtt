// core/telemetry/aiUsageSnapshot.ts
import { coreCol } from "../db/triMongo";
import type {
  AiPipelineName,
  AiProviderName,
  AiUsageDailyRow,
  AiUsageEvent,
  AiErrorKind,
} from "./aiUsageTypes";

export type UsageTileTone = "token" | "cost" | "warning" | "default";

export interface UsageTile {
  id: string;
  label: string;
  value: string;
  hint?: string;
  trendPct?: number;
  tone?: UsageTileTone;
}

export interface UsageEventSummary {
  timestamp: string;
  provider: AiProviderName;
  pipeline: AiPipelineName;
  model?: string | null;
  region?: string | null;
  tokens: number;
  tokensInput?: number;
  tokensOutput?: number;
  costEur: number;
  durationMs: number;
  success: boolean;
  errorKind?: AiErrorKind | null;
  strictJson?: boolean;
  promptSnippet?: string;
  responseSnippet?: string;
  rawError?: string;
}

export interface UsageSnapshotFilters {
  rangeDays: number;
  provider?: AiProviderName;
  pipeline?: AiPipelineName;
  region?: string | null;
}

export interface UsageSnapshot {
  tiles: UsageTile[];
  recent: UsageEventSummary[];
  updatedAt: string;
  filters: UsageSnapshotFilters;
}

export interface UsageSnapshotOptions {
  rangeDays?: number;
  provider?: AiProviderName | "all";
  pipeline?: AiPipelineName | "all";
  region?: string | null;
}

export interface AiUsageBreakdownRow {
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
}

export type AiUsageLane = "standard" | "sealed_factcheck" | "other";
export type AiUsageJourney = "analyze" | "media" | "guided" | "factcheck" | "other";

export interface AiUsageErrorKindRow {
  key: AiErrorKind | "none";
  label: string;
  calls: number;
  ratePct: number;
}

export interface AiUsagePerformanceSummary {
  avgDurationMs: number;
  successRatePct: number;
  errorRatePct: number;
  costPerCallEur: number;
}

export interface AiUsageInsight {
  id: string;
  title: string;
  value: string;
  hint: string;
}

export interface AiUsageThresholds {
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
}

export interface AiUsageDerivedMetrics {
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
}

export interface AiUsageAttentionFlag {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  value: string;
  threshold: string;
  hint: string;
}

export interface AiUsageOptimizationSignals {
  savingsCandidates: AiUsageInsight[];
  qualityCandidates: AiUsageInsight[];
  stabilityCandidates: AiUsageInsight[];
}

export interface AiUsageBreakdownSnapshot {
  fromDate: string;
  toDate: string;
  filters: UsageSnapshotFilters;
  totals: {
    tokens: number;
    costEur: number;
    calls: number;
    errors: number;
  };
  performance: AiUsagePerformanceSummary;
  byProvider: AiUsageBreakdownRow[];
  byPipeline: AiUsageBreakdownRow[];
  byLane: AiUsageBreakdownRow[];
  byJourney: AiUsageBreakdownRow[];
  byErrorKind: AiUsageErrorKindRow[];
  recent: UsageEventSummary[];
  insights: AiUsageInsight[];
  thresholds: AiUsageThresholds;
  derivedMetrics: AiUsageDerivedMetrics;
  attentionFlags: AiUsageAttentionFlag[];
  optimization: AiUsageOptimizationSignals;
}

const COLLECTION_USAGE = "ai_usage";
const COLLECTION_DAILY = "ai_usage_daily";
const MONTHLY_BUDGET_EUR = 150;
const DAY_MS = 86_400_000;

const DEFAULT_USAGE_THRESHOLDS: AiUsageThresholds = {
  budgetMonthlyEur: MONTHLY_BUDGET_EUR,
  projectedBudgetWarnPct: 85,
  errorRateWarnPct: 8,
  avgDurationWarnMs: 12_000,
  costPerCallWarnEur: 0.05,
  fallbackRelianceWarnSharePct: 40,
  researchHeavyWarnSharePct: 35,
  sealedCostFootprintWarnSharePct: 45,
  timeoutWarnSharePct: 5,
  badJsonWarnSharePct: 3,
};

export const PROVIDERS: AiProviderName[] = [
  "openai",
  "anthropic",
  "mistral",
  "gemini",
  "ari",
  "youcom",
];

export const PROVIDER_LABELS: Record<AiProviderName, string> = {
  openai: "GPT‑4 / OpenAI",
  anthropic: "Claude / Anthropic",
  mistral: "Mistral",
  gemini: "Gemini",
  ari: "ARI",
  youcom: "ARI / You.com",
};

export const PIPELINE_LABELS: Record<AiPipelineName, string> = {
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

export const PIPELINES = Object.keys(PIPELINE_LABELS) as AiPipelineName[];

export const LANE_LABELS: Record<AiUsageLane, string> = {
  standard: "Standard-Lane",
  sealed_factcheck: "Sealed Factcheck-Lane",
  other: "Weitere Lane",
};

export const JOURNEY_LABELS: Record<AiUsageJourney, string> = {
  analyze: "Analyze",
  media: "Media",
  guided: "Guided",
  factcheck: "Factcheck",
  other: "Weitere Journeys",
};

const ERROR_KIND_LABELS: Record<AiErrorKind | "none", string> = {
  MODEL_NOT_FOUND: "Model not found",
  INVALID_API_KEY: "Invalid API key",
  UNAUTHORIZED: "Unauthorized",
  BAD_JSON: "Bad JSON",
  TIMEOUT: "Timeout",
  RATE_LIMIT: "Rate limit",
  INTERNAL: "Internal",
  CANCELLED: "Cancelled",
  UNKNOWN: "Unknown",
  none: "Ohne Fehler",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(Math.round(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function getUsageSnapshot(
  options: UsageSnapshotOptions = {},
): Promise<UsageSnapshot> {
  const rangeDays = Math.max(1, options.rangeDays ?? 1);
  const providerFilter =
    options.provider && options.provider !== "all" ? options.provider : undefined;
  const pipelineFilter =
    options.pipeline && options.pipeline !== "all" ? options.pipeline : undefined;
  const regionFilter =
    typeof options.region === "string" && options.region.trim()
      ? options.region.trim()
      : undefined;

  const today = new Date();
  const endIso = today.toISOString().slice(0, 10);
  const startDate = new Date(today.getTime() - (rangeDays - 1) * DAY_MS);
  const startIso = startDate.toISOString().slice(0, 10);
  const previousStart = new Date(startDate.getTime() - rangeDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
  const previousEnd = new Date(startDate.getTime() - DAY_MS)
    .toISOString()
    .slice(0, 10);

  const dailyCol = await coreCol<AiUsageDailyRow>(COLLECTION_DAILY);
  const usageCol = await coreCol<AiUsageEvent>(COLLECTION_USAGE);

  const dateFilter = { $gte: startIso, $lte: endIso };
  const previousDateFilter = { $gte: previousStart, $lte: previousEnd };

  const query: Record<string, any> = { date: dateFilter };
  const previousQuery: Record<string, any> = { date: previousDateFilter };
  if (providerFilter) {
    query.provider = providerFilter;
    previousQuery.provider = providerFilter;
  }
  if (pipelineFilter) {
    query.pipeline = pipelineFilter;
    previousQuery.pipeline = pipelineFilter;
  }
  if (regionFilter) {
    query.region = regionFilter;
    previousQuery.region = regionFilter;
  }

  const [rangeRows, comparisonRows] = await Promise.all([
    dailyCol.find(query).toArray(),
    dailyCol.find(previousQuery).toArray(),
  ]);

  const tokensTotal = sumRows(rangeRows, (r) => r.tokensTotal);
  const costTotal = sumRows(rangeRows, (r) => r.costTotalEur);
  const regionTop = pickTopRegion(rangeRows);
  const totalTrend = computeTrend(
    tokensTotal,
    sumRows(comparisonRows, (r) => r.tokensTotal),
  );

  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthSpending = await usageCol
    .aggregate<{ total: number }>([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$costEur" } } },
    ])
    .toArray()
    .then((rows) => rows[0]?.total ?? 0);

  const budgetPct = Math.min(1, monthSpending / MONTHLY_BUDGET_EUR);

  const tiles: UsageTile[] = [];

  PROVIDERS.forEach((provider) => {
    const providerTokens = sumRows(
      rangeRows.filter((row) => row.provider === provider),
      (row) => row.tokensTotal,
    );
    tiles.push({
      id: `provider-${provider}`,
      label: `Tokens – ${PROVIDER_LABELS[provider]}`,
      value: formatNumber(providerTokens),
      hint: "Zeitraum laut Filter",
      tone: "token",
      trendPct: provider === providerFilter ? totalTrend : undefined,
    });
  });

  const pipelineSummaries = Object.entries(PIPELINE_LABELS).map(
    ([pipeline, label]) => {
      const value = sumRows(
        rangeRows.filter((row) => row.pipeline === pipeline),
        (row) => row.tokensTotal,
      );
      return { pipeline: pipeline as AiPipelineName, label, value };
    },
  );

  tiles.push({
    id: "tokens-total",
    label: "Tokens – alle Dienste",
    value: formatNumber(tokensTotal),
    hint: "Summe aller Provider",
  });

  tiles.push({
    id: "pipeline-feeds",
    label: "Tokens – Feeds/Batch",
    value: formatNumber(
      pipelineSummaries.find((p) => p.pipeline === "feeds_analyze")?.value ?? 0,
    ),
    hint: "Feeds → StatementCandidates",
  });

  tiles.push({
    id: "pipeline-factcheck",
    label: "Tokens – Factcheck",
    value: formatNumber(
      pipelineSummaries.find((p) => p.pipeline === "factcheck")?.value ?? 0,
    ),
    hint: "Verifizierungsprozesse",
  });

  tiles.push({
    id: "region-top",
    label: "Region mit höchstem Verbrauch",
    value: regionTop?.region ?? "–",
    hint: regionTop
      ? `${regionTop.calls} Beiträge im Zeitraum`
      : "Noch keine Events",
    tone: "warning",
  });

  tiles.push({
    id: "budget",
    label: "Budgetwarnung",
    value: `${Math.round(budgetPct * 100)} % erreicht`,
    hint: `${formatCurrency(monthSpending)} von ${formatCurrency(MONTHLY_BUDGET_EUR)} im Monat`,
    tone: "cost",
  });

  const recentQuery: Record<string, any> = {
    createdAt: { $gte: startOfDay(startDate) },
  };
  if (providerFilter) recentQuery.provider = providerFilter;
  if (pipelineFilter) recentQuery.pipeline = pipelineFilter;
  if (regionFilter) recentQuery.region = regionFilter;

  const recentEvents = await usageCol
    .find(recentQuery, { sort: { createdAt: -1 }, limit: 12 })
    .project({
      createdAt: 1,
      provider: 1,
      pipeline: 1,
      region: 1,
      model: 1,
      tokensInput: 1,
      tokensOutput: 1,
      costEur: 1,
      durationMs: 1,
      success: 1,
      errorKind: 1,
      strictJson: 1,
      promptSnippet: 1,
      responseSnippet: 1,
      rawError: 1,
    })
    .toArray();

  const recent: UsageEventSummary[] = recentEvents.map((event) => ({
    timestamp: event.createdAt.toISOString(),
    provider: event.provider,
    pipeline: event.pipeline,
    model: (event as any).model ?? null,
    region: event.region ?? null,
    tokens: (event.tokensInput ?? 0) + (event.tokensOutput ?? 0),
    tokensInput: (event as any).tokensInput ?? 0,
    tokensOutput: (event as any).tokensOutput ?? 0,
    costEur: event.costEur ?? 0,
    durationMs: event.durationMs ?? 0,
    success: event.success,
    errorKind: (event as any).errorKind ?? null,
    strictJson: (event as any).strictJson ?? false,
    promptSnippet: (event as any).promptSnippet,
    responseSnippet: (event as any).responseSnippet,
    rawError: (event as any).rawError,
  }));

  return {
    tiles,
    recent,
    updatedAt: new Date().toISOString(),
    filters: {
      rangeDays,
      provider: providerFilter,
      pipeline: pipelineFilter,
      region: regionFilter ?? null,
    },
  };
}

function sumRows<T>(
  rows: T[],
  getter: (row: T) => number | undefined,
): number {
  return rows.reduce((sum, row) => sum + (getter(row) ?? 0), 0);
}

function computeTrend(current: number, previous: number): number {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function pickTopRegion(rows: AiUsageDailyRow[]) {
  const map = new Map<string, { region: string; calls: number }>();
  rows.forEach((row) => {
    if (!row.region) return;
    const entry = map.get(row.region) ?? { region: row.region, calls: 0 };
    entry.calls += row.callsTotal;
    map.set(row.region, entry);
  });
  return [...map.values()].sort((a, b) => b.calls - a.calls)[0];
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toRate(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function toUsageEventSummary(event: any): UsageEventSummary {
  return {
    timestamp: event.createdAt.toISOString(),
    provider: event.provider,
    pipeline: event.pipeline,
    model: event.model ?? null,
    region: event.region ?? null,
    tokens: (event.tokensInput ?? 0) + (event.tokensOutput ?? 0),
    tokensInput: event.tokensInput ?? 0,
    tokensOutput: event.tokensOutput ?? 0,
    costEur: event.costEur ?? 0,
    durationMs: event.durationMs ?? 0,
    success: Boolean(event.success),
    errorKind: event.errorKind ?? null,
    strictJson: event.strictJson ?? false,
    promptSnippet: event.promptSnippet,
    responseSnippet: event.responseSnippet,
    rawError: event.rawError,
  };
}

export function mapPipelineToLane(pipeline: AiPipelineName): AiUsageLane {
  if (pipeline === "factcheck" || pipeline === "news_factcheck") {
    return "sealed_factcheck";
  }
  if (pipeline === "other") return "other";
  return "standard";
}

export function mapPipelineToJourney(pipeline: AiPipelineName): AiUsageJourney {
  if (pipeline === "factcheck" || pipeline === "news_factcheck") return "factcheck";
  if (pipeline === "report_summarize") return "media";
  if (pipeline === "admin_orchestrate") return "guided";
  if (pipeline === "contribution_analyze") return "analyze";
  return "other";
}

function aggregateRows<TKey extends string>(
  rows: AiUsageDailyRow[],
  keyResolver: (row: AiUsageDailyRow) => TKey,
  labelResolver: (key: TKey) => string,
): AiUsageBreakdownRow[] {
  const map = new Map<TKey, AiUsageBreakdownRow>();
  rows.forEach((row) => {
    const key = keyResolver(row);
    const previous = map.get(key) ?? {
      key,
      label: labelResolver(key),
      tokens: 0,
      costEur: 0,
      calls: 0,
      errors: 0,
    };
    previous.tokens += row.tokensTotal ?? 0;
    previous.costEur += row.costTotalEur ?? 0;
    previous.calls += row.callsTotal ?? 0;
    previous.errors += row.callsError ?? 0;
    map.set(key, previous);
  });
  return [...map.values()].map((row) => ({
    ...row,
    errorRatePct: toRate(row.errors, row.calls),
    successRatePct: toRate(row.calls - row.errors, row.calls),
    costPerCallEur: row.calls > 0 ? row.costEur / row.calls : 0,
  }));
}

function aggregateAverageDuration<TKey extends string>(
  rows: UsageEventSummary[],
  keyResolver: (event: UsageEventSummary) => TKey,
): Map<TKey, number> {
  const sums = new Map<TKey, { total: number; calls: number }>();
  rows.forEach((event) => {
    const key = keyResolver(event);
    const previous = sums.get(key) ?? { total: 0, calls: 0 };
    previous.total += event.durationMs ?? 0;
    previous.calls += 1;
    sums.set(key, previous);
  });
  const out = new Map<TKey, number>();
  sums.forEach((value, key) => {
    out.set(key, value.calls > 0 ? Math.round(value.total / value.calls) : 0);
  });
  return out;
}

function aggregateErrorKinds(events: UsageEventSummary[]): AiUsageErrorKindRow[] {
  const total = events.length;
  const counters = new Map<AiErrorKind | "none", number>();
  events.forEach((event) => {
    const key = event.success ? "none" : event.errorKind ?? "UNKNOWN";
    counters.set(key, (counters.get(key) ?? 0) + 1);
  });
  return [...counters.entries()]
    .map(([key, calls]) => ({
      key,
      label: ERROR_KIND_LABELS[key],
      calls,
      ratePct: toRate(calls, total),
    }))
    .sort((a, b) => b.calls - a.calls);
}

function sortBreakdownRows(rows: AiUsageBreakdownRow[]): AiUsageBreakdownRow[] {
  return [...rows].sort((a, b) => {
    if (b.costEur !== a.costEur) return b.costEur - a.costEur;
    if (b.calls !== a.calls) return b.calls - a.calls;
    return b.tokens - a.tokens;
  });
}

type DeriveAiUsageInsightsArgs = {
  byProvider: AiUsageBreakdownRow[];
  byPipeline: AiUsageBreakdownRow[];
  performance: AiUsagePerformanceSummary;
  byErrorKind: AiUsageErrorKindRow[];
};

type DeriveAiUsageOperationalSignalsArgs = {
  rangeDays: number;
  totals: {
    tokens: number;
    costEur: number;
    calls: number;
    errors: number;
  };
  performance: AiUsagePerformanceSummary;
  byProvider: AiUsageBreakdownRow[];
  byPipeline: AiUsageBreakdownRow[];
  byLane: AiUsageBreakdownRow[];
  byErrorKind: AiUsageErrorKindRow[];
  rows: AiUsageDailyRow[];
  thresholds?: Partial<AiUsageThresholds> | null;
};

function formatEur(value: number): string {
  return `${value.toFixed(4)} €/Call`;
}

function formatPercentValue(value: number): string {
  return `${value.toFixed(1)}%`;
}

function thresholdPercent(value: number): string {
  return `>${value.toFixed(1)}%`;
}

function thresholdEur(value: number): string {
  return `>${value.toFixed(4)} €/Call`;
}

function asFinitePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function resolveUsageThresholds(
  overrides?: Partial<AiUsageThresholds> | null,
): AiUsageThresholds {
  const input = overrides ?? {};
  return {
    budgetMonthlyEur:
      asFinitePositiveNumber(input.budgetMonthlyEur) ??
      DEFAULT_USAGE_THRESHOLDS.budgetMonthlyEur,
    projectedBudgetWarnPct:
      asFinitePositiveNumber(input.projectedBudgetWarnPct) ??
      DEFAULT_USAGE_THRESHOLDS.projectedBudgetWarnPct,
    errorRateWarnPct:
      asFinitePositiveNumber(input.errorRateWarnPct) ??
      DEFAULT_USAGE_THRESHOLDS.errorRateWarnPct,
    avgDurationWarnMs:
      asFinitePositiveNumber(input.avgDurationWarnMs) ??
      DEFAULT_USAGE_THRESHOLDS.avgDurationWarnMs,
    costPerCallWarnEur:
      asFinitePositiveNumber(input.costPerCallWarnEur) ??
      DEFAULT_USAGE_THRESHOLDS.costPerCallWarnEur,
    fallbackRelianceWarnSharePct:
      asFinitePositiveNumber(input.fallbackRelianceWarnSharePct) ??
      DEFAULT_USAGE_THRESHOLDS.fallbackRelianceWarnSharePct,
    researchHeavyWarnSharePct:
      asFinitePositiveNumber(input.researchHeavyWarnSharePct) ??
      DEFAULT_USAGE_THRESHOLDS.researchHeavyWarnSharePct,
    sealedCostFootprintWarnSharePct:
      asFinitePositiveNumber(input.sealedCostFootprintWarnSharePct) ??
      DEFAULT_USAGE_THRESHOLDS.sealedCostFootprintWarnSharePct,
    timeoutWarnSharePct:
      asFinitePositiveNumber(input.timeoutWarnSharePct) ??
      DEFAULT_USAGE_THRESHOLDS.timeoutWarnSharePct,
    badJsonWarnSharePct:
      asFinitePositiveNumber(input.badJsonWarnSharePct) ??
      DEFAULT_USAGE_THRESHOLDS.badJsonWarnSharePct,
  };
}

function bestBy<T>(items: T[], scorer: (item: T) => number): T | null {
  let best: T | null = null;
  let bestScore = -Infinity;
  items.forEach((item) => {
    const score = scorer(item);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  });
  return best;
}

export function deriveAiUsageInsights(args: DeriveAiUsageInsightsArgs): AiUsageInsight[] {
  const providerRows = args.byProvider.filter((row) => row.calls > 0);
  const pipelineRows = args.byPipeline.filter((row) => row.calls > 0);
  if (providerRows.length === 0 && pipelineRows.length === 0) {
    return [
      {
        id: "empty",
        title: "Noch keine belastbaren Usage-Daten",
        value: "0 Events",
        hint: "Sobald AI-Calls geloggt sind, erscheinen Kosten-/Fehler-/Latenz-Hinweise hier.",
      },
    ];
  }

  const highestCostProvider = bestBy(providerRows, (row) => row.costEur);
  const mostErrorProneProvider = bestBy(
    providerRows.filter((row) => row.calls >= 3),
    (row) => row.errorRatePct ?? 0,
  );
  const slowestPipeline = bestBy(pipelineRows, (row) => row.avgDurationMs ?? 0);
  const highCostPerCall = bestBy(
    providerRows.filter((row) => row.calls >= 3),
    (row) => row.costPerCallEur ?? 0,
  );
  const timeoutHotspot = args.byErrorKind.find((row) => row.key === "TIMEOUT");
  const badJsonHotspot = args.byErrorKind.find((row) => row.key === "BAD_JSON");

  const insights: AiUsageInsight[] = [];

  if (highestCostProvider) {
    insights.push({
      id: "highest_cost_provider",
      title: "Teuerster Provider im Zeitraum",
      value: highestCostProvider.label,
      hint: `${formatCurrency(highestCostProvider.costEur)} bei ${formatNumber(highestCostProvider.calls)} Calls`,
    });
  }

  if (mostErrorProneProvider) {
    insights.push({
      id: "most_error_prone_provider",
      title: "Fehleranfälligster Provider",
      value: `${mostErrorProneProvider.label} (${(mostErrorProneProvider.errorRatePct ?? 0).toFixed(1)}%)`,
      hint: `${mostErrorProneProvider.errors} Fehler bei ${mostErrorProneProvider.calls} Calls`,
    });
  }

  if (slowestPipeline) {
    insights.push({
      id: "slowest_pipeline",
      title: "Langsamste Pipeline",
      value: slowestPipeline.label,
      hint: `${formatNumber(slowestPipeline.avgDurationMs ?? 0)} ms Ø Latenz`,
    });
  }

  if (highCostPerCall) {
    insights.push({
      id: "high_cost_per_call",
      title: "High Cost-per-Call Kandidat",
      value: `${highCostPerCall.label} (${formatEur(highCostPerCall.costPerCallEur ?? 0)})`,
      hint: "Candidate für Prompt-/Routing-Optimierung",
    });
  }

  if (timeoutHotspot && timeoutHotspot.calls > 0) {
    insights.push({
      id: "timeout_hotspot",
      title: "Timeout-Hotspot",
      value: `${timeoutHotspot.calls} Timeout-Events`,
      hint: `${timeoutHotspot.ratePct.toFixed(1)}% aller Events im Filter`,
    });
  }

  if (badJsonHotspot && badJsonHotspot.calls > 0) {
    insights.push({
      id: "bad_json_hotspot",
      title: "BAD_JSON-Hotspot",
      value: `${badJsonHotspot.calls} BAD_JSON-Events`,
      hint: `${badJsonHotspot.ratePct.toFixed(1)}% aller Events im Filter`,
    });
  }

  insights.push({
    id: "overall_success_rate",
    title: "Gesamte Erfolgsquote",
    value: `${args.performance.successRatePct.toFixed(1)}%`,
    hint: `Ø Latenz ${formatNumber(args.performance.avgDurationMs)} ms`,
  });

  return insights;
}

export function deriveAiUsageOperationalSignals(
  args: DeriveAiUsageOperationalSignalsArgs,
): {
  thresholds: AiUsageThresholds;
  derivedMetrics: AiUsageDerivedMetrics;
  attentionFlags: AiUsageAttentionFlag[];
  optimization: AiUsageOptimizationSignals;
} {
  const thresholds = resolveUsageThresholds(args.thresholds);
  const timeoutRow = args.byErrorKind.find((row) => row.key === "TIMEOUT");
  const badJsonRow = args.byErrorKind.find((row) => row.key === "BAD_JSON");
  const sealedLane = args.byLane.find((row) => row.key === "sealed_factcheck");

  const nonProbeCalls = sumRows(
    args.rows.filter((row) => row.pipeline !== "provider_probe"),
    (row) => row.callsTotal,
  );
  const openAiNonProbeCalls = sumRows(
    args.rows.filter(
      (row) => row.provider === "openai" && row.pipeline !== "provider_probe",
    ),
    (row) => row.callsTotal,
  );

  const projectedMonthlyCostEur =
    args.rangeDays > 0 ? (args.totals.costEur / args.rangeDays) * 30 : 0;
  const projectedBudgetUtilizationPct =
    thresholds.budgetMonthlyEur > 0
      ? (projectedMonthlyCostEur / thresholds.budgetMonthlyEur) * 100
      : 0;

  const derivedMetrics: AiUsageDerivedMetrics = {
    costPerCallEur: args.performance.costPerCallEur ?? 0,
    avgDurationMs: args.performance.avgDurationMs ?? 0,
    errorRatePct: args.performance.errorRatePct ?? 0,
    timeoutSharePct: timeoutRow?.ratePct ?? 0,
    badJsonSharePct: badJsonRow?.ratePct ?? 0,
    researchHeavyWorkloadSharePct: toRate(sealedLane?.calls ?? 0, args.totals.calls),
    fallbackRelianceSharePct: toRate(openAiNonProbeCalls, nonProbeCalls),
    sealedFactcheckCostFootprintPct: toRate(
      sealedLane?.costEur ?? 0,
      args.totals.costEur,
    ),
    projectedMonthlyCostEur,
    projectedBudgetUtilizationPct,
  };

  const attentionFlags: AiUsageAttentionFlag[] = [];

  if (derivedMetrics.projectedBudgetUtilizationPct >= thresholds.projectedBudgetWarnPct) {
    attentionFlags.push({
      id: "budget_projection",
      title: "Budget-Projektion",
      severity:
        derivedMetrics.projectedBudgetUtilizationPct >= 100 ? "critical" : "warning",
      value: `${formatCurrency(derivedMetrics.projectedMonthlyCostEur)} / Monat`,
      threshold: thresholdPercent(thresholds.projectedBudgetWarnPct),
      hint: `Projektion aus ${args.rangeDays} Tagen auf Monatsbasis.`,
    });
  }
  if (derivedMetrics.errorRatePct >= thresholds.errorRateWarnPct) {
    attentionFlags.push({
      id: "error_rate",
      title: "Fehlerquote erhöht",
      severity: "warning",
      value: formatPercentValue(derivedMetrics.errorRatePct),
      threshold: thresholdPercent(thresholds.errorRateWarnPct),
      hint: "Top-Error-Kinds und betroffene Provider prüfen.",
    });
  }
  if (derivedMetrics.avgDurationMs >= thresholds.avgDurationWarnMs) {
    attentionFlags.push({
      id: "latency",
      title: "Latenz erhöht",
      severity: "warning",
      value: `${formatNumber(derivedMetrics.avgDurationMs)} ms`,
      threshold: `>${formatNumber(thresholds.avgDurationWarnMs)} ms`,
      hint: "Langsame Pipelines und Timeout-Quellen priorisieren.",
    });
  }
  if (derivedMetrics.costPerCallEur >= thresholds.costPerCallWarnEur) {
    attentionFlags.push({
      id: "cost_per_call",
      title: "Kosten pro Call erhöht",
      severity: "warning",
      value: formatEur(derivedMetrics.costPerCallEur),
      threshold: thresholdEur(thresholds.costPerCallWarnEur),
      hint: "Promptgröße, Modellmix und Fallback-Strategie prüfen.",
    });
  }
  if (
    derivedMetrics.fallbackRelianceSharePct >=
    thresholds.fallbackRelianceWarnSharePct
  ) {
    attentionFlags.push({
      id: "fallback_reliance",
      title: "Fallback-Reliance (OpenAI-Proxy) hoch",
      severity: "warning",
      value: formatPercentValue(derivedMetrics.fallbackRelianceSharePct),
      threshold: thresholdPercent(thresholds.fallbackRelianceWarnSharePct),
      hint: "Proxy auf Basis OpenAI-Anteil außerhalb Provider-Probe.",
    });
  }
  if (
    derivedMetrics.researchHeavyWorkloadSharePct >=
    thresholds.researchHeavyWarnSharePct
  ) {
    attentionFlags.push({
      id: "research_share",
      title: "Research-heavy Workload hoch",
      severity: "info",
      value: formatPercentValue(derivedMetrics.researchHeavyWorkloadSharePct),
      threshold: thresholdPercent(thresholds.researchHeavyWarnSharePct),
      hint: "Anteil sealed Factcheck an allen Calls.",
    });
  }
  if (
    derivedMetrics.sealedFactcheckCostFootprintPct >=
    thresholds.sealedCostFootprintWarnSharePct
  ) {
    attentionFlags.push({
      id: "sealed_cost_footprint",
      title: "Sealed-Factcheck Kostenanteil hoch",
      severity: "info",
      value: formatPercentValue(derivedMetrics.sealedFactcheckCostFootprintPct),
      threshold: thresholdPercent(thresholds.sealedCostFootprintWarnSharePct),
      hint: "Kostenanteil der sealed_factcheck-Lane im Filter.",
    });
  }
  if (derivedMetrics.timeoutSharePct >= thresholds.timeoutWarnSharePct) {
    attentionFlags.push({
      id: "timeout_hotspot",
      title: "Timeout-Hotspot",
      severity: "warning",
      value: formatPercentValue(derivedMetrics.timeoutSharePct),
      threshold: thresholdPercent(thresholds.timeoutWarnSharePct),
      hint: "Timeout-Häufigkeit über alle Event-Fehler.",
    });
  }
  if (derivedMetrics.badJsonSharePct >= thresholds.badJsonWarnSharePct) {
    attentionFlags.push({
      id: "bad_json_hotspot",
      title: "BAD_JSON-Hotspot",
      severity: "warning",
      value: formatPercentValue(derivedMetrics.badJsonSharePct),
      threshold: thresholdPercent(thresholds.badJsonWarnSharePct),
      hint: "Schema-/Prompt-Härtung für betroffene Provider prüfen.",
    });
  }

  const providerRows = args.byProvider.filter((row) => row.calls > 0);
  const pipelineRows = args.byPipeline.filter((row) => row.calls > 0);
  const mostExpensiveProvider = bestBy(providerRows, (row) => row.costEur);
  const highCostPerCallProvider = bestBy(
    providerRows.filter((row) => row.calls >= 3),
    (row) => row.costPerCallEur ?? 0,
  );
  const mostErrorProneProvider = bestBy(
    providerRows.filter((row) => row.calls >= 3),
    (row) => row.errorRatePct ?? 0,
  );
  const slowestPipeline = bestBy(pipelineRows, (row) => row.avgDurationMs ?? 0);

  const savingsCandidates: AiUsageInsight[] = [];
  if (mostExpensiveProvider) {
    savingsCandidates.push({
      id: "candidate_savings_expensive_provider",
      title: "Einsparungskandidat: teuerster Provider",
      value: mostExpensiveProvider.label,
      hint: `${formatCurrency(mostExpensiveProvider.costEur)} im Zeitraum`,
    });
  }
  if (highCostPerCallProvider) {
    savingsCandidates.push({
      id: "candidate_savings_cost_per_call",
      title: "Einsparungskandidat: hoher Cost/Call",
      value: `${highCostPerCallProvider.label} (${formatEur(
        highCostPerCallProvider.costPerCallEur ?? 0,
      )})`,
      hint: "Promptumfang, Modellwahl und Batchability prüfen.",
    });
  }
  if ((sealedLane?.costEur ?? 0) > 0) {
    savingsCandidates.push({
      id: "candidate_savings_sealed_lane",
      title: "Einsparungskandidat: sealed Factcheck Footprint",
      value: `${formatPercentValue(derivedMetrics.sealedFactcheckCostFootprintPct)} Kostenanteil`,
      hint: `${formatCurrency(sealedLane?.costEur ?? 0)} in sealed_factcheck`,
    });
  }

  const qualityCandidates: AiUsageInsight[] = [];
  if (mostErrorProneProvider) {
    qualityCandidates.push({
      id: "candidate_quality_error_provider",
      title: "Qualitätskandidat: fehleranfälliger Provider",
      value: `${mostErrorProneProvider.label} (${formatPercentValue(
        mostErrorProneProvider.errorRatePct ?? 0,
      )})`,
      hint: `${mostErrorProneProvider.errors} Fehler bei ${mostErrorProneProvider.calls} Calls`,
    });
  }
  if ((badJsonRow?.calls ?? 0) > 0) {
    qualityCandidates.push({
      id: "candidate_quality_bad_json",
      title: "Qualitätskandidat: BAD_JSON",
      value: `${badJsonRow?.calls ?? 0} Events`,
      hint: "Response-Format und Schema-Guards nachschärfen.",
    });
  }

  const stabilityCandidates: AiUsageInsight[] = [];
  if (slowestPipeline) {
    stabilityCandidates.push({
      id: "candidate_stability_slowest_pipeline",
      title: "Stabilitätskandidat: langsame Pipeline",
      value: slowestPipeline.label,
      hint: `${formatNumber(slowestPipeline.avgDurationMs ?? 0)} ms Ø`,
    });
  }
  if ((timeoutRow?.calls ?? 0) > 0) {
    stabilityCandidates.push({
      id: "candidate_stability_timeout",
      title: "Stabilitätskandidat: Timeout-Cluster",
      value: `${timeoutRow?.calls ?? 0} Timeout-Events`,
      hint: `${formatPercentValue(timeoutRow?.ratePct ?? 0)} Anteil`,
    });
  }
  if (derivedMetrics.fallbackRelianceSharePct > 0) {
    stabilityCandidates.push({
      id: "candidate_stability_fallback_reliance",
      title: "Stabilitätskandidat: Fallback-Reliance",
      value: `${formatPercentValue(derivedMetrics.fallbackRelianceSharePct)} OpenAI-Proxy`,
      hint: "Hoher Fallback-Anteil kann auf Instabilität der Primärprovider hindeuten.",
    });
  }

  return {
    thresholds,
    derivedMetrics,
    attentionFlags,
    optimization: {
      savingsCandidates,
      qualityCandidates,
      stabilityCandidates,
    },
  };
}

export async function getAiUsageSnapshot(
  rangeDays = 30,
  region?: string | null,
  provider?: AiProviderName | null,
  pipeline?: AiPipelineName | null,
  thresholds?: Partial<AiUsageThresholds> | null,
): Promise<AiUsageBreakdownSnapshot> {
  const today = new Date();
  const toDateIso = today.toISOString().slice(0, 10);
  const fromDate = new Date(today.getTime() - (Math.max(1, rangeDays) - 1) * DAY_MS);
  const fromDateIso = fromDate.toISOString().slice(0, 10);

  const dailyCol = await coreCol<AiUsageDailyRow>(COLLECTION_DAILY);
  const usageCol = await coreCol<AiUsageEvent>(COLLECTION_USAGE);
  const match: Record<string, any> = { date: { $gte: fromDateIso, $lte: toDateIso } };
  if (typeof region === "string" && region.trim()) {
    match.region = region.trim();
  }
  if (provider) {
    match.provider = provider;
  }
  if (pipeline) {
    match.pipeline = pipeline;
  }

  const rows = await dailyCol.find(match).toArray();

  const totals = {
    tokens: sumRows(rows, (row) => row.tokensTotal),
    costEur: sumRows(rows, (row) => row.costTotalEur),
    calls: sumRows(rows, (row) => row.callsTotal),
    errors: sumRows(rows, (row) => row.callsError),
  };

  const normalizedByProvider: AiUsageBreakdownRow[] = PROVIDERS.map((providerKey) => {
    const subset = rows.filter((row) => row.provider === providerKey);
    const calls = sumRows(subset, (row) => row.callsTotal);
    const errors = sumRows(subset, (row) => row.callsError);
    const costEur = sumRows(subset, (row) => row.costTotalEur);
    return {
      key: providerKey,
      label: PROVIDER_LABELS[providerKey],
      tokens: sumRows(subset, (row) => row.tokensTotal),
      costEur,
      calls,
      errors,
      errorRatePct: toRate(errors, calls),
      successRatePct: toRate(calls - errors, calls),
      costPerCallEur: calls > 0 ? costEur / calls : 0,
    };
  });

  const normalizedByPipeline: AiUsageBreakdownRow[] = Object.entries(PIPELINE_LABELS).map(
    ([pipelineKey, label]) => {
      const subset = rows.filter((row) => row.pipeline === pipelineKey);
      const calls = sumRows(subset, (row) => row.callsTotal);
      const errors = sumRows(subset, (row) => row.callsError);
      const costEur = sumRows(subset, (row) => row.costTotalEur);
      return {
        key: pipelineKey,
        label,
        tokens: sumRows(subset, (row) => row.tokensTotal),
        costEur,
        calls,
        errors,
        errorRatePct: toRate(errors, calls),
        successRatePct: toRate(calls - errors, calls),
        costPerCallEur: calls > 0 ? costEur / calls : 0,
      };
    },
  );

  const byLane = aggregateRows(
    rows,
    (row) => mapPipelineToLane(row.pipeline),
    (lane) => LANE_LABELS[lane],
  );
  const byJourney = aggregateRows(
    rows,
    (row) => mapPipelineToJourney(row.pipeline),
    (journey) => JOURNEY_LABELS[journey],
  );

  const eventMatch: Record<string, any> = {
    createdAt: { $gte: startOfDay(fromDate) },
  };
  if (typeof region === "string" && region.trim()) {
    eventMatch.region = region.trim();
  }
  if (provider) {
    eventMatch.provider = provider;
  }
  if (pipeline) {
    eventMatch.pipeline = pipeline;
  }

  const recentEventsRaw = await usageCol
    .find(eventMatch, { sort: { createdAt: -1 }, limit: 40 })
    .project({
      createdAt: 1,
      provider: 1,
      pipeline: 1,
      region: 1,
      model: 1,
      tokensInput: 1,
      tokensOutput: 1,
      costEur: 1,
      durationMs: 1,
      success: 1,
      errorKind: 1,
      strictJson: 1,
      promptSnippet: 1,
      responseSnippet: 1,
      rawError: 1,
    })
    .toArray();

  const recent = recentEventsRaw.map(toUsageEventSummary);

  const eventCalls = recent.length;
  const eventErrors = recent.filter((event) => !event.success).length;
  const avgDurationMs =
    eventCalls > 0
      ? Math.round(recent.reduce((sum, event) => sum + (event.durationMs ?? 0), 0) / eventCalls)
      : 0;
  const performance: AiUsagePerformanceSummary = {
    avgDurationMs,
    successRatePct: toRate(eventCalls - eventErrors, eventCalls),
    errorRatePct: toRate(eventErrors, eventCalls),
    costPerCallEur: totals.calls > 0 ? totals.costEur / totals.calls : 0,
  };

  const byErrorKind = aggregateErrorKinds(recent);

  const durationByProvider = aggregateAverageDuration(recent, (event) => event.provider);
  const durationByPipeline = aggregateAverageDuration(recent, (event) => event.pipeline);
  const byProvider = normalizedByProvider.map((row) => ({
    ...row,
    avgDurationMs: durationByProvider.get(row.key as AiProviderName),
  }));
  const byPipeline = normalizedByPipeline.map((row) => ({
    ...row,
    avgDurationMs: durationByPipeline.get(row.key as AiPipelineName),
  }));

  const insights = deriveAiUsageInsights({
    byProvider,
    byPipeline,
    performance,
    byErrorKind,
  });
  const operational = deriveAiUsageOperationalSignals({
    rangeDays: Math.max(1, rangeDays),
    totals,
    performance,
    byProvider,
    byPipeline,
    byLane,
    byErrorKind,
    rows,
    thresholds,
  });

  const sortedByProvider = sortBreakdownRows(byProvider);
  const sortedByPipeline = sortBreakdownRows(byPipeline);
  const sortedByLane = sortBreakdownRows(byLane);
  const sortedByJourney = sortBreakdownRows(byJourney);

  return {
    fromDate: fromDate.toISOString(),
    toDate: today.toISOString(),
    filters: {
      rangeDays: Math.max(1, rangeDays),
      provider: provider ?? undefined,
      pipeline: pipeline ?? undefined,
      region: typeof region === "string" && region.trim() ? region.trim() : null,
    },
    totals,
    performance,
    byProvider: sortedByProvider,
    byPipeline: sortedByPipeline,
    byLane: sortedByLane,
    byJourney: sortedByJourney,
    byErrorKind,
    recent: recent.slice(0, 20),
    insights,
    thresholds: operational.thresholds,
    derivedMetrics: operational.derivedMetrics,
    attentionFlags: operational.attentionFlags,
    optimization: operational.optimization,
  };
}
