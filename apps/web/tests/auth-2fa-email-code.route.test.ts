import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  const users = new Map<string, AnyDoc>();
  const credentialsByUserId = new Map<string, AnyDoc>();
  const challenges = new Map<string, AnyDoc>();
  let rateLimitMode: "ok" | "cooldown" = "ok";

  function clone<T>(value: T): T {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map((entry) => clone(entry)) as T;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (typeof value === "object") return { ...(value as Record<string, unknown>) } as T;
    return value;
  }

  function objectIdString(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const maybeFn = (value as { toHexString?: () => string }).toHexString;
      if (typeof maybeFn === "function") return maybeFn.call(value);
    }
    return String(value ?? "");
  }

  return {
    reset() {
      users.clear();
      credentialsByUserId.clear();
      challenges.clear();
      rateLimitMode = "ok";
      vi.clearAllMocks();
    },
    seedUser(doc: AnyDoc) {
      users.set(objectIdString(doc._id), clone(doc));
    },
    seedCredentials(doc: AnyDoc) {
      credentialsByUserId.set(objectIdString(doc.coreUserId), clone(doc));
    },
    seedChallenge(doc: AnyDoc) {
      challenges.set(objectIdString(doc._id), clone(doc));
    },
    listChallenges() {
      return Array.from(challenges.values()).map((entry) => clone(entry));
    },
    setRateLimitMode(mode: "ok" | "cooldown") {
      rateLimitMode = mode;
    },
    coreCol: vi.fn(async (name: string) => {
      if (name !== "users") throw new Error(`unexpected_core_collection_${name}`);
      return {
        findOne: vi.fn(async (query: AnyDoc) => clone(users.get(objectIdString(query?._id)) ?? null)),
      };
    }),
    piiCol: vi.fn(async (name: string) => {
      if (name === "user_credentials") {
        return {
          findOne: vi.fn(async (query: AnyDoc) =>
            clone(credentialsByUserId.get(objectIdString(query?.coreUserId)) ?? null),
          ),
        };
      }
      if (name === "twofactor_challenges") {
        return {
          insertOne: vi.fn(async (doc: AnyDoc) => {
            const mongodb = await import("mongodb");
            const insertedId = new mongodb.ObjectId();
            challenges.set(String(insertedId), { ...clone(doc), _id: insertedId });
            return { acknowledged: true, insertedId };
          }),
          findOne: vi.fn(async (query: AnyDoc) =>
            clone(challenges.get(objectIdString(query?._id)) ?? null),
          ),
          updateOne: vi.fn(async (query: AnyDoc, update: AnyDoc) => {
            const key = objectIdString(query?._id);
            const current = challenges.get(key);
            if (!current) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
            const next = { ...current };
            if (update?.$set) Object.assign(next, update.$set);
            if (update?.$inc) {
              for (const [field, amount] of Object.entries(update.$inc)) {
                next[field] = Number(next[field] ?? 0) + Number(amount ?? 0);
              }
            }
            challenges.set(key, next);
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
          }),
        };
      }
      throw new Error(`unexpected_pii_collection_${name}`);
    }),
    rateLimitOrThrow: vi.fn(async (key: string) => {
      if (rateLimitMode === "cooldown" && key.includes("cooldown")) return { ok: false };
      return { ok: true };
    }),
    sendMail: vi.fn(async () => {}),
    buildTwoFactorCodeMail: vi.fn(() => ({
      subject: "2FA code",
      html: "<p>code</p>",
      text: "code",
    })),
    logAuthEvent: vi.fn(async () => {}),
    setPendingTwoFactorCookie: vi.fn(async () => {}),
    clearPendingTwoFactorCookie: vi.fn(async () => {}),
    setTwoFactorFallbackCookie: vi.fn(async () => {}),
    clearTwoFactorFallbackCookie: vi.fn(async () => {}),
    isDemoUser: vi.fn((user: AnyDoc) => String(user?.email || "").includes("demo")),
  };
});

vi.mock("@core/db/db/triMongo", () => ({
  coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  piiCol: (...args: unknown[]) => mocks.piiCol(...args),
}));

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return { ObjectId: mongodb.ObjectId };
});

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

vi.mock("@/utils/emailTemplates", () => ({
  buildTwoFactorCodeMail: (...args: unknown[]) => mocks.buildTwoFactorCodeMail(...args),
}));

vi.mock("@core/telemetry/authEvents", () => ({
  logAuthEvent: (...args: unknown[]) => mocks.logAuthEvent(...args),
}));

vi.mock("@/lib/demo/demoAccess", () => ({
  isDemoUser: (...args: unknown[]) => mocks.isDemoUser(...args),
}));

vi.mock("@/app/api/auth/sharedAuth", () => ({
  CREDENTIAL_COLLECTION: "user_credentials",
  TWO_FA_COLLECTION: "twofactor_challenges",
  TWO_FA_WINDOW_MS: 10 * 60 * 1000,
  sanitizeRedirect: (value?: string | null) => {
    if (!value) return "/";
    const trimmed = String(value).trim();
    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
    return trimmed;
  },
  sha256: (value: string) => `sha:${value}`,
  setPendingTwoFactorCookie: (...args: unknown[]) => mocks.setPendingTwoFactorCookie(...args),
  clearPendingTwoFactorCookie: (...args: unknown[]) => mocks.clearPendingTwoFactorCookie(...args),
  setTwoFactorFallbackCookie: (...args: unknown[]) => mocks.setTwoFactorFallbackCookie(...args),
  clearTwoFactorFallbackCookie: (...args: unknown[]) => mocks.clearTwoFactorFallbackCookie(...args),
}));

