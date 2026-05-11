import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryRegionDataRepo, setRegionDataRepoForTests } from "@features/region";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import { GET } from "@/app/api/admin/region/cockpit/[regionId]/route";

describe("/api/admin/region/cockpit/[regionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    setRegionDataRepoForTests(
      createInMemoryRegionDataRepo({
        signals: [
          {
            id: "signal-cockpit-1",
            regionId: "region-official-01051011",
            title: "Hinweis",
            summary: "Reviewbarer Hinweis",
            signalType: "hint",
            reviewStatus: "submitted",
            sourceActorId: null,
            sourceUrls: [],
            submitter: { mode: "anonymous", displayName: null, contactChannel: null },
            guardrails: {
              moderationRequired: true,
              noAutoPublish: true,
              noAutoMandate: true,
              noAutomaticDossierCreation: true,
            },
            createdAt: "2026-05-11T00:00:00.000Z",
            updatedAt: "2026-05-11T00:00:00.000Z",
          },
        ],
      }),
    );
  });

  it("returns a read-only cockpit with regional counts and guardrails", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/region-official-01051011"),
      { params: Promise.resolve({ regionId: "region-official-01051011" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      cockpit: {
        region: { id: "region-official-01051011" },
        signalCount: 1,
        cockpit: {
          guardrails: {
            noCitizenScoring: true,
            noAssociationScoring: true,
            noAutomatedEnforcement: true,
          },
        },
      },
    });
  });
});
