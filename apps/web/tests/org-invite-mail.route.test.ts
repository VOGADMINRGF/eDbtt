import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  orgId: "66b0bca9f1b1444b8f635101",
  userId: "66b0bca9f1b1444b8f635102",
  actorId: "66b0bca9f1b1444b8f635103",
  existingUser: null as Record<string, any> | null,
  existingMembership: null as Record<string, any> | null,
  membershipUpdates: [] as Array<Record<string, any>>,
  sendMail: vi.fn(),
  recordAuditEvent: vi.fn(async () => {}),
}));

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    ObjectId,
    getCol: vi.fn(async () => ({
      findOne: vi.fn(async () => mocks.existingUser),
      insertOne: vi.fn(async () => ({ insertedId: new ObjectId(mocks.userId) })),
    })),
  };
});

vi.mock("@features/org/db", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    orgsCol: vi.fn(async () => ({
      findOne: vi.fn(async () => ({
        _id: new ObjectId(mocks.orgId),
        name: "Civic Lab",
      })),
    })),
    orgMembershipsCol: vi.fn(async () => ({
      findOne: vi.fn(async () => mocks.existingMembership),
      findOneAndUpdate: vi.fn(async () => ({
        _id: new ObjectId("66b0bca9f1b1444b8f635104"),
        status: "active",
      })),
      updateOne: vi.fn(async (_query: unknown, update: Record<string, any>) => {
        mocks.membershipUpdates.push(update);
        return { acknowledged: true };
      }),
    })),
  };
});

vi.mock("@features/org/invite", () => ({
  createInviteToken: () => ({ raw: "invite-raw", tokenHash: "invite-hash" }),
}));

vi.mock("@/lib/server/auth/org", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    requireAdminOrOrgRole: vi.fn(async () => ({
      user: { _id: new ObjectId(mocks.actorId) },
    })),
  };
});

vi.mock("@features/audit/recordAuditEvent", () => ({
  recordAuditEvent: (...args: unknown[]) => mocks.recordAuditEvent(...args),
}));

vi.mock("@/utils/tokens", () => ({
  createToken: vi.fn(async () => "reset-token"),
}));

vi.mock("@/utils/email", () => ({
  resetEmailLink: (token: string) => `https://edebatte.org/reset?token=${token}`,
}));

vi.mock("@/utils/mailer", () => {
  return {
    sendMail: (...args: unknown[]) => mocks.sendMail(...args),
    mailFailureMetadata: (result: Record<string, unknown>) => ({
      status: result.status,
      category: result.category,
      retryable: result.retryable,
      attemptedCount: result.attemptedCount,
      deliveredCount: result.deliveredCount,
      failedCount: result.failedCount,
    }),
  };
});

import { POST } from "@/app/api/admin/orgs/[orgId]/members/invite/route";

const delivered = {
  ok: true,
  status: "delivered",
  transport: "smtp",
  category: null,
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 1,
  failedCount: 0,
  messageId: "org-message",
};

function inviteRequest() {
  return new NextRequest(
    `http://localhost/api/admin/orgs/${mocks.orgId}/members/invite`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "english-member@example.org",
        role: "editor",
      }),
    },
  );
}

describe("organization invite mail route", () => {
  beforeEach(async () => {
    const { ObjectId } = await import("mongodb");
    vi.clearAllMocks();
    mocks.membershipUpdates.length = 0;
    mocks.existingMembership = null;
    mocks.existingUser = {
      _id: new ObjectId(mocks.userId),
      email: "english-member@example.org",
      name: "Taylor",
      settings: { preferredLocale: "en-US" },
    };
    mocks.sendMail.mockResolvedValue(delivered);
  });

  it("renders an actual English access mail from the existing user locale", async () => {
    const response = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "active",
      delivery: { status: "delivered", deliveredCount: 1 },
    });
    const options = mocks.sendMail.mock.calls[0]?.[0];
    expect(options.delivery).toBe("required_delivery");
    expect(options.mail.locale).toBe("en");
    expect(options.mail.html).toContain('lang="en"');
    expect(options.mail.text).toContain("Civic Lab");
    expect(options.mail.text).not.toContain("Du wurdest");
  });

  it("reports persisted membership state without false success on delivery failure", async () => {
    mocks.sendMail.mockResolvedValueOnce({
      ok: false,
      status: "failed",
      transport: "smtp",
      code: "recipient_invalid",
      category: "recipient_invalid",
      retryable: false,
      attemptedCount: 0,
      deliveredCount: 0,
      failedCount: 1,
      messageId: null,
    });

    const response = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "mail_delivery_failed",
      partial: true,
      membershipPersisted: true,
      status: "active",
      delivery: {
        category: "recipient_invalid",
        retryable: false,
        attemptedCount: 0,
        deliveredCount: 0,
        failedCount: 1,
      },
    });
    expect(mocks.membershipUpdates.at(-1)?.$set).toMatchObject({
      inviteDeliveryStatus: "failed",
      inviteDeliveryRetryable: false,
      inviteDeliveryCategory: "recipient_invalid",
    });
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "membership_persisted_mail_delivery_failed",
      }),
    );
  });

  it("keeps a failed new-user invite in invited state on a delivery-only retry", async () => {
    const { ObjectId } = await import("mongodb");
    mocks.existingMembership = {
      _id: new ObjectId("66b0bca9f1b1444b8f635104"),
      status: "invited",
      inviteDeliveryStatus: "failed",
    };

    const response = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "invited",
    });
    const options = mocks.sendMail.mock.calls[0]?.[0];
    expect(options.tag).toBe("org_invite");
    expect(options.mail.locale).toBe("en");
    expect(options.mail.text).toContain("invited");
  });
});
