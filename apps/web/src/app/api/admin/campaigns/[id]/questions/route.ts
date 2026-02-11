import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCampaignById, getCampaignBySlug, listCampaignQuestions, saveCampaignQuestion } from "@core/campaigns";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().optional(),
  prompt: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["choice", "scale", "text"]).optional(),
  options: z.array(z.string()).optional(),
  order: z.number().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

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
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const items = await listCampaignQuestions(campaign.id, status ? { status: status as any } : undefined);
    return NextResponse.json({ ok: true, campaign, items });
  } catch (err: any) {
    logger.error({ msg: "admin.campaigns.questions.list_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(
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

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  try {
    const campaign = await resolveCampaign(rawId);
    if (!campaign?.id) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const question = await saveCampaignQuestion({
      id: parsed.data.id,
      campaignId: campaign.id,
      prompt: parsed.data.prompt,
      description: parsed.data.description,
      type: parsed.data.type,
      options: parsed.data.options ?? [],
      order: parsed.data.order ?? 0,
      status: parsed.data.status,
    });
    if (!question) {
      return NextResponse.json({ ok: false, error: "unable_to_save" }, { status: 500 });
    }
    logger.info({ msg: "admin.campaigns.question.saved", id: question.id, campaignId: campaign.id });
    return NextResponse.json({ ok: true, question });
  } catch (err: any) {
    logger.error({ msg: "admin.campaigns.question.save_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
