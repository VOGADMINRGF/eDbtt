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
import type { GovernanceActor, RoomType } from "@features/trust/types";
import { analyzeResultsCol, statementCandidatesCol, voteDraftsCol } from "./db";
import type {
  FeedReviewState,
  StatementCandidate,
  StatementCandidateAnalyzeResultDoc,
  VoteDraftDoc,
} from "./types";

export const FEED_REVIEW_ACTIONS = [
  "ignore",
  "attach_to_anlassraum",
  "create_anlassraum_candidate",
  "mark_as_weak_signal",
] as const;

export type FeedReviewAction = (typeof FEED_REVIEW_ACTIONS)[number];

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

  if (draft.anlassraumId) {
    const existingRoom = await (await anlassraumCol()).findOne({ _id: draft.anlassraumId });
    if (existingRoom) {
      assertActorCanAccessAnlassraum(existingRoom, input.actor, "read");
    }
  }

  if (input.action === "ignore") {
    const updated = await updateDraftReviewFields(draftId, {
      status: "discarded",
      reviewNote: normalizeReviewNote(input.reviewNote),
      feedReviewState: "ignored",
      weakSignal: null,
      lastReviewAction: input.action,
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

  if (input.action === "mark_as_weak_signal") {
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
      lastReviewAction: input.action,
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

  if (input.action === "attach_to_anlassraum") {
    if (!input.anlassraumId) {
      throw new Error("anlassraum_id_required");
    }
    const targetId = toObjectId(input.anlassraumId);
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
      lastReviewAction: input.action,
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
    lastReviewAction: input.action,
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
    title: input.draft.title || input.candidate.sourceTitle || "Feed-Anlassraum",
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
  return (
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9äöüß-]/g, "")
      .slice(0, 64) || "allgemein"
  );
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

function slugifyShort(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
}

function toObjectId(value: ObjectId | string): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}
