import { ObjectId, coreCol } from "@core/db/triMongo";
import type { Collection, Filter, WithId } from "mongodb";
import type {
  Campaign,
  CampaignQuestion,
  CampaignQuestionStatus,
  CampaignResponse,
  CampaignSession,
  CampaignStatus,
} from "./types";

type CampaignDoc = Omit<Campaign, "id"> & { _id: ObjectId };
type CampaignSessionDoc = Omit<CampaignSession, "id" | "campaignId" | "userId"> & {
  _id: ObjectId;
  campaignId: ObjectId;
  userId: ObjectId | null;
};
type CampaignQuestionDoc = Omit<CampaignQuestion, "id" | "campaignId"> & {
  _id: ObjectId;
  campaignId: ObjectId;
};
type CampaignResponseDoc = Omit<CampaignResponse, "id" | "campaignId" | "questionId" | "sessionId"> & {
  _id: ObjectId;
  campaignId: ObjectId;
  questionId: ObjectId;
  sessionId: ObjectId;
};

type CampaignFilter = {
  status?: CampaignStatus;
  search?: string;
  limit?: number;
};
type CampaignQuestionFilter = {
  status?: CampaignQuestionStatus;
};

async function campaignsCol(): Promise<Collection<CampaignDoc>> {
  return coreCol<CampaignDoc>("campaigns");
}

async function campaignSessionsCol(): Promise<Collection<CampaignSessionDoc>> {
  return coreCol<CampaignSessionDoc>("campaignSessions");
}

async function campaignQuestionsCol(): Promise<Collection<CampaignQuestionDoc>> {
  return coreCol<CampaignQuestionDoc>("campaignQuestions");
}

async function campaignResponsesCol(): Promise<Collection<CampaignResponseDoc>> {
  return coreCol<CampaignResponseDoc>("campaignResponses");
}

function sanitizeCampaign(doc: WithId<CampaignDoc>): Campaign {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toHexString() };
}

function sanitizeSession(doc: WithId<CampaignSessionDoc>): CampaignSession {
  const { _id, campaignId, userId, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
    campaignId: campaignId.toHexString(),
    userId: userId ? userId.toHexString() : null,
  };
}

function sanitizeQuestion(doc: WithId<CampaignQuestionDoc>): CampaignQuestion {
  const { _id, campaignId, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
    campaignId: campaignId.toHexString(),
  };
}

function sanitizeResponse(doc: WithId<CampaignResponseDoc>): CampaignResponse {
  const { _id, campaignId, questionId, sessionId, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
    campaignId: campaignId.toHexString(),
    questionId: questionId.toHexString(),
    sessionId: sessionId.toHexString(),
  };
}

function buildCampaignFilter(filter?: CampaignFilter): Filter<CampaignDoc> {
  const query: Filter<CampaignDoc> = {};
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

export async function listCampaigns(filter?: CampaignFilter): Promise<Campaign[]> {
  const col = await campaignsCol();
  const query = buildCampaignFilter(filter);
  const cursor = col.find(query).sort({ createdAt: -1 });
  const docs =
    typeof filter?.limit === "number" ? await cursor.limit(filter.limit).toArray() : await cursor.toArray();
  return docs.map(sanitizeCampaign);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await campaignsCol();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? sanitizeCampaign(doc) : null;
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  const clean = slug?.trim();
  if (!clean) return null;
  const col = await campaignsCol();
  const doc = await col.findOne({ slug: clean });
  return doc ? sanitizeCampaign(doc) : null;
}

export async function getCampaignSessionById(id: string): Promise<CampaignSession | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await campaignSessionsCol();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? sanitizeSession(doc) : null;
}

export async function saveCampaign(input: Campaign): Promise<Campaign> {
  const col = await campaignsCol();
  const now = new Date();
  const id = input.id && ObjectId.isValid(input.id) ? new ObjectId(input.id) : null;
  const title = input.title?.trim() || "Unbenannte Kampagne";
  const slug = input.slug?.trim() || slugify(title) || `campaign-${now.getTime()}`;

  const payload: Partial<CampaignDoc> = {
    slug,
    title,
    description: input.description?.trim() || "",
    status: input.status ?? "draft",
    kind: input.kind ?? "custom",
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    goal: input.goal?.trim() || "",
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
    const doc = result.value ?? ({ _id: id, ...payload, createdAt: now } as CampaignDoc);
    return sanitizeCampaign(doc);
  }

  const insertResult = await col.insertOne({ ...payload, createdAt: now } as CampaignDoc);
  return sanitizeCampaign({ _id: insertResult.insertedId, ...payload, createdAt: now } as CampaignDoc);
}

