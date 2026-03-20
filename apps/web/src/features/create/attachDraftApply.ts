import { getCol, ObjectId } from "@core/db/triMongo";
import type { GovernanceActor } from "@features/trust/types";
import { createApplyHistoryEvent, type CreatePrepareAttachDraftErrorCode } from "@/features/create/attachDraftHistory";
import { createPrepareAttachDraftsCol, createPrepareAttachHistoryEventsCol } from "@/features/create/attachDraftCollections";
import type { CreatePrepareAttachDraftQueueItem } from "@/features/create/attachDraftReviewQueue";
import {
  applyPrepareAttachDraftFailure,
  applyPrepareAttachDraftSuccess,
  isCreatePrepareAttachDraftApplyState,
  isCreatePrepareAttachDraftReviewState,
  normalizeCreatePrepareAttachDraftVersion,
  type CreatePrepareAttachDraft,
  type CreatePrepareAttachDraftApplyState,
  type CreatePrepareAttachDraftReviewState,
} from "@/features/create/prepareAttachDraft";

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
  const Drafts = await createPrepareAttachDraftsCol();
  const _id = new ObjectId(params.draftId);
  const draft = (await Drafts.findOne({ _id, status: "draft_intent" })) as CreatePrepareAttachDraftDoc | null;
  if (!draft) {
    throw new Error("attach_draft_not_found");
  }
  if (draft.reviewState !== "accepted_for_apply") {
    throw new Error("attach_draft_review_state_not_accepted");
  }
  if (draft.applyState === "applied") {
    throw new Error("attach_draft_already_applied");
  }

  const draftId = draft.draftId || _id.toHexString();
  const note = params.applyNote?.trim() || null;
  const previousReviewState = isCreatePrepareAttachDraftReviewState(draft.reviewState)
    ? draft.reviewState
    : "pending";
  const previousApplyState = isCreatePrepareAttachDraftApplyState(draft.applyState)
    ? draft.applyState
    : "not_applied";
  const expectedVersion = normalizeCreatePrepareAttachDraftVersion((draft as Record<string, unknown>).version);

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
    const errorCode = toAttachDraftErrorCode(error);
    const failed = applyPrepareAttachDraftFailure({
      appliedAt: nowIso,
      appliedBy: params.actor.userId,
      applyNote: note,
      applyError: errorCode,
    });
    const updateRes = await Drafts.updateOne(
      {
        _id,
        status: "draft_intent",
        reviewState: previousReviewState,
        applyState: previousApplyState,
        $or: [{ version: expectedVersion }, { version: { $exists: false } }],
      },
      {
        $set: {
          ...failed,
          version: expectedVersion + 1,
          updatedAt: nowIso,
        },
      },
    );
    if (updateRes.modifiedCount !== 1) {
      throw new Error("attach_draft_state_conflict");
    }
    await (await createPrepareAttachHistoryEventsCol()).insertOne(
      createApplyHistoryEvent({
        draftId,
        actorUserId: params.actor.userId,
        targetType: normalizeTargetTypeOrUnknown(draft.attachTargetType),
        targetId: String(draft.attachTargetId || "").trim() || null,
        result: "failed",
        applyNote: note,
        mutationType: null,
        errorCode,
        previousReviewState,
        nextReviewState: previousReviewState,
        previousApplyState,
        nextApplyState: "apply_failed",
        createdAt: nowIso,
      }),
    );
    throw new Error(errorCode);
  }

  const applied = applyPrepareAttachDraftSuccess({
    appliedAt: nowIso,
    appliedBy: params.actor.userId,
    applyNote: note,
  });
  const appliedRes = await Drafts.updateOne(
    {
      _id,
      status: "draft_intent",
      reviewState: previousReviewState,
      applyState: previousApplyState,
      $or: [{ version: expectedVersion }, { version: { $exists: false } }],
    },
    {
      $set: {
        ...applied,
        applyError: null,
        version: expectedVersion + 1,
        updatedAt: nowIso,
      },
    },
  );
  if (appliedRes.modifiedCount !== 1) {
    throw new Error("attach_draft_state_conflict");
  }

  await (await createPrepareAttachHistoryEventsCol()).insertOne(
    createApplyHistoryEvent({
      draftId,
      actorUserId: params.actor.userId,
      targetType: applyResult.targetType,
      targetId: applyResult.targetId,
      result: "applied",
      applyNote: note,
      mutationType: applyResult.mutationType,
      errorCode: null,
      previousReviewState,
      nextReviewState: previousReviewState,
      previousApplyState,
      nextApplyState: "applied",
      createdAt: nowIso,
    }),
  );

  const updated = (await Drafts.findOne({ _id })) as CreatePrepareAttachDraftDoc | null;
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
    version: normalizeCreatePrepareAttachDraftVersion((doc as Record<string, unknown>).version),
    reviewEvents: [],
    applyEvents: [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toAttachDraftErrorCode(error: unknown): CreatePrepareAttachDraftErrorCode {
  const message = error instanceof Error ? error.message : "attach_draft_apply_failed";
  if (
    message === "invalid_attach_draft_id" ||
    message === "attach_draft_not_found" ||
    message === "actor_scope_forbidden" ||
    message === "attach_draft_review_state_not_accepted" ||
    message === "attach_draft_already_applied" ||
    message === "unsupported_attach_target_type" ||
    message === "invalid_attach_target" ||
    message === "invalid_attach_target_id" ||
    message === "attach_target_not_found" ||
    message === "attach_draft_state_conflict"
  ) {
    return message;
  }
  return "invalid_attach_target";
}

function normalizeTargetTypeOrUnknown(value: string | null | undefined): CreatePrepareAttachDraft["attachTargetType"] | "unknown" {
  if (value === "claim" || value === "anlassraum" || value === "dossier" || value === "perspective") {
    return value;
  }
  return "unknown";
}

