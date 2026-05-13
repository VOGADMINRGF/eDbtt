import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  collectGraphHealthSnapshot: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/graphAdmin/diagnostics", () => ({
  collectGraphHealthSnapshot: (...args: unknown[]) => mocks.collectGraphHealthSnapshot(...args),
}));

import { GET } from "@/app/api/admin/graph/health/route";

describe("admin graph health route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
  });

  it("returns null metrics instead of fake zero values when the graph is unavailable", async () => {
    mocks.collectGraphHealthSnapshot.mockResolvedValue({
      status: "unavailable",
      reason: "missing_env",
      source: "disabled",
      isMock: false,
      read: { ok: false, error: "Graph-Umgebungsvariablen fehlen." },
      write: { ok: false, mode: "disabled", error: "Graph-Verbindung ist nicht konfiguriert." },
      metrics: {
        nodes: null,
        edges: null,
        orphans: null,
        duplicates: null,
        brokenPaths: null,
        unlinkedEvidence: null,
      },
      meta: {
        generatedAt: "2026-05-11T12:00:00.000Z",
        windowDays: 30,
        lastSync: null,
        adapter: "neo4j-driver",
      },
      nextActions: ["NEO4J_URL prüfen"],
      dependentFlows: ["Feed Mapping eingeschränkt"],
    });

    const res = await GET(new NextRequest("http://localhost/api/admin/graph/health"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("unavailable");
    expect(body.reason).toBe("missing_env");
    expect(body.metrics.nodes).toBeNull();
    expect(body.metrics.edges).toBeNull();
    expect(body.nextActions).toContain("NEO4J_URL prüfen");
  });
});
