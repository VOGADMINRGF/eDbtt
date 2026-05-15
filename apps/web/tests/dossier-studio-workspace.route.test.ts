import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  buildRegionAccessContext,
  createInMemoryRegionDataRepo,
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  createInMemoryRegionSignalDraftPersistence,
  createRegionSignalDraft,
  setRegionDataRepoForTests,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
  setRegionSignalDraftPersistenceForTests,
} from "@features/region";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier";
import {
  demoDossierForOutputEngine,
  buildDraftRecord,
  buildSocialDistributionPlan,
  generateMasterPost,
  generateOutputPackage,
  generateSocialCarouselOutput,
  getSocialPublishingPolicy,
} from "@features/outputEngine";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) =>
    mocks.requireGovernanceActorOrResponse(...args),
}));

import {
  GET,
  PATCH,
  POST,
} from "@/app/api/dossier/[id]/studio/workspace/route";

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

const organizationMembership = [
  {
    ...unitMembership[0],
    id: "membership-org-1",
    userId: "org-1",
    verificationStatus: "organization_verified",
    unitId: null,
    unitName: null,
    allowedActions: ["read_region_dashboard"],
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

const spandauMembership = [
  {
    ...unitMembership[0],
    id: "membership-spandau-1",
    organizationId: "org-spandau-1",
    organizationName: "Bezirksamt Spandau",
    regionId: "bezirk-berlin-spandau",
  },
];

const spandauOrganizations = [
  {
    id: "org-spandau-1",
    name: "Bezirksamt Spandau",
    type: "district_office",
    countryCode: "DE",
    primaryRegionId: "bezirk-berlin-spandau",
    website: "https://spandau.example",
    verificationStatus: "organization_verified",
    createdByUserId: "staff-2",
  },
];

function buildRequest(
  method: "GET" | "POST" | "PATCH",
  url: string,
  body?: Record<string, unknown>,
) {
  return new NextRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function buildStudioPayload(dossierId: string) {
  const pkg = generateOutputPackage(
    {
      ...demoDossierForOutputEngine,
      id: dossierId,
    },
    {
      generatedAt: demoDossierForOutputEngine.updatedAt,
      baseUrl: "https://edebatte.org",
    },
  );
  const masterPost = generateMasterPost(pkg);
  const carouselDraft = generateSocialCarouselOutput(pkg);
  const plan = buildSocialDistributionPlan(masterPost, carouselDraft, {
    policy: getSocialPublishingPolicy(),
  });
  const distributionDraft = buildDraftRecord({
    plan,
    selectedChannels: plan.selectedChannels,
    reviewRequired: true,
  });
  return { masterPost, carouselDraft, distributionDraft };
}

async function seedRegionDraftDossier() {
  const accessContext = buildRegionAccessContext({
    userId: "admin-1",
    actorRole: "admin",
    isAdmin: true,
    roles: ["admin"],
  });
  const result = await createRegionSignalDraft({
    signalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
    regionId: "berlin-reinickendorf",
    target: "dossier",
    accessContext,
    requestedBy: "admin-1",
  });
  if (!result.ok || !result.draftId) {
    throw new Error("failed_to_seed_region_draft");
  }
  return result.draftId;
}

describe("/api/dossier/[id]/studio/workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "admin-1" } },
      roles: ["admin"],
      actor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
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

  it("returns an empty server state for admin before a workspace exists", async () => {
    const draftId = await seedRegionDraftDossier();

    const res = await GET(
      buildRequest("GET", `http://localhost/api/dossier/${draftId}/studio/workspace`),
      { params: Promise.resolve({ id: draftId }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      workspace: null,
      access: {
        adminFallback: true,
        canRead: true,
        canEdit: true,
      },
    });
  });

  it("creates and updates a draft workspace for unit-verified staff with active entitlement", async () => {
    seedVerifiedRuntimeMembership();
    const draftId = await seedRegionDraftDossier();
    const payload = buildStudioPayload(draftId);
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

    const created = await POST(
      buildRequest("POST", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        masterPostDraft: payload.masterPost,
        distributionDraft: payload.distributionDraft,
        carouselDraft: payload.carouselDraft,
      }),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(created.status).toBe(201);
    await expect(created.json()).resolves.toMatchObject({
      ok: true,
      workspace: {
        dossierId: draftId,
        status: "draft",
        guardrails: {
          noAutoPublish: true,
          noSocialPublishing: true,
          reviewRequired: true,
          localStorageIsNotProduction: true,
        },
      },
      access: {
        canRead: true,
        canEdit: true,
      },
    });

    const updated = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        reviewNotes: "Review jetzt erforderlich",
        status: "needs_review",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      ok: true,
      workspace: {
        dossierId: draftId,
        status: "needs_review",
        reviewNotes: "Review jetzt erforderlich",
      },
    });
  });

  it("blocks non-admin writers without verified unit membership and entitlement", async () => {
    const draftId = await seedRegionDraftDossier();
    const payload = buildStudioPayload(draftId);
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "pending-1" } },
      roles: ["institutional_actor"],
      actor: {
        userId: "pending-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
    });

    const res = await POST(
      buildRequest("POST", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        masterPostDraft: payload.masterPost,
      }),
      { params: Promise.resolve({ id: draftId }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "studio_workspace_write_forbidden",
    });
  });

  it("blocks writers with verified access in the wrong region", async () => {
    const draftId = await seedRegionDraftDossier();
    const payload = buildStudioPayload(draftId);
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: spandauOrganizations,
        memberships: spandauMembership,
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-spandau-1",
            organizationId: "org-spandau-1",
            organizationName: "Bezirksamt Spandau",
            organizationType: "district_office",
            regionId: "bezirk-berlin-spandau",
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
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-2" } },
      roles: ["institutional_actor"],
      actor: {
        userId: "staff-2",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-spandau-1"],
        scopedEntityIds: ["org-spandau-1"],
        personTrust: null,
      },
    });

    const res = await POST(
      buildRequest("POST", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        masterPostDraft: payload.masterPost,
      }),
      { params: Promise.resolve({ id: draftId }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "studio_workspace_write_forbidden",
    });
  });

  it("keeps organization-verified users read-only and rejects unsupported published-like payloads", async () => {
    const draftId = await seedRegionDraftDossier();
    const payload = buildStudioPayload(draftId);
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations,
        memberships: organizationMembership,
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-org-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: null,
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "organization",
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
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "org-1" } },
      roles: ["institutional_actor"],
      actor: {
        userId: "org-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
    });

    const readRes = await GET(
      buildRequest("GET", `http://localhost/api/dossier/${draftId}/studio/workspace`),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(readRes.status).toBe(200);

    const writeRes = await POST(
      buildRequest("POST", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        masterPostDraft: payload.masterPost,
      }),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(writeRes.status).toBe(403);

    const invalidStatusRes = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        status: "published",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(invalidStatusRes.status).toBe(403);
  });

  it("rejects published-like payloads even for admin writers", async () => {
    const draftId = await seedRegionDraftDossier();

    const res = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        status: "published",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
    });
  });
});
