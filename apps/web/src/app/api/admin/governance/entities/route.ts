import { NextRequest, NextResponse } from "next/server";
import {
  type EntityOwnerType,
  type EntityScope,
  type EntityStatus,
  type EntityType,
  ENTITY_OWNER_TYPES,
  ENTITY_SCOPES,
  ENTITY_STATUSES,
  ENTITY_TYPES,
} from "@features/entities/types";
import { entityCol } from "@features/entities/db";
import {
  canActorCreateEntity,
  canActorReadEntity,
  createEntityManualAuthorized,
} from "@features/entities/service";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const limit = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get("limit") ?? 40) || 40));
  const docs = await (await entityCol()).find({}).sort({ updatedAt: -1 }).limit(limit).toArray();
  const visibleDocs = docs.filter((doc) => canActorReadEntity(gate.actor, doc));

  return NextResponse.json({
    ok: true,
    items: visibleDocs.map((doc) => ({
      id: doc._id?.toHexString?.() ?? "",
      type: doc.type,
      slug: doc.slug,
      name: doc.name,
      regionKey: doc.regionKey ?? null,
      scope: doc.scope,
      status: doc.status,
      ownerType: doc.ownerType,
      ownerId: doc.ownerId,
      stewardUserId: doc.stewardUserId ?? null,
      createdAt: doc.createdAt?.toISOString?.() ?? null,
      updatedAt: doc.updatedAt?.toISOString?.() ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as {
    type?: string;
    slug?: string;
    name?: string;
    regionKey?: string | null;
    scope?: string;
    status?: string;
    ownerType?: string;
    ownerId?: string;
    stewardUserId?: string | null;
  };

  const type = String(body.type || "").toLowerCase();
  const scope = String(body.scope || "").toLowerCase();
  const status = String(body.status || "draft").toLowerCase();
  const ownerType = String(body.ownerType || "").toLowerCase();

  if (!isEntityType(type)) {
    return NextResponse.json({ ok: false, error: "invalid_entity_type" }, { status: 400 });
  }
  if (!isEntityScope(scope)) {
    return NextResponse.json({ ok: false, error: "invalid_scope" }, { status: 400 });
  }
  if (!isEntityStatus(status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }
  if (!isEntityOwnerType(ownerType)) {
    return NextResponse.json({ ok: false, error: "invalid_owner_type" }, { status: 400 });
  }
  if (
    !canActorCreateEntity(gate.actor, {
      type,
      ownerType,
      ownerId: String(body.ownerId || ""),
    })
  ) {
    return NextResponse.json({ ok: false, error: "forbidden_scope" }, { status: 403 });
  }

  try {
    const id = await createEntityManualAuthorized(gate.actor, {
      type,
      slug: String(body.slug || ""),
      name: String(body.name || ""),
      regionKey: body.regionKey ?? null,
      scope,
      status,
      ownerType,
      ownerId: String(body.ownerId || ""),
      stewardUserId: body.stewardUserId ?? null,
    });

    return NextResponse.json({ ok: true, id: id.toHexString() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "create_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

function isEntityType(value: string): value is EntityType {
  return ENTITY_TYPES.includes(value as EntityType);
}

function isEntityScope(value: string): value is EntityScope {
  return ENTITY_SCOPES.includes(value as EntityScope);
}

function isEntityStatus(value: string): value is EntityStatus {
  return ENTITY_STATUSES.includes(value as EntityStatus);
}

function isEntityOwnerType(value: string): value is EntityOwnerType {
  return ENTITY_OWNER_TYPES.includes(value as EntityOwnerType);
}
