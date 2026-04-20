export const STATUS_REPORT_CHECK_STATUS_VALUES = ["green", "yellow", "red", "grey"] as const;
export type StatusReportCheckStatus = (typeof STATUS_REPORT_CHECK_STATUS_VALUES)[number];

export const STATUS_REPORT_OVERALL_STATUS_VALUES = ["green", "yellow", "red"] as const;
export type StatusReportOverallStatus = (typeof STATUS_REPORT_OVERALL_STATUS_VALUES)[number];

export const STATUS_REPORT_SCHEDULED_SLOT_VALUES = ["05:00", "17:00"] as const;
export type ScheduledStatusReportSlot = (typeof STATUS_REPORT_SCHEDULED_SLOT_VALUES)[number];

export const STATUS_REPORT_SLOT_VALUES = [...STATUS_REPORT_SCHEDULED_SLOT_VALUES, "manual"] as const;
export type StatusReportSlot = (typeof STATUS_REPORT_SLOT_VALUES)[number];

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

export function isScheduledStatusReportSlot(value: string): value is ScheduledStatusReportSlot {
  return STATUS_REPORT_SCHEDULED_SLOT_VALUES.includes(value as ScheduledStatusReportSlot);
}
