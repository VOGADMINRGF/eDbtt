import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createInMemoryRegionDataRepo, setRegionDataRepoForTests } from "@features/region";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGovernanceActorOrResponse(...args),
}));

import { GET } from "@/app/api/admin/region/cockpit/[regionId]/route";

describe("/api/admin/region/cockpit/[regionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "admin-1" } },
      roles: ["admin"],
      actor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["org-1"],
        scopedEntityIds: ["org-1"],
        personTrust: null,
      },
    });
    setRegionDataRepoForTests(
      createInMemoryRegionDataRepo({
        signals: [
          {
            id: "signal-cockpit-1",
            regionId: "bezirk-berlin-reinickendorf",
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

  it("returns a read-only cockpit with regional signals, suggestions and guardrails", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      cockpit: {
        region: { id: "bezirk-berlin-reinickendorf" },
        accessSummary: {
          canReadRegionDashboard: true,
          canCreateDossierDraft: true,
        },
        guardrails: {
          noAutoPublish: true,
          noAutoDossierCreation: true,
          noAutoAnlassraumCreation: true,
          noTenderMonitoring: true,
        },
        feedSignals: expect.arrayContaining([
          expect.objectContaining({
            title: "Pilot-Fall: Hinweise zu Schulsanierung und Bauzustand",
            provenance: expect.objectContaining({ dataOrigin: "pilot_fixture" }),
          }),
        ]),
        suggestedDossiers: expect.arrayContaining([
          expect.objectContaining({
            title: "Sanierung von Schulen im Bezirk",
            noAutoCreateDossier: true,
          }),
        ]),
      },
    });
  });

  it("blocks pending self-declared users from the region dashboard", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "pending-1" } },
      roles: [],
      actor: {
        userId: "pending-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: [],
        scopedEntityIds: [],
        personTrust: null,
      },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "region_dashboard_forbidden",
    });
  });

  it("blocks raw region roles without verified membership context", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-raw-1" } },
      roles: ["region_staff:bezirk-berlin-reinickendorf"],
      actor: {
        userId: "staff-raw-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: [],
        scopedEntityIds: [],
        personTrust: null,
      },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "region_dashboard_forbidden",
    });
  });
});
