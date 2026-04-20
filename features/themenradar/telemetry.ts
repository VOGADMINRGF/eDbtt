import type { ThemenradarTelemetrySnapshot } from "@features/themenradar/contracts";

export const THEMENRADAR_TELEMETRY_EVENT_TYPES = [
  "click",
  "lead",
  "membership",
] as const;

export type ThemenradarTelemetryEventType =
  (typeof THEMENRADAR_TELEMETRY_EVENT_TYPES)[number];

export type ThemenradarTelemetryEvent = {
  type: ThemenradarTelemetryEventType;
  amount?: number;
  campaignKey?: string | null;
  at?: string;
};

export function createEmptyThemenradarTelemetry(
  campaignKey?: string | null,
): ThemenradarTelemetrySnapshot {
  return {
    campaignKey: campaignKey ?? null,
    clicks: 0,
    leads: 0,
    memberships: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function applyThemenradarTelemetryEvent(input: {
  snapshot: ThemenradarTelemetrySnapshot | null | undefined;
  event: ThemenradarTelemetryEvent;
}): ThemenradarTelemetrySnapshot {
  const base = input.snapshot
    ? { ...input.snapshot }
    : createEmptyThemenradarTelemetry(input.event.campaignKey ?? null);
  const amount = normalizeAmount(input.event.amount);
  const at = normalizeIsoDate(input.event.at) ?? new Date().toISOString();

  if (input.event.type === "click") {
    base.clicks += amount;
  } else if (input.event.type === "lead") {
    base.leads += amount;
  } else if (input.event.type === "membership") {
    base.memberships += amount;
  }

  if (typeof input.event.campaignKey === "string" && input.event.campaignKey.trim()) {
    base.campaignKey = input.event.campaignKey.trim();
  }
  base.updatedAt = at;
  return base;
}

function normalizeAmount(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  return Math.max(1, Math.min(5000, Math.floor(numeric)));
}

function normalizeIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