import { POST as sendEmailCode } from "@/app/api/auth/2fa/email-code/send/route";
import { POST as verifyEmailCode } from "@/app/api/auth/2fa/email-code/verify/route";

function requestWithCookies(url: string, body: Record<string, unknown>, cookie: string) {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      cookie,
    },
    body: JSON.stringify(body),
  });
}

describe("2FA email code routes", () => {
  beforeEach(async () => {
    mocks.reset();
  });

  it("creates a time-limited setup email challenge", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    mocks.seedUser({ _id: userId, email: "setup-check@example.org" });
    mocks.seedCredentials({ coreUserId: userId, email: "setup-check@example.org" });

    const res = await sendEmailCode(
      requestWithCookies(
        "http://localhost/api/auth/2fa/email-code/send",
        { next: "/admin", context: "setup" },
        `u_id=${String(userId)}`,
      ),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      retryAfterSeconds: 60,
    });
    const inserted = mocks.listChallenges();
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      method: "email",
      purpose: "setup_fallback",
      redirectTo: "/admin",
      status: "pending",
    });
    expect(String(inserted[0].codeHash || "")).toContain("sha:");
    expect(mocks.setPendingTwoFactorCookie).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("verifies a valid setup email code and enables a session fallback cookie", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    const challengeId = new ObjectId();
    mocks.seedUser({ _id: userId, email: "setup-check@example.org" });
    mocks.seedCredentials({ coreUserId: userId, email: "setup-check@example.org" });
    mocks.seedChallenge({
      _id: challengeId,
      userId,
      method: "email",
      purpose: "setup_fallback",
      codeHash: "sha:123456",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      status: "pending",
      redirectTo: "/admin",
    });

    const res = await verifyEmailCode(
      requestWithCookies(
        "http://localhost/api/auth/2fa/email-code/verify",
        { code: "123456", next: "/admin", context: "setup" },
        `u_id=${String(userId)}; pending_2fa=${String(challengeId)}`,
      ),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      redirectUrl: "/admin",
    });
    expect(mocks.setTwoFactorFallbackCookie).toHaveBeenCalledWith("setup");
    expect(mocks.clearPendingTwoFactorCookie).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid or expired email codes", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    const invalidChallengeId = new ObjectId();
    const expiredChallengeId = new ObjectId();
    mocks.seedUser({ _id: userId, email: "setup-check@example.org" });
    mocks.seedCredentials({ coreUserId: userId, email: "setup-check@example.org" });
    mocks.seedChallenge({
      _id: invalidChallengeId,
      userId,
      method: "email",
      purpose: "setup_fallback",
      codeHash: "sha:999999",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      status: "pending",
    });
    mocks.seedChallenge({
      _id: expiredChallengeId,
      userId,
      method: "email",
      purpose: "setup_fallback",
      codeHash: "sha:123456",
      createdAt: new Date(Date.now() - 12 * 60 * 1000),
      expiresAt: new Date(Date.now() - 60 * 1000),
      attempts: 0,
      status: "pending",
    });

    const invalidRes = await verifyEmailCode(
      requestWithCookies(
        "http://localhost/api/auth/2fa/email-code/verify",
        { code: "123456", context: "setup" },
        `u_id=${String(userId)}; pending_2fa=${String(invalidChallengeId)}`,
      ),
    );
    expect(invalidRes.status).toBe(401);
    await expect(invalidRes.json()).resolves.toMatchObject({ error: "invalid_code" });

    const expiredRes = await verifyEmailCode(
      requestWithCookies(
        "http://localhost/api/auth/2fa/email-code/verify",
        { code: "123456", context: "setup" },
        `u_id=${String(userId)}; pending_2fa=${String(expiredChallengeId)}`,
      ),
    );
    expect(expiredRes.status).toBe(400);
    await expect(expiredRes.json()).resolves.toMatchObject({ error: "challenge_expired" });
  });

  it("rate-limits resend attempts", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    mocks.seedUser({ _id: userId, email: "setup-demo@example.org" });
    mocks.seedCredentials({ coreUserId: userId, email: "setup-demo@example.org" });
    mocks.setRateLimitMode("cooldown");

    const res = await sendEmailCode(
      requestWithCookies(
        "http://localhost/api/auth/2fa/email-code/send",
        { next: "/admin", context: "setup" },
        `u_id=${String(userId)}`,
      ),
    );

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: 60,
    });
  });

  it("does not allow a silently downgraded email fallback for active TOTP unless recovery is explicit", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    mocks.seedUser({
      _id: userId,
      email: "admin@example.org",
      verification: { twoFA: { enabled: true, method: "totp" } },
    });
    mocks.seedCredentials({
      coreUserId: userId,
      email: "admin@example.org",
      otpSecret: "SECRET123",
      twoFactorEnabled: true,
      twoFactorMethod: "otp",
    });

    const setupRes = await sendEmailCode(
      requestWithCookies(
        "http://localhost/api/auth/2fa/email-code/send",
        { next: "/admin", context: "setup" },
        `u_id=${String(userId)}`,
      ),
    );
    expect(setupRes.status).toBe(409);
    await expect(setupRes.json()).resolves.toMatchObject({
      ok: false,
      error: "email_fallback_not_allowed",
    });

    const recoveryRes = await sendEmailCode(
      requestWithCookies(
        "http://localhost/api/auth/2fa/email-code/send",
        { next: "/admin", context: "recovery" },
        `u_id=${String(userId)}`,
      ),
    );
    expect(recoveryRes.status).toBe(200);
    await expect(recoveryRes.json()).resolves.toMatchObject({ ok: true });
  });
});
