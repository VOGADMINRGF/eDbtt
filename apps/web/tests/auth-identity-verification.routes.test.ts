import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  getCol: vi.fn(),
  startIdentityVerification: vi.fn(),
  completeIdentityVerification: vi.fn(),
  logIdentityEvent: vi.fn(),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

vi.mock("@core/auth/identityVerificationService", async () => {
  const actual = await vi.importActual("@core/auth/identityVerificationService");
  return {
    ...actual,
    startIdentityVerification: (...args: unknown[]) => mocks.startIdentityVerification(...args),
    completeIdentityVerification: (...args: unknown[]) => mocks.completeIdentityVerification(...args),
  };
});

vi.mock("@core/telemetry/identityEvents", () => ({
  logIdentityEvent: (...args: unknown[]) => mocks.logIdentityEvent(...args),
}));

import { POST as startVerification } from "@/app/api/auth/verification/start/route";
import { POST as confirmVerification } from "@/app/api/auth/verification/confirm/route";
import { IdentityVerificationError } from "@core/auth/identityVerificationService";

function post(url: string, body: Record<string, unknown>, cookie?: string) {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("identity verification routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({ uid: "65f000000000000000000001" });
    mocks.getCol.mockResolvedValue({
      findOne: vi.fn(async () => ({ verifiedEmail: true })),
    });
    mocks.startIdentityVerification.mockResolvedValue({
      _id: { toString: () => "65f0000000000000000000aa" },
      status: "pending",
      provider: "mock",
    });
    mocks.completeIdentityVerification.mockResolvedValue({
      verification: { level: "soft", methods: ["otb_app"] },
    });
    mocks.logIdentityEvent.mockResolvedValue(undefined);
  });

  it("requires a signed session and ignores a forged u_id cookie", async () => {
    mocks.readSession.mockResolvedValue(null);

    const res = await startVerification(
      post(
        "http://localhost/api/auth/verification/start",
        { method: "otb_app" },
        "u_id=65f000000000000000000999",
      ),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "not_authenticated",
    });
    expect(mocks.startIdentityVerification).not.toHaveBeenCalled();
  });

  it("binds start requests to the signed session user instead of the raw cookie", async () => {
    const forgedCookieUserId = "65f000000000000000000999";

    const res = await startVerification(
      post(
        "http://localhost/api/auth/verification/start",
        { method: "otb_app" },
        `u_id=${forgedCookieUserId}`,
      ),
    );

    expect(res.status).toBe(200);
    expect(mocks.startIdentityVerification).toHaveBeenCalledTimes(1);
    expect(mocks.startIdentityVerification.mock.calls[0]?.[0]).toMatchObject({
      method: "otb_app",
    });
    const boundUserId = mocks.startIdentityVerification.mock.calls[0]?.[0]?.userId;
    expect(String(boundUserId)).toBe("65f000000000000000000001");
  });

  it("maps owner/proof failures from confirm without duplicating route logic", async () => {
    mocks.completeIdentityVerification.mockRejectedValue(
      new IdentityVerificationError("forbidden", 403),
    );

    const res = await confirmVerification(
      post(
        "http://localhost/api/auth/verification/confirm",
        {
          sessionId: "65f0000000000000000000aa",
          providerProof: {
            adapter: "test",
            verificationId: "proof-123456",
            verified: true,
          },
        },
        "u_id=65f000000000000000000999",
      ),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "forbidden",
    });
    expect(mocks.completeIdentityVerification).toHaveBeenCalledWith({
      sessionId: "65f0000000000000000000aa",
      userId: expect.anything(),
      providerPayload: {
        adapter: "test",
        verificationId: "proof-123456",
        verified: true,
      },
    });
    expect(mocks.logIdentityEvent).not.toHaveBeenCalledWith(
      "identity_otb_confirm",
      expect.anything(),
    );
  });
});
