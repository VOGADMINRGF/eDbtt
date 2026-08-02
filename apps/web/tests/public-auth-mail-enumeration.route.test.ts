import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  user: null as Record<string, any> | null,
  sendMail: vi.fn(),
  createToken: vi.fn(async () => "reset-raw"),
  recordTokenDelivery: vi.fn(async () => {}),
  createEmailVerificationToken: vi.fn(),
  recordEmailVerificationDelivery: vi.fn(async () => {}),
  logIdentityEvent: vi.fn(async () => {}),
  loadPublicAuthRateLimiter: vi.fn(),
  publicAuthRateLimiter: vi.fn(),
  backendDelayMs: 0,
}));

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  const users = {
    findOne: vi.fn(async () => {
      if (mocks.backendDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, mocks.backendDelayMs));
      }
      return mocks.user;
    }),
  };
  return {
    ObjectId,
    coreCol: vi.fn(async () => users),
    getCol: vi.fn(async () => users),
  };
});

vi.mock("@/utils/tokens", () => ({
  createToken: (...args: unknown[]) => mocks.createToken(...args),
  recordTokenDelivery: (...args: unknown[]) =>
    mocks.recordTokenDelivery(...args),
}));

vi.mock("@core/auth/emailVerificationService", () => ({
  createEmailVerificationToken: (...args: unknown[]) =>
    mocks.createEmailVerificationToken(...args),
  recordEmailVerificationDelivery: (...args: unknown[]) =>
    mocks.recordEmailVerificationDelivery(...args),
}));

vi.mock("@core/telemetry/identityEvents", () => ({
  logIdentityEvent: (...args: unknown[]) => mocks.logIdentityEvent(...args),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

vi.mock("@/utils/publicAuthRateLimitLoader", () => ({
  loadPublicAuthRateLimiter: (...args: unknown[]) =>
    mocks.loadPublicAuthRateLimiter(...args),
}));

vi.mock("@/utils/publicOrigin", () => ({
  publicOrigin: () => "https://edebatte.org",
}));

vi.mock("@/utils/email", () => ({
  resetEmailLink: (token: string) =>
    `https://edebatte.org/reset?token=${encodeURIComponent(token)}`,
}));

import { POST as requestReset } from "@/app/api/auth/request-reset/route";
import { POST as startVerify } from "@/app/api/auth/email/start-verify/route";
import { POST as resendVerify } from "@/app/api/auth/verify/resend/route";

const transientFailure = {
  ok: false,
  status: "failed",
  transport: "smtp",
  code: "mail_transport_error",
  category: "smtp_timeout",
  retryable: true,
  attemptedCount: 1,
  deliveredCount: 0,
  failedCount: 1,
  messageId: null,
};

const delivered = {
  ok: true,
  status: "delivered",
  transport: "smtp",
  category: null,
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 1,
  failedCount: 0,
  messageId: "message-1",
};

function request(path: string, email: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.42",
    },
    body: JSON.stringify({ email }),
  });
}

async function responseSnapshot(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  };
}

