import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { seedCampaignsFromCurrent } from "@core/campaigns";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  force: z.boolean().optional(),
  statementLimit: z.number().int().min(1).max(20).optional(),
  roomLimit: z.number().int().min(1).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const raw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  try {
    const result = await seedCampaignsFromCurrent(parsed.data);
    logger.info({ msg: "admin.campaigns.seed", status: result.status, campaignId: result.campaignId });
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    logger.error({ msg: "admin.campaigns.seed_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
