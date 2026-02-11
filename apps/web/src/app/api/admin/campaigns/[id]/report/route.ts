import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, getCampaignBySlug, getCampaignReport, getCampaignStats } from "@core/campaigns";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCampaign(id: string) {
  return (await getCampaignById(id)) ?? (await getCampaignBySlug(id));
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = await context.params;
  const rawId = params?.id?.trim();
  if (!rawId) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  try {
    const campaign = await resolveCampaign(rawId);
    if (!campaign?.id) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const report = await getCampaignReport(campaign.id);
    const stats = await getCampaignStats(campaign.id);
    return NextResponse.json({ ok: true, campaign, report, stats });
  } catch (err: any) {
    logger.error({ msg: "admin.campaigns.report_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
