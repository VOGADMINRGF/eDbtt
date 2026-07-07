import { describe, expect, it } from "vitest";

import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierWorkspaceReviewSurface } from "@/features/create/dossierWorkspaceReviewSurfaceContract";

describe("dossier workspace review surface contract", () => {
  it("keeps publish_ready review-first and exposes the expected review sections", () => {
    const surface = buildDossierWorkspaceReviewSurface({
      dossierId: "d-1",
      title: "Dossier Workspace",
      state: "publish_ready",
      claims: ["Claim A"],
      counterPositions: ["Gegenposition B"],
      openQuestions: ["Frage C"],
      formatRecommendations: ["comment_thread"],
      participationCandidates: ["poll_candidate"],
      socialOutputDrafts: ["linkedin_draft"],
      voxyBriefingCandidates: ["voxy_video_briefing"],
      sourcePack: buildCanonicalSourcePack({
        sourcePackId: "sp-1",
        sources: [{ sourceId: "s-1", title: "Quelle", evidenceState: "supported" }],
      }),
      trustState: "supported",
    });

    expect(surface.sections.claims).toEqual(["Claim A"]);
    expect(surface.sections.socialOutputDrafts).toEqual(["linkedin_draft"]);
    expect(surface.publishGuard.publishActionEnabled).toBe(false);
    expect(surface.publishGuard.publicOutputAllowed).toBe(false);
    expect(surface.guardrails.noAutoPublish).toBe(true);
  });
});
