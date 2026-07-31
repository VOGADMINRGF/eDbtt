import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  const users = new Map<string, AnyDoc>();
  const credentialsByUserId = new Map<string, AnyDoc>();
  const challenges = new Map<string, AnyDoc>();

  function clone<T>(value: T): T {
    if (value == null) return value;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (Array.isArray(value)) return value.map((entry) => clone(entry)) as T;
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
    readChallenge(id: unknown) {
      return clone(challenges.get(objectIdString(id)) ?? null);
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
          findOne: vi.fn(async (query: AnyDoc) => clone(challenges.get(objectIdString(query?._id)) ?? null)),
          updateOne: vi.fn(async (query: AnyDoc, update: AnyDoc) => {
            const key = objectIdString(query?._id);
            const current = challenges.get(key);
            if (!current) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
            challenges.set(key, { ...current, ...(update?.$set ?? {}) });
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
          }),
        };
      }
      throw new Error(`unexpected_pii_collection_${name}`);
    }),
    rateLimitOrThrow: vi.fn(async () => ({ ok: true })),
    issueTwoFactorChallenge: vi.fn(async ({ method }: AnyDoc) => ({
      ok: true as const,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      challengeId: `${method}-challenge`,
    })),
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

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
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
  issueTwoFactorChallenge: (...args: unknown[]) => mocks.issueTwoFactorChallenge(...args),
}));

import { POST } from "@/app/api/auth/2fa/select-method/route";

function requestWithCookies(body: Record<string, unknown>, cookie: string) {
  return new NextRequest("http://localhost/api/auth/2fa/select-method", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      cookie,
    },
    body: JSON.stringify(body),
  });
}

describe("2FA method selection route", () => {
  beforeEach(() => {
    mocks.reset();
  });

  it("switches an authenticator-based login challenge to email", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    const challengeId = new ObjectId();
    mocks.seedUser({
      _id: userId,
      email: "person@example.org",
      verification: { twoFA: { enabled: true, method: "totp", secret: "SECRET123" } },
    });
    mocks.seedCredentials({
      coreUserId: userId,
      email: "person@example.org",
      otpSecret: "SECRET123",
    });
    mocks.seedChallenge({
      _id: challengeId,
      userId,
      method: "otp",
      purpose: "login_verify",
      redirectTo: "/create",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      status: "pending",
    });

    const res = await POST(
      requestWithCookies({ method: "email", next: "/create" }, `pending_2fa=${String(challengeId)}`),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, method: "email" });
    expect(mocks.issueTwoFactorChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        method: "email",
        emailForCode: "person@example.org",
        purpose: "login_verify",
        redirectTo: "/create",
      }),
    );
  });

  it("switches an email challenge back to authenticator app when a secret exists", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    const challengeId = new ObjectId();
    mocks.seedUser({
      _id: userId,
      email: "person@example.org",
      verification: { twoFA: { enabled: true, method: "totp", secret: "SECRET123" } },
    });
    mocks.seedCredentials({
      coreUserId: userId,
      email: "person@example.org",
      otpSecret: "SECRET123",
    });
    mocks.seedChallenge({
      _id: challengeId,
      userId,
      method: "email",
      purpose: "login_verify",
      redirectTo: "/create",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      status: "pending",
    });

    const res = await POST(
      requestWithCookies({ method: "otp", next: "/create" }, `pending_2fa=${String(challengeId)}`),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, method: "otp" });
    expect(mocks.issueTwoFactorChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        method: "otp",
        emailForCode: "person@example.org",
      }),
    );
  });

  it("keeps the existing challenge pending when required email delivery fails", async () => {
    const { ObjectId } = await import("mongodb");
    const userId = new ObjectId();
    const challengeId = new ObjectId();
    mocks.seedUser({
      _id: userId,
      email: "delivery-failure@example.org",
      verification: { twoFA: { enabled: true, method: "totp", secret: "SECRET123" } },
    });
    mocks.seedCredentials({
      coreUserId: userId,
      email: "delivery-failure@example.org",
      otpSecret: "SECRET123",
    });
    mocks.seedChallenge({
      _id: challengeId,
      userId,
      method: "otp",
      purpose: "login_verify",
      redirectTo: "/create",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      status: "pending",
    });
    mocks.issueTwoFactorChallenge.mockResolvedValueOnce({
      ok: false,
      error: "mail_delivery_failed",
      delivery: {
        status: "failed",
        category: "smtp_timeout",
        retryable: true,
        attemptedCount: 1,
        deliveredCount: 0,
        failedCount: 1,
      },
    });

    const response = await POST(
      requestWithCookies(
        { method: "email", next: "/create" },
        `pending_2fa=${String(challengeId)}`,
      ),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "mail_delivery_failed",
      delivery: { category: "smtp_timeout", retryable: true },
    });
    expect(mocks.readChallenge(challengeId)).toMatchObject({ status: "pending" });
  });
});
