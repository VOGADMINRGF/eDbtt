export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import type {
  StreamLiveBoardOption,
  StreamLiveBoardState,
} from "@features/stream/types";
import { resolveSessionStatus } from "@features/stream/types";
import { enforceStreamHost, requireCreatorContext } from "../../../utils";

async function loadSession(id: string) {
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(id) });
}

function toList(value: any, limit = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeOption(raw: any, index: number): StreamLiveBoardOption | null {
  const title = String(raw?.title ?? "").trim();
  if (!title) return null;
  const idRaw = typeof raw?.id === "string" && raw.id.trim() ? raw.id.trim() : `opt_${index + 1}`;
  return {
    id: idRaw.slice(0, 80),
    title: title.slice(0, 140),
    pros: toList(raw?.pros, 12),
    cons: toList(raw?.cons, 12),
    sources: toList(raw?.sources, 12),
    openQuestions: toList(raw?.openQuestions, 12),
  };
}

function serializeState(state: StreamLiveBoardState | null | undefined) {
  if (!state) return null;
  return {
    ...state,
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
    state: serializeState(session.liveBoard),
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

  const title = String(rawState?.title ?? "").trim();
  if (!title) return NextResponse.json({ ok: false, error: "title_required" }, { status: 400 });

  const summary = typeof rawState?.summary === "string" ? rawState.summary.trim() : null;
  const rawOptions = Array.isArray(rawState?.options) ? rawState.options : [];
  const nextOptions = rawOptions
    .map((opt, idx) => sanitizeOption(opt, idx))
    .filter((opt): opt is StreamLiveBoardOption => Boolean(opt))
    .slice(0, 7);

  const next: StreamLiveBoardState = {
    title: title.slice(0, 140),
    summary: summary ? summary.slice(0, 800) : null,
    options: nextOptions,
    updatedAt: new Date(),
    updatedBy: ctx.userId,
  };

  const col = await streamSessionsCol();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { liveBoard: next, updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true, state: serializeState(next) });
}
