import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCol, ObjectId } from "@core/db/triMongo";
import { z } from "zod";
import type { CreatePrepareAttachDraft } from "@/features/create/prepareAttachDraft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AttachDraftSaveSchema = z.object({
  sourceRunId: z.string().min(1).max(120),
  ctaId: z.enum(["perspektive_anhaengen", "zustimmen", "anders_sehen"]),
  attachTargetType: z.enum(["claim", "anlassraum", "dossier", "perspective"]),
  attachTargetId: z.string().min(1).max(120),
  attachTargetRef: z.string().max(400).optional().nullable(),
  sourceSummary: z.string().min(3).max(1200),
  selectedReason: z.string().max(400).optional().nullable(),
  requiresReview: z.literal(true).optional(),
  noAutoPublish: z.literal(true).optional(),
  noSilentMerge: z.literal(true).optional(),
});

type CreatePrepareAttachDraftDoc = Omit<CreatePrepareAttachDraft, "draftId"> & {
  _id?: ObjectId;
  draftId: string;
  authorId: string;
  status: "draft_intent";
  updatedAt: Date;
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  let body: z.infer<typeof AttachDraftSaveSchema>;
  try {
    body = AttachDraftSaveSchema.parse(await req.json());
  } catch (error: any) {
    const issue = error?.issues?.[0];
    const message =
      issue?.path?.[0] === "attachTargetId" || issue?.path?.[0] === "attachTargetType"
        ? "invalid_attach_target"
        : issue?.message ?? "invalid_body";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (body.attachTargetType === "anlassraum" && !ObjectId.isValid(body.attachTargetId)) {
    return NextResponse.json({ ok: false, error: "invalid_attach_target_id" }, { status: 400 });
  }

  const now = new Date();
  const _id = new ObjectId();
  const draft: CreatePrepareAttachDraftDoc = {
    _id,
    draftId: _id.toHexString(),
    authorId: userId,
    sourceRunId: body.sourceRunId,
    ctaId: body.ctaId,
    attachTargetType: body.attachTargetType,
    attachTargetId: body.attachTargetId,
    attachTargetRef: body.attachTargetRef ?? null,
    sourceSummary: body.sourceSummary.trim(),
    selectedReason: body.selectedReason?.trim() || null,
    requiresReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    createdAt: now.toISOString(),
    status: "draft_intent",
    updatedAt: now,
  };

  const Drafts = await getCol<CreatePrepareAttachDraftDoc>("create_prepare_attach_drafts");
  await Drafts.insertOne(draft);

  return NextResponse.json({
    ok: true,
    draftId: draft.draftId,
    status: draft.status,
    requiresReview: draft.requiresReview,
    noAutoPublish: draft.noAutoPublish,
    noSilentMerge: draft.noSilentMerge,
    createdAt: draft.createdAt,
    attachTargetType: draft.attachTargetType,
    attachTargetId: draft.attachTargetId,
  });
}
