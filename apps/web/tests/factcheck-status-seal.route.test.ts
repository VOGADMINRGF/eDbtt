import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  resolveRequestScopeContext: vi.fn(),
}));

vi.mock("@features/factcheck/db", () => ({
  getFactcheckWorkflowRepo: () => ({
    get: (...args: unknown[]) => mocks.get(...args),
    save: (...args: unknown[]) => mocks.save(...args),
  }),
}));

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveRequestScopeContext: (...args: unknown[]) =>
    mocks.resolveRequestScopeContext(...args),
}));

vi.mock("@/lib/server/auth/systemIdentity", () => ({
  resolveTrustedInternalSystemIdentity: vi.fn(() => null),
}));

import { POST as factcheckSealPOST } from "@/app/api/factcheck/status/[jobId]/seal/route";

describe("factcheck seal end-state contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue(null);
    mocks.save.mockResolvedValue(undefined);
    mocks.resolveRequestScopeContext.mockResolvedValue({
      actorId: "operator-1",
      email: "operator@example.org",
      isOperatorMode: true,
      organizationRole: "admin",
    });
  });

  it("does not grant seal before completed status", async () => {
    mocks.get.mockResolvedValue({
      jobId: "job_running",
      requestedAction: "sealed_factcheck",
      status: "running",
      claims: [{ id: "c1", text: "Claim A" }],
      sourceRefs: [{ id: "s1", label: "Quelle", url: "https://example.org", sourceType: "link" }],
      factcheckSealEligibility: "needs_review",
      factcheckSealDecision: "none",
      factcheckResearchMode: "provider_assisted",
      publicSealVisible: false,
      limitations: [],
      auditEvents: [],
      noAutoPublish: true,
      noAutoGraphPromotion: true,
      noAutoDossier: true,
      noAutoAnlassraum: true,
      noAutoVote: true,
      error: null,
    });

    const req = new NextRequest("http://localhost/api/factcheck/status/job_running/seal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "grant" }),
    });
    const res = await factcheckSealPOST(req, {
      params: Promise.resolve({ jobId: "job_running" }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body?.ok).toBe(false);
    expect(body?.code).toBe("SEAL_NOT_READY");
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("grants seal only for completed sealed_factcheck jobs", async () => {
    mocks.get.mockResolvedValue({
      jobId: "job_done",
      requestedAction: "sealed_factcheck",
      status: "completed",
      claims: [{ id: "c1", text: "Claim A" }],
      sourceRefs: [{ id: "s1", label: "Quelle", url: "https://example.org", sourceType: "link" }],
      factcheckSealEligibility: "eligible",
      factcheckSealDecision: "none",
      factcheckResearchMode: "deep_research_requested",
      publicSealVisible: false,
      limitations: [],
      auditEvents: [],
      noAutoPublish: true,
      noAutoGraphPromotion: true,
      noAutoDossier: true,
      noAutoAnlassraum: true,
      noAutoVote: true,
      error: null,
    });

    const req = new NextRequest("http://localhost/api/factcheck/status/job_done/seal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "grant" }),
    });
    const res = await factcheckSealPOST(req, {
      params: Promise.resolve({ jobId: "job_done" }),
    });

    expect(res.status).toBe(200);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.verificationMode).toBe("sealed");
    expect(body?.researchUsed).toBe("deep_search");
    expect(body?.sealEligible).toBe(true);
    expect(body?.sealGranted).toBe(true);
    expect(body?.verificationLabel).toBe("verifiziert");
    expect(body?.workflowStage).toBe("sealed");
    expect(body?.sealStatus).toBe("Siegel erteilt");
    expect(body?.meta?.lane).toBe("sealed_factcheck");
  });
});
