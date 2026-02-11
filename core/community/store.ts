import { ObjectId, coreCol } from "@core/db/triMongo";
import { maskUserId } from "@core/pii/redact";
import type { Collection, Filter, WithId } from "mongodb";
import type { CommunityMessage, CommunityRoom, CommunityRoomStatus } from "./types";

type CommunityRoomDoc = Omit<CommunityRoom, "id"> & { _id: ObjectId };
type CommunityMessageDoc = Omit<CommunityMessage, "id" | "roomId" | "authorId" | "authorIdMasked"> & {
  _id: ObjectId;
  roomId: ObjectId;
  authorId: ObjectId | null;
};

type RoomFilter = {
  status?: CommunityRoomStatus;
  search?: string;
  limit?: number;
};

async function roomsCol(): Promise<Collection<CommunityRoomDoc>> {
  return coreCol<CommunityRoomDoc>("communityRooms");
}

async function messagesCol(): Promise<Collection<CommunityMessageDoc>> {
  return coreCol<CommunityMessageDoc>("communityMessages");
}

function sanitizeRoom(doc: WithId<CommunityRoomDoc>): CommunityRoom {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toHexString() };
}

function sanitizeMessage(doc: WithId<CommunityMessageDoc>): CommunityMessage {
  const { _id, roomId, authorId, ...rest } = doc;
  const authorIdString = authorId ? authorId.toHexString() : null;
  return {
    ...rest,
    id: _id.toHexString(),
    roomId: roomId.toHexString(),
    authorId: authorIdString,
    authorIdMasked: maskUserId(authorIdString),
  };
}

function buildRoomFilter(filter?: RoomFilter): Filter<CommunityRoomDoc> {
  const query: Filter<CommunityRoomDoc> = {};
  if (filter?.status) query.status = filter.status;
  if (filter?.search) {
    const text = filter.search.trim();
    if (text) {
      const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: regex }, { description: regex }, { tags: { $in: [text] } }];
    }
  }
  return query;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function listCommunityRooms(filter?: RoomFilter): Promise<CommunityRoom[]> {
  const col = await roomsCol();
  const query = buildRoomFilter(filter);
  const cursor = col.find(query).sort({ createdAt: -1 });
  const docs =
    typeof filter?.limit === "number" ? await cursor.limit(filter.limit).toArray() : await cursor.toArray();
  return docs.map(sanitizeRoom);
}

export async function getCommunityRoomById(id: string): Promise<CommunityRoom | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await roomsCol();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? sanitizeRoom(doc) : null;
}

export async function getCommunityRoomBySlug(slug: string): Promise<CommunityRoom | null> {
  const clean = slug?.trim();
  if (!clean) return null;
  const col = await roomsCol();
  const doc = await col.findOne({ slug: clean });
  return doc ? sanitizeRoom(doc) : null;
}

export async function saveCommunityRoom(input: CommunityRoom): Promise<CommunityRoom> {
  const col = await roomsCol();
  const now = new Date();
  const id = input.id && ObjectId.isValid(input.id) ? new ObjectId(input.id) : null;
  const title = input.title?.trim() || "Unbenannter Raum";
  const slug = input.slug?.trim() || slugify(title) || `room-${now.getTime()}`;

  const payload: Partial<CommunityRoomDoc> = {
    slug,
    title,
    description: input.description?.trim() || "",
    status: input.status ?? "open",
    tags: input.tags ?? [],
    createdBy: input.createdBy ?? null,
    updatedAt: now,
  };

  if (id) {
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: payload, $setOnInsert: { createdAt: now } },
      { upsert: true, returnDocument: "after", includeResultMetadata: true },
    );
    const doc = result.value ?? ({ _id: id, ...payload, createdAt: now } as CommunityRoomDoc);
    return sanitizeRoom(doc);
  }

  const insertResult = await col.insertOne({ ...payload, createdAt: now } as CommunityRoomDoc);
  return sanitizeRoom({ _id: insertResult.insertedId, ...payload, createdAt: now } as CommunityRoomDoc);
}

export async function listCommunityMessages(roomId: string, limit = 50): Promise<CommunityMessage[]> {
  if (!ObjectId.isValid(roomId)) return [];
  const col = await messagesCol();
  const oid = new ObjectId(roomId);
  const docs = await col.find({ roomId: oid }).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map(sanitizeMessage);
}

export async function createCommunityMessage(input: CommunityMessage): Promise<CommunityMessage | null> {
  if (!ObjectId.isValid(input.roomId)) return null;
  const roomId = new ObjectId(input.roomId);
  const authorId = input.authorId && ObjectId.isValid(input.authorId) ? new ObjectId(input.authorId) : null;
  const now = new Date();
  const col = await messagesCol();
  const body = input.body?.trim();
  if (!body) return null;

  const doc: CommunityMessageDoc = {
    _id: new ObjectId(),
    roomId,
    authorId,
    body,
    locale: input.locale ?? null,
    createdAt: now,
  };

  await col.insertOne(doc);
  return sanitizeMessage(doc);
}
