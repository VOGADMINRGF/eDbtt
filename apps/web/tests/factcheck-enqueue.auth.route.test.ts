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
  getCreateEntitlementsForRequest: vi.fn(),
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

vi.mock("@/lib/server/entitlements/createEntitlements", () => ({
  getCreateEntitlementsForRequest: (...args: unknown[]) =>
    mocks.getCreateEntitlementsForRequest(...args),
}));

import { POST as factcheckEnqueuePOST } from "@/app/api/factcheck/enqueue/route";

function mockSignedInUser(canDeepResearch = false) {
  mocks.resolveRequestScopeContext.mockResolvedValue({
    actorId: "user-1",
    actor: { roles: ["citizen"] },
    email: "person@example.org",
    isOperatorMode: false,
    organizationRole: null,
  });
  mocks.summarizeRequestScopeContext.mockReturnValue({
    actorId: "user-1",
    roleLabel: "Mitglied",
    organizationRole: null,
    isOperatorMode: false,
    sourceOfTruth: "session",
    confidence: "high",
    organizationId: null,
    primaryRegionId: null,
    membershipStatus: "verified",
  });
  mocks.getCreateEntitlementsForRequest.mockResolvedValue({
    isAuthenticated: true,
    canDeepResearch,
  });
}

describe("factcheck enqueue auth contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.INTERNAL_WORKER_TOKEN;
    setFactcheckWorkflowRepoForTests(createInMemoryFactcheckWorkflowRepo());
    mocks.resolveRequestScopeContext.mockResolvedValue(null);
    mocks.summarizeRequestScopeContext.mockReturnValue(null);
    mocks.requestScopeCanWriteOrganizationRoutes.mockReturnValue(false);
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue(null);
    mocks.getCreateEntitlementsForRequest.mockResolvedValue({
      isAuthenticated: true,
      canDeepResearch: false,
    });
  });

  it("blocks query role bypass and keeps denied audit structured", async () => {
    const req = new NextRequest("http://localhost/api/factcheck/enqueue?role=owner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body?.code).toBe("login_required");
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

  it("returns login_required for guests and does not create a job", async () => {
    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Bitte prüft diesen Beitrag mit Quellen.",
        researchConfirmed: true,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body?.code).toBe("login_required");
    expect((await getFactcheckWorkflowRepo().list()).length).toBe(0);
  });

  it("blocks productive factcheck jobs without entitlement", async () => {
    mockSignedInUser(false);

    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Belastbarer Ausgangstext mit Quelle https://example.org/bericht",
        claims: [{ text: "Claim A" }],
        researchConfirmed: true,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(["entitlement_required", "pricing_required"]).toContain(body?.code);
    expect(body?.entitlementGate).toMatchObject({
      action: "source_check",
      allowed: false,
      entitlementRequired: true,
      pricingRequired: true,
    });
    expect((await getFactcheckWorkflowRepo().list()).length).toBe(0);
  });

  it("blocks productive factcheck jobs without explicit confirmation", async () => {
    mockSignedInUser(true);

    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Belastbarer Ausgangstext mit Quelle https://example.org/bericht",
        claims: [{ text: "Claim A" }],
        researchConfirmed: false,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body?.code).toBe("confirmation_required");
    expect((await getFactcheckWorkflowRepo().list()).length).toBe(0);
  });

  it("queues a confirmed factcheck job without auto publish or auto merge", async () => {
    mockSignedInUser(true);

    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Belastbarer Ausgangstext mit Quelle https://example.org/bericht",
        claims: [{ text: "Claim A" }],
        withSerp: true,
        researchConfirmed: true,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.status).toBe("queued");
    expect(body?.requestedAction).toBe("source_check");
    expect(body?.truthStatus).toBe("factcheck_requested");
    expect(body?.meta?.noAutoPublish).toBe(true);
    expect(body?.meta?.noAutoGraphPromotion).toBe(true);

    const stored = await getFactcheckWorkflowRepo().get(String(body?.jobId));
    expect(stored?.status).toBe("queued");
    expect(stored?.gate).toMatchObject({
      loginConfirmed: true,
      entitlementConfirmed: true,
      pricingConfirmed: true,
      userConfirmed: true,
    });
    expect(stored?.noAutoPublish).toBe(true);
    expect(stored?.noAutoGraphPromotion).toBe(true);
    expect(stored?.result).toBeNull();
  });

  it("blocks deep research without allowDeepSearch entitlement", async () => {
    mockSignedInUser(false);

    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Belastbarer Ausgangstext mit Quelle https://example.org/bericht",
        claims: [{ text: "Claim A" }],
        deepSearch: true,
        researchConfirmed: true,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(["entitlement_required", "pricing_required"]).toContain(body?.code);
    expect((await getFactcheckWorkflowRepo().list()).length).toBe(0);
  });

  it("blocks spam or too-short input before creating a job", async () => {
    mockSignedInUser(true);

    const req = new NextRequest("http://localhost/api/factcheck/enqueue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "Hi",
        researchConfirmed: true,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body?.code).toBe("blocked_by_spam");
    expect(body?.entitlementGate).toMatchObject({
      action: "source_check",
      allowed: false,
      reason: "blocked_by_spam",
    });
    expect((await getFactcheckWorkflowRepo().list()).length).toBe(0);
  });
});
