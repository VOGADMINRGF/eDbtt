import { NextRequest, NextResponse } from "next/server";
import { campaignsCol, campaignParticipantsCol, toObjectId } from "@features/campaign/db";
import type { CampaignDoc, CampaignStatus } from "@features/campaign/types";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CampaignResponse = {
  id: string;
  title: string;
  description: string | null;
  regionCode: string | null;
  topicKey: string | null;
  status: CampaignStatus;
  supportEnabled: boolean;
  supportSlug: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: number;
};

function serializeCampaign(doc: CampaignDoc, participants = 0): CampaignResponse {
  return {
    id: doc._id ? doc._id.toString() : "",
    title: doc.title,
    description: doc.description ?? null,
    regionCode: doc.regionCode ?? null,
    topicKey: doc.topicKey ?? null,
    status: doc.status,
    supportEnabled: Boolean(doc.supportEnabled),
    supportSlug: doc.supportSlug ?? null,
    startsAt: doc.startsAt ? doc.startsAt.toISOString() : null,
    endsAt: doc.endsAt ? doc.endsAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    participants,
  };
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam === "draft" || statusParam === "active" || statusParam === "paused" || statusParam === "ended"
      ? statusParam
      : null;

  const col = await campaignsCol();
  const items = await col
    .find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const participantsCol = await campaignParticipantsCol();
  const participantCounts = await Promise.all(
    items.map(async (item) => {
      if (!item._id) return 0;
      return participantsCol.countDocuments({ campaignId: toObjectId(item._id) });
    }),
  );

  return NextResponse.json({
    ok: true,
    items: items.map((item, idx) => serializeCampaign(item, participantCounts[idx] ?? 0)),
  });
}

export async function POST(req: NextRequest) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const title = String(body?.title ?? "").trim();
  if (!title) return badRequest("missing_title");

  const status =
    body?.status === "active" || body?.status === "paused" || body?.status === "ended" ? body.status : "draft";

  const now = new Date();
  const doc: CampaignDoc = {
    title,
    description: typeof body?.description === "string" ? body.description.trim() : null,
    regionCode: typeof body?.regionCode === "string" ? body.regionCode.trim() : null,
    topicKey: typeof body?.topicKey === "string" ? body.topicKey.trim() : null,
    status,
    supportEnabled: false,
    supportSlug: null,
    startsAt: body?.startsAt ? new Date(body.startsAt) : null,
    endsAt: body?.endsAt ? new Date(body.endsAt) : null,
    createdAt: now,
    updatedAt: now,
  };

  const col = await campaignsCol();
  const result = await col.insertOne(doc);
  const inserted = await col.findOne({ _id: result.insertedId });
  if (!inserted) return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, campaign: serializeCampaign(inserted, 0) });
}
