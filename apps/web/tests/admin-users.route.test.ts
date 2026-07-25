import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  userIsSuperadmin: vi.fn(),
  getCol: vi.fn(),
  getDb: vi.fn(),
  piiCol: vi.fn(),
  hashPassword: vi.fn(),
  createEmailVerificationToken: vi.fn(),
  buildVerificationMail: vi.fn(),
  buildSetPasswordMail: vi.fn(),
  sendMail: vi.fn(),
  publicOrigin: vi.fn(),
  logIdentityEvent: vi.fn(),
  ensureBasicPiiProfile: vi.fn(),
  createToken: vi.fn(),
  resetEmailLink: vi.fn(),
}));

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
  piiCol: (...args: unknown[]) => mocks.piiCol(...args),
}));

vi.mock("@/app/api/auth/sharedAuth", () => ({
  CREDENTIAL_COLLECTION: "user_credentials",
}));

vi.mock("@/utils/password", () => ({
  hashPassword: (...args: unknown[]) => mocks.hashPassword(...args),
}));

vi.mock("@core/auth/emailVerificationService", () => ({
  createEmailVerificationToken: (...args: unknown[]) => mocks.createEmailVerificationToken(...args),
}));

vi.mock("@/utils/emailTemplates", () => ({
  buildSetPasswordMail: (...args: unknown[]) => mocks.buildSetPasswordMail(...args),
  buildVerificationMail: (...args: unknown[]) => mocks.buildVerificationMail(...args),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

vi.mock("@/utils/publicOrigin", () => ({
  publicOrigin: (...args: unknown[]) => mocks.publicOrigin(...args),
}));

vi.mock("@core/telemetry/identityEvents", () => ({
  logIdentityEvent: (...args: unknown[]) => mocks.logIdentityEvent(...args),
}));

vi.mock("@core/pii/userProfileService", () => ({
  ensureBasicPiiProfile: (...args: unknown[]) => mocks.ensureBasicPiiProfile(...args),
}));

vi.mock("@/utils/tokens", () => ({
  createToken: (...args: unknown[]) => mocks.createToken(...args),
}));

vi.mock("@/utils/email", () => ({
  resetEmailLink: (...args: unknown[]) => mocks.resetEmailLink(...args),
}));

import { GET, PATCH, POST } from "@/app/api/admin/dashboard/users/route";
import { ObjectId } from "@core/db/triMongo";

function patchReq(body: Record<string, unknown>) {
  return PATCH(
    new NextRequest("http://localhost/api/admin/dashboard/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("admin dashboard users route", () => {
  const adminUser = {
    _id: "admin-1",
    email: "admin@edebatte.test",
    roles: ["admin"],
    role: "admin",
  };

  let usersCollection: Record<string, any>;
  let credentialsCollection: Record<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue(adminUser);
    mocks.userIsSuperadmin.mockReturnValue(false);

    usersCollection = {
      countDocuments: vi.fn().mockResolvedValue(1),
      findOne: vi.fn(),
      find: vi.fn(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      })),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId("507f1f77bcf86cd799439011") }),
    };
    credentialsCollection = {
      findOne: vi.fn().mockResolvedValue(null),
      find: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue([]),
      })),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };

    mocks.getCol.mockResolvedValue(usersCollection);
    mocks.getDb.mockResolvedValue({ client: null });
    mocks.piiCol.mockResolvedValue(credentialsCollection);
    mocks.hashPassword.mockResolvedValue("hashed-pw");
    mocks.createEmailVerificationToken.mockResolvedValue({ rawToken: "verify-token" });
    mocks.buildVerificationMail.mockReturnValue({ subject: "verify", html: "<p>verify</p>", text: "verify" });
    mocks.buildSetPasswordMail.mockReturnValue({ subject: "reset", html: "<p>reset</p>", text: "reset" });
    mocks.sendMail.mockResolvedValue({ ok: true, transport: "smtp", messageId: "msg-1" });
    mocks.publicOrigin.mockReturnValue("https://edebatte.test");
    mocks.logIdentityEvent.mockResolvedValue(undefined);
    mocks.ensureBasicPiiProfile.mockResolvedValue(undefined);
    mocks.createToken.mockResolvedValue("reset-token");
    mocks.resetEmailLink.mockReturnValue("https://edebatte.test/reset?token=reset-token");
  });

  it("passes through admin guard failures", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const res = await GET(new NextRequest("http://localhost/api/admin/dashboard/users"));
    expect(res.status).toBe(403);
  });

  it("returns safe lifecycle booleans without leaking credential internals", async () => {
    usersCollection.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([
        {
          _id: new ObjectId("507f1f77bcf86cd799439099"),
          email: "qa-user@edebatte.org",
          name: "QA User",
          roles: ["user"],
          verifiedEmail: false,
          suspended: true,
          accountPurpose: "qa",
          createdAt: new Date("2026-07-01T08:00:00.000Z"),
          lastLoginAt: new Date("2026-07-20T09:30:00.000Z"),
        },
      ]),
    });
    credentialsCollection.find.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        {
          coreUserId: new ObjectId("507f1f77bcf86cd799439099"),
          passwordHash: "hashed-secret",
          twoFactorEnabled: true,
          otpSecret: "OTP-SECRET",
        },
      ]),
    });

    const res = await GET(new NextRequest("http://localhost/api/admin/dashboard/users"));

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload).toMatchObject({
      items: [
        expect.objectContaining({
          email: "qa-user@edebatte.org",
          emailVerified: false,
          credentialsPresent: true,
          twoFactorEnabled: true,
          accountDisabled: true,
          isQaAccount: true,
          lastLoginAt: "2026-07-20T09:30:00.000Z",
        }),
      ],
    });
    expect(JSON.stringify(payload)).not.toContain("hashed-secret");
    expect(JSON.stringify(payload)).not.toContain("OTP-SECRET");
  });

  it("blocks removing the last admin access", async () => {
    const userId = "507f1f77bcf86cd799439012";
    usersCollection.findOne.mockResolvedValue({ _id: new ObjectId(userId), roles: ["admin"], role: "admin" });
    usersCollection.countDocuments.mockResolvedValue(0);

    const res = await patchReq({ userId, roles: ["user"] });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "last_admin_required" });
    expect(usersCollection.updateOne).not.toHaveBeenCalled();
  });

  it("blocks downgrading the last active superadmin", async () => {
    const userId = "507f1f77bcf86cd799439013";
    mocks.userIsSuperadmin.mockReturnValue(true);
    usersCollection.findOne.mockResolvedValue({ _id: new ObjectId(userId), roles: ["superadmin"], role: "superadmin" });
    usersCollection.countDocuments.mockResolvedValue(0);

    const res = await patchReq({ userId, roles: ["admin"] });

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "last_superadmin_required" });
    expect(usersCollection.updateOne).not.toHaveBeenCalled();
  });

  it("allows downgrading one of two active superadmins", async () => {
    const userId = "507f1f77bcf86cd799439014";
    mocks.userIsSuperadmin.mockReturnValue(true);
    usersCollection.findOne
      .mockResolvedValueOnce({ _id: new ObjectId(userId), email: "sa@edebatte.test", roles: ["superadmin"], role: "superadmin" })
      .mockResolvedValueOnce({ _id: new ObjectId(userId), email: "sa@edebatte.test", roles: ["admin"], role: "admin" })
      .mockResolvedValueOnce({ _id: new ObjectId(userId), email: "sa@edebatte.test", roles: ["admin"], role: "admin" });
    usersCollection.countDocuments.mockResolvedValue(1);

    const res = await patchReq({ userId, roles: ["admin"] });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      user: expect.objectContaining({ roles: ["admin"] }),
    });
    expect(usersCollection.updateOne).toHaveBeenCalledTimes(1);
  });

  it("blocks a manipulated patch from a non-superadmin against a superadmin target", async () => {
    const userId = "507f1f77bcf86cd799439015";
    usersCollection.findOne.mockResolvedValue({ _id: new ObjectId(userId), roles: ["superadmin"], role: "superadmin" });

    const res = await patchReq({ userId, roles: ["admin"] });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "forbidden_superadmin" });
    expect(usersCollection.updateOne).not.toHaveBeenCalled();
  });

  it("rejects invalid managed roles on create", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "new@edebatte.test",
          name: "Neue Person",
          sendPasswordLink: true,
          roles: ["not-a-role"],
        }),
      }),
    );

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_roles" });
  });

  it("creates a user and sends verification/reset mail links", async () => {
    usersCollection.findOne.mockResolvedValue(null);
    usersCollection.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    });

    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "new@edebatte.test",
          name: "Neue Person",
          sendPasswordLink: true,
          sendVerification: true,
          roles: ["user", "moderator"],
          accessTier: "citizenBasic",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload).toMatchObject({
      ok: true,
      verificationMailQueued: true,
      passwordMailQueued: true,
    });
    expect(payload.verifyUrl).toBeUndefined();
    expect(payload.resetUrl).toBeUndefined();
    expect(usersCollection.insertOne).toHaveBeenCalled();
    expect(credentialsCollection.updateOne).toHaveBeenCalled();
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
  });

  it("accepts sendPasswordLink=true when password is an empty string", async () => {
    usersCollection.findOne.mockResolvedValue(null);

    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "blank-password@edebatte.test",
          name: "Blank Password",
          password: "",
          sendPasswordLink: true,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      passwordMailQueued: true,
    });
  });

  it("accepts sendPasswordLink=true when password is omitted", async () => {
    usersCollection.findOne.mockResolvedValue(null);

    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "missing-password@edebatte.test",
          name: "Missing Password",
          sendPasswordLink: true,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      passwordMailQueued: true,
    });
  });

  it("returns missing_password when sendPasswordLink=false and password is empty", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "empty-password@edebatte.test",
          name: "Empty Password",
          password: "",
          sendPasswordLink: false,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "missing_password" });
  });

  it("returns missing_password when sendPasswordLink=false and password is omitted", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "no-password@edebatte.test",
          name: "No Password",
          sendPasswordLink: false,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "missing_password" });
  });

  it("returns weak_password for an explicit weak password", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "weak-password@edebatte.test",
          name: "Weak Password",
          password: "short",
          sendPasswordLink: false,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "weak_password" });
  });

  it("accepts a strong explicit password without sendPasswordLink", async () => {
    usersCollection.findOne.mockResolvedValue(null);

    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "strong-password@edebatte.test",
          name: "Strong Password",
          password: "VeryStrong!123",
          sendPasswordLink: false,
          sendVerification: false,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verificationMailQueued: false,
      passwordMailQueued: false,
    });
  });

  it("returns a partial failure when user creation succeeds but verification mail delivery fails", async () => {
    usersCollection.findOne.mockResolvedValue(null);
    mocks.sendMail.mockResolvedValueOnce({
      ok: false,
      transport: "none",
      code: "mail_transport_unavailable",
      retryable: true,
      messageId: null,
    });

    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "partial-mail@edebatte.test",
          name: "Partial Mail",
          password: "VeryStrong!123",
          sendPasswordLink: false,
          sendVerification: true,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "mail_delivery_unavailable",
      partial: true,
      userCreated: true,
      verificationMailQueued: false,
      passwordMailQueued: false,
    });
  });
});
