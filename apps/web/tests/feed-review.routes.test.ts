import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  bulkAction: vi.fn(),
  legacyList: vi.fn(),
  backfill: vi.fn(),
  publishGate: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@features/feeds/reviewQueue", () => ({
  FEED_REVIEW_ACTIONS: [
    "ignore",
    "attach_to_anlassraum",
    "create_anlassraum_candidate",
    "mark_as_weak_signal",
  ],
  applyBulkFeedReviewAction: (...args: unknown[]) => mocks.bulkAction(...args),
  listLegacyVoteDraftsWithoutAnlassraumAuthorized: (...args: unknown[]) => mocks.legacyList(...args),
  backfillVoteDraftAnlassraumAuthorized: (...args: unknown[]) => mocks.backfill(...args),
}));

vi.mock("@features/anlassraum/governance", () => ({
  getAnlassraumPublishGate: (...args: unknown[]) => mocks.publishGate(...args),
}));

import { POST as bulkPOST } from "@/app/api/admin/feeds/drafts/bulk/route";
import { GET as legacyGET } from "@/app/api/admin/feeds/drafts/legacy/route";
import { POST as backfillPOST } from "@/app/api/admin/feeds/drafts/[id]/backfill/route";

const gateAccess = {
  user: { _id: { toHexString: () => "u1" } },
  roles: ["reviewer"],
  actor: {
    userId: "u1",
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

function params(id = "65a111111111111111111111") {
  return { params: Promise.resolve({ id }) };
}

describe("feed review routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
    mocks.publishGate.mockResolvedValue({ ok: false, reasons: ["review_required"] });
  });

  it("bulk route returns aggregated success", async () => {
    mocks.bulkAction.mockResolvedValue({
      action: "ignore",
      successCount: 2,
      failureCount: 0,
      results: [
        { draftId: "65a111111111111111111111", ok: true, feedReviewState: "ignored" },
        { draftId: "65a111111111111111111112", ok: true, feedReviewState: "ignored" },
      ],
    });

    const res = await bulkPOST(
      req("http://localhost/api/admin/feeds/drafts/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "ignore",
          draftIds: ["65a111111111111111111111", "65a111111111111111111112"],
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      successCount: 2,
      failureCount: 0,
    });
  });

  it("bulk route validates action", async () => {
    const res = await bulkPOST(
      req("http://localhost/api/admin/feeds/drafts/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "nope", draftIds: ["65a111111111111111111111"] }),
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_action" });
  });

  it("legacy route maps admin-only policy", async () => {
    mocks.legacyList.mockRejectedValue(new Error("forbidden_legacy_backfill_requires_admin"));
    const res = await legacyGET(req("http://localhost/api/admin/feeds/drafts/legacy?limit=20"));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "forbidden_legacy_backfill_requires_admin" });
  });

  it("backfill route rejects invalid mode", async () => {
    const res = await backfillPOST(
      req("http://localhost/api/admin/feeds/drafts/65a111111111111111111111/backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "auto" }),
      }),
      params(),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_mode" });
  });

  it("backfill route maps already linked conflict", async () => {
    mocks.backfill.mockRejectedValue(new Error("draft_already_has_anlassraum"));

    const res = await backfillPOST(
      req("http://localhost/api/admin/feeds/drafts/65a111111111111111111111/backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "attach", anlassraumId: "65a111111111111111111110" }),
      }),
      params(),
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "draft_already_has_anlassraum" });
  });

  it("backfill route maps admin-only policy to forbidden", async () => {
    mocks.backfill.mockRejectedValue(new Error("forbidden_legacy_backfill_requires_admin"));

    const res = await backfillPOST(
      req("http://localhost/api/admin/feeds/drafts/65a111111111111111111111/backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "create_candidate" }),
      }),
      params(),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "forbidden_legacy_backfill_requires_admin",
    });
  });

  it("backfill route validates attach target id", async () => {
    const res = await backfillPOST(
      req("http://localhost/api/admin/feeds/drafts/65a111111111111111111111/backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "attach", anlassraumId: "bad" }),
      }),
      params(),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_anlassraum_id" });
  });

  it("backfill route returns publish gate payload", async () => {
    mocks.backfill.mockResolvedValue({
      draftId: "65a111111111111111111111",
      mode: "create_candidate",
      remediationKind: "created_candidate_anlassraum",
      result: {
        anlassraumId: { toHexString: () => "65a111111111111111111110" },
        feedReviewState: "candidate_created",
        createdAnlassraum: true,
        draft: {
          status: "review",
          reviewNote: "[legacy-backfill] remediation",
          lastReviewAction: "create_anlassraum_candidate",
          lastReviewActionBy: "admin-1",
          lastReviewActionAt: new Date("2026-03-19T09:00:00.000Z"),
        },
      },
    });

    const res = await backfillPOST(
      req("http://localhost/api/admin/feeds/drafts/65a111111111111111111111/backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "create_candidate" }),
      }),
      params(),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      mode: "create_candidate",
      remediationKind: "created_candidate_anlassraum",
      result: {
        anlassraumId: "65a111111111111111111110",
        feedReviewState: "candidate_created",
        reviewNote: "[legacy-backfill] remediation",
      },
    });
  });
});
