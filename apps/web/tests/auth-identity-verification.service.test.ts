import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  const users = new Map<string, AnyDoc>();
  const sessions = new Map<string, AnyDoc>();

  function clone<T>(value: T): T {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map((entry) => clone(entry)) as T;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      return value;
    }
    if (typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, clone(entry)]),
      ) as T;
    }
    return value;
  }

  function objectIdString(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const maybeFn = (value as { toHexString?: () => string }).toHexString;
      if (typeof maybeFn === "function") return maybeFn.call(value);
    }
    return String(value ?? "");
  }

  function matches(doc: AnyDoc, query: AnyDoc): boolean {
    return Object.entries(query ?? {}).every(([key, expected]) => {
      const actual = doc?.[key];
      if (expected && typeof expected === "object" && !Array.isArray(expected)) {
        if ("$gt" in expected) return actual > (expected as AnyDoc).$gt;
        if ("$lte" in expected) return actual <= (expected as AnyDoc).$lte;
      }
      return objectIdString(actual) === objectIdString(expected);
    });
  }

  function applyUpdate(doc: AnyDoc, update: AnyDoc) {
    const next = clone(doc);
    if (update?.$set) {
      Object.assign(next, clone(update.$set));
    }
    return next;
  }

  function sortDocs(docs: AnyDoc[], sort?: Record<string, 1 | -1>) {
    const [field, direction] = Object.entries(sort ?? {})[0] ?? [];
    if (!field || !direction) return docs;
    return [...docs].sort((left, right) => {
      const leftValue = left?.[field];
      const rightValue = right?.[field];
      if (leftValue === rightValue) return 0;
      return leftValue > rightValue ? -direction : direction;
    });
  }

  return {
    reset() {
      users.clear();
      sessions.clear();
      vi.clearAllMocks();
      vi.unstubAllEnvs();
    },
    seedUser(doc: AnyDoc) {
      users.set(objectIdString(doc._id), clone(doc));
    },
    seedSession(doc: AnyDoc) {
      sessions.set(objectIdString(doc._id), clone(doc));
    },
    listSessions() {
      return Array.from(sessions.values()).map((entry) => clone(entry));
    },
    readUser(userId: unknown) {
      return clone(users.get(objectIdString(userId)) ?? null);
    },
    getCol: vi.fn(async (name: string) => {
      if (name === "identity_verification_sessions") {
        return {
          findOne: vi.fn(async (query: AnyDoc, options?: AnyDoc) => {
            const matchesFound = Array.from(sessions.values()).filter((doc) => matches(doc, query));
            return clone(sortDocs(matchesFound, options?.sort)[0] ?? null);
          }),
          insertOne: vi.fn(async (doc: AnyDoc) => {
            sessions.set(objectIdString(doc._id), clone(doc));
            return { acknowledged: true, insertedId: doc._id };
          }),
          updateOne: vi.fn(async (query: AnyDoc, update: AnyDoc) => {
            const current = Array.from(sessions.values()).find((doc) => matches(doc, query));
            if (!current) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
            const next = applyUpdate(current, update);
            sessions.set(objectIdString(current._id), next);
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
          }),
          updateMany: vi.fn(async (query: AnyDoc, update: AnyDoc) => {
            let matchedCount = 0;
            for (const current of Array.from(sessions.values())) {
              if (!matches(current, query)) continue;
              matchedCount += 1;
              sessions.set(objectIdString(current._id), applyUpdate(current, update));
            }
            return { acknowledged: true, matchedCount, modifiedCount: matchedCount };
          }),
        };
      }
      if (name === "users") {
        return {
          findOne: vi.fn(async (query: AnyDoc) => {
            const match = Array.from(users.values()).find((doc) => matches(doc, query));
            return clone(match ?? null);
          }),
          updateOne: vi.fn(async (query: AnyDoc, update: AnyDoc) => {
            const current = Array.from(users.values()).find((doc) => matches(doc, query));
            if (!current) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
            users.set(objectIdString(current._id), applyUpdate(current, update));
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
          }),
        };
      }
      throw new Error(`unexpected_collection_${name}`);
    }),
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

import {
  IdentityVerificationError,
  completeIdentityVerification,
  startIdentityVerification,
} from "@core/auth/identityVerificationService";

describe("identity verification service", () => {
  beforeEach(() => {
    mocks.reset();
    vi.stubEnv("NODE_ENV", "test");
  });

  it("blocks the mock provider outside explicit development or test environments", async () => {
    const { ObjectId } = await import("mongodb");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OTB_API_URL", "");

    await expect(
      startIdentityVerification({
        userId: new ObjectId("65f000000000000000000001"),
        method: "otb_app",
      }),
    ).rejects.toMatchObject({
      code: "provider_unavailable",
      status: 503,
    } satisfies Partial<IdentityVerificationError>);
  });

  it("fails closed when a real OTB runtime is configured without a signed callback contract", async () => {
    const { ObjectId } = await import("mongodb");
    vi.stubEnv("OTB_API_URL", "https://otb.example");

    await expect(
      startIdentityVerification({
        userId: new ObjectId("65f000000000000000000001"),
        method: "eid_scan",
      }),
    ).rejects.toMatchObject({
      code: "provider_unavailable",
      status: 503,
    } satisfies Partial<IdentityVerificationError>);
  });

  it("rejects owner mismatches before mutating the verification session", async () => {
    const { ObjectId } = await import("mongodb");
    const ownerId = new ObjectId("65f000000000000000000001");
    const foreignUserId = new ObjectId("65f000000000000000000002");
    const sessionId = new ObjectId("65f0000000000000000000aa");
    mocks.seedUser({ _id: ownerId, verification: { level: "email", methods: [] } });
    mocks.seedSession({
      _id: sessionId,
      userId: ownerId,
      method: "otb_app",
      provider: "mock",
      status: "pending",
      createdAt: new Date("2026-07-20T09:00:00.000Z"),
      updatedAt: new Date("2026-07-20T09:00:00.000Z"),
      expiresAt: new Date("2026-07-20T09:10:00.000Z"),
      completedAt: null,
      verifiedAt: null,
      failureReason: null,
      providerProofType: null,
      providerPayload: null,
    });

    await expect(
      completeIdentityVerification({
        sessionId: sessionId.toHexString(),
        userId: foreignUserId,
        providerPayload: { adapter: "test", verificationId: "proof-123456", verified: true },
        now: new Date("2026-07-20T09:05:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "forbidden",
      status: 403,
    } satisfies Partial<IdentityVerificationError>);

    expect(mocks.listSessions()[0]).toMatchObject({ status: "pending", providerPayload: null });
  });

  it("expires stale pending sessions instead of upgrading the user", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId("65f000000000000000000001");
    const sessionId = new ObjectId("65f0000000000000000000aa");
    mocks.seedUser({ _id: userId, verification: { level: "email", methods: [] } });
    mocks.seedSession({
      _id: sessionId,
      userId,
      method: "otb_app",
      provider: "mock",
      status: "pending",
      createdAt: new Date("2026-07-20T09:00:00.000Z"),
      updatedAt: new Date("2026-07-20T09:00:00.000Z"),
      expiresAt: new Date("2026-07-20T09:02:00.000Z"),
      completedAt: null,
      verifiedAt: null,
      failureReason: null,
      providerProofType: null,
      providerPayload: null,
    });

    await expect(
      completeIdentityVerification({
        sessionId: sessionId.toHexString(),
        userId,
        providerPayload: { adapter: "test", verificationId: "proof-123456", verified: true },
        now: new Date("2026-07-20T09:05:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "session_expired",
      status: 410,
    } satisfies Partial<IdentityVerificationError>);

    expect(mocks.listSessions()[0]).toMatchObject({
      status: "expired",
      failureReason: "expired",
    });
    expect(mocks.readUser(userId)).toMatchObject({
      verification: { level: "email", methods: [] },
    });
  });

  it("blocks replay on already completed sessions", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId("65f000000000000000000001");
    const sessionId = new ObjectId("65f0000000000000000000aa");
    mocks.seedUser({ _id: userId, verification: { level: "soft", methods: ["otb_app"] } });
    mocks.seedSession({
      _id: sessionId,
      userId,
      method: "otb_app",
      provider: "mock",
      status: "succeeded",
      createdAt: new Date("2026-07-20T09:00:00.000Z"),
      updatedAt: new Date("2026-07-20T09:01:00.000Z"),
      expiresAt: new Date("2026-07-20T09:10:00.000Z"),
      completedAt: new Date("2026-07-20T09:01:00.000Z"),
      verifiedAt: new Date("2026-07-20T09:01:00.000Z"),
      failureReason: null,
      providerProofType: "test_adapter",
      providerPayload: {
        adapter: "test",
        verificationId: "proof-123456",
        verified: true,
        verifiedAt: "2026-07-20T09:01:00.000Z",
      },
    });

    await expect(
      completeIdentityVerification({
        sessionId: sessionId.toHexString(),
        userId,
        providerPayload: { adapter: "test", verificationId: "proof-123456", verified: true },
        now: new Date("2026-07-20T09:05:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "session_replay",
      status: 409,
    } satisfies Partial<IdentityVerificationError>);
  });

  it("does not upgrade a user without verified provider proof", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId("65f000000000000000000001");
    const sessionId = new ObjectId("65f0000000000000000000aa");
    mocks.seedUser({ _id: userId, verification: { level: "email", methods: [] } });
    mocks.seedSession({
      _id: sessionId,
      userId,
      method: "otb_app",
      provider: "mock",
      status: "pending",
      createdAt: new Date("2026-07-20T09:00:00.000Z"),
      updatedAt: new Date("2026-07-20T09:00:00.000Z"),
      expiresAt: new Date("2026-07-20T09:10:00.000Z"),
      completedAt: null,
      verifiedAt: null,
      failureReason: null,
      providerProofType: null,
      providerPayload: null,
    });

    await expect(
      completeIdentityVerification({
        sessionId: sessionId.toHexString(),
        userId,
        now: new Date("2026-07-20T09:05:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "provider_proof_missing",
      status: 400,
    } satisfies Partial<IdentityVerificationError>);

    expect(mocks.listSessions()[0]).toMatchObject({ status: "pending", providerPayload: null });
    expect(mocks.readUser(userId)).toMatchObject({
      verification: { level: "email", methods: [] },
    });
  });

  it("supports an explicit test adapter and keeps start idempotent for the same pending flow", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId("65f000000000000000000001");
    mocks.seedUser({ _id: userId, verification: { level: "email", methods: ["email_code"] } });

    const started = await startIdentityVerification({
      userId,
      method: "otb_app",
      now: new Date("2026-07-20T09:00:00.000Z"),
    });
    const startedAgain = await startIdentityVerification({
      userId,
      method: "otb_app",
      now: new Date("2026-07-20T09:01:00.000Z"),
    });

    expect(startedAgain._id.toHexString()).toBe(started._id.toHexString());
    expect(mocks.listSessions()).toHaveLength(1);

    const completed = await completeIdentityVerification({
      sessionId: started._id.toHexString(),
      userId,
      providerPayload: {
        adapter: "test",
        verificationId: "proof-123456",
        verified: true,
      },
      now: new Date("2026-07-20T09:02:00.000Z"),
    });

    expect(completed.session).toMatchObject({
      status: "succeeded",
      providerProofType: "test_adapter",
    });
    expect(completed.verification).toMatchObject({
      level: "soft",
      methods: expect.arrayContaining(["email_code", "otb_app"]),
    });
  });
});
