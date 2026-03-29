import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  listTasks: vi.fn(),
  getTaskById: vi.fn(),
  getLatestContributionByAuthor: vi.fn(),
  createContribution: vi.fn(),
  rateLimitOrThrow: vi.fn(),
}));

vi.mock("@core/research", () => ({
  listTasks: (...args: unknown[]) => mocks.listTasks(...args),
  getTaskById: (...args: unknown[]) => mocks.getTaskById(...args),
  getLatestContributionByAuthor: (...args: unknown[]) => mocks.getLatestContributionByAuthor(...args),
  createContribution: (...args: unknown[]) => mocks.createContribution(...args),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { GET as listGET } from "@/app/api/research/tasks/list/route";
import { GET as detailGET } from "@/app/api/research/tasks/[id]/route";
import { POST as contributePOST } from "@/app/api/research/tasks/[id]/contribute/route";

describe("research routes expose safety startform contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimitOrThrow.mockResolvedValue({ ok: true });
    mocks.listTasks.mockResolvedValue([{ id: "t1", title: "Task", status: "open" }]);
    mocks.getTaskById.mockResolvedValue({ id: "t1", title: "Task", status: "open" });
    mocks.getLatestContributionByAuthor.mockResolvedValue(null);
    mocks.createContribution.mockResolvedValue({
      id: "c1",
      taskId: "t1",
      authorId: "u1",
      status: "submitted",
    });
  });

  it("returns safety startform contract in list response", async () => {
    const req = new NextRequest("http://localhost/api/research/tasks/list", {
      headers: { cookie: "u_id=u1; u_verified=1" },
    });
    const res = await listGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.meta?.socialEscalationStartform?.defaultEnabled).toBe(false);
    expect(body?.meta?.socialEscalationStartform?.allowedContexts).toEqual(["moderated", "curated"]);
    expect(body?.meta?.socialEscalationStartform?.requiresModerationAndAbuseGates).toBe(true);
  });

  it("returns safety startform contract in task detail response", async () => {
    const req = new NextRequest("http://localhost/api/research/tasks/t1", {
      headers: { cookie: "u_id=u1; u_verified=1" },
    });
    const res = await detailGET(req, { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.meta?.socialEscalationStartform?.requiresOptIn).toBe(true);
  });

  it("returns safety startform contract in contribution submit response", async () => {
    const req = new NextRequest("http://localhost/api/research/tasks/t1/contribute", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "u_id=u1; u_verified=1" },
      body: JSON.stringify({ summary: "Recherche", details: "Details" }),
    });
    const res = await contributePOST(req, { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.meta?.socialEscalationStartform?.requiresTrustOrVerification).toBe(true);
  });

  it("does not allow contact-escalation payload fields to bypass research submit contract", async () => {
    const req = new NextRequest("http://localhost/api/research/tasks/t1/contribute", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "u_id=u1; u_verified=1" },
      body: JSON.stringify({
        summary: "Recherche",
        details: "Details",
        contextType: "curated",
        optIn: true,
        trustSignal: true,
      }),
    });
    const res = await contributePOST(req, { params: { id: "t1" } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.meta?.socialEscalationStartform?.defaultEnabled).toBe(false);
    expect(body?.meta?.socialEscalationStartform?.allowedContexts).toEqual(["moderated", "curated"]);
    expect(mocks.createContribution).toHaveBeenCalledWith({
      taskId: "t1",
      authorId: "u1",
      summary: "Recherche",
      details: "Details",
      sources: undefined,
    });
  });
});
