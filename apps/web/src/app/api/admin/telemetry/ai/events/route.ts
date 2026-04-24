// apps/web/src/app/api/admin/telemetry/ai/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { recentEvents, summarizeTelemetry } from "@features/ai/telemetry";
import { listAdminAiRuns } from "@/features/ai/adminTelemetryStore";
import type { ProviderDiagnostic } from "@/features/ai/adminTelemetryDiagnostics";

export const runtime = "nodejs";

type RunGroupRow = {
  runId: string;
  correlationId: string;
  mode: string;
  startedAt: number;
  finishedAt: number;
  ok: boolean;
  bestProviderId: string | null;
  rootCause: string;
  nextAction: string;
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  costEur: number;
  providers: ProviderDiagnostic[];
};

function summarizeRunRootCause(rows: ProviderDiagnostic[]): { rootCause: string; nextAction: string } {
  const failing = rows.filter((row) => row.status !== "ok");
  if (failing.length === 0) return { rootCause: "OK", nextAction: "Keine Aktion" };

  const severe =
    failing.find((row) => row.status === "config_missing") ||
    failing.find((row) => row.errorKind === "MODEL_NOT_FOUND") ||
    failing.find((row) => row.errorKind === "UNAUTHORIZED" || row.errorKind === "INVALID_API_KEY") ||
    failing.find((row) => row.errorKind === "BAD_JSON") ||
    failing[0];

  return {
    rootCause: severe.rootCause,
    nextAction: severe.nextAction,
  };
}

function toRunGroups(limit = 30): RunGroupRow[] {
  return listAdminAiRuns(limit).map((run) => {
    const tokensIn = run.rows.reduce((sum, row) => sum + (row.tokensIn ?? 0), 0);
    const tokensOut = run.rows.reduce((sum, row) => sum + (row.tokensOut ?? 0), 0);
    const { rootCause, nextAction } = summarizeRunRootCause(run.rows);
    return {
      runId: run.runId,
      correlationId: run.correlationId,
      mode: run.mode,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      ok: run.ok,
      bestProviderId: run.bestProviderId ?? null,
      rootCause,
      nextAction,
      durationMs: Math.max(0, run.finishedAt - run.startedAt),
      tokensIn,
      tokensOut,
      costEur: 0,
      providers: run.rows,
    };
  });
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const events = recentEvents(200);
  const summary = summarizeTelemetry(events);
  const runs = toRunGroups(30);

  return NextResponse.json({
    ok: true,
    summary,
    events,
    runs,
  });
}
