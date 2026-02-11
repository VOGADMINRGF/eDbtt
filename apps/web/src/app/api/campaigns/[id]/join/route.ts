import { NextRequest, NextResponse } from "next/server";
import { createCampaignSession, getCampaignById, getCampaignBySlug } from "@core/campaigns";
import { logger } from "@/utils/logger";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const rawId = id?.trim();
  if (!rawId) {
    return NextResponse.json({ ok: false, error: "missing_campaign" }, { status: 400 });
  }

  const campaign = (await getCampaignById(rawId)) ?? (await getCampaignBySlug(rawId));
  if (!campaign) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (campaign.status && campaign.status !== "active") {
    return NextResponse.json({ ok: false, error: "campaign_inactive" }, { status: 409 });
  }
  const now = new Date();
  if (campaign.startsAt && new Date(campaign.startsAt) > now) {
    return NextResponse.json({ ok: false, error: "campaign_not_started" }, { status: 409 });
  }
  if (campaign.endsAt && new Date(campaign.endsAt) < now) {
    return NextResponse.json({ ok: false, error: "campaign_ended" }, { status: 409 });
  }

  const userId = req.cookies.get("u_id")?.value ?? null;
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const rl = await rateLimitOrThrow(`campaign:join:${userId ?? ip}`, 10, 60 * 60 * 1000, {
    salt: "campaign-join",
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryInMs: rl.retryIn },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const session = await createCampaignSession({
    campaignId: campaign.id!,
    userId,
    source: body?.source ?? "link",
    regionCode: body?.regionCode ?? null,
    meta: body?.meta ?? undefined,
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "unable_to_join" }, { status: 500 });
  }

  logger.info({ msg: "campaign.joined", campaignId: campaign.id, sessionId: session.id, userId });
  return NextResponse.json({ ok: true, campaign, session });
}
