import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  buildRegionAccessContext,
  buildPersistedRegionAccessContext,
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
import { setPricingOrderContractsRuntimeRepoForTests } from "@features/pricing/orderContractsRuntime";
import {
  createInMemorySocialDistributionRepo,
  getSocialDistributionRepo,
  setSocialDistributionRepoForTests,
} from "@features/outputEngine/socialDistributionRuntime";
import {
  mapMembershipToOrganizationRole,
  normalizeMembershipStatus,
} from "@/lib/server/auth/membershipDirectoryRepository";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) =>
    mocks.requireGovernanceActorOrResponse(...args),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
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

const activeContractRecord = {
  id: "pricing-order-studio-social-1",
  orderId: "EDE-20260524-STUDIO-1",
  packageId: "kommune-aktivierung",
  planLabel: "Kommune Aktivierung",
  organizationId: "org-reinickendorf-1",
  organizationName: "Bezirksamt Reinickendorf",
  status: "active",
  contractStatus: "active",
  billingStatus: "operator_verified_contract",
  billingSource: "operator_verified_contract",
  planAssignment: {
    planId: "kommune-aktivierung",
    planLabel: "Kommune Aktivierung",
    scopes: [
      "organization_dashboard",
      "review_queue",
      "content_release",
      "public_share",
      "dossier_studio",
    ],
  },
  accessProvisioningDecision: "activate",
  auditEvents: [
    {
      id: "contract-audit-studio-social-1",
      eventType: "activate",
      organizationId: "org-reinickendorf-1",
      orderId: "EDE-20260524-STUDIO-1",
      previousContractStatus: "accepted",
      nextContractStatus: "active",
      previousBillingStatus: "operator_verified_contract",
      nextBillingStatus: "operator_verified_contract",
      source: "operator_verified_contract",
      planAssignment: {
        planId: "kommune-aktivierung",
        planLabel: "Kommune Aktivierung",
        scopes: [
          "organization_dashboard",
          "review_queue",
          "content_release",
          "public_share",
          "dossier_studio",
        ],
      },
      note: "Betreiber-verifizierter Vertragsprozess.",
      createdAt: "2026-05-24T09:00:00.000Z",
      createdBy: "admin-1",
    },
  ],
  source: "pricing_order",
  createdAt: "2026-05-24T09:00:00.000Z",
  updatedAt: "2026-05-24T09:00:00.000Z",
} as const;

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
  return { masterPost, carouselDraft, distributionDraft, plan };
}

