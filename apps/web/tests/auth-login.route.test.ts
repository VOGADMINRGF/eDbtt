import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  const users = new Map<string, AnyDoc>();
  const credentialsByEmail = new Map<string, AnyDoc>();
  const twoFactorChallenges: AnyDoc[] = [];
  const validPasswordPairs = new Set<string>();

  function asKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const fn = (value as { toHexString?: () => string }).toHexString;
      if (typeof fn === "function") return fn.call(value);
    }
    return String(value ?? "");
  }

  function clone<T>(value: T): T {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function getByPath(doc: AnyDoc, path: string) {
    return path.split(".").reduce((acc: unknown, key) => {
      if (acc && typeof acc === "object") return (acc as AnyDoc)[key];
      return undefined;
    }, doc);
  }

  function upsertCredential(filter: AnyDoc, update: AnyDoc) {
    const set = update?.$set && typeof update.$set === "object" ? update.$set : {};
    let current: AnyDoc | undefined;
    let currentKey: string | null = null;

    for (const [emailKey, candidate] of credentialsByEmail.entries()) {
      const byId = filter?._id != null && asKey(candidate?._id) === asKey(filter._id);
      const byEmail = filter?.email != null && String(candidate?.email ?? "").toLowerCase() === String(filter.email).toLowerCase();
      const byCoreUserId =
        filter?.coreUserId != null && asKey(candidate?.coreUserId) === asKey(filter.coreUserId);
      if (byId || byEmail || byCoreUserId) {
        current = candidate;
        currentKey = emailKey;
        break;
      }
    }

    if (!current) {
      const fallbackEmail =
        String(set.email ?? filter?.email ?? "").trim().toLowerCase();
      if (!fallbackEmail) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      current = {
        _id: filter?._id ?? `cred-${credentialsByEmail.size + 1}`,
        coreUserId: filter?.coreUserId ?? null,
        email: fallbackEmail,
      };
      currentKey = fallbackEmail;
    }

    const next = { ...current, ...set };
    const nextEmail = String(next.email ?? currentKey ?? "").trim().toLowerCase();
    if (!nextEmail) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };

    if (currentKey && currentKey !== nextEmail) credentialsByEmail.delete(currentKey);
    credentialsByEmail.set(nextEmail, next);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  const usersFindOne = vi.fn(async (query: AnyDoc) => {
    if (query?._id != null) {
      const hit = users.get(asKey(query._id));
      return clone(hit ?? null);
    }
    const clauses = Array.isArray(query?.$or) ? query.$or : [];
    for (const user of users.values()) {
      for (const clause of clauses) {
        const [path, expected] = Object.entries(clause ?? {})[0] ?? [];
        if (!path) continue;
        if (getByPath(user, path) === expected) {
          return clone(user);
        }
      }
    }
    return null;
  });

  const credentialsFindOne = vi.fn(async (query: AnyDoc) => {
    const key = String(query?.email ?? "").trim().toLowerCase();
    return clone(credentialsByEmail.get(key) ?? null);
  });

  const credentialsUpdateOne = vi.fn(async (filter: AnyDoc, update: AnyDoc) =>
    upsertCredential(filter, update),
  );

  const piiCol = vi.fn(async (name: string) => {
    if (name === "user_credentials") {
      return {
        findOne: credentialsFindOne,
        updateOne: credentialsUpdateOne,
      };
    }
    if (name === "twofactor_challenges") {
      return {
        insertOne: vi.fn(async (doc: AnyDoc) => {
          const insertedId = `challenge-${twoFactorChallenges.length + 1}`;
          twoFactorChallenges.push({ ...doc, _id: insertedId });
          return { acknowledged: true, insertedId };
        }),
      };
    }
    throw new Error(`unexpected_pii_collection_${name}`);
  });

  const coreCol = vi.fn(async (name: string) => {
    if (name !== "users") throw new Error(`unexpected_core_collection_${name}`);
    return {
      findOne: usersFindOne,
    };
  });

  const verifyPassword = vi.fn(async (plain: string, hash: string) =>
    validPasswordPairs.has(`${plain}::${hash}`),
  );

  return {
    seedUser(doc: AnyDoc) {
      users.set(asKey(doc._id), clone(doc));
    },
    seedCredentials(doc: AnyDoc) {
      const key = String(doc.email ?? "").trim().toLowerCase();
      credentialsByEmail.set(key, clone({ ...doc, email: key }));
    },
    allowPassword(plain: string, hash: string) {
      validPasswordPairs.add(`${plain}::${hash}`);
    },
    readCredentialByEmail(email: string) {
      return clone(credentialsByEmail.get(email.toLowerCase()) ?? null);
    },
    reset() {
      users.clear();
      credentialsByEmail.clear();
      twoFactorChallenges.length = 0;
      validPasswordPairs.clear();
      vi.clearAllMocks();
    },
    coreCol,
    piiCol,
    usersFindOne,
    credentialsUpdateOne,
    verifyPassword,
    logAuthEvent: vi.fn(async () => {}),
    rateLimitOrThrow: vi.fn(async () => ({ ok: true })),
    applySessionCookies: vi.fn(async () => {}),
    setPendingTwoFactorCookie: vi.fn(async () => {}),
    ensureBasicPiiProfile: vi.fn(async () => {}),
    ensureEnvSuperadminSeed: vi.fn(async () => {}),
    sendMail: vi.fn(async () => {}),
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

vi.mock("@/utils/password", () => ({
  verifyPassword: (...args: unknown[]) => mocks.verifyPassword(...args),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

vi.mock("@/utils/emailTemplates", () => ({
  buildTwoFactorCodeMail: vi.fn(() => ({
    subject: "code",
    html: "<p>code</p>",
    text: "code",
  })),
}));

vi.mock("@core/telemetry/authEvents", () => ({
  logAuthEvent: (...args: unknown[]) => mocks.logAuthEvent(...args),
}));

vi.mock("@core/pii/userProfileService", () => ({
  ensureBasicPiiProfile: (...args: unknown[]) => mocks.ensureBasicPiiProfile(...args),
}));

vi.mock("@/lib/server/auth/superadminSeed", () => ({
  ensureEnvSuperadminSeed: (...args: unknown[]) => mocks.ensureEnvSuperadminSeed(...args),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
}));

vi.mock("@/app/api/auth/sharedAuth", () => ({
  CREDENTIAL_COLLECTION: "user_credentials",
  TWO_FA_COLLECTION: "twofactor_challenges",
  LOGIN_WINDOW_MS: 15 * 60 * 1000,
  TWO_FA_WINDOW_MS: 10 * 60 * 1000,
  normalizeIdentifier: (raw?: string | null) => (raw ?? "").trim().toLowerCase(),
  sanitizeRedirect: (value?: string | null) => {
    if (!value) return "/";
    const trimmed = String(value).trim();
    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
    return trimmed;
  },
  sha256: (value: string) => `sha:${value}`,
  resolveTwoFactorMethod: (creds?: Record<string, any> | null, user?: Record<string, any> | null) => {
    const method = creds?.twoFactorMethod || user?.verification?.twoFA?.method;
    if (!method) return null;
    return method === "totp" ? "otp" : method;
  },
  setPendingTwoFactorCookie: (...args: unknown[]) => mocks.setPendingTwoFactorCookie(...args),
  applySessionCookies: (...args: unknown[]) => mocks.applySessionCookies(...args),
}));

import { POST } from "@/app/api/auth/login/route";

function loginReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.1" },
    body: JSON.stringify(body),
  });
}

describe("auth login route regressions", () => {
  beforeEach(() => {
    mocks.reset();
  });

  it("auth fallback: orphaned credentials.coreUserId still resolves user via identifier", async () => {
    mocks.seedUser({
      _id: "user-1",
      email: "rgf@voiceopengov.de",
      passwordHash: "core-hash-1",
    });
    mocks.seedCredentials({
      _id: "cred-1",
      coreUserId: "missing-user",
      email: "rgf@voiceopengov.de",
      passwordHash: "core-hash-1",
    });
    mocks.allowPassword("correct-pass", "core-hash-1");

    const res = await POST(
      loginReq({
        identifier: "rgf@voiceopengov.de",
        password: "correct-pass",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, require2fa: false });
    expect(mocks.usersFindOne).toHaveBeenCalledWith({ _id: "missing-user" });
    expect(mocks.usersFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([{ email: "rgf@voiceopengov.de" }]),
      }),
    );
    expect(mocks.applySessionCookies).toHaveBeenCalledTimes(1);
  });

  it("auth fallback: stale pii password hash falls back to core hash and repairs credentials", async () => {
    mocks.seedUser({
      _id: "user-2",
      email: "rgf@voiceopengov.de",
      passwordHash: "core-hash-2",
    });
    mocks.seedCredentials({
      _id: "cred-2",
      coreUserId: "user-2",
      email: "rgf@voiceopengov.de",
      passwordHash: "stale-pii-hash",
    });
    mocks.allowPassword("correct-pass", "core-hash-2");

    const res = await POST(
      loginReq({
        identifier: "rgf@voiceopengov.de",
        password: "correct-pass",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, require2fa: false });
    expect(mocks.verifyPassword).toHaveBeenNthCalledWith(1, "correct-pass", "stale-pii-hash");
    expect(mocks.verifyPassword).toHaveBeenNthCalledWith(2, "correct-pass", "core-hash-2");
    expect(mocks.credentialsUpdateOne).toHaveBeenCalledWith(
      { _id: "cred-2" },
      {
        $set: expect.objectContaining({
          passwordHash: "core-hash-2",
        }),
      },
    );
    expect(mocks.readCredentialByEmail("rgf@voiceopengov.de")?.passwordHash).toBe("core-hash-2");
  });

  it("auth fallback: wrong password still returns 401", async () => {
    mocks.seedUser({
      _id: "user-3",
      email: "rgf@voiceopengov.de",
      passwordHash: "core-hash-3",
    });
    mocks.seedCredentials({
      _id: "cred-3",
      coreUserId: "user-3",
      email: "rgf@voiceopengov.de",
      passwordHash: "pii-hash-3",
    });

    const res = await POST(
      loginReq({
        identifier: "rgf@voiceopengov.de",
        password: "wrong-pass",
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "invalid_credentials" });
    expect(mocks.credentialsUpdateOne).not.toHaveBeenCalled();
    expect(mocks.applySessionCookies).not.toHaveBeenCalled();
  });

  it("auth fallback: 2FA flow remains enforced", async () => {
    mocks.seedUser({
      _id: "user-4",
      email: "rgf@voiceopengov.de",
      passwordHash: "core-hash-4",
      verification: { twoFA: { enabled: true, method: "email" } },
    });
    mocks.seedCredentials({
      _id: "cred-4",
      coreUserId: "user-4",
      email: "rgf@voiceopengov.de",
      passwordHash: "core-hash-4",
      twoFactorEnabled: true,
      twoFactorMethod: "email",
    });
    mocks.allowPassword("correct-pass", "core-hash-4");

    const res = await POST(
      loginReq({
        identifier: "rgf@voiceopengov.de",
        password: "correct-pass",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      require2fa: true,
      method: "email",
      message: "twofactor_required",
    });
    expect(mocks.applySessionCookies).not.toHaveBeenCalled();
    expect(mocks.setPendingTwoFactorCookie).toHaveBeenCalledTimes(1);
  });

  it("does not advertise an email fallback for active authenticator-based 2FA", async () => {
    mocks.seedUser({
      _id: "user-otp",
      email: "otp@example.org",
      passwordHash: "otp-hash",
      verification: { twoFA: { enabled: true, method: "totp" } },
    });
    mocks.seedCredentials({
      _id: "cred-otp",
      coreUserId: "user-otp",
      email: "otp@example.org",
      passwordHash: "otp-hash",
      twoFactorEnabled: true,
      twoFactorMethod: "otp",
      otpSecret: "SECRET123",
    });
    mocks.allowPassword("correct-pass", "otp-hash");

    const res = await POST(
      loginReq({
        identifier: "otp@example.org",
        password: "correct-pass",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      require2fa: true,
      method: "otp",
      allowEmailFallback: false,
    });
  });

  it("routes admin/backoffice users to /admin when no explicit next target exists", async () => {
    mocks.seedUser({
      _id: "user-5",
      email: "admin@example.org",
      role: "admin",
      roles: ["admin"],
      passwordHash: "admin-hash",
    });
    mocks.seedCredentials({
      _id: "cred-5",
      coreUserId: "user-5",
      email: "admin@example.org",
      passwordHash: "admin-hash",
    });
    mocks.allowPassword("correct-pass", "admin-hash");

    const res = await POST(
      loginReq({
        identifier: "admin@example.org",
        password: "correct-pass",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      require2fa: false,
      redirectUrl: "/admin",
    });
  });

  it("prevents non-admin users from being redirected to admin-only targets", async () => {
    mocks.seedUser({
      _id: "user-6",
      email: "journal@example.org",
      role: "journalist",
      roles: ["journalist"],
      passwordHash: "journal-hash",
    });
    mocks.seedCredentials({
      _id: "cred-6",
      coreUserId: "user-6",
      email: "journal@example.org",
      passwordHash: "journal-hash",
    });
    mocks.allowPassword("correct-pass", "journal-hash");

    const res = await POST(
      loginReq({
        identifier: "journal@example.org",
        password: "correct-pass",
        next: "/admin/pricing/orders",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      require2fa: false,
      redirectUrl: "/account?context=journalismus",
    });
  });
});
