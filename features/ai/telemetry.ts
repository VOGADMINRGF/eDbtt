// Lightweight telemetry sink for AI orchestration.
// Data stays in-memory (ring buffer) but can be mirrored via a custom sink.
import type { AiErrorKind } from "@core/telemetry/aiUsageTypes";

export type AiTelemetryEvent = {
  ts: number;
  task: string;
  pipeline: string;
  provider: string;
  model?: string;
  success: boolean;
  jsonOk?: boolean;
  retries: number;
  durationMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  fallbackUsed?: boolean;
  errorKind?: AiErrorKind | null;
};

export type AiTelemetrySummary = {
  totals: {
    calls: number;
    successRate: number;
    avgDurationMs: number;
    fallbackRate: number;
  };
  perProvider: Array<{
    provider: string;
    calls: number;
    successRate: number;
    avgDurationMs: number;
    fallbackRate: number;
  }>;
};

const MAX_EVENTS = Number(process.env.AI_TELEMETRY_BUFFER_MAX ?? 1000);
const buffer: AiTelemetryEvent[] = [];
const DEFAULT_HEALTH_WINDOW_MS = Number(process.env.AI_HEALTH_WINDOW_MS ?? 6 * 60 * 60 * 1000);
const DEFAULT_MIN_SAMPLES = Number(process.env.AI_HEALTH_MIN_SAMPLES ?? 6);

let customSink: ((event: AiTelemetryEvent) => Promise<void> | void) | null = null;

export function setTelemetrySink(fn: ((event: AiTelemetryEvent) => Promise<void> | void) | null) {
  customSink = fn;
}

export async function recordAiTelemetry(
  event: Omit<AiTelemetryEvent, "ts"> & { ts?: number }
): Promise<void> {
  const entry: AiTelemetryEvent = {
    ts: event.ts ?? Date.now(),
    task: event.task,
    pipeline: event.pipeline,
    provider: event.provider,
    model: event.model,
    success: event.success,
    jsonOk: event.jsonOk,
    retries: event.retries ?? 0,
    durationMs: event.durationMs,
    tokensIn: event.tokensIn,
    tokensOut: event.tokensOut,
    fallbackUsed: event.fallbackUsed ?? false,
    errorKind: event.errorKind ?? null,
  };

  buffer.push(entry);
  if (buffer.length > MAX_EVENTS) buffer.shift();

  if (customSink) {
    await Promise.resolve(customSink(entry)).catch(() => {});
  }

  // eslint-disable-next-line no-console
  console.info("[AI-Telemetry]", JSON.stringify(entry));
}

export function recentEvents(limit = 200): AiTelemetryEvent[] {
  if (limit <= 0) return [];
  return buffer.slice(Math.max(0, buffer.length - limit));
}

export function summarizeTelemetry(events: AiTelemetryEvent[] = buffer): AiTelemetrySummary {
  const totals = {
    calls: events.length,
    success: events.filter((e) => e.success).length,
    durationSum: events.reduce((sum, e) => sum + (e.durationMs ?? 0), 0),
    fallbackCount: events.filter((e) => e.fallbackUsed).length,
  };

  const perProvider = new Map<
    string,
    { provider: string; calls: number; success: number; durationSum: number; fallback: number }
  >();

  for (const event of events) {
    if (!perProvider.has(event.provider)) {
      perProvider.set(event.provider, {
        provider: event.provider,
        calls: 0,
        success: 0,
        durationSum: 0,
        fallback: 0,
      });
    }
    const bucket = perProvider.get(event.provider)!;
    bucket.calls += 1;
    if (event.success) bucket.success += 1;
    bucket.durationSum += event.durationMs ?? 0;
    if (event.fallbackUsed) bucket.fallback += 1;
  }

  const formatRate = (num: number, denom: number) =>
    denom > 0 ? Math.round((num / denom) * 1000) / 10 : 0;
  const formatAvg = (sum: number, denom: number) =>
    denom > 0 ? Math.round(sum / denom) : 0;

  return {
    totals: {
      calls: totals.calls,
      successRate: formatRate(totals.success, totals.calls),
      avgDurationMs: formatAvg(totals.durationSum, totals.calls),
      fallbackRate: formatRate(totals.fallbackCount, totals.calls),
    },
    perProvider: Array.from(perProvider.values()).map((bucket) => ({
      provider: bucket.provider,
      calls: bucket.calls,
      successRate: formatRate(bucket.success, bucket.calls),
      avgDurationMs: formatAvg(bucket.durationSum, bucket.calls),
      fallbackRate: formatRate(bucket.fallback, bucket.calls),
    })),
  };
}

export type ProviderHealthSnapshot = {
  provider: string;
  score: number;
  successRate: number;
  jsonOkRate: number;
  p95Ms: number;
  sampleSize: number;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function p95Of(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor(sorted.length * 0.95) - 1);
  return sorted[idx] ?? 0;
}

function toNumber(value: unknown, fallback: number): number {
  const num = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(num) ? num : fallback;
}

export function getProviderHealthFromTelemetry(
  provider: string,
  opts?: { windowMs?: number; minSamples?: number; limit?: number },
): ProviderHealthSnapshot | null {
  const windowMs = opts?.windowMs ?? DEFAULT_HEALTH_WINDOW_MS;
  const minSamples = opts?.minSamples ?? DEFAULT_MIN_SAMPLES;
  const limit = opts?.limit ?? 400;
  const now = Date.now();

  const events = recentEvents(limit).filter(
    (entry) =>
      entry.provider === provider &&
      (windowMs <= 0 || now - entry.ts <= windowMs),
  );

  if (events.length < minSamples) return null;

  const successCount = events.filter((e) => e.success).length;
  const jsonOkCount = events.filter((e) => e.jsonOk).length;
  const durations = events.map((e) => e.durationMs ?? 0).filter((value) => value > 0);
  const p95Ms = durations.length ? p95Of(durations) : 2000;

  const successRate = successCount / events.length;
  const jsonOkRate = jsonOkCount / events.length;

  const wAvail = toNumber(process.env.AI_SCORE_W_AVAIL, 0.45);
  const wJson = toNumber(process.env.AI_SCORE_W_JSON, 0.35);
  const wLat = toNumber(process.env.AI_SCORE_W_LAT, 0.2);
  const latencyScore = 1 / (1 + p95Ms / 1000);

  const score = clamp01(wAvail * successRate + wJson * jsonOkRate + wLat * latencyScore);

  return {
    provider,
    score,
    successRate,
    jsonOkRate,
    p95Ms,
    sampleSize: events.length,
  };
}
