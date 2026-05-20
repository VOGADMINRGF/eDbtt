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
    });
  });

  it("lets a verified organization add notes and set its own item in review", async () => {
    mocks.buildOrganizationDashboardReadModel.mockResolvedValue({
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
});
