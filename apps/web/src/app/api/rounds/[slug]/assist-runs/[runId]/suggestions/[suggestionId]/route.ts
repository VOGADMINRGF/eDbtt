import { NextRequest, NextResponse } from "next/server";
import {
  canManageTopicRoundMerge,
  getRoundBySlug,
  getRoundAssistSnapshot,
  reviewRoundAssistSuggestion,
  RoundAssistDecisionBodySchema,
} from "@features/topicRound";
import { getSessionUser } from "@/lib/server/auth/sessionUser";

export const runtime = "nodejs";

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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string; runId: string; suggestionId: string }> },
) {
  const denied = await requireMergeManager(req);
  if (denied) return denied;

  const { slug, runId, suggestionId } = await context.params;
  const round = getRoundBySlug(slug);
  if (!round) {
    return NextResponse.json({ ok: false, error: "round_not_found" }, { status: 404 });
  }
  const run = getRoundAssistSnapshot(runId);
  if (!run) {
    return NextResponse.json({ ok: false, error: "run_not_found" }, { status: 404 });
  }

  const body = RoundAssistDecisionBodySchema.parse(await req.json().catch(() => ({})));
  let snapshot;
  try {
    snapshot = reviewRoundAssistSuggestion({
      roundSlug: slug,
      runId,
      suggestionId,
      decision: body.decision,
      editedText: body.editedText,
      linkedEntityId: body.linkedEntityId,
      reviewNote: body.reviewNote,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "review_update_failed",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    snapshot,
  });
}
