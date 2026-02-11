import crypto from "node:crypto";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { getGraphDriver } from "@core/graph";
import type { Collection, Filter, WithId } from "mongodb";
import type {
  ResearchContribution,
  ResearchContributionDoc,
  ResearchContributionStatus,
  ResearchTask,
  ResearchTaskLevel,
  ResearchTaskStatus,
} from "./types";

type ResearchTaskDoc = Omit<ResearchTask, "id"> & { _id: ObjectId };

type TaskSort = "recent" | "due";

type TaskFilter = {
  status?: ResearchTaskStatus;
  level?: ResearchTaskLevel;
  tag?: string;
  search?: string;
  sort?: TaskSort;
};

type SaveTaskInput = Omit<ResearchTask, "id" | "createdAt" | "updatedAt"> & { id?: string };

type CreateContributionInput = Omit<ResearchContribution, "id" | "status" | "createdAt" | "updatedAt">;

type UpdateContributionStatusInput = {
  contributionId: string;
  status: ResearchContributionStatus;
  reviewNote?: string;
};

async function researchTasksCol(): Promise<Collection<ResearchTaskDoc>> {
  return coreCol<ResearchTaskDoc>("researchTasks");
}

async function researchContributionsCol(): Promise<Collection<ResearchContributionDoc>> {
  return coreCol<ResearchContributionDoc>("researchContributions");
}

function sanitizeTask(doc: WithId<ResearchTaskDoc>): ResearchTask {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
  };
}

function sanitizeContribution(doc: WithId<ResearchContributionDoc>): ResearchContribution {
  const { _id, taskId, authorId, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
    taskId: taskId.toHexString(),
    authorId: authorId.toHexString(),
    helpfulCount: typeof rest.helpfulCount === "number" ? rest.helpfulCount : 0,
    notHelpfulCount: typeof rest.notHelpfulCount === "number" ? rest.notHelpfulCount : 0,
  };
}

function buildTaskFilter(filter?: TaskFilter): Filter<ResearchTaskDoc> {
  const query: Filter<ResearchTaskDoc> = {};
  if (filter?.status) query.status = filter.status;
  if (filter?.level) query.level = filter.level;
  if (filter?.tag) query.tags = { $in: [filter.tag] };
  if (filter?.search) {
    const text = filter.search.trim();
    if (text) {
      const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { hints: regex },
        { tags: { $in: [text] } },
      ];
    }
  }
  return query;
}

function resolveTaskSort(sort?: TaskSort) {
  switch (sort) {
    case "due":
      return { dueAt: 1 as 1, createdAt: -1 as -1 };
    case "recent":
    default:
      return { createdAt: -1 as -1 };
  }
}

export async function listTasks(filter?: TaskFilter): Promise<ResearchTask[]> {
  const col = await researchTasksCol();
  const query = buildTaskFilter(filter);
  const sort = resolveTaskSort(filter?.sort);
  const docs = await col.find(query).sort(sort).toArray();
  return docs.map(sanitizeTask);
}

export async function getTaskById(id: string): Promise<ResearchTask | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await researchTasksCol();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? sanitizeTask(doc) : null;
}

export async function saveTask(input: SaveTaskInput): Promise<ResearchTask> {
  const col = await researchTasksCol();
  const now = new Date();
  const id = input.id && ObjectId.isValid(input.id) ? new ObjectId(input.id) : undefined;

  const payload: Partial<ResearchTaskDoc> = {
    seedKey: input.seedKey ?? undefined,
    kind: input.kind ?? "custom",
    source: input.source,
    title: input.title?.trim() || "Unbenannte Research-Task",
    description: input.description?.trim() || "",
    hints: input.hints?.filter(Boolean) ?? [],
    level: input.level ?? "basic",
    status: input.status ?? "open",
    createdBy: input.createdBy ?? null,
    dueAt: input.dueAt ?? null,
    tags: input.tags ?? [],
    updatedAt: now,
  };

  if (id) {
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: payload, $setOnInsert: { createdAt: now } },
      { upsert: true, returnDocument: "after", includeResultMetadata: true },
    );
    const doc = result.value ?? ({ _id: id, ...payload, createdAt: now } as ResearchTaskDoc);
    return sanitizeTask(doc);
  }

  const insertResult = await col.insertOne({ ...payload, createdAt: now } as ResearchTaskDoc);
  return sanitizeTask({ _id: insertResult.insertedId, ...payload, createdAt: now } as ResearchTaskDoc);
}

export async function getContributionsByTaskId(taskId: string): Promise<ResearchContribution[]> {
  if (!ObjectId.isValid(taskId)) return [];
  const col = await researchContributionsCol();
  const docs = await col.find({ taskId: new ObjectId(taskId) }).sort({ createdAt: -1 }).toArray();
  return docs.map(sanitizeContribution);
}

