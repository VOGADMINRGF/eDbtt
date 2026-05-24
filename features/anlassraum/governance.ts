import { ObjectId } from "@core/db/triMongo";
import type { RoomType } from "@features/trust/types";
import type { GovernanceActor } from "@features/trust/types";
import {
  canRoleApprove,
  canRoleReview,
  evaluatePublishGate,
} from "@features/trust/gates";
import { anlassraumCol, anlassraumSourceLinksCol, anlassraumStructureCol } from "./db";
import { recordAuditEvent } from "@features/audit/recordAuditEvent";
import {
  assertAnlassraumStatusTransition,
  normalizeAnlassraumStatus,
} from "./stateMachine";
import type { AnlassraumDoc, AnlassraumLifecycleStatus } from "./types";

export const ANLASSRAUM_TRANSITION_ACTIONS = [
  "curate",
  "review",
  "approve",
  "activate",
  "publish_link",
  "revoke_link",
  "pause",
  "close",
  "reopen",
  "archive",
] as const;
export type AnlassraumTransitionAction = (typeof ANLASSRAUM_TRANSITION_ACTIONS)[number];

export type AnlassraumAccessAction = "read" | AnlassraumTransitionAction;

type TransitionAnlassraumInput = {
  anlassraumId: ObjectId | string;
  action: AnlassraumTransitionAction;
  actor: GovernanceActor;
};

type PublishGateSnapshot = {
  ok: boolean;
  reasons: string[];
  sourceCount: number;
  requiredSourceCount: number;
  evidence: AnlassraumEvidenceSnapshot;
};

type AnlassraumEvidenceSnapshot = {
  sourceCount: number;
  primarySources: number;
  supportingSources: number;
  counterSources: number;
  contextSources: number;
  uniquePublishers: number;
  weightedSourceScore: number;
  claimCount: number;
  questionCount: number;
  noteCount: number;
};

type CreateAnlassraumPolicyInput = {
  ownerType: AnlassraumDoc["ownerType"];
  ownerId: string;
  roomType: RoomType;
  originType: AnlassraumDoc["originType"];
};

const INSTITUTIONAL_OWNER_TYPES = new Set<AnlassraumDoc["ownerType"]>([
  "municipality",
  "government",
  "party",
  "organization",
  "association",
  "ngo",
  "company",
  "media",
  "initiative",
]);

export async function getAnlassraumPublishGate(
  anlassraumId: ObjectId | string,
): Promise<PublishGateSnapshot> {
  const id = toObjectId(anlassraumId);
  const rooms = await anlassraumCol();
  const room = await rooms.findOne({ _id: id });
  if (!room) {
    throw new Error("anlassraum_not_found");
  }

  return evaluateRoomPublishGate(room, id);
}

export async function transitionAnlassraumState(
  input: TransitionAnlassraumInput,
): Promise<{ room: AnlassraumDoc; gate: PublishGateSnapshot }> {
  const id = toObjectId(input.anlassraumId);
  const rooms = await anlassraumCol();
  const room = await rooms.findOne({ _id: id });
  if (!room) {
    throw new Error("anlassraum_not_found");
  }

  assertActorCanAccessAnlassraum(room, input.actor, input.action);

  const target = actionToTargetStatus(input.action);
  const current = normalizeAnlassraumStatus(room.status);
  if (current !== target) {
    assertAnlassraumStatusTransition(room.status, target);
  }

  assertRoleAllowed(input.action, input.actor);

  const gateBefore = await evaluateRoomPublishGate(room, id);
  if (input.action === "activate" && !gateBefore.ok) {
    throw new Error(`publish_gate_failed:${gateBefore.reasons.join(",")}`);
  }
  if (input.action === "publish_link" && !gateBefore.ok) {
    throw new Error(`publish_gate_failed:${gateBefore.reasons.join(",")}`);
  }

  const now = new Date();
  const set: Partial<AnlassraumDoc> = {
    status: target,
    updatedAt: now,
  };

  if (input.action === "review") {
    set.reviewedBy = input.actor.userId;
  }
  if (input.action === "approve") {
    if (!room.reviewedBy) {
      set.reviewedBy = input.actor.userId;
    }
    set.approvedBy = input.actor.userId;
  }
  if (input.action === "activate" || input.action === "publish_link") {
    set.isPublic = true;
    set.publishedAt = now;
    set.archivedAt = null;
  }
  if (
    input.action === "pause" ||
    input.action === "close" ||
    input.action === "archive" ||
    input.action === "revoke_link"
  ) {
    set.isPublic = false;
  }
  if (input.action === "close" || input.action === "archive") {
    set.archivedAt = now;
  }

  await rooms.updateOne({ _id: id }, { $set: set });

  const updated = await rooms.findOne({ _id: id });
  if (!updated) {
    throw new Error("anlassraum_not_found_after_update");
  }
  await recordAuditEvent({
    scope: actorAuditScope(updated),
    action: auditActionForTransition(input.action),
    actorUserId: input.actor.userId ?? null,
    target: {
      type: "anlassraum",
      id: id.toHexString(),
    },
    before: {
      status: room.status,
      isPublic: room.isPublic,
      publishedAt: room.publishedAt ?? null,
      archivedAt: room.archivedAt ?? null,
    },
    after: {
      status: updated.status,
      isPublic: updated.isPublic,
      publishedAt: updated.publishedAt ?? null,
      archivedAt: updated.archivedAt ?? null,
    },
    reason: input.action,
  }).catch(() => {});
  const gateAfter = await evaluateRoomPublishGate(updated, id);
  return { room: updated, gate: gateAfter };
}

