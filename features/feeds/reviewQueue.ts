import { ObjectId } from "@core/db/triMongo";
import { buildRegionKey, normalizeRegionCode } from "@core/regions/types";
import { anlassraumCol, anlassraumSourceLinksCol, anlassraumStructureCol } from "@features/anlassraum/db";
import {
  assertActorCanAccessAnlassraum,
  assertActorCanCreateAnlassraum,
} from "@features/anlassraum/governance";
import { createManualAnlassraum } from "@features/anlassraum/service";
import type {
  AnlassraumDoc,
  AnlassraumOriginType,
  AnlassraumScope,
  AnlassraumSourceRole,
  AnlassraumType,
} from "@features/anlassraum/types";
import { ensureSystemEntityForRegion } from "@features/entities/service";
import { normalizeGermanSlug } from "@features/common/utils/textNormalization";
import type { GovernanceActor, RoomType } from "@features/trust/types";
import { pathFromFeedReviewAction } from "./signalDecisioning";
import { analyzeResultsCol, statementCandidatesCol, voteDraftsCol } from "./db";
import type {
  FeedReviewState,
  StatementCandidate,
  StatementCandidateAnalyzeResultDoc,
  VoteDraftStatus,
  VoteDraftDoc,
} from "./types";

export const FEED_REVIEW_ACTIONS = [
  "ignore",
  "attach_to_anlassraum",
  "create_anlassraum_candidate",
  "mark_as_weak_signal",
] as const;

export type FeedReviewAction = (typeof FEED_REVIEW_ACTIONS)[number];
export const FEED_REVIEW_QUEUE_SORTS = [
  "newest",
  "oldest",
  "review_recent",
  "review_stale",
  "priority_high",
] as const;
export type FeedReviewQueueSort = (typeof FEED_REVIEW_QUEUE_SORTS)[number];
export type FeedQueueLinkFilter = "all" | "linked" | "unlinked";
export type FeedQueueWeakSignalFilter = "all" | "flagged" | "clear";
export type FeedQueuePriorityBucket = "high" | "medium" | "low";

export type FeedQueueMeta = {
  priorityScore: number;
  priorityBucket: FeedQueuePriorityBucket;
  pendingHours: number;
  needsAnlassraumBackfill: boolean;
  reasons: string[];
};

export type ApplyFeedReviewActionInput = {
  draftId: ObjectId | string;
  actor: GovernanceActor;
  action: FeedReviewAction;
  reviewNote?: string | null;
  weakSignalReason?: string | null;
  sourceRole?: AnlassraumSourceRole;
  sourceWeight?: number;
  anlassraumId?: ObjectId | string | null;
  ownerType?: AnlassraumDoc["ownerType"];
  ownerId?: string | null;
  roomType?: RoomType;
  originType?: AnlassraumOriginType;
  entityId?: ObjectId | string | null;
  type?: AnlassraumType;
  scope?: AnlassraumScope;
  decisionScope?: AnlassraumScope;
};

export type FeedReviewActionResult = {
  draft: VoteDraftDoc;
  anlassraumId: ObjectId | null;
  feedReviewState: FeedReviewState;
  createdAnlassraum: boolean;
};

export type BulkFeedReviewActionInput = Omit<ApplyFeedReviewActionInput, "draftId"> & {
  draftIds: Array<ObjectId | string>;
  continueOnError?: boolean;
};

export type BulkFeedReviewActionItemResult = {
  draftId: string;
  ok: boolean;
  error?: string;
  anlassraumId?: string | null;
  feedReviewState?: FeedReviewState;
  createdAnlassraum?: boolean;
};

export type BulkFeedReviewActionResult = {
  action: FeedReviewAction;
  results: BulkFeedReviewActionItemResult[];
  successCount: number;
  failureCount: number;
};

export type ListLegacyVoteDraftsInput = {
  actor: GovernanceActor;
  limit?: number;
  status?: VoteDraftStatus | "all";
  reviewState?: FeedReviewState | "all";
};

