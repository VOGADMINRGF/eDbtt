import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  readHistory: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@/features/create/attachDraftReviewQueue", () => ({
  getCreatePrepareAttachDraftHistory: (...args: unknown[]) => mocks.readHistory(...args),
}));

import { GET as historyGET } from "@/app/api/admin/create/attach-drafts/[draftId]/history/route";

const gateAccess = {
  user: { _id: { toHexString: () => "u-review" } },
  roles: ["reviewer"],
  actor: {
    userId: "u-review",
    role: "reviewer",
    isAdmin: false,
    scopedOwnerIds: ["owner-1"],
    scopedEntityIds: ["owner-1"],
    personTrust: "verified",
  },
};

function req(url: string) {
  return new NextRequest(url);
}

describe("create prepare-attach history route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
  });

  it("returns productive history payload", async () => {
    mocks.readHistory.mockResolvedValue({
      draft: {
        draftId: "65f000000000000000000011",
        reviewState: "accepted_for_apply",
        applyState: "apply_failed",
        version: 3,
      },
      events: [
        {
          eventType: "review",
          eventId: "r1",
          draftId: "65f000000000000000000011",
          actorUserId: "u-review",
          createdAt: "2026-03-20T11:00:00.000Z",
        },
      ],
      latestEvent: {
        eventType: "review",
        eventId: "r1",
      },
      reviewEvents: [],
      applyEvents: [],
      hasMore: true,
      nextCursor: "cursor-2",
      type: "all",
      limit: 20,
    });

    const res = await historyGET(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/history?limit=20&type=all&cursor=cursor-1"),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      draft: { draftId: "65f000000000000000000011", version: 3 },
      latestEvent: { eventId: "r1" },
      hasMore: true,
      nextCursor: "cursor-2",
      type: "all",
      limit: 20,
    });
    expect(body.nextScanCursor).toBeUndefined();
  });

  it("maps invalid id / not found / forbidden", async () => {
    let res = await historyGET(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/history?type=bad"),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(400);

    mocks.readHistory.mockRejectedValueOnce(new Error("invalid_attach_draft_id"));
    res = await historyGET(
      req("http://localhost/api/admin/create/attach-drafts/bad/history"),
      { params: Promise.resolve({ draftId: "bad" }) },
    );
    expect(res.status).toBe(400);

    mocks.readHistory.mockRejectedValueOnce(new Error("invalid_history_cursor"));
    res = await historyGET(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/history?cursor=bad"),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(400);

    mocks.readHistory.mockRejectedValueOnce(new Error("attach_draft_not_found"));
    res = await historyGET(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000099/history"),
      { params: Promise.resolve({ draftId: "65f000000000000000000099" }) },
    );
    expect(res.status).toBe(404);

    mocks.requireGate.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "forbidden_governance_role" }), { status: 403 }),
    );
    res = await historyGET(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/history"),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(403);
  });
});
