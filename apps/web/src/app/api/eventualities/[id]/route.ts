import { NextRequest, NextResponse } from "next/server";
import { getEventualitiesByContribution } from "@core/eventualities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toIso(value?: Date | null) {
  if (!value) return null;
  const dt = value instanceof Date ? value : new Date(value);
  return Number.isNaN(dt.valueOf()) ? null : dt.toISOString();
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const id = params?.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const data = await getEventualitiesByContribution(id);
  if (!data) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    snapshot: {
      contributionId: data.snapshot.contributionId,
      locale: data.snapshot.locale,
      nodesCount: data.snapshot.nodesCount,
      treesCount: data.snapshot.treesCount,
      reviewed: data.snapshot.reviewed,
      reviewedAt: toIso(data.snapshot.reviewedAt ?? null),
      createdAt: toIso(data.snapshot.createdAt),
      updatedAt: toIso(data.snapshot.updatedAt),
    },
    eventualities: data.eventualities,
    decisionTrees: data.decisionTrees,
    consequences: data.consequences,
    responsibilities: data.responsibilities,
    responsibilityPaths: data.responsibilityPaths,
  });
}
