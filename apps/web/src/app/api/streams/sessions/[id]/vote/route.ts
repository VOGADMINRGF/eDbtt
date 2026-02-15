export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamAgendaCol, streamSessionsCol } from "@features/stream/db";
import { VoteModel } from "@/models/votes/Vote";
import { createHash } from "crypto";
import { resolveSessionStatus } from "@features/stream/types";
import UserGameStats from "src/models/game/UserGameStats";

function hashSession(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 40);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const agendaCol = await streamAgendaCol();
  const sessionCol = await streamSessionsCol();
  const body = (await req.json().catch(() => null)) as { agendaItemId?: string; choice?: string } | null;
  const agendaItemId = body?.agendaItemId;
  const choice = String(body?.choice ?? "").trim();
  if (!agendaItemId || !choice) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const session = await sessionCol.findOne({ _id: new ObjectId(id) });
  const sessionStatus = session ? resolveSessionStatus(session) : "ended";
  if (!session || sessionStatus !== "live") {
    return NextResponse.json({ ok: false, error: "session_not_live" }, { status: 400 });
  }

  const item = await agendaCol.findOne({ _id: new ObjectId(agendaItemId), sessionId: new ObjectId(id) });
  if (!item || item.kind !== "poll") {
    return NextResponse.json({ ok: false, error: "poll_not_found" }, { status: 404 });
  }
  if (item.status !== "live") {
    return NextResponse.json({ ok: false, error: "poll_not_live" }, { status: 400 });
  }
  const options = item.pollOptions ?? [];
  if (!options.includes(choice)) {
    return NextResponse.json({ ok: false, error: "invalid_option" }, { status: 400 });
  }

  const userId = req.cookies.get("u_id")?.value ?? null;
  const verified = req.cookies.get("u_verified")?.value === "1";
  const requireVerified = (session as any)?.requireVerifiedParticipants !== false;
  if (requireVerified) {
    if (!userId) {
      return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
    }
    if (!verified) {
      return NextResponse.json({ ok: false, error: "verification_required" }, { status: 403 });
    }
  } else if (item.publicAttribution === "public" && !userId) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "0.0.0.0";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const sessionHash = item.allowAnonymousVoting ? hashSession(`${ip}|${ua}|${id}`) : hashSession(userId ?? `${ip}|${ua}`);
  const Vote = await VoteModel();
  const voteUpdate = await Vote.updateOne(
    {
      streamSessionId: id,
      agendaItemId,
      sessionId: sessionHash,
    },
    {
      $set: {
        statementId: agendaItemId,
        streamSessionId: id,
        agendaItemId,
        sessionId: sessionHash,
        choice,
        userHash: userId ? hashSession(userId) : undefined,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  if (userId && voteUpdate.upsertedId) {
    try {
      const eventId = `stream-vote:${id}:${agendaItemId}:${userId}`;
      await UserGameStats.awardXp(String(userId), 1, {
        eventId,
        timezone: "Europe/Berlin",
      });
    } catch (err) {
      console.error("[stream.vote] awardXp failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
