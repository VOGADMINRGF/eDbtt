import { coreCol, ObjectId, type ObjectId as ObjectIdType } from "@core/db/triMongo";
import type {
  StreamSessionDoc,
  StreamAgendaItemDoc,
  StreamModerationQueueItemDoc,
  StreamCallInDoc,
  StreamPublicInputDoc,
} from "./types";

const SESSION_COLLECTION = "stream_sessions";
const AGENDA_COLLECTION = "stream_agenda_items";
const MODERATION_COLLECTION = "stream_moderation_queue";
const CALLIN_COLLECTION = "stream_callins";
const PUBLIC_INPUT_COLLECTION = "stream_public_inputs";

const ensured = {
  sessions: false,
  agenda: false,
  moderation: false,
  callins: false,
  publicInputs: false,
};

async function ensureSessionIndexes() {
  if (ensured.sessions) return;
  const col = await coreCol<StreamSessionDoc>(SESSION_COLLECTION);
  await col.createIndex({ creatorId: 1, createdAt: -1 });
  await col.createIndex({ isLive: 1 });
  await col.createIndex({ slug: 1 }, { sparse: true });
  await col.createIndex({ visibility: 1, topicKey: 1, updatedAt: -1 });
  ensured.sessions = true;
}

async function ensureAgendaIndexes() {
  if (ensured.agenda) return;
  const col = await coreCol<StreamAgendaItemDoc>(AGENDA_COLLECTION);
  await col.createIndex({ sessionId: 1, createdAt: 1 });
  await col.createIndex({ sessionId: 1, status: 1 });
  ensured.agenda = true;
}

async function ensureModerationIndexes() {
  if (ensured.moderation) return;
  const col = await coreCol<StreamModerationQueueItemDoc>(MODERATION_COLLECTION);
  await col.createIndex({ sessionId: 1, createdAt: -1 });
  await col.createIndex({ sessionId: 1, status: 1 });
  ensured.moderation = true;
}

async function ensureCallInIndexes() {
  if (ensured.callins) return;
  const col = await coreCol<StreamCallInDoc>(CALLIN_COLLECTION);
  await col.createIndex({ sessionId: 1, createdAt: -1 });
  await col.createIndex({ sessionId: 1, status: 1 });
  ensured.callins = true;
}

async function ensurePublicInputIndexes() {
  if (ensured.publicInputs) return;
  const col = await coreCol<StreamPublicInputDoc>(PUBLIC_INPUT_COLLECTION);
  await col.createIndex({ inputId: 1 }, { unique: true });
  await col.createIndex({ streamSessionId: 1, createdAt: -1 });
  await col.createIndex({ anlassraumId: 1, createdAt: -1 }, { sparse: true });
  await col.createIndex({ dossierId: 1, createdAt: -1 }, { sparse: true });
  ensured.publicInputs = true;
}

export async function streamSessionsCol() {
  await ensureSessionIndexes();
  return coreCol<StreamSessionDoc>(SESSION_COLLECTION);
}

export async function streamAgendaCol() {
  await ensureAgendaIndexes();
  return coreCol<StreamAgendaItemDoc>(AGENDA_COLLECTION);
}

export async function streamModerationQueueCol() {
  await ensureModerationIndexes();
  return coreCol<StreamModerationQueueItemDoc>(MODERATION_COLLECTION);
}

export async function streamCallInsCol() {
  await ensureCallInIndexes();
  return coreCol<StreamCallInDoc>(CALLIN_COLLECTION);
}

export async function streamPublicInputsCol() {
  await ensurePublicInputIndexes();
  return coreCol<StreamPublicInputDoc>(PUBLIC_INPUT_COLLECTION);
}

export function toObjectId(id: string | ObjectIdType): ObjectId {
  return typeof id === "string" ? new ObjectId(id) : id;
}