export async function getContributionById(id: string): Promise<ResearchContribution | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await researchContributionsCol();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? sanitizeContribution(doc) : null;
}

export async function createContribution(input: CreateContributionInput): Promise<ResearchContribution | null> {
  if (!ObjectId.isValid(input.taskId) || !ObjectId.isValid(input.authorId)) return null;
  const col = await researchContributionsCol();
  const now = new Date();

  const doc: ResearchContributionDoc = {
    _id: new ObjectId(),
    taskId: new ObjectId(input.taskId),
    authorId: new ObjectId(input.authorId),
    summary: input.summary?.trim() ?? "",
    details: input.details?.trim() || "",
    sources: input.sources?.length ? input.sources : [],
    helpfulCount: 0,
    notHelpfulCount: 0,
    status: "submitted",
    reviewNote: input.reviewNote?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    acceptedAt: null,
    rejectedAt: null,
  };

  await col.insertOne(doc);
  return sanitizeContribution(doc);
}

export async function updateContributionStatus(
  input: UpdateContributionStatusInput,
): Promise<ResearchContribution | null> {
  if (!ObjectId.isValid(input.contributionId)) return null;
  const col = await researchContributionsCol();
  const now = new Date();
  const status: ResearchContributionStatus = input.status;
  const update: Partial<ResearchContributionDoc> = {
    status,
    reviewNote: input.reviewNote?.trim() || undefined,
    updatedAt: now,
  };

  if (status === "accepted") update.acceptedAt = now;
  if (status === "rejected") update.rejectedAt = now;

  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(input.contributionId) },
    { $set: update },
    { returnDocument: "after", includeResultMetadata: true },
  );

  return result.value ? sanitizeContribution(result.value) : null;
}

export async function listContributionsByTaskId(
  taskId: string,
  opts?: { status?: ResearchContributionStatus; limit?: number },
): Promise<ResearchContribution[]> {
  if (!ObjectId.isValid(taskId)) return [];
  const col = await researchContributionsCol();
  const query: Filter<ResearchContributionDoc> = { taskId: new ObjectId(taskId) };
  if (opts?.status) query.status = opts.status;
  const cursor = col.find(query).sort({ createdAt: -1 });
  const docs = typeof opts?.limit === "number" ? await cursor.limit(opts.limit).toArray() : await cursor.toArray();
  return docs.map(sanitizeContribution);
}

export async function hasRecentContribution(
  taskId: string,
  authorId: string,
  windowMinutes = 30,
): Promise<boolean> {
  if (!ObjectId.isValid(taskId) || !ObjectId.isValid(authorId)) return false;
  const col = await researchContributionsCol();
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
  const existing = await col.findOne({
    taskId: new ObjectId(taskId),
    authorId: new ObjectId(authorId),
    createdAt: { $gte: cutoff },
  });
  return Boolean(existing);
}

export async function recordContributionFeedback(input: {
  contributionId: string;
  helpful: boolean;
}): Promise<ResearchContribution | null> {
  if (!ObjectId.isValid(input.contributionId)) return null;
  const col = await researchContributionsCol();
  const now = new Date();
  const inc = input.helpful ? { helpfulCount: 1 } : { notHelpfulCount: 1 };
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(input.contributionId) },
    { $inc: inc, $set: { updatedAt: now } },
    { returnDocument: "after", includeResultMetadata: true },
  );
  return result.value ? sanitizeContribution(result.value) : null;
}

export async function updateTaskStatus(
  taskId: string,
  status: ResearchTaskStatus,
): Promise<ResearchTask | null> {
  if (!ObjectId.isValid(taskId)) return null;
  const col = await researchTasksCol();
  const now = new Date();
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(taskId) },
    { $set: { status, updatedAt: now } },
    { returnDocument: "after", includeResultMetadata: true },
  );
  return result.value ? sanitizeTask(result.value) : null;
}

type SeedQuestion = { id?: string; text?: string; dimension?: string | null };
type SeedKnot = { id?: string; label?: string; description?: string };

