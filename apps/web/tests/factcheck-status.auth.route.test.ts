import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  workflowList: vi.fn(async () => []),
  loggerWarn: vi.fn(),
  requestScope: vi.fn(async () => null),
}));

vi.mock("@features/factcheck/db", () => ({
  getFactcheckWorkflowRepo: vi.fn(() => ({
    list: (...args: unknown[]) => mocks.workflowList(...args),
  })),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => mocks.loggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveRequestScopeContext: (...args: unknown[]) => mocks.requestScope(...args),
}));

import { GET as factcheckStatusGET } from "@/app/api/factcheck/status/route";

describe("factcheck status auth contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.INTERNAL_WORKER_TOKEN;
    mocks.workflowList.mockResolvedValue([]);
    mocks.requestScope.mockResolvedValue(null);
  });

  it("blocks query role bypass and emits structured denied audit fields", async () => {
    const req = new NextRequest("http://localhost/api/factcheck/status?role=owner");
    const res = await factcheckStatusGET(req);
    expect(res.status).toBe(403);

    const denyPayload = mocks.loggerWarn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(denyPayload?.denyReason).toBe("operator_scope_required");
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

  it("allows trusted operator request scope", async () => {
    mocks.requestScope.mockResolvedValue({ isOperatorMode: true });
    const req = new NextRequest("http://localhost/api/factcheck/status", {
      headers: { cookie: "u_role=editor" },
    });
    const res = await factcheckStatusGET(req);
    expect(res.status).toBe(200);
  });
});
