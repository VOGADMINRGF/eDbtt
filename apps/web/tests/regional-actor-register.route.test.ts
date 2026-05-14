import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryRegionDataRepo, setRegionDataRepoForTests } from "@features/region";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import { GET, POST } from "@/app/api/admin/region/actors/route";

describe("/api/admin/region/actors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
  });

  it("creates a manual regional actor and lists it region-scoped", async () => {
    const postReq = new NextRequest("http://localhost/api/admin/region/actors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "actor-manual-amt-test",
        regionId: "region-official-010515163",
        slug: "amt-test",
        name: "Amt Test",
        actorType: "verwaltung",
        administrativeUnitType: "amt",
      }),
    });
    const postRes = await POST(postReq);

    expect(postRes.status).toBe(200);
    await expect(postRes.json()).resolves.toMatchObject({
      ok: true,
      actor: {
        id: "actor-manual-amt-test",
        sourceKind: "manual_admin",
        verificationStatus: "review_required",
      },
    });

    const getReq = new NextRequest(
      "http://localhost/api/admin/region/actors?regionId=region-official-010515163&sourceKind=manual_admin",
    );
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      items: [{ id: "actor-manual-amt-test", regionId: "region-official-010515163" }],
    });
  });
});
