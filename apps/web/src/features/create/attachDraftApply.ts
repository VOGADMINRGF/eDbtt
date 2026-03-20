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

type AttachTargetType = NonNullable<CreatePrepareAttachDraft["attachTargetType"]>;

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

type AnlassraumDoc = {
  _id: ObjectId;
  title?: string | null;
  summary?: string | null;
  updatedAt?: Date | null;
  createPrepareAttachDraftIds?: string[] | null;
};

type DossierDoc = {
  _id: ObjectId;
  dossierId?: string | null;
  statementId?: string | null;
  title?: string | null;
  updatedAt?: Date | null;
  createPrepareAttachDraftIds?: string[] | null;
};

type CreatePrepareAttachApplyEventDoc = {
  _id?: ObjectId;
  draftId: string;
  draftObjectId: ObjectId;
  targetType: AttachTargetType | "unknown";
  targetId: string | null;
  actorUserId: string;
  applyNote: string | null;
  createdAt: string;
  sourceRunId: string;
  ctaId: CreatePrepareAttachDraft["ctaId"];
  reviewState: CreatePrepareAttachDraftReviewState;
  applyState: CreatePrepareAttachDraftApplyState;
  result: "applied" | "failed";
  mutationType?: string | null;
  errorCode?: string | null;
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
  const draftTargetType = draft.attachTargetType;
  const draftTargetId = String(draft.attachTargetId || "").trim() || null;
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

  let applyResult: {
    targetType: AttachTargetType;
    targetId: string;
    mutationType: string;
  };
  try {
    applyResult = await dispatchApplyToTarget({
      draft,
      draftObjectId: _id,
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "attach_draft_apply_failed";
    await markFailed(errorCode);
    await writeApplyEvent({
      draft,
      draftObjectId: _id,
      targetType: draftTargetType ?? "unknown",
      targetId: draftTargetId,
      actorUserId: params.actor.userId,
      applyNote: note,
      createdAt: nowIso,
      reviewState: "accepted_for_apply",
      applyState: "apply_failed",
      result: "failed",
      mutationType: null,
      errorCode,
    });
    throw new Error(errorCode);
  }

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

  await writeApplyEvent({
    draft,
    draftObjectId: _id,
    targetType: applyResult.targetType,
    targetId: applyResult.targetId,
    actorUserId: params.actor.userId,
    applyNote: note,
    createdAt: nowIso,
    reviewState: "accepted_for_apply",
    applyState: "applied",
    result: "applied",
    mutationType: applyResult.mutationType,
    errorCode: null,
  });

  const updated = await Drafts.findOne({ _id });
  if (!updated) {
    throw new Error("attach_draft_not_found");
  }
  return mapDocToQueueItem(updated);
}

async function dispatchApplyToTarget(input: {
  draft: CreatePrepareAttachDraftDoc;
  draftObjectId: ObjectId;
}): Promise<{ targetType: AttachTargetType; targetId: string; mutationType: string }> {
  const targetType = input.draft.attachTargetType;
  const targetId = String(input.draft.attachTargetId || "").trim();
  if (!targetType || !targetId) {
    throw new Error("invalid_attach_target");
  }

  if (targetType === "claim") {
    return applyToClaim({ draft: input.draft, draftObjectId: input.draftObjectId, targetId });
  }
  if (targetType === "anlassraum") {
    return applyToAnlassraum({ draft: input.draft, draftObjectId: input.draftObjectId, targetId });
  }
  if (targetType === "dossier") {
    return applyToDossier({ draft: input.draft, draftObjectId: input.draftObjectId, targetId });
  }
  if (targetType === "perspective") {
    throw new Error("unsupported_attach_target_type");
  }
  throw new Error("unsupported_attach_target_type");
}

async function applyToClaim(input: {
  draft: CreatePrepareAttachDraftDoc;
  draftObjectId: ObjectId;
  targetId: string;
}): Promise<{ targetType: AttachTargetType; targetId: string; mutationType: string }> {
  if (!ObjectId.isValid(input.targetId)) {
    throw new Error("invalid_attach_target_id");
  }
  const targetObjectId = new ObjectId(input.targetId);
  const Proposals = await getCol<StatementProposalDoc>("statement_proposals");
  const proposal = await Proposals.findOne({ _id: targetObjectId });
  if (!proposal?._id) {
    throw new Error("attach_target_not_found");
  }
  await Proposals.updateOne(
    { _id: targetObjectId },
    {
      $addToSet: {
        createPrepareAttachDraftIds: input.draft.draftId || input.draftObjectId.toHexString(),
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );
  return {
    targetType: "claim",
    targetId: targetObjectId.toHexString(),
    mutationType: "attach_reference_claim",
  };
}

async function applyToAnlassraum(input: {
  draft: CreatePrepareAttachDraftDoc;
  draftObjectId: ObjectId;
  targetId: string;
}): Promise<{ targetType: AttachTargetType; targetId: string; mutationType: string }> {
  if (!ObjectId.isValid(input.targetId)) {
    throw new Error("invalid_attach_target_id");
  }
  const targetObjectId = new ObjectId(input.targetId);
  const Rooms = await getCol<AnlassraumDoc>("anlassraum");
  const room = await Rooms.findOne({ _id: targetObjectId });
  if (!room?._id) {
    throw new Error("attach_target_not_found");
  }
  await Rooms.updateOne(
    { _id: targetObjectId },
    {
      $addToSet: {
        createPrepareAttachDraftIds: input.draft.draftId || input.draftObjectId.toHexString(),
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );
  return {
    targetType: "anlassraum",
    targetId: targetObjectId.toHexString(),
    mutationType: "attach_reference_anlassraum",
  };
}

async function applyToDossier(input: {
  draft: CreatePrepareAttachDraftDoc;
  draftObjectId: ObjectId;
  targetId: string;
}): Promise<{ targetType: AttachTargetType; targetId: string; mutationType: string }> {
  const clauses: Record<string, unknown>[] = [{ dossierId: input.targetId }, { statementId: input.targetId }];
  if (ObjectId.isValid(input.targetId)) {
    clauses.push({ _id: new ObjectId(input.targetId) });
  }
  const Dossiers = await getCol<DossierDoc>("dossiers");
  const dossier = await Dossiers.findOne({ $or: clauses });
  if (!dossier?._id) {
    throw new Error("attach_target_not_found");
  }
  await Dossiers.updateOne(
    { _id: dossier._id },
    {
      $addToSet: {
        createPrepareAttachDraftIds: input.draft.draftId || input.draftObjectId.toHexString(),
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );
  return {
    targetType: "dossier",
    targetId: String(dossier.dossierId || dossier.statementId || dossier._id.toHexString()),
    mutationType: "attach_reference_dossier",
  };
}

async function writeApplyEvent(input: {
  draft: CreatePrepareAttachDraftDoc;
  draftObjectId: ObjectId;
  targetType: AttachTargetType | "unknown";
  targetId: string | null;
  actorUserId: string;
  applyNote: string | null;
  createdAt: string;
  reviewState: CreatePrepareAttachDraftReviewState;
  applyState: CreatePrepareAttachDraftApplyState;
  result: "applied" | "failed";
  mutationType: string | null;
  errorCode: string | null;
}) {
  const events = await getCol<CreatePrepareAttachApplyEventDoc>("create_prepare_attach_apply_events");
  await events.insertOne({
    draftId: input.draft.draftId || input.draftObjectId.toHexString(),
    draftObjectId: input.draftObjectId,
    targetType: input.targetType,
    targetId: input.targetId,
    actorUserId: input.actorUserId,
    applyNote: input.applyNote,
    createdAt: input.createdAt,
    sourceRunId: input.draft.sourceRunId,
    ctaId: input.draft.ctaId,
    reviewState: input.reviewState,
    applyState: input.applyState,
    result: input.result,
    mutationType: input.mutationType,
    errorCode: input.errorCode,
  });
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
