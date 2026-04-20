import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { getThemenradarTelemetryReportShape } from "@features/themenradar/store";
import type {
  ThemenradarLifecycleStatus,
  ThemenradarSourceType,
} from "@features/themenradar/contracts";

const ALLOWED_STATUSES = [
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
] as const;

const ALLOWED_SOURCES = [
  "manual",
  "news",
  "community",
  "create_intake",
] as const;

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const statusRaw = String(params.get("status") ?? "all");
  const sourceRaw = String(params.get("sourceType") ?? "all");
  const limitRaw = Number(params.get("limit") ?? 500);

  const status =
    statusRaw === "all" || ALLOWED_STATUSES.includes(statusRaw as ThemenradarLifecycleStatus)
      ? (statusRaw as ThemenradarLifecycleStatus | "all")
      : "all";
  const sourceType =
    sourceRaw === "all" || ALLOWED_SOURCES.includes(sourceRaw as ThemenradarSourceType)
      ? (sourceRaw as ThemenradarSourceType | "all")
      : "all";

  try {
    const report = await getThemenradarTelemetryReportShape({
      status,
      sourceType,
      limit: Number.isFinite(limitRaw) ? limitRaw : 500,
    });
    return NextResponse.json({
      ok: true,
      report,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "themenradar_report_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

