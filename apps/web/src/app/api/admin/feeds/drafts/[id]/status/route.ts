import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { voteDraftsCol } from "@features/feeds/db";
import type { VoteDraftDoc, VoteDraftStatus } from "@features/feeds/types";
import { anlassraumCol } from "@features/anlassraum/db";
import { canActorAccessAnlassraum } from "@features/anlassraum/governance";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

const ALLOWED_STATUS: VoteDraftStatus[] = ["draft", "review", "discarded"];

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const status = String(body?.status ?? "").toLowerCase() as VoteDraftStatus;
  const reviewNote = body?.reviewNote ? String(body.reviewNote).slice(0, 2000) : undefined;
  if (!ALLOWED_STATUS.includes(status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const { id } = await context.params;
  let draftId: ObjectId;
  try {
    draftId = new ObjectId(id);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const drafts = await voteDraftsCol();
  const currentDraft = await drafts.findOne({ _id: draftId });
  if (!currentDraft) {
    return NextResponse.json({ ok: false, error: "draft_not_found" }, { status: 404 });
  }

  if (currentDraft.anlassraumId) {
    const room = await (await anlassraumCol()).findOne({ _id: currentDraft.anlassraumId });
    if (room && !canActorAccessAnlassraum(room, gate.actor, "curate")) {
      return NextResponse.json({ ok: false, error: "forbidden_scope" }, { status: 403 });
    }
  } else if (gate.actor.role === "institutional_actor") {
    return NextResponse.json({ ok: false, error: "forbidden_scope" }, { status: 403 });
  }

  const now = new Date();
  const update: any = {
    status,
    updatedAt: now,
    reviewerId: gate.actor.userId,
    lastReviewAction: "set_status",
    lastReviewActionBy: gate.actor.userId,
    lastReviewActionAt: now,
  };
  if (status === "discarded") {
    update.reviewNote = reviewNote ?? null;
  } else if (reviewNote !== undefined) {
    update.reviewNote = reviewNote;
  }

  const updateResult = await drafts.findOneAndUpdate(
    { _id: draftId },
    { $set: update },
    { returnDocument: "after" },
  );
  const updatedDraft = (updateResult as { value?: VoteDraftDoc | null }).value;
  if (!updatedDraft) {
    return NextResponse.json({ ok: false, error: "draft_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    draft: {
      id: updatedDraft._id.toHexString(),
      status: updatedDraft.status,
      reviewNote: updatedDraft.reviewNote ?? null,
      updatedAt: updatedDraft.updatedAt?.toISOString?.() ?? null,
    },
  });
}
