import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => ({
  setupDoc: null as Record<string, any> | null,
  resetDoc: null as Record<string, any> | null,
}));

function equalValue(actual: unknown, expected: unknown) {
  if (
    actual &&
    expected &&
    typeof actual === "object" &&
    typeof expected === "object" &&
    "toHexString" in (actual as Record<string, unknown>) &&
    "toHexString" in (expected as Record<string, unknown>)
  ) {
    return String(actual) === String(expected);
  }
  return actual === expected;
}

function matches(doc: Record<string, any> | null, query: Record<string, any>) {
  if (!doc) return false;
  return Object.entries(query).every(([key, expected]) => {
    const actual = doc[key];
    if (
      expected &&
      typeof expected === "object" &&
      !(expected instanceof Date) &&
      !("toHexString" in expected)
    ) {
      if ("$gt" in expected) return actual > expected.$gt;
      if ("$exists" in expected) {
        return expected.$exists ? key in doc : !(key in doc);
      }
    }
    return equalValue(actual, expected);
  });
}

function setupCollection() {
  return {
    createIndex: vi.fn(async () => "index"),
    findOneAndUpdate: vi.fn(
      async (
        query: Record<string, any>,
        update: Record<string, any>,
        options: Record<string, any> = {},
      ) => {
        const before = matches(mocks.setupDoc, query)
          ? { ...mocks.setupDoc }
          : null;
        if (options.upsert && query.membershipId) {
          mocks.setupDoc ??= {};
          Object.assign(
            mocks.setupDoc,
            update.$setOnInsert ?? {},
            update.$set ?? {},
          );
        } else if (before) {
          Object.assign(mocks.setupDoc!, update.$set ?? {});
        }
        return before;
      },
    ),
    updateOne: vi.fn(
      async (query: Record<string, any>, update: Record<string, any>) => {
        if (!matches(mocks.setupDoc, query)) return { modifiedCount: 0 };
        Object.assign(mocks.setupDoc!, update.$set ?? {});
        return { modifiedCount: 1 };
      },
    ),
  };
}

const resetCollection = {
  createIndex: vi.fn(async () => "index"),
  findOneAndUpdate: vi.fn(
    async (
      query: Record<string, any>,
      update: Record<string, any>,
      options: Record<string, any>,
    ) => {
      const before = mocks.resetDoc ? { ...mocks.resetDoc } : null;
      if (options?.upsert) {
        mocks.resetDoc ??= {};
        Object.assign(
          mocks.resetDoc,
          update.$setOnInsert ?? {},
          update.$set ?? {},
        );
      }
      return before;
    },
  ),
  updateMany: vi.fn(async () => ({ modifiedCount: 0 })),
};

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId: MongoObjectId } = await import("mongodb");
  return {
    ObjectId: MongoObjectId,
    piiCol: vi.fn(async (name: string) =>
      name === "org_invite_setup_tokens"
        ? setupCollection()
        : resetCollection,
    ),
  };
});

import {
  consumeOrgInviteSetupToken,
  issueOrgInviteSetupToken,
  recordOrgInviteSetupDelivery,
  startOrgInviteSetupDispatch,
} from "@features/org/inviteDelivery";
import { createToken } from "@/utils/tokens";

const delivered = {
  ok: true,
  status: "delivered",
  transport: "smtp",
  category: null,
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 1,
  failedCount: 0,
  messageId: "setup-message",
} as const;

describe("organization invite setup token slot", () => {
  beforeEach(() => {
    mocks.setupDoc = null;
    mocks.resetDoc = null;
    vi.clearAllMocks();
  });

  it("replaces an expired setup link while keeping exactly one current token", async () => {
    const membershipId = new ObjectId("66b0bca9f1b1444b8f635611");
    const userId = new ObjectId("66b0bca9f1b1444b8f635612");
    const first = await issueOrgInviteSetupToken({
      membershipId,
      userId,
      ttlMinutes: 60,
    });
    mocks.setupDoc!.expiresAt = new Date(Date.now() - 1);

    expect(await consumeOrgInviteSetupToken(first.rawToken)).toBeNull();

    const second = await issueOrgInviteSetupToken({
      membershipId,
      userId,
      ttlMinutes: 60,
    });

    expect(second.rawToken).not.toBe(first.rawToken);
    expect(await consumeOrgInviteSetupToken(first.rawToken)).toBeNull();
    await expect(consumeOrgInviteSetupToken(second.rawToken)).resolves.toMatchObject({
      membershipId,
      userId,
      tokenHash: second.tokenHash,
    });
    expect(await consumeOrgInviteSetupToken(second.rawToken)).toBeNull();
  });

  it("stays valid when the public password-reset slot rotates", async () => {
    const membershipId = new ObjectId("66b0bca9f1b1444b8f635613");
    const userId = new ObjectId("66b0bca9f1b1444b8f635614");
    const setup = await issueOrgInviteSetupToken({
      membershipId,
      userId,
      ttlMinutes: 60,
    });

    await createToken(String(userId), "reset", 60);
    await createToken(String(userId), "reset", 60);

    await expect(consumeOrgInviteSetupToken(setup.rawToken)).resolves.toMatchObject({
      membershipId,
      userId,
    });
  });

  it("fences a late result from an older dispatch and preserves the newer pending slot", async () => {
    const membershipId = new ObjectId("66b0bca9f1b1444b8f635615");
    const userId = new ObjectId("66b0bca9f1b1444b8f635616");
    const first = await issueOrgInviteSetupToken({
      membershipId,
      userId,
      ttlMinutes: 60,
    });
    const firstDispatchAt = new Date();
    expect(
      await startOrgInviteSetupDispatch({
        membershipId,
        rawToken: first.rawToken,
        dispatchId: "old-dispatch",
        startedAt: firstDispatchAt,
      }),
    ).toBe(true);

    const second = await issueOrgInviteSetupToken({
      membershipId,
      userId,
      ttlMinutes: 60,
    });
    expect(mocks.setupDoc).toMatchObject({
      tokenHash: second.tokenHash,
      dispatchId: null,
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

    expect(
      await recordOrgInviteSetupDelivery({
        membershipId,
        rawToken: first.rawToken,
        dispatchId: "old-dispatch",
        dispatchedAt: firstDispatchAt,
        result: delivered,
      }),
    ).toBe(false);
    expect(mocks.setupDoc).toMatchObject({
      tokenHash: second.tokenHash,
      dispatchId: null,
      deliveryStatus: "pending",
      deliveryAttemptedCount: 0,
      deliveryDeliveredCount: 0,
      deliveryFailedCount: 0,
      deliveryMessageId: null,
    });
  });
});