async function buildGovernanceRequestScope(input: {
  userId: string;
  roles: string[];
  actorRole: string;
  isAdmin?: boolean;
  memberships?: typeof unitMembership;
  organizations?: typeof organizations;
}) {
  const memberships = input.memberships ?? [];
  const scopedOrganizations = input.organizations ?? [];
  const organizationId = memberships[0]?.organizationId ?? scopedOrganizations[0]?.id ?? null;
  const regionIds = Array.from(
    new Set(
      memberships
        .map((membership) => membership.regionId)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const actorSource = input.isAdmin ? "session" : memberships.length > 0 ? "local_membership_store" : "session";
  const confidence =
    input.isAdmin ? "admin_fallback" : memberships.length > 0 ? "high" : "limited";
  const membershipStatus =
    normalizeMembershipStatus(memberships[0]) ?? (input.isAdmin ? "admin_fallback" : "none");
  const organizationRole =
    mapMembershipToOrganizationRole(memberships[0]) ?? (input.isAdmin ? "operator_admin" : null);
  const roleLabel = memberships[0]?.roleLabel ?? (input.isAdmin ? "Betreiber-Modus" : null);
  const membershipId = memberships[0]?.id ?? null;
  const user = {
    _id: { toHexString: () => input.userId },
    email: `${input.userId}@example.org`,
    roles: input.roles,
    role: input.roles[0] ?? null,
    sessionValid: true,
  } as any;

  return {
    actorId: input.userId,
    actorType: "session_user",
    email: `${input.userId}@example.org`,
    organizationId,
    membershipStatus,
    organizationRole,
    regionIds,
    isOperatorMode: Boolean(input.isAdmin),
    operatorModeLabel: input.isAdmin ? "Betreiber-Modus" : null,
    sourceOfTruth: actorSource,
    confidence,
    runtimeMarker: input.isAdmin ? "admin_fallback" : memberships.length > 0 ? "runtime_backed" : "fixture_demo",
    sourceBreakdown: {
      actor: actorSource,
      organization: memberships.length > 0 ? "local_membership_store" : "session",
      organizationRole: memberships.length > 0 ? "local_membership_store" : "session",
      regionAccess: input.isAdmin ? "session" : memberships.length > 0 ? "local_membership_store" : "session",
    },
    actor: {
      actorId: input.userId,
      actorType: "session_user",
      email: `${input.userId}@example.org`,
      roles: input.roles,
      governanceRole: input.isAdmin ? "admin" : input.actorRole,
      isOperatorMode: Boolean(input.isAdmin),
      operatorModeLabel: input.isAdmin ? "Betreiber-Modus" : null,
      sourceOfTruth: actorSource,
      confidence,
      runtimeMarker: input.isAdmin ? "admin_fallback" : memberships.length > 0 ? "runtime_backed" : "fixture_demo",
    },
    organizationMembership: {
      organizationId,
      organizationIds: organizationId ? [organizationId] : [],
      verifiedOrganizationIds:
        memberships.length > 0 && membershipStatus !== "none" ? [organizationId].filter(Boolean) as string[] : [],
      membershipId,
      membershipStatus,
      memberships,
      organizations: scopedOrganizations,
      sourceOfTruth: memberships.length > 0 ? "local_membership_store" : "session",
      confidence,
      runtimeMarker: memberships.length > 0 ? "runtime_backed" : "fixture_demo",
    },
    organizationRoleContext: {
      organizationRole,
      roleLabel,
      membershipId,
      sourceOfTruth: memberships.length > 0 ? "local_membership_store" : "session",
      confidence,
      runtimeMarker: memberships.length > 0 ? "runtime_backed" : "fixture_demo",
    },
    regionAccess: await buildPersistedRegionAccessContext({
      userId: input.userId,
      actorRole: input.actorRole,
      isAdmin: Boolean(input.isAdmin),
      roles: input.roles,
      organizationIds: organizationId ? [organizationId] : [],
      regionId: regionIds[0] ?? null,
    }),
    regionAccessSourceOfTruth:
      input.isAdmin ? "session" : memberships.length > 0 ? "local_membership_store" : "session",
    regionAccessConfidence: confidence,
    regionAccessRuntimeMarker:
      input.isAdmin ? "admin_fallback" : memberships.length > 0 ? "runtime_backed" : "fixture_demo",
    user,
  };
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
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue(null);
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
    setSocialDistributionRepoForTests(createInMemorySocialDistributionRepo());
    setPricingOrderContractsRuntimeRepoForTests({
      async listPricingOrdersForOrganization() {
        return [];
      },
    });
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
      requestScope: await buildGovernanceRequestScope({
        userId: "admin-1",
        roles: ["admin"],
        actorRole: "admin",
        isAdmin: true,
      }),
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

  function seedActiveContract() {
    setPricingOrderContractsRuntimeRepoForTests({
      async listPricingOrdersForOrganization() {
        return [activeContractRecord as any];
      },
    });
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
      requestScope: await buildGovernanceRequestScope({
        userId: "staff-1",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
        memberships: unitMembership,
        organizations,
      }),
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
        visibilityState: "private_draft",
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
        visibilityState: "internal_review",
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
      requestScope: await buildGovernanceRequestScope({
        userId: "pending-1",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
      }),
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
      requestScope: await buildGovernanceRequestScope({
        userId: "staff-2",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
        memberships: spandauMembership,
        organizations: spandauOrganizations,
      }),
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
      requestScope: await buildGovernanceRequestScope({
        userId: "org-1",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
        memberships: organizationMembership,
        organizations,
      }),
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

  it("keeps official publication explicit and restricted to publication-approved or admin fallback", async () => {
    seedVerifiedRuntimeMembership();
    const draftId = await seedRegionDraftDossier();
    const payload = buildStudioPayload(draftId);

    const created = await POST(
      buildRequest("POST", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        masterPostDraft: payload.masterPost,
        distributionDraft: payload.distributionDraft,
        carouselDraft: payload.carouselDraft,
        status: "needs_review",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(created.status).toBe(201);

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
      requestScope: await buildGovernanceRequestScope({
        userId: "staff-1",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
        memberships: unitMembership,
        organizations,
      }),
    });

    const blocked = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        action: "approve_publication",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(blocked.status).toBe(403);

    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations,
        memberships: publicationApprovedMembership.map((membership) => ({
          ...membership,
          userId: "publisher-1",
        })),
      }),
    );
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "publisher-1" } },
      roles: ["institutional_actor"],
      actor: {
        userId: "publisher-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
      requestScope: await buildGovernanceRequestScope({
        userId: "publisher-1",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
        memberships: publicationApprovedMembership.map((membership) => ({
          ...membership,
          userId: "publisher-1",
        })),
        organizations,
      }),
    });

    const approved = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        action: "approve_publication",
        note: "Explizite menschliche Freigabe.",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );
    expect(approved.status).toBe(200);
    await expect(approved.json()).resolves.toMatchObject({
      ok: true,
      workspace: {
        status: "needs_review",
        visibilityState: "public_official",
        officialApproval: expect.objectContaining({
          authority: "publication_approved",
          approvedByUserId: "publisher-1",
        }),
      },
      access: {
        canApproveOfficialPublication: true,
      },
    });
  });

  it("creates a review-first social distribution draft and keeps export status explicit", async () => {
    const draftId = await seedRegionDraftDossier();
    const payload = buildStudioPayload(draftId);
    seedActiveContract();
    const distributionMemberships = [
      ...unitMembership.map((membership) => ({
        ...membership,
        userId: "staff-1",
      })),
      ...publicationApprovedMembership.map((membership) => ({
        ...membership,
        id: "membership-publication-social-1",
        userId: "staff-1",
      })),
    ];
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations,
        memberships: distributionMemberships,
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-publisher-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: "unit-1",
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "organization_unit",
            validFrom: "2026-05-24T09:00:00.000Z",
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
            createdAt: "2026-05-24T09:00:00.000Z",
            updatedAt: "2026-05-24T09:00:00.000Z",
            createdBy: "admin-1",
            source: "manual_contract",
            noAutoBilling: true,
            noAutoCharge: true,
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
      requestScope: await buildGovernanceRequestScope({
        userId: "staff-1",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
        memberships: distributionMemberships,
        organizations,
      }),
    });

    const created = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        socialDistributionAction: "create_draft",
        plan: {
          ...payload.plan,
          visibilityState: "public_reviewed",
        },
        selectedChannels: ["website_update", "newsletter_draft"],
        initialStatus: "review_requested",
        note: "Review-first Verteilentwurf.",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );

    expect(created.status).toBe(200);
    const createdBody = await created.json();
    expect(createdBody).toMatchObject({
      ok: true,
      post: {
        organizationId: "org-reinickendorf-1",
        status: "review_requested",
        channels: ["website_update", "newsletter_draft"],
        sourceVisibilityState: "public_reviewed",
      },
    });

    const stored = await getSocialDistributionRepo().getPost(createdBody.post.id);
    expect(stored?.status).toBe("review_requested");
    expect(stored?.status).not.toBe("exported");

    const published = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        socialDistributionAction: "mark_exported",
        postId: createdBody.post.id,
        note: "Als Exportpaket vorbereitet, ohne externe Veröffentlichung.",
      }),
      { params: Promise.resolve({ id: draftId }) },
    );

    expect(published.status).toBe(200);
    await expect(published.json()).resolves.toMatchObject({
      ok: true,
      post: {
        id: createdBody.post.id,
        status: "exported",
      },
    });
  });

  it("blocks social distribution drafts for review-only source visibility", async () => {
    const draftId = await seedRegionDraftDossier();
    const payload = buildStudioPayload(draftId);
    seedActiveContract();
    const distributionMemberships = [
      ...unitMembership.map((membership) => ({
        ...membership,
        userId: "staff-1",
      })),
      ...publicationApprovedMembership.map((membership) => ({
        ...membership,
        id: "membership-publication-social-2",
        userId: "staff-1",
      })),
    ];
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations,
        memberships: distributionMemberships,
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-publisher-2",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: "unit-1",
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "organization_unit",
            validFrom: "2026-05-24T09:00:00.000Z",
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
            createdAt: "2026-05-24T09:00:00.000Z",
            updatedAt: "2026-05-24T09:00:00.000Z",
            createdBy: "admin-1",
            source: "manual_contract",
            noAutoBilling: true,
            noAutoCharge: true,
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
      requestScope: await buildGovernanceRequestScope({
        userId: "staff-1",
        roles: ["institutional_actor"],
        actorRole: "institutional_actor",
        memberships: distributionMemberships,
        organizations,
      }),
    });

    const response = await PATCH(
      buildRequest("PATCH", `http://localhost/api/dossier/${draftId}/studio/workspace`, {
        socialDistributionAction: "create_draft",
        plan: {
          ...payload.plan,
          visibilityState: "internal_review",
        },
        selectedChannels: ["website_update"],
      }),
      { params: Promise.resolve({ id: draftId }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "social_distribution_review_only_source",
    });
  });
});
