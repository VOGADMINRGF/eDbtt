import { getCol, ObjectId } from "@core/db/triMongo";
import type { GovernanceActor } from "@features/trust/types";
import {
  applyPrepareAttachDraftFailure,
  applyPrepareAttachDraftSuccess,
  isCreatePrepareAttachDraftApplyState,
  isCreatePrepareAttachDraftReviewState,
  type CreatePrepareAttachDraft,
  type CreatePrepareAttachDraftApplyState,
  type CreatePrepareAttachDraftReviewState,
} from "@/features/create/prepareAttachDraft";
import type { CreatePrepareAttachDraftQueueItem } from "@/features/create/attachDraftReviewQueue";

type CreatePrepareAttachDraftDoc = Omit<CreatePrepareAttachDraft, "draftId"> & {
  _id: ObjectId;
  draftId: string;
  authorId: string;
  status: "draft_intent";
};

type StatementProposalDoc = {
  _id: ObjectId;
  status?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  createPrepareAttachDraftIds?: string[] | null;
};

type CreatePrepareAttachApplyEventDoc = {
  _id?: ObjectId;
  draftId: string;
  draftObjectId: ObjectId;
  targetType: "claim";
  targetId: string;
  actorUserId: string;
  applyNote: string | null;
  createdAt: string;
  sourceRunId: string;
  ctaId: CreatePrepareAttachDraft["ctaId"];
  reviewState: CreatePrepareAttachDraftReviewState;
  applyState: CreatePrepareAttachDraftApplyState;
};

export async function applyCreatePrepareAttachDraft(params: {
  actor: GovernanceActor;
  draftId: string;
  applyNote?: string | null;
}) {
  assertApplyActor(params.actor);
  if (!ObjectId.isValid(params.draftId)) {
    throw new Error("invalid_attach_draft_id");
  }

  const nowIso = new Date().toISOString();
  const Drafts = await getCol<CreatePrepareAttachDraftDoc>("create_prepare_attach_drafts");
  const _id = new ObjectId(params.draftId);
  const draft = await Drafts.findOne({ _id, status: "draft_intent" });
  if (!draft) {
    throw new Error("attach_draft_not_found");
  }
  if (draft.reviewState !== "accepted_for_apply") {
    throw new Error("attach_draft_review_state_not_accepted");
  }
  if (draft.applyState === "applied") {
    throw new Error("attach_draft_already_applied");
  }

  const note = params.applyNote?.trim() || null;
  const markFailed = async (applyError: string) => {
    const failed = applyPrepareAttachDraftFailure({
      appliedAt: nowIso,
      appliedBy: params.actor.userId,
      applyNote: note,
      applyError,
    });
    await Drafts.updateOne(
      { _id },
      {
        $set: {
          ...failed,
          updatedAt: nowIso,
        },
      },
    );
  };

  if (draft.attachTargetType !== "claim") {
    await markFailed("unsupported_attach_target_type");
    throw new Error("unsupported_attach_target_type");
  }

  const targetId = String(draft.attachTargetId || "").trim();
  if (!ObjectId.isValid(targetId)) {
    await markFailed("invalid_attach_target_id");
    throw new Error("invalid_attach_target_id");
  }

  const targetObjectId = new ObjectId(targetId);
  const Proposals = await getCol<StatementProposalDoc>("statement_proposals");
  const proposal = await Proposals.findOne({ _id: targetObjectId });
  if (!proposal?._id) {
    await markFailed("attach_target_not_found");
    throw new Error("attach_target_not_found");
  }

  await Proposals.updateOne(
    { _id: targetObjectId },
    {
      $addToSet: {
        createPrepareAttachDraftIds: draft.draftId || _id.toHexString(),
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );

  const applied = applyPrepareAttachDraftSuccess({
    appliedAt: nowIso,
    appliedBy: params.actor.userId,
    applyNote: note,
  });
  await Drafts.updateOne(
    { _id },
    {
      $set: {
        ...applied,
        applyError: null,
        updatedAt: nowIso,
      },
    },
  );

  const events = await getCol<CreatePrepareAttachApplyEventDoc>("create_prepare_attach_apply_events");
  await events.insertOne({
    draftId: draft.draftId || _id.toHexString(),
    draftObjectId: _id,
    targetType: "claim",
    targetId,
    actorUserId: params.actor.userId,
    applyNote: note,
    createdAt: nowIso,
    sourceRunId: draft.sourceRunId,
    ctaId: draft.ctaId,
    reviewState: "accepted_for_apply",
    applyState: "applied",
  });

  const updated = await Drafts.findOne({ _id });
  if (!updated) {
    throw new Error("attach_draft_not_found");
  }
  return mapDocToQueueItem(updated);
}

function assertApplyActor(actor: GovernanceActor) {
  if (actor.isAdmin) return;
  if (actor.role === "reviewer") return;
  if (actor.role === "editorial_actor") return;
  throw new Error("actor_scope_forbidden");
}

function mapDocToQueueItem(doc: CreatePrepareAttachDraftDoc): CreatePrepareAttachDraftQueueItem {
  const reviewState = isCreatePrepareAttachDraftReviewState(doc.reviewState) ? doc.reviewState : "pending";
  const applyState = isCreatePrepareAttachDraftApplyState(doc.applyState)
    ? doc.applyState
    : "not_applied";
  return {
    draftId: doc.draftId || doc._id.toHexString(),
    ctaId: doc.ctaId,
    matchType: doc.matchType ?? null,
    matchEntityType: doc.matchEntityType ?? null,
    attachTargetType: doc.attachTargetType ?? null,
    attachTargetId: doc.attachTargetId ?? null,
    attachTargetLabel: doc.attachTargetLabel ?? null,
    sourceSummary: doc.sourceSummary || "",
    reasons: Array.isArray(doc.reasons) ? doc.reasons.filter(Boolean).slice(0, 12) : [],
    duplicateRisk: !!doc.duplicateRisk,
    requiresReview: true,
    reviewState,
    applyState,
    reviewNote: doc.reviewNote ?? null,
    reviewedAt: doc.reviewedAt ?? null,
    reviewedBy: doc.reviewedBy ?? null,
    appliedAt: doc.appliedAt ?? null,
    appliedBy: doc.appliedBy ?? null,
    applyNote: doc.applyNote ?? null,
    applyError: doc.applyError ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
