import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { campaignsCol, campaignParticipantsCol, toObjectId } from "@features/campaign/db";
import { ObjectId } from "@core/db/triMongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

function resolveId(raw: string): ObjectId | null {
  if (!raw || !ObjectId.isValid(raw)) return null;
  return toObjectId(raw);
}

function hashAnon(seed: string) {
  return crypto.createHash("sha1").update(seed).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaignId = resolveId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  const campaigns = await campaignsCol();
  const campaign = await campaigns.findOne({ _id: campaignId });
  if (!campaign) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (campaign.status !== "active") {
    return NextResponse.json({ ok: false, error: "campaign_inactive" }, { status: 409 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    // ignore missing body
  }

  const userId = req.cookies.get("u_id")?.value ?? null;
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const anonHash = userId ? null : hashAnon(`${ip}:${req.headers.get("user-agent") ?? ""}`);

  const participants = await campaignParticipantsCol();
  const now = new Date();
  const payload = {
    campaignId,
    userId: userId ?? undefined,
    anonHash: anonHash ?? undefined,
    source: typeof body?.source === "string" ? body.source : "web",
    joinedAt: now,
  };

  if (userId) {
    await participants.updateOne(
      { campaignId, userId },
      { $setOnInsert: payload },
      { upsert: true },
    );
  } else if (anonHash) {
    await participants.updateOne(
      { campaignId, anonHash },
      { $setOnInsert: payload },
      { upsert: true },
    );
  }

  const count = await participants.countDocuments({ campaignId });

  return NextResponse.json({
    ok: true,
    campaignId: campaignId.toString(),
    participants: count,
  });
}
