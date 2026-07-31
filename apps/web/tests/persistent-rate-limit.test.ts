import { describe, expect, it, vi } from "vitest";
import {
  createPersistentRateLimiter,
  type PersistentRateLimitCollection,
} from "@/utils/persistentRateLimit";

type Bucket = {
  _id: string;
  count: number;
  windowStart: Date;
  resetAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function sharedCollection() {
  const buckets = new Map<string, Bucket>();
  const createIndex = vi.fn(async () => "rate_limit_bucket_expiry_ttl");
  const findOneAndUpdate = vi.fn(
    async (
      filter: { _id: string },
      update: {
        $inc: { count: number };
        $set: { updatedAt: Date };
        $setOnInsert: Omit<Bucket, "_id" | "count" | "updatedAt">;
      },
      options: { upsert: boolean },
    ) => {
      let bucket = buckets.get(filter._id);
      if (!bucket && !options.upsert) return null;
      if (!bucket) {
        bucket = {
          _id: filter._id,
          count: 0,
          updatedAt: update.$set.updatedAt,
          ...update.$setOnInsert,
        };
      }
      bucket = {
        ...bucket,
        count: bucket.count + update.$inc.count,
        updatedAt: update.$set.updatedAt,
      };
      buckets.set(filter._id, bucket);
      return { ...bucket };
    },
  );

  return {
    buckets,
    collection: {
      createIndex,
      findOneAndUpdate,
    } as unknown as PersistentRateLimitCollection,
    createIndex,
    findOneAndUpdate,
  };
}

const subjectHash =
  "a".repeat(32) +
  "b".repeat(32);

const input = {
  namespace: "public-auth:verify:address",
  subjectHash,
  limit: 3,
  windowMs: 600_000,
  nowMs: 60_000,
};

describe("persistent fixed-window rate limiter", () => {
  it("shares one atomic bucket across two simulated process instances", async () => {
    const shared = sharedCollection();
    const firstProcess = createPersistentRateLimiter(
      async () => shared.collection,
    );
    const secondProcess = createPersistentRateLimiter(
      async () => shared.collection,
    );

    const results = await Promise.all([
      firstProcess(input),
      secondProcess(input),
      firstProcess(input),
      secondProcess(input),
    ]);

    expect(results.map((result) => result.ok)).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(shared.buckets).toHaveLength(1);
    expect([...shared.buckets.keys()][0]).toMatch(/^[a-f0-9]{64}$/);
    expect([...shared.buckets.keys()][0]).not.toContain(subjectHash);
  });

  it("does not let parallel requests exceed the configured limit", async () => {
    const shared = sharedCollection();
    const limiter = createPersistentRateLimiter(
      async () => shared.collection,
    );

    const results = await Promise.all(
      Array.from({ length: 20 }, () => limiter(input)),
    );

    expect(results.filter((result) => result.ok)).toHaveLength(3);
    expect(results.filter((result) => !result.ok)).toHaveLength(17);
    expect([...shared.buckets.values()][0]?.count).toBe(20);
  });

  it("opens a new deterministic bucket after the ten-minute window expires", async () => {
    const shared = sharedCollection();
    const limiter = createPersistentRateLimiter(
      async () => shared.collection,
    );

    await limiter(input);
    await limiter(input);
    await limiter(input);
    expect((await limiter(input)).ok).toBe(false);

    const nextWindow = await limiter({
      ...input,
      nowMs: input.windowMs + 1,
    });

    expect(nextWindow.ok).toBe(true);
    expect(nextWindow.remaining).toBe(2);
    expect(shared.buckets).toHaveLength(2);
    expect(shared.createIndex).toHaveBeenCalledWith(
      { expiresAt: 1 },
      {
        expireAfterSeconds: 0,
        name: "rate_limit_bucket_expiry_ttl",
      },
    );
  });

  it("propagates storage failures so callers can fail closed", async () => {
    const limiter = createPersistentRateLimiter(async () => {
      throw new Error("mongo unavailable");
    });

    await expect(limiter(input)).rejects.toThrow("mongo unavailable");
  });
});