export async function createCampaignSession(input: CampaignSession): Promise<CampaignSession | null> {
  if (!ObjectId.isValid(input.campaignId)) return null;
  const col = await campaignSessionsCol();
  const now = new Date();
  const campaignId = new ObjectId(input.campaignId);
  const userId = input.userId && ObjectId.isValid(input.userId) ? new ObjectId(input.userId) : null;
  const sessionCode = input.sessionCode?.trim() || null;

  if (userId) {
    const existing = await col.findOne({
      campaignId,
      userId,
      joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (existing) return sanitizeSession(existing);
  }

  const doc: CampaignSessionDoc = {
    _id: new ObjectId(),
    campaignId,
    userId,
    source: input.source ?? "link",
    regionCode: input.regionCode ?? null,
    sessionCode,
    joinedAt: now,
    meta: input.meta ?? {},
  };

  await col.insertOne(doc);
  return sanitizeSession(doc);
}

export async function listCampaignQuestions(
  campaignId: string,
  filter?: CampaignQuestionFilter,
): Promise<CampaignQuestion[]> {
  if (!ObjectId.isValid(campaignId)) return [];
  const col = await campaignQuestionsCol();
  const query: Filter<CampaignQuestionDoc> = { campaignId: new ObjectId(campaignId) };
  if (filter?.status) query.status = filter.status;
  const docs = await col.find(query).sort({ order: 1, createdAt: 1 }).toArray();
  return docs.map(sanitizeQuestion);
}

export async function getCampaignQuestionById(id: string): Promise<CampaignQuestion | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await campaignQuestionsCol();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? sanitizeQuestion(doc) : null;
}

export async function saveCampaignQuestion(input: CampaignQuestion): Promise<CampaignQuestion | null> {
  if (!ObjectId.isValid(input.campaignId)) return null;
  const col = await campaignQuestionsCol();
  const now = new Date();
  const id = input.id && ObjectId.isValid(input.id) ? new ObjectId(input.id) : null;

  const payload: Partial<CampaignQuestionDoc> = {
    campaignId: new ObjectId(input.campaignId),
    prompt: input.prompt?.trim() || "Unbenannte Frage",
    description: input.description?.trim() || "",
    type: input.type ?? "choice",
    options: input.options ?? [],
    order: typeof input.order === "number" ? input.order : 0,
    status: input.status ?? "active",
    updatedAt: now,
  };

  if (id) {
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: payload, $setOnInsert: { createdAt: now } },
      { upsert: true, returnDocument: "after", includeResultMetadata: true },
    );
    const doc = result.value ?? ({ _id: id, ...payload, createdAt: now } as CampaignQuestionDoc);
    return sanitizeQuestion(doc);
  }

  const insertResult = await col.insertOne({ ...payload, createdAt: now } as CampaignQuestionDoc);
  return sanitizeQuestion({ _id: insertResult.insertedId, ...payload, createdAt: now } as CampaignQuestionDoc);
}

export async function createCampaignResponse(input: CampaignResponse): Promise<CampaignResponse | null> {
  if (
    !ObjectId.isValid(input.campaignId) ||
    !ObjectId.isValid(input.questionId) ||
    !ObjectId.isValid(input.sessionId)
  ) {
    return null;
  }
  const col = await campaignResponsesCol();
  const now = new Date();
  const query = {
    campaignId: new ObjectId(input.campaignId),
    questionId: new ObjectId(input.questionId),
    sessionId: new ObjectId(input.sessionId),
  };

  const existing = await col.findOne(query);
  if (existing) return sanitizeResponse(existing);

  const doc: CampaignResponseDoc = {
    _id: new ObjectId(),
    campaignId: query.campaignId,
    questionId: query.questionId,
    sessionId: query.sessionId,
    answer: input.answer?.trim() || "",
    createdAt: now,
  };

  if (!doc.answer) return null;
  await col.insertOne(doc);
  return sanitizeResponse(doc);
}

export async function listCampaignResponses(campaignId: string): Promise<CampaignResponse[]> {
  if (!ObjectId.isValid(campaignId)) return [];
  const col = await campaignResponsesCol();
  const docs = await col.find({ campaignId: new ObjectId(campaignId) }).toArray();
  return docs.map(sanitizeResponse);
}

export async function getCampaignReport(campaignId: string): Promise<{
  totalResponses: number;
  questions: CampaignQuestion[];
  breakdown: Record<string, { total: number; answers: Record<string, number> }>;
}> {
  const questions = await listCampaignQuestions(campaignId);
  const responses = await listCampaignResponses(campaignId);
  const breakdown: Record<string, { total: number; answers: Record<string, number> }> = {};

  for (const question of questions) {
    breakdown[question.id!] = { total: 0, answers: {} };
  }

  for (const response of responses) {
    if (!breakdown[response.questionId]) {
      breakdown[response.questionId] = { total: 0, answers: {} };
    }
    const entry = breakdown[response.questionId];
    entry.total += 1;
    entry.answers[response.answer] = (entry.answers[response.answer] ?? 0) + 1;
  }

  return { totalResponses: responses.length, questions, breakdown };
}

export async function getCampaignStats(campaignId: string): Promise<{
  totalSessions: number;
  uniqueUsers: number;
  lastJoinedAt: Date | null;
}> {
  if (!ObjectId.isValid(campaignId)) {
    return { totalSessions: 0, uniqueUsers: 0, lastJoinedAt: null };
  }
  const col = await campaignSessionsCol();
  const oid = new ObjectId(campaignId);
  const totalSessions = await col.countDocuments({ campaignId: oid });
  const distinctUsers = await col.distinct("userId", { campaignId: oid, userId: { $ne: null } });
  const last = await col.find({ campaignId: oid }).sort({ joinedAt: -1 }).limit(1).toArray();
  const lastJoinedAt = last[0]?.joinedAt ? new Date(last[0].joinedAt) : null;
  return { totalSessions, uniqueUsers: distinctUsers.length, lastJoinedAt };
}