export type LegacyVoteDraftSummary = {
  id: string;
  title: string;
  status: VoteDraftStatus;
  regionCode: VoteDraftDoc["regionCode"] | null;
  anlassraumId: string | null;
  feedReviewState: FeedReviewState;
  weakSignalFlagged: boolean;
  weakSignalReason: string | null;
  reviewNote: string | null;
  lastReviewAction: string | null;
  lastReviewActionBy: string | null;
  lastReviewActionAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  queueMeta: FeedQueueMeta;
};

export type BackfillVoteDraftAnlassraumInput = Omit<ApplyFeedReviewActionInput, "action"> & {
  mode: "attach" | "create_candidate";
};

export type BackfillVoteDraftAnlassraumResult = {
  draftId: string;
  mode: "attach" | "create_candidate";
  remediationKind: "attached_existing_anlassraum" | "created_candidate_anlassraum";
  result: FeedReviewActionResult;
};

export async function applyFeedReviewAction(
  input: ApplyFeedReviewActionInput,
): Promise<FeedReviewActionResult> {
  const draftId = toObjectId(input.draftId);
  const drafts = await voteDraftsCol();
  const draft = await drafts.findOne({ _id: draftId });
  if (!draft) {
    throw new Error("draft_not_found");
  }

  const [candidate, analyzeResult] = await Promise.all([
    (await statementCandidatesCol()).findOne({ _id: draft.statementCandidateId }),
    (await analyzeResultsCol()).findOne({ _id: draft.analyzeResultId }),
  ]);

  if (!candidate) {
    throw new Error("candidate_not_found");
  }
  if (!analyzeResult) {
    throw new Error("analyze_result_not_found");
  }

  let existingDraftAnlassraumId: ObjectId | null = null;
  if (draft.anlassraumId) {
    const existingRoom = await (await anlassraumCol()).findOne({ _id: draft.anlassraumId });
    if (existingRoom) {
      assertActorCanAccessAnlassraum(existingRoom, input.actor, "read");
      existingDraftAnlassraumId = existingRoom._id as ObjectId;
    }
  }

  let effectiveAction: FeedReviewAction = input.action;
  let attachTargetId: ObjectId | null = null;

  if (input.action === "attach_to_anlassraum") {
    if (!input.anlassraumId) {
      throw new Error("anlassraum_id_required");
    }
    attachTargetId = toObjectId(input.anlassraumId);
  }

  const preferredPath = pathFromFeedReviewAction({
    action: input.action,
    hasExistingAnlassraum: !!existingDraftAnlassraumId,
  });
  if (
    input.action === "create_anlassraum_candidate" &&
    preferredPath === "attach_to_existing_anlassraum" &&
    existingDraftAnlassraumId
  ) {
    effectiveAction = "attach_to_anlassraum";
    attachTargetId = existingDraftAnlassraumId;
  }

  if (effectiveAction === "ignore") {
    const updated = await updateDraftReviewFields(draftId, {
      status: "discarded",
      reviewNote: normalizeReviewNote(input.reviewNote),
      feedReviewState: "ignored",
      weakSignal: null,
      lastReviewAction: effectiveAction,
      lastReviewActionBy: input.actor.userId,
      lastReviewActionAt: new Date(),
    });
    return {
      draft: updated,
      anlassraumId: updated.anlassraumId ?? null,
      feedReviewState: "ignored",
      createdAnlassraum: false,
    };
  }

  if (effectiveAction === "mark_as_weak_signal") {
    const reason = normalizeWeakSignalReason(input.weakSignalReason);
    if (draft.anlassraumId) {
      await markAnlassraumWeakSignal(draft.anlassraumId, reason);
    }

    const updated = await updateDraftReviewFields(draftId, {
      status: draft.status === "published" ? "published" : "review",
      feedReviewState: "weak_signal",
      reviewNote: normalizeReviewNote(input.reviewNote),
      weakSignal: {
        flagged: true,
        reason,
        flaggedBy: input.actor.userId,
        flaggedAt: new Date(),
      },
      lastReviewAction: effectiveAction,
      lastReviewActionBy: input.actor.userId,
      lastReviewActionAt: new Date(),
    });
    return {
      draft: updated,
      anlassraumId: updated.anlassraumId ?? null,
      feedReviewState: "weak_signal",
      createdAnlassraum: false,
    };
  }

  if (effectiveAction === "attach_to_anlassraum") {
    if (!attachTargetId) {
      throw new Error("anlassraum_id_required");
    }
    const targetId = attachTargetId;
    const targetRoom = await (await anlassraumCol()).findOne({ _id: targetId });
    if (!targetRoom) {
      throw new Error("anlassraum_not_found");
    }
    assertActorCanAccessAnlassraum(targetRoom, input.actor, "curate");

    await attachCandidateToAnlassraum({
      anlassraumId: targetId,
      draft,
      candidate,
      analyzeResult,
      sourceRole: input.sourceRole ?? "supporting",
      sourceWeight: normalizeSourceWeight(input.sourceWeight),
    });

    const updated = await updateDraftReviewFields(draftId, {
      anlassraumId: targetId,
      status: draft.status === "published" ? "published" : "review",
      reviewNote: normalizeReviewNote(input.reviewNote),
      feedReviewState: "attached",
      weakSignal: draft.weakSignal ?? null,
      lastReviewAction: effectiveAction,
      lastReviewActionBy: input.actor.userId,
      lastReviewActionAt: new Date(),
    });
    return {
      draft: updated,
      anlassraumId: targetId,
      feedReviewState: "attached",
      createdAnlassraum: false,
    };
  }

  const targetId = await ensureAnlassraumCandidate({
    draft,
    candidate,
    actor: input.actor,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    roomType: input.roomType,
    originType: input.originType,
    entityId: input.entityId,
    type: input.type,
    scope: input.scope,
    decisionScope: input.decisionScope,
  });

  await attachCandidateToAnlassraum({
    anlassraumId: targetId,
    draft,
    candidate,
    analyzeResult,
    sourceRole: input.sourceRole ?? "primary",
    sourceWeight: normalizeSourceWeight(input.sourceWeight),
  });

  const updated = await updateDraftReviewFields(draftId, {
    anlassraumId: targetId,
    status: draft.status === "published" ? "published" : "review",
    reviewNote: normalizeReviewNote(input.reviewNote),
    feedReviewState: "candidate_created",
    weakSignal: draft.weakSignal ?? null,
    lastReviewAction: effectiveAction,
    lastReviewActionBy: input.actor.userId,
    lastReviewActionAt: new Date(),
  });

  return {
    draft: updated,
    anlassraumId: targetId,
    feedReviewState: "candidate_created",
    createdAnlassraum: !draft.anlassraumId,
  };
}

