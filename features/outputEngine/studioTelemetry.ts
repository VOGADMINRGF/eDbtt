export const STUDIO_TELEMETRY_EVENTS = [
  "master_post_generated",
  "copied",
  "draft_saved",
  "plan_adopted",
  "connector_missing",
  "review_prepared",
] as const;

export type StudioTelemetryEventName = (typeof STUDIO_TELEMETRY_EVENTS)[number];

export type StudioTelemetryEvent = {
  name: StudioTelemetryEventName;
  dossierId: string;
  channel?: string | null;
  at: string;
  meta?: Record<string, string | number | boolean | null>;
};

const inMemoryEvents: StudioTelemetryEvent[] = [];

export function recordStudioTelemetryEvent(event: Omit<StudioTelemetryEvent, "at">): StudioTelemetryEvent {
  const normalized: StudioTelemetryEvent = {
    ...event,
    at: new Date().toISOString(),
  };
  inMemoryEvents.push(normalized);
  return normalized;
}

export function listStudioTelemetryEvents(): StudioTelemetryEvent[] {
  return [...inMemoryEvents];
}

export function clearStudioTelemetryEvents() {
  inMemoryEvents.length = 0;
}
