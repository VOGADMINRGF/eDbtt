import { NextRequest, NextResponse } from "next/server";
import { runCreatePrepareAttachHistoryBackfill } from "@/features/create/attachDraftHistoryBackfill";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

const HISTORY_MAINTENANCE_MODE = "dry_run" as const;

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const requestedMode = String(params.get("mode") || "").trim().toLowerCase();
  if (requestedMode && requestedMode !== HISTORY_MAINTENANCE_MODE) {
    return NextResponse.json({ ok: false, error: "invalid_history_maintenance_mode" }, { status: 400 });
  }

  const previewLimit = params.get("previewLimit");
  const scanLimit = params.get("scanLimit");

  try {
    const report = await runCreatePrepareAttachHistoryBackfill({
      mode: HISTORY_MAINTENANCE_MODE,
      previewLimit: previewLimit ?? undefined,
      scanLimit: scanLimit ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      ...report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "attach_draft_history_maintenance_failed";
    const status =
      message === "invalid_history_backfill_scan_limit" || message === "invalid_history_backfill_mode"
        ? 400
        : message === "actor_scope_forbidden"
        ? 403
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
