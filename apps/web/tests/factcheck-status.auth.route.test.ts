import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  aggregateToArray: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@features/factcheck/db", () => ({
  factcheckJobsCol: vi.fn(async () => ({
    aggregate: vi.fn(() => ({
      toArray: (...args: unknown[]) => mocks.aggregateToArray(...args),
    })),
  })),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => mocks.loggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { GET as factcheckStatusGET } from "@/app/api/factcheck/status/route";

describe("factcheck status auth contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.INTERNAL_WORKER_TOKEN;
    mocks.aggregateToArray.mockResolvedValue([]);
  });

  it("blocks query role bypass and emits structured denied audit fields", async () => {
    const req = new NextRequest("http://localhost/api/factcheck/status?role=owner");
    const res = await factcheckStatusGET(req);
    expect(res.status).toBe(403);

    const denyPayload = mocks.loggerWarn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(denyPayload?.denyReason).toBe("missing_permission");
    expect(denyPayload?.systemIdentitySource).toBeNull();
    expect(denyPayload?.systemIdentityActorKind).toBeNull();
  });

  it("rejects header-only role access for machine-like requests", async () => {
    const req = new NextRequest("http://localhost/api/factcheck/status", {
      headers: { "x-role": "editor" },
    });
    const res = await factcheckStatusGET(req);
    expect(res.status).toBe(403);
  });

  it("rejects untrusted internal identity and includes internal audit fields", async () => {
    process.env.INTERNAL_WORKER_TOKEN = "system_secret";
    const req = new NextRequest("http://localhost/api/factcheck/status", {
      headers: {
        authorization: "Bearer wrong_secret",
        "x-internal-source": "factcheck_worker",
        "x-internal-actor-kind": "queue_worker",
      },
    });
    const res = await factcheckStatusGET(req);
    expect(res.status).toBe(403);
    const denyPayload = mocks.loggerWarn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(denyPayload?.denyReason).toBe("system_identity_untrusted_or_disallowed");
    expect(denyPayload?.systemIdentitySource).toBe("factcheck_worker");
    expect(denyPayload?.systemIdentityActorKind).toBe("queue_worker");
  });

  it("allows trusted internal system identity", async () => {
    process.env.INTERNAL_WORKER_TOKEN = "system_secret";
    const req = new NextRequest("http://localhost/api/factcheck/status", {
      headers: {
        authorization: "Bearer system_secret",
        "x-internal-source": "factcheck_worker",
        "x-internal-actor-kind": "queue_worker",
      },
    });
    const res = await factcheckStatusGET(req);
    expect(res.status).toBe(200);
  });

  it("keeps cookie session role path working", async () => {
    const req = new NextRequest("http://localhost/api/factcheck/status", {
      headers: { cookie: "u_role=editor" },
    });
    const res = await factcheckStatusGET(req);
    expect(res.status).toBe(200);
  });
});
