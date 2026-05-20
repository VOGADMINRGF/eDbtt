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
    membershipStatus: "publication_approved",
    organizationRole: "participation_officer",
    regionIds: ["bezirk-berlin-reinickendorf"],
    isOperatorMode: false,
    operatorModeLabel: null,
    sourceOfTruth: "persisted_membership_runtime",
    confidence: "high",
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
});
