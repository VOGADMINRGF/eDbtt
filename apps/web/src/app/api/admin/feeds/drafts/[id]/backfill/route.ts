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
import { backfillVoteDraftAnlassraumAuthorized } from "@features/feeds/reviewQueue";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { statusForFeedReviewError } from "../../reviewErrors";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    mode?: string;
    anlassraumId?: string;
    reviewNote?: string;
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

  const mode = normalizeMode(body.mode);
  if (!mode) {
    return NextResponse.json({ ok: false, error: "invalid_mode" }, { status: 400 });
  }
  if (mode === "attach" && !ObjectId.isValid(String(body.anlassraumId || ""))) {
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
    const response = await backfillVoteDraftAnlassraumAuthorized({
      draftId: new ObjectId(id),
      actor: gate.actor,
      mode,
      anlassraumId: body.anlassraumId ? new ObjectId(body.anlassraumId) : null,
      reviewNote: body.reviewNote,
      sourceRole,
      sourceWeight: Number(body.sourceWeight ?? 1),
      ownerType,
      ownerId: body.ownerId,
      roomType,
      originType,
      entityId: body.entityId && ObjectId.isValid(body.entityId) ? new ObjectId(body.entityId) : null,
      type,
      scope,
      decisionScope,
    });

    const publishGate = response.result.anlassraumId
      ? await getAnlassraumPublishGate(response.result.anlassraumId).catch(() => null)
      : null;

    return NextResponse.json({
      ok: true,
      draftId: response.draftId,
      mode: response.mode,
      result: {
        anlassraumId: response.result.anlassraumId?.toHexString?.() ?? null,
        feedReviewState: response.result.feedReviewState,
        createdAnlassraum: response.result.createdAnlassraum,
        draftStatus: response.result.draft.status,
        lastReviewAction: response.result.draft.lastReviewAction ?? null,
        lastReviewActionBy: response.result.draft.lastReviewActionBy ?? null,
        lastReviewActionAt: response.result.draft.lastReviewActionAt?.toISOString?.() ?? null,
      },
      publishGate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "backfill_failed";
    return NextResponse.json({ ok: false, error: message }, { status: statusForFeedReviewError(message) });
  }
}

function normalizeMode(value?: string): "attach" | "create_candidate" | null {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "attach") return "attach";
  if (normalized === "create_candidate" || normalized === "create") return "create_candidate";
  return null;
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
