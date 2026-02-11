import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, getCampaignBySlug, getCampaignStats } from "@core/campaigns";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = await context.params;
  const rawId = params?.id?.trim();
  if (!rawId) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  try {
    const campaign = (await getCampaignById(rawId)) ?? (await getCampaignBySlug(rawId));
    if (!campaign?.id) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const stats = await getCampaignStats(campaign.id);
    return NextResponse.json({ ok: true, campaign, stats });
  } catch (err: any) {
    logger.error({ msg: "admin.campaigns.stats_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
