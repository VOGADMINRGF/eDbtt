import { describe, expect, it } from "vitest";

import {
  canTransitionParticipationImpactStatus,
  getParticipationImpactStatusDescription,
  getParticipationImpactStatusLabel,
  getParticipationImpactStatusMeta,
  isParticipationImpactStatusTerminal,
  PARTICIPATION_IMPACT_STATUSES,
  type ParticipationImpactStatus,
} from "@/features/participation/impactStatus";

describe("participation impact status contract", () => {
  it("defines the complete status model", () => {
    expect(PARTICIPATION_IMPACT_STATUSES).toEqual([
      "submitted",
      "needs_clarification",
      "queued_for_review",
      "in_evaluation",
      "bundled",
      "addressed",
      "feedback_available",
      "closed_archived",
    ]);
  });

  it("gives every status a label, description and ordering metadata", () => {
    const orders = PARTICIPATION_IMPACT_STATUSES.map((status) => {
      const meta = getParticipationImpactStatusMeta(status);

      expect(getParticipationImpactStatusLabel(status)).toBeTruthy();
      expect(getParticipationImpactStatusDescription(status)).toBeTruthy();
      expect(meta.progress).toBeGreaterThan(0);
      expect(meta.guardrails).toEqual(
        expect.objectContaining({
          noAutoPublish: true,
          noAutoDossier: true,
          noAutoAnlassraum: true,
          noAutoGraph: true,
          noAutomaticOfficialAssessment: true,
        }),
      );

      return meta.order;
    });

    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("allows the documented review and clarification transitions", () => {
    expect(
      canTransitionParticipationImpactStatus("submitted", "needs_clarification"),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus("needs_clarification", "submitted"),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus(
        "needs_clarification",
        "queued_for_review",
      ),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus("queued_for_review", "in_evaluation"),
    ).toBe(true);
  });

  it("blocks undocumented jumps", () => {
    const invalidTransitions: Array<
      [ParticipationImpactStatus, ParticipationImpactStatus]
    > = [
      ["submitted", "addressed"],
      ["queued_for_review", "feedback_available"],
      ["bundled", "submitted"],
      ["feedback_available", "addressed"],
    ];

    for (const [from, to] of invalidTransitions) {
      expect(canTransitionParticipationImpactStatus(from, to)).toBe(false);
    }
  });

  it("treats closed_archived as terminal", () => {
    expect(isParticipationImpactStatusTerminal("closed_archived")).toBe(true);
    expect(
      canTransitionParticipationImpactStatus("closed_archived", "submitted"),
    ).toBe(false);
  });

  it("keeps addressed distinct from feedback_available", () => {
    expect(getParticipationImpactStatusLabel("addressed")).toBe("Adressiert");
    expect(getParticipationImpactStatusLabel("feedback_available")).toBe(
      "Rückmeldung vorhanden",
    );
    expect(getParticipationImpactStatusDescription("addressed")).not.toBe(
      getParticipationImpactStatusDescription("feedback_available"),
    );
  });

  it("keeps feedback_available free of approval or publication claims", () => {
    const description = getParticipationImpactStatusDescription(
      "feedback_available",
    ).toLowerCase();

    expect(description).toContain("weder zustimmung");
    expect(description).toContain("noch veröffentlichung");
  });

  it("documents that no impact status triggers publish, dossier, anlassraum or graph automation", () => {
    for (const status of PARTICIPATION_IMPACT_STATUSES) {
      expect(getParticipationImpactStatusMeta(status).guardrails).toEqual({
        noAutoPublish: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoGraph: true,
        noAutomaticOfficialAssessment: true,
      });
    }
  });

  it("supports the clarification path", () => {
    expect(
      canTransitionParticipationImpactStatus("submitted", "needs_clarification"),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus("needs_clarification", "submitted"),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus("submitted", "queued_for_review"),
    ).toBe(true);
  });

  it("supports the bundling and feedback path", () => {
    expect(
      canTransitionParticipationImpactStatus("in_evaluation", "bundled"),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus("bundled", "addressed"),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus("addressed", "feedback_available"),
    ).toBe(true);
    expect(
      canTransitionParticipationImpactStatus(
        "feedback_available",
        "closed_archived",
      ),
    ).toBe(true);
  });
});