export function canActorAccessAnlassraum(
  room: AnlassraumDoc,
  actor: GovernanceActor,
  action: AnlassraumAccessAction = "read",
): boolean {
  if (actor.isAdmin || actor.role === "admin") return true;

  if (actor.role === "community") return false;

  if (actor.role === "reviewer") {
    if (action === "read") return room.roomType !== "internal";
    if (
      action === "curate" ||
      action === "review" ||
      action === "pause" ||
      action === "close" ||
      action === "reopen" ||
      action === "archive"
    ) {
      return true;
    }
    return false;
  }

  if (actor.role === "editorial_actor") {
    if (!isEditorialRoom(room)) return false;
    if (action === "read") return true;
    return (
      action === "curate" ||
      action === "review" ||
      action === "approve" ||
      action === "activate" ||
      action === "publish_link" ||
      action === "revoke_link" ||
      action === "pause" ||
      action === "close" ||
      action === "reopen" ||
      action === "archive"
    );
  }

  if (actor.role === "institutional_actor") {
    if (!isInstitutionalScopeAllowed(room, actor)) return false;
    if (action === "read") return true;
    return (
      action === "curate" ||
      action === "review" ||
      action === "approve" ||
      action === "activate" ||
      action === "publish_link" ||
      action === "revoke_link" ||
      action === "pause" ||
      action === "close" ||
      action === "reopen" ||
      action === "archive"
    );
  }

  return false;
}

export function assertActorCanAccessAnlassraum(
  room: AnlassraumDoc,
  actor: GovernanceActor,
  action: AnlassraumAccessAction = "read",
) {
  if (!canActorAccessAnlassraum(room, actor, action)) {
    throw new Error("actor_scope_forbidden");
  }
}

export function canActorCreateAnlassraum(
  actor: GovernanceActor,
  input: CreateAnlassraumPolicyInput,
): boolean {
  if (actor.isAdmin || actor.role === "admin") return true;

  if (actor.role === "reviewer") {
    return input.roomType === "community" || input.roomType === "public";
  }

  if (actor.role === "editorial_actor") {
    const editorialOwner = input.ownerType === "media" || input.ownerType === "editorial";
    const editorialRoom = input.roomType === "editorial";
    return editorialOwner && (editorialRoom || input.originType === "source_anchor");
  }

  if (actor.role === "institutional_actor") {
    const ownerId = String(input.ownerId || "").trim();
    if (!ownerId) return false;
    if (!INSTITUTIONAL_OWNER_TYPES.has(input.ownerType)) return false;
    const allowed = new Set((actor.scopedOwnerIds ?? []).map((id) => String(id || "").trim()).filter(Boolean));
    return allowed.has(ownerId);
  }

  return false;
}

