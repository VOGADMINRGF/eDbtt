import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tokenDoc: null as Record<string, any> | null,
  upsertCount: 0,
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
        mocks.upsertCount += 1;
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

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    ObjectId,
    getCol: vi.fn(async () => tokenCollection),
  };
});

import {
  createEmailVerificationToken,
  recordEmailVerificationDelivery,
} from "@core/auth/emailVerificationService";
import { ObjectId } from "mongodb";

describe("email verification token slot", () => {
  beforeEach(() => {
    mocks.tokenDoc = null;
    mocks.upsertCount = 0;
    vi.clearAllMocks();
  });

  it("atomically rotates one canonical slot so the earlier token is no longer current", async () => {
    const userId = new ObjectId("66b0bca9f1b1444b8f635601");
    const first = await createEmailVerificationToken(
      userId,
      "member@company.de",
    );
    const firstHash = crypto
      .createHash("sha256")
      .update(first.rawToken)
      .digest("hex");
    const second = await createEmailVerificationToken(
      userId,
      "member@company.de",
    );
    const secondHash = crypto
      .createHash("sha256")
      .update(second.rawToken)
      .digest("hex");

    expect(first.rawToken).not.toBe(second.rawToken);
    expect(firstHash).not.toBe(secondHash);
    expect(mocks.upsertCount).toBe(2);
    expect(mocks.tokenDoc).toMatchObject({
      slotKey: `slot:verify:${String(userId)}`,
      userId,
      email: "member@company.de",
      tokenHash: secondHash,
      invalidatedAt: null,
      invalidationReason: null,
    });
    expect(mocks.tokenDoc?.tokenHash).not.toBe(firstHash);
  });

  it("resets delivery metadata on rotation and fences a late result from the old token", async () => {
    const userId = new ObjectId("66b0bca9f1b1444b8f635602");
    const first = await createEmailVerificationToken(
      userId,
      "member@company.de",
    );
    await recordEmailVerificationDelivery(userId, first.rawToken, {
      status: "failed",
      retryable: true,
      category: "smtp_timeout",
      attemptedCount: 2,
      deliveredCount: 0,
      failedCount: 2,
      messageId: "old-message",
    });

    const second = await createEmailVerificationToken(
      userId,
      "member@company.de",
    );
    const secondHash = crypto
      .createHash("sha256")
      .update(second.rawToken)
      .digest("hex");

    expect(mocks.tokenDoc).toMatchObject({
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

    await recordEmailVerificationDelivery(userId, first.rawToken, {
      status: "delivered",
      retryable: false,
      category: null,
      attemptedCount: 1,
      deliveredCount: 1,
      failedCount: 0,
      messageId: "late-old-message",
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
