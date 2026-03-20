import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  listQueue: vi.fn(),
  reviewDraft: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@/features/create/attachDraftReviewQueue", () => ({
  normalizeCreatePrepareAttachDraftReviewState: (value: string | null | undefined) => {
    const normalized = String(value || "all").toLowerCase();
    if (normalized === "pending") return "pending";
    if (normalized === "accepted_for_apply") return "accepted_for_apply";
    if (normalized === "rejected") return "rejected";
    if (normalized === "parked") return "parked";
    return "all";
  },
  listCreatePrepareAttachDraftQueue: (...args: unknown[]) => mocks.listQueue(...args),
  reviewCreatePrepareAttachDraft: (...args: unknown[]) => mocks.reviewDraft(...args),
}));

import { GET as queueGET } from "@/app/api/admin/create/attach-drafts/route";
import { POST as reviewPOST } from "@/app/api/admin/create/attach-drafts/[draftId]/review/route";

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

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

describe("create prepare-attach review queue routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
  });

  it("lists queue items with review filter and productive payload", async () => {
    mocks.listQueue.mockResolvedValue({
      total: 1,
      items: [
        {
          draftId: "65f000000000000000000011",
          ctaId: "perspektive_anhaengen",
          matchType: "related_claim",
          matchEntityType: "claim",
          attachTargetType: "claim",
          attachTargetId: "claim-1",
          attachTargetLabel: "Claim A",
          sourceSummary: "summary",
          reasons: ["Semantische Naehe"],
          duplicateRisk: false,
          requiresReview: true,
          reviewState: "pending",
          applyState: "not_applied",
          reviewNote: null,
          reviewedAt: null,
          reviewedBy: null,
          createdAt: "2026-03-20T10:00:00.000Z",
          updatedAt: "2026-03-20T10:00:00.000Z",
        },
      ],
    });

    const res = await queueGET(
      req("http://localhost/api/admin/create/attach-drafts?reviewState=pending&q=claim"),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      total: 1,
      items: [{ draftId: "65f000000000000000000011", applyState: "not_applied" }],
      filters: { reviewState: "pending", q: "claim" },
    });
  });

  it("maps forbidden actor scope to 403", async () => {
    mocks.listQueue.mockRejectedValue(new Error("actor_scope_forbidden"));
    const res = await queueGET(req("http://localhost/api/admin/create/attach-drafts"));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "actor_scope_forbidden",
    });
  });

  it("updates review decision without live apply mutation", async () => {
    mocks.reviewDraft.mockResolvedValue({
      draftId: "65f000000000000000000011",
      ctaId: "perspektive_anhaengen",
      matchType: "related_claim",
      matchEntityType: "claim",
      attachTargetType: "claim",
      attachTargetId: "claim-1",
      attachTargetLabel: "Claim A",
      sourceSummary: "summary",
      reasons: ["Semantische Naehe"],
      duplicateRisk: false,
      requiresReview: true,
      reviewState: "accepted_for_apply",
      applyState: "not_applied",
      reviewNote: "spaeter anwenden",
      reviewedAt: "2026-03-20T12:00:00.000Z",
      reviewedBy: "u-review",
      createdAt: "2026-03-20T10:00:00.000Z",
      updatedAt: "2026-03-20T12:00:00.000Z",
    });

    const res = await reviewPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: "accepted_for_apply",
          reviewNote: "spaeter anwenden",
        }),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      item: {
        draftId: "65f000000000000000000011",
        reviewState: "accepted_for_apply",
        applyState: "not_applied",
      },
    });
  });

  it("rejects invalid review decisions", async () => {
    const res = await reviewPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "bad" }),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_review_decision",
    });
  });

  it("maps invalid draft id and not-found errors", async () => {
    mocks.reviewDraft.mockRejectedValueOnce(new Error("invalid_attach_draft_id"));
    let res = await reviewPOST(
      req("http://localhost/api/admin/create/attach-drafts/bad/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "parked" }),
      }),
      { params: Promise.resolve({ draftId: "bad" }) },
    );
    expect(res.status).toBe(400);

    mocks.reviewDraft.mockRejectedValueOnce(new Error("attach_draft_not_found"));
    res = await reviewPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000099/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "parked" }),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000099" }) },
    );
    expect(res.status).toBe(404);
  });
});
