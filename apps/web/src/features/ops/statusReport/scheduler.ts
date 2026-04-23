import { readStatusReportConfig } from "./config";
import type { ScheduledStatusReportSlot } from "./contracts";
import { triggerScheduledStatusReportRun } from "./schedulerTrigger";

const SCHEDULER_INTERVAL_MS = 30_000;

type SchedulerState = {
  started: boolean;
  running: boolean;
  timer: ReturnType<typeof setInterval> | null;
};

declare global {
  var __OPS_STATUS_REPORT_SCHEDULER_STATE__: SchedulerState | undefined;
}

function schedulerState(): SchedulerState {
  if (!globalThis.__OPS_STATUS_REPORT_SCHEDULER_STATE__) {
    globalThis.__OPS_STATUS_REPORT_SCHEDULER_STATE__ = {
      started: false,
      running: false,
      timer: null,
    };
  }
  return globalThis.__OPS_STATUS_REPORT_SCHEDULER_STATE__;
}

function parseClockInTimezone(now: Date, timezone: string): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((entry) => entry.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((entry) => entry.type === "minute")?.value ?? "0");
  return { hour, minute };
}

function slotToMinutes(slot: ScheduledStatusReportSlot): number {
  const [hour, minute] = slot.split(":").map((value) => Number(value));
  return hour * 60 + minute;
}

export function resolveDueScheduledSlots(
  now: Date,
  timezone: string,
  graceMinutes: number,
  slots: readonly ScheduledStatusReportSlot[],
): ScheduledStatusReportSlot[] {
  const MINUTES_PER_DAY = 24 * 60;
  const { hour, minute } = parseClockInTimezone(now, timezone);
  const currentMinutes = hour * 60 + minute;

  return slots.filter((slot) => {
    const slotMinutes = slotToMinutes(slot);
    const endMinutes = slotMinutes + graceMinutes;
    if (endMinutes <= MINUTES_PER_DAY) {
      return currentMinutes >= slotMinutes && currentMinutes < endMinutes;
    }

    const wrappedEndMinutes = endMinutes % MINUTES_PER_DAY;
    return currentMinutes >= slotMinutes || currentMinutes < wrappedEndMinutes;
  });
}

export async function runScheduledStatusReportTick(now = new Date()) {
  const state = schedulerState();
  if (state.running) return;

  const config = readStatusReportConfig();
  if (!config.enabled) return;
  if (config.recipients.length === 0) return;

  const dueSlots = resolveDueScheduledSlots(
    now,
    config.timezone,
    config.slotGraceMinutes,
    config.scheduleSlots,
  );
  if (dueSlots.length === 0) return;

  state.running = true;
  try {
    for (const slot of dueSlots) {
      const result = await triggerScheduledStatusReportRun({
        slot,
        now,
        config,
      });
      if (!result.ok) {
        console.error("[status-report] scheduled trigger failed", {
          slot,
          reason: result.reason,
        });
      }
    }
  } finally {
    state.running = false;
  }
}

export function startStatusReportScheduler(): void {
  if (process.env.NODE_ENV === "test") return;
  if (process.env.NEXT_RUNTIME === "edge") return;

  const config = readStatusReportConfig();
  if (!config.enabled) return;

  const state = schedulerState();
  if (state.started) return;

  state.started = true;
  state.timer = setInterval(() => {
    void runScheduledStatusReportTick();
  }, SCHEDULER_INTERVAL_MS);

  void runScheduledStatusReportTick();
  console.log("[status-report] scheduler started", {
    timezone: config.timezone,
    slots: config.scheduleSlots,
    graceMinutes: config.slotGraceMinutes,
  });
}

export function stopStatusReportSchedulerForTests(): void {
  const state = schedulerState();
  if (state.timer) {
    clearInterval(state.timer);
  }
  state.started = false;
  state.running = false;
  state.timer = null;
}
