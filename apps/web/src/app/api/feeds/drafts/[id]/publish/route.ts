import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { voteDraftsCol } from "@features/feeds/db";
import { publishVoteDraft } from "@features/feeds/publishVoteDraft";
import { anlassraumCol } from "@features/anlassraum/db";
import {
  canActorAccessAnlassraum,
  getAnlassraumPublishGate,
} from "@features/anlassraum/governance";
import { canRoleApprove } from "@features/trust/gates";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  if (!canRoleApprove(gate.actor.role) && !gate.actor.isAdmin) {
    return NextResponse.json({ ok: false, error: "actor_cannot_publish" }, { status: 403 });
  }

  const draft = await (await voteDraftsCol()).findOne({ _id: new ObjectId(id) });
  if (!draft) {
    return NextResponse.json({ ok: false, error: "draft_not_found" }, { status: 404 });
  }
  if (!draft.anlassraumId) {
    return NextResponse.json({ ok: false, error: "anlassraum_required_before_publish" }, { status: 400 });
  }

  const room = await (await anlassraumCol()).findOne({ _id: draft.anlassraumId });
  if (!room) {
    return NextResponse.json({ ok: false, error: "anlassraum_not_found" }, { status: 404 });
  }
  if (!canActorAccessAnlassraum(room, gate.actor, "activate")) {
    return NextResponse.json({ ok: false, error: "forbidden_scope" }, { status: 403 });
  }

  const publishGate = await getAnlassraumPublishGate(draft.anlassraumId);
  if (!publishGate.ok) {
    return NextResponse.json(
      { ok: false, error: `publish_gate_failed:${publishGate.reasons.join(",")}`, publishGate },
      { status: 400 },
    );
  }

  const out = await publishVoteDraft(id);
  if (!out.ok) {
    const status = out.error === "draft_not_found" ? 404 : 400;
    return NextResponse.json(out, { status });
  }

  return NextResponse.json({
    ...out,
    publishGate,
  });
}
