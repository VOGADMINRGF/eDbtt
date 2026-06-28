import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  runClusterJob: vi.fn(),
  recordFeedRuntimeRun: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@features/feeds/clusterJob", () => ({
  runFeedAnlassraumClusterJob: (...args: unknown[]) => mocks.runClusterJob(...args),
}));

vi.mock("@features/feeds/runtimeLog", () => ({
  recordFeedRuntimeRun: (...args: unknown[]) => mocks.recordFeedRuntimeRun(...args),
}));

import { POST as runPOST } from "@/app/api/admin/feeds/cluster/run/route";

const gateAccess = {
  actor: {
    userId: "u1",
    role: "reviewer",
    isAdmin: false,
    scopedOwnerIds: ["owner-1"],
    scopedEntityIds: ["entity-1"],
    personTrust: "verified",
  },
};

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

describe("feed cluster-job run route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
    mocks.recordFeedRuntimeRun.mockResolvedValue(undefined);
  });

  it("returns successful cluster run response", async () => {
    mocks.runClusterJob.mockResolvedValue({
      status: "success",
      emptyReason: null,
      dryRun: true,
      source: { scannedDrafts: 42, eligibleDrafts: 40 },
      summary: { totalClusters: 3, created: 1, updated: 1, unchanged: 1 },
      clusters: [],
    });

    const res = await runPOST(
      req("http://localhost/api/admin/feeds/cluster/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          limit: 120,
          windowHours: 96,
          minItemsPerCluster: 3,
          dryRun: true,
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.runClusterJob).toHaveBeenCalledWith({
      limit: 120,
      windowHours: 96,
      minItemsPerCluster: 3,
      dryRun: true,
    });
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: "success",
      dryRun: true,
      summary: { totalClusters: 3 },
    });
  });

  it("maps invalid body to 400", async () => {
    const res = await runPOST(
      req("http://localhost/api/admin/feeds/cluster/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{ invalid-json",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_body" });
  });

  it("validates numeric params", async () => {
    const res = await runPOST(
      req("http://localhost/api/admin/feeds/cluster/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 0 }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_limit" });
  });

  it("maps source unavailable to 503", async () => {
    mocks.runClusterJob.mockRejectedValue(new Error("feed_anlassraum_cluster_source_unavailable"));
    const res = await runPOST(
      req("http://localhost/api/admin/feeds/cluster/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "feed_anlassraum_cluster_source_unavailable",
    });
  });

  it("passes through governance gate responses", async () => {
    mocks.requireGate.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const res = await runPOST(
      req("http://localhost/api/admin/feeds/cluster/run", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(res.status).toBe(403);
  });
});
