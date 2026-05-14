import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  userIsSuperadmin: vi.fn(),
  getCol: vi.fn(),
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

describe("admin dashboard users route", () => {
  const adminUser = {
    _id: "admin-1",
    email: "admin@example.org",
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
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };

    mocks.getCol.mockResolvedValue(usersCollection);
    mocks.piiCol.mockResolvedValue(credentialsCollection);
    mocks.hashPassword.mockResolvedValue("hashed-pw");
    mocks.createEmailVerificationToken.mockResolvedValue({ rawToken: "verify-token" });
    mocks.buildVerificationMail.mockReturnValue({ subject: "verify", html: "<p>verify</p>", text: "verify" });
    mocks.buildSetPasswordMail.mockReturnValue({ subject: "reset", html: "<p>reset</p>", text: "reset" });
    mocks.sendMail.mockResolvedValue(undefined);
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

  it("blocks removing the last admin access", async () => {
    const userId = "507f1f77bcf86cd799439012";
    usersCollection.findOne.mockResolvedValue({ _id: new ObjectId(userId), roles: ["admin"], role: "admin" });
    usersCollection.countDocuments.mockResolvedValue(1);

    const res = await PATCH(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          roles: ["user"],
        }),
      }),
    );

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "last_admin_required" });
    expect(usersCollection.updateOne).not.toHaveBeenCalled();
  });

  it("rejects invalid managed roles on create", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/dashboard/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "new@example.org",
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
          email: "new@example.org",
          name: "Neue Person",
          sendPasswordLink: true,
          sendVerification: true,
          roles: ["user", "moderator"],
          accessTier: "citizenBasic",
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verifyUrl: expect.stringContaining("/register/verify-email"),
      resetUrl: "https://edebatte.test/reset?token=reset-token",
    });
    expect(usersCollection.insertOne).toHaveBeenCalled();
    expect(credentialsCollection.updateOne).toHaveBeenCalled();
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
  });
});
