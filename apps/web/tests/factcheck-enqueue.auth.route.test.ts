import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryFactcheckWorkflowRepo,
  getFactcheckWorkflowRepo,
  setFactcheckWorkflowRepoForTests,
} from "@features/factcheck/db";

const mocks = vi.hoisted(() => ({
  loggerWarn: vi.fn(),
  resolveRequestScopeContext: vi.fn(),
  summarizeRequestScopeContext: vi.fn(),
  buildOrganizationDashboardReadModel: vi.fn(),
  requestScopeCanWriteOrganizationRoutes: vi.fn(),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => mocks.loggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveRequestScopeContext: (...args: unknown[]) =>
    mocks.resolveRequestScopeContext(...args),
  summarizeRequestScopeContext: (...args: unknown[]) =>
    mocks.summarizeRequestScopeContext(...args),
  requestScopeCanWriteOrganizationRoutes: (...args: unknown[]) =>
    mocks.requestScopeCanWriteOrganizationRoutes(...args),
}));

vi.mock("@features/region", () => ({
  buildOrganizationDashboardReadModel: (...args: unknown[]) =>
    mocks.buildOrganizationDashboardReadModel(...args),
  organizationEntitlementAllowsScope: vi.fn(() => true),
}));

import { POST as factcheckEnqueuePOST } from "@/app/api/factcheck/enqueue/route";

describe("factcheck enqueue auth contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.INTERNAL_WORKER_TOKEN;
    setFactcheckWorkflowRepoForTests(createInMemoryFactcheckWorkflowRepo());
    mocks.resolveRequestScopeContext.mockResolvedValue(null);
    mocks.summarizeRequestScopeContext.mockReturnValue(null);
    mocks.requestScopeCanWriteOrganizationRoutes.mockReturnValue(false);
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue(null);
  });

  it("blocks query role bypass and keeps denied audit structured", async () => {
    const req = new NextRequest("http://localhost/api/factcheck/enqueue?role=owner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(403);
    const denyPayload = mocks.loggerWarn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(denyPayload?.denyReason).toBe("missing_session");
    expect(denyPayload?.systemIdentitySource).toBeNull();
  });

  it("rejects untrusted internal system identity", async () => {
    process.env.INTERNAL_WORKER_TOKEN = "system_secret";
    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong_secret",
        "x-internal-source": "factcheck_queue",
        "x-internal-actor-kind": "queue_worker",
      },
      body: JSON.stringify({}),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(403);
    const denyPayload = mocks.loggerWarn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(denyPayload?.denyReason).toBe("system_identity_untrusted_or_disallowed");
    expect(denyPayload?.systemIdentitySource).toBe("factcheck_queue");
  });

  it("allows trusted internal identity and reaches input validation path", async () => {
    process.env.INTERNAL_WORKER_TOKEN = "system_secret";
    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer system_secret",
        "x-internal-source": "factcheck_queue",
        "x-internal-actor-kind": "queue_worker",
      },
      body: JSON.stringify({}),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body?.code).toBe("MISSING_INPUT");
  });

  it("stores a review-first request without auto deepsearch or auto seal", async () => {
    process.env.INTERNAL_WORKER_TOKEN = "system_secret";
    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer system_secret",
        "x-internal-source": "factcheck_queue",
        "x-internal-actor-kind": "queue_worker",
      },
      body: JSON.stringify({
        text: "Belastbarer Ausgangstext ohne Quelle",
        claims: [{ text: "Claim A" }],
        withSerp: true,
        deepSearch: true,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.status).toBe("needs_source");
    expect(body?.factcheckResearchMode).toBe("deep_research_requested");
    expect(body?.sealGranted).toBe(false);
    expect(body?.factcheckSealDecision).toBe("none");
    expect(body?.factcheckSealEligibility).toBe("not_eligible");
    expect(body?.meta?.noAutoDeepSearch).toBe(true);
    expect(body?.meta?.noAutoSeal).toBe(true);
    expect(body?.limitations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Kein automatischer DeepSearch-Lauf."),
        expect.stringContaining("Kein automatischer kostenpflichtiger Provider-Lauf."),
      ]),
    );

    const stored = await getFactcheckWorkflowRepo().get(String(body?.jobId));
    expect(stored?.status).toBe("needs_source");
    expect(stored?.factcheckResearchMode).toBe("deep_research_requested");
    expect(stored?.publicSealVisible).toBe(false);
    expect(stored?.auditEvents.map((event) => event.eventType)).toEqual(["request"]);
  });
});
