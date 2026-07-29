import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  const challenges = new Map<string, AnyDoc>();
  const users = new Map<string, AnyDoc>();
  const credentials = new Map<string, AnyDoc>();
  const operations: string[] = [];
  let sessionUser: AnyDoc | null = null;
  let sessionWrite: (() => Promise<void>) | null = null;

  function key(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as AnyDoc)) {
      const toHexString = (value as { toHexString?: () => string }).toHexString;
      if (typeof toHexString === "function") return toHexString.call(value);
    }
    return String(value ?? "");
  }

  function clone<T>(value: T): T {
    if (value == null) return value;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (Array.isArray(value)) return value.map((entry) => clone(entry)) as T;
    if (
      typeof value === "object" &&
      typeof (value as { toHexString?: unknown }).toHexString === "function"
    ) {
      return value;
    }
    if (typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as AnyDoc).map(([entryKey, entryValue]) => [
          entryKey,
          clone(entryValue),
        ]),
      ) as T;
    }
    return value;
  }

  function matchesAtomicConsume(filter: AnyDoc, current: AnyDoc) {
    if (
      filter?.consumedAt?.$exists === false &&
      Object.prototype.hasOwnProperty.call(current, "consumedAt")
    ) {
      return false;
    }
    if (Array.isArray(filter?.$or)) {
      const statusMatches = filter.$or.some((clause: AnyDoc) => {
        if (clause?.status === "pending") return current.status === "pending";
        if (clause?.status?.$exists === false) {
          return !Object.prototype.hasOwnProperty.call(current, "status");
        }
        return false;
      });
      if (!statusMatches) return false;
    }
    return true;
  }

  return {
    reset() {
      challenges.clear();
      users.clear();
      credentials.clear();
      operations.length = 0;
      sessionUser = null;
      sessionWrite = null;
      vi.clearAllMocks();
    },
    seedChallenge(doc: AnyDoc) {
      challenges.set(key(doc._id), clone(doc));
    },
    seedUser(doc: AnyDoc) {
      users.set(key(doc._id), clone(doc));
    },
    seedCredentials(doc: AnyDoc) {
      credentials.set(key(doc.coreUserId), clone(doc));
    },
    setSessionUser(user: AnyDoc | null) {
      sessionUser = clone(user);
    },
    setSessionWrite(write: (() => Promise<void>) | null) {
      sessionWrite = write;
    },
    readChallenge(id: unknown) {
      return clone(challenges.get(key(id)) ?? null);
    },
    operations,
    coreCol: vi.fn(async (name: string) => {
      if (name !== "users") throw new Error(`unexpected_core_collection_${name}`);
      return {
        findOne: vi.fn(async (query: AnyDoc) => clone(users.get(key(query?._id)) ?? null)),
      };
    }),
    piiCol: vi.fn(async (name: string) => {
      if (name === "user_credentials") {
        return {
          findOne: vi.fn(async (query: AnyDoc) =>
            clone(credentials.get(key(query?.coreUserId)) ?? null),
          ),
        };
      }
      if (name === "twofactor_challenges") {
        return {
          findOne: vi.fn(async (query: AnyDoc) =>
            clone(challenges.get(key(query?._id)) ?? null),
          ),
          updateOne: vi.fn(async (filter: AnyDoc, update: AnyDoc) => {
            const challengeKey = key(filter?._id);
            const current = challenges.get(challengeKey);
            if (!current || !matchesAtomicConsume(filter, current)) {
              return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
            }
            const next = clone(current);
            if (update?.$set) Object.assign(next, clone(update.$set));
            if (update?.$inc) {
              for (const [field, amount] of Object.entries(update.$inc)) {
                next[field] = Number(next[field] ?? 0) + Number(amount ?? 0);
              }
            }
            challenges.set(challengeKey, next);
            if (update?.$set?.status) operations.push(`challenge:${update.$set.status}`);
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
          }),
          deleteOne: vi.fn(async (query: AnyDoc) => {
            challenges.delete(key(query?._id));
            return { acknowledged: true, deletedCount: 1 };
          }),
        };
      }
      throw new Error(`unexpected_pii_collection_${name}`);
    }),
    rateLimitOrThrow: vi.fn(async () => ({ ok: true })),
    verifyTotpToken: vi.fn((code: string) => code === "654321"),
    isDemoUser: vi.fn(() => false),
    clearPendingTwoFactorCookie: vi.fn(async () => {
      operations.push("cookie:pending-cleared");
    }),
    applySessionCookies: vi.fn(async () => {
      operations.push("session:start");
      if (sessionWrite) await sessionWrite();
      operations.push("session:complete");
    }),
    getSessionUser: vi.fn(async () => clone(sessionUser)),
    scheduleAuthEvent: vi.fn(() => undefined),
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
    piiCol: (...args: unknown[]) => mocks.piiCol(...args),
  };
});

