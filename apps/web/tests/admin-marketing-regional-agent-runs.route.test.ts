import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ requireAdminOrResponse: vi.fn() }));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import * as listRoute from "@/app/api/admin/marketing/agent/runs/route";
import * as detailRoute from "@/app/api/admin/marketing/agent/runs/[runId]/route";

function request(path = "/api/admin/marketing/agent/runs") {
  return new NextRequest(`http://localhost${path}`, { method: "GET" });
}

describe("/api/admin/marketing/agent/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [403, "two_factor_required"],
  ])("passes through shared admin gate status %s for %s", async (status, error) => {
    mocks.requireAdminOrResponse.mockResolvedValue(Response.json({ ok: false, error }, { status }));

    const response = await listRoute.GET(request());
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ error });
  });

  it("returns the read-only run list for an admitted admin session", async () => {
    const response = await listRoute.GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.readModel).toMatchObject({ mode: "read_only", searchMode: "no_external_search" });
    expect(body.readModel.runs).toHaveLength(3);
  });

  it("returns one run or a safe 404 without a fallback search", async () => {
    const found = await detailRoute.GET(
      request("/api/admin/marketing/agent/runs/regional-run-berlin-mitte-2026-07-fixture"),
      { params: Promise.resolve({ runId: "regional-run-berlin-mitte-2026-07-fixture" }) },
    );
    expect(found.status).toBe(200);
    await expect(found.json()).resolves.toMatchObject({
      readModel: { mode: "read_only", searchMode: "no_external_search" },
    });

    const missing = await detailRoute.GET(request("/api/admin/marketing/agent/runs/missing"), {
      params: Promise.resolve({ runId: "missing" }),
    });
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({ error: "regional_agent_run_not_found" });
  });

  it("exports no mutation handlers", () => {
    for (const route of [listRoute, detailRoute]) {
      expect((route as Record<string, unknown>).POST).toBeUndefined();
      expect((route as Record<string, unknown>).PUT).toBeUndefined();
      expect((route as Record<string, unknown>).PATCH).toBeUndefined();
      expect((route as Record<string, unknown>).DELETE).toBeUndefined();
    }
  });
});
