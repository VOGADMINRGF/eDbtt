import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  applyEditorialReviewRequestAction,
  createEditorialReviewRequest,
  createEditorialReviewTruthMeta,
  createInMemoryEditorialReviewQueueRepository,
  setEditorialReviewQueueRepoForTests,
} from "@features/editorialReviewQueue";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import { POST } from "@/app/api/admin/editorial-review-requests/[requestId]/route";

describe("/api/admin/editorial-review-requests/[requestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEditorialReviewQueueRepoForTests(createInMemoryEditorialReviewQueueRepository());
    mocks.requireAdminOrResponse.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
      requestScope: {
        regionIds: [],
        organizationMembership: { organizationIds: [] },
      },
    });
  });

  it("marks a pending request as in_review", async () => {
    const created = await createEditorialReviewRequest({
      sourceType: "create_analysis",
      userId: "user-1",
      originalText: "Bitte prüft diesen Entwurf.",
      ...createEditorialReviewTruthMeta({
        truthStatus: "source_open",
        sourceSupport: "open",
        sourceStatus: "Quellenlage offen",
      }),
      reason: "source_open",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/editorial-review-requests/${created.reviewRequest.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "mark_in_review",
        }),
      }),
      {
        params: Promise.resolve({ requestId: created.reviewRequest.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      reviewRequest: {
        status: "in_review",
        latestAction: "mark_in_review",
        latestActionByUserId: "admin-1",
      },
    });
  });

  it("blocks status changes for non-admin callers", async () => {
    mocks.requireAdminOrResponse.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403 }),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/admin/editorial-review-requests/editorial-1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "mark_in_review",
        }),
      }),
      {
        params: Promise.resolve({ requestId: "editorial-1" }),
      },
    );

    expect(response.status).toBe(403);
  });

  it("requires a reason for clarification requests", async () => {
    const created = await createEditorialReviewRequest({
      sourceType: "create_analysis",
      userId: "user-1",
      originalText: "Bitte prüft diesen Entwurf.",
      reason: "source_open",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/editorial-review-requests/${created.reviewRequest.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "needs_user_clarification",
        }),
      }),
      {
        params: Promise.resolve({ requestId: created.reviewRequest.id }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "editorial_review_note_required",
    });
  });

  it("requires a reason for rejected requests", async () => {
    const created = await createEditorialReviewRequest({
      sourceType: "create_analysis",
      userId: "user-1",
      originalText: "Bitte prüft diesen Entwurf.",
      reason: "source_open",
    });

    await applyEditorialReviewRequestAction({
      requestId: created.reviewRequest.id,
      action: "mark_in_review",
      requestedByUserId: "admin-1",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/editorial-review-requests/${created.reviewRequest.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reject",
        }),
      }),
      {
        params: Promise.resolve({ requestId: created.reviewRequest.id }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "editorial_review_note_required",
    });
  });

  it("stores the clarification reason on the request", async () => {
    const created = await createEditorialReviewRequest({
      sourceType: "create_analysis",
      userId: "user-1",
      originalText: "Bitte prüft diesen Entwurf.",
      reason: "source_open",
    });

    await applyEditorialReviewRequestAction({
      requestId: created.reviewRequest.id,
      action: "mark_in_review",
      requestedByUserId: "admin-1",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/editorial-review-requests/${created.reviewRequest.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "needs_user_clarification",
          note: "Bitte nenne die konkrete Quelle oder den Ort des Vorfalls.",
        }),
      }),
      {
        params: Promise.resolve({ requestId: created.reviewRequest.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      reviewRequest: {
        status: "needs_user_clarification",
        statusNote: "Bitte nenne die konkrete Quelle oder den Ort des Vorfalls.",
        userVisibleNote: "Bitte nenne die konkrete Quelle oder den Ort des Vorfalls.",
      },
    });
  });

  it("rejects direct accept_for_workup from pending_review", async () => {
    const created = await createEditorialReviewRequest({
      sourceType: "create_analysis",
      userId: "user-1",
      originalText: "Bitte prüft diesen Entwurf.",
      reason: "source_open",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/editorial-review-requests/${created.reviewRequest.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "accept_for_workup",
        }),
      }),
      {
        params: Promise.resolve({ requestId: created.reviewRequest.id }),
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "editorial_review_invalid_transition",
    });
  });

  it("marks accepted_for_workup without publish or graph side effects", async () => {
    const created = await createEditorialReviewRequest({
      sourceType: "round_draft",
      userId: "user-1",
      originalText: "Wir sollten den Platz vor der Schule als Anlassraum weiter strukturieren.",
      ...createEditorialReviewTruthMeta({
        truthStatus: "review_required",
        sourceSupport: "open",
        sourceStatus: "Prüfung empfohlen",
      }),
      reason: "editorial_escalation",
    });

    await applyEditorialReviewRequestAction({
      requestId: created.reviewRequest.id,
      action: "mark_in_review",
      requestedByUserId: "admin-1",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/editorial-review-requests/${created.reviewRequest.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "accept_for_workup",
          note: "Kann als manueller Anlassraum-Entwurf weiter vorbereitet werden.",
        }),
      }),
      {
        params: Promise.resolve({ requestId: created.reviewRequest.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      reviewRequest: {
        status: "accepted_for_workup",
        noAutoPublish: true,
        noAutoGraphPromotion: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoVote: true,
      },
    });
  });
});
