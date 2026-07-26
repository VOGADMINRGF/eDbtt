import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const users = new Map<string, Record<string, any>>();
  let sessionPayload: Record<string, any> | null = null;

  return {
    users,
    setSessionPayload(payload: Record<string, any> | null) {
      sessionPayload = payload;
    },
    getCol: vi.fn(async () => ({
      findOne: vi.fn(async (query: Record<string, any>) => users.get(String(query?._id)) ?? null),
    })),
    verifySessionToken: vi.fn(() => sessionPayload),
    readSession: vi.fn(async () => sessionPayload),
    reset() {
      users.clear();
      sessionPayload = null;
      vi.clearAllMocks();
    },
    seedUser(doc: Record<string, any>) {
      users.set(String(doc._id), { ...doc });
    },
  };
});

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<any>("@core/db/triMongo");
  return {
    ...actual,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

vi.mock("@/utils/session", () => ({
  verifySessionToken: (...args: unknown[]) => mocks.verifySessionToken(...args),
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

import { ObjectId } from "@core/db/triMongo";
import { getSessionUser } from "@/lib/server/auth/sessionUser";

function sessionReq(token = "valid") {
  return new NextRequest("http://localhost/admin", {
    headers: { cookie: `session_token=${token}; u_id=507f1f77bcf86cd799439011` },
  });
}

describe("session user security", () => {
  const userId = new ObjectId("507f1f77bcf86cd799439011");

  beforeEach(() => {
    mocks.reset();
    mocks.setSessionPayload({
      uid: String(userId),
      roles: ["user"],
      iat: Date.parse("2026-07-24T08:00:00.000Z"),
      exp: Date.parse("2026-07-25T08:00:00.000Z"),
    });
  });

  it("resolves an active session token for an enabled account", async () => {
    mocks.seedUser({
      _id: userId,
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: false,
      suspendedAt: null,
      disabledAt: null,
      sessionRevokedAt: null,
      verification: { level: "none", methods: [] },
    });

    const user = await getSessionUser(sessionReq());

    expect(user).toMatchObject({
      email: "member@edebatte.org",
      roles: ["user"],
      sessionValid: true,
    });
  });

  it("rejects the same session token after disable and after later reactivation", async () => {
    mocks.seedUser({
      _id: userId,
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: true,
      suspendedAt: new Date("2026-07-24T09:00:00.000Z"),
      disabledAt: null,
      sessionRevokedAt: new Date("2026-07-24T09:00:00.000Z"),
      verification: { level: "none", methods: [] },
    });

    expect(await getSessionUser(sessionReq())).toBeNull();

    mocks.seedUser({
      _id: userId,
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: false,
      suspendedAt: null,
      disabledAt: null,
      sessionRevokedAt: new Date("2026-07-24T09:00:00.000Z"),
      verification: { level: "none", methods: [] },
    });

    expect(await getSessionUser(sessionReq())).toBeNull();
  });

  it("accepts a fresh session issued after reactivation", async () => {
    mocks.seedUser({
      _id: userId,
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: false,
      suspendedAt: null,
      disabledAt: null,
      sessionRevokedAt: new Date("2026-07-24T09:00:00.000Z"),
      verification: { level: "none", methods: [] },
    });
    mocks.setSessionPayload({
      uid: String(userId),
      roles: ["user"],
      iat: Date.parse("2026-07-24T10:00:00.000Z"),
      exp: Date.parse("2026-07-25T10:00:00.000Z"),
    });

    const user = await getSessionUser(sessionReq());

    expect(user).toMatchObject({
      email: "member@edebatte.org",
      roles: ["user"],
      sessionValid: true,
    });
  });

  it("fails closed when only legacy u_id is present without a valid session token", async () => {
    mocks.seedUser({
      _id: userId,
      email: "member@edebatte.org",
      roles: ["user"],
      suspended: false,
      suspendedAt: null,
      disabledAt: null,
      sessionRevokedAt: null,
      verification: { level: "none", methods: [] },
    });
    mocks.verifySessionToken.mockReturnValueOnce(null);

    const user = await getSessionUser(sessionReq("invalid"));

    expect(user).toBeNull();
  });
});
