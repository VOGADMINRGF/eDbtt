import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  listOperationalRegions,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
  syncParticipationSignalRecords,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGovernanceActorOrResponse(...args),
}));

import { GET } from "@/app/api/admin/region/participation-signals/route";
import { POST } from "@/app/api/admin/region/participation-signals/[id]/review/route";

const unitMembership = [
  {
    id: "membership-unit-1",
    userId: "staff-1",
    organizationId: "org-reinickendorf-1",
    organizationName: "Bezirksamt Reinickendorf",
    organizationType: "district_office",
    regionId: "bezirk-berlin-reinickendorf",
    unitId: "unit-1",
    unitName: "Beteiligung",
    optionalLocation: null,
    roleLabel: "Beteiligung",
    roleType: "participation_officer",
    verificationStatus: "unit_verified",
    allowedActions: [
      "read_region_dashboard",
      "review_region_signal",
      "create_region_draft",
      "create_dossier_draft",
      "create_anlassraum_draft",
      "attach_signal_to_dossier",
      "submit_for_review",
    ],
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    verifiedBy: "admin-1",
    verifiedAt: "2026-05-14T00:00:00.000Z",
    expiresAt: null,
    revokedAt: null,
    noAutoAuthority: true,
  },
];

const organizations = [
  {
    id: "org-reinickendorf-1",
    name: "Bezirksamt Reinickendorf",
    type: "district_office",
    countryCode: "DE",
    primaryRegionId: "bezirk-berlin-reinickendorf",
    website: "https://reinickendorf.example",
    verificationStatus: "organization_verified",
    createdByUserId: "staff-1",
  },
];

const publicationApprovedMembership = [
  {
    ...unitMembership[0],
    id: "membership-publication-1",
    verificationStatus: "publication_approved",
    allowedActions: [
      "read_region_dashboard",
      "review_region_signal",
      "create_region_draft",
      "create_dossier_draft",
      "create_anlassraum_draft",
      "attach_signal_to_dossier",
      "submit_for_review",
      "approve_publication",
    ],
  },
];

