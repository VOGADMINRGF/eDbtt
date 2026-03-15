import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  canManageTopicRoundMerge,
  getLatestRoundAssistSnapshot,
  getRoundBySlug,
  getTopicBySlug,
  triggerRoundAssistRun,
} from "@features/topicRound";
import { getSessionUser } from "@/lib/server/auth/sessionUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TriggerBodySchema = z
  .object({
    provider: z.string().min(1).max(80).optional(),
    model: z.string().min(1).max(120).optional(),
  })
  .strict();

function actorRoles(input?: string[] | null) {
  return Array.isArray(input) ? input.map((item) => String(item).toLowerCase()) : [];
}

async function readRoles(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    return actorRoles((user?.roles as string[] | undefined) ?? []);
  } catch {
    return [];
  }
}

async function requireMergeManager(req: NextRequest) {
  const roles = await readRoles(req);
  if (!canManageTopicRoundMerge(roles)) {
    return NextResponse.json(
      { ok: false, error: "forbidden", message: "Merge review requires management role." },
      { status: 403 },
    );
  }
  return null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const round = getRoundBySlug(slug);
  if (!round) {
    return NextResponse.json({ ok: false, error: "round_not_found" }, { status: 404 });
  }
  const topic = getTopicBySlug(round.topicSlug);
  if (!topic) {
    return NextResponse.json({ ok: false, error: "topic_not_found" }, { status: 404 });
  }

  const roles = await readRoles(req);
  const canManage = canManageTopicRoundMerge(roles);
  const snapshot = getLatestRoundAssistSnapshot(slug);

  return NextResponse.json({
    ok: true,
    canManage,
    round: {
      slug: round.slug,
      title: round.title,
      type: round.type,
      status: round.status,
    },
    topic: {
      slug: topic.slug,
      title: topic.title,
    },
    snapshot,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const denied = await requireMergeManager(req);
  if (denied) return denied;

  const { slug } = await context.params;
  const round = getRoundBySlug(slug);
  if (!round) {
    return NextResponse.json({ ok: false, error: "round_not_found" }, { status: 404 });
  }
  const topic = getTopicBySlug(round.topicSlug);
  if (!topic) {
    return NextResponse.json({ ok: false, error: "topic_not_found" }, { status: 404 });
  }

  const body = TriggerBodySchema.parse(await req.json().catch(() => ({})));
  const snapshot = triggerRoundAssistRun({
    roundSlug: round.slug,
    provider: body.provider,
    model: body.model,
  });

  return NextResponse.json({
    ok: true,
    message: "Assist suggestions prepared. Manual review required before apply.",
    snapshot,
  });
}
