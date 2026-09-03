import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
  buildOrganizationDashboardReadModel: vi.fn(),
  prepareContentReleaseTargetFromSourceResult: vi.fn(),
  executeServerAuthoritativeContentReleaseAction: vi.fn(),
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
  };
});

vi.mock("@/features/ai/aiTransparencyContentReleaseServer", () => ({
  executeServerAuthoritativeContentReleaseAction: (...args: unknown[]) =>
    mocks.executeServerAuthoritativeContentReleaseAction(...args),
  resolveServerAiTransparencyResponsibleRole: (input: {
    role?: string | null;
    isAdmin: boolean;
  }) => (input.isAdmin ? "admin" : input.role ?? null),
}));

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

function buildOpenReviewReadModel() {
  return {
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
          targets: [{ targetType: "topic_page" }],
        },
        moderationPermission: {
          canPrepareOwnContentRelease: true,
          canMakeOwnContentVisible: true,
          canArchiveOwnContent: true,
        },
      },
    ],
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
    mocks.executeServerAuthoritativeContentReleaseAction.mockResolvedValue({
      allowed: true,
      blockers: [],
      target: {
        id: "content-release-1",
        visibilityState: "public_reviewed",
        noPublicOfficial: true,
      },
      aiTransparency: null,
    });
    mocks.prepareContentReleaseTargetFromSourceResult.mockResolvedValue({
      id: "content-release-1",
      visibilityState: "internal_review",
      noPublicOfficial: true,
    });
  });

  it("lets publication-approved organizations manage visibility without setting public_official", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue(
      buildOpenReviewReadModel(),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "make_visible",
          aiClassification: "human_only",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mocks.executeServerAuthoritativeContentReleaseAction).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceKind: "create_handoff",
        sourceId: "handoff-1",
        targetType: "topic_page",
        action: "make_visible",
        classification: "human_only",
        actor: {
          userId: "user-1",
          responsibleRole: "institutional_actor",
        },
      }),
    );
    expect(body.requestScope).toMatchObject({
      organizationId: "org-1",
      isOperatorMode: false,
    });
    expect(body.record.noPublicOfficial).toBe(true);
  });

  it("blocks public visibility fail-closed when AI transparency truth is missing", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue(
      buildOpenReviewReadModel(),
    );
    mocks.executeServerAuthoritativeContentReleaseAction.mockResolvedValueOnce({
      allowed: false,
      blockers: ["classification_required"],
      target: null,
      aiTransparency: null,
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

    expect(response.status).toBe(409);
    expect(body.error).toBe("ai_transparency_guard_blocked");
    expect(body.blockers).toContain("classification_required");
  });

  it.each([
    ["frei erfundene auditRef", { humanReview: { auditRef: "forged-review" } }],
    ["gefälschte responsibleRole", { editorialApproval: { responsibleRole: "admin" } }],
    ["approved true", { editorialApproval: { approved: true } }],
    ["completed true", { humanReview: { completed: true } }],
    ["fremde Artifact-ID", { artifactId: "foreign-artifact" }],
    ["fremde Source-ID", { integrityBinding: { sourceId: "foreign-source" } }],
    ["anderes Target", { integrityBinding: { targetId: "foreign-target" } }],
    ["clientseitiges human_only", { status: "human_only" }],
    ["manipulierte Provenienz", { provenance: { verificationRef: "forged-trace" } }],
  ])("rejects client-asserted %s before the authoritative resolver", async (_label, aiTransparency) => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue(
      buildOpenReviewReadModel(),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/content-release", {
        method: "POST",
        body: JSON.stringify({
          sourceKind: "create_handoff",
          sourceId: "handoff-1",
          targetType: "topic_page",
          action: "make_visible",
          aiClassification: "human_only",
          aiTransparency,
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.executeServerAuthoritativeContentReleaseAction).not.toHaveBeenCalled();
  });

  it.each(["unknown", "ai_generated_unreviewed"])(
    "rejects unsupported classification %s fail-closed",
    async (aiClassification) => {
      const response = await POST(
        new NextRequest("http://localhost/api/account/organization/review/content-release", {
          method: "POST",
          body: JSON.stringify({
            sourceKind: "create_handoff",
            sourceId: "handoff-1",
            targetType: "topic_page",
            action: "make_visible",
            aiClassification,
          }),
          headers: { "content-type": "application/json" },
        }),
      );
      expect(response.status).toBe(400);
      expect(mocks.executeServerAuthoritativeContentReleaseAction).not.toHaveBeenCalled();
    },
  );

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
    expect(mocks.executeServerAuthoritativeContentReleaseAction).not.toHaveBeenCalled();
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
