import { NextRequest, NextResponse } from "next/server";
import { eventualitySnapshotsCol } from "@core/eventualities/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const rawId = String(id ?? "").trim();
  if (!rawId) return badRequest("missing_id");

  const snapshotsCol = await eventualitySnapshotsCol();
  const snapshot = await snapshotsCol.findOne(
    { "consequences.id": rawId },
    {
      projection: {
        contributionId: 1,
        locale: 1,
        consequences: 1,
      },
    },
  );

  const consequence = snapshot?.consequences?.find((entry) => entry?.id === rawId) ?? null;
  if (!consequence) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    consequence,
    contributionId: snapshot?.contributionId ?? null,
    locale: snapshot?.locale ?? null,
  });
}
