import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  loggerWarn: vi.fn(),
  insertOne: vi.fn(),
  callAriSearchSerp: vi.fn(),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => mocks.loggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@features/factcheck/db", () => ({
  factcheckJobsCol: vi.fn(async () => ({
    insertOne: (...args: unknown[]) => mocks.insertOne(...args),
  })),
}));

vi.mock("@features/ai/providers/ari_search", () => ({
  callAriSearchSerp: (...args: unknown[]) => mocks.callAriSearchSerp(...args),
}));

import { POST as factcheckEnqueuePOST } from "@/app/api/factcheck/enqueue/route";

describe("factcheck enqueue auth contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.INTERNAL_WORKER_TOKEN;
    mocks.insertOne.mockResolvedValue({ acknowledged: true });
    mocks.callAriSearchSerp.mockResolvedValue({ ok: true, results: [] });
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
    expect(denyPayload?.denyReason).toBe("missing_permission");
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

  it("returns sealed factcheck contract fields for enqueue responses", async () => {
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
        text: "Belastbarer Ausgangstext",
        claims: [{ text: "Claim A" }],
        withSerp: false,
      }),
    });
    const res = await factcheckEnqueuePOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.verificationMode).toBe("sealed");
    expect(body?.researchUsed).toBe("search");
    expect(body?.sealEligible).toBe(true);
    expect(body?.sealGranted).toBe(false);
    expect(body?.verificationLabel).toBe("geprueft");
    expect(body?.workflowStage).toBe("completed");
    expect(body?.workflowLabel).toBe("abgeschlossen");
    expect(body?.sealStatus).toBe("Siegel ausstehend");
    expect(body?.meta?.lane).toBe("sealed_factcheck");
    expect(body?.meta?.journeyProfile).toBe("sealed_factcheck");
    expect(body?.meta?.verificationMode).toBe("sealed");
    expect(body?.meta?.roleProviderMapping?.fallback).toEqual(["openai"]);
  });
});
