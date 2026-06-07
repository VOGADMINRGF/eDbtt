import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  applyEditorialReviewRequestAction,
  createEditorialReviewRequest,
  createInMemoryEditorialReviewQueueRepository,
  listEditorialReviewRequests,
  setEditorialReviewQueueRepoForTests,
} from "@features/editorialReviewQueue";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

import { POST } from "@/app/api/editorial/review-requests/[requestId]/reply/route";

function buildRequest(body: Record<string, unknown>, requestId: string) {
  return POST(
    new NextRequest(`http://localhost/api/editorial/review-requests/${requestId}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    {
      params: Promise.resolve({ requestId }),
    },
  );
}

async function seedClarificationRequest(options?: { assignedToUserId?: string | null }) {
  const created = await createEditorialReviewRequest({
    sourceType: "create_analysis",
    userId: "user-1",
    originalText: "Bitte prüft den gefährlichen Schulweg vor der Grundschule genauer.",
    reason: "source_open",
  });

  if (options?.assignedToUserId) {
    await applyEditorialReviewRequestAction({
      requestId: created.reviewRequest.id,
      action: "assign",
      requestedByUserId: "admin-1",
      assignedToUserId: options.assignedToUserId,
    });
  }

  await applyEditorialReviewRequestAction({
    requestId: created.reviewRequest.id,
    action: "mark_in_review",
    requestedByUserId: "admin-1",
  });
  await applyEditorialReviewRequestAction({
    requestId: created.reviewRequest.id,
    action: "needs_user_clarification",
    requestedByUserId: "admin-1",
    note: "Bitte nenne den genauen Ort und ob es um die Straße oder den Vorplatz geht.",
  });

  return created.reviewRequest.id;
}

describe("/api/editorial/review-requests/[requestId]/reply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEditorialReviewQueueRepoForTests(createInMemoryEditorialReviewQueueRepository());
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "user-1" },
      roles: ["user"],
      sessionValid: true,
    });
  });

  it("stores the user reply on the existing review request without creating a duplicate", async () => {
    const requestId = await seedClarificationRequest();

    const response = await buildRequest(
      {
        text: "Es geht um den Zebrastreifen vor der Grundschule an der Musterstraße in Reinickendorf.",
      },
      requestId,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      reviewRequest: {
        id: requestId,
        status: "pending_review",
        lastAction: "user_replied",
        userReplies: [
          {
            text: "Es geht um den Zebrastreifen vor der Grundschule an der Musterstraße in Reinickendorf.",
            userId: "user-1",
          },
        ],
        noAutoPublish: true,
        noAutoGraphPromotion: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoVote: true,
      },
    });

    const stored = await listEditorialReviewRequests({ userId: "user-1" });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.userReplies).toHaveLength(1);
  });

  it("returns the request to in_review when the clarification was assigned", async () => {
    const requestId = await seedClarificationRequest({ assignedToUserId: "admin-1" });

    const response = await buildRequest(
      {
        text: "Gemeint ist die Einmündung am Vorplatz der Grundschule, morgens zwischen 7 und 8 Uhr besonders gefährlich.",
      },
      requestId,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      reviewRequest: {
        status: "in_review",
        lastAction: "user_replied",
      },
    });
  });

  it("blocks replies from non-owners", async () => {
    const requestId = await seedClarificationRequest();
    mocks.getSessionUser.mockResolvedValueOnce({
      _id: { toHexString: () => "user-2" },
      roles: ["user"],
      sessionValid: true,
    });

    const response = await buildRequest(
      {
        text: "Ich bin nicht der Eigentümer dieser Prüfbitte, antworte aber trotzdem.",
      },
      requestId,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "editorial_review_forbidden",
    });
  });

  it("blocks too short and spam-like replies", async () => {
    const requestId = await seedClarificationRequest();

    const shortResponse = await buildRequest({ text: "Zu kurz." }, requestId);
    expect(shortResponse.status).toBe(400);
    await expect(shortResponse.json()).resolves.toMatchObject({
      ok: false,
      error: "review_text_too_short",
    });

    const spamResponse = await buildRequest(
      {
        text: "Jetzt kaufen https://spam.example/a https://spam.example/b bester Bonuscode heute",
      },
      requestId,
    );
    expect(spamResponse.status).toBe(400);
    await expect(spamResponse.json()).resolves.toMatchObject({
      ok: false,
      error: "review_not_allowed",
    });
  });
});
