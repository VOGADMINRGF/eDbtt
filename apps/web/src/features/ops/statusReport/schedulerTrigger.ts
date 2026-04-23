import type { ScheduledStatusReportSlot } from "./contracts";
import type { StatusReportConfig } from "./config";

const INTERNAL_SCHEDULED_TRIGGER_PATH = "/api/internal/ops/status-report/scheduled";
const INTERNAL_TRIGGER_SECRET_HEADER = "x-status-report-trigger-secret";

export type ScheduledStatusReportTriggerResult = {
  ok: boolean;
  skipped: boolean;
  reason: string;
};

function buildTriggerUrl(baseUrl: string): string {
  return new URL(INTERNAL_SCHEDULED_TRIGGER_PATH, baseUrl).toString();
}

export async function triggerScheduledStatusReportRun(params: {
  slot: ScheduledStatusReportSlot;
  now: Date;
  config: StatusReportConfig;
}): Promise<ScheduledStatusReportTriggerResult> {
  const secret = String(process.env.STATUS_REPORT_INTERNAL_TRIGGER_SECRET ?? "").trim();
  if (!secret && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      skipped: true,
      reason: "status_report_internal_trigger_secret_missing",
    };
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (secret) {
    headers[INTERNAL_TRIGGER_SECRET_HEADER] = secret;
  }

  try {
    const response = await fetch(buildTriggerUrl(params.config.baseUrl), {
      method: "POST",
      cache: "no-store",
      headers,
      body: JSON.stringify({
        slot: params.slot,
        nowIso: params.now.toISOString(),
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      return {
        ok: false,
        skipped: false,
        reason: payload?.error ?? `status_report_internal_trigger_http_${response.status}`,
      };
    }

    return {
      ok: payload.ok === true,
      skipped: payload.skipped === true,
      reason: String(payload.reason ?? "status_report_internal_trigger_unknown"),
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
