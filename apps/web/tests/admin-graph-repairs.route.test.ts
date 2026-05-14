import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  graphRepairsCol: vi.fn(),
  collectGraphHealthSnapshot: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/graphAdmin/db", () => ({
  graphRepairsCol: (...args: unknown[]) => mocks.graphRepairsCol(...args),
}));

vi.mock("@features/graphAdmin/diagnostics", () => ({
  collectGraphHealthSnapshot: (...args: unknown[]) => mocks.collectGraphHealthSnapshot(...args),
}));

import { GET } from "@/app/api/admin/graph/repairs/route";

describe("admin graph repairs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    mocks.graphRepairsCol.mockResolvedValue({
      countDocuments: vi.fn().mockResolvedValue(0),
      find: vi.fn(() => ({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      })),
    });
  });

  it("surfaces a system repair ticket when graph health is unavailable", async () => {
    mocks.collectGraphHealthSnapshot.mockResolvedValue({
      status: "unavailable",
      reason: "db_unreachable",
      source: "real_graph",
      isMock: false,
      read: { ok: false, error: "connection refused" },
      write: { ok: false, mode: "disabled", error: "Schreibpfad ist blockiert." },
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
      nextActions: ["Graph-Datenbank starten"],
      dependentFlows: ["Feed Mapping eingeschränkt"],
    });

    const res = await GET(new NextRequest("http://localhost/api/admin/graph/repairs"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("unavailable");
    expect(body.source).toBe("system_health");
    expect(body.total).toBe(1);
    expect(body.items[0]?.type).toBe("graph_unavailable");
    expect(body.items[0]?.status).toBe("blocked");
    expect(body.items[0]?.nextActions).toContain("Graph-Datenbank starten");
  });
});
