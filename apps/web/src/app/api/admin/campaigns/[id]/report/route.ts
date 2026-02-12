import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { campaignsCol, campaignParticipantsCol, toObjectId } from "@features/campaign/db";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

function resolveId(raw: string): ObjectId | null {
  if (!raw || !ObjectId.isValid(raw)) return null;
  return toObjectId(raw);
}

type JoinBucket = { date: string; count: number };

function bucketByDay(dates: Date[], days = 14): JoinBucket[] {
  const today = new Date();
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  dates.forEach((d) => {
    const key = d.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return [...buckets.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = resolveId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  const col = await campaignsCol();
  const campaign = await col.findOne({ _id: campaignId });
  if (!campaign) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const participantsCol = await campaignParticipantsCol();
  const participants = await participantsCol
    .find({ campaignId }, { projection: { joinedAt: 1 } })
    .sort({ joinedAt: -1 })
    .toArray();

  const joins = participants
    .map((p) => (p.joinedAt instanceof Date ? p.joinedAt : p.joinedAt ? new Date(p.joinedAt) : null))
    .filter((d): d is Date => Boolean(d));

  const lastJoinedAt = joins.length > 0 ? joins[0].toISOString() : null;

  return NextResponse.json({
    ok: true,
    report: {
      campaignId: campaignId.toString(),
      participants: joins.length,
      lastJoinedAt,
      joinsByDay: bucketByDay(joins, 14),
    },
  });
}
