import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

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
  updateOne: vi.fn(async () => ({ modifiedCount: 1 })),
};

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    ObjectId,
    getCol: vi.fn(async () => tokenCollection),
  };
});

import { createEmailVerificationToken } from "@core/auth/emailVerificationService";
import { ObjectId } from "mongodb";

describe("email verification token slot", () => {
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
});
