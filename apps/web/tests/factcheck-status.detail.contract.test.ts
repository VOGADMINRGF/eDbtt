import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
}));

vi.mock("@features/factcheck/db", () => ({
  factcheckJobsCol: vi.fn(async () => ({
    findOne: (...args: unknown[]) => mocks.findOne(...args),
  })),
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
    mocks.findOne.mockResolvedValue(null);
  });

  it("returns sealed verification fields from job state", async () => {
    mocks.findOne.mockResolvedValue({
      jobId: "job_1",
      status: "processing",
      verdict: "UNDETERMINED",
      confidence: 0.5,
      language: "de",
      createdAt: new Date("2026-04-23T10:00:00.000Z"),
      finishedAt: null,
      draftId: null,
      contributionId: "cid_1",
      claims: [{ id: "c1", text: "Claim A" }],
      serpResults: [],
      verificationMode: "sealed",
      researchUsed: "deep_search",
      sealEligible: true,
      sealGranted: false,
      error: null,
    });

    const req = new NextRequest("http://localhost/api/factcheck/status/job_1", {
      headers: { cookie: "u_role=editor" },
    });
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

  it("defaults legacy jobs to sealed pending contract without granting seal", async () => {
    mocks.findOne.mockResolvedValue({
      jobId: "job_legacy",
      status: "completed",
      verdict: "UNDETERMINED",
      confidence: 0.5,
      language: "de",
      createdAt: new Date("2026-04-23T10:00:00.000Z"),
      finishedAt: new Date("2026-04-23T10:00:05.000Z"),
      draftId: null,
      contributionId: "cid_legacy",
      claims: [],
      serpResults: [],
      error: null,
    });

    const req = new NextRequest("http://localhost/api/factcheck/status/job_legacy", {
      headers: { cookie: "u_role=editor" },
    });
    const res = await factcheckStatusDetailGET(req, {
      params: Promise.resolve({ jobId: "job_legacy" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.verificationMode).toBe("sealed");
    expect(body?.researchUsed).toBe("search");
    expect(body?.sealEligible).toBe(true);
    expect(body?.sealGranted).toBe(false);
    expect(body?.verificationLabel).toBe("geprueft");
    expect(body?.workflowStage).toBe("completed");
    expect(body?.sealStatus).toBe("Siegelprüfung ausstehend");
  });
});
