export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import { resolveSessionStatus } from "@features/stream/types";
import { buildStreamDeck } from "@core/streams/deck";
import { requireCreatorContext } from "../../../utils";

async function loadSession(sessionId: string) {
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(sessionId) });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCreatorContext(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const session = await loadSession(id);
  if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!ctx.isStaff && session.creatorId !== ctx.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const status = resolveSessionStatus(session);
  const deck = await buildStreamDeck(id);

  return NextResponse.json({
    ok: true,
    session: {
      ...session,
      status,
      _id: (session._id as ObjectId)?.toHexString?.(),
    },
    deck,
  });
}
