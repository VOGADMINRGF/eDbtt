import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryRegionDataRepo, setRegionDataRepoForTests } from "@features/region";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import { GET, POST } from "@/app/api/admin/region/signals/route";
import { POST as REVIEW_POST } from "@/app/api/admin/region/signals/[id]/review/route";

describe("/api/admin/region/signals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
  });

  it("creates review-first signals and allows explicit review transitions", async () => {
    const postReq = new NextRequest("http://localhost/api/admin/region/signals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        regionId: "region-official-01051011",
        title: "Schulweg unsicher",
        summary: "Vor der Schule fehlen sichere Querungen.",
        signalType: "hint",
        submitter: {
          mode: "lightweight_contact",
          displayName: "Elternvertretung",
          contactChannel: "kontakt@example.org",
        },
      }),
    });
    const postRes = await POST(postReq);
    expect(postRes.status).toBe(201);
    const createdBody = await postRes.json();
    expect(createdBody.ok).toBe(true);
    expect(createdBody.signal.reviewStatus).toBe("submitted");

    const reviewReq = new NextRequest(
      `http://localhost/api/admin/region/signals/${createdBody.signal.id}/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewStatus: "in_review" }),
      },
    );
    const reviewRes = await REVIEW_POST(reviewReq, {
      params: Promise.resolve({ id: createdBody.signal.id }),
    });
    expect(reviewRes.status).toBe(200);
    await expect(reviewRes.json()).resolves.toMatchObject({
      ok: true,
      signal: { reviewStatus: "in_review" },
    });

    const getRes = await GET(
      new NextRequest(
        "http://localhost/api/admin/region/signals?regionId=region-official-01051011&reviewStatus=in_review",
      ),
    );
    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      items: [{ regionId: "region-official-01051011", reviewStatus: "in_review" }],
    });
  });
});
