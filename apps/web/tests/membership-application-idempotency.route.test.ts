import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  userId: "66b0bca9f1b1444b8f635401",
  applications: [] as Array<Record<string, any>>,
  invites: [] as Array<Record<string, any>>,
  paymentProfile: null as Record<string, any> | null,
  paymentProfileUpserts: 0,
  userUpdates: 0,
  inviteTokenCounter: 0,
  crashAfterStage: null as string | null,
  crashTriggered: false,
  sendMail: vi.fn(),
}));

function setPath(target: Record<string, any>, path: string, value: unknown) {
  const parts = path.split(".");
  let current = target;
  for (const part of parts.slice(0, -1)) {
    current[part] ??= {};
    current = current[part];
  }
  current[parts.at(-1)!] = value;
}

function applyUpdate(target: Record<string, any>, update: Record<string, any>) {
  for (const [path, value] of Object.entries(update.$set ?? {})) {
    setPath(target, path, value);
  }
}

function findApplication(query: Record<string, any>) {
  if (query.openApplicationKey) {
    return (
      mocks.applications.find(
        (doc) => doc.openApplicationKey === query.openApplicationKey,
      ) ?? null
    );
  }
  if (query._id) {
    return (
      mocks.applications.find((doc) => String(doc._id) === String(query._id)) ??
      null
    );
  }
  return null;
}

const applicationCollection = {
  createIndex: vi.fn(async () => "membership_open_application_unique"),
  findOne: vi.fn(async (query: Record<string, any>) => findApplication(query)),
  insertOne: vi.fn(async (doc: Record<string, any>) => {
    if (
      mocks.applications.some(
        (existing) =>
          existing.openApplicationKey === doc.openApplicationKey,
      )
    ) {
      throw Object.assign(new Error("duplicate"), { code: 11000 });
    }
    mocks.applications.push(doc);
    return { insertedId: doc._id };
  }),
  findOneAndUpdate: vi.fn(
    async (query: Record<string, any>, update: Record<string, any>) => {
      const doc = findApplication(query);
      if (!doc) return null;
      if (
        query.deliveryClaimId &&
        query.deliveryClaimId !== doc.deliveryClaimId
      ) {
        return null;
      }
      if (
        query.$or &&
        doc.deliveryClaimId &&
        !query.deliveryClaimId
      ) {
        return null;
      }
      if (
        typeof query.initializationStage === "string" &&
        query.initializationStage !== doc.initializationStage
      ) {
        return null;
      }
      if (
        query.initializationStage?.$exists === false &&
        doc.initializationStage !== undefined
      ) {
        return null;
      }
      applyUpdate(doc, update);
      if (
        mocks.crashAfterStage &&
        update.$set?.initializationStage === mocks.crashAfterStage &&
        !mocks.crashTriggered
      ) {
        mocks.crashTriggered = true;
        throw new Error(`simulated_crash_after:${mocks.crashAfterStage}`);
      }
      return doc;
    },
  ),
  updateOne: vi.fn(
    async (query: Record<string, any>, update: Record<string, any>) => {
      const doc = findApplication(query);
      if (!doc) return { modifiedCount: 0 };
      if (
        query.deliveryClaimId &&
        query.deliveryClaimId !== doc.deliveryClaimId
      ) {
        return { modifiedCount: 0 };
      }
      applyUpdate(doc, update);
      return { modifiedCount: 1 };
    },
  ),
};

const userDoc = {
  email: "payer@company.de",
  name: "Payer",
  emailVerified: true,
  membership: { status: "none" },
  profile: {},
  settings: { preferredLocale: "de" },
};

const usersCollection = {
  findOne: vi.fn(async () => userDoc),
  updateOne: vi.fn(async (_query: unknown, update: Record<string, any>) => {
    mocks.userUpdates += 1;
    applyUpdate(userDoc, update);
    return { modifiedCount: 1 };
  }),
};

