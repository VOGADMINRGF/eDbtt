import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  resolveRequestScopeContext: vi.fn(),
}));

vi.mock("@features/factcheck/db", () => ({
  getFactcheckWorkflowRepo: () => ({
    get: (...args: unknown[]) => mocks.get(...args),
  }),
}));

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveRequestScopeContext: (...args: unknown[]) =>
    mocks.resolveRequestScopeContext(...args),
}));

vi.mock("@/lib/server/auth/requestRole", () => ({
  resolveRoleFromRequest: vi.fn(() => ({ role: "member", source: "session" })),
  logPermissionDenied: vi.fn(),
}));

vi.mock("@/lib/server/auth/systemIdentity", () => ({
  resolveInternalSystemIdentity: vi.fn(() => null),
  resolveTrustedInternalSystemIdentity: vi.fn(() => null),
  internalSystemIdentityAuditFields: vi.fn(() => ({})),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { GET as factcheckStatusDetailGET } from "@/app/api/factcheck/status/[jobId]/route";

describe("factcheck status detail sealed contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue(null);
    mocks.resolveRequestScopeContext.mockResolvedValue({
      actorId: "user-1",
      email: "person@example.org",
      isOperatorMode: false,
      organizationRole: null,
    });
  });

  it("returns sealed verification fields from job state", async () => {
    mocks.get.mockResolvedValue({
      jobId: "job_1",
      requestedByUserId: "user-1",
      status: "running",
      requestedAction: "sealed_factcheck",
      verdict: "UNDETERMINED",
      confidenceScore: 0.5,
      language: "de",
      createdAt: new Date("2026-04-23T10:00:00.000Z"),
      finishedAt: null,
      draftId: null,
      contributionId: "cid_1",
      claims: [{ id: "c1", text: "Claim A" }],
      sourceRefs: [],
      materialRefs: [],
      serpResults: [],
      verificationMode: "sealed",
      researchUsed: "deep_search",
      sealEligible: true,
      sealGranted: false,
      factcheckVerificationMode: "sealed",
      factcheckResearchMode: "deep_research_requested",
      factcheckSealEligibility: "needs_review",
      factcheckSealDecision: "requested",
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

    const req = new NextRequest("http://localhost/api/factcheck/status/job_1");
    const res = await factcheckStatusDetailGET(req, {
      params: Promise.resolve({ jobId: "job_1" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.verificationMode).toBe("sealed");
    expect(body?.researchUsed).toBe("deep_search");
    expect(body?.sealEligible).toBe(true);
    expect(body?.sealGranted).toBe(false);
    expect(body?.verificationLabel).toBe("geprueft");
    expect(body?.workflowStage).toBe("in_progress");
    expect(body?.sealStatus).toBe("Siegelprüfung ausstehend");
    expect(body?.meta?.lane).toBe("sealed_factcheck");
    expect(body?.job?.verificationMode).toBe("sealed");
  });

  it("defaults legacy completed jobs to a pending sealed view without granting the seal", async () => {
    mocks.get.mockResolvedValue({
      jobId: "job_legacy",
      requestedByUserId: "user-1",
      status: "completed",
      requestedAction: "source_check",
      verdict: "UNDETERMINED",
      confidenceScore: 0.5,
      language: "de",
      createdAt: new Date("2026-04-23T10:00:00.000Z"),
      finishedAt: new Date("2026-04-23T10:00:05.000Z"),
      draftId: null,
      contributionId: "cid_legacy",
      claims: [],
      sourceRefs: [],
      materialRefs: [],
      serpResults: [],
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

    const req = new NextRequest("http://localhost/api/factcheck/status/job_legacy");
    const res = await factcheckStatusDetailGET(req, {
      params: Promise.resolve({ jobId: "job_legacy" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.verificationMode).toBe("precheck");
    expect(body?.researchUsed).toBe("none");
    expect(body?.sealEligible).toBe(true);
    expect(body?.sealGranted).toBe(false);
    expect(body?.verificationLabel).toBe("geprueft");
    expect(body?.workflowStage).toBe("completed");
    expect(body?.sealStatus).toBe("Siegelprüfung ausstehend");
  });
});
