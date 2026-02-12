import { NextRequest, NextResponse } from "next/server";
import { getActorById, getActorByKey } from "@core/responsibility/store";
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

  const actor = (await getActorById(rawId)) ?? (await getActorByKey(rawId));
  if (actor) {
    return NextResponse.json({ ok: true, source: "directory", actor });
  }

  const snapshotsCol = await eventualitySnapshotsCol();
  const snapshot = await snapshotsCol.findOne(
    { "responsibilities.id": rawId },
    {
      projection: {
        contributionId: 1,
        locale: 1,
        responsibilities: 1,
      },
    },
  );

  const responsibility = snapshot?.responsibilities?.find((entry) => entry?.id === rawId) ?? null;
  if (!responsibility) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    source: "snapshot",
    responsibility,
    contributionId: snapshot?.contributionId ?? null,
    locale: snapshot?.locale ?? null,
  });
}