function buildRequest(url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function seedRuntime() {
  const regions = await listOperationalRegions();
  await syncParticipationSignalRecords(regions);
}

describe("admin participation signal review routes", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
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
    await seedRuntime();
  });

  function seedVerifiedRuntimeMembership() {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations,
        memberships: unitMembership,
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: "unit-1",
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "organization_unit",
            validFrom: "2026-05-14T00:00:00.000Z",
            validUntil: null,
            limits: {
              maxRegions: 1,
              maxDossiers: 10,
              maxAnlassraeume: 10,
              maxSignalsPerMonth: 100,
              maxDraftsPerMonth: 25,
              maxUsers: 10,
              factcheckCredits: 0,
            },
            usage: {
              regionsUsed: 0,
              dossiersUsed: 0,
              anlassraeumeUsed: 0,
              signalsThisMonth: 0,
              draftsThisMonth: 0,
              usersUsed: 0,
              factcheckCreditsUsed: 0,
            },
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            createdBy: "admin-1",
            source: "admin_grant",
            noAutoBilling: true,
            noAutoCharge: true,
          },
        ],
      }),
    );
  }

  it("lists persisted review signals for admin without leaking user identifiers", async () => {
    const res = await GET(
      new NextRequest(
        "http://localhost/api/admin/region/participation-signals?regionId=berlin-reinickendorf",
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.signals).toEqual(
      expect.arrayContaining([
      expect.objectContaining({
          sourceType: "public_claim",
          visibilityState: "internal_review",
        }),
        expect.objectContaining({
          reviewStatus: "needs_region_review",
          visibilityState: "internal_review",
        }),
      ]),
    );
    expect(JSON.stringify(body)).not.toContain("userId");
  });

  it("blocks non-admins without verified review access", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "raw-1" } },
      roles: ["region_staff:bezirk-berlin-reinickendorf"],
      actor: {
        userId: "raw-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: [],
        scopedEntityIds: [],
        personTrust: null,
      },
    });

    const listRes = await GET(
      new NextRequest(
        "http://localhost/api/admin/region/participation-signals?regionId=berlin-reinickendorf",
      ),
    );
    expect(listRes.status).toBe(403);

    const reviewRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/participation-signals/region-participation-reinickendorf-claim-001/review",
        { decision: "reject" },
      ),
      {
        params: Promise.resolve({ id: "region-participation-reinickendorf-claim-001" }),
      },
    );
    expect(reviewRes.status).toBe(403);
  });

  it("lets admin confirm region and accept a public signal", async () => {
    const confirmRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/participation-signals/region-participation-needs-region-review-001/review",
        { decision: "confirm_region", regionId: "berlin-reinickendorf" },
      ),
      {
        params: Promise.resolve({ id: "region-participation-needs-region-review-001" }),
      },
    );
    expect(confirmRes.status).toBe(200);

    const acceptRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/participation-signals/region-participation-needs-region-review-001/review",
        { decision: "accept" },
      ),
      {
        params: Promise.resolve({ id: "region-participation-needs-region-review-001" }),
      },
    );
    expect(acceptRes.status).toBe(200);
    await expect(acceptRes.json()).resolves.toMatchObject({
      ok: true,
      record: expect.objectContaining({
        reviewStatus: "accepted",
        regionId: "bezirk-berlin-reinickendorf",
        visibilityState: "public_reviewed",
      }),
    });
  });

  it("lets unit-verified staff with entitlement review within the own region", async () => {
    seedVerifiedRuntimeMembership();
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-1" } },
      roles: ["institutional_actor"],
      actor: {
        userId: "staff-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
    });

    const res = await POST(
      buildRequest(
        "http://localhost/api/admin/region/participation-signals/region-participation-reinickendorf-claim-001/review",
        { decision: "reject", regionId: "berlin-reinickendorf" },
      ),
      {
        params: Promise.resolve({ id: "region-participation-reinickendorf-claim-001" }),
      },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      record: expect.objectContaining({
        reviewStatus: "rejected",
        visibilityState: "blocked",
      }),
    });
  });

  it("blocks unit-verified staff from public_official and allows publication-approved staff", async () => {
    seedVerifiedRuntimeMembership();
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-1" } },
      roles: ["institutional_actor"],
      actor: {
        userId: "staff-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
    });

    const blocked = await POST(
      buildRequest(
        "http://localhost/api/admin/region/participation-signals/region-participation-reinickendorf-claim-001/review",
        { decision: "approve_official" },
      ),
      {
        params: Promise.resolve({ id: "region-participation-reinickendorf-claim-001" }),
      },
    );
    expect(blocked.status).toBe(403);

    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations,
        memberships: publicationApprovedMembership,
      }),
    );
    await syncParticipationSignalRecords(await listOperationalRegions());
    await POST(
      buildRequest(
        "http://localhost/api/admin/region/participation-signals/region-participation-reinickendorf-claim-001/review",
        { decision: "accept" },
      ),
      {
        params: Promise.resolve({ id: "region-participation-reinickendorf-claim-001" }),
      },
    );

    const approved = await POST(
      buildRequest(
        "http://localhost/api/admin/region/participation-signals/region-participation-reinickendorf-claim-001/review",
        { decision: "approve_official", note: "Explizite amtliche Freigabe." },
      ),
      {
        params: Promise.resolve({ id: "region-participation-reinickendorf-claim-001" }),
      },
    );
    expect(approved.status).toBe(200);
    await expect(approved.json()).resolves.toMatchObject({
      ok: true,
      record: expect.objectContaining({
        visibilityState: "public_official",
        officialApproval: expect.objectContaining({
          authority: "publication_approved",
        }),
      }),
    });
  });
});
