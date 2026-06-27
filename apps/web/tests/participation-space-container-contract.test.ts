import { describe, expect, it } from "vitest";

import {
  canShowParticipationSpaceModule,
  createEmptyParticipationSpace,
  getParticipationSpaceStatusLabel,
  getParticipationSpaceVisibilityLabel,
  isParticipationSpaceFeedbackPublic,
  isParticipationSpaceIntakeOpen,
  isParticipationSpacePublic,
  PARTICIPATION_SPACE_MODULES,
  PARTICIPATION_SPACE_STATUSES,
  PARTICIPATION_SPACE_VISIBILITIES,
  requiresParticipationSpaceReview,
  summarizeParticipationSpaceReadiness,
} from "@/features/participation/spaceContainer";

function baseSpace() {
  return createEmptyParticipationSpace({
    id: "space-1",
    title: "Vorhabenraum Mobilität",
    slug: "vorhabenraum-mobilitaet",
    summary: "Ein review-first Container für Beteiligung und Rückmeldung.",
    updatedAt: "2026-06-27T12:00:00.000Z",
  });
}

describe("participation space container contract", () => {
  it("defines all space statuses", () => {
    expect(PARTICIPATION_SPACE_STATUSES).toEqual([
      "draft",
      "intake_open",
      "review_active",
      "feedback_prepared",
      "public_feedback_live",
      "closed_archived",
    ]);
  });

  it("defines all visibilities", () => {
    expect(PARTICIPATION_SPACE_VISIBILITIES).toEqual([
      "private",
      "review_only",
      "public_read_only",
      "public_intake_open",
      "archived_public",
    ]);
  });

  it("defines all modules", () => {
    expect(PARTICIPATION_SPACE_MODULES).toEqual([
      "topic_overview",
      "public_intake",
      "status_timeline",
      "result_feedback",
      "minority_positions",
      "open_questions",
      "next_steps",
      "operator_cockpit",
      "live_context",
      "dossier_references",
    ]);
  });

  it("keeps feedback_prepared distinct from public feedback", () => {
    const space = {
      ...baseSpace(),
      status: "feedback_prepared" as const,
      visibility: "public_read_only" as const,
      publicSummary: {
        ...baseSpace().publicSummary,
        feedbackAvailable: true,
      },
    };

    expect(isParticipationSpaceFeedbackPublic(space)).toBe(false);
    expect(getParticipationSpaceStatusLabel(space.status)).toBe(
      "Rückmeldung vorbereitet",
    );
  });

  it("only treats public_feedback_live as public when visibility is public and feedback is available", () => {
    const publicSpace = {
      ...baseSpace(),
      status: "public_feedback_live" as const,
      visibility: "public_read_only" as const,
      publicSummary: {
        ...baseSpace().publicSummary,
        feedbackAvailable: true,
      },
    };
    const internalSpace = {
      ...publicSpace,
      visibility: "review_only" as const,
    };
    const missingFeedback = {
      ...publicSpace,
      publicSummary: {
        ...publicSpace.publicSummary,
        feedbackAvailable: false,
      },
    };

    expect(isParticipationSpaceFeedbackPublic(publicSpace)).toBe(true);
    expect(isParticipationSpaceFeedbackPublic(internalSpace)).toBe(false);
    expect(isParticipationSpaceFeedbackPublic(missingFeedback)).toBe(false);
  });

  it("opens intake only for intake_open plus public_intake_open", () => {
    const openSpace = {
      ...baseSpace(),
      status: "intake_open" as const,
      visibility: "public_intake_open" as const,
    };

    expect(isParticipationSpaceIntakeOpen(openSpace)).toBe(true);
  });

  it("keeps public_read_only public but intake closed", () => {
    const space = {
      ...baseSpace(),
      visibility: "public_read_only" as const,
    };

    expect(isParticipationSpacePublic(space)).toBe(true);
    expect(isParticipationSpaceIntakeOpen(space)).toBe(false);
    expect(getParticipationSpaceVisibilityLabel(space.visibility)).toBe(
      "Öffentlich lesbar",
    );
  });

  it("keeps review_only non-public", () => {
    const space = {
      ...baseSpace(),
      visibility: "review_only" as const,
    };

    expect(isParticipationSpacePublic(space)).toBe(false);
  });

  it("never shows operator_cockpit publicly", () => {
    const publicSpace = {
      ...baseSpace(),
      visibility: "public_read_only" as const,
      modules: ["topic_overview", "operator_cockpit"] as const,
    };
    const reviewSpace = {
      ...baseSpace(),
      visibility: "review_only" as const,
      modules: ["topic_overview", "operator_cockpit"] as const,
    };

    expect(canShowParticipationSpaceModule(publicSpace, "operator_cockpit")).toBe(
      false,
    );
    expect(canShowParticipationSpaceModule(reviewSpace, "operator_cockpit")).toBe(
      true,
    );
  });

  it("keeps dossier_references explicit and free of auto-dossier behavior", () => {
    const space = {
      ...baseSpace(),
      modules: ["dossier_references"] as const,
    };

    expect(canShowParticipationSpaceModule(space, "dossier_references")).toBe(
      true,
    );
    expect(space.guardrails.noAutoDossier).toBe(true);
  });

  it("keeps live_context as context only and does not start live events", () => {
    const space = {
      ...baseSpace(),
      modules: ["live_context"] as const,
    };

    expect(canShowParticipationSpaceModule(space, "live_context")).toBe(true);
    expect(space.guardrails.noAutoAnlassraum).toBe(true);
  });

  it("carries linked item status, feedback, queue and risk information", () => {
    const space = {
      ...baseSpace(),
      linkedItems: [
        {
          id: "item-1",
          title: "Hinweis zur Schulwegsicherheit",
          impactStatus: "addressed" as const,
          feedbackStatus: "approved_for_public_feedback" as const,
          sourceStatus: "reviewed_summary" as const,
          queueKey: "feedback_ready" as const,
          riskFlags: ["minority_position_present"] as const,
        },
      ],
    };

    expect(space.linkedItems[0]).toEqual({
      id: "item-1",
      title: "Hinweis zur Schulwegsicherheit",
      impactStatus: "addressed",
      feedbackStatus: "approved_for_public_feedback",
      sourceStatus: "reviewed_summary",
      queueKey: "feedback_ready",
      riskFlags: ["minority_position_present"],
    });
  });

  it("requires review when linked items carry risk flags", () => {
    const space = {
      ...baseSpace(),
      status: "feedback_prepared" as const,
      visibility: "private" as const,
      linkedItems: [
        {
          id: "item-1",
          title: "Offene Frage",
          impactStatus: "queued_for_review" as const,
          feedbackStatus: "draft" as const,
          sourceStatus: "reviewed_summary" as const,
          queueKey: "ready_for_review" as const,
          riskFlags: ["open_questions_present"] as const,
        },
      ],
    };

    expect(requiresParticipationSpaceReview(space)).toBe(true);
  });

  it("keeps readiness and summary guardrails explicit", () => {
    const space = {
      ...baseSpace(),
      status: "closed_archived" as const,
      visibility: "archived_public" as const,
      publicSummary: {
        ...baseSpace().publicSummary,
        feedbackAvailable: true,
      },
      modules: [
        "topic_overview",
        "status_timeline",
        "result_feedback",
        "operator_cockpit",
      ] as const,
    };
    const readiness = summarizeParticipationSpaceReadiness(space);

    expect(readiness.visibleModules).toEqual([
      "topic_overview",
      "status_timeline",
      "result_feedback",
    ]);
    expect(readiness.guardrails).toEqual({
      noAutoPublish: true,
      noAutoDossier: true,
      noAutoAnlassraum: true,
      noAutoGraph: true,
      noAutomaticOfficialAssessment: true,
      spaceIsContainerOnly: true,
      publicFeedbackRequiresExplicitStatus: true,
      operatorCockpitIsNeverPublic: true,
      modulesDoNotTriggerAutomation: true,
      mapLogicOutOfScope: true,
    });
  });

  it("keeps helper output free of publish, dossier, anlassraum, graph and map automation", () => {
    const readiness = summarizeParticipationSpaceReadiness(baseSpace());

    expect(readiness.guardrails.noAutoPublish).toBe(true);
    expect(readiness.guardrails.noAutoDossier).toBe(true);
    expect(readiness.guardrails.noAutoAnlassraum).toBe(true);
    expect(readiness.guardrails.noAutoGraph).toBe(true);
    expect(readiness.guardrails.mapLogicOutOfScope).toBe(true);
  });
});
