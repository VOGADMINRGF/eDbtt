import { NextRequest, NextResponse } from "next/server";
import { campaignsCol, campaignParticipantsCol, toObjectId } from "@features/campaign/db";
import type { CampaignDoc, CampaignStatus } from "@features/campaign/types";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";
import { ObjectId } from "@core/db/triMongo";

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

function resolveId(raw: string): ObjectId | null {
  if (!raw || !ObjectId.isValid(raw)) return null;
  return toObjectId(raw);
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
  const participants = await participantsCol.countDocuments({ campaignId });

  return NextResponse.json({ ok: true, campaign: serializeCampaign(campaign, participants) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = resolveId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const patch: Partial<CampaignDoc> = {};
  if (typeof body?.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body?.description === "string") patch.description = body.description.trim();
  if (typeof body?.regionCode === "string") patch.regionCode = body.regionCode.trim();
  if (typeof body?.topicKey === "string") patch.topicKey = body.topicKey.trim();
  if (typeof body?.supportEnabled === "boolean") patch.supportEnabled = body.supportEnabled;
  if (typeof body?.supportSlug === "string") patch.supportSlug = body.supportSlug.trim() || null;
  if (body?.status === "draft" || body?.status === "active" || body?.status === "paused" || body?.status === "ended") {
    patch.status = body.status;
  }
  if (body?.startsAt) patch.startsAt = new Date(body.startsAt);
  if (body?.endsAt) patch.endsAt = new Date(body.endsAt);

  if (Object.keys(patch).length === 0) return badRequest("empty_patch");

  patch.updatedAt = new Date();

  const col = await campaignsCol();
  const updated = await col.findOneAndUpdate(
    { _id: campaignId },
    { $set: patch },
    { returnDocument: "after" },
  );

  if (!updated) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const participantsCol = await campaignParticipantsCol();
  const participants = await participantsCol.countDocuments({ campaignId });

  return NextResponse.json({ ok: true, campaign: serializeCampaign(updated, participants) });
}
