export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamModerationQueueCol, streamSessionsCol } from "@features/stream/db";
import type {
  StreamModerationItemKind,
  StreamModerationItemStatus,
  StreamModerationQueueItemDoc,
} from "@features/stream/types";
import { resolveSessionStatus } from "@features/stream/types";
import { enforceStreamHost, requireCreatorContext } from "../../../utils";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

const VALID_KINDS: StreamModerationItemKind[] = [
  "claim",
  "source",
  "question",
  "option",
  "impact",
];

async function loadSession(sessionId: string) {
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(sessionId) });
}

function mapItem(item: StreamModerationQueueItemDoc) {
  return {
    ...item,
    _id: item._id?.toHexString(),
    sessionId: item.sessionId.toHexString(),
  };
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
  const col = await streamModerationQueueCol();
  const items = await col
    .find({ sessionId: new ObjectId(id) })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    ok: true,
    session: { ...session, status, _id: (session._id as ObjectId)?.toHexString?.() },
    items: items.map(mapItem),
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCreatorContext(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const gating = await enforceStreamHost(ctx);
  if (gating) return gating;
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const rl = await rateLimitOrThrow(`stream:queue:add:${ctx.userId}:${ip}`, 60, 60 * 60 * 1000, {
    salt: "stream-moderation",
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryInMs: rl.retryIn },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const session = await loadSession(id);
  if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!ctx.isStaff && session.creatorId !== ctx.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const status = resolveSessionStatus(session);
  if (status === "ended" || status === "cancelled") {
    return NextResponse.json({ ok: false, error: "session_closed" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as {
    kind?: StreamModerationItemKind;
    text?: string;
    sourceUrl?: string | null;
    notes?: string | null;
  } | null;

  const kind = body?.kind;
  if (!kind || !VALID_KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 400 });
  }
  const rawText = typeof body?.text === "string" ? body.text.trim() : "";
  if (!rawText || rawText.length < 3) {
    return NextResponse.json({ ok: false, error: "text_required" }, { status: 400 });
  }

  const now = new Date();
  const doc: StreamModerationQueueItemDoc = {
    sessionId: new ObjectId(id),
    creatorId: ctx.userId,
    kind,
    text: rawText.slice(0, 2000),
    sourceUrl: typeof body?.sourceUrl === "string" ? body.sourceUrl.trim().slice(0, 1000) : null,
    notes: typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : null,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };

  const col = await streamModerationQueueCol();
  const result = await col.insertOne(doc);
  return NextResponse.json({ ok: true, itemId: result.insertedId.toHexString() });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCreatorContext(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const gating = await enforceStreamHost(ctx);
  if (gating) return gating;

  const { id } = await context.params;
  const session = await loadSession(id);
  if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!ctx.isStaff && session.creatorId !== ctx.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    itemId?: string;
    status?: StreamModerationItemStatus;
  } | null;

  const itemId = body?.itemId;
  if (!itemId || !ObjectId.isValid(itemId)) {
    return NextResponse.json({ ok: false, error: "item_required" }, { status: 400 });
  }

  const status =
    body?.status === "approved" || body?.status === "rejected" || body?.status === "queued"
      ? body.status
      : null;
  if (!status) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const col = await streamModerationQueueCol();
  await col.updateOne(
    { _id: new ObjectId(itemId), sessionId: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true });
}