export function assertActorCanCreateAnlassraum(
  actor: GovernanceActor,
  input: CreateAnlassraumPolicyInput,
) {
  if (!canActorCreateAnlassraum(actor, input)) {
    throw new Error("actor_scope_forbidden");
  }
}

function assertRoleAllowed(action: AnlassraumTransitionAction, actor: GovernanceActor) {
  if (
    action === "curate" ||
    action === "archive" ||
    action === "pause" ||
    action === "close" ||
    action === "reopen" ||
    action === "revoke_link"
  ) {
    if (actor.role === "community") {
      throw new Error("actor_role_not_allowed");
    }
    return;
  }
  if (action === "review" && !canRoleReview(actor.role)) {
    throw new Error("actor_cannot_review");
  }
  if (
    (action === "approve" || action === "activate" || action === "publish_link") &&
    !canRoleApprove(actor.role)
  ) {
    throw new Error("actor_cannot_approve");
  }
}

function isEditorialRoom(room: AnlassraumDoc): boolean {
  if (room.roomType === "editorial") return true;
  if (room.ownerType === "media") return true;
  if (room.originType === "source_anchor") return true;
  return false;
}

function isInstitutionalScopeAllowed(room: AnlassraumDoc, actor: GovernanceActor): boolean {
  if (!INSTITUTIONAL_OWNER_TYPES.has(room.ownerType)) return false;
  const ownerId = String(room.ownerId || "").trim();
  const allowed = new Set((actor.scopedOwnerIds ?? []).map((id) => String(id || "").trim()).filter(Boolean));
  if (ownerId && allowed.has(ownerId)) return true;
  if (room.stewardUserId && room.stewardUserId === actor.userId) return true;
  return false;
}

function actionToTargetStatus(action: AnlassraumTransitionAction): AnlassraumLifecycleStatus {
  if (action === "curate") return "curated";
  if (action === "review") return "reviewed";
  if (action === "approve") return "approved";
  if (action === "publish_link") return "active";
  if (action === "activate") return "active";
  if (action === "pause") return "paused";
  if (action === "close") return "closed";
  if (action === "reopen") return "review_required";
  if (action === "revoke_link") return "ready_for_public_link";
  return "archived";
}

async function evaluateRoomPublishGate(
  room: AnlassraumDoc,
  anlassraumId: ObjectId,
): Promise<PublishGateSnapshot> {
  const evidence = await collectEvidenceSnapshot(anlassraumId);
  const requiredSourceCount = deriveRequiredSourceCount(room, evidence);
  const hasSufficientSources = evaluateSourceSufficiency(room, evidence, requiredSourceCount);
  const hasOpenEscalations = (room.riskFlags ?? []).some((flag) => String(flag).startsWith("escalation_"));
  const anonymousOnly = room.originType === "tip" && evidence.sourceCount < Math.max(2, requiredSourceCount);
  const gate = evaluatePublishGate({
    status: normalizeAnlassraumStatus(room.status),
    requiredStatuses: ["approved", "ready_for_public_link", "active"],
    reviewedBy: room.reviewedBy,
    approvedBy: room.approvedBy,
    contentTrust: room.contentTrust,
    hasSufficientSources,
    hasOpenEscalations,
    anonymousOnly,
  });

  const reasons = new Set(gate.reasons);
  if (evidence.claimCount === 0) {
    reasons.add("missing_structured_claims");
  }
  if (room.maturity !== "signal" && evidence.questionCount === 0) {
    reasons.add("missing_open_questions");
  }
  if (requiresCounterPerspective(room) && evidence.counterSources + evidence.contextSources === 0) {
    reasons.add("missing_counter_or_context_source");
  }
  if (hasWeakSignalFlag(room) && evidence.sourceCount < requiredSourceCount + 1) {
    reasons.add("weak_signal_needs_corroboration");
  }
  if (evidence.weightedSourceScore < requiredWeightedSourceScore(requiredSourceCount)) {
    reasons.add("insufficient_weighted_source_score");
  }

  return {
    ok: reasons.size === 0,
    reasons: Array.from(reasons),
    sourceCount: evidence.sourceCount,
    requiredSourceCount,
    evidence,
  };
}

function actorAuditScope(room: AnlassraumDoc) {
  return room.ownerType === "organization" ||
    room.ownerType === "association" ||
    room.ownerType === "ngo"
    ? "org"
    : "admin";
}

