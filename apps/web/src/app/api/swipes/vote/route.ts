import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { recordSwipeVote } from "@/features/swipes/service";
import type { SwipeVotePayload } from "@/features/swipes/types";
import { registerSwipeForUser } from "@features/swipe/service";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value;

  const body = (await req.json().catch(() => ({}))) as Omit<SwipeVotePayload, "userId" | "source">;

  if (!body.statementId || !body.decision) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const anonCookie = cookieStore.get("edb_anon")?.value;
  const anonId =
    anonCookie || (typeof crypto !== "undefined" && "randomUUID" in crypto ? `anon_${crypto.randomUUID()}` : null);

  const payload: SwipeVotePayload = {
    ...body,
    userId: userId || anonId || "anon",
    source: "swipes",
  };

  const { inserted } = await recordSwipeVote(payload);

  if (inserted && userId && !body.eventualityId) {
    const direction =
      body.decision === "agree" ? "pro" : body.decision === "disagree" ? "contra" : "neutral";
    await registerSwipeForUser(userId, { statementId: body.statementId, direction });
  }

  const res = NextResponse.json({ ok: true, inserted });
  if (!userId && !anonCookie && anonId) {
    res.cookies.set("edb_anon", anonId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
