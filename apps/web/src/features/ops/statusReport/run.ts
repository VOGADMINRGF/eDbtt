import { sendMail } from "@/utils/mailer";
import { collectStatusReportSummary } from "./collect";
import { buildStatusReportSubject, renderStatusReportMail } from "./mail";
import { hasSmtpConfig, readStatusReportConfig } from "./config";
import { getStatusReportRepo } from "./repo";
import type {
  ScheduledStatusReportSlot,
  StatusReportManualRunType,
  StatusReportRunRecord,
  StatusReportSlot,
} from "./contracts";

export type StatusReportRunResult = {
  ok: boolean;
  skipped: boolean;
  reason: string;
  run: StatusReportRunRecord | null;
};

function nowIso() {
  return new Date().toISOString();
}

function localDateKey(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function buildScheduledSlotKey(date: Date, timezone: string, slot: ScheduledStatusReportSlot): string {
  return `${localDateKey(date, timezone)}@${slot}`;
}

async function finalizeRun(input: {
  runId: string;
  status: "sent" | "failed" | "skipped";
  overallStatus: "green" | "yellow" | "red" | null;
  summaryPoints: string[];
  mailSent: boolean;
  error: string | null;
  report: any;
}) {
  const repo = getStatusReportRepo();
  return repo.finishRun({
    id: input.runId,
    status: input.status,
    completedAt: nowIso(),
    overallStatus: input.overallStatus,
    summaryPoints: input.summaryPoints,
    mailSent: input.mailSent,
    error: input.error,
    report: input.report,
  });
}

async function executeClaimedRun(params: {
  runId: string;
  slot: StatusReportSlot;
  runType: StatusReportManualRunType;
}): Promise<StatusReportRunResult> {
  const config = readStatusReportConfig();

  try {
    const summary = await collectStatusReportSummary({
      config,
      slot: params.slot,
    });

    if (params.runType === "health_only") {
      const updated = await finalizeRun({
        runId: params.runId,
        status: "skipped",
        overallStatus: summary.overallStatus,
        summaryPoints: summary.summaryPoints,
        mailSent: false,
        error: null,
        report: summary,
      });

      return {
        ok: true,
        skipped: true,
        reason: "status_report_health_only_completed",
        run: updated,
      };
    }

    if (!hasSmtpConfig()) {
      console.error("[status-report] smtp config missing; report mail was not sent");
      const updated = await finalizeRun({
        runId: params.runId,
        status: "failed",
        overallStatus: summary.overallStatus,
        summaryPoints: summary.summaryPoints,
        mailSent: false,
        error: "smtp_config_missing",
        report: summary,
      });
      return {
        ok: false,
        skipped: false,
        reason: "smtp_config_missing",
        run: updated,
      };
    }

    const subject = buildStatusReportSubject({
      summary,
      subjectPrefix: config.subjectPrefix,
    });
    const rendered = renderStatusReportMail(summary, subject);

    const mailResult = await sendMail({
      to: config.recipients.join(","),
      mail: rendered,
      delivery: "best_effort_delivery",
      tag: "ops_status_report",
    });

    const usedFallback = Boolean((mailResult as any)?.fallback || (mailResult as any)?.dev);
    if (!mailResult || (mailResult as any).ok !== true || usedFallback) {
      console.error("[status-report] smtp delivery failed or fell back", {
        usedFallback,
        mailResult,
      });
      const updated = await finalizeRun({
        runId: params.runId,
        status: "failed",
        overallStatus: summary.overallStatus,
        summaryPoints: summary.summaryPoints,
        mailSent: false,
        error: usedFallback ? "smtp_delivery_fallback" : "smtp_delivery_failed",
        report: summary,
      });
      return {
        ok: false,
        skipped: false,
        reason: usedFallback ? "smtp_delivery_fallback" : "smtp_delivery_failed",
        run: updated,
      };
    }

    const updated = await finalizeRun({
      runId: params.runId,
      status: "sent",
      overallStatus: summary.overallStatus,
      summaryPoints: summary.summaryPoints,
      mailSent: true,
      error: null,
      report: summary,
    });

    return {
      ok: true,
      skipped: false,
      reason: "sent",
      run: updated,
    };
  } catch (error) {
    console.error("[status-report] run failed", error);
    const updated = await finalizeRun({
      runId: params.runId,
      status: "failed",
      overallStatus: null,
      summaryPoints: ["Statusreport-Lauf unerwartet fehlgeschlagen."],
      mailSent: false,
      error: error instanceof Error ? error.message : String(error),
      report: null,
    });

    return {
      ok: false,
      skipped: false,
      reason: "status_report_run_failed",
      run: updated,
    };
  }
}

export async function runScheduledStatusReportSlot(params: {
  slot: ScheduledStatusReportSlot;
  now?: Date;
}): Promise<StatusReportRunResult> {
  const config = readStatusReportConfig();
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "status_report_disabled", run: null };
  }
  if (config.recipients.length === 0) {
    return { ok: false, skipped: true, reason: "status_report_no_recipients", run: null };
  }

  const now = params.now ?? new Date();
  const slotKey = buildScheduledSlotKey(now, config.timezone, params.slot);
  const repo = getStatusReportRepo();

  const claim = await repo.claimScheduledRun({
    slotKey,
    slot: params.slot,
    timezone: config.timezone,
    recipients: config.recipients,
  });

  if (!claim.claimed) {
    return {
      ok: true,
      skipped: true,
      reason: "status_report_slot_already_processed",
      run: claim.run,
    };
  }

  return executeClaimedRun({
    runId: claim.run.id,
    slot: params.slot,
    runType: "full",
  });
}

export async function runManualStatusReportNow(options?: {
  runType?: StatusReportManualRunType;
}): Promise<StatusReportRunResult> {
  const config = readStatusReportConfig();
  const runType = options?.runType ?? "full";
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "status_report_disabled", run: null };
  }
  if (runType === "full" && config.recipients.length === 0) {
    return { ok: false, skipped: true, reason: "status_report_no_recipients", run: null };
  }

  const repo = getStatusReportRepo();
  const run = await repo.createManualRun({
    timezone: config.timezone,
    recipients: runType === "full" ? config.recipients : [],
  });

  return executeClaimedRun({
    runId: run.id,
    slot: "manual",
    runType,
  });
}

export async function listStatusReportRuns(limit = 20): Promise<StatusReportRunRecord[]> {
  const repo = getStatusReportRepo();
  return repo.listRecent(limit);
}