const inviteCollection = {
  createIndex: vi.fn(async () => "household_invite_recipient_unique"),
  find: vi.fn((query: Record<string, any>) => ({
    toArray: async () =>
      mocks.invites.filter(
        (invite) => String(invite.membershipId) === String(query.membershipId),
      ),
  })),
  insertOne: vi.fn(async (doc: Record<string, any>) => {
    if (
      mocks.invites.some(
        (invite) =>
          String(invite.membershipId) === String(doc.membershipId) &&
          invite.targetEmail === doc.targetEmail,
      )
    ) {
      throw Object.assign(new Error("duplicate"), { code: 11000 });
    }
    mocks.invites.push(doc);
    return { insertedId: doc._id };
  }),
  updateOne: vi.fn(
    async (query: Record<string, any>, update: Record<string, any>) => {
      const invite = mocks.invites.find(
        (doc) => String(doc._id) === String(query._id),
      );
      if (!invite) return { modifiedCount: 0 };
      applyUpdate(invite, update);
      return { modifiedCount: 1 };
    },
  ),
};

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    ObjectId,
    coreCol: vi.fn(async (name: string) =>
      name === "users" ? usersCollection : applicationCollection,
    ),
    piiCol: vi.fn(async () => inviteCollection),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "u_id" ? { value: mocks.userId } : undefined,
  })),
}));

vi.mock("@core/db/pii/userPaymentProfiles", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    ensureMembershipApplicationPaymentProfile: vi.fn(
      async (_userId: unknown, input: Record<string, any>) => {
        if (!mocks.paymentProfile) {
          mocks.paymentProfileUpserts += 1;
          mocks.paymentProfile = {
            _id: new ObjectId("66b0bca9f1b1444b8f635402"),
            billingName: input.billingName,
            ibanMasked: "DE89 **** 3000",
            microTransferCode: input.microTransferCode,
            microTransferExpiresAt: input.microTransferExpiresAt,
          };
        }
        return mocks.paymentProfile;
      },
    ),
    linkMembershipPaymentProfileToApplication: vi.fn(
      async (input: Record<string, any>) => {
        if (!mocks.paymentProfile) return null;
        mocks.paymentProfile.membershipApplicationId =
          input.membershipApplicationId;
        return mocks.paymentProfile;
      },
    ),
    getMembershipPaymentWorkflowProfile: vi.fn(
      async (_userId: unknown, membershipApplicationId?: unknown) => {
        if (
          membershipApplicationId &&
          String(mocks.paymentProfile?.membershipApplicationId) !==
            String(membershipApplicationId)
        ) {
          return null;
        }
        return mocks.paymentProfile;
      },
    ),
  };
});

vi.mock("@core/utils/random", () => ({
  safeRandomId: () => {
    mocks.inviteTokenCounter += 1;
    return `household-token-${mocks.inviteTokenCounter}`;
  },
}));

vi.mock("@/lib/security/rate-limit", () => ({
  incrementRateLimit: vi.fn(async () => 1),
}));

vi.mock("@/lib/security/human-token", () => ({
  verifyHumanTokenDetailed: vi.fn(async () => ({
    ok: true,
    payload: { formId: "membership-apply" },
  })),
}));

vi.mock("@/lib/env/payment", () => ({
  getPaymentEnv: () => ({
    referencePrefix: "EDB-",
    recipient: "eDebatte",
    iban: "DE89370400440532013000",
    bic: "COBADEFFXXX",
    bankName: "Testbank",
    accountMode: "private_preUG",
    membershipContactEmail: "members@edebatte.org",
  }),
}));

vi.mock("@core/geo/region", () => ({
  resolveRegionInfo: vi.fn(async () => null),
}));

vi.mock("@/utils/publicOrigin", () => ({
  publicOrigin: () => "https://edebatte.org",
}));

