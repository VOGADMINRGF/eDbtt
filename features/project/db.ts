import { coreCol, ObjectId, type ObjectId as ObjectIdType } from "@core/db/triMongo";
import type { ProjectDoc, ProjectVoteDoc } from "./types";

const PROJECT_COLLECTION = "projects";
const PROJECT_VOTE_COLLECTION = "project_votes";

const ensured = {
  projects: false,
  votes: false,
};

async function ensureProjectIndexes() {
  if (ensured.projects) return;
  const col = await coreCol<ProjectDoc>(PROJECT_COLLECTION);
  await col.createIndex({ status: 1, createdAt: -1 });
  await col.createIndex({ orgId: 1, createdAt: -1 });
  ensured.projects = true;
}

async function ensureVoteIndexes() {
  if (ensured.votes) return;
  const col = await coreCol<ProjectVoteDoc>(PROJECT_VOTE_COLLECTION);
  await col.createIndex({ projectId: 1, createdAt: -1 });
  await col.createIndex({ projectId: 1, topicId: 1 });
  await col.createIndex({ projectId: 1, topicId: 1, voterKey: 1 }, { unique: true });
  ensured.votes = true;
}

export async function projectsCol() {
  await ensureProjectIndexes();
  return coreCol<ProjectDoc>(PROJECT_COLLECTION);
}

export async function projectVotesCol() {
  await ensureVoteIndexes();
  return coreCol<ProjectVoteDoc>(PROJECT_VOTE_COLLECTION);
}

export function toObjectId(id: string | ObjectIdType): ObjectId {
  return typeof id === "string" ? new ObjectId(id) : id;
}
