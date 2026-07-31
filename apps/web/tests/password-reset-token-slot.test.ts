import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tokenDoc: null as Record<string, any> | null,
}));

const tokenCollection = {
  createIndex: vi.fn(async () => "index"),
  findOneAndUpdate: vi.fn(
    async (
      query: Record<string, any>,
      update: Record<string, any>,
      options: Record<string, any>,
    ) => {
      const before = mocks.tokenDoc ? { ...mocks.tokenDoc } : null;
      if (options?.upsert && query.slotKey) {
        mocks.tokenDoc ??= {};
        Object.assign(
          mocks.tokenDoc,
          update.$setOnInsert ?? {},
          update.$set ?? {},
        );
      }
      return before;
    },
  ),
  updateMany: vi.fn(async () => ({ modifiedCount: 0 })),
  updateOne: vi.fn(
    async (query: Record<string, any>, update: Record<string, any>) => {
      if (
        !mocks.tokenDoc ||
        mocks.tokenDoc.slotKey !== query.slotKey ||
        mocks.tokenDoc.tokenHash !== query.tokenHash
      ) {
        return { modifiedCount: 0 };
      }
      Object.assign(mocks.tokenDoc, update.$set ?? {});
      return { modifiedCount: 1 };
    },
  ),
};

vi.mock("@core/db/triMongo", () => ({
  piiCol: vi.fn(async () => tokenCollection),
}));

import { createToken, recordTokenDelivery } from "@/utils/tokens";

describe("password reset token slot", () => {
  beforeEach(() => {
    mocks.tokenDoc = null;
    vi.clearAllMocks();
  });

  it("starts a rotated token as pending and ignores a late delivery callback for its predecessor", async () => {
    const userId = "66b0bca9f1b1444b8f635603";
    const first = await createToken(userId, "reset", 60);
    await recordTokenDelivery(userId, "reset", first, {
      status: "failed",
      retryable: true,
      category: "smtp_timeout",
      attemptedCount: 2,
      deliveredCount: 0,
      failedCount: 2,
      messageId: "old-reset-message",
    });

    const second = await createToken(userId, "reset", 60);
    const secondHash = crypto
      .createHash("sha256")
      .update(second)
      .digest("hex");

    expect(mocks.tokenDoc).toMatchObject({
      slotKey: `slot:reset:${userId}`,
      tokenHash: secondHash,
      deliveryStatus: "pending",
      deliveryRetryable: null,
      deliveryCategory: null,
      deliveryAttemptedAt: null,
      deliveryAttemptedCount: 0,
      deliveryDeliveredCount: 0,
      deliveryFailedCount: 0,
      deliveryMessageId: null,
      deliveryRecoveryStatus: null,
      deliveryNextAttemptAt: null,
    });

    await recordTokenDelivery(userId, "reset", first, {
      status: "delivered",
      retryable: false,
      category: null,
      attemptedCount: 1,
      deliveredCount: 1,
      failedCount: 0,
      messageId: "late-reset-message",
    });

    expect(mocks.tokenDoc).toMatchObject({
      tokenHash: secondHash,
      deliveryStatus: "pending",
      deliveryAttemptedCount: 0,
      deliveryDeliveredCount: 0,
      deliveryFailedCount: 0,
      deliveryMessageId: null,
    });
  });
});