vi.mock("@core/telemetry/identityEvents", () => ({
  logMembershipApplySubmitted: vi.fn(async () => {}),
  logHouseholdInviteSent: vi.fn(async () => {}),
  logIdentityEvent: vi.fn(async () => {}),
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

import { POST } from "@/app/api/memberships/apply/route";

const delivered = {
  ok: true,
  status: "delivered",
  transport: "smtp",
  category: null,
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 1,
  failedCount: 0,
  messageId: "message",
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

const permanentFailure = {
  ok: false,
  status: "failed",
  transport: "smtp",
  code: "mail_transport_error",
  category: "smtp_response_error",
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 0,
  failedCount: 1,
  messageId: null,
};

function applyRequest(
  householdMembers: Array<Record<string, unknown>> = [
    {
      givenName: "Payer",
      familyName: "Person",
      email: "payer@company.de",
      role: "primary",
    },
  ],
) {
  return new NextRequest("http://localhost/api/memberships/apply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      amountPerPeriod: 10,
      rhythm: "monthly",
      householdSize: householdMembers.length,
      members: householdMembers,
      payment: {
        type: "bank_transfer",
        billingName: "Payer Person",
        street: "Teststraße 1",
        postalCode: "10115",
        city: "Berlin",
        country: "Deutschland",
        iban: "DE89370400440532013000",
      },
      legalTransparencyAccepted: true,
      legalStatuteAccepted: true,
      humanToken: "human-token-valid",
    }),
  });
}

describe("membership application idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.applications.length = 0;
    mocks.invites.length = 0;
    mocks.paymentProfile = null;
    mocks.paymentProfileUpserts = 0;
    mocks.userUpdates = 0;
    mocks.inviteTokenCounter = 0;
    mocks.crashAfterStage = null;
    mocks.crashTriggered = false;
    userDoc.membership = { status: "none" };
    mocks.sendMail.mockResolvedValue(delivered);
  });

  it("reuses membership, payment reference and microtransfer code after payer mail failure", async () => {
    mocks.sendMail
      .mockResolvedValueOnce(transientFailure)
      .mockResolvedValue(delivered);

    const first = await POST(applyRequest());
    const firstBody = await first.json();
    const membershipId = firstBody.membershipId;
    const reference = mocks.applications[0]?.paymentReference;
    const microTransferCode = mocks.paymentProfile?.microTransferCode;

    expect(first.status).toBe(502);
    expect(membershipId).toEqual(expect.any(String));
    expect(mocks.paymentProfileUpserts).toBe(1);

    const second = await POST(applyRequest());
    const secondBody = await second.json();

    expect(second.status).toBe(200);
    expect(secondBody.data.membershipId).toBe(membershipId);
    expect(mocks.applications).toHaveLength(1);
    expect(mocks.applications[0]?.paymentReference).toBe(reference);
    expect(mocks.paymentProfile?.microTransferCode).toBe(microTransferCode);
    expect(mocks.paymentProfileUpserts).toBe(1);
    const adminMailCall = mocks.sendMail.mock.calls.find(
      ([options]) => options.tag === "membership_application_admin",
    );
    expect(adminMailCall?.[0]?.mail.text).toContain(microTransferCode);
  });

  it("retries only the failed household recipient and reuses both invite tokens", async () => {
    const members = [
      {
        givenName: "Payer",
        familyName: "Person",
        email: "payer@company.de",
        role: "primary",
      },
      {
        givenName: "Delivered",
        familyName: "Member",
        email: "delivered@company.de",
        role: "adult",
      },
      {
        givenName: "Retry",
        familyName: "Member",
        email: "retry@company.de",
        role: "adult",
      },
    ];
    mocks.sendMail.mockImplementation(async (options: Record<string, any>) => {
      if (
        options.tag === "household_invite" &&
        options.to === "retry@company.de" &&
        !mocks.invites.find(
          (invite) =>
            invite.targetEmail === "retry@company.de" &&
            invite.deliveryStatus === "failed",
        )
      ) {
        return transientFailure;
      }
      return delivered;
    });

    const first = await POST(applyRequest(members));
    expect(first.status).toBe(502);
    await expect(first.json()).resolves.toMatchObject({
      delivery: {
        status: "partial",
        retryable: true,
        deliveredCount: 1,
        failedCount: 1,
      },
    });
    const originalTokens = mocks.invites.map((invite) => invite.token);
    expect(mocks.invites).toHaveLength(2);
    expect(mocks.invites.find((invite) => invite.targetEmail === "delivered@company.de"))
      .toMatchObject({ deliveryStatus: "delivered" });
    expect(mocks.invites.find((invite) => invite.targetEmail === "retry@company.de"))
      .toMatchObject({ deliveryStatus: "failed", deliveryRetryable: true });

    mocks.sendMail.mockClear();
    mocks.sendMail.mockResolvedValue(delivered);
    const second = await POST(applyRequest(members));

    expect(second.status).toBe(200);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail.mock.calls[0]?.[0]).toMatchObject({
      tag: "household_invite",
      to: "retry@company.de",
    });
    expect(mocks.invites.map((invite) => invite.token)).toEqual(originalTokens);
    expect(mocks.inviteTokenCounter).toBe(2);
  });

  it("allows only one parallel application and one payer delivery claim", async () => {
    let resolvePayer!: (value: typeof delivered) => void;
    mocks.sendMail.mockImplementation((options: Record<string, any>) => {
      if (options.tag === "membership_application_confirmation") {
        return new Promise<typeof delivered>((resolve) => {
          resolvePayer = resolve;
        });
      }
      return Promise.resolve(delivered);
    });

    const firstPromise = POST(applyRequest());
    await vi.waitFor(() => expect(mocks.applications).toHaveLength(1));
    const second = await POST(applyRequest());

    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      error: "application_delivery_in_progress",
      membershipId: String(mocks.applications[0]?._id),
    });
    expect(mocks.applications).toHaveLength(1);
    expect(mocks.paymentProfileUpserts).toBe(1);

    resolvePayer(delivered);
    const first = await firstPromise;
    expect(first.status).toBe(201);
    expect(
      mocks.sendMail.mock.calls.filter(
        ([options]) => options.tag === "membership_application_confirmation",
      ),
    ).toHaveLength(1);
  });

  it("does not automatically retry a permanent household delivery failure", async () => {
    const members = [
      {
        givenName: "Payer",
        familyName: "Person",
        email: "payer@company.de",
        role: "primary",
      },
      {
        givenName: "Manual",
        familyName: "Recovery",
        email: "manual@company.de",
        role: "adult",
      },
    ];
    mocks.sendMail.mockImplementation(async (options: Record<string, any>) =>
      options.tag === "household_invite" ? permanentFailure : delivered,
    );

    const first = await POST(applyRequest(members));
    expect(first.status).toBe(409);
    await expect(first.json()).resolves.toMatchObject({
      error: "household_invite_manual_recovery_required",
      delivery: { retryable: false },
    });

    mocks.sendMail.mockClear();
    const second = await POST(applyRequest(members));

    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      error: "household_invite_manual_recovery_required",
    });
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.inviteTokenCounter).toBe(1);
  });

  it.each([
    "payment_profile_link",
    "application_link",
    "user_membership_projection",
    "delivery_initialization",
    "complete",
  ])(
    "recovers the persisted initialization state after a crash at %s",
    async (stage) => {
      const members = [
        {
          givenName: "Payer",
          familyName: "Person",
          email: "payer@company.de",
          role: "primary",
        },
        {
          givenName: "Household",
          familyName: "Member",
          email: "household@company.de",
          role: "adult",
        },
      ];
      mocks.crashAfterStage = stage;

      await expect(POST(applyRequest(members))).rejects.toThrow(
        `simulated_crash_after:${stage}`,
      );
      const application = mocks.applications[0]!;
      const originalCode = mocks.paymentProfile?.microTransferCode;
      expect(application.initializationStage).toBe(stage);
      expect(mocks.applications).toHaveLength(1);

      application.deliveryClaimId = null;
      application.deliveryClaimedAt = null;
      mocks.crashAfterStage = null;

      const recovered = await POST(applyRequest(members));

      expect(recovered.status).toBe(200);
      expect(application).toMatchObject({
        initializationStage: "complete",
        workflowStatus: "complete",
        paymentProfileId: mocks.paymentProfile?._id,
      });
      expect(mocks.paymentProfile).toMatchObject({
        membershipApplicationId: application._id,
        microTransferCode: originalCode,
      });
      expect(userDoc.membership.applicationId).toEqual(application._id);
      expect(mocks.paymentProfileUpserts).toBe(1);
      expect(mocks.applications).toHaveLength(1);
      expect(mocks.invites).toHaveLength(1);
      expect(mocks.inviteTokenCounter).toBe(1);
    },
  );
});
