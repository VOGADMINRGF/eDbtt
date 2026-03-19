import { ObjectId } from "@core/db/triMongo";
import { canRoleApprove } from "@features/trust/gates";
import type { GovernanceActor } from "@features/trust/types";
import { anlassraumCol, outputSeedCol } from "./db";
import {
  canActorAccessAnlassraum,
  getAnlassraumPublishGate,
} from "./governance";
import type {
  AnlassraumDoc,
  OutputSeedDoc,
  OutputSeedReviewState,
  OutputSeedStatus,
  OutputSeedType,
} from "./types";

export const OUTPUT_PREP_ACTIONS = [
  "queue",
  "send_to_review",
  "approve_prep",
  "reject_prep",
  "mark_ready",
  "publish",
  "discard",
  "reset_draft",
] as const;

export type OutputPrepAction = (typeof OUTPUT_PREP_ACTIONS)[number];

export type ListOutputSeedsInput = {
  anlassraumId: ObjectId | string;
  actor: GovernanceActor;
  status?: OutputSeedStatus | "all";
  outputType?: OutputSeedType | "all";
  reviewState?: OutputSeedReviewState | "all";
  limit?: number;
};

export type TransitionOutputSeedInput = {
  anlassraumId: ObjectId | string;
  seedId: ObjectId | string;
  action: OutputPrepAction;
  actor: GovernanceActor;
  publishTarget?: string | null;
  reviewNote?: string | null;
};

export async function listOutputSeedsAuthorized(input: ListOutputSeedsInput) {
  const anlassraumId = toObjectId(input.anlassraumId, "invalid_anlassraum_id");
  const room = await (await anlassraumCol()).findOne({ _id: anlassraumId });
  if (!room) throw new Error("anlassraum_not_found");
  assertActorCanRead(room, input.actor);

  const limit = Math.max(1, Math.min(200, Number(input.limit ?? 120)));
  const filter: Record<string, unknown> = { anlassraumId };
  if (input.status && input.status !== "all") filter.status = input.status;
  if (input.outputType && input.outputType !== "all") filter.outputType = input.outputType;
  if (input.reviewState && input.reviewState !== "all") filter.reviewState = input.reviewState;

  const items = await (await outputSeedCol())
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  const publishGate = await getAnlassraumPublishGate(anlassraumId).catch(() => null);

  return {
    anlassraum: room,
    items,
    publishGate,
  };
}

export async function transitionOutputSeedAuthorized(input: TransitionOutputSeedInput) {
  const anlassraumId = toObjectId(input.anlassraumId, "invalid_anlassraum_id");
  const seedId = toObjectId(input.seedId, "invalid_seed_id");
  const action = String(input.action || "").toLowerCase() as OutputPrepAction;
  if (!isOutputPrepAction(action)) {
    throw new Error("invalid_action");
  }

  const room = await (await anlassraumCol()).findOne({ _id: anlassraumId });
  if (!room) throw new Error("anlassraum_not_found");

  const seeds = await outputSeedCol();
  const seed = await seeds.findOne({ _id: seedId, anlassraumId });
  if (!seed) {
    const exists = await seeds.findOne({ _id: seedId });
    if (exists?.anlassraumId && exists.anlassraumId.toHexString() !== anlassraumId.toHexString()) {
      throw new Error("seed_not_in_anlassraum");
    }
    throw new Error("output_seed_not_found");
  }

  assertActorCanTransition(room, input.actor, action);

  const patch = await buildTransitionPatch({
    room,
    seed,
    action,
    actor: input.actor,
    publishTarget: input.publishTarget,
    reviewNote: input.reviewNote,
  });

  await seeds.updateOne(
    { _id: seedId, anlassraumId },
    {
      $set: {
        ...patch,
        updatedAt: new Date(),
      },
    },
  );

  const updated = await seeds.findOne({ _id: seedId, anlassraumId });
  if (!updated) throw new Error("output_seed_not_found_after_update");

  const publishGate = await getAnlassraumPublishGate(anlassraumId).catch(() => null);

  return {
    seed: updated,
    publishGate,
  };
}

