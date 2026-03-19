import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { getAnlassraumPublishGate } from "@features/anlassraum/governance";
import {
  ANLASSRAUM_OWNER_TYPES,
  ANLASSRAUM_ORIGIN_TYPES,
  ANLASSRAUM_SCOPES,
  ANLASSRAUM_TYPES,
  type AnlassraumOwnerType,
  type AnlassraumOriginType,
  type AnlassraumScope,
  type AnlassraumSourceRole,
  type AnlassraumType,
} from "@features/anlassraum/types";
import { ROOM_TYPES, type RoomType } from "@features/trust/types";
import {
  FEED_REVIEW_ACTIONS,
  applyFeedReviewAction,
  type FeedReviewAction,
} from "@features/feeds/reviewQueue";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  let draftId: ObjectId;
  try {
    draftId = new ObjectId(id);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    reviewNote?: string;
    weakSignalReason?: string;
    anlassraumId?: string;
    sourceRole?: string;
    sourceWeight?: number;
    ownerType?: string;
    ownerId?: string;
    roomType?: string;
    originType?: string;
    entityId?: string;
    type?: string;
    scope?: string;
    decisionScope?: string;
  };

  const action = String(body.action || "").toLowerCase();
  if (!isFeedReviewAction(action)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  if (action === "attach_to_anlassraum" && !ObjectId.isValid(String(body.anlassraumId || ""))) {
    return NextResponse.json({ ok: false, error: "invalid_anlassraum_id" }, { status: 400 });
  }

  const sourceRole = normalizeSourceRole(body.sourceRole);
  const ownerType = normalizeOwnerType(body.ownerType);
  const roomType = normalizeRoomType(body.roomType);
  const originType = normalizeOriginType(body.originType);
  const type = normalizeAnlassraumType(body.type);
  const scope = normalizeScope(body.scope);
  const decisionScope = normalizeScope(body.decisionScope);

  try {
    const result = await applyFeedReviewAction({
      draftId,
      actor: gate.actor,
      action,
      reviewNote: body.reviewNote,
      weakSignalReason: body.weakSignalReason,
      sourceRole,
      sourceWeight: Number(body.sourceWeight ?? 1),
      anlassraumId: body.anlassraumId ? new ObjectId(body.anlassraumId) : null,
      ownerType,
      ownerId: body.ownerId,
      roomType,
      originType,
      entityId: body.entityId && ObjectId.isValid(body.entityId) ? new ObjectId(body.entityId) : null,
      type,
      scope,
      decisionScope,
    });

    const publishGate = result.anlassraumId
      ? await getAnlassraumPublishGate(result.anlassraumId).catch(() => null)
      : null;

    return NextResponse.json({
      ok: true,
      action,
      draft: {
        id: result.draft._id?.toHexString?.() ?? "",
        status: result.draft.status,
        anlassraumId: result.draft.anlassraumId?.toHexString?.() ?? null,
        reviewNote: result.draft.reviewNote ?? null,
        feedReviewState: result.draft.feedReviewState ?? result.feedReviewState,
        weakSignal: result.draft.weakSignal
          ? {
              flagged: !!result.draft.weakSignal.flagged,
              reason: result.draft.weakSignal.reason ?? null,
              flaggedBy: result.draft.weakSignal.flaggedBy ?? null,
              flaggedAt: result.draft.weakSignal.flaggedAt?.toISOString?.() ?? null,
            }
          : null,
        updatedAt: result.draft.updatedAt?.toISOString?.() ?? null,
      },
      createdAnlassraum: result.createdAnlassraum,
      publishGate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "review_action_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

function isFeedReviewAction(value: string): value is FeedReviewAction {
  return FEED_REVIEW_ACTIONS.includes(value as FeedReviewAction);
}

function normalizeSourceRole(value?: string): AnlassraumSourceRole | undefined {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "primary") return "primary";
  if (normalized === "supporting") return "supporting";
  if (normalized === "counter") return "counter";
  if (normalized === "context") return "context";
  return undefined;
}

function normalizeOwnerType(value?: string): AnlassraumOwnerType | undefined {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return undefined;
  if (!ANLASSRAUM_OWNER_TYPES.includes(normalized as AnlassraumOwnerType)) return undefined;
  return normalized as AnlassraumOwnerType;
}

function normalizeRoomType(value?: string): RoomType | undefined {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return undefined;
  if (!ROOM_TYPES.includes(normalized as RoomType)) return undefined;
  return normalized as RoomType;
}

function normalizeOriginType(value?: string): AnlassraumOriginType | undefined {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return undefined;
  if (!ANLASSRAUM_ORIGIN_TYPES.includes(normalized as AnlassraumOriginType)) return undefined;
  return normalized as AnlassraumOriginType;
}

function normalizeAnlassraumType(value?: string): AnlassraumType | undefined {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return undefined;
  if (!ANLASSRAUM_TYPES.includes(normalized as AnlassraumType)) return undefined;
  return normalized as AnlassraumType;
}

function normalizeScope(value?: string): AnlassraumScope | undefined {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return undefined;
  if (!ANLASSRAUM_SCOPES.includes(normalized as AnlassraumScope)) return undefined;
  return normalized as AnlassraumScope;
}
