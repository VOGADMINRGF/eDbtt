import "server-only";

import crypto from "node:crypto";
import type { Collection } from "mongodb";
import { coreCol } from "@core/db/triMongo";

const COLLECTION_NAME = "rate_limit_buckets";
const TTL_INDEX_NAME = "rate_limit_bucket_expiry_ttl";

type PersistentRateLimitBucket = {
  _id: string;
  count: number;
  windowStart: Date;
  resetAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PersistentRateLimitCollection = Pick<
  Collection<PersistentRateLimitBucket>,
  "createIndex" | "findOneAndUpdate"
>;

export type PersistentRateLimitInput = {
  namespace: string;
  subjectHash: string;
  limit: number;
  windowMs: number;
  nowMs?: number;
};

export type PersistentRateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryIn: number;
};

type CollectionLoader = () => Promise<PersistentRateLimitCollection>;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function duplicateKey(error: unknown) {
  const candidate = error as { code?: number | string; codeName?: string };
  return candidate?.code === 11000 || candidate?.codeName === "DuplicateKey";
}

function unwrapUpdatedBucket(
  result:
    | PersistentRateLimitBucket
    | { value?: PersistentRateLimitBucket | null }
    | null,
): PersistentRateLimitBucket | null {
  if (!result) return null;
  if (Object.prototype.hasOwnProperty.call(result, "value")) {
    return (result as { value?: PersistentRateLimitBucket | null }).value ?? null;
  }
  return result as PersistentRateLimitBucket;
}

async function defaultCollectionLoader() {
  return coreCol<PersistentRateLimitBucket>(COLLECTION_NAME);
}

export function createPersistentRateLimiter(
  loadCollection: CollectionLoader = defaultCollectionLoader,
) {
  let ttlIndexReady: Promise<unknown> | null = null;

  async function collection() {
    const col = await loadCollection();
    ttlIndexReady ??= col
      .createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: TTL_INDEX_NAME },
      )
      .catch((error) => {
        ttlIndexReady = null;
        throw error;
      });
    await ttlIndexReady;
    return col;
  }

  return async function consumePersistentRateLimit(
    input: PersistentRateLimitInput,
  ): Promise<PersistentRateLimitResult> {
    if (
      !input.namespace ||
      !/^[a-f0-9]{64}$/i.test(input.subjectHash) ||
      !Number.isInteger(input.limit) ||
      input.limit < 1 ||
      !Number.isInteger(input.windowMs) ||
      input.windowMs < 1
    ) {
      throw new Error("invalid_persistent_rate_limit_contract");
    }

    const nowMs = input.nowMs ?? Date.now();
    const windowStartMs =
      Math.floor(nowMs / input.windowMs) * input.windowMs;
    const resetAtMs = windowStartMs + input.windowMs;
    const bucketId = sha256(
      `${input.namespace}:${input.subjectHash}:${windowStartMs}`,
    );
    const now = new Date(nowMs);
    const windowStart = new Date(windowStartMs);
    const resetAt = new Date(resetAtMs);
    const col = await collection();
    const update = {
      $inc: { count: 1 },
      $set: { updatedAt: now },
      $setOnInsert: {
        windowStart,
        resetAt,
        expiresAt: resetAt,
        createdAt: now,
      },
    };

    let result:
      | PersistentRateLimitBucket
      | { value?: PersistentRateLimitBucket | null }
      | null;
    try {
      result = (await col.findOneAndUpdate(
        { _id: bucketId },
        update,
        { upsert: true, returnDocument: "after" },
      )) as typeof result;
    } catch (error) {
      if (!duplicateKey(error)) throw error;
      result = (await col.findOneAndUpdate(
        { _id: bucketId },
        update,
        { upsert: false, returnDocument: "after" },
      )) as typeof result;
    }

    const bucket = unwrapUpdatedBucket(result);
    if (!bucket || !Number.isFinite(bucket.count)) {
      throw new Error("persistent_rate_limit_update_failed");
    }

    const ok = bucket.count <= input.limit;
    return {
      ok,
      remaining: Math.max(0, input.limit - bucket.count),
      limit: input.limit,
      resetAt: resetAtMs,
      retryIn: ok ? 0 : Math.max(0, resetAtMs - nowMs),
    };
  };
}

export const consumePersistentRateLimit = createPersistentRateLimiter();
