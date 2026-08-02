import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  orgId: "66b0bca9f1b1444b8f635101",
  userId: "66b0bca9f1b1444b8f635102",
  actorId: "66b0bca9f1b1444b8f635103",
  membershipId: "66b0bca9f1b1444b8f635104",
  existingUser: null as Record<string, any> | null,
  membership: null as Record<string, any> | null,
  membershipInsertCount: 0,
  membershipUpdates: [] as Array<Record<string, any>>,
  setupTokenCounter: 0,
  currentSetupToken: null as Record<string, any> | null,
  issueOrgInviteSetupToken: vi.fn(),
  startOrgInviteSetupDispatch: vi.fn(),
  recordOrgInviteSetupDelivery: vi.fn(),
  sendMail: vi.fn(),
  recordAuditEvent: vi.fn(async () => {}),
}));

function matchesClaim(query: Record<string, any>) {
  if (!mocks.membership) return false;
  if (
    query.inviteDeliveryClaimId &&
    mocks.membership.inviteDeliveryClaimId !== query.inviteDeliveryClaimId
  ) {
    return false;
  }
  if (query._id && String(query._id) !== String(mocks.membership._id)) {
    return false;
  }
  if (
    query.inviteSetupTokenHash &&
    mocks.membership.inviteSetupTokenHash !== query.inviteSetupTokenHash
  ) {
    return false;
  }
  return true;
}

function applyUpdate(target: Record<string, any>, update: Record<string, any>) {
  Object.assign(target, update.$setOnInsert ?? {}, update.$set ?? {});
}

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
      findOne: vi.fn(async () => mocks.membership),
      findOneAndUpdate: vi.fn(
        async (query: Record<string, any>, update: Record<string, any>) => {
          if (!mocks.membership) {
            mocks.membership = {
              _id: new ObjectId(mocks.membershipId),
            };
            applyUpdate(mocks.membership, update);
            mocks.membershipInsertCount += 1;
            return mocks.membership;
          }
          if (mocks.membership.inviteDeliveryClaimId) return null;
          if (query._id && String(query._id) !== String(mocks.membership._id)) {
            return null;
          }
          applyUpdate(mocks.membership, update);
          return mocks.membership;
        },
      ),
      updateOne: vi.fn(
        async (query: Record<string, any>, update: Record<string, any>) => {
          mocks.membershipUpdates.push(update);
          if (!matchesClaim(query)) return { acknowledged: true, modifiedCount: 0 };
          applyUpdate(mocks.membership!, update);
          return { acknowledged: true, modifiedCount: 1 };
        },
      ),
    })),
  };
});

vi.mock("@features/org/inviteDelivery", () => ({
  issueOrgInviteSetupToken: (...args: unknown[]) =>
    mocks.issueOrgInviteSetupToken(...args),
  startOrgInviteSetupDispatch: (...args: unknown[]) =>
    mocks.startOrgInviteSetupDispatch(...args),
  recordOrgInviteSetupDelivery: (...args: unknown[]) =>
    mocks.recordOrgInviteSetupDelivery(...args),
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

vi.mock("@/utils/email", () => ({
  resetEmailLink: (token: string) => `https://edebatte.org/reset?token=${token}`,
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
  mailFailureMetadata: (result: Record<string, unknown>) => ({
    status: result.status,
    category: result.category,
    retryable: result.retryable,
    attemptedCount: result.attemptedCount,
    deliveredCount: result.deliveredCount,
    failedCount: result.failedCount,
  }),
}));

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

function inviteRequest() {
  return new NextRequest(
    `http://localhost/api/admin/orgs/${mocks.orgId}/members/invite`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "english-member@company.de",
        role: "editor",
      }),
    },
  );
}

