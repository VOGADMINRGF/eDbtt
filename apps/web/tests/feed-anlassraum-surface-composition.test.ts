import { describe, expect, it } from "vitest";
import { resolveFeedAnlassraumSurfaceComposition } from "@features/feeds/anlassraumSurfaceComposition";

describe("feed anlassraum surface composition", () => {
  it("builds structured composition for existing contexts with attach-first hint", () => {
    const composition = resolveFeedAnlassraumSurfaceComposition({
      draftTitle: "Waermewende im Quartier",
      draftSummary: "Signal aus lokaler Berichterstattung.",
      draftStatus: "review",
      feedReviewState: "attached",
      weakSignalFlagged: false,
      sourceUrl: "https://example.org/artikel",
      sourcePipeline: "feeds_to_statementCandidate",
      anlassraumId: "65f000000000000000000100",
      anlassraumType: "policy",
      anlassraumScope: "local",
      regionCode: "DE-BE",
      anlassraumStatus: "active",
      anlassraumMaturity: "emerging",
      ownerType: "association",
      roomType: "community",
      originType: "feed",
      sourceMode: "feed",
      dossierId: "waermewende-berlin",
      publishTarget: "/round/waermewende-im-quartier",
    });

    expect(composition.anlass.hasExistingContext).toBe(true);
    expect(composition.anlassgeber.signalPathHint).toBe("attach_to_existing_anlassraum");
    expect(composition.beteiligteKontexte.hasAssociationContext).toBe(true);
    expect(composition.anschlussflaechen.roundOperatingTarget).toContain(
      "/round/waermewende-im-quartier",
    );
    expect(composition.guardrails.noTruthPrivilegeFromContext).toBe(true);
  });

  it("keeps weak-signal cases non-blocking and points to manual followup path", () => {
    const composition = resolveFeedAnlassraumSurfaceComposition({
      draftTitle: "Unscharfer Hinweis",
      draftStatus: "draft",
      weakSignalFlagged: true,
      feedReviewState: "weak_signal",
      sourcePipeline: "feeds_to_statementCandidate",
      sourceUrl: "https://example.org/hinweis",
    });

    expect(composition.anlass.hasExistingContext).toBe(false);
    expect(composition.anlassgeber.signalPathHint).toBe("manual_fast_path_via_create");
    expect(composition.andockhinweise.nonBlockingHint).toBe(true);
    expect(composition.andockhinweise.optionalFactcheckHint).toBe(true);
  });

  it("shows editorial/publisher context labels without generating privilege flags", () => {
    const composition = resolveFeedAnlassraumSurfaceComposition({
      draftTitle: "Bericht aus dem Stadtrat",
      draftStatus: "published",
      feedReviewState: "candidate_created",
      anlassraumId: "65f000000000000000000101",
      ownerType: "media",
      roomType: "editorial",
      originType: "source_anchor",
      sourceMode: "single_source",
      publishTarget: "/round/stadtrat-bericht",
      sourcePipeline: "feeds_to_statementCandidate",
      sourceUrl: "https://example.org/stadtrat",
    });

    expect(composition.beteiligteKontexte.hasEditorialPublisherContext).toBe(true);
    expect(composition.beteiligteKontexte.hasExpertVoiceContext).toBe(true);
    expect(composition.guardrails.noPriorityPrivilegeFromContext).toBe(true);
    expect(composition.guardrails.noVotingPrivilegeFromContext).toBe(true);
  });
});
