import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  requestsToArray: vi.fn(),
  requestsCountDocuments: vi.fn(),
  usersFindOne: vi.fn(),
  requestsInsertOne: vi.fn(),
  requestsFindOneAndUpdate: vi.fn(),
  incrementRateLimit: vi.fn(),
  loggerWarn: vi.fn(),
  loggerInfo: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  incrementRateLimit: (...args: unknown[]) => mocks.incrementRateLimit(...args),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => mocks.loggerWarn(...args),
    info: (...args: unknown[]) => mocks.loggerInfo(...args),
  },
}));

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<typeof import("@core/db/triMongo")>("@core/db/triMongo");

  const requestFindChain = {
    sort: vi.fn(() => requestFindChain),
    limit: vi.fn(() => requestFindChain),
    toArray: (...args: unknown[]) => mocks.requestsToArray(...args),
  };

  return {
    ...actual,
    assertStoreConfigured: vi.fn(),
    coreCol: vi.fn(async (name: string) => {
      if (name === "social_friend_requests") {
        return {
          find: vi.fn(() => requestFindChain),
          countDocuments: (...args: unknown[]) => mocks.requestsCountDocuments(...args),
          insertOne: (...args: unknown[]) => mocks.requestsInsertOne(...args),
          findOneAndUpdate: (...args: unknown[]) => mocks.requestsFindOneAndUpdate(...args),
        };
      }
      if (name === "users") {
        return {
          findOne: (...args: unknown[]) => mocks.usersFindOne(...args),
        };
      }
      throw new Error(`unexpected_collection_${name}`);
    }),
  };
});

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

import { ObjectId } from "@core/db/triMongo";
import { POST as socialActionsPOST } from "@/app/api/account/social-actions/route";

describe("social-actions escalation policy guard", () => {
  const targetUserId = new ObjectId("65f000000000000000000123").toHexString();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({ uid: "65f000000000000000000001" });
    mocks.requestsToArray.mockResolvedValue([]);
    mocks.requestsCountDocuments.mockResolvedValue(0);
    mocks.incrementRateLimit.mockResolvedValue(1);
    mocks.usersFindOne.mockImplementation(async (query: any) => {
      const id = query?._id ? String(query._id) : "";
      if (id === "65f000000000000000000001") {
        return {
          _id: new ObjectId("65f000000000000000000001"),
          verifiedEmail: true,
          verification: { level: "soft", methods: ["email"] },
        };
      }
      if (id === targetUserId) {
        return { _id: new ObjectId(targetUserId) };
      }
      return null;
    });
    mocks.requestsFindOneAndUpdate.mockResolvedValue(null);
    mocks.requestsInsertOne.mockResolvedValue({ insertedId: new ObjectId("65f000000000000000000789") });
  });

  it("blocks match.request by default when no moderated/curated policy context is provided", async () => {
    const req = new Request("http://localhost/api/account/social-actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "match.request",
        targetUserId,
      }),
    });

    const res = await socialActionsPOST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body?.error).toBe("social_escalation_not_allowed");
    expect(body?.reason).toBe("missing_allowed_context");
  });

  it("allows match.request only with curated/moderated context plus opt-in and trust/verification signals", async () => {
    const req = new Request("http://localhost/api/account/social-actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "match.request",
        targetUserId,
        contextType: "curated",
        optIn: true,
        trustSignal: true,
      }),
    });

    const res = await socialActionsPOST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body?.ok).toBe(true);
    expect(body?.state).toBe("pending");
    expect(mocks.loggerInfo).toHaveBeenCalled();
  });

  it("rate-limits repeated match.request attempts", async () => {
    mocks.incrementRateLimit.mockResolvedValue(99);

    const req = new Request("http://localhost/api/account/social-actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "match.request",
        targetUserId,
        contextType: "moderated",
        optIn: true,
      }),
    });

    const res = await socialActionsPOST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body?.error).toBe("social_escalation_rate_limited");
    expect(mocks.loggerWarn).toHaveBeenCalled();
  });

  it("enforces cooldown for repeated requests to the same target", async () => {
    mocks.requestsToArray.mockResolvedValue([
      {
        _id: new ObjectId("65f000000000000000000888"),
        fromUserId: "65f000000000000000000001",
        toUserId: targetUserId,
        status: "rejected",
        createdAt: new Date(),
      },
    ]);

    const req = new Request("http://localhost/api/account/social-actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "match.request",
        targetUserId,
        contextType: "curated",
        optIn: true,
      }),
    });

    const res = await socialActionsPOST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body?.error).toBe("social_escalation_cooldown");
  });
});
