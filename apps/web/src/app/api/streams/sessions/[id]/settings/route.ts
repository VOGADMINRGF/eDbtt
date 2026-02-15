export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import { resolveSessionStatus } from "@features/stream/types";
import { enforceStreamHost, requireCreatorContext } from "../../../utils";

async function loadSession(id: string) {
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(id) });
}

function normalizeBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
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
  return NextResponse.json({
    ok: true,
    session: { ...session, status, _id: (session._id as ObjectId)?.toHexString?.() },
    settings: {
      supportEnabled: Boolean(session.supportEnabled),
      supportBlind: Boolean(session.supportBlind),
      recordingAllowed: Boolean(session.recordingAllowed),
      requireVerifiedParticipants: session.requireVerifiedParticipants !== false,
      hideViewerCount: session.hideViewerCount !== false,
    },
  });
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
    supportEnabled?: boolean;
    supportBlind?: boolean;
    recordingAllowed?: boolean;
    requireVerifiedParticipants?: boolean;
    hideViewerCount?: boolean;
  } | null;

  const patch: Record<string, boolean> = {};
  const supportEnabled = normalizeBool(body?.supportEnabled);
  const supportBlind = normalizeBool(body?.supportBlind);
  const recordingAllowed = normalizeBool(body?.recordingAllowed);
  const requireVerifiedParticipants = normalizeBool(body?.requireVerifiedParticipants);
  const hideViewerCount = normalizeBool(body?.hideViewerCount);

  if (supportEnabled !== null) patch.supportEnabled = supportEnabled;
  if (supportBlind !== null) patch.supportBlind = supportBlind;
  if (recordingAllowed !== null) patch.recordingAllowed = recordingAllowed;
  if (requireVerifiedParticipants !== null) patch.requireVerifiedParticipants = requireVerifiedParticipants;
  if (hideViewerCount !== null) patch.hideViewerCount = hideViewerCount;

  const col = await streamSessionsCol();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true });
}
