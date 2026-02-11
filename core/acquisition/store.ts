import { ObjectId, coreCol } from "@core/db/triMongo";
import type { Collection, WithId } from "mongodb";
import type { AcquisitionFeedSource, AcquisitionFetchRun, AcquisitionFeedStatus } from "./types";

type AcquisitionFeedSourceDoc = Omit<AcquisitionFeedSource, "id"> & { _id: ObjectId };
type AcquisitionFetchRunDoc = Omit<AcquisitionFetchRun, "id"> & { _id: ObjectId };

async function feedSourcesCol(): Promise<Collection<AcquisitionFeedSourceDoc>> {
  return coreCol<AcquisitionFeedSourceDoc>("acquisitionFeedSources");
}

async function fetchRunsCol(): Promise<Collection<AcquisitionFetchRunDoc>> {
  return coreCol<AcquisitionFetchRunDoc>("acquisitionFetchRuns");
}

function sanitizeSource(doc: WithId<AcquisitionFeedSourceDoc>): AcquisitionFeedSource {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toHexString() };
}

function sanitizeRun(doc: WithId<AcquisitionFetchRunDoc>): AcquisitionFetchRun {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toHexString() };
}

export async function listAcquisitionFeedSources(): Promise<AcquisitionFeedSource[]> {
  const col = await feedSourcesCol();
  const docs = await col.find({}).sort({ regionCode: 1, feedUrl: 1 }).toArray();
  return docs.map(sanitizeSource);
}

export async function upsertAcquisitionFeedSources(inputs: AcquisitionFeedSource[]): Promise<void> {
  const col = await feedSourcesCol();
  const now = new Date();
  const ops = inputs.map((input) => ({
    updateOne: {
      filter: { sourceKey: input.sourceKey },
      update: {
        $set: {
          feedUrl: input.feedUrl,
          regionCode: input.regionCode ?? null,
          topicHints: input.topicHints ?? [],
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          status: "empty" as AcquisitionFeedStatus,
          itemCount: 0,
        },
      },
      upsert: true,
    },
  }));
  if (!ops.length) return;
  await col.bulkWrite(ops);
}

export async function updateAcquisitionFeedSource(
  sourceKey: string,
  patch: Partial<AcquisitionFeedSource>,
): Promise<void> {
  const col = await feedSourcesCol();
  await col.updateOne(
    { sourceKey },
    {
      $set: {
        ...patch,
        updatedAt: new Date(),
      },
    },
  );
}

export async function createAcquisitionFetchRun(input: AcquisitionFetchRun): Promise<AcquisitionFetchRun> {
  const col = await fetchRunsCol();
  const doc: AcquisitionFetchRunDoc = {
    _id: new ObjectId(),
    ...input,
  };
  await col.insertOne(doc);
  return sanitizeRun(doc);
}

export async function getLatestAcquisitionFetchRun(): Promise<AcquisitionFetchRun | null> {
  const col = await fetchRunsCol();
  const doc = await col.find({}).sort({ finishedAt: -1, startedAt: -1 }).limit(1).toArray();
  return doc[0] ? sanitizeRun(doc[0]) : null;
}
