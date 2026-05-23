import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
  buildOrganizationDashboardReadModel: vi.fn(),
  prepareContentReleaseTargetFromSourceResult: vi.fn(),
  updateContentReleaseTargetFromSourceResult: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) =>
    mocks.requireGovernanceActorOrResponse(...args),
}));

vi.mock("@features/region", async () => {
  const actual = await vi.importActual<typeof import("@features/region")>("@features/region");
  return {
    ...actual,
    buildOrganizationDashboardReadModel: (...args: unknown[]) =>
      mocks.buildOrganizationDashboardReadModel(...args),
  };
});

vi.mock("@features/contentReleaseWorkbench", async () => {
  const actual = await vi.importActual<typeof import("@features/contentReleaseWorkbench")>(
    "@features/contentReleaseWorkbench",
  );
  return {
    ...actual,
    prepareContentReleaseTargetFromSourceResult: (...args: unknown[]) =>
      mocks.prepareContentReleaseTargetFromSourceResult(...args),
    updateContentReleaseTargetFromSourceResult: (...args: unknown[]) =>
      mocks.updateContentReleaseTargetFromSourceResult(...args),
  };
});

import { POST } from "@/app/api/account/organization/review/content-release/route";

function buildRequestScope(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    organizationId: "org-1",
    membershipStatus: "verified",
    organizationRole: "publication_approved",
    regionIds: ["bezirk-berlin-reinickendorf"],
    isOperatorMode: false,
    operatorModeLabel: null,
    sourceOfTruth: "persistent_membership_store",
    confidence: "high",
    ...overrides,
  };
}

function buildEntitlementSummary(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    currentStatus: "granted",
    state: "aktiv",
    hasActiveEntitlement: true,
    hasTrialEntitlement: false,
    hasMissingEntitlement: false,
    hasExpiredEntitlement: false,
    planLabels: ["Kommune Aktivierung"],
    organizationIds: ["org-1"],
    grants: [
      {
        id: "org-1:content_release",
        organizationId: "org-1",
        organizationName: "Bezirksamt Reinickendorf",
        regionId: "bezirk-berlin-reinickendorf",
        scope: "content_release",
        status: "granted",
        latestDecision: "grant",
        source: "paid_dashboard_entitlement",
        linkedEntitlementId: "entitlement-1",
        linkedPlanLabel: "Kommune Aktivierung",
        note: null,
        billingPending: false,
        productionTruth: true,
        accessEnabled: true,
        noAutoPublicationApproved: true,
        noAutoPublicOfficial: true,
        noAutoPublish: true,
        auditEvents: [],
        updatedAt: "2026-05-23T07:04:00.000Z",
      },
      {
        id: "org-1:public_share",
        organizationId: "org-1",
        organizationName: "Bezirksamt Reinickendorf",
        regionId: "bezirk-berlin-reinickendorf",
        scope: "public_share",
        status: "granted",
        latestDecision: "grant",
        source: "paid_dashboard_entitlement",
        linkedEntitlementId: "entitlement-1",
        linkedPlanLabel: "Kommune Aktivierung",
        note: null,
        billingPending: false,
        productionTruth: true,
        accessEnabled: true,
        noAutoPublicationApproved: true,
        noAutoPublicOfficial: true,
        noAutoPublish: true,
        auditEvents: [],
        updatedAt: "2026-05-23T07:04:00.000Z",
      },
    ],
    operatorDecisionRequired: false,
    billingPending: false,
    nextStepTitle: "Zugriff freigeschaltet",
    nextStepBody: "Scope ist bewusst gesetzt.",
    storeLabel: "Persistente Entitlement-Runtime",
    productionTruth: true,
    guardrails: {
      noPaymentClaim: true,
      noCheckout: true,
    },
    ...overrides,
  };
}

