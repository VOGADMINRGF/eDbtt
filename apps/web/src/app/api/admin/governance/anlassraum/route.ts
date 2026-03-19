import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { entityCol } from "@features/entities/db";
import type { EntityDoc } from "@features/entities/types";
import { createManualAnlassraum } from "@features/anlassraum/service";
import { getAnlassraumPublishGate } from "@features/anlassraum/governance";
import {
  ANLASSRAUM_ORIGIN_TYPES,
  ANLASSRAUM_OWNER_TYPES,
  ANLASSRAUM_SCOPES,
  ANLASSRAUM_TYPES,
  type AnlassraumOriginType,
  type AnlassraumOwnerType,
  type AnlassraumScope,
  type AnlassraumType,
} from "@features/anlassraum/types";
import { ROOM_TYPES, type GovernanceActor, type RoomType } from "@features/trust/types";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export async function POST(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as {
    entityId?: string;
    type?: string;
    title?: string;
    summary?: string;
    topicKey?: string;
    regionKey?: string | null;
    scope?: string;
    decisionScope?: string;
    ownerType?: string;
    ownerId?: string;
    originType?: string;
    roomType?: string;
  };

  const type = String(body.type || "").toLowerCase();
  const scope = String(body.scope || "").toLowerCase();
  const decisionScope = String(body.decisionScope || scope).toLowerCase();
  const ownerType = String(body.ownerType || "system").toLowerCase();
  const originType = String(body.originType || "manual").toLowerCase();
  const roomType = String(body.roomType || "community").toLowerCase();
  if (!ObjectId.isValid(String(body.entityId || ""))) {
    return NextResponse.json({ ok: false, error: "invalid_entity_id" }, { status: 400 });
  }
  if (!isAnlassraumType(type)) {
    return NextResponse.json({ ok: false, error: "invalid_anlassraum_type" }, { status: 400 });
  }
  if (!isAnlassraumScope(scope) || !isAnlassraumScope(decisionScope)) {
    return NextResponse.json({ ok: false, error: "invalid_scope" }, { status: 400 });
  }
  if (!isAnlassraumOwnerType(ownerType)) {
    return NextResponse.json({ ok: false, error: "invalid_owner_type" }, { status: 400 });
  }
  if (!isAnlassraumOriginType(originType)) {
    return NextResponse.json({ ok: false, error: "invalid_origin_type" }, { status: 400 });
  }
  if (!isRoomType(roomType)) {
    return NextResponse.json({ ok: false, error: "invalid_room_type" }, { status: 400 });
  }

  const createdBy = gate.actor.userId;
  const entity = await (await entityCol()).findOne({ _id: new ObjectId(String(body.entityId)) });
  if (!entity) {
    return NextResponse.json({ ok: false, error: "entity_not_found" }, { status: 404 });
  }
  if (
    !canActorUseEntityForAnlassraum(
      gate.actor,
      entity,
      ownerType,
      String(body.ownerId || createdBy),
      roomType,
      originType,
    )
  ) {
    return NextResponse.json({ ok: false, error: "forbidden_scope" }, { status: 403 });
  }

  try {
    const created = await createManualAnlassraum({
      entityId: String(body.entityId),
      type,
      title: String(body.title || ""),
      summary: String(body.summary || ""),
      topicKey: String(body.topicKey || ""),
      regionKey: body.regionKey ?? null,
      scope,
      decisionScope,
      ownerType,
      ownerId: String(body.ownerId || createdBy),
      originType,
      roomType,
      createdBy,
      actor: gate.actor,
    });

    const publishGate = await getAnlassraumPublishGate(created.anlassraumId);
    return NextResponse.json({
      ok: true,
      id: created.anlassraumId.toHexString(),
      publishGate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "create_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 },
    );
  }
}

function isAnlassraumType(value: string): value is AnlassraumType {
  return ANLASSRAUM_TYPES.includes(value as AnlassraumType);
}

function isAnlassraumScope(value: string): value is AnlassraumScope {
  return ANLASSRAUM_SCOPES.includes(value as AnlassraumScope);
}

function isAnlassraumOwnerType(value: string): value is AnlassraumOwnerType {
  return ANLASSRAUM_OWNER_TYPES.includes(value as AnlassraumOwnerType);
}

function isAnlassraumOriginType(value: string): value is AnlassraumOriginType {
  return ANLASSRAUM_ORIGIN_TYPES.includes(value as AnlassraumOriginType);
}

function isRoomType(value: string): value is RoomType {
  return ROOM_TYPES.includes(value as RoomType);
}

function canActorUseEntityForAnlassraum(
  actor: GovernanceActor,
  entity: EntityDoc,
  ownerType: AnlassraumOwnerType,
  ownerId: string,
  roomType: RoomType,
  originType: AnlassraumOriginType,
): boolean {
  if (actor.isAdmin || actor.role === "admin") return true;

  const scoped = new Set((actor.scopedOwnerIds ?? []).map((value) => String(value || "").trim()).filter(Boolean));
  const entityOwnerId = String(entity.ownerId || "").trim();
  const normalizedOwnerId = String(ownerId || "").trim();

  if (actor.role === "reviewer") {
    return roomType === "community" || roomType === "public";
  }

  if (actor.role === "editorial_actor") {
    const editorialEntity = entity.type === "media" || entity.ownerType === "media";
    const editorialOwner = ownerType === "media" || ownerType === "editorial";
    return editorialEntity && editorialOwner && (roomType === "editorial" || originType === "source_anchor");
  }

  if (actor.role === "institutional_actor") {
    if (!normalizedOwnerId || !scoped.has(normalizedOwnerId)) return false;
    if (entityOwnerId && !scoped.has(entityOwnerId) && entity.stewardUserId !== actor.userId) return false;
    return true;
  }

  return false;
}
