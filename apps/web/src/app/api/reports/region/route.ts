import { NextRequest, NextResponse } from "next/server";
import { getRegionReportData } from "@core/graph/queries/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const regionId = searchParams.get("region") || searchParams.get("regionId") || "";
  if (!regionId.trim()) {
    return NextResponse.json({ ok: false, error: "missing_region" }, { status: 400 });
  }

  try {
    const summary = await getRegionReportData(regionId.trim());
    return NextResponse.json({ ok: true, meta: { regionId }, summary });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to build report" }, { status: 500 });
  }
}
