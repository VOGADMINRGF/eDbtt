import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, getCampaignBySlug, listCampaignQuestions } from "@core/campaigns";
import { logger } from "@/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCampaign(id: string) {
  return (await getCampaignById(id)) ?? (await getCampaignBySlug(id));
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const rawId = params?.id?.trim();
  if (!rawId) {
    return NextResponse.json({ ok: false, error: "missing_campaign" }, { status: 400 });
  }

  try {
    const campaign = await resolveCampaign(rawId);
    if (!campaign?.id) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const items = await listCampaignQuestions(campaign.id, { status: "active" });
    return NextResponse.json({ ok: true, campaign, items });
  } catch (err: any) {
    logger.error({ msg: "campaigns.questions.list_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
