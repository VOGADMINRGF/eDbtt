import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { saveCampaign } from "@core/campaigns";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  kind: z.enum(["community", "policy", "event", "custom"]).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  goal: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const campaign = await saveCampaign({
      id: body.id,
      slug: body.slug,
      title: body.title,
      description: body.description,
      status: body.status,
      kind: body.kind,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      goal: body.goal,
      tags: body.tags ?? [],
    });
    logger.info({ msg: "admin.campaigns.saved", id: campaign.id, status: campaign.status });
    return NextResponse.json({ ok: true, campaign });
  } catch (err: any) {
    logger.error({ msg: "admin.campaigns.save_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
