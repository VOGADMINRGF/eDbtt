export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import type {
  StreamDeliberationPhase,
  StreamDeliberationState,
} from "@features/stream/types";
import { resolveSessionStatus } from "@features/stream/types";
import { enforceStreamHost, requireCreatorContext } from "../../../utils";

const PHASES: StreamDeliberationPhase[] = [
  "mandate",
  "input",
  "round_a",
  "round_b",
  "round_c",
  "plenum",
  "vote",
  "follow_up",
];

function normalizeState(state?: StreamDeliberationState | null): StreamDeliberationState {
  return {
    enabled: Boolean(state?.enabled),
    phase: state?.phase && PHASES.includes(state.phase) ? state.phase : "mandate",
    round: typeof state?.round === "number" && state.round > 0 ? Math.floor(state.round) : 1,
    roundEndsAt: state?.roundEndsAt ?? null,
    fairnessMode: state?.fairnessMode === "rotation" ? "rotation" : "off",
    rotationIntervalMinutes:
      typeof state?.rotationIntervalMinutes === "number" && Number.isFinite(state.rotationIntervalMinutes)
        ? Math.max(0, Math.round(state.rotationIntervalMinutes))
        : null,
    updatedAt: state?.updatedAt ?? null,
    updatedBy: state?.updatedBy ?? null,
  };
}

function serializeState(state: StreamDeliberationState) {
  return {
    ...state,
    roundEndsAt: state.roundEndsAt ? state.roundEndsAt.toISOString() : null,
    updatedAt: state.updatedAt ? state.updatedAt.toISOString() : null,
  };
}

async function loadSession(id: string) {
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireCreatorContext(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }
  const session = await loadSession(id);
  if (!session) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!ctx.isStaff && session.creatorId !== ctx.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const state = normalizeState(session.deliberation);
  return NextResponse.json({ ok: true, state: serializeState(state) });
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
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }
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
    enabled?: boolean;
    phase?: StreamDeliberationPhase;
    round?: number;
    roundMinutes?: number | null;
    fairnessMode?: "off" | "rotation";
    rotationMinutes?: number | null;
  } | null;

  const current = normalizeState(session.deliberation);
  const next: StreamDeliberationState = {
    ...current,
    enabled: typeof body?.enabled === "boolean" ? body.enabled : current.enabled,
    phase: body?.phase && PHASES.includes(body.phase) ? body.phase : current.phase,
    round:
      typeof body?.round === "number" && Number.isFinite(body.round) && body.round > 0
        ? Math.floor(body.round)
        : current.round,
    roundEndsAt: current.roundEndsAt ?? null,
    fairnessMode: body?.fairnessMode === "rotation" ? "rotation" : current.fairnessMode ?? "off",
    rotationIntervalMinutes: current.rotationIntervalMinutes ?? null,
    updatedAt: new Date(),
    updatedBy: ctx.userId,
  };

  if (typeof body?.roundMinutes === "number" && Number.isFinite(body.roundMinutes)) {
    if (body.roundMinutes <= 0) {
      next.roundEndsAt = null;
    } else {
      next.roundEndsAt = new Date(Date.now() + body.roundMinutes * 60_000);
    }
  } else if (body?.roundMinutes === null) {
    next.roundEndsAt = null;
  }

  if (typeof body?.rotationMinutes === "number" && Number.isFinite(body.rotationMinutes)) {
    next.rotationIntervalMinutes = body.rotationMinutes <= 0 ? null : Math.round(body.rotationMinutes);
  } else if (body?.rotationMinutes === null) {
    next.rotationIntervalMinutes = null;
  }

  const col = await streamSessionsCol();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { deliberation: next, updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true, state: serializeState(next) });
}