vi.mock("@/app/api/auth/authEventScheduling", () => ({
  scheduleAuthEvent: (...args: unknown[]) =>
    mocks.scheduleAuthEvent(...args),
}));

vi.mock("@/lib/demo/demoAccess", () => ({
  isDemoUser: (...args: unknown[]) => mocks.isDemoUser(...args),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
}));

vi.mock("@/app/api/auth/totp/totpHelpers", () => ({
  verifyTotpToken: (...args: unknown[]) => mocks.verifyTotpToken(...args),
}));

vi.mock("@/app/api/auth/sharedAuth", () => ({
  CREDENTIAL_COLLECTION: "user_credentials",
  TWO_FA_COLLECTION: "twofactor_challenges",
  TWO_FA_WINDOW_MS: 10 * 60 * 1000,
  sanitizeRedirect: (value?: string | null) => {
    const normalized = String(value ?? "").trim();
    if (!normalized.startsWith("/") || normalized.startsWith("//")) return "/";
    return normalized;
  },
  sha256: (value: string) => `sha:${value}`,
  clearPendingTwoFactorCookie: (...args: unknown[]) =>
    mocks.clearPendingTwoFactorCookie(...args),
  applySessionCookies: (...args: unknown[]) => mocks.applySessionCookies(...args),
}));

import { POST } from "@/app/api/auth/verify-2fa/route";

