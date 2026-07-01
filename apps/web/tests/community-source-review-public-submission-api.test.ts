import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryCommunitySourceReviewRepository,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";

const mocks = vi.hoisted(() => ({
  rateLimitFromRequest: vi.fn(),
  rateLimitHeaders: vi.fn(),
  getPublishedParticipationSpaceBySlugOrId: vi.fn(),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitFromRequest: (...args: unknown[]) => mocks.rateLimitFromRequest(...args),
  rateLimitHeaders: (...args: unknown[]) => mocks.rateLimitHeaders(...args),
}));

vi.mock("@/features/participation/publicParticipationSpaceRuntime", () => ({
  getPublishedParticipationSpaceBySlugOrId: (...args: unknown[]) =>
    mocks.getPublishedParticipationSpaceBySlugOrId(...args),
}));

import { POST } from "@/app/api/community/source-review/submissions/route";

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/community/source-review/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/community/source-review/submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );
    mocks.rateLimitFromRequest.mockResolvedValue({
      ok: true,
      remaining: 3,
      limit: 4,
      resetAt: Date.now() + 1_000,
      retryIn: 0,
    });
    mocks.rateLimitHeaders.mockReturnValue({});
    mocks.getPublishedParticipationSpaceBySlugOrId.mockResolvedValue({
      detail: {
        id: "space-1",
        slug: "sichere-schulwege",
        title: "Sichere Schulwege",
      },
      status: {
        source: "runtime",
        totalVisible: 1,
        totalRuntimePublished: 1,
        fallbackActive: false,
        message: "runtime",
      },
    });
  });

  afterEach(() => {
    setCommunitySourceReviewRepositoryForTests(null);
  });

  it("accepts a public review-first submission and returns a safe reference", async () => {
    const response = await POST(
      buildRequest({
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-1",
        claimText: "Vor der Schule fehlen sichere Querungen.",
        text: "Hier ist ein lokaler Pressebericht als möglicher Quellenhinweis.",
        sourceRefs: ["https://beispiel.de/pressebericht"],
        participationSpaceSlugOrId: "sichere-schulwege",
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      deduped: false,
      status: "pending_review",
      runtimeStatus: "public_api_hardened",
      submissionReference: expect.stringContaining("community-source-review-"),
    });
  });

  it("returns an idempotent duplicate response for immediate replays", async () => {
    await POST(
      buildRequest({
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "review-1",
        text: "Parallel läuft dort noch eine Baustelle.",
      }),
    );

    const replay = await POST(
      buildRequest({
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "review-1",
        text: "Parallel läuft dort noch eine Baustelle.",
      }),
    );

    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({
      ok: true,
      deduped: true,
      status: "duplicate_recent_submission",
    });
  });

  it("returns a rate-limit response with safe messaging", async () => {
    mocks.rateLimitFromRequest.mockResolvedValue({
      ok: false,
      remaining: 0,
      limit: 4,
      resetAt: Date.now() + 60_000,
      retryIn: 60_000,
    });
    mocks.rateLimitHeaders.mockReturnValue({ "Retry-After": "60" });

    const response = await POST(
      buildRequest({
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "review-1",
        text: "Kurztest",
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "rate_limited",
    });
  });

  it("rejects non-public participation space references instead of attaching to hidden runtime", async () => {
    mocks.getPublishedParticipationSpaceBySlugOrId.mockResolvedValue({
      detail: null,
      status: {
        source: "runtime",
        totalVisible: 1,
        totalRuntimePublished: 1,
        fallbackActive: false,
        message: "runtime",
      },
    });

    const response = await POST(
      buildRequest({
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-1",
        claimText: "Vor der Schule fehlen sichere Querungen.",
        text: "Hier ist eine Quelle.",
        sourceRefs: ["https://beispiel.de/quelle"],
        participationSpaceSlugOrId: "interner-raum",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_submission",
      codes: expect.arrayContaining(["participation_space_not_public"]),
    });
  });
});
