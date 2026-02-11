import { NextRequest, NextResponse } from "next/server";
import {
  createCampaignResponse,
  getCampaignById,
  getCampaignBySlug,
  getCampaignSessionById,
  listCampaignQuestions,
} from "@core/campaigns";
import { logger } from "@/utils/logger";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCampaign(id: string) {
  return (await getCampaignById(id)) ?? (await getCampaignBySlug(id));
}

type AnswerInput = {
  questionId: string;
  answer: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const rawId = params?.id?.trim();
  if (!rawId) {
    return NextResponse.json({ ok: false, error: "missing_campaign" }, { status: 400 });
  }

  const campaign = await resolveCampaign(rawId);
  if (!campaign?.id) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const rl = await rateLimitOrThrow(`campaign:respond:${campaign.id}:${ip}`, 40, 60 * 60 * 1000, {
    salt: "campaign-response",
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited", retryInMs: rl.retryIn }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const answersRaw = Array.isArray(body?.answers) ? (body.answers as AnswerInput[]) : [];
  if (!sessionId || answersRaw.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_answers" }, { status: 400 });
  }

  const session = await getCampaignSessionById(sessionId);
  if (!session || session.campaignId !== campaign.id) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 404 });
  }

  const questions = await listCampaignQuestions(campaign.id, { status: "active" });
  const questionMap = new Map(questions.map((q) => [q.id!, q]));

  try {
    const results = [];
    for (const answer of answersRaw) {
      if (!answer?.questionId || typeof answer?.answer !== "string") continue;
      const question = questionMap.get(answer.questionId);
      if (!question) continue;
      const trimmed = answer.answer.trim();
      if (!trimmed) continue;
      if (question.options?.length && !question.options.includes(trimmed)) continue;

      const saved = await createCampaignResponse({
        campaignId: campaign.id,
        questionId: answer.questionId,
        sessionId,
        answer: trimmed,
      });
      if (saved) results.push(saved);
    }

    logger.info({
      msg: "campaign.responses.saved",
      campaignId: campaign.id,
      sessionId,
      count: results.length,
    });
    return NextResponse.json({ ok: true, saved: results.length });
  } catch (err: any) {
    logger.error({ msg: "campaign.responses.failed", err: err?.message, campaignId: campaign.id });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
