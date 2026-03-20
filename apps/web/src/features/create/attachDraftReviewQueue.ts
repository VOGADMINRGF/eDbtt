import { getCol, ObjectId } from "@core/db/triMongo";
import type { GovernanceActor } from "@features/trust/types";
import {
  applyPrepareAttachDraftReviewDecision,
  isCreatePrepareAttachDraftReviewState,
  type CreatePrepareAttachDraft,
  type CreatePrepareAttachDraftReviewDecision,
  type CreatePrepareAttachDraftReviewState,
} from "@/features/create/prepareAttachDraft";

type CreatePrepareAttachDraftDoc = Omit<CreatePrepareAttachDraft, "draftId"> & {
  _id: ObjectId;
  draftId: string;
  authorId: string;
  status: "draft_intent";
};

export type CreatePrepareAttachDraftQueueItem = {
  draftId: string;
  ctaId: CreatePrepareAttachDraft["ctaId"];
  matchType: CreatePrepareAttachDraft["matchType"] | null;
  matchEntityType: CreatePrepareAttachDraft["matchEntityType"] | null;
  attachTargetType: CreatePrepareAttachDraft["attachTargetType"] | null;
  attachTargetId: string | null;
  attachTargetLabel: string | null;
  sourceSummary: string;
  reasons: string[];
  duplicateRisk: boolean;
  requiresReview: true;
  reviewState: CreatePrepareAttachDraftReviewState;
  applyState: "not_applied";
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listCreatePrepareAttachDraftQueue(params: {
  actor: GovernanceActor;
  reviewState: CreatePrepareAttachDraftReviewState | "all";
  page: number;
  pageSize: number;
  q: string;
}) {
  assertReviewQueueActor(params.actor);
  const Drafts = await getCol<CreatePrepareAttachDraftDoc>("create_prepare_attach_drafts");

  const conditions: Record<string, unknown>[] = [{ status: "draft_intent" }];
  if (params.reviewState !== "all") {
    conditions.push({ reviewState: params.reviewState });
  }
  if (params.q.trim()) {
    const pattern = new RegExp(escapeRegex(params.q.trim()).slice(0, 120), "i");
    conditions.push({
      $or: [{ sourceSummary: pattern }, { attachTargetLabel: pattern }, { attachTargetId: pattern }],
    });
  }

  const filter = conditions.length > 1 ? { $and: conditions } : conditions[0];
  const skip = (params.page - 1) * params.pageSize;
  const total = await Drafts.countDocuments(filter);
  const docs = await Drafts.find(filter).sort({ createdAt: -1 }).skip(skip).limit(params.pageSize).toArray();

  return {
    items: docs.map(mapDocToQueueItem),
    total,
  };
}

export async function reviewCreatePrepareAttachDraft(params: {
  actor: GovernanceActor;
  draftId: string;
  decision: CreatePrepareAttachDraftReviewDecision;
  reviewNote?: string | null;
}) {
  assertReviewQueueActor(params.actor);
  if (!ObjectId.isValid(params.draftId)) {
    throw new Error("invalid_attach_draft_id");
  }

  const Drafts = await getCol<CreatePrepareAttachDraftDoc>("create_prepare_attach_drafts");
  const _id = new ObjectId(params.draftId);
  const existing = await Drafts.findOne({ _id, status: "draft_intent" });
  if (!existing) {
    throw new Error("attach_draft_not_found");
  }
  if (existing.applyState && existing.applyState !== "not_applied") {
    throw new Error("attach_draft_already_applied");
  }

  const reviewedAt = new Date().toISOString();
  const reviewedBy = params.actor.userId;
  const review = applyPrepareAttachDraftReviewDecision({
    decision: params.decision,
    reviewNote: params.reviewNote ?? null,
    reviewedAt,
    reviewedBy,
  });
  await Drafts.updateOne(
    { _id },
    {
      $set: {
        ...review,
        applyState: "not_applied",
        updatedAt: reviewedAt,
      },
    },
  );

  const updated = await Drafts.findOne({ _id });
  if (!updated) {
    throw new Error("attach_draft_not_found");
  }
  return mapDocToQueueItem(updated);
}

export function normalizeCreatePrepareAttachDraftReviewState(
  value: string | null | undefined,
): CreatePrepareAttachDraftReviewState | "all" {
  const normalized = String(value || "all").toLowerCase();
  if (normalized === "all") return "all";
  if (isCreatePrepareAttachDraftReviewState(normalized)) return normalized;
  return "all";
}

function assertReviewQueueActor(actor: GovernanceActor) {
  if (actor.isAdmin) return;
  if (actor.role === "reviewer") return;
  if (actor.role === "editorial_actor") return;
  throw new Error("actor_scope_forbidden");
}

function mapDocToQueueItem(doc: CreatePrepareAttachDraftDoc): CreatePrepareAttachDraftQueueItem {
  const reviewState = isCreatePrepareAttachDraftReviewState(doc.reviewState) ? doc.reviewState : "pending";
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
    applyState: "not_applied",
    reviewNote: doc.reviewNote ?? null,
    reviewedAt: doc.reviewedAt ?? null,
    reviewedBy: doc.reviewedBy ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
