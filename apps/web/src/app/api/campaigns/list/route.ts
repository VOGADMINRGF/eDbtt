import { NextResponse, type NextRequest } from "next/server";
import { listCampaigns, getCampaignStats } from "@core/campaigns";
import { logger } from "@/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "active";
  const search = req.nextUrl.searchParams.get("q") || undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 200);

  try {
    const campaigns = await listCampaigns({ status: status as any, search, limit });
    const withStats = await Promise.all(
      campaigns.map(async (c) => ({
        ...c,
        stats: await getCampaignStats(c.id!),
      })),
    );
    return NextResponse.json({ ok: true, items: withStats });
  } catch (err: any) {
    logger.error({ msg: "campaigns.list_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
