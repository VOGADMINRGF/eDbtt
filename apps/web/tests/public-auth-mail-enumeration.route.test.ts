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
}));

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  const users = {
    findOne: vi.fn(async () => mocks.user),
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

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: vi.fn(async () => ({ ok: true })),
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
    headers: { "content-type": "application/json" },
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
    mocks.user = {
      _id: new ObjectId("66b0bca9f1b1444b8f635201"),
      email: "known@company.de",
      name: "Known",
      profile: { displayName: "Known" },
      settings: { preferredLocale: "de" },
    };
    mocks.sendMail.mockResolvedValue(delivered);
    mocks.createEmailVerificationToken
      .mockResolvedValueOnce({
        rawToken: "verify-raw-1",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        rawToken: "verify-raw-2",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
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
});