function verifyRequest(
  body: Record<string, unknown>,
  cookie?: string,
) {
  return new NextRequest("http://localhost/api/auth/verify-2fa", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function seedPendingChallenge(method: "otp" | "email") {
  const { ObjectId } = await import("mongodb");
  const userId = new ObjectId();
  const challengeId = new ObjectId();
  mocks.seedUser({
    _id: userId,
    email: "admin@example.org",
    role: "admin",
    roles: ["admin"],
  });
  mocks.seedCredentials({
    coreUserId: userId,
    email: "admin@example.org",
    otpSecret: "JBSWY3DPEHPK3PXP",
  });
  mocks.seedChallenge({
    _id: challengeId,
    userId,
    method,
    purpose: "login_verify",
    codeHash: method === "email" ? "sha:123456" : undefined,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    status: "pending",
  });
  return { userId, challengeId };
}

describe("verify-2fa route idempotency", () => {
  beforeEach(() => {
    mocks.reset();
  });

  it.each([
    ["otp", "654321"],
    ["email", "123456"],
  ] as const)("completes a valid %s login before returning success", async (method, code) => {
    const { challengeId } = await seedPendingChallenge(method);

    const response = await POST(
      verifyRequest(
        { code, method, next: "/admin/marketing" },
        `pending_2fa=${String(challengeId)}`,
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      redirectUrl: "/admin/marketing",
    });
    expect(mocks.operations).toEqual([
      "challenge:used",
      "cookie:pending-cleared",
      "session:start",
      "session:complete",
    ]);
    expect(mocks.applySessionCookies).toHaveBeenCalledTimes(1);
    expect(mocks.readChallenge(challengeId)).toMatchObject({
      status: "used",
      consumedAt: expect.any(Date),
    });
    expect(mocks.scheduleAuthEvent).toHaveBeenCalledTimes(2);
    expect(mocks.scheduleAuthEvent).toHaveBeenNthCalledWith(
      1,
      "auth.2fa.success",
      expect.objectContaining({ meta: expect.any(Object) }),
    );
    expect(mocks.scheduleAuthEvent).toHaveBeenNthCalledWith(
      2,
      "auth.login.success",
      expect.objectContaining({ meta: expect.any(Object) }),
    );
  });

  it("does not resolve the response until the session cookie write completes", async () => {
    const { challengeId } = await seedPendingChallenge("otp");
    let releaseSession!: () => void;
    const sessionPending = new Promise<void>((resolve) => {
      releaseSession = resolve;
    });
    mocks.setSessionWrite(() => sessionPending);

    let settled = false;
    const responsePromise = POST(
      verifyRequest(
        { code: "654321", method: "otp", next: "/account" },
        `pending_2fa=${String(challengeId)}`,
      ),
    ).then((response) => {
      settled = true;
      return response;
    });

    await vi.waitFor(() => {
      expect(mocks.applySessionCookies).toHaveBeenCalledTimes(1);
    });
    expect(settled).toBe(false);

    releaseSession();
    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(mocks.operations.at(-1)).toBe("session:complete");
  });

  it("treats a missing challenge as success only for an active 2FA session", async () => {
    mocks.setSessionUser({
      sessionValid: true,
      sessionTwoFactorAuthenticated: true,
      role: "admin",
      roles: ["admin"],
    });

    const replay = await POST(
      verifyRequest({ code: "654321", method: "otp", next: "/admin/marketing" }),
    );

    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({
      ok: true,
      idempotent: true,
      redirectUrl: "/admin/marketing",
    });
    expect(mocks.applySessionCookies).not.toHaveBeenCalled();

    mocks.setSessionUser(null);
    const missing = await POST(
      verifyRequest({ code: "654321", method: "otp", next: "/account" }),
    );
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toMatchObject({
      error: "challenge_missing",
    });
  });

  it("does not create a new session when a consumed challenge is replayed", async () => {
    const { challengeId } = await seedPendingChallenge("otp");
    const consumed = mocks.readChallenge(challengeId);
    mocks.seedChallenge({
      ...consumed,
      status: "used",
      consumedAt: new Date(),
    });
    mocks.setSessionUser({
      sessionValid: true,
      sessionTwoFactorAuthenticated: true,
      role: "admin",
      roles: ["admin"],
    });

    const response = await POST(
      verifyRequest(
        { code: "654321", method: "otp", next: "/admin" },
        `pending_2fa=${String(challengeId)}; session_token=valid`,
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      idempotent: true,
    });
    expect(mocks.applySessionCookies).not.toHaveBeenCalled();
  });

  it("keeps consumed challenges fail-closed without a valid session", async () => {
    const { challengeId } = await seedPendingChallenge("otp");
    const consumed = mocks.readChallenge(challengeId);
    mocks.seedChallenge({
      ...consumed,
      status: "used",
      consumedAt: new Date(),
    });

    const response = await POST(
      verifyRequest(
        { code: "654321", method: "otp" },
        `pending_2fa=${String(challengeId)}`,
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "challenge_missing",
    });
    expect(mocks.applySessionCookies).not.toHaveBeenCalled();
  });

  it("rejects invalid, expired and method-mismatched codes", async () => {
    const invalid = await seedPendingChallenge("otp");
    const invalidResponse = await POST(
      verifyRequest(
        { code: "000000", method: "otp" },
        `pending_2fa=${String(invalid.challengeId)}`,
      ),
    );
    expect(invalidResponse.status).toBe(401);
    await expect(invalidResponse.json()).resolves.toMatchObject({
      error: "invalid_code",
    });
    expect(mocks.scheduleAuthEvent).toHaveBeenCalledWith(
      "auth.2fa.failed",
      expect.objectContaining({ meta: expect.any(Object) }),
    );

    const expired = await seedPendingChallenge("otp");
    mocks.seedChallenge({
      ...mocks.readChallenge(expired.challengeId),
      expiresAt: new Date(Date.now() - 1000),
    });
    const expiredResponse = await POST(
      verifyRequest(
        { code: "654321", method: "otp" },
        `pending_2fa=${String(expired.challengeId)}`,
      ),
    );
    expect(expiredResponse.status).toBe(400);
    await expect(expiredResponse.json()).resolves.toMatchObject({
      error: "challenge_expired",
    });

    const mismatched = await seedPendingChallenge("otp");
    const mismatchResponse = await POST(
      verifyRequest(
        { code: "123456", method: "email" },
        `pending_2fa=${String(mismatched.challengeId)}`,
      ),
    );
    expect(mismatchResponse.status).toBe(400);
    await expect(mismatchResponse.json()).resolves.toMatchObject({
      error: "method_mismatch",
    });
    expect(mocks.applySessionCookies).not.toHaveBeenCalled();
  });
});