function auditActionForTransition(action: AnlassraumTransitionAction): string {
  switch (action) {
    case "curate":
      return "anlassraum.configure";
    case "review":
      return "anlassraum.review";
    case "approve":
      return "anlassraum.ready_for_public_link";
    case "activate":
    case "publish_link":
      return "anlassraum.publish_link";
    case "revoke_link":
      return "anlassraum.revoke_link";
    case "pause":
      return "anlassraum.pause";
    case "close":
      return "anlassraum.close";
    case "reopen":
      return "anlassraum.reopen";
    case "archive":
    default:
      return "anlassraum.archive";
  }
}

async function collectEvidenceSnapshot(
  anlassraumId: ObjectId,
): Promise<AnlassraumEvidenceSnapshot> {
  const links = await anlassraumSourceLinksCol();
  const structureCol = await anlassraumStructureCol();
  const [sourceLinks, structure] = await Promise.all([
    links.find({ anlassraumId }).toArray(),
    structureCol.findOne({ anlassraumId }),
  ]);

  let primarySources = 0;
  let supportingSources = 0;
  let counterSources = 0;
  let contextSources = 0;
  let weightedSourceScore = 0;
  const publishers = new Set<string>();

  for (const source of sourceLinks) {
    const role = String(source.role || "").toLowerCase();
    const weight = Number(source.sourceWeight ?? 1);
    const normalizedWeight = Number.isFinite(weight) ? Math.max(0.1, Math.min(5, weight)) : 1;
    weightedSourceScore += normalizedWeight;
    if (role === "primary") primarySources += 1;
    else if (role === "supporting") supportingSources += 1;
    else if (role === "counter") counterSources += 1;
    else contextSources += 1;

    const publisher = String(source.publisher || "").trim().toLowerCase();
    if (publisher) publishers.add(publisher);
  }

  return {
    sourceCount: sourceLinks.length,
    primarySources,
    supportingSources,
    counterSources,
    contextSources,
    uniquePublishers: publishers.size,
    weightedSourceScore: Number(weightedSourceScore.toFixed(2)),
    claimCount: Array.isArray(structure?.claims) ? structure.claims.length : 0,
    questionCount: Array.isArray(structure?.questions) ? structure.questions.length : 0,
    noteCount: Array.isArray(structure?.notes) ? structure.notes.length : 0,
  };
}

function deriveRequiredSourceCount(
  room: AnlassraumDoc,
  evidence: AnlassraumEvidenceSnapshot,
): number {
  let required = 2;
  if (room.reviewMode === "strict") required = Math.max(required, 3);
  if (room.type === "investigation" || room.type === "crisis") required = Math.max(required, 3);
  if (room.maturity === "decision_ready") required = Math.max(required, 3);
  if (hasWeakSignalFlag(room)) required = Math.max(required, 3);
  if (room.originType === "tip") required = Math.max(required, 3);
  if (evidence.claimCount >= 6) required = Math.max(required, 3);
  return required;
}

function evaluateSourceSufficiency(
  room: AnlassraumDoc,
  evidence: AnlassraumEvidenceSnapshot,
  requiredSourceCount: number,
): boolean {
  if (evidence.sourceCount < requiredSourceCount) return false;
  if (evidence.primarySources < 1) return false;
  if (requiredSourceCount >= 2 && evidence.uniquePublishers < 2) return false;
  if (requiresCounterPerspective(room) && evidence.counterSources + evidence.contextSources < 1) return false;
  return true;
}

function requiresCounterPerspective(room: AnlassraumDoc): boolean {
  if (room.reviewMode === "strict") return true;
  if (room.type === "investigation" || room.type === "conflict" || room.type === "crisis") return true;
  if (room.maturity === "decision_ready") return true;
  return false;
}

function hasWeakSignalFlag(room: AnlassraumDoc): boolean {
  return (room.riskFlags ?? []).some((flag) => String(flag).startsWith("weak_signal"));
}

function requiredWeightedSourceScore(requiredSourceCount: number): number {
  return Number((requiredSourceCount * 0.9).toFixed(2));
}

function toObjectId(value: ObjectId | string): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}
