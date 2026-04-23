export const STATUS_REPORT_CHECK_STATUS_VALUES = ["green", "yellow", "red", "grey"] as const;
export type StatusReportCheckStatus = (typeof STATUS_REPORT_CHECK_STATUS_VALUES)[number];

export const STATUS_REPORT_OVERALL_STATUS_VALUES = ["green", "yellow", "red"] as const;
export type StatusReportOverallStatus = (typeof STATUS_REPORT_OVERALL_STATUS_VALUES)[number];

export const STATUS_REPORT_DEFAULT_SCHEDULED_SLOT_VALUES = ["05:00", "17:00"] as const;
export type ScheduledStatusReportSlot = `${number}${number}:${number}${number}`;

export const STATUS_REPORT_MANUAL_RUN_TYPE_VALUES = ["full", "health_only"] as const;
export type StatusReportManualRunType = (typeof STATUS_REPORT_MANUAL_RUN_TYPE_VALUES)[number];

export type StatusReportSlot = ScheduledStatusReportSlot | "manual";

export type StatusReportCheck = {
  key: string;
  label: string;
  status: StatusReportCheckStatus;
  detail: string;
  latencyMs?: number;
  error?: string;
};

export type StatusReportSection = {
  key: "platform" | "ai" | "themenradar" | "order_pricing";
  label: string;
  checks: StatusReportCheck[];
};

export type StatusReportSummary = {
  generatedAt: string;
  timezone: string;
  slot: StatusReportSlot;
  overallStatus: StatusReportOverallStatus;
  summaryPoints: string[];
  sections: StatusReportSection[];
  totals: {
    green: number;
    yellow: number;
    red: number;
    grey: number;
  };
};

export type StatusReportRunStatus = "running" | "sent" | "failed" | "skipped";

export type StatusReportRunRecord = {
  id: string;
  slotKey: string;
  slot: StatusReportSlot;
  timezone: string;
  trigger: "scheduler" | "manual";
  recipients: string[];
  startedAt: string;
  completedAt: string | null;
  status: StatusReportRunStatus;
  overallStatus: StatusReportOverallStatus | null;
  summaryPoints: string[];
  mailSent: boolean;
  error: string | null;
  report: StatusReportSummary | null;
};

export function computeTotalsFromSections(sections: StatusReportSection[]): StatusReportSummary["totals"] {
  const totals: StatusReportSummary["totals"] = {
    green: 0,
    yellow: 0,
    red: 0,
    grey: 0,
  };

  for (const section of sections) {
    for (const check of section.checks) {
      totals[check.status] += 1;
    }
  }

  return totals;
}

export function deriveOverallStatusFromTotals(
  totals: StatusReportSummary["totals"],
): StatusReportOverallStatus {
  if (totals.red > 0) return "red";
  if (totals.yellow > 0) return "yellow";
  return "green";
}

function isSlotFormat(value: string): value is ScheduledStatusReportSlot {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  return true;
}

export function isScheduledStatusReportSlot(
  value: string,
  allowedSlots?: readonly ScheduledStatusReportSlot[],
): value is ScheduledStatusReportSlot {
  const normalized = value.trim();
  if (!isSlotFormat(normalized)) return false;
  if (!allowedSlots || allowedSlots.length === 0) return true;
  return allowedSlots.includes(normalized);
}