describe("organization invite delivery state", () => {
  beforeEach(async () => {
    const { ObjectId } = await import("mongodb");
    vi.clearAllMocks();
    mocks.membership = null;
    mocks.membershipInsertCount = 0;
    mocks.membershipUpdates.length = 0;
    mocks.setupTokenCounter = 0;
    mocks.currentSetupToken = null;
    mocks.existingUser = {
      _id: new ObjectId(mocks.userId),
      email: "english-member@company.de",
      name: "Taylor",
      settings: { preferredLocale: "en-US" },
    };
    mocks.sendMail.mockResolvedValue(delivered);
    mocks.issueOrgInviteSetupToken.mockImplementation(async () => {
      mocks.setupTokenCounter += 1;
      mocks.currentSetupToken = {
        rawToken: `org-setup-${mocks.setupTokenCounter}`,
        tokenHash: `org-setup-hash-${mocks.setupTokenCounter}`,
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      };
      return mocks.currentSetupToken;
    });
    mocks.startOrgInviteSetupDispatch.mockImplementation(
      async (input: Record<string, any>) =>
        input.rawToken === mocks.currentSetupToken?.rawToken,
    );
    mocks.recordOrgInviteSetupDelivery.mockImplementation(
      async (input: Record<string, any>) =>
        input.rawToken === mocks.currentSetupToken?.rawToken,
    );
  });

  it("keeps an existing user pending when required access delivery fails", async () => {
    mocks.sendMail.mockResolvedValueOnce(transientFailure);

    const response = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      partial: true,
      membershipId: String(mocks.membership?._id),
      status: "pending_activation",
      delivery: { category: "smtp_timeout", retryable: true },
    });
    expect(mocks.membership).toMatchObject({
      status: "pending_activation",
      inviteDeliveryStatus: "failed",
      inviteDeliveryRetryable: true,
    });
    expect(mocks.membershipInsertCount).toBe(1);
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "member_activation_pending_required_delivery_failed",
      }),
    );
  });

  it("retries the same pending membership and activates only after delivery", async () => {
    mocks.sendMail
      .mockResolvedValueOnce(transientFailure)
      .mockResolvedValueOnce(delivered);

    const first = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });
    const firstPayload = await first.json();
    const second = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(first.status).toBe(502);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({
      ok: true,
      membershipId: firstPayload.membershipId,
      status: "active",
    });
    expect(mocks.membershipInsertCount).toBe(1);
    expect(mocks.membership).toMatchObject({
      _id: expect.anything(),
      status: "active",
      inviteDeliveryStatus: "delivered",
    });
  });

  it("atomically rejects a parallel request while the first delivery owns the claim", async () => {
    let resolveDelivery!: (value: typeof delivered) => void;
    mocks.sendMail.mockImplementationOnce(
      () =>
        new Promise<typeof delivered>((resolve) => {
          resolveDelivery = resolve;
        }),
    );

    const firstPromise = POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });
    await vi.waitFor(() =>
      expect(mocks.membership?.inviteDeliveryClaimId).toEqual(expect.any(String)),
    );

    const second = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      error: "mail_delivery_in_progress",
      membershipId: String(mocks.membership?._id),
    });

    resolveDelivery(delivered);
    const first = await firstPromise;
    expect(first.status).toBe(200);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.membershipInsertCount).toBe(1);
  });

  it("uses the existing user locale for the delivered access mail", async () => {
    const response = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(response.status).toBe(200);
    const options = mocks.sendMail.mock.calls[0]?.[0];
    expect(options.delivery).toBe("required_delivery");
    expect(options.tag).toBe("org_access");
    expect(options.mail.locale).toBe("en");
    expect(options.mail.html).toContain('lang="en"');
  });

  it("reuses the invited membership but binds a fresh setup link to its retry", async () => {
    mocks.existingUser!.emailVerified = false;
    mocks.sendMail
      .mockResolvedValueOnce(transientFailure)
      .mockResolvedValueOnce(delivered);

    const first = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });
    const membershipId = String(mocks.membership?._id);
    const second = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(first.status).toBe(502);
    expect(second.status).toBe(200);
    expect(mocks.membershipInsertCount).toBe(1);
    expect(String(mocks.membership?._id)).toBe(membershipId);
    expect(mocks.issueOrgInviteSetupToken).toHaveBeenCalledTimes(2);
    const firstMail = mocks.sendMail.mock.calls[0]?.[0]?.mail;
    const secondMail = mocks.sendMail.mock.calls[1]?.[0]?.mail;
    expect(firstMail.text).toContain("org-setup-1");
    expect(secondMail.text).toContain("org-setup-2");
    expect(secondMail.text).not.toContain("org-setup-1");
    expect(mocks.membership).toMatchObject({
      status: "invited",
      inviteSetupTokenHash: "org-setup-hash-2",
      inviteDeliveryStatus: "delivered",
    });
  });

  it("does not let a late result for an older setup token mark the newer link delivered", async () => {
    mocks.existingUser!.emailVerified = false;
    mocks.sendMail.mockImplementationOnce(async () => {
      mocks.currentSetupToken = {
        rawToken: "org-setup-2",
        tokenHash: "org-setup-hash-2",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      };
      Object.assign(mocks.membership!, {
        inviteSetupTokenHash: "org-setup-hash-2",
        inviteSetupTokenExpiresAt: new Date("2030-01-01T00:00:00.000Z"),
      });
      return delivered;
    });

    const response = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });

    expect(response.status).toBe(502);
    expect(mocks.membership).toMatchObject({
      status: "invited",
      inviteSetupTokenHash: "org-setup-hash-2",
      inviteDeliveryStatus: "pending",
    });
    expect(mocks.recordOrgInviteSetupDelivery).toHaveBeenCalledTimes(1);
  });

  it("allows only one parallel retry to rotate and dispatch an invited setup link", async () => {
    mocks.existingUser!.emailVerified = false;
    mocks.sendMail.mockResolvedValueOnce(transientFailure);
    const initial = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });
    expect(initial.status).toBe(502);

    let resolveRetry!: (value: typeof delivered) => void;
    mocks.sendMail.mockImplementationOnce(
      () =>
        new Promise<typeof delivered>((resolve) => {
          resolveRetry = resolve;
        }),
    );
    const retryPromise = POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });
    await vi.waitFor(() =>
      expect(mocks.membership?.inviteDeliveryClaimId).toEqual(expect.any(String)),
    );

    const parallel = await POST(inviteRequest(), {
      params: Promise.resolve({ orgId: mocks.orgId }),
    });
    expect(parallel.status).toBe(409);
    expect(mocks.issueOrgInviteSetupToken).toHaveBeenCalledTimes(2);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);

    resolveRetry(delivered);
    const retry = await retryPromise;
    expect(retry.status).toBe(200);
    expect(mocks.membership).toMatchObject({
      inviteSetupTokenHash: "org-setup-hash-2",
      inviteDeliveryStatus: "delivered",
    });
  });
});