describe("public auth mail enumeration contract", () => {
  beforeEach(async () => {
    const { ObjectId } = await import("mongodb");
    vi.clearAllMocks();
    mocks.sendMail.mockReset();
    mocks.createEmailVerificationToken.mockReset();
    mocks.loadPublicAuthRateLimiter.mockReset();
    mocks.publicAuthRateLimiter.mockReset();
    mocks.loadPublicAuthRateLimiter.mockResolvedValue(
      mocks.publicAuthRateLimiter,
    );
    mocks.publicAuthRateLimiter.mockResolvedValue({
      ok: true,
      remaining: 1,
      limit: 3,
      resetAt: Date.now() + 600_000,
      retryIn: 0,
    });
    mocks.backendDelayMs = 0;
    mocks.user = {
      _id: new ObjectId("66b0bca9f1b1444b8f635201"),
      email: "known@company.de",
      name: "Known",
      profile: { displayName: "Known" },
      settings: { preferredLocale: "de" },
    };
    mocks.sendMail.mockResolvedValue(delivered);
    let tokenNumber = 0;
    mocks.createEmailVerificationToken.mockImplementation(async () => {
      tokenNumber += 1;
      return {
        rawToken: `verify-raw-${tokenNumber}`,
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      };
    });
  });

  it("returns the identical reset response for known delivery failure and unknown address", async () => {
    mocks.sendMail.mockResolvedValueOnce(transientFailure);
    const known = await responseSnapshot(
      await requestReset(
        request("/api/auth/request-reset", "known@company.de"),
      ),
    );
    mocks.user = null;
    const unknown = await responseSnapshot(
      await requestReset(
        request("/api/auth/request-reset", "unknown@company.de"),
      ),
    );

    expect(known).toEqual({ status: 200, body: { ok: true } });
    expect(unknown).toEqual(known);
    expect(mocks.recordTokenDelivery).toHaveBeenCalledWith(
      "66b0bca9f1b1444b8f635201",
      "reset",
      "reset-raw",
      transientFailure,
    );
  });

  it("returns the identical start-verify response without delivery metadata", async () => {
    mocks.sendMail.mockResolvedValueOnce(transientFailure);
    const known = await responseSnapshot(
      await startVerify(
        request("/api/auth/email/start-verify", "known@company.de"),
      ),
    );
    mocks.user = null;
    const unknown = await responseSnapshot(
      await startVerify(
        request("/api/auth/email/start-verify", "unknown@company.de"),
      ),
    );

    expect(known).toEqual({ status: 200, body: { ok: true } });
    expect(unknown).toEqual(known);
    expect(JSON.stringify(known.body)).not.toContain("delivery");
  });

  it("rotates the canonical verify slot on duplicate resends and exposes no URL", async () => {
    const first = await responseSnapshot(
      await resendVerify(
        request("/api/auth/verify/resend", "known@company.de"),
      ),
    );
    const second = await responseSnapshot(
      await resendVerify(
        request("/api/auth/verify/resend", "known@company.de"),
      ),
    );

    expect(first).toEqual({ status: 200, body: { ok: true } });
    expect(second).toEqual(first);
    expect(first.body.verifyUrl).toBeUndefined();
    expect(second.body.verifyUrl).toBeUndefined();
    expect(mocks.createEmailVerificationToken).toHaveBeenCalledTimes(2);
    expect(mocks.recordEmailVerificationDelivery).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      "verify-raw-1",
      delivered,
    );
    expect(mocks.recordEmailVerificationDelivery).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "verify-raw-2",
      delivered,
    );
    const firstMail = mocks.sendMail.mock.calls[0]?.[0]?.mail;
    const secondMail = mocks.sendMail.mock.calls[1]?.[0]?.mail;
    expect(firstMail.text).toContain("verify-raw-1");
    expect(secondMail.text).toContain("verify-raw-2");
    expect(firstMail.text).toContain("/register/verify-email");
    expect(secondMail.text).toContain("/register/verify-email");
  });

  it("returns the same resend response for an unknown address", async () => {
    mocks.user = null;
    const response = await responseSnapshot(
      await resendVerify(
        request("/api/auth/verify/resend", "unknown@company.de"),
      ),
    );

    expect(response).toEqual({ status: 200, body: { ok: true } });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("keeps fast and slower known/unknown backends inside the documented response floor tolerance", async () => {
    mocks.backendDelayMs = 5;
    const knownStartedAt = Date.now();
    const known = await responseSnapshot(
      await requestReset(
        request("/api/auth/request-reset", "known@company.de"),
      ),
    );
    const knownDuration = Date.now() - knownStartedAt;

    mocks.user = null;
    mocks.backendDelayMs = 60;
    const unknownStartedAt = Date.now();
    const unknown = await responseSnapshot(
      await requestReset(
        request("/api/auth/request-reset", "unknown@company.de"),
      ),
    );
    const unknownDuration = Date.now() - unknownStartedAt;

    expect(known).toEqual({ status: 200, body: { ok: true } });
    expect(unknown).toEqual(known);
    expect(knownDuration).toBeGreaterThanOrEqual(100);
    expect(unknownDuration).toBeGreaterThanOrEqual(100);
    expect(Math.abs(knownDuration - unknownDuration)).toBeLessThan(70);
  });

  it("applies the same tolerant response floor to verify for known and unknown addresses", async () => {
    mocks.backendDelayMs = 10;
    const knownStartedAt = Date.now();
    const known = await responseSnapshot(
      await startVerify(
        request("/api/auth/email/start-verify", "known@company.de"),
      ),
    );
    const knownDuration = Date.now() - knownStartedAt;

    mocks.user = null;
    mocks.backendDelayMs = 55;
    const unknownStartedAt = Date.now();
    const unknown = await responseSnapshot(
      await startVerify(
        request("/api/auth/email/start-verify", "unknown@company.de"),
      ),
    );
    const unknownDuration = Date.now() - unknownStartedAt;

    expect(known).toEqual({ status: 200, body: { ok: true } });
    expect(unknown).toEqual(known);
    expect(knownDuration).toBeGreaterThanOrEqual(100);
    expect(unknownDuration).toBeGreaterThanOrEqual(100);
    expect(Math.abs(knownDuration - unknownDuration)).toBeLessThan(70);
  });

  it("returns the same public response when known and unknown addresses are rate-limited", async () => {
    mocks.publicAuthRateLimiter.mockResolvedValue({
      ok: false,
      remaining: 0,
      limit: 3,
      resetAt: Date.now() + 600_000,
      retryIn: 600_000,
    });
    const known = await responseSnapshot(
      await requestReset(
        request("/api/auth/request-reset", "known@company.de"),
      ),
    );
    mocks.user = null;
    const unknown = await responseSnapshot(
      await requestReset(
        request("/api/auth/request-reset", "unknown@company.de"),
      ),
    );

    expect(known).toEqual({ status: 200, body: { ok: true } });
    expect(unknown).toEqual(known);
    expect(mocks.createToken).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    const rateLimitInputs = mocks.publicAuthRateLimiter.mock.calls.map(
      ([input]) => input,
    );
    expect(rateLimitInputs).toHaveLength(4);
    expect(JSON.stringify(rateLimitInputs)).not.toContain("known@company.de");
    expect(JSON.stringify(rateLimitInputs)).not.toContain("unknown@company.de");
    expect(rateLimitInputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          namespace: "public-auth:reset:address",
          limit: 3,
          windowMs: 600_000,
          subjectHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        expect.objectContaining({
          namespace: "public-auth:reset:ip",
          limit: 12,
          windowMs: 600_000,
          subjectHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      ]),
    );
  });

  it("shares the verify address limit across start and resend so rotation is bounded", async () => {
    let verifyAddressChecks = 0;
    mocks.publicAuthRateLimiter.mockImplementation(async (input) => {
      if (input.namespace === "public-auth:verify:address") {
        verifyAddressChecks += 1;
        return {
          ok: verifyAddressChecks <= 3,
          remaining: Math.max(0, 3 - verifyAddressChecks),
          limit: 3,
          resetAt: Date.now() + 600_000,
          retryIn: verifyAddressChecks <= 3 ? 0 : 600_000,
        };
      }
      return {
        ok: true,
        remaining: 11,
        limit: 12,
        resetAt: Date.now() + 600_000,
        retryIn: 0,
      };
    });

    const responses = [];
    for (const path of [
      "/api/auth/email/start-verify",
      "/api/auth/verify/resend",
      "/api/auth/email/start-verify",
      "/api/auth/verify/resend",
    ]) {
      const handler = path.includes("start-verify") ? startVerify : resendVerify;
      responses.push(
        await responseSnapshot(
          await handler(request(path, "known@company.de")),
        ),
      );
    }

    expect(responses).toEqual([
      { status: 200, body: { ok: true } },
      { status: 200, body: { ok: true } },
      { status: 200, body: { ok: true } },
      { status: 200, body: { ok: true } },
    ]);
    expect(mocks.createEmailVerificationToken).toHaveBeenCalledTimes(3);
    expect(mocks.sendMail).toHaveBeenCalledTimes(3);
  });

  it("fails an unreachable limiter storage closed behind the same public response", async () => {
    const audit = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.publicAuthRateLimiter.mockRejectedValue(
      new Error("storage unavailable"),
    );

    const response = await responseSnapshot(
      await resendVerify(
        request("/api/auth/verify/resend", "known@company.de"),
      ),
    );

    expect(response).toEqual({ status: 200, body: { ok: true } });
    expect(mocks.createEmailVerificationToken).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledWith(
      "[public-auth-mail-control] rate_limiter_unavailable",
      expect.objectContaining({
        auditStatus: "rate_limiter_unavailable",
        scope: "verify",
        category: "loader_or_storage_error",
      }),
    );
    audit.mockRestore();
  });

  it("fails a null limiter loader closed with a structured internal audit status", async () => {
    const audit = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.loadPublicAuthRateLimiter.mockResolvedValue(null);

    const response = await responseSnapshot(
      await requestReset(
        request("/api/auth/request-reset", "known@company.de"),
      ),
    );

    expect(response).toEqual({ status: 200, body: { ok: true } });
    expect(mocks.createToken).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledWith(
      "[public-auth-mail-control] rate_limiter_unavailable",
      expect.objectContaining({
        auditStatus: "rate_limiter_unavailable",
        scope: "reset",
        category: "loader_null",
      }),
    );
    audit.mockRestore();
  });

  it("fails a real limiter loader error closed without token or mail side effects", async () => {
    const audit = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.loadPublicAuthRateLimiter.mockRejectedValue(
      new Error("dynamic import failed"),
    );

    const response = await responseSnapshot(
      await startVerify(
        request("/api/auth/email/start-verify", "known@company.de"),
      ),
    );

    expect(response).toEqual({ status: 200, body: { ok: true } });
    expect(mocks.createEmailVerificationToken).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledWith(
      "[public-auth-mail-control] rate_limiter_unavailable",
      expect.objectContaining({
        auditStatus: "rate_limiter_unavailable",
        scope: "verify",
        category: "loader_or_storage_error",
      }),
    );
    audit.mockRestore();
  });
});
