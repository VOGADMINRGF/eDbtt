import { ObjectId } from "@core/db/triMongo";
import type { GovernanceActor } from "@features/trust/types";
import { entityCol } from "./db";
import { assertEntityTransition } from "./stateMachine";
import type {
  EntityDoc,
  EntityOwnerType,
  EntityScope,
  EntityStatus,
  EntityType,
} from "./types";

type CreateEntityManualInput = {
  type: EntityType;
  slug: string;
  name: string;
  regionKey?: string | null;
  scope: EntityScope;
  status?: EntityStatus;
  ownerType: EntityOwnerType;
  ownerId: string;
  stewardUserId?: string | null;
};

type TransitionEntityStatusInput = {
  entityId: ObjectId | string;
  nextStatus: EntityStatus;
};

type EnsureSystemEntityInput = {
  regionKey?: string | null;
  scope?: EntityScope;
  ownerId?: string;
};

const INSTITUTIONAL_ENTITY_OWNER_TYPES = new Set<EntityOwnerType>([
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

export async function createEntityManual(input: CreateEntityManualInput): Promise<ObjectId> {
  const col = await entityCol();
  const now = new Date();
  const doc: EntityDoc = {
    type: input.type,
    slug: normalizeSlug(input.slug),
    name: String(input.name || "").trim(),
    regionKey: normalizeRegionKey(input.regionKey ?? null),
    scope: input.scope,
    status: input.status ?? "draft",
    ownerType: input.ownerType,
    ownerId: normalizeOwnerId(input.ownerId),
    stewardUserId: normalizeUserId(input.stewardUserId ?? null),
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
    publishedAt: null,
    archivedAt: null,
  };

  if (!doc.name) {
    throw new Error("entity_name_required");
  }

  const inserted = await col.insertOne(doc);
  return inserted.insertedId;
}

export async function createEntityManualAuthorized(
  actor: GovernanceActor,
  input: CreateEntityManualInput,
): Promise<ObjectId> {
  if (!canActorCreateEntity(actor, input)) {
    throw new Error("actor_scope_forbidden");
  }
  return createEntityManual(input);
}

export async function getEntityById(entityId: ObjectId | string): Promise<EntityDoc | null> {
  const col = await entityCol();
  const id = toObjectId(entityId);
  return col.findOne({ _id: id });
}

export async function transitionEntityStatus(input: TransitionEntityStatusInput): Promise<EntityDoc> {
  const col = await entityCol();
  const id = toObjectId(input.entityId);
  const current = await col.findOne({ _id: id });
  if (!current) {
    throw new Error("entity_not_found");
  }

  assertEntityTransition(current.status, input.nextStatus);

  const now = new Date();
  const set: Partial<EntityDoc> = {
    status: input.nextStatus,
    updatedAt: now,
  };
  if (input.nextStatus === "approved") set.approvedAt = now;
  if (input.nextStatus === "published") set.publishedAt = now;
  if (input.nextStatus === "archived") set.archivedAt = now;

  await col.updateOne(
    { _id: id },
    {
      $set: set,
    },
  );

  const updated = await col.findOne({ _id: id });
  if (!updated) {
    throw new Error("entity_not_found_after_update");
  }
  return updated;
}

export async function ensureSystemEntityForRegion(
  input: EnsureSystemEntityInput,
): Promise<{ entityId: ObjectId; created: boolean }> {
  const col = await entityCol();
  const regionKey = normalizeRegionKey(input.regionKey ?? null);
  const scope = input.scope ?? deriveScopeFromRegion(regionKey);
  const slug = buildSystemEntitySlug(regionKey, scope);

  const existing = await col.findOne({ slug });
  if (existing?._id) {
    return { entityId: existing._id, created: false };
  }

  const now = new Date();
  const doc: EntityDoc = {
    type: scope === "local" ? "municipality" : "other",
    slug,
    name: scope === "local" ? "Kommunaler Governance-Raum" : "Governance-Rahmen",
    regionKey,
    scope,
    status: "draft",
    ownerType: "system",
    ownerId: normalizeOwnerId(input.ownerId ?? "system"),
    stewardUserId: null,
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
    publishedAt: null,
    archivedAt: null,
  };

  try {
    const inserted = await col.insertOne(doc);
    return { entityId: inserted.insertedId, created: true };
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error && "code" in error
        ? (error as { code?: number }).code
        : undefined;
    if (code === 11000) {
      const winner = await col.findOne({ slug });
      if (winner?._id) {
        return { entityId: winner._id, created: false };
      }
    }
    throw error;
  }
}

export function buildSystemEntitySlug(regionKey: string | null, scope: EntityScope): string {
  const region = (regionKey ?? "global").toLowerCase().replace(/[:\s]+/g, "-");
  return normalizeSlug(`entity-${scope}-${region}`);
}

export function canActorReadEntity(actor: GovernanceActor, entity: EntityDoc): boolean {
  if (actor.isAdmin || actor.role === "admin") return true;

  if (actor.role === "reviewer") return true;

  if (actor.role === "editorial_actor") {
    return entity.type === "media" || entity.ownerType === "media";
  }

  if (actor.role === "institutional_actor") {
    const scoped = new Set((actor.scopedOwnerIds ?? []).map((value) => String(value || "").trim()).filter(Boolean));
    const ownerId = String(entity.ownerId || "").trim();
    if (ownerId && scoped.has(ownerId)) return true;
    if (entity.stewardUserId && entity.stewardUserId === actor.userId) return true;
    return false;
  }

  return false;
}

export function canActorCreateEntity(
  actor: GovernanceActor,
  input: Pick<CreateEntityManualInput, "ownerType" | "ownerId" | "type">,
): boolean {
  if (actor.isAdmin || actor.role === "admin") return true;
  if (actor.role === "reviewer") return false;

  const ownerId = String(input.ownerId || "").trim();
  if (!ownerId) return false;
  const scoped = new Set((actor.scopedOwnerIds ?? []).map((value) => String(value || "").trim()).filter(Boolean));

  if (actor.role === "editorial_actor") {
    if (input.type !== "media") return false;
    if (input.ownerType !== "media") return false;
    return scoped.has(ownerId) || ownerId === actor.userId;
  }

  if (actor.role === "institutional_actor") {
    if (!INSTITUTIONAL_ENTITY_OWNER_TYPES.has(input.ownerType)) return false;
    return scoped.has(ownerId);
  }

  return false;
}

function normalizeSlug(input: string): string {
  const value = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
  if (!value) {
    throw new Error("entity_slug_required");
  }
  return value;
}

function normalizeOwnerId(input: string): string {
  const value = String(input || "").trim();
  if (!value) {
    throw new Error("entity_owner_id_required");
  }
  return value;
}

function normalizeUserId(input: string | null): string | null {
  const value = String(input || "").trim();
  return value || null;
}

function normalizeRegionKey(input: string | null): string | null {
  const value = String(input || "").trim();
  return value || null;
}

function deriveScopeFromRegion(regionKey: string | null): EntityScope {
  if (!regionKey) return "global";
  const parts = regionKey.split(":");
  if (parts[2]) return "local";
  if (parts[1]) return "regional";
  return "national";
}

function toObjectId(value: ObjectId | string): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}
