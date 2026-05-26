import { coreCol, type ObjectId } from "@core/db/triMongo";

export type FeedRuntimeRunType = "pull" | "batch_import" | "analyze" | "cluster";
export type FeedRuntimeRunStatus = "success" | "error" | "dry_run";

export type FeedRuntimeRunDoc = {
  _id?: ObjectId;
  runType: FeedRuntimeRunType;
  status: FeedRuntimeRunStatus;
  requestedAt: Date;
  completedAt: Date;
  scope?: string | null;
  regionCode?: string | null;
  counts?: Record<string, number | null | undefined>;
  error?: string | null;
  notes?: string[];
};

const FEED_RUNTIME_RUNS_COLLECTION = "feed_runtime_runs";
let ensured = false;

async function runtimeRunsCol() {
  if (!ensured) {
    const col = await coreCol<FeedRuntimeRunDoc>(FEED_RUNTIME_RUNS_COLLECTION);
    await col.createIndex({ runType: 1, completedAt: -1 });
    await col.createIndex({ status: 1, completedAt: -1 });
    ensured = true;
    return col;
  }
  return coreCol<FeedRuntimeRunDoc>(FEED_RUNTIME_RUNS_COLLECTION);
}

export async function recordFeedRuntimeRun(
  input: Omit<FeedRuntimeRunDoc, "_id">,
): Promise<void> {
  const col = await runtimeRunsCol();
  await col.insertOne({
    runType: input.runType,
    status: input.status,
    requestedAt: input.requestedAt,
    completedAt: input.completedAt,
    scope: input.scope ?? null,
    regionCode: input.regionCode ?? null,
    counts: input.counts ?? {},
    error: input.error ?? null,
    notes: Array.isArray(input.notes) ? input.notes.slice(0, 12) : [],
  });
}

export async function listRecentFeedRuntimeRuns(limit = 20): Promise<FeedRuntimeRunDoc[]> {
  const col = await runtimeRunsCol();
  return col.find({}).sort({ completedAt: -1 }).limit(Math.max(1, Math.min(100, limit))).toArray();
}
