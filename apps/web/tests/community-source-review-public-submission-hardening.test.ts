import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInMemoryCommunitySourceReviewRepository,
  listCommunitySourceReviewRecords,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";

const mocks = vi.hoisted(() => ({
  getPublishedParticipationSpaceBySlugOrId: vi.fn(),
}));

vi.mock("@/features/participation/publicParticipationSpaceRuntime", () => ({
  getPublishedParticipationSpaceBySlugOrId: (...args: unknown[]) =>
    mocks.getPublishedParticipationSpaceBySlugOrId(...args),
}));

import { submitPublicCommunitySourceReview } from "@/features/create/communitySourceReviewPublicSubmission";

describe("community source review public submission hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );
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

  it("persists a review-first public submission without publish or verification side effects", async () => {
    const result = await submitPublicCommunitySourceReview({
      kind: "source_suggestion",
      target: "claim",
      targetId: "claim-1",
      claimText: "Vor der Schule fehlen sichere Querungen.",
      text: "Hier ist ein lokaler Pressebericht als möglicher Quellenhinweis.",
      sourceRefs: ["https://beispiel.de/pressebericht"],
      participationSpaceSlugOrId: "sichere-schulwege",
    });

    expect(result).toMatchObject({
      ok: true,
      deduped: false,
      status: "pending_review",
      runtimeStatus: "public_api_hardened",
    });
    if (!result.ok) {
      throw new Error("expected_ok_result");
    }
    expect(result.contribution.guardrails.canPublish).toBe(false);
    expect(result.contribution.guardrails.canVerifyClaim).toBe(false);
    expect(result.contribution.notes).toEqual(
      expect.arrayContaining([
        "Öffentlicher Intake: review-first API",
        "Öffentlicher Beteiligungsraum: sichere-schulwege",
      ]),
    );

    const records = await listCommunitySourceReviewRecords();
    expect(records).toHaveLength(1);
    expect(records[0]?.contribution.targetId).toBe("claim-1");
  });

  it("deduplicates an exact replay instead of creating a second record", async () => {
    await submitPublicCommunitySourceReview({
      kind: "context_note",
      target: "handoff_review_item",
      targetId: "review-1",
      text: "Parallel läuft dort noch eine Baustelle.",
    });

    const replay = await submitPublicCommunitySourceReview({
      kind: "context_note",
      target: "handoff_review_item",
      targetId: "review-1",
      text: "Parallel läuft dort noch eine Baustelle.",
    });

    expect(replay).toMatchObject({
      ok: true,
      deduped: true,
      status: "duplicate_recent_submission",
    });
    const records = await listCommunitySourceReviewRecords();
    expect(records).toHaveLength(1);
  });

  it("requires a published public participation space when a public room target is referenced", async () => {
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

    const result = await submitPublicCommunitySourceReview({
      kind: "source_suggestion",
      target: "claim",
      targetId: "claim-1",
      claimText: "Vor der Schule fehlen sichere Querungen.",
      text: "Hier ist eine Quelle.",
      sourceRefs: ["https://beispiel.de/quelle"],
      participationSpaceSlugOrId: "interner-raum",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        status: "invalid_submission",
        codes: expect.arrayContaining(["participation_space_not_public"]),
      }),
    );
  });

  it("pushes bursty same-target submissions into moderation instead of public truth semantics", async () => {
    for (let index = 0; index < 13; index += 1) {
      await submitPublicCommunitySourceReview({
        kind: "context_note",
        target: "claim",
        targetId: "claim-burst-0",
        claimText: "Wiederkehrende Hinweise.",
        text: `Hinweis Nummer ${index} mit leicht anderem Wortlaut.`,
      });
    }

    const result = await submitPublicCommunitySourceReview({
      kind: "source_suggestion",
      target: "claim",
      targetId: "claim-burst-0",
      claimText: "Wiederkehrende Hinweise.",
      text: "Noch ein kurzer Link zur Bestätigung.",
      sourceRefs: ["http://bit.ly/verdacht"],
    });

    expect(result).toMatchObject({
      ok: true,
      deduped: false,
      status: "needs_moderation",
    });
    if (!result.ok) {
      throw new Error("expected_ok_result");
    }
    expect(
      result.contribution.moderation.abuseSignals.map((signal) => signal.kind),
    ).toEqual(
      expect.arrayContaining([
        "repeated_submission",
        "suspicious_source_url",
      ]),
    );
  });
});
