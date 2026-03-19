export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { buildRegionKey, normalizeRegionCode } from "@core/regions/types";
import { createManualAnlassraum } from "@features/anlassraum/service";
import {
  ANLASSRAUM_OWNER_TYPES,
  ANLASSRAUM_SCOPES,
  type AnlassraumOwnerType,
  type AnlassraumScope,
} from "@features/anlassraum/types";
import type { GovernanceActor, RoomType } from "@features/trust/types";
import { ensureSystemEntityForRegion } from "@features/entities/service";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "20");
  const limit = clamp(Number.isFinite(limitParam) ? limitParam : 20, 1, 100);
  const from = url.searchParams.get("from")
    ? new Date(String(url.searchParams.get("from")))
    : null;
  const to = url.searchParams.get("to")
    ? new Date(String(url.searchParams.get("to")))
    : null;

  const q: any = {};
  if (from || to) {
    q.startAt = {};
    if (from) q.startAt.$gte = from;
    if (to) q.startAt.$lte = to;
  }

  const events = await (await coreCol("events"))
    .find(q)
    .sort({ startAt: 1 })
    .limit(limit)
    .toArray();

  return NextResponse.json({
    ok: true,
    data: events.map((e: any) => ({
      ...e,
      id: String(e._id),
      anlassraumId: e.anlassraumId ? String(e.anlassraumId) : null,
      dossierId: e.dossierId ? String(e.dossierId) : null,
      qrSetCode: e.qrSetCode ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const now = new Date();

  let linkedAnlassraumId: ObjectId | null = null;

  const explicitAnlassraumId = String(body?.anlassraumId ?? "").trim();
  if (explicitAnlassraumId) {
    if (!ObjectId.isValid(explicitAnlassraumId)) {
      return NextResponse.json({ ok: false, error: "invalid_anlassraum_id" }, { status: 400 });
    }
    linkedAnlassraumId = new ObjectId(explicitAnlassraumId);
  }

  const createAnlassraum = body?.createAnlassraum === true;
  if (createAnlassraum) {
    const gate = await requireGovernanceActorOrResponse(req);
    if (gate instanceof Response) return gate;

    const regionKey = deriveRegionKey(body?.regionCode ?? null);
    const scope = normalizeScope(String(body?.scope ?? "")) ?? scopeFromRegion(regionKey);
    const decisionScope = normalizeScope(String(body?.decisionScope ?? "")) ?? scope;

    const entityId = ObjectId.isValid(String(body?.entityId ?? ""))
      ? new ObjectId(String(body.entityId))
      : (
          await ensureSystemEntityForRegion({
            regionKey,
            scope,
            ownerId: defaultOwnerPolicyForActor(gate.actor).ownerId,
          })
        ).entityId;

    const defaults = defaultOwnerPolicyForActor(gate.actor);
    const ownerType = normalizeOwnerType(String(body?.ownerType ?? "")) ?? defaults.ownerType;
    const ownerId = String(body?.ownerId ?? defaults.ownerId).trim() || defaults.ownerId;
    const roomType = normalizeRoomType(String(body?.roomType ?? "")) ?? defaults.roomType;

    const created = await createManualAnlassraum({
      entityId,
      type: "event",
      title: String(body?.title ?? "").trim() || "Event-Anlassraum",
      summary: String(body?.description ?? "").slice(0, 1500),
      topicKey: String(body?.topicKey ?? body?.title ?? "event").trim() || "event",
      regionKey,
      scope,
      decisionScope,
      ownerType,
      ownerId,
      originType: "event",
      roomType,
      createdBy: gate.actor.userId,
      actor: gate.actor,
    });

    linkedAnlassraumId = created.anlassraumId;
  }

  const doc = {
    title: String(body?.title ?? "")
      .trim()
      .slice(0, 200),
    description: body?.description
      ? String(body.description).slice(0, 4000)
      : undefined,
    startAt: new Date(body?.startAt ?? now),
    endAt: body?.endAt ? new Date(body.endAt) : undefined,
    tags: Array.isArray(body?.tags)
      ? body.tags.slice(0, 20).map(String)
      : undefined,
    organizationId: body?.organizationId
      ? String(body.organizationId)
      : undefined,
    regionCode: body?.regionCode ? String(body.regionCode).toUpperCase() : null,
    anlassraumId: linkedAnlassraumId,
    dossierId: body?.dossierId && ObjectId.isValid(String(body.dossierId)) ? new ObjectId(String(body.dossierId)) : null,
    qrSetCode: body?.qrSetCode ? String(body.qrSetCode).trim() : null,
    protocolStatus: "planned",
    location:
      body?.location && Array.isArray(body.location?.coordinates)
        ? {
            type: "Point",
            coordinates: [
              Number(body.location.coordinates[0]),
              Number(body.location.coordinates[1]),
            ] as [number, number],
          }
        : undefined,
    createdAt: now,
    updatedAt: now,
  };
  if (!doc.title)
    return NextResponse.json({ error: "title required" }, { status: 400 });

  const col = await coreCol("events");
  const ins = await col.insertOne(doc);
  return NextResponse.json(
    {
      ok: true,
      id: String(ins.insertedId),
      anlassraumId: linkedAnlassraumId?.toHexString() ?? null,
      dossierId: doc.dossierId ? String(doc.dossierId) : null,
    },
    { status: 201 },
  );
}

function deriveRegionKey(regionCode: string | null): string | null {
  const normalized = normalizeRegionCode(regionCode ?? null);
  if (!normalized) return null;
  return buildRegionKey(normalized);
}

function normalizeScope(value: string): AnlassraumScope | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (!ANLASSRAUM_SCOPES.includes(normalized as AnlassraumScope)) return null;
  return normalized as AnlassraumScope;
}

function scopeFromRegion(regionKey: string | null): AnlassraumScope {
  if (!regionKey) return "global";
  const parts = regionKey.split(":");
  if (parts[2]) return "local";
  if (parts[1]) return "regional";
  return "national";
}

function defaultOwnerPolicyForActor(actor: GovernanceActor): {
  ownerType: AnlassraumOwnerType;
  ownerId: string;
  roomType: RoomType;
} {
  if (actor.role === "editorial_actor") {
    return {
      ownerType: "media",
      ownerId: actor.userId,
      roomType: "editorial",
    };
  }
  if (actor.role === "institutional_actor") {
    const scoped = (actor.scopedOwnerIds ?? []).map((value) => String(value || "").trim()).filter(Boolean);
    return {
      ownerType: "organization",
      ownerId: scoped[0] ?? actor.userId,
      roomType: "official",
    };
  }
  return {
    ownerType: "system",
    ownerId: "event-flow",
    roomType: "community",
  };
}

function normalizeOwnerType(value: string): AnlassraumOwnerType | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (!ANLASSRAUM_OWNER_TYPES.includes(normalized as AnlassraumOwnerType)) return null;
  return normalized as AnlassraumOwnerType;
}

function normalizeRoomType(value: string): RoomType | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "public") return "public";
  if (normalized === "community") return "community";
  if (normalized === "official") return "official";
  if (normalized === "editorial") return "editorial";
  if (normalized === "internal") return "internal";
  if (normalized === "hybrid") return "hybrid";
  return null;
}