async function buildTransitionPatch(input: {
  room: AnlassraumDoc;
  seed: OutputSeedDoc;
  action: OutputPrepAction;
  actor: GovernanceActor;
  publishTarget?: string | null;
  reviewNote?: string | null;
}): Promise<Partial<OutputSeedDoc>> {
  const now = new Date();
  const note = normalizeReviewNote(input.reviewNote);

  if (input.action === "queue") {
    assertStatusAllowed(input.seed.status, ["draft", "discarded", "review"]);
    return withAudit(
      {
        status: "queued",
        reviewState: "pending",
        reviewNote: note,
      },
      input.action,
      input.actor,
      now,
    );
  }

  if (input.action === "send_to_review") {
    assertStatusAllowed(input.seed.status, ["draft", "queued", "discarded"]);
    return withAudit(
      {
        status: "review",
        reviewState: "pending",
        reviewNote: note,
      },
      input.action,
      input.actor,
      now,
    );
  }

  if (input.action === "approve_prep") {
    assertStatusAllowed(input.seed.status, ["review", "ready"]);
    return withAudit(
      {
        reviewState: "approved",
        reviewNote: note,
      },
      input.action,
      input.actor,
      now,
    );
  }

  if (input.action === "reject_prep") {
    assertStatusAllowed(input.seed.status, ["queued", "review", "ready"]);
    return withAudit(
      {
        status: input.seed.status === "ready" ? "review" : input.seed.status,
        reviewState: "rejected",
        reviewNote: note,
      },
      input.action,
      input.actor,
      now,
    );
  }

  if (input.action === "mark_ready") {
    assertStatusAllowed(input.seed.status, ["review"]);
    if (input.seed.reviewState !== "approved") {
      throw new Error("output_seed_review_not_approved");
    }
    await assertPublishGatePasses(input.room._id);
    return withAudit(
      {
        status: "ready",
      },
      input.action,
      input.actor,
      now,
    );
  }

  if (input.action === "publish") {
    assertStatusAllowed(input.seed.status, ["ready"]);
    if (input.seed.reviewState !== "approved") {
      throw new Error("output_seed_review_not_approved");
    }
    const target = String(input.publishTarget || "").trim();
    if (!target) throw new Error("publish_target_required");
    await assertPublishGatePasses(input.room._id);
    return withAudit(
      {
        status: "published",
        publishTarget: target.slice(0, 200),
      },
      input.action,
      input.actor,
      now,
    );
  }

  if (input.action === "discard") {
    assertStatusAllowed(input.seed.status, ["draft", "queued", "review", "ready"]);
    return withAudit(
      {
        status: "discarded",
        reviewState: input.seed.reviewState === "approved" ? "pending" : input.seed.reviewState,
        reviewNote: note,
      },
      input.action,
      input.actor,
      now,
    );
  }

  assertStatusAllowed(input.seed.status, ["queued", "review", "ready", "discarded"]);
  return withAudit(
    {
      status: "draft",
      reviewState: "pending",
      publishTarget: null,
      reviewNote: note,
    },
    input.action,
    input.actor,
    now,
  );
}

function withAudit(
  patch: Partial<OutputSeedDoc>,
  action: OutputPrepAction,
  actor: GovernanceActor,
  now: Date,
): Partial<OutputSeedDoc> {
  return {
    ...patch,
    lastAction: action,
    lastActionBy: actor.userId,
    lastActionAt: now,
  };
}

function assertStatusAllowed(status: OutputSeedStatus, allowed: OutputSeedStatus[]) {
  if (!allowed.includes(status)) {
    throw new Error(`invalid_transition_from_status:${status}`);
  }
}

function assertActorCanRead(room: AnlassraumDoc, actor: GovernanceActor) {
  if (!canActorAccessAnlassraum(room, actor, "read")) {
    throw new Error("forbidden_scope");
  }
}

function assertActorCanTransition(room: AnlassraumDoc, actor: GovernanceActor, action: OutputPrepAction) {
  if (action === "mark_ready" || action === "publish" || action === "approve_prep") {
    if (!canRoleApprove(actor.role) || !canActorAccessAnlassraum(room, actor, "approve")) {
      throw new Error("actor_cannot_approve_prep");
    }
    return;
  }

  if (!canActorAccessAnlassraum(room, actor, "curate")) {
    throw new Error("forbidden_scope");
  }
}

async function assertPublishGatePasses(anlassraumId: ObjectId | undefined) {
  if (!anlassraumId) throw new Error("anlassraum_not_found");
  const gate = await getAnlassraumPublishGate(anlassraumId);
  if (!gate.ok) {
    throw new Error(`publish_gate_failed:${gate.reasons.join(",")}`);
  }
}

function normalizeReviewNote(value?: string | null): string | null {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 2000) : null;
}

function toObjectId(value: ObjectId | string, invalidError: string): ObjectId {
  if (value instanceof ObjectId) return value;
  if (!ObjectId.isValid(String(value || ""))) {
    throw new Error(invalidError);
  }
  return new ObjectId(String(value));
}

function isOutputPrepAction(value: string): value is OutputPrepAction {
  return OUTPUT_PREP_ACTIONS.includes(value as OutputPrepAction);
}
