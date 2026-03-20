import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCol, ObjectId } from "@core/db/triMongo";
import { z } from "zod";
import {
  CREATE_PREPARE_ATTACH_DRAFT_SCHEMA_VERSION,
  createInitialPrepareAttachDraftReviewFields,
  type CreatePrepareAttachDraft,
} from "@/features/create/prepareAttachDraft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AttachDraftSaveSchema = z.object({
  schemaVersion: z.string().min(1).max(64),
  sourceRunId: z.string().min(1).max(120),
  ctaId: z.enum(["perspektive_anhaengen", "zustimmen", "anders_sehen"]),
  matchType: z
    .enum(["exact_claim", "related_claim", "same_anlassraum", "related_dossier", "duplicate_risk", "no_match"])
    .nullable()
    .optional(),
  matchEntityType: z
    .enum(["claim", "anlassraum", "dossier", "perspective", "question"])
    .nullable()
    .optional(),
  attachTargetType: z.enum(["claim", "anlassraum", "dossier", "perspective"]),
  attachTargetId: z.string().min(1).max(120),
  attachTargetRef: z.string().max(400).optional().nullable(),
  attachTargetLabel: z.string().max(240).optional().nullable(),
  sourceSummary: z.string().min(3).max(1200),
  selectedReason: z.string().max(400).optional().nullable(),
  reasons: z.array(z.string().min(1).max(240)).min(1).max(12),
  sourceLanguage: z.string().min(2).max(16),
  contentLanguage: z.string().min(2).max(16),
  uiLocale: z.string().min(2).max(16),
  requiresReview: z.literal(true),
  noAutoPublish: z.literal(true),
  noSilentMerge: z.literal(true),
  originPreserved: z.literal(true),
  duplicateRisk: z.boolean(),
  userConfirmedAt: z.string().datetime().optional().nullable(),
});

type CreatePrepareAttachDraftDoc = Omit<CreatePrepareAttachDraft, "draftId"> & {
  _id?: ObjectId;
  draftId: string;
  authorId: string;
  status: "draft_intent";
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
  if (body.duplicateRisk && !body.selectedReason?.trim()) {
    return NextResponse.json(
      { ok: false, error: "duplicate_risk_requires_reason" },
      { status: 400 },
    );
  }
  if (body.schemaVersion !== CREATE_PREPARE_ATTACH_DRAFT_SCHEMA_VERSION) {
    return NextResponse.json({ ok: false, error: "invalid_schema_version" }, { status: 400 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const Drafts = await getCol<CreatePrepareAttachDraftDoc>("create_prepare_attach_drafts");
  const normalizedSummary = body.sourceSummary.trim();
  const normalizedReasons = body.reasons.map((value) => value.trim()).filter(Boolean).slice(0, 12);
  const dedupeFilter: Record<string, unknown> = {
    authorId: userId,
    schemaVersion: body.schemaVersion,
    sourceRunId: body.sourceRunId,
    ctaId: body.ctaId,
    attachTargetType: body.attachTargetType,
    attachTargetId: body.attachTargetId,
    sourceSummary: normalizedSummary,
    reviewState: "pending",
    applyState: "not_applied",
  };
  const existing = await Drafts.findOne(dedupeFilter);
  if (existing?._id) {
    return NextResponse.json({
      ok: true,
      deduped: true,
      draftId: existing.draftId,
      status: existing.status,
      requiresReview: existing.requiresReview,
      noAutoPublish: existing.noAutoPublish,
      noSilentMerge: existing.noSilentMerge,
      originPreserved: existing.originPreserved,
      duplicateRisk: existing.duplicateRisk,
      reviewState: existing.reviewState,
      applyState: existing.applyState,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      attachTargetType: existing.attachTargetType,
      attachTargetId: existing.attachTargetId,
    });
  }

  const _id = new ObjectId();
  const initialReview = createInitialPrepareAttachDraftReviewFields();
  const draft: CreatePrepareAttachDraftDoc = {
    _id,
    draftId: _id.toHexString(),
    authorId: userId,
    schemaVersion: body.schemaVersion,
    sourceRunId: body.sourceRunId,
    ctaId: body.ctaId,
    matchType: body.matchType ?? null,
    matchEntityType: body.matchEntityType ?? null,
    attachTargetType: body.attachTargetType,
    attachTargetId: body.attachTargetId,
    attachTargetRef: body.attachTargetRef ?? null,
    attachTargetLabel: body.attachTargetLabel?.trim() || null,
    sourceSummary: normalizedSummary,
    selectedReason: body.selectedReason?.trim() || null,
    reasons: normalizedReasons,
    sourceLanguage: body.sourceLanguage.trim().toLowerCase(),
    contentLanguage: body.contentLanguage.trim().toLowerCase(),
    uiLocale: body.uiLocale.trim().toLowerCase(),
    requiresReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    originPreserved: true,
    duplicateRisk: body.duplicateRisk,
    reviewState: initialReview.reviewState,
    applyState: initialReview.applyState,
    reviewNote: initialReview.reviewNote,
    reviewedAt: initialReview.reviewedAt,
    reviewedBy: initialReview.reviewedBy,
    userConfirmedAt: body.userConfirmedAt ?? null,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: "draft_intent",
  };

  await Drafts.insertOne(draft);

  return NextResponse.json({
    ok: true,
    draftId: draft.draftId,
    status: draft.status,
    requiresReview: draft.requiresReview,
    noAutoPublish: draft.noAutoPublish,
    noSilentMerge: draft.noSilentMerge,
    originPreserved: draft.originPreserved,
    duplicateRisk: draft.duplicateRisk,
    reviewState: draft.reviewState,
    applyState: draft.applyState,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    attachTargetType: draft.attachTargetType,
    attachTargetId: draft.attachTargetId,
  });
}
