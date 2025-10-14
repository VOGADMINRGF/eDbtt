// Lightweight telemetry sink for AI orchestration.
// - In-memory ring buffer (default)
// - Simple hook to plug a persistent sink later (e.g., Redis, DB)

type TelemetryEvent = {
    ts: number;                  // epoch ms
    task: string;
    provider: string;
    model?: string;
    success: boolean;
    retries: number;
    latencyMs?: number;
    jsonOk?: boolean;
    error?: string;
    circuitBefore?: string;
    circuitAfter?: string;
  };
  
  const MAX_EVENTS = Number(process.env.AI_TELEMETRY_BUFFER_MAX ?? 1000);
  const buffer: TelemetryEvent[] = [];
  
  let customSink: ((e: TelemetryEvent) => Promise<void> | void) | null = null;
  
  export function setTelemetrySink(fn: (e: TelemetryEvent) => Promise<void> | void) {
    customSink = fn;
  }
  
  export async function logEvent(e: TelemetryEvent) {
    buffer.push(e);
    if (buffer.length > MAX_EVENTS) buffer.shift();
    if (customSink) await Promise.resolve(customSink(e)).catch(() => {});
    // Always log to server console as well (structured)
    // eslint-disable-next-line no-console
    console.log("[AI-Telemetry]", JSON.stringify(e));
  }
  
  export function recentEvents(limit = 200): TelemetryEvent[] {
    return buffer.slice(Math.max(0, buffer.length - limit));
  }
  