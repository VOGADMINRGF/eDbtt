import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryReviewQueueOperationRepo,
  listReviewQueueOperationAuditEvents,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  buildReviewQueueReadModel: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/reviewQueue", () => ({
  buildReviewQueueReadModel: (...args: unknown[]) => mocks.buildReviewQueueReadModel(...args),
}));

import { POST } from "@/app/api/admin/review/items/[itemId]/route";

describe("/api/admin/review/items/[itemId]", () => {
  beforeEach(() => {
    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
    mocks.requireAdminOrResponse.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
    });
    mocks.buildReviewQueueReadModel.mockResolvedValue({
      items: [
        {
          id: "region_source_result:source-result-1",
        },
      ],
    });
  });

  it("assigns and audits a review queue item without changing product state", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/admin/review/items/region_source_result%3Asource-result-1", {
        method: "POST",
        body: JSON.stringify({
          action: "assign",
          assignedToUserId: "admin-2",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_source_result%3Asource-result-1",
        }),
      },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.record).toMatchObject({
      itemId: "region_source_result:source-result-1",
      operationalStatus: "open",
      assignedToUserId: "admin-2",
    });
    const auditEvents = await listReviewQueueOperationAuditEvents(
      "region_source_result:source-result-1",
    );
    expect(auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "assign",
          nextAssignedToUserId: "admin-2",
          nextOperationalStatus: "open",
        }),
      ]),
    );
  });

  it("requires an explicit note for request_changes", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/admin/review/items/region_source_result%3Asource-result-1", {
        method: "POST",
        body: JSON.stringify({
          action: "request_changes",
        }),
        headers: { "content-type": "application/json" },
      }),
      {
        params: Promise.resolve({
          itemId: "region_source_result%3Asource-result-1",
        }),
      },
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: "review_queue_note_required",
    });
  });
});