describe("/api/account/organization/review/content-release", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "user-1",
        role: "institutional_actor",
        isAdmin: false,
      },
      roles: ["user"],
      requestScope: buildRequestScope(),
    });
    mocks.updateContentReleaseTargetFromSourceResult.mockResolvedValue({
      id: "content-release-1",
      visibilityState: "public_reviewed",
      noPublicOfficial: true,
    });
    mocks.prepareContentReleaseTargetFromSourceResult.mockResolvedValue({
      id: "content-release-1",
      visibilityState: "internal_review",
      noPublicOfficial: true,
    });
  });

  it("lets publication-approved organizations manage visibility without setting public_official", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      organization: {
        primaryOrganizationId: "org-1",
      },
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [
        {
          id: "create_handoff:own-1",
          contentReleaseWorkbench: {
            sourceKind: "create_handoff",
            sourceId: "handoff-1",
            targets: [
              {
                targetType: "topic_page",
              },
            ],
          },
          moderationPermission: {
            canPrepareOwnContentRelease: true,
            canMakeOwnContentVisible: true,
            canArchiveOwnContent: true,
          },
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "make_visible",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mocks.updateContentReleaseTargetFromSourceResult).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceKind: "create_handoff",
        sourceResultId: "handoff-1",
        targetType: "topic_page",
        action: "make_visible",
        requestedBy: "user-1",
      }),
    );
    expect(body.requestScope).toMatchObject({
      organizationId: "org-1",
      isOperatorMode: false,
    });
    expect(mocks.updateContentReleaseTargetFromSourceResult).not.toHaveBeenCalledWith(
      expect.objectContaining({
        visibilityState: "public_official",
      }),
    );
  });

  it("blocks visibility changes when the organization lacks publication permission", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      organization: {
        primaryOrganizationId: "org-1",
      },
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [
        {
          id: "create_handoff:own-1",
          contentReleaseWorkbench: {
            sourceKind: "create_handoff",
            sourceId: "handoff-1",
            targets: [
              {
                targetType: "topic_page",
              },
            ],
          },
          moderationPermission: {
            canPrepareOwnContentRelease: true,
            canMakeOwnContentVisible: false,
            canArchiveOwnContent: false,
          },
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "make_visible",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.updateContentReleaseTargetFromSourceResult).not.toHaveBeenCalled();
  });

  it("blocks content release writes for evidence-required or non-writing memberships", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "user-1",
        role: "institutional_actor",
        isAdmin: false,
      },
      roles: ["user"],
      requestScope: buildRequestScope({
        membershipStatus: "evidence_required",
        organizationRole: "reviewer",
      }),
    });
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      organization: {
        primaryOrganizationId: "org-1",
      },
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [
        {
          id: "create_handoff:own-1",
          contentReleaseWorkbench: {
            sourceKind: "create_handoff",
            sourceId: "handoff-1",
            targets: [
              {
                targetType: "topic_page",
              },
            ],
          },
          moderationPermission: {
            canPrepareOwnContentRelease: true,
            canMakeOwnContentVisible: true,
            canArchiveOwnContent: true,
          },
        },
      ],
    });

    const evidenceRequiredResponse = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "prepare_target",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(evidenceRequiredResponse.status).toBe(403);
    expect(mocks.prepareContentReleaseTargetFromSourceResult).not.toHaveBeenCalled();

    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "user-1",
        role: "institutional_actor",
        isAdmin: false,
      },
      roles: ["user"],
      requestScope: buildRequestScope({
        membershipStatus: "verified",
        organizationRole: "viewer",
      }),
    });

    const viewerResponse = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "archive_target",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(viewerResponse.status).toBe(403);
  });

  it("blocks visibility changes when the public_share entitlement scope is missing", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      organization: {
        primaryOrganizationId: "org-1",
      },
      entitlementSummary: buildEntitlementSummary({
        currentStatus: "limited",
        state: "eingeschränkt",
        grants: [
          {
            ...buildEntitlementSummary().grants[0],
          },
        ],
      }),
      openReviewItems: [
        {
          id: "create_handoff:own-1",
          contentReleaseWorkbench: {
            sourceKind: "create_handoff",
            sourceId: "handoff-1",
            targets: [
              {
                targetType: "topic_page",
              },
            ],
          },
          moderationPermission: {
            canPrepareOwnContentRelease: true,
            canMakeOwnContentVisible: true,
            canArchiveOwnContent: true,
          },
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "make_visible",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error).toBe("content_release_public_share_scope_forbidden");
  });

  it("blocks content release writes when contract-backed scopes are suspended", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      organization: {
        primaryOrganizationId: "org-1",
      },
      entitlementSummary: buildEntitlementSummary({
        currentStatus: "suspended",
        grants: buildEntitlementSummary().grants.map((grant) => ({
          ...grant,
          status: "suspended",
          latestDecision: "suspend",
          accessEnabled: false,
        })),
      }),
      openReviewItems: [
        {
          id: "create_handoff:own-1",
          contentReleaseWorkbench: {
            sourceKind: "create_handoff",
            sourceId: "handoff-1",
            targets: [
              {
                targetType: "topic_page",
              },
            ],
          },
          moderationPermission: {
            canPrepareOwnContentRelease: true,
            canMakeOwnContentVisible: true,
            canArchiveOwnContent: true,
          },
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "prepare_target",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error).toBe("content_release_entitlement_scope_forbidden");
  });
});
