export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import type { StreamFollowUpState, StreamFollowUpStatus } from "@features/stream/types";
import { resolveSessionStatus } from "@features/stream/types";
import { enforceStreamHost, requireCreatorContext } from "../../../utils";

async function loadSession(id: string) {
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(id) });
}

const VALID_STATUSES: StreamFollowUpStatus[] = [
  "submitted",
  "in_review",
  "accepted",
  "partial",
  "rejected",
];

function sanitizeUpdate(raw: any, index: number) {
  const status = VALID_STATUSES.includes(raw?.status) ? raw.status : "submitted";
  const note = String(raw?.note ?? "").trim();
  if (!note) return null;
  const idRaw = typeof raw?.id === "string" && raw.id.trim() ? raw.id.trim() : `fu_${index + 1}`;
  const createdAtRaw = raw?.createdAt ? new Date(raw.createdAt) : new Date();
  const createdAt = isNaN(createdAtRaw.getTime()) ? new Date() : createdAtRaw;
  const link = typeof raw?.link === "string" && raw.link.trim() ? raw.link.trim().slice(0, 1000) : null;
  return { id: idRaw.slice(0, 80), status, note: note.slice(0, 1200), link, createdAt };
}

function serializeState(state: StreamFollowUpState | null | undefined) {
  if (!state) return null;
  return {
    ...state,
    updates: state.updates.map((u) => ({
      ...u,
      createdAt: u.createdAt ? u.createdAt.toISOString() : null,
    })),
    nextReminderAt: state.nextReminderAt ? state.nextReminderAt.toISOString() : null,
    updatedAt: state.updatedAt ? state.updatedAt.toISOString() : null,
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
  return NextResponse.json({
    ok: true,
    session: { ...session, status, _id: (session._id as ObjectId)?.toHexString?.() },
    state: serializeState(session.followUp),
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

  const body = (await req.json().catch(() => null)) as { state?: any } | null;
  const rawState = body?.state ?? null;
  if (!rawState) return NextResponse.json({ ok: false, error: "state_required" }, { status: 400 });

  const rawUpdates = Array.isArray(rawState?.updates) ? rawState.updates : [];
  const updates = rawUpdates
    .map((u, idx) => sanitizeUpdate(u, idx))
    .filter((u): u is NonNullable<ReturnType<typeof sanitizeUpdate>> => Boolean(u))
    .slice(0, 50);

  const nextReminderRaw = rawState?.nextReminderAt ? new Date(rawState.nextReminderAt) : null;
  const nextReminderAt =
    nextReminderRaw && !isNaN(nextReminderRaw.getTime()) ? nextReminderRaw : null;

  const next: StreamFollowUpState = {
    updates,
    nextReminderAt,
    updatedAt: new Date(),
    updatedBy: ctx.userId,
  };

  const col = await streamSessionsCol();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { followUp: next, updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true, state: serializeState(next) });
}
