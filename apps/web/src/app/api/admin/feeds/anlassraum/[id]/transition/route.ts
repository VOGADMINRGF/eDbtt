import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { anlassraumCol } from "@features/anlassraum/db";
import {
  ANLASSRAUM_TRANSITION_ACTIONS,
  type AnlassraumTransitionAction,
  canActorAccessAnlassraum,
  transitionAnlassraumState,
} from "@features/anlassraum/governance";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
  };
  const action = String(body?.action || "").toLowerCase();
  if (!isTransitionAction(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const room = await (await anlassraumCol()).findOne({ _id: objectId });
  if (!room) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (!canActorAccessAnlassraum(room, gate.actor, action)) {
    return NextResponse.json({ ok: false, error: "forbidden_scope" }, { status: 403 });
  }

  try {
    const result = await transitionAnlassraumState({
      anlassraumId: objectId,
      action,
      actor: gate.actor,
    });

    return NextResponse.json({
      ok: true,
      item: {
        id: result.room._id?.toHexString?.() ?? "",
        status: result.room.status,
        reviewedBy: result.room.reviewedBy ?? null,
        approvedBy: result.room.approvedBy ?? null,
        isPublic: result.room.isPublic ?? false,
        updatedAt: result.room.updatedAt?.toISOString?.() ?? null,
      },
      publishGate: result.gate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "transition_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

function isTransitionAction(value: string): value is AnlassraumTransitionAction {
  return ANLASSRAUM_TRANSITION_ACTIONS.includes(value as AnlassraumTransitionAction);
}