export async function seedTasksFromAnalyze(input: {
  contributionId: string;
  locale?: string | null;
  createdBy?: string | null;
  questions?: SeedQuestion[];
  knots?: SeedKnot[];
  tags?: string[];
}): Promise<{ created: number; skipped: number }> {
  const contributionId = input.contributionId?.trim();
  if (!contributionId) return { created: 0, skipped: 0 };

  const maxSeeds = 6;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const col = await researchTasksCol();
  const recentCount = await col.countDocuments({
    "source.contributionId": contributionId,
    createdAt: { $gte: cutoff },
  });
  if (recentCount >= maxSeeds) return { created: 0, skipped: recentCount };

  const candidates: Array<{
    seedKey: string;
    kind: ResearchTask["kind"];
    title: string;
    description?: string;
    source: ResearchTask["source"];
    level: ResearchTask["level"];
  }> = [];

  const addCandidate = (
    kind: ResearchTask["kind"],
    id: string | undefined,
    text: string,
    description: string | undefined,
    source: ResearchTask["source"],
    level: ResearchTask["level"],
  ) => {
    const trimmed = text.trim();
    if (trimmed.length < 12) return;
    const seed = id ? `${kind}:${id}` : `${kind}:${trimmed.toLowerCase()}`;
    const seedKey = `${kind}:${contributionId}:${hashSeed(seed)}`;
    candidates.push({ seedKey, kind, title: trimmed, description, source, level });
  };

  (input.questions ?? []).forEach((q, idx) => {
    const text = q?.text?.trim();
    if (!text) return;
    addCandidate(
      "question",
      q.id,
      text,
      q.dimension ? `Dimension: ${q.dimension}` : undefined,
      { contributionId, questionId: q.id },
      "basic",
    );
  });

  (input.knots ?? []).forEach((k) => {
    const label = k?.label?.trim();
    const description = k?.description?.trim();
    if (!label) return;
    addCandidate(
      "knot",
      k.id,
      label,
      description || undefined,
      { contributionId, knotId: k.id },
      "advanced",
    );
  });

  const unique = new Map<string, typeof candidates[number]>();
  candidates.forEach((c) => {
    if (!unique.has(c.seedKey)) unique.set(c.seedKey, c);
  });

  const toInsert = [...unique.values()].slice(0, Math.max(0, maxSeeds - recentCount));
  if (!toInsert.length) return { created: 0, skipped: candidates.length };

  let created = 0;
  for (const candidate of toInsert) {
    const now = new Date();
    const payload: Partial<ResearchTaskDoc> = {
      seedKey: candidate.seedKey,
      kind: candidate.kind ?? "custom",
      source: candidate.source,
      title: candidate.title,
      description: candidate.description ?? "",
      hints: [
        "Bitte nenne Quellen/Links.",
        "Fasse die Kernaussage in 2-4 Saetzen zusammen.",
      ],
      level: candidate.level ?? "basic",
      status: "open",
      createdBy: input.createdBy ?? null,
      dueAt: null,
      tags: input.tags ?? [],
      updatedAt: now,
    };
    const result = await col.findOneAndUpdate(
      { seedKey: candidate.seedKey },
      { $setOnInsert: { createdAt: now }, $set: payload },
      { upsert: true, returnDocument: "after", includeResultMetadata: true },
    );
    if (result?.ok && result.lastErrorObject?.updatedExisting === false) {
      created += 1;
    }
  }

  return { created, skipped: candidates.length - created };
}

function hashSeed(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

export async function syncAcceptedContributionToGraph(
  task: ResearchTask,
  contribution: ResearchContribution,
): Promise<boolean> {
  const driver = getGraphDriver();
  if (!driver) return false;

  const session = driver.session();
  try {
    const sourceId = task.source?.contributionId ?? null;
    const statementId = task.source?.statementId ?? null;
    const questionId = task.source?.questionId ?? null;
    const knotId = task.source?.knotId ?? null;
    const payload = {
      id: contribution.id,
      taskId: contribution.taskId,
      summary: contribution.summary,
      details: contribution.details ?? null,
      helpfulCount: contribution.helpfulCount ?? 0,
      notHelpfulCount: contribution.notHelpfulCount ?? 0,
      status: contribution.status ?? null,
      sourceId,
      statementId,
      questionId,
      knotId,
    };

    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (rc:ResearchContribution {id: $id})
        SET rc.taskId = $taskId,
            rc.summary = $summary,
            rc.details = $details,
            rc.helpfulCount = $helpfulCount,
            rc.notHelpfulCount = $notHelpfulCount,
            rc.status = $status,
            rc.updatedAt = timestamp()
        WITH rc
        CALL {
          WITH rc
          MATCH (src:Source {id: $sourceId})
          MERGE (src)-[:HAS_RESEARCH]->(rc)
          RETURN count(*) AS linked
        }
        CALL {
          WITH rc
          MATCH (s:Statement {id: $statementId})
          MERGE (s)-[:HAS_RESEARCH]->(rc)
          RETURN count(*) AS linked
        }
        CALL {
          WITH rc
          MATCH (q:Question {id: $questionId})
          MERGE (q)-[:ANSWERED_BY]->(rc)
          RETURN count(*) AS linked
        }
        CALL {
          WITH rc
          MATCH (k:Knot {id: $knotId})
          MERGE (k)-[:CLARIFIED_BY]->(rc)
          RETURN count(*) AS linked
        }
        RETURN rc
        `,
        payload,
      ),
    );

    return true;
  } catch (err) {
    console.error("[research] graph sync failed", err);
    return false;
  } finally {
    await session.close();
  }
}
