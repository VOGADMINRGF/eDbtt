import { NextRequest, NextResponse } from "next/server";
import { listEventualitySnapshots } from "@core/eventualities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toIso(value?: Date | null) {
  if (!value) return null;
  const dt = value instanceof Date ? value : new Date(value);
  return Number.isNaN(dt.valueOf()) ? null : dt.toISOString();
}

export async function GET(req: NextRequest) {
  const rawLimit = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 200)) : 50;

  const snapshots = await listEventualitySnapshots(limit);

  return NextResponse.json({
    ok: true,
    items: snapshots.map((doc) => ({
      contributionId: doc.contributionId,
      locale: doc.locale,
      nodesCount: doc.nodesCount,
      treesCount: doc.treesCount,
      reviewed: doc.reviewed,
      createdAt: toIso(doc.createdAt),
      updatedAt: toIso(doc.updatedAt),
    })),
  });
}
