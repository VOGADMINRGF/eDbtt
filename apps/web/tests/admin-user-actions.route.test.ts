import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "@core/db/triMongo";

const mocks = vi.hoisted(() => {
  const users = new Map<string, Record<string, any>>();
  const referenceCounts = new Map<string, number>();
  const mailActions = new Map<string, Record<string, any>>();

  function clone<T>(value: T): T {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function mergeUpdate(current: Record<string, any>, update: Record<string, any>) {
    return {
      ...current,
      ...(update?.$set ?? {}),
      ...(update?.$currentDate ? { updatedAt: new Date() } : {}),
    };
  }

  const usersCollection = {
    findOne: vi.fn(async (query: Record<string, any>) => {
      if (query?._id) return clone(users.get(String(query._id)) ?? null);
      return null;
    }),
    updateOne: vi.fn(async (query: Record<string, any>, update: Record<string, any>) => {
      const current = users.get(String(query?._id));
      if (!current) return { acknowledged: true, matchedCount: 0 };
      users.set(String(query._id), mergeUpdate(current, update));
      return { acknowledged: true, matchedCount: 1 };
    }),
    countDocuments: vi.fn(async () => 1),
  };

  const credentialsCollection = {
    findOne: vi.fn(async () => ({
      coreUserId: new ObjectId("507f1f77bcf86cd799439011"),
      passwordHash: "hashed-password",
      twoFactorEnabled: false,
      otpSecret: null,
    })),
    countDocuments: vi.fn(async () => 0),
  };

  const mailActionsCollection = {
    createIndex: vi.fn(async () => "action_id_unique"),
    findOne: vi.fn(async (query: Record<string, any>) => clone(mailActions.get(String(query?.actionId)) ?? null)),
    insertOne: vi.fn(async (doc: Record<string, any>) => {
      const key = String(doc.actionId);
      if (mailActions.has(key)) {
        const error = new Error("duplicate");
        (error as any).code = 11000;
        throw error;
      }
      mailActions.set(key, clone(doc));
      return { acknowledged: true, insertedId: `mail-${mailActions.size}` };
    }),
    updateOne: vi.fn(async (query: Record<string, any>, update: Record<string, any>) => {
      const key = String(query?.actionId);
      const current = mailActions.get(key);
      if (!current) return { acknowledged: true, matchedCount: 0 };
      mailActions.set(key, mergeUpdate(current, update));
      return { acknowledged: true, matchedCount: 1 };
    }),
  };

  const coreCol = vi.fn(async (name: string) => {
    if (name === "admin_user_mail_actions") return mailActionsCollection;
    return {
      countDocuments: vi.fn(async () => referenceCounts.get(name) ?? 0),
    };
  });

  const piiCol = vi.fn(async (name: string) => {
    if (name === "user_credentials") return credentialsCollection;
    return {
      countDocuments: vi.fn(async () => referenceCounts.get(name) ?? 0),
    };
  });

  const getDb = vi.fn(async () => ({ client: null }));

  return {
    users,
    referenceCounts,
    mailActions,
    usersCollection,
    credentialsCollection,
    mailActionsCollection,
    coreCol,
    piiCol,
    getDb,
    getCol: vi.fn(async () => usersCollection),
    requireAdminOrResponse: vi.fn(),
    userIsSuperadmin: vi.fn(),
    createEmailVerificationToken: vi.fn(async () => ({ rawToken: "verify-token" })),
    logIdentityEvent: vi.fn(async () => {}),
    buildVerificationMail: vi.fn(() => ({ subject: "verify", html: "<p>verify</p>", text: "verify" })),
    buildSetPasswordMail: vi.fn(() => ({ subject: "reset", html: "<p>reset</p>", text: "reset" })),
    sendMail: vi.fn(async () => ({ ok: true, transport: "smtp", messageId: "msg-1" })),
    publicOrigin: vi.fn(() => "https://edebatte.test"),
    createToken: vi.fn(async () => "reset-token"),
    resetEmailLink: vi.fn(() => "https://edebatte.test/reset?token=reset-token"),
    recordAuditEvent: vi.fn(async () => {}),
    reset() {
      users.clear();
      referenceCounts.clear();
      mailActions.clear();
      vi.clearAllMocks();
      credentialsCollection.findOne.mockResolvedValue({
        coreUserId: new ObjectId("507f1f77bcf86cd799439011"),
        passwordHash: "hashed-password",
        twoFactorEnabled: false,
        otpSecret: null,
      });
      credentialsCollection.countDocuments.mockResolvedValue(0);
      usersCollection.countDocuments.mockResolvedValue(1);
      getDb.mockResolvedValue({ client: null });
      this.sendMail.mockResolvedValue({ ok: true, transport: "smtp", messageId: "msg-1" });
      this.createEmailVerificationToken.mockResolvedValue({ rawToken: "verify-token" });
      this.createToken.mockResolvedValue("reset-token");
      this.recordAuditEvent.mockResolvedValue(undefined);
    },
    seedUser(doc: Record<string, any>) {
      users.set(String(doc._id), clone(doc));
    },
  };
});

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
  userIsSuperadmin: (...args: unknown[]) => mocks.userIsSuperadmin(...args),
}));

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<any>("@core/db/triMongo");
  return {
    ...actual,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
    getDb: (...args: unknown[]) => mocks.getDb(...args),
  };
});

