import { NextRequest, NextResponse } from "next/server";
import { runFeedAnlassraumClusterJob } from "@features/feeds/clusterJob";
import { recordFeedRuntimeRun } from "@features/feeds/runtimeLog";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

type ClusterRunBody = {
  limit?: number;
  windowHours?: number;
  minItemsPerCluster?: number;
  dryRun?: boolean;
};

export async function POST(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;
  const requestedAt = new Date();

  try {
    const body = await parseBody(req);
    const result = await runFeedAnlassraumClusterJob({
      limit: parsePositiveInt(body.limit, "invalid_limit"),
      windowHours: parsePositiveInt(body.windowHours, "invalid_window_hours"),
      minItemsPerCluster: parsePositiveInt(
        body.minItemsPerCluster,
        "invalid_min_items_per_cluster",
      ),
      dryRun: body.dryRun === true,
    });
    await recordFeedRuntimeRun({
      runType: "cluster",
      status: body.dryRun === true ? "dry_run" : result.status === "success" ? "success" : "error",
      requestedAt,
      completedAt: new Date(),
      counts: {
        scannedDrafts: result.source.scannedDrafts,
        eligibleDrafts: result.source.eligibleDrafts,
        totalClusters: result.summary.totalClusters,
        created: result.summary.created,
        updated: result.summary.updated,
        unchanged: result.summary.unchanged,
      },
      error: result.emptyReason ?? null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "feed_anlassraum_cluster_job_failed";
    await recordFeedRuntimeRun({
      runType: "cluster",
      status: "error",
      requestedAt,
      completedAt: new Date(),
      error: message,
    });
    if (
      message === "invalid_body" ||
      message === "invalid_limit" ||
      message === "invalid_window_hours" ||
      message === "invalid_min_items_per_cluster"
    ) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    if (
      message === "feed_anlassraum_cluster_source_unavailable" ||
      message === "feed_anlassraum_cluster_job_failed"
    ) {
      return NextResponse.json({ ok: false, error: message }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: "feed_anlassraum_cluster_job_failed" },
      { status: 503 },
    );
  }
}

async function parseBody(req: NextRequest): Promise<ClusterRunBody> {
  const text = await req.text();
  if (!text.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("invalid_body");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("invalid_body");
  }
  return parsed as ClusterRunBody;
}

function parsePositiveInt(value: number | undefined, errorCode: string): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(errorCode);
  }
  return Math.floor(parsed);
}
