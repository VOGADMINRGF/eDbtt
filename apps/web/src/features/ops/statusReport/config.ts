import type { ScheduledStatusReportSlot } from "./contracts";
import { STATUS_REPORT_SCHEDULED_SLOT_VALUES } from "./contracts";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export type StatusReportConfig = {
  enabled: boolean;
  recipients: string[];
  timezone: string;
  subjectPrefix: string;
  includeAiSmokes: boolean;
  baseUrl: string;
  slotGraceMinutes: number;
  scheduleSlots: readonly ScheduledStatusReportSlot[];
};

type EnvShape = Record<string, string | undefined>;

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  return TRUE_VALUES.has(normalized);
}

function parseRecipients(value: string | undefined): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry, idx, list) => entry.length > 0 && list.indexOf(entry) === idx);
}

function parsePositiveInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function normalizeBaseUrl(raw: string | undefined): string {
  const fallback = "http://127.0.0.1:3000";
  const value = String(raw ?? "").trim();
  if (!value) return fallback;
  try {
    const normalized = new URL(value);
    return normalized.origin;
  } catch {
    return fallback;
  }
}

export function hasSmtpConfig(env: EnvShape = process.env): boolean {
  const hasUrl = Boolean(String(env.SMTP_URL ?? "").trim());
  const hasHost = Boolean(String(env.SMTP_HOST ?? "").trim());
  return hasUrl || hasHost;
}

export function readStatusReportConfig(env: EnvShape = process.env): StatusReportConfig {
  const recipients = parseRecipients(env.STATUS_REPORT_RECIPIENTS);
  const enabled = parseBool(env.STATUS_REPORT_ENABLED, false);

  return {
    enabled,
    recipients,
    timezone: String(env.STATUS_REPORT_TZ ?? "Europe/Berlin").trim() || "Europe/Berlin",
    subjectPrefix: String(env.STATUS_REPORT_SUBJECT_PREFIX ?? "").trim(),
    includeAiSmokes: parseBool(env.STATUS_REPORT_INCLUDE_AI_SMOKES, true),
    baseUrl: normalizeBaseUrl(
      env.STATUS_REPORT_BASE_URL ?? env.NEXT_PUBLIC_APP_ORIGIN ?? env.NEXT_PUBLIC_BASE_URL,
    ),
    slotGraceMinutes: parsePositiveInt(env.STATUS_REPORT_SLOT_GRACE_MINUTES, 20, 5, 120),
    scheduleSlots: STATUS_REPORT_SCHEDULED_SLOT_VALUES,
  };
}
