import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryRegionDataRepo,
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  createInMemoryRegionSignalDraftPersistence,
  listRegionSignalDraftRecords,
  setRegionDataRepoForTests,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
  setRegionSignalDraftPersistenceForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGovernanceActorOrResponse(...args),
}));

import { POST } from "@/app/api/admin/region/signals/[id]/draft/route";

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

function buildRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/api/admin/region/signals/[id]/draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
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
  });

  function seedVerifiedRuntimeMembership() {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations,
        memberships: unitMembership,
      }),
    );
  }

  function seedActiveEntitlement() {
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

  it("creates a dossier draft for admin from an accepted signal and keeps it review-gated", async () => {
    const res = await POST(
      buildRequest(
        "http://localhost/api/admin/region/signals/region-feed-signal-reinickendorf-school-renovation-accepted-001/draft",
        {
          regionId: "berlin-reinickendorf",
          target: "dossier",
        },
      ),
      {
        params: Promise.resolve({
          id: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        }),
      },
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      draftType: "dossier",
      reviewStatus: "needs_review",
      guardrails: {
        noAutoPublish: true,
        noAutoVote: true,
        noAutoMandate: true,
        noTenderMonitoring: true,
        noProcurementMonitoring: true,
        reviewRequired: true,
      },
    });

    const records = await listRegionSignalDraftRecords();
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          draftType: "dossier",
          authoritySource: "admin_fallback",
          adminFallback: true,
          targetVisibility: "non_public",
        }),
      ]),
    );
  });

  it("allows fixture-backed unit-verified staff to create dossier and anlassraum drafts in their own region", async () => {
    seedVerifiedRuntimeMembership();
    seedActiveEntitlement();
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

    const dossierRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/signals/region-feed-signal-reinickendorf-school-renovation-accepted-001/draft",
        { regionId: "berlin-reinickendorf", target: "dossier" },
      ),
      {
        params: Promise.resolve({
          id: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        }),
      },
    );
    const anlassraumRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/signals/region-feed-signal-reinickendorf-school-renovation-accepted-001/draft",
        {
          regionId: "berlin-reinickendorf",
          target: "anlassraum",
          title: "Bildung & Schulinfrastruktur Reinickendorf",
          summary: "Reviewpflichtiger Anlassraum-Draft",
        },
      ),
      {
        params: Promise.resolve({
          id: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        }),
      },
    );

    expect(dossierRes.status).toBe(201);
    expect(anlassraumRes.status).toBe(201);
    await expect(dossierRes.json()).resolves.toMatchObject({ ok: true, draftType: "dossier" });
    await expect(anlassraumRes.json()).resolves.toMatchObject({ ok: true, draftType: "anlassraum" });
  });

  it("blocks raw roles and wrong-region requests and keeps non-accepted signals from becoming drafts", async () => {
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

    const rawRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/signals/region-feed-signal-reinickendorf-school-renovation-accepted-001/draft",
        { regionId: "berlin-reinickendorf", target: "dossier" },
      ),
      {
        params: Promise.resolve({
          id: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        }),
      },
    );
    expect(rawRes.status).toBe(403);
    await expect(rawRes.json()).resolves.toMatchObject({
      ok: false,
      blockedReason: "missing_permission",
    });

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
    seedVerifiedRuntimeMembership();
    seedActiveEntitlement();

    const wrongRegionRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/signals/region-feed-signal-reinickendorf-school-renovation-accepted-001/draft",
        { regionId: "berlin-spandau", target: "dossier" },
      ),
      {
        params: Promise.resolve({
          id: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        }),
      },
    );
    expect(wrongRegionRes.status).toBe(403);
    await expect(wrongRegionRes.json()).resolves.toMatchObject({
      ok: false,
      blockedReason: "wrong_region",
    });

    const draftSignalRes = await POST(
      buildRequest(
        "http://localhost/api/admin/region/signals/region-feed-signal-reinickendorf-citizen-office-001/draft",
        { regionId: "berlin-reinickendorf", target: "dossier" },
      ),
      {
        params: Promise.resolve({
          id: "region-feed-signal-reinickendorf-citizen-office-001",
        }),
      },
    );
    expect(draftSignalRes.status).toBe(400);
    await expect(draftSignalRes.json()).resolves.toMatchObject({
      ok: false,
      blockedReason: "signal_not_accepted",
    });
  });

  it("keeps procurement-flavoured accepted signals out of scope", async () => {
    seedVerifiedRuntimeMembership();
    seedActiveEntitlement();
    setRegionDataRepoForTests(
      createInMemoryRegionDataRepo({
        signals: [
          {
            id: "signal-procurement-route-1",
            regionId: "bezirk-berlin-reinickendorf",
            title: "Ausschreibung mit accepted Reviewstatus",
            summary: "Akzeptierter Hinweis mit Procurement-Bezug.",
            signalType: "topic_proposal",
            reviewStatus: "accepted",
            sourceActorId: null,
            sourceUrls: [],
            submitter: { mode: "registered_reference", displayName: "Test", contactChannel: null },
            guardrails: {
              moderationRequired: true,
              noAutoPublish: true,
              noAutoMandate: true,
              noAutomaticDossierCreation: true,
            },
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
          },
        ],
      }),
    );

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
        "http://localhost/api/admin/region/signals/signal-procurement-route-1/draft",
        { regionId: "berlin-reinickendorf", target: "dossier" },
      ),
      {
        params: Promise.resolve({ id: "signal-procurement-route-1" }),
      },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      blockedReason: "tender_or_procurement_out_of_scope",
    });
  });

  it("blocks verified staff without entitlement even for accepted signals", async () => {
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
        "http://localhost/api/admin/region/signals/region-feed-signal-reinickendorf-school-renovation-accepted-001/draft",
        { regionId: "berlin-reinickendorf", target: "dossier" },
      ),
      {
        params: Promise.resolve({
          id: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        }),
      },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      blockedReason: "missing_permission",
    });
  });
});
