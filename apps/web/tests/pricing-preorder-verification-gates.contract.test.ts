import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  session: { uid: "65a111111111111111111111" as string | null },
  rateAttempts: 1,
  humanCheck: { ok: true, payload: { formId: "edebatte-preorder" } } as any,
  userDoc: {
    verifiedEmail: true,
    verification: { twoFA: { enabled: true } },
  } as any,
  piiProfileDoc: { personal: { birthDate: "1990-01-01" } } as any,
  paymentProfileDoc: {
    microTransferVerifiedAt: new Date("2026-04-10T10:00:00.000Z"),
    microTransferAttempts: 0,
    holderName: "Max Mustermann",
  } as any,
  credentialsDoc: { twoFactorEnabled: true } as any,
}));

const mocks = vi.hoisted(() => ({
  createPreorderLead: vi.fn(),
  readSession: vi.fn(),
  incrementRateLimit: vi.fn(),
  verifyHumanTokenDetailed: vi.fn(),
  coreCol: vi.fn(),
  piiCol: vi.fn(),
}));

vi.mock("@features/pricing/usecases/createPreorderLead", () => ({
  createPreorderLead: (...args: unknown[]) => mocks.createPreorderLead(...args),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  incrementRateLimit: (...args: unknown[]) => mocks.incrementRateLimit(...args),
}));

vi.mock("@/lib/security/human-token", () => ({
  verifyHumanTokenDetailed: (...args: unknown[]) => mocks.verifyHumanTokenDetailed(...args),
}));

vi.mock("@core/db/triMongo", () => {
  class MockObjectId {
    value: string;
    constructor(value: string) {
      this.value = value;
    }
    static isValid(value: string) {
      return typeof value === "string" && value.length > 0;
    }
  }
  return {
    ObjectId: MockObjectId,
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
    piiCol: (...args: unknown[]) => mocks.piiCol(...args),
  };
});

import { POST } from "@/app/api/edebatte/preorder/route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/edebatte/preorder", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      package: "basis",
      email: "citizen@example.org",
      name: "Max Mustermann",
      humanToken: "token",
      formStartedAt: Date.now() - 5000,
      acceptedPrivacy: true,
      acceptedTerms: true,
      acceptedContact: true,
      ...body,
    }),
  });
}

describe("pricing preorder verification gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.session = { uid: "65a111111111111111111111" };
    state.rateAttempts = 1;
    state.humanCheck = { ok: true, payload: { formId: "edebatte-preorder" } };
    state.userDoc = {
      verifiedEmail: true,
      verification: { twoFA: { enabled: true } },
    };
    state.piiProfileDoc = { personal: { birthDate: "1990-01-01" } };
    state.paymentProfileDoc = {
      microTransferVerifiedAt: new Date("2026-04-10T10:00:00.000Z"),
      microTransferAttempts: 0,
      holderName: "Max Mustermann",
    };
    state.credentialsDoc = { twoFactorEnabled: true };

    mocks.readSession.mockImplementation(async () =>
      state.session?.uid ? { uid: state.session.uid } : null,
    );
    mocks.incrementRateLimit.mockImplementation(async () => state.rateAttempts);
    mocks.verifyHumanTokenDetailed.mockImplementation(async () => state.humanCheck);
    mocks.coreCol.mockResolvedValue({
      findOne: vi.fn(async () => state.userDoc),
    });
    mocks.piiCol.mockImplementation(async (collection: string) => {
      if (collection === "user_profiles") return { findOne: vi.fn(async () => state.piiProfileDoc) };
      if (collection === "user_payment_profiles") return { findOne: vi.fn(async () => state.paymentProfileDoc) };
      if (collection === "user_credentials") return { findOne: vi.fn(async () => state.credentialsDoc) };
      return { findOne: vi.fn(async () => null) };
    });
    mocks.createPreorderLead.mockResolvedValue({
      ok: true,
      mailSent: false,
      planLabel: "eDebatte Interessiert",
      orderId: "EDE-20260413-ABC123",
      status: "submitted",
      requiresReview: false,
    });
  });

  it("registry-required-before-activation", async () => {
    state.session = { uid: null };
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "account_required",
      status: "account_required",
    });
  });

  it("age-tariff-requires-birthdate", async () => {
    state.piiProfileDoc = { personal: {} };
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "registry_incomplete",
      status: "registry_incomplete",
    });
  });

  it("bank-verification-flow", async () => {
    state.paymentProfileDoc = {
      microTransferVerifiedAt: null,
      microTransferAttempts: 0,
      holderName: "Max Mustermann",
    };
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "bank_verification_pending",
      status: "bank_verification_pending",
    });
  });

  it("minor-review-routing", async () => {
    state.piiProfileDoc = { personal: { birthDate: "2010-04-13" } };
    mocks.createPreorderLead.mockResolvedValue({
      ok: true,
      mailSent: false,
      planLabel: "eDebatte Interessiert",
      orderId: "EDE-20260413-ABC123",
      status: "under_review",
      requiresReview: true,
    });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      progressStatus: "human_review_required",
      status: "under_review",
      requiresReview: true,
    });

    const [, options] = mocks.createPreorderLead.mock.calls[0] ?? [];
    expect(options).toMatchObject({
      initialStatusOverride: "under_review",
    });
  });

  it("totp-required-for-activation", async () => {
    state.credentialsDoc = { twoFactorEnabled: false };
    state.userDoc = {
      verifiedEmail: true,
      verification: { twoFA: { enabled: false } },
    };
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(428);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "totp_required",
      status: "totp_required",
    });
  });

  it("anti-spam-human-loop-contracts", async () => {
    const missingHuman = await POST(makeRequest({ humanToken: undefined }));
    expect(missingHuman.status).toBe(400);
    await expect(missingHuman.json()).resolves.toMatchObject({
      ok: false,
      error: "human_token_invalid",
    });

    state.humanCheck = { ok: false, code: "expired" };
    const expired = await POST(makeRequest({ humanToken: "expired-token" }));
    expect(expired.status).toBe(400);
    await expect(expired.json()).resolves.toMatchObject({
      ok: false,
      error: "human_token_expired",
    });
  });
});
