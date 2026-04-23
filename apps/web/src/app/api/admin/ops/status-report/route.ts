import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  isScheduledStatusReportSlot,
  STATUS_REPORT_MANUAL_RUN_TYPE_VALUES,
  type StatusReportManualRunType,
} from "@/features/ops/statusReport/contracts";
import { readStatusReportConfig } from "@/features/ops/statusReport/config";
import {
  listStatusReportRuns,
  runManualStatusReportNow,
  runScheduledStatusReportSlot,
} from "@/features/ops/statusReport/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeLimit(raw: string | null): number {
  const parsed = Number(raw ?? "");
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.max(1, Math.min(100, Math.floor(parsed)));
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const limit = normalizeLimit(req.nextUrl.searchParams.get("limit"));
  const runs = await listStatusReportRuns(limit);
  return NextResponse.json({ ok: true, runs });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => ({}));
  const rawSlot = typeof body?.slot === "string" ? body.slot.trim() : "";
  const runTypeRaw = typeof body?.runType === "string" ? body.runType.trim() : "";
  const runType: StatusReportManualRunType = runTypeRaw
    ? (runTypeRaw as StatusReportManualRunType)
    : "full";
  const config = readStatusReportConfig();

  if (runTypeRaw && !STATUS_REPORT_MANUAL_RUN_TYPE_VALUES.includes(runType)) {
    return NextResponse.json(
      { ok: false, error: "invalid_run_type", expected: STATUS_REPORT_MANUAL_RUN_TYPE_VALUES },
      { status: 400 },
    );
  }

  if (rawSlot && !isScheduledStatusReportSlot(rawSlot, config.scheduleSlots)) {
    return NextResponse.json(
      { ok: false, error: "invalid_slot", expected: config.scheduleSlots },
      { status: 400 },
    );
  }

  const result = rawSlot
    ? await runScheduledStatusReportSlot({ slot: rawSlot })
    : await runManualStatusReportNow({ runType });

  return NextResponse.json({ ok: result.ok, skipped: result.skipped, reason: result.reason, run: result.run });
}
