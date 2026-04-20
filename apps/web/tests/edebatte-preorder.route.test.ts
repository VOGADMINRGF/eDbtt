import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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

vi.mock("@/utils/mailer", () => ({
  sendMail: vi.fn(),
}));

vi.mock("@/utils/publicOrigin", () => ({
  publicOrigin: () => "https://edebatte.org",
}));

vi.mock("@/utils/emailTemplates", () => ({
  buildEdebatePreorderMail: vi.fn(),
}));

import { POST } from "@/app/api/edebatte/preorder/route";

describe("/api/edebatte/preorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({ uid: "65a111111111111111111111" });
    mocks.incrementRateLimit.mockResolvedValue(1);
    mocks.verifyHumanTokenDetailed.mockResolvedValue({
      ok: true,
      payload: { formId: "edebatte-preorder" },
    });
    mocks.coreCol.mockResolvedValue({
      findOne: vi.fn(async () => ({
        verifiedEmail: true,
        verification: { twoFA: { enabled: true } },
      })),
    });
    mocks.piiCol.mockImplementation(async (collection: string) => {
      if (collection === "user_profiles") {
        return { findOne: vi.fn(async () => ({ personal: { birthDate: "1990-01-01" } })) };
      }
      if (collection === "user_payment_profiles") {
        return {
          findOne: vi.fn(async () => ({
            microTransferVerifiedAt: new Date("2026-04-10T10:00:00.000Z"),
            microTransferAttempts: 0,
            holderName: "Max Mustermann",
          })),
        };
      }
      if (collection === "user_credentials") {
        return { findOne: vi.fn(async () => ({ twoFactorEnabled: true })) };
      }
      return { findOne: vi.fn(async () => null) };
    });
  });

  it("returns order id/status contract on success", async () => {
    mocks.createPreorderLead.mockResolvedValue({
      ok: true,
      mailSent: true,
      planLabel: "eDebatte Aktiv",
      orderId: "EDE-20260412-ABC123",
      status: "submitted",
      requiresReview: false,
    });
    const req = new NextRequest("http://localhost/api/edebatte/preorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        package: "start",
        email: "a@example.org",
        name: "Max Mustermann",
        acceptedPrivacy: true,
        acceptedTerms: true,
        acceptedContact: true,
        humanToken: "token",
        formStartedAt: Date.now() - 5000,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      mailSent: true,
      orderId: "EDE-20260412-ABC123",
      status: "submitted",
      requiresReview: false,
    });
  });

  it("maps usecase errors to 400", async () => {
    mocks.createPreorderLead.mockResolvedValue({ ok: false, error: "invalid_input" });
    const req = new NextRequest("http://localhost/api/edebatte/preorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        package: "basis",
        acceptedPrivacy: true,
        acceptedTerms: true,
        acceptedContact: true,
        humanToken: "token",
        formStartedAt: Date.now() - 5000,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_input" });
  });

  it("accepts institutional package orders in direct shop flow", async () => {
    mocks.createPreorderLead.mockResolvedValue({
      ok: true,
      mailSent: false,
      planLabel: "Organisation Aktivierung",
      orderId: "EDE-20260418-INST01",
      status: "under_review",
      requiresReview: true,
    });
    const req = new NextRequest("http://localhost/api/edebatte/preorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        package: "b2b_basis",
        segment: "organisationen",
        email: "org@example.org",
        organizationName: "Beispielverband",
        acceptedPrivacy: true,
        acceptedTerms: true,
        acceptedContact: true,
        humanToken: "token",
        formStartedAt: Date.now() - 5000,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      orderId: "EDE-20260418-INST01",
      status: "under_review",
      requiresReview: true,
    });
  });
});