export async function applyBulkFeedReviewAction(
  input: BulkFeedReviewActionInput,
): Promise<BulkFeedReviewActionResult> {
  const uniqueDraftIds = Array.from(
    new Set(
      input.draftIds
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
  if (!uniqueDraftIds.length) {
    throw new Error("draft_ids_required");
  }
  if (uniqueDraftIds.length > 100) {
    throw new Error("too_many_draft_ids");
  }

  const results: BulkFeedReviewActionItemResult[] = [];
  for (const rawId of uniqueDraftIds) {
    if (!ObjectId.isValid(rawId)) {
      results.push({
        draftId: rawId,
        ok: false,
        error: "invalid_draft_id",
      });
      if (!input.continueOnError) break;
      continue;
    }

    try {
      const outcome = await applyFeedReviewAction({
        ...input,
        draftId: new ObjectId(rawId),
      });
      results.push({
        draftId: rawId,
        ok: true,
        anlassraumId: outcome.anlassraumId?.toHexString() ?? null,
        feedReviewState: outcome.feedReviewState,
        createdAnlassraum: outcome.createdAnlassraum,
      });
    } catch (error: unknown) {
      results.push({
        draftId: rawId,
        ok: false,
        error: error instanceof Error ? error.message : "bulk_action_failed",
      });
      if (!input.continueOnError) break;
    }
  }

  const successCount = results.filter((entry) => entry.ok).length;
  return {
    action: input.action,
    results,
    successCount,
    failureCount: results.length - successCount,
  };
}

export function buildFeedQueueMeta(draft: VoteDraftDoc): FeedQueueMeta {
  const now = Date.now();
  const updated = draft.lastReviewActionAt ?? draft.updatedAt ?? draft.createdAt ?? null;
  const pendingHours = updated ? Math.max(0, (now - updated.getTime()) / 36e5) : 0;
  const reasons: string[] = [];
  let priorityScore = 0;

  const state = draft.feedReviewState ?? "queued";
  if (state === "queued") {
    priorityScore += 24;
    reasons.push("queued_unreviewed");
  }
  if (draft.status === "draft") {
    priorityScore += 20;
    reasons.push("status_draft");
  } else if (draft.status === "review") {
    priorityScore += 12;
    reasons.push("status_review");
  }
  if (!draft.anlassraumId) {
    priorityScore += 22;
    reasons.push("missing_anlassraum_link");
  }
  if (draft.weakSignal?.flagged) {
    priorityScore += 8;
    reasons.push("weak_signal_flagged");
  }
  if (pendingHours >= 72) {
    priorityScore += 18;
    reasons.push("stale_72h_plus");
  } else if (pendingHours >= 24) {
    priorityScore += 10;
    reasons.push("stale_24h_plus");
  }
  if (!draft.lastReviewActionAt) {
    priorityScore += 8;
    reasons.push("never_reviewed");
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(priorityScore)));
  const priorityBucket: FeedQueuePriorityBucket =
    boundedScore >= 60 ? "high" : boundedScore >= 35 ? "medium" : "low";

  return {
    priorityScore: boundedScore,
    priorityBucket,
    pendingHours: Number(pendingHours.toFixed(1)),
    needsAnlassraumBackfill: !draft.anlassraumId,
    reasons,
  };
}

export async function listLegacyVoteDraftsWithoutAnlassraumAuthorized(
  input: ListLegacyVoteDraftsInput,
): Promise<LegacyVoteDraftSummary[]> {
  assertLegacyBackfillActor(input.actor);
  const limit = Math.max(1, Math.min(200, Number(input.limit ?? 100)));
  const status = normalizeLegacyStatusFilter(input.status);
  const reviewState = normalizeLegacyReviewState(input.reviewState);

  const filter: Record<string, unknown> = {
    $or: [{ anlassraumId: { $exists: false } }, { anlassraumId: null }],
  };
  if (status !== "all") filter.status = status;
  if (reviewState !== "all") filter.feedReviewState = reviewState;

  const drafts = await voteDraftsCol();
  const docs = await drafts
    .find(filter)
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  return docs.map((draft) => ({
    id: draft._id?.toHexString?.() ?? "",
    title: draft.title,
    status: draft.status,
    regionCode: draft.regionCode ?? null,
    anlassraumId: draft.anlassraumId?.toHexString?.() ?? null,
    feedReviewState: draft.feedReviewState ?? "queued",
    weakSignalFlagged: !!draft.weakSignal?.flagged,
    weakSignalReason: draft.weakSignal?.reason ?? null,
    reviewNote: draft.reviewNote ?? null,
    lastReviewAction: draft.lastReviewAction ?? null,
    lastReviewActionBy: draft.lastReviewActionBy ?? null,
    lastReviewActionAt: draft.lastReviewActionAt?.toISOString?.() ?? null,
    createdAt: draft.createdAt?.toISOString?.() ?? null,
    updatedAt: draft.updatedAt?.toISOString?.() ?? null,
    queueMeta: buildFeedQueueMeta(draft),
  }));
}

export async function backfillVoteDraftAnlassraumAuthorized(
  input: BackfillVoteDraftAnlassraumInput,
): Promise<BackfillVoteDraftAnlassraumResult> {
  assertLegacyBackfillActor(input.actor);
  const draftId = toObjectId(input.draftId);

  const drafts = await voteDraftsCol();
  const draft = await drafts.findOne({ _id: draftId });
  if (!draft) throw new Error("draft_not_found");
  if (draft.anlassraumId) {
    throw new Error("draft_already_has_anlassraum");
  }

  if (input.mode === "attach") {
    if (!input.anlassraumId) {
      throw new Error("anlassraum_id_required");
    }
    const result = await applyFeedReviewAction({
      ...input,
      action: "attach_to_anlassraum",
      reviewNote: normalizeBackfillNote(input.reviewNote),
    });
    return {
      draftId: draftId.toHexString(),
      mode: "attach",
      remediationKind: "attached_existing_anlassraum",
      result,
    };
  }

  const result = await applyFeedReviewAction({
    ...input,
    action: "create_anlassraum_candidate",
    reviewNote: normalizeBackfillNote(input.reviewNote),
  });

  return {
    draftId: draftId.toHexString(),
    mode: "create_candidate",
    remediationKind: "created_candidate_anlassraum",
    result,
  };
}

async function ensureAnlassraumCandidate(input: {
  draft: VoteDraftDoc;
  candidate: StatementCandidate;
  actor: GovernanceActor;
  ownerType?: AnlassraumDoc["ownerType"];
  ownerId?: string | null;
  roomType?: RoomType;
  originType?: AnlassraumOriginType;
  entityId?: ObjectId | string | null;
  type?: AnlassraumType;
  scope?: AnlassraumScope;
  decisionScope?: AnlassraumScope;
}): Promise<ObjectId> {
  if (input.draft.anlassraumId) {
    const existing = await (await anlassraumCol()).findOne({ _id: input.draft.anlassraumId });
    if (existing) {
      assertActorCanAccessAnlassraum(existing, input.actor, "curate");
      return existing._id as ObjectId;
    }
  }

  const defaultPolicy = defaultOwnerPolicyForActor(input.actor);
  const ownerType = input.ownerType ?? defaultPolicy.ownerType;
  const ownerId = normalizeOwnerId(input.ownerId ?? defaultPolicy.ownerId);
  const roomType = input.roomType ?? defaultPolicy.roomType;
  const originType = input.originType ?? defaultPolicy.originType;

  assertActorCanCreateAnlassraum(input.actor, {
    ownerType,
    ownerId,
    roomType,
    originType,
  });

  const regionKey = deriveRegionKey(input.draft, input.candidate);
  const scope = input.scope ?? scopeFromRegion(regionKey);
  const decisionScope = input.decisionScope ?? scope;
  const entityId = input.entityId
    ? toObjectId(input.entityId)
    : (
        await ensureSystemEntityForRegion({
          regionKey,
          scope,
          ownerId,
        })
      ).entityId;

  const created = await createManualAnlassraum({
    entityId,
    type: input.type ?? deriveAnlassraumType(input.candidate),
    title: input.draft.title || input.candidate.sourceTitle || "Signal-Anlassraum",
    summary: String(input.draft.summary || input.candidate.sourceSummary || "").trim(),
    topicKey: deriveTopicKey(input.draft, input.candidate),
    regionKey,
    scope,
    decisionScope,
    ownerType,
    ownerId,
    originType,
    roomType,
    createdBy: input.actor.userId,
    actor: input.actor,
  });

  return created.anlassraumId;
}

async function attachCandidateToAnlassraum(input: {
  anlassraumId: ObjectId;
  draft: VoteDraftDoc;
  candidate: StatementCandidate;
  analyzeResult: StatementCandidateAnalyzeResultDoc;
  sourceRole: AnlassraumSourceRole;
  sourceWeight: number;
}) {
  if (!input.candidate._id) {
    throw new Error("candidate_id_missing");
  }

  const room = await (await anlassraumCol()).findOne({ _id: input.anlassraumId });
  if (!room) {
    throw new Error("anlassraum_not_found");
  }

  const links = await anlassraumSourceLinksCol();
  const existing = await links.findOne({ statementCandidateId: input.candidate._id });
  if (existing?.anlassraumId && existing.anlassraumId.toHexString() !== input.anlassraumId.toHexString()) {
    throw new Error("candidate_already_attached_other_anlassraum");
  }

  const now = new Date();
  const baseSource = {
    anlassraumId: input.anlassraumId,
    statementCandidateId: input.candidate._id,
    ingestItemId: null,
    sourceUrl: input.candidate.sourceUrl ?? input.draft.sourceUrl ?? null,
    sourceWeight: input.sourceWeight,
    role: input.sourceRole,
    publisher: input.candidate.sourceName ?? null,
    updatedAt: now,
  };

  if (existing?._id) {
    await links.updateOne(
      { _id: existing._id },
      {
        $set: baseSource,
      },
    );
  } else {
    await links.insertOne({
      ...baseSource,
      createdAt: now,
    });
  }

  await mergeAnlassraumStructure({
    anlassraumId: input.anlassraumId,
    draft: input.draft,
    candidate: input.candidate,
    analyzeResult: input.analyzeResult,
  });

  const updatedRiskFlags = new Set(Array.isArray(room.riskFlags) ? room.riskFlags : []);
  if (!input.candidate.sourceName) updatedRiskFlags.add("missing_primary_source");
  if (!input.candidate.sourceSummary && !input.candidate.sourceContent) updatedRiskFlags.add("thin_source_context");

  await (await anlassraumCol()).updateOne(
    { _id: input.anlassraumId },
    {
      $set: {
        contentTrust: room.contentTrust === "unverified" && input.candidate.sourceName ? "source_based" : room.contentTrust,
        riskFlags: Array.from(updatedRiskFlags),
        updatedAt: now,
      },
    },
  );
}

async function mergeAnlassraumStructure(input: {
  anlassraumId: ObjectId;
  draft: VoteDraftDoc;
  candidate: StatementCandidate;
  analyzeResult: StatementCandidateAnalyzeResultDoc;
}) {
  const col = await anlassraumStructureCol();
  const existing = await col.findOne({ anlassraumId: input.anlassraumId });
  const now = new Date();

  const claims = mergeByIdentity(existing?.claims ?? [], input.draft.claims ?? input.analyzeResult.claims ?? []);
  const notes = mergeByIdentity(existing?.notes ?? [], input.analyzeResult.notes ?? []);
  const questions = mergeByIdentity(existing?.questions ?? [], input.analyzeResult.questions ?? []);
  const knots = mergeByIdentity(existing?.knots ?? [], input.analyzeResult.knots ?? []);
  const segments = mergeSegments(existing?.segments ?? [], claims);
  const actors = mergeActors(existing?.actors ?? [], claims, input.candidate.sourceName ?? null);
  const riskFlags = mergeRiskFlags(existing?.riskFlags ?? [], input.candidate, input.analyzeResult);

  const summary = String(
    input.draft.summary ?? input.candidate.sourceSummary ?? input.candidate.sourceContent?.slice(0, 400) ?? "",
  )
    .trim()
    .slice(0, 500);

  await col.updateOne(
    { anlassraumId: input.anlassraumId },
    {
      $set: {
        claims,
        notes,
        questions,
        knots,
        segments,
        actors,
        evidenceSummary: summary || existing?.evidenceSummary || null,
        riskFlags,
        updatedAt: now,
      },
      $setOnInsert: {
        anlassraumId: input.anlassraumId,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  await (await anlassraumCol()).updateOne(
    { _id: input.anlassraumId },
    {
      $set: {
        maturity: deriveMaturityFromStructure(claims.length, questions.length),
        relevanceScore: deriveRelevanceScore(input.candidate, input.analyzeResult),
        updatedAt: now,
      },
    },
  );
}

async function markAnlassraumWeakSignal(anlassraumId: ObjectId, reason: string | null) {
  const rooms = await anlassraumCol();
  const room = await rooms.findOne({ _id: anlassraumId });
  if (!room) return;

  const riskFlags = new Set(Array.isArray(room.riskFlags) ? room.riskFlags : []);
  riskFlags.add("weak_signal");
  if (reason) {
    riskFlags.add(`weak_signal_reason:${slugifyShort(reason)}`);
  }

  await rooms.updateOne(
    { _id: anlassraumId },
    {
      $set: {
        contentTrust: room.contentTrust === "checked" ? "disputed" : room.contentTrust,
        reviewMode: "strict",
        riskFlags: Array.from(riskFlags),
        updatedAt: new Date(),
      },
    },
  );
}

async function updateDraftReviewFields(
  draftId: ObjectId,
  patch: Partial<VoteDraftDoc>,
): Promise<VoteDraftDoc> {
  const drafts = await voteDraftsCol();
  await drafts.updateOne(
    { _id: draftId },
    {
      $set: {
        ...patch,
        updatedAt: new Date(),
      },
    },
  );

  const updated = await drafts.findOne({ _id: draftId });
  if (!updated) {
    throw new Error("draft_not_found_after_update");
  }
  return updated;
}

function mergeByIdentity<T extends { id?: string | null; text?: string | null; label?: string | null }>(
  base: T[],
  incoming: T[],
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  const all = [...base, ...incoming];
  for (const item of all) {
    if (!item) continue;
    const key = identityKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.slice(0, 200);
}

function identityKey(item: { id?: string | null; text?: string | null; label?: string | null }): string {
  const id = String(item.id ?? "").trim();
  if (id) return `id:${id}`;
  const text = String(item.text ?? item.label ?? "").trim().toLowerCase();
  if (!text) return "";
  return `text:${text.slice(0, 180)}`;
}

function mergeSegments(existing: string[], claims: Array<{ domain?: string | null; topic?: string | null }>): string[] {
  const out = new Set<string>((existing ?? []).map((value) => String(value || "").trim()).filter(Boolean));
  for (const claim of claims) {
    const domain = String(claim.domain ?? "").trim();
    const topic = String(claim.topic ?? "").trim();
    if (domain) out.add(domain);
    if (topic) out.add(topic);
  }
  if (!out.size) out.add("kernfrage");
  return Array.from(out).slice(0, 24);
}

function mergeActors(
  existing: string[],
  claims: Array<{ responsibility?: string | null }>,
  sourceName: string | null,
): string[] {
  const out = new Set<string>((existing ?? []).map((value) => String(value || "").trim()).filter(Boolean));
  for (const claim of claims) {
    const responsibility = String(claim.responsibility ?? "").trim();
    if (responsibility) out.add(responsibility);
  }
  if (sourceName) out.add(sourceName);
  return Array.from(out).slice(0, 32);
}

function mergeRiskFlags(
  existing: string[],
  candidate: StatementCandidate,
  analyzeResult: StatementCandidateAnalyzeResultDoc,
): string[] {
  const out = new Set<string>((existing ?? []).map((value) => String(value || "").trim()).filter(Boolean));
  if (!candidate.sourceName) out.add("missing_primary_source");
  if (!candidate.sourceSummary && !candidate.sourceContent) out.add("thin_source_context");
  if ((analyzeResult.claims ?? []).length <= 1) out.add("low_claim_density");
  if ((analyzeResult.questions ?? []).length === 0) out.add("missing_open_questions");
  return Array.from(out);
}

function deriveMaturityFromStructure(claimCount: number, questionCount: number): AnlassraumDoc["maturity"] {
  if (claimCount >= 4 && questionCount >= 2) return "structured";
  if (claimCount >= 2) return "emerging";
  return "signal";
}

function deriveRelevanceScore(
  candidate: StatementCandidate,
  analyzeResult: StatementCandidateAnalyzeResultDoc,
): number {
  let score = 0.35;
  if (candidate.sourceName) score += 0.1;
  if (candidate.sourceSummary || candidate.sourceContent) score += 0.1;
  if ((analyzeResult.claims ?? []).length >= 2) score += 0.15;
  if ((analyzeResult.questions ?? []).length >= 2) score += 0.1;
  if (candidate.regionCode) score += 0.1;
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

function deriveAnlassraumType(candidate: StatementCandidate): AnlassraumType {
  const sourceType = String(candidate.sourceType || "").toLowerCase();
  if (sourceType.includes("investig")) return "investigation";
  if (sourceType.includes("crisis")) return "crisis";
  if (sourceType.includes("event")) return "event";
  return "proposal";
}

function deriveTopicKey(draft: VoteDraftDoc, candidate: StatementCandidate): string {
  const fromTags = Array.isArray(draft.tags) ? draft.tags.find((tag) => !!String(tag || "").trim()) : null;
  const fromCandidate = candidate.topic ?? null;
  const fromClaim = draft.claims?.find((claim) => !!claim?.topic)?.topic ?? null;
  return normalizeTopicKey(String(fromTags ?? fromCandidate ?? fromClaim ?? "allgemein"));
}

function normalizeTopicKey(value: string): string {
  return normalizeGermanSlug(value, { maxLength: 64, fallback: "allgemein" });
}

function deriveRegionKey(draft: VoteDraftDoc, candidate: StatementCandidate): string | null {
  const normalized = normalizeRegionCode(draft.regionCode ?? candidate.regionCode ?? null);
  if (!normalized) return null;
  return buildRegionKey(normalized);
}

function scopeFromRegion(regionKey: string | null): AnlassraumScope {
  if (!regionKey) return "global";
  const parts = regionKey.split(":");
  if (parts[2]) return "local";
  if (parts[1]) return "regional";
  return "national";
}

function defaultOwnerPolicyForActor(actor: GovernanceActor): {
  ownerType: AnlassraumDoc["ownerType"];
  ownerId: string;
  roomType: RoomType;
  originType: AnlassraumOriginType;
} {
  if (actor.role === "editorial_actor") {
    return {
      ownerType: "media",
      ownerId: actor.userId,
      roomType: "editorial",
      originType: "source_anchor",
    };
  }
  if (actor.role === "institutional_actor") {
    const scoped = (actor.scopedOwnerIds ?? []).map((value) => String(value || "").trim()).filter(Boolean);
    return {
      ownerType: "organization",
      ownerId: scoped[0] ?? actor.userId,
      roomType: "official",
      originType: "feed",
    };
  }
  return {
    ownerType: "system",
    ownerId: "feed-review",
    roomType: "community",
    originType: "feed",
  };
}

function normalizeOwnerId(value: string | null | undefined): string {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error("owner_id_required");
  return normalized;
}

function normalizeReviewNote(value?: string | null): string | null {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 2000) : null;
}

function normalizeWeakSignalReason(value?: string | null): string | null {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 300) : null;
}

function normalizeSourceWeight(value?: number): number {
  const num = Number(value ?? 1);
  if (!Number.isFinite(num)) return 1;
  return Math.max(0.1, Math.min(5, Number(num.toFixed(2))));
}

function normalizeLegacyStatusFilter(value?: VoteDraftStatus | "all"): VoteDraftStatus | "all" {
  if (value === "draft" || value === "review" || value === "published" || value === "discarded") {
    return value;
  }
  return "all";
}

function normalizeLegacyReviewState(value?: FeedReviewState | "all"): FeedReviewState | "all" {
  if (
    value === "queued" ||
    value === "ignored" ||
    value === "attached" ||
    value === "candidate_created" ||
    value === "weak_signal"
  ) {
    return value;
  }
  return "all";
}

function assertLegacyBackfillActor(actor: GovernanceActor) {
  if (actor.isAdmin || actor.role === "admin") return;
  throw new Error("forbidden_legacy_backfill_requires_admin");
}

function normalizeBackfillNote(value?: string | null): string {
  const note = normalizeReviewNote(value) ?? "";
  const prefix = "[legacy-backfill]";
  if (!note) return `${prefix} vote_draft -> anlassraumId remediation`;
  if (note.toLowerCase().startsWith(prefix)) return note;
  return `${prefix} ${note}`.slice(0, 2000);
}

function slugifyShort(value: string): string {
  return normalizeGermanSlug(value, { maxLength: 48, fallback: "" });
}

function toObjectId(value: ObjectId | string): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}
