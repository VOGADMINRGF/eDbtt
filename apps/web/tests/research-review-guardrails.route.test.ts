import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  updateContributionStatus: vi.fn(),
  getTaskById: vi.fn(),
  syncResearchContributionToGraph: vi.fn(),
  awardResearchXp: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@core/research", () => ({
  updateContributionStatus: (...args: unknown[]) => mocks.updateContributionStatus(...args),
  getTaskById: (...args: unknown[]) => mocks.getTaskById(...args),
}));

vi.mock("@core/graph", () => ({
  syncResearchContributionToGraph: (...args: unknown[]) => mocks.syncResearchContributionToGraph(...args),
}));

vi.mock("@features/account/service", () => ({
  awardResearchXp: (...args: unknown[]) => mocks.awardResearchXp(...args),
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST as reviewStatusPOST } from "@/app/api/admin/research/contributions/status/route";

describe("research review status route guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not allow publish/review bypass when admin gate denies access", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403 }),
    );
    const req = new NextRequest(
      "http://localhost/api/admin/research/contributions/status?role=owner",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contributionId: "c1",
          status: "accepted",
        }),
      },
    );

    const res = await reviewStatusPOST(req);
    expect(res.status).toBe(403);
    expect(mocks.updateContributionStatus).not.toHaveBeenCalled();
  });

  it("returns the safety startform contract on successful status update", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue({ actor: { role: "admin" } });
    mocks.updateContributionStatus.mockResolvedValue({
      id: "c1",
      taskId: "t1",
      authorId: "u1",
      status: "accepted",
    });
    mocks.getTaskById.mockResolvedValue({ id: "t1", title: "Task" });
    mocks.awardResearchXp.mockResolvedValue(undefined);
    mocks.syncResearchContributionToGraph.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/admin/research/contributions/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contributionId: "c1",
        status: "accepted",
        reviewNote: "ok",
      }),
    });

    const res = await reviewStatusPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.meta?.socialEscalationStartform?.defaultEnabled).toBe(false);
    expect(body?.meta?.socialEscalationStartform?.allowedContexts).toEqual(["moderated", "curated"]);
    expect(body?.meta?.socialEscalationStartform?.requiresModerationAndAbuseGates).toBe(true);
    expect(mocks.awardResearchXp).toHaveBeenCalledWith("u1", "t1");
    expect(mocks.syncResearchContributionToGraph).toHaveBeenCalledWith({
      task: { id: "t1", title: "Task" },
      contribution: expect.objectContaining({ id: "c1", status: "accepted" }),
    });
  });
});
