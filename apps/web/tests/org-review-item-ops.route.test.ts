import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryReviewQueueOperationRepo,
  listReviewQueueOperationAuditEvents,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
  buildOrganizationDashboardReadModel: vi.fn(),
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

import { POST } from "@/app/api/account/organization/review/items/[itemId]/route";

function buildRequestScope(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    organizationId: "org-reinickendorf-1",
    membershipStatus: "verified",
    organizationRole: "reviewer",
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
    organizationIds: ["org-reinickendorf-1"],
    grants: [
      {
        id: "org-reinickendorf-1:review_queue",
        organizationId: "org-reinickendorf-1",
        organizationName: "Bezirksamt Reinickendorf",
        regionId: "bezirk-berlin-reinickendorf",
        scope: "review_queue",
        status: "granted",
        latestDecision: "grant",
        source: "paid_dashboard_entitlement",
        linkedEntitlementId: "entitlement-1",
        linkedPlanLabel: "Kommune Aktivierung",
        note: null,
        billingPending: false,
        productionTruth: true,
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

describe("/api/account/organization/review/items/[itemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "user-1",
        role: "institutional_actor",
        isAdmin: false,
      },
      roles: ["user"],
      requestScope: buildRequestScope(),
    });
  });

  it("lets a verified organization add notes and set its own item in review", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [
        {
          id: "region_signal_draft:draft-1",
          moderationPermission: {
            canOperateOwnReviewItem: true,
            allowedActions: ["add_note", "request_changes", "mark_in_review"],
          },
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/region_signal_draft%3Adraft-1", {
        method: "POST",
        body: JSON.stringify({
          action: "mark_in_review",
          note: "Bitte im eigenen Team zuerst prüfen.",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_signal_draft%3Adraft-1",
        }),
      },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.record).toMatchObject({
      itemId: "region_signal_draft:draft-1",
      operationalStatus: "in_review",
      latestNote: "Bitte im eigenen Team zuerst prüfen.",
    });
    expect(body.requestScope).toMatchObject({
      organizationId: "org-reinickendorf-1",
      isOperatorMode: false,
    });
    const auditEvents = await listReviewQueueOperationAuditEvents("region_signal_draft:draft-1");
    expect(auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "mark_in_review",
          byUserId: "user-1",
        }),
      ]),
    );
  });

  it("keeps foreign items out of the organization-scoped route", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/region_signal_draft%3Aforeign", {
        method: "POST",
        body: JSON.stringify({
          action: "add_note",
          note: "Fremdes Item darf nicht sichtbar sein.",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_signal_draft%3Aforeign",
        }),
      },
    );

    expect(response.status).toBe(404);
    await expect(listReviewQueueOperationAuditEvents("region_signal_draft:foreign")).resolves.toEqual([]);
  });

  it("allows unit-verified ready only for own scope and rejects missing permission", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [
        {
          id: "create_handoff:own-1",
          moderationPermission: {
            canOperateOwnReviewItem: true,
            allowedActions: ["mark_ready"],
          },
        },
      ],
    });

    const success = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/create_handoff%3Aown-1", {
        method: "POST",
        body: JSON.stringify({
          action: "mark_ready",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "create_handoff%3Aown-1",
        }),
      },
    );

    expect(success.status).toBe(200);

    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [
        {
          id: "create_handoff:own-1",
          moderationPermission: {
            canOperateOwnReviewItem: true,
            allowedActions: ["add_note"],
          },
        },
      ],
    });

    const denied = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/create_handoff%3Aown-1", {
        method: "POST",
        body: JSON.stringify({
          action: "mark_ready",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "create_handoff%3Aown-1",
        }),
      },
    );

    const body = await denied.json();
    expect(denied.status).toBe(403);
    expect(body.error).toBe("organization_review_operation_forbidden");
  });

  it("keeps pending or evidence-required contexts out of moderation actions", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "user-1",
        role: "institutional_actor",
        isAdmin: false,
      },
      roles: ["user"],
      requestScope: buildRequestScope({
        membershipStatus: "evidence_required",
      }),
    });
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      entitlementSummary: buildEntitlementSummary({
        currentStatus: "none",
        grants: [],
      }),
      openReviewItems: [
        {
          id: "region_signal_draft:pending-1",
          moderationPermission: {
            canOperateOwnReviewItem: false,
            allowedActions: [],
          },
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/region_signal_draft%3Apending-1", {
        method: "POST",
        body: JSON.stringify({
          action: "add_note",
          note: "Noch kein bestätigter Scope.",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_signal_draft%3Apending-1",
        }),
      },
    );

    expect(response.status).toBe(403);
  });

  it("blocks review actions when no review_queue entitlement scope is granted", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      entitlementSummary: buildEntitlementSummary({
        currentStatus: "pending_operator_decision",
        state: "in Entscheidung",
        hasActiveEntitlement: false,
        hasMissingEntitlement: true,
        grants: [],
      }),
      openReviewItems: [
        {
          id: "region_signal_draft:decision-open",
          moderationPermission: {
            canOperateOwnReviewItem: true,
            allowedActions: ["add_note"],
          },
        },
      ],
    });

    const response = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/region_signal_draft%3Adecision-open", {
        method: "POST",
        body: JSON.stringify({
          action: "add_note",
          note: "Ohne expliziten Grant gesperrt.",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_signal_draft%3Adecision-open",
        }),
      },
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error).toBe("organization_entitlement_scope_forbidden");
  });

  it("keeps suspended or revoked memberships out of write actions", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "user-1",
        role: "institutional_actor",
        isAdmin: false,
      },
      roles: ["user"],
      requestScope: buildRequestScope({
        membershipStatus: "suspended",
        organizationRole: null,
      }),
    });
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
      entitlementSummary: buildEntitlementSummary(),
      openReviewItems: [
        {
          id: "region_signal_draft:suspended-1",
          moderationPermission: {
            canOperateOwnReviewItem: true,
            allowedActions: ["add_note"],
          },
        },
      ],
    });

    const suspendedResponse = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/region_signal_draft%3Asuspended-1", {
        method: "POST",
        body: JSON.stringify({
          action: "add_note",
          note: "Kein Schreibzugriff bei suspendierter Membership.",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_signal_draft%3Asuspended-1",
        }),
      },
    );

    expect(suspendedResponse.status).toBe(403);

    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "user-1",
        role: "institutional_actor",
        isAdmin: false,
      },
      roles: ["user"],
      requestScope: buildRequestScope({
        membershipStatus: "revoked",
        organizationRole: null,
      }),
    });

    const revokedResponse = await POST(
      new NextRequest("http://localhost/api/account/organization/review/items/region_signal_draft%3Arevoked-1", {
        method: "POST",
        body: JSON.stringify({
          action: "add_note",
          note: "Kein Schreibzugriff bei widerrufener Membership.",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_signal_draft%3Arevoked-1",
        }),
      },
    );

    expect(revokedResponse.status).toBe(403);
  });
});
