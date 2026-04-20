import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  isScheduledStatusReportSlot,
  listStatusReportRuns,
  runManualStatusReportNow,
  runScheduledStatusReportSlot,
} from "@/features/ops/statusReport";

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

  if (rawSlot && !isScheduledStatusReportSlot(rawSlot)) {
    return NextResponse.json(
      { ok: false, error: "invalid_slot", expected: ["05:00", "17:00"] },
      { status: 400 },
    );
  }

  const result = rawSlot
    ? await runScheduledStatusReportSlot({ slot: rawSlot })
    : await runManualStatusReportNow();

  return NextResponse.json({ ok: result.ok, skipped: result.skipped, reason: result.reason, run: result.run });
}
