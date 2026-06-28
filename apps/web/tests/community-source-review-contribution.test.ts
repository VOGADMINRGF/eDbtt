import { describe, expect, it } from "vitest";

import {
  canSubmitCommunitySourceReviewContribution,
  createCommunitySourceReviewContributionDraft,
  getCommunitySourceReviewContributionBlockers,
  mapCommunityContributionToReviewQueueInput,
  validateCommunitySourceReviewContribution,
} from "@/features/create/communitySourceReviewContribution";

describe("community source review contribution", () => {
  it("keeps source suggestions as hints instead of confirmed sources", () => {
    const contribution = createCommunitySourceReviewContributionDraft({
      kind: "source_suggestion",
      target: "claim",
      targetId: "claim-1",
      claimText: "Vor der Schule fehlen sichere Querungen.",
      text: "Hier ist ein lokaler Unfallbericht als möglicher Quellenhinweis.",
      sourceRefs: ["https://beispiel.de/unfallbericht"],
    });

    expect(contribution.guardrails.hintOnly).toBe(true);
    expect(contribution.guardrails.canConfirmSource).toBe(false);
    expect(
      getCommunitySourceReviewContributionBlockers(contribution),
    ).toContain("missing_runtime_contract");
  });

  it("keeps counter sources as review-first hints without automatic claim withdrawal", () => {
    const contribution = createCommunitySourceReviewContributionDraft({
      kind: "counter_source",
      target: "factcheck_request",
      targetId: "factcheck-1",
      text: "Diese Gegenquelle widerspricht Teilen der Aussage.",
      sourceRefs: ["https://beispiel.de/gegenquelle"],
    });

    const mapped = mapCommunityContributionToReviewQueueInput(contribution);

    expect(mapped.reviewQueueItem.target).toBe("factcheck_request");
    expect(mapped.reviewQueueItem.requiresFactcheck).toBe(true);
    expect(mapped.reviewQueueItem.summary).toContain("widerrufen keinen Claim automatisch");
    expect(mapped.runtime).toMatchObject({
      ok: false,
      blocked: true,
      error: "blocked_unwired",
      status: "blocked_unwired",
    });
  });

  it("does not turn lived experience into representative evidence or majority truth", () => {
    const contribution = createCommunitySourceReviewContributionDraft({
      kind: "lived_experience",
      target: "source_question",
      targetId: "source-question-1",
      text: "Ich wohne dort und erlebe die Situation morgens täglich.",
      relatedContributionCount: 18,
    });

    expect(contribution.guardrails.countsMajorityAsTruth).toBe(false);
    expect(contribution.relatedContributionCount).toBe(18);

    const flagged = createCommunitySourceReviewContributionDraft({
      kind: "lived_experience",
      target: "source_question",
      targetId: "source-question-1",
      text: "Viele sehen das genauso.",
      moderationFlags: {
        usesMajorityAsTruth: true,
      },
    });

    expect(
      getCommunitySourceReviewContributionBlockers(flagged),
    ).toContain("contribution_uses_majority_as_truth");
  });

  it("maps review-first preview items to the existing handoff review queue structures", () => {
    const contribution = createCommunitySourceReviewContributionDraft({
      kind: "context_note",
      target: "handoff_review_item",
      targetId: "review-item-1",
      text: "Im Quartier läuft parallel noch eine Baustelle, die den Kontext verzerrt.",
      status: "submitted",
    });

    const mapped = mapCommunityContributionToReviewQueueInput(contribution, {
      runtimeAvailable: true,
    });

    expect(mapped.previewStatus).toBe("pending_review");
    expect(mapped.reviewQueueItem.target).toBe("editorial_review");
    expect(mapped.reviewQueueItem.autoCreate).toBe(false);
    expect(mapped.reviewQueueItem.autoPublish).toBe(false);
    expect(mapped.runtime).toMatchObject({
      ok: true,
      blocked: false,
      status: "pending_review",
    });
  });

  it("blocks submission when runtime wiring is missing instead of returning fake success", () => {
    const contribution = createCommunitySourceReviewContributionDraft({
      kind: "source_suggestion",
      target: "factcheck_request",
      targetId: "factcheck-2",
      text: "Diese Quelle könnte die Datengrundlage ergänzen.",
      sourceRefs: ["https://beispiel.de/statistik"],
    });

    expect(canSubmitCommunitySourceReviewContribution(contribution)).toBe(false);

    const validation = validateCommunitySourceReviewContribution(contribution);
    expect(validation.ok).toBe(false);
    expect(validation.blockers).toContain("missing_runtime_contract");

    const mapped = mapCommunityContributionToReviewQueueInput(contribution);
    expect(mapped.previewStatus).toBe("pending_review");
    expect(mapped.previewMessage).toBe(
      "Hinweis eingereicht – redaktionelle Prüfung offen.",
    );
    expect(mapped.runtime).toMatchObject({
      ok: false,
      blocked: true,
      error: "blocked_unwired",
    });
  });

  it("blocks publish, merge, verified-claim and runtime-entity shortcuts", () => {
    const contribution = createCommunitySourceReviewContributionDraft({
      kind: "escalation_request",
      target: "claim",
      targetId: "claim-2",
      claimText: "Die Datenlage sei bereits endgültig geklärt.",
      text: "Bitte direkt veröffentlichen und den Claim als bestätigt markieren.",
      moderationFlags: {
        verifiesClaim: true,
        marksSourceConfirmed: true,
        requestsPublish: true,
        requestsAutoMerge: true,
        requestsRuntimeEntity: true,
      },
    });

    expect(getCommunitySourceReviewContributionBlockers(contribution)).toEqual(
      expect.arrayContaining([
        "contribution_verifies_claim",
        "contribution_marks_source_confirmed",
        "contribution_requests_publish",
        "contribution_requests_auto_merge",
        "contribution_requests_runtime_entity",
        "missing_runtime_contract",
      ]),
    );
  });
});
