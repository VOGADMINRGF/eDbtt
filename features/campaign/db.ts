import { coreCol, ObjectId, type ObjectId as ObjectIdType } from "@core/db/triMongo";
import type { CampaignDoc, CampaignParticipantDoc, CampaignSessionDoc } from "./types";

const CAMPAIGN_COLLECTION = "campaigns";
const SESSION_COLLECTION = "campaign_sessions";
const PARTICIPANT_COLLECTION = "campaign_participants";

const ensured = {
  campaigns: false,
  sessions: false,
  participants: false,
};

async function ensureCampaignIndexes() {
  if (ensured.campaigns) return;
  const col = await coreCol<CampaignDoc>(CAMPAIGN_COLLECTION);
  await col.createIndex({ status: 1, createdAt: -1 });
  await col.createIndex({ regionCode: 1, topicKey: 1 });
  ensured.campaigns = true;
}

async function ensureSessionIndexes() {
  if (ensured.sessions) return;
  const col = await coreCol<CampaignSessionDoc>(SESSION_COLLECTION);
  await col.createIndex({ campaignId: 1, createdAt: -1 });
  ensured.sessions = true;
}

async function ensureParticipantIndexes() {
  if (ensured.participants) return;
  const col = await coreCol<CampaignParticipantDoc>(PARTICIPANT_COLLECTION);
  await col.createIndex({ campaignId: 1, joinedAt: -1 });
  await col.createIndex({ campaignId: 1, userId: 1 }, { unique: true, sparse: true });
  await col.createIndex({ campaignId: 1, anonHash: 1 }, { unique: true, sparse: true });
  ensured.participants = true;
}

export async function campaignsCol() {
  await ensureCampaignIndexes();
  return coreCol<CampaignDoc>(CAMPAIGN_COLLECTION);
}

export async function campaignSessionsCol() {
  await ensureSessionIndexes();
  return coreCol<CampaignSessionDoc>(SESSION_COLLECTION);
}

export async function campaignParticipantsCol() {
  await ensureParticipantIndexes();
  return coreCol<CampaignParticipantDoc>(PARTICIPANT_COLLECTION);
}

export function toObjectId(id: string | ObjectIdType): ObjectId {
  return typeof id === "string" ? new ObjectId(id) : id;
}
