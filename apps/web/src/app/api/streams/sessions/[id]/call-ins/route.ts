export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamCallInsCol, streamSessionsCol } from "@features/stream/db";
import type { StreamCallInStatus, StreamCallInDoc } from "@features/stream/types";
import { resolveSessionStatus } from "@features/stream/types";
import { enforceStreamHost, requireCreatorContext } from "../../../utils";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

const VALID_STATUSES: StreamCallInStatus[] = ["invited", "ready", "live", "removed"];

async function loadSession(id: string) {
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(id) });
}

function mapItem(item: StreamCallInDoc) {
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
  const col = await streamCallInsCol();
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
  const rl = await rateLimitOrThrow(`stream:callin:add:${ctx.userId}:${ip}`, 40, 60 * 60 * 1000, {
    salt: "stream-callins",
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

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    handle?: string | null;
    channel?: string | null;
    notes?: string | null;
  } | null;

  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });

  const now = new Date();
  const doc: StreamCallInDoc = {
    sessionId: new ObjectId(id),
    creatorId: ctx.userId,
    name: name.slice(0, 120),
    handle: typeof body?.handle === "string" ? body.handle.trim().slice(0, 120) : null,
    channel: typeof body?.channel === "string" ? body.channel.trim().slice(0, 200) : null,
    notes: typeof body?.notes === "string" ? body.notes.trim().slice(0, 500) : null,
    status: "invited",
    createdAt: now,
    updatedAt: now,
  };

  const col = await streamCallInsCol();
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
    status?: StreamCallInStatus;
  } | null;

  const itemId = body?.itemId;
  if (!itemId || !ObjectId.isValid(itemId)) {
    return NextResponse.json({ ok: false, error: "item_required" }, { status: 400 });
  }
  const status = body?.status && VALID_STATUSES.includes(body.status) ? body.status : null;
  if (!status) return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });

  const col = await streamCallInsCol();
  await col.updateOne(
    { _id: new ObjectId(itemId), sessionId: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true });
}