vi.mock("@core/db/db/triMongo", () => ({
  coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  piiCol: (...args: unknown[]) => mocks.piiCol(...args),
}));

vi.mock("@core/auth/emailVerificationService", () => ({
  createEmailVerificationToken: (...args: unknown[]) => mocks.createEmailVerificationToken(...args),
}));

vi.mock("@core/telemetry/identityEvents", () => ({
  logIdentityEvent: (...args: unknown[]) => mocks.logIdentityEvent(...args),
}));

vi.mock("@/utils/emailTemplates", () => ({
  buildVerificationMail: (...args: unknown[]) => mocks.buildVerificationMail(...args),
  buildSetPasswordMail: (...args: unknown[]) => mocks.buildSetPasswordMail(...args),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

vi.mock("@/utils/publicOrigin", () => ({
  publicOrigin: (...args: unknown[]) => mocks.publicOrigin(...args),
}));

vi.mock("@/utils/tokens", () => ({
  createToken: (...args: unknown[]) => mocks.createToken(...args),
}));

vi.mock("@/utils/email", () => ({
  resetEmailLink: (...args: unknown[]) => mocks.resetEmailLink(...args),
}));

vi.mock("@/app/api/auth/sharedAuth", () => ({
  CREDENTIAL_COLLECTION: "user_credentials",
}));

vi.mock("@features/audit/recordAuditEvent", () => ({
  recordAuditEvent: (...args: unknown[]) => mocks.recordAuditEvent(...args),
}));

import { POST } from "@/app/api/admin/dashboard/users/[userId]/actions/route";

function actionReq(userId: string, body: Record<string, unknown>) {
  return POST(
    new NextRequest(`http://localhost/api/admin/dashboard/users/${userId}/actions`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ userId }) },
  );
}

describe("admin user lifecycle actions route", () => {
  beforeEach(() => {
    mocks.reset();
    mocks.requireAdminOrResponse.mockResolvedValue({
      _id: new ObjectId("507f1f77bcf86cd799439001"),
      email: "admin@edebatte.org",
      roles: ["admin"],
      role: "admin",
    });
    mocks.userIsSuperadmin.mockReturnValue(false);
  });

  it("queues a verification mail exactly once and keeps response/audit free of raw links", async () => {
    const userId = "507f1f77bcf86cd799439011";
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "member@edebatte.org",
      name: "Member",
      roles: ["user"],
      verifiedEmail: false,
      suspended: false,
    });

    const res = await actionReq(userId, { action: "resend_verification", actionId: "verify-1" });

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload).toMatchObject({ ok: true, verificationMailQueued: true, actionId: "verify-1" });
    expect(JSON.stringify(payload)).not.toContain("verify-token");
    expect(JSON.stringify(payload)).not.toContain("/register/verify-email");
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mocks.recordAuditEvent.mock.calls)).not.toContain("verify-token");
    expect(JSON.stringify(mocks.recordAuditEvent.mock.calls)).not.toContain("/register/verify-email");
  });

  it("deduplicates a repeated verification actionId and does not send a second mail", async () => {
    const userId = "507f1f77bcf86cd799439012";
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "member@edebatte.org",
      name: "Member",
      roles: ["user"],
      verifiedEmail: false,
      suspended: false,
    });

    const first = await actionReq(userId, { action: "resend_verification", actionId: "same-action" });
    const second = await actionReq(userId, { action: "resend_verification", actionId: "same-action" });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({
      ok: true,
      verificationMailQueued: true,
      actionId: "same-action",
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.createEmailVerificationToken).toHaveBeenCalledTimes(1);
  });

  it("fails closed on SMTP errors without exposing raw reset material", async () => {
    const userId = "507f1f77bcf86cd799439013";
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "member@edebatte.org",
      name: "Member",
      roles: ["user"],
      verifiedEmail: true,
      suspended: false,
    });
    mocks.sendMail.mockResolvedValue({
      ok: false,
      transport: "smtp",
      code: "mail_transport_error",
      retryable: true,
      messageId: null,
    });

    const res = await actionReq(userId, { action: "send_password_link", actionId: "reset-1" });

    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload).toMatchObject({ ok: false, error: "mail_delivery_failed", actionId: "reset-1" });
    expect(JSON.stringify(payload)).not.toContain("reset-token");
    expect(JSON.stringify(payload)).not.toContain("/reset?token=");
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("blocks self-deactivation", async () => {
    const userId = "507f1f77bcf86cd799439001";
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "admin@edebatte.org",
      roles: ["admin"],
      suspended: false,
    });

    const res = await actionReq(userId, { action: "disable_account" });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "self_disable_forbidden" });
  });

  it("protects the last admin from being disabled", async () => {
    const userId = "507f1f77bcf86cd799439021";
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "only-admin@edebatte.org",
      roles: ["admin"],
      suspended: false,
    });
    mocks.usersCollection.countDocuments.mockResolvedValue(0);

    const res = await actionReq(userId, { action: "disable_account" });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "last_admin_required" });
    expect(mocks.usersCollection.updateOne).not.toHaveBeenCalled();
  });

  it("protects the last active superadmin from disable", async () => {
    const userId = "507f1f77bcf86cd799439022";
    mocks.userIsSuperadmin.mockReturnValue(true);
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "root@edebatte.org",
      roles: ["superadmin"],
      role: "superadmin",
      suspended: false,
    });
    mocks.usersCollection.countDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const res = await actionReq(userId, { action: "disable_account" });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "last_superadmin_required" });
    expect(mocks.usersCollection.updateOne).not.toHaveBeenCalled();
  });

  it("revokes active sessions on disable and keeps revocation on reactivate", async () => {
    const userId = "507f1f77bcf86cd799439023";
    const oid = new ObjectId(userId);
    mocks.seedUser({
      _id: oid,
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: false,
      suspendedAt: null,
      disabledAt: null,
      sessionRevokedAt: null,
    });

    const disabled = await actionReq(userId, { action: "disable_account" });
    expect(disabled.status).toBe(200);
    const disabledDoc = mocks.users.get(String(oid));
    expect(disabledDoc?.suspended).toBe(true);
    expect(disabledDoc?.sessionRevokedAt).toBeTruthy();

    const revokedAt = disabledDoc?.sessionRevokedAt;
    const reactivated = await actionReq(userId, { action: "reactivate_account" });
    expect(reactivated.status).toBe(200);
    const reactivatedDoc = mocks.users.get(String(oid));
    expect(reactivatedDoc?.suspended).toBe(false);
    expect(reactivatedDoc?.sessionRevokedAt).toEqual(revokedAt);
  });

  it("surfaces an explicit partial result when audit fails after a non-transactional disable", async () => {
    const userId = "507f1f77bcf86cd799439024";
    const oid = new ObjectId(userId);
    mocks.seedUser({
      _id: oid,
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: false,
      suspendedAt: null,
      disabledAt: null,
      sessionRevokedAt: null,
    });
    mocks.recordAuditEvent.mockRejectedValueOnce(new Error("audit write failed"));

    const res = await actionReq(userId, { action: "disable_account" });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "account_disabled_audit_failed",
      partial: true,
      accountDisabled: true,
      auditRecorded: false,
    });
    expect(mocks.users.get(String(oid))?.suspended).toBe(true);
  });

  it("prevents non-superadmins from changing superadmin accounts", async () => {
    const userId = "507f1f77bcf86cd799439031";
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "superadmin@edebatte.org",
      roles: ["superadmin"],
      suspended: false,
    });

    const res = await actionReq(userId, { action: "send_password_link" });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "forbidden_superadmin" });
  });

  it("blocks hard delete when the account is not explicitly marked as QA/test", async () => {
    const userId = "507f1f77bcf86cd799439041";
    mocks.userIsSuperadmin.mockReturnValue(true);
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: false,
      isQaAccount: false,
    });

    const res = await actionReq(userId, {
      action: "hard_delete_qa",
      confirmEmail: "member@edebatte.org",
    });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "hard_delete_requires_qa_account" });
  });

  it("blocks hard delete when known user references exist", async () => {
    const userId = "507f1f77bcf86cd799439051";
    mocks.userIsSuperadmin.mockReturnValue(true);
    mocks.seedUser({
      _id: new ObjectId(userId),
      email: "qa-user@edebatte.org",
      roles: ["user"],
      suspended: false,
      accountPurpose: "qa",
      isQaAccount: true,
    });
    mocks.referenceCounts.set("drafts", 2);

    const res = await actionReq(userId, {
      action: "hard_delete_qa",
      confirmEmail: "qa-user@edebatte.org",
    });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "account_has_references",
      referenceCollections: expect.arrayContaining(["drafts"]),
    });
  });
});
