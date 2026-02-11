import { ObjectId, coreCol } from "@core/db/triMongo";
import type { Collection, Filter, WithId } from "mongodb";
import type {
  MediaProject,
  MediaProjectOption,
  MediaProjectOptionStatus,
  MediaProjectStatus,
  MediaProjectTopic,
} from "./types";

type MediaProjectDoc = Omit<MediaProject, "id"> & { _id: ObjectId };
type MediaProjectTopicDoc = Omit<MediaProjectTopic, "id" | "projectId"> & {
  _id: ObjectId;
  projectId: ObjectId;
};
type MediaProjectOptionDoc = Omit<MediaProjectOption, "id" | "projectId" | "topicId"> & {
  _id: ObjectId;
  projectId: ObjectId;
  topicId: ObjectId;
};

async function projectsCol(): Promise<Collection<MediaProjectDoc>> {
  return coreCol<MediaProjectDoc>("mediaProjects");
}

async function topicsCol(): Promise<Collection<MediaProjectTopicDoc>> {
  return coreCol<MediaProjectTopicDoc>("mediaProjectTopics");
}

async function optionsCol(): Promise<Collection<MediaProjectOptionDoc>> {
  return coreCol<MediaProjectOptionDoc>("mediaProjectOptions");
}

function sanitizeProject(doc: WithId<MediaProjectDoc>): MediaProject {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toHexString() };
}

function sanitizeTopic(doc: WithId<MediaProjectTopicDoc>): MediaProjectTopic {
  const { _id, projectId, ...rest } = doc;
  return { ...rest, id: _id.toHexString(), projectId: projectId.toHexString() };
}

function sanitizeOption(doc: WithId<MediaProjectOptionDoc>): MediaProjectOption {
  const { _id, projectId, topicId, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
    projectId: projectId.toHexString(),
    topicId: topicId.toHexString(),
  };
}

function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function listMediaProjects(filter?: {
  status?: MediaProjectStatus;
}): Promise<MediaProject[]> {
  const col = await projectsCol();
  const query: Filter<MediaProjectDoc> = {};
  if (filter?.status) query.status = filter.status;
  const docs = await col.find(query).sort({ updatedAt: -1, createdAt: -1 }).toArray();
  return docs.map(sanitizeProject);
}

export async function getMediaProjectById(projectId: string): Promise<MediaProject | null> {
  const oid = toObjectId(projectId);
  if (!oid) return null;
  const col = await projectsCol();
  const doc = await col.findOne({ _id: oid });
  return doc ? sanitizeProject(doc) : null;
}

export async function listMediaProjectTopics(projectId: string): Promise<MediaProjectTopic[]> {
  const oid = toObjectId(projectId);
  if (!oid) return [];
  const col = await topicsCol();
  const docs = await col.find({ projectId: oid }).sort({ order: 1, createdAt: 1 }).toArray();
  return docs.map(sanitizeTopic);
}

export async function listMediaProjectOptions(filter?: {
  projectId?: string;
  topicId?: string;
  status?: MediaProjectOptionStatus;
}): Promise<MediaProjectOption[]> {
  const col = await optionsCol();
  const query: Filter<MediaProjectOptionDoc> = {};
  if (filter?.projectId) {
    const oid = toObjectId(filter.projectId);
    if (!oid) return [];
    query.projectId = oid;
  }
  if (filter?.topicId) {
    const oid = toObjectId(filter.topicId);
    if (!oid) return [];
    query.topicId = oid;
  }
  if (filter?.status) query.status = filter.status;
  const docs = await col.find(query).sort({ createdAt: 1 }).toArray();
  return docs.map(sanitizeOption);
}

export async function getMediaProjectOptionById(optionId: string): Promise<MediaProjectOption | null> {
  const oid = toObjectId(optionId);
  if (!oid) return null;
  const col = await optionsCol();
  const doc = await col.findOne({ _id: oid });
  return doc ? sanitizeOption(doc) : null;
}

export async function createMediaProject(input: {
  title: string;
  summary?: string | null;
  status?: MediaProjectStatus;
  topics: Array<{ title: string; options: string[] }>;
  minOptions?: number;
}): Promise<{
  project: MediaProject;
  topics: MediaProjectTopic[];
  options: MediaProjectOption[];
}> {
  const now = new Date();
  const projectDoc: MediaProjectDoc = {
    _id: new ObjectId(),
    title: input.title,
    summary: input.summary ?? null,
    status: input.status ?? "draft",
    minOptions: input.minOptions ?? 5,
    createdAt: now,
    updatedAt: now,
  };

  const topicDocs: MediaProjectTopicDoc[] = input.topics.map((topic, index) => ({
    _id: new ObjectId(),
    projectId: projectDoc._id,
    title: topic.title,
    order: index + 1,
    createdAt: now,
    updatedAt: now,
  }));

  const optionDocs: MediaProjectOptionDoc[] = [];
  topicDocs.forEach((topicDoc, index) => {
    const topic = input.topics[index];
    topic.options.forEach((label) => {
      optionDocs.push({
        _id: new ObjectId(),
        projectId: projectDoc._id,
        topicId: topicDoc._id,
        label,
        labelKey: normalizeLabel(label),
        status: "approved",
        votes: 0,
        proposedBy: null,
        createdAt: now,
        updatedAt: now,
      });
    });
  });

  const projectCol = await projectsCol();
  await projectCol.insertOne(projectDoc);
  if (topicDocs.length) {
    await topicsCol().then((col) => col.insertMany(topicDocs));
  }
  if (optionDocs.length) {
    await optionsCol().then((col) => col.insertMany(optionDocs));
  }

  return {
    project: sanitizeProject(projectDoc),
    topics: topicDocs.map(sanitizeTopic),
    options: optionDocs.map(sanitizeOption),
  };
}

export async function addMediaProjectOption(input: {
  projectId: string;
  topicId: string;
  label: string;
  proposedBy?: string | null;
}): Promise<MediaProjectOption | null> {
  const projectId = toObjectId(input.projectId);
  const topicId = toObjectId(input.topicId);
  if (!projectId || !topicId) return null;

  const topic = await topicsCol().then((col) => col.findOne({ _id: topicId, projectId }));
  if (!topic) return null;

  const label = input.label.trim();
  const labelKey = normalizeLabel(label);
  if (!labelKey) return null;

  const col = await optionsCol();
  const existing = await col.findOne({ projectId, topicId, labelKey });
  if (existing) return sanitizeOption(existing);

  const now = new Date();
  const doc: MediaProjectOptionDoc = {
    _id: new ObjectId(),
    projectId,
    topicId,
    label,
    labelKey,
    status: "proposed",
    votes: 0,
    proposedBy: input.proposedBy ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return sanitizeOption(doc);
}

export async function updateMediaProjectOptionStatus(
  optionId: string,
  status: MediaProjectOptionStatus,
): Promise<MediaProjectOption | null> {
  const oid = toObjectId(optionId);
  if (!oid) return null;
  const col = await optionsCol();
  const result = await col.findOneAndUpdate(
    { _id: oid },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ? sanitizeOption(result) : null;
}

export async function incrementMediaProjectOptionVote(optionId: string): Promise<MediaProjectOption | null> {
  const oid = toObjectId(optionId);
  if (!oid) return null;
  const col = await optionsCol();
  const result = await col.findOneAndUpdate(
    { _id: oid, status: "approved" as MediaProjectOptionStatus },
    { $inc: { votes: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ? sanitizeOption(result) : null;
}
