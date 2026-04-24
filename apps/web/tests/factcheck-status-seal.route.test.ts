import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock("@features/factcheck/db", () => ({
  factcheckJobsCol: vi.fn(async () => ({
    findOne: (...args: unknown[]) => mocks.findOne(...args),
    updateOne: (...args: unknown[]) => mocks.updateOne(...args),
  })),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST as factcheckSealPOST } from "@/app/api/factcheck/status/[jobId]/seal/route";

describe("factcheck seal end-state contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOne.mockResolvedValue(null);
    mocks.updateOne.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
  });

  it("does not grant seal before completed status", async () => {
    mocks.findOne.mockResolvedValue({
      jobId: "job_running",
      status: "processing",
      claims: [{ id: "c1", text: "Claim A" }],
      error: null,
      researchUsed: "search",
    });

    const req = new NextRequest("http://localhost/api/factcheck/status/job_running/seal", {
      method: "POST",
      headers: { cookie: "u_role=editor" },
    });
    const res = await factcheckSealPOST(req, {
      params: Promise.resolve({ jobId: "job_running" }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body?.ok).toBe(false);
    expect(body?.code).toBe("SEAL_NOT_READY");
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("grants seal only for completed jobs with evaluated claims", async () => {
    mocks.findOne.mockResolvedValue({
      jobId: "job_done",
      status: "completed",
      claims: [{ id: "c1", text: "Claim A" }],
      error: null,
      researchUsed: "deep_search",
    });

    const req = new NextRequest("http://localhost/api/factcheck/status/job_done/seal", {
      method: "POST",
      headers: { cookie: "u_role=editor" },
    });
    const res = await factcheckSealPOST(req, {
      params: Promise.resolve({ jobId: "job_done" }),
    });

    expect(res.status).toBe(200);
    expect(mocks.updateOne).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.verificationMode).toBe("sealed");
    expect(body?.researchUsed).toBe("deep_search");
    expect(body?.sealEligible).toBe(true);
    expect(body?.sealGranted).toBe(true);
    expect(body?.verificationLabel).toBe("verifiziert");
    expect(body?.workflowStage).toBe("completed");
    expect(body?.sealStatus).toBe("Siegel erteilt");
    expect(body?.meta?.lane).toBe("sealed_factcheck");
  });
});
