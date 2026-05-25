import { describe, expect, it } from "vitest";

import {
  B2C_V1_STATUS_LABELS,
  resolveCreateHandoffJourneySummary,
  resolveDossierStatusChips,
  resolveRundenEntryStatusChips,
  resolveVisibilityStatusChip,
} from "@/features/b2cJourney/statusContract";

describe("v1 b2c production journey contract", () => {
  it("keeps the shared citizen status vocabulary stable", () => {
    expect(B2C_V1_STATUS_LABELS.submitted).toBe("eingereicht");
    expect(B2C_V1_STATUS_LABELS.inReview).toBe("in Prüfung");
    expect(B2C_V1_STATUS_LABELS.visibleProposal).toBe("als Vorschlag sichtbar");
    expect(B2C_V1_STATUS_LABELS.attachedToAnlassraum).toBe("an Anlassraum angehängt");
    expect(B2C_V1_STATUS_LABELS.inDossierContext).toBe("im Dossier-Kontext");
    expect(B2C_V1_STATUS_LABELS.preparedForSwipes).toBe("für Swipes vorbereitet");
    expect(B2C_V1_STATUS_LABELS.published).toBe("veröffentlicht");
    expect(B2C_V1_STATUS_LABELS.archivedOrRejected).toBe("archiviert / abgelehnt");
  });

  it("maps handoffs, visibility and public surfaces to the same shared status terms", () => {
    const handoff = resolveCreateHandoffJourneySummary({
      id: "handoff-1",
      source: "create",
      sourceText: "Mehr Sicherheit vor der Grundschule.",
      plannerResult: {
        plannerTopic: "Schulwegsicherheit",
        plannerCore: "Mehr Sicherheit vor der Grundschule",
        plannerClusters: [],
        plannerScope: ["municipal"],
      },
      graphMatches: {
        stage: "after_structure",
        prepared: true,
        requiresConfirmation: true,
        searchTerms: [],
        matches: [],
        matchedTopics: [],
        matchedDossiers: [],
        matchedClaims: [],
        matchedAnlassraeume: [],
        matchedVotes: [],
        shouldCreateNewTopic: true,
      },
      selectedAction: "prepare_vote",
      claims: [],
      arguments: [],
      openQuestions: [],
      sourceGrounding: [],
      topicSeed: {
        topicKey: "schulwegsicherheit",
        topicLabel: "Schulwegsicherheit",
        jurisdiction: "kommune",
        themenradarSourceType: "create_intake",
      },
      resumeHref: "/create?resume=create_handoff&handoffId=handoff-1",
      reviewState: "ready_for_confirmation",
      visibilityState: "private_draft",
      requiresConfirmation: true,
      createdAt: "2026-05-25T10:00:00.000Z",
    } as any);

    expect(handoff.statusChips.map((chip) => chip.label)).toContain("eingereicht");
    expect(handoff.statusChips.map((chip) => chip.label)).toContain("für Swipes vorbereitet");
    expect(handoff.destinationLabel).toBe("Swipes");

    expect(resolveVisibilityStatusChip("public_unverified")?.label).toBe("als Vorschlag sichtbar");
    expect(resolveVisibilityStatusChip("public_reviewed")?.label).toBe("veröffentlicht");
    expect(resolveVisibilityStatusChip("archived")?.label).toBe("archiviert / abgelehnt");

    expect(
      resolveRundenEntryStatusChips({
        isPublicVisible: true,
        isReviewOnly: false,
        isArchivedOrClosed: false,
        hasDossierContext: true,
      }).map((chip) => chip.label),
    ).toEqual(expect.arrayContaining(["an Anlassraum angehängt", "veröffentlicht", "im Dossier-Kontext"]));

    expect(
      resolveDossierStatusChips({
        loadState: "review_only",
        handoffDraft: null,
      }).map((chip) => chip.label),
    ).toEqual(expect.arrayContaining(["im Dossier-Kontext", "in Prüfung"]));
  });
});
