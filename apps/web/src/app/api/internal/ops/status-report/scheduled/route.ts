import { NextRequest, NextResponse } from "next/server";
import { isScheduledStatusReportSlot } from "@/features/ops/statusReport/contracts";
import { readStatusReportConfig } from "@/features/ops/statusReport/config";
import { runScheduledStatusReportSlot } from "@/features/ops/statusReport/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTERNAL_TRIGGER_SECRET_HEADER = "x-status-report-trigger-secret";

function hasValidTriggerSecret(req: NextRequest): boolean {
  const expected = String(process.env.STATUS_REPORT_INTERNAL_TRIGGER_SECRET ?? "").trim();
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  const provided = String(req.headers.get(INTERNAL_TRIGGER_SECRET_HEADER) ?? "").trim();
  return provided.length > 0 && provided === expected;
}

export async function POST(req: NextRequest) {
  if (!hasValidTriggerSecret(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized_internal_trigger" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const slotRaw = typeof body?.slot === "string" ? body.slot.trim() : "";
  const nowRaw = typeof body?.nowIso === "string" ? body.nowIso.trim() : "";
  const now = nowRaw ? new Date(nowRaw) : new Date();

  const config = readStatusReportConfig();
  if (!isScheduledStatusReportSlot(slotRaw, config.scheduleSlots)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_slot",
        expected: config.scheduleSlots,
      },
      { status: 400 },
    );
  }

  const result = await runScheduledStatusReportSlot({
    slot: slotRaw,
    now: Number.isNaN(now.getTime()) ? undefined : now,
  });

  return NextResponse.json({
    ok: result.ok,
    skipped: result.skipped,
    reason: result.reason,
    run: result.run,
  });
}
