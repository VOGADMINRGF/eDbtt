import { NextResponse, type NextRequest } from "next/server";
import { getCampaignStats, listCampaigns } from "@core/campaigns";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const search = req.nextUrl.searchParams.get("q") || undefined;

  try {
    const items = await listCampaigns({ status: status as any, search, limit: 200 });
    const withStats = await Promise.all(
      items.map(async (c) => ({ ...c, stats: await getCampaignStats(c.id!) })),
    );
    return NextResponse.json({ ok: true, items: withStats });
  } catch (err: any) {
    logger.error({ msg: "admin.campaigns.list_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
