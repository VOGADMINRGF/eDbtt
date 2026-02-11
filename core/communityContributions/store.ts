import { ObjectId, coreCol } from "@core/db/triMongo";
import type { Collection, Filter, WithId } from "mongodb";
import type { CommunityContribution, CommunityContributionStatus } from "./types";

type CommunityContributionDoc = Omit<CommunityContribution, "id"> & { _id: ObjectId };

type ContributionFilter = {
  topicId?: string | null;
  candidateId?: string | null;
  status?: CommunityContributionStatus;
  limit?: number;
};

async function contributionsCol(): Promise<Collection<CommunityContributionDoc>> {
  return coreCol<CommunityContributionDoc>("communityContributions");
}

function sanitize(doc: WithId<CommunityContributionDoc>): CommunityContribution {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toHexString() };
}

function buildFilter(filter?: ContributionFilter): Filter<CommunityContributionDoc> {
  const query: Filter<CommunityContributionDoc> = {};
  if (filter?.topicId) query.topicId = filter.topicId;
  if (filter?.candidateId) query.candidateId = filter.candidateId;
  if (filter?.status) query.status = filter.status;
  return query;
}

export async function listCommunityContributions(
  filter?: ContributionFilter,
): Promise<CommunityContribution[]> {
  const col = await contributionsCol();
  const query = buildFilter(filter);
  const cursor = col.find(query).sort({ createdAt: -1 });
  const docs =
    typeof filter?.limit === "number" ? await cursor.limit(filter.limit).toArray() : await cursor.toArray();
  return docs.map(sanitize);
}

export async function createCommunityContribution(
  input: CommunityContribution,
): Promise<CommunityContribution> {
  const col = await contributionsCol();
  const now = new Date();
  const doc: CommunityContributionDoc = {
    _id: new ObjectId(),
    type: input.type,
    status: input.status ?? "proposed",
    topicId: input.topicId ?? null,
    candidateId: input.candidateId ?? null,
    title: input.title ?? null,
    body: input.body ?? null,
    url: input.url ?? null,
    authorName: input.authorName ?? null,
    authorId: input.authorId ?? null,
    reviewNote: input.reviewNote ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return sanitize(doc);
}

export async function updateCommunityContributionStatus(
  id: string,
  status: CommunityContributionStatus,
  reviewNote?: string | null,
): Promise<CommunityContribution | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await contributionsCol();
  const update: Partial<CommunityContributionDoc> = {
    status,
    updatedAt: new Date(),
  };
  if (reviewNote !== undefined) update.reviewNote = reviewNote;
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );
  return result ? sanitize(result) : null;
}
