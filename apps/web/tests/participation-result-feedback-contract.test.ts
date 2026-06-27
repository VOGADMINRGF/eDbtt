import { describe, expect, it } from "vitest";

import {
  createEmptyParticipationResultFeedback,
  getParticipationResultFeedbackSourceStatusLabel,
  getParticipationResultFeedbackStatusLabel,
  isParticipationResultFeedbackPublic,
  isParticipationResultFeedbackPublishable,
  PARTICIPATION_RESULT_FEEDBACK_SOURCE_STATUSES,
  PARTICIPATION_RESULT_FEEDBACK_STATUSES,
  requiresParticipationResultFeedbackReview,
  summarizeParticipationResultFeedbackReadiness,
} from "@/features/participation/resultFeedback";

describe("participation result feedback contract", () => {
  it("defines the complete feedback status model", () => {
    expect(PARTICIPATION_RESULT_FEEDBACK_STATUSES).toEqual([
      "draft",
      "in_review",
      "approved_for_public_feedback",
      "published_feedback",
      "archived",
    ]);
  });

  it("keeps approved_for_public_feedback distinct from published_feedback", () => {
    expect(
      getParticipationResultFeedbackStatusLabel("approved_for_public_feedback"),
    ).not.toBe(getParticipationResultFeedbackStatusLabel("published_feedback"));
  });

  it("marks published_feedback as publicly visible", () => {
    const feedback = {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-1",
        updatedAt: "2026-06-27T12:00:00.000Z",
        impactStatus: "feedback_available",
      }),
      title: "Rückmeldung zum Themenraum",
      summary: "Mehrere Anliegen wurden zusammengeführt und beantwortet.",
      feedbackStatus: "published_feedback" as const,
      sourceStatus: "reviewed_summary" as const,
      topicSummaries: [{ id: "topic-1", title: "Verkehr", summary: "Häufige Stauhinweise." }],
    };

    expect(isParticipationResultFeedbackPublic(feedback)).toBe(true);
  });

  it("treats approved feedback as publishable but not yet public", () => {
    const feedback = {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-2",
        updatedAt: "2026-06-27T12:00:00.000Z",
        impactStatus: "addressed",
      }),
      title: "Reviewte Rückmeldung",
      summary: "Der aktuelle Stand ist für eine öffentliche Rückmeldung vorbereitet.",
      feedbackStatus: "approved_for_public_feedback" as const,
      sourceStatus: "reviewed_summary" as const,
      nextSteps: [
        {
          id: "step-1",
          label: "Weiter prüfen",
          description: "Review-first Folgearbeit bleibt sichtbar.",
          reviewFirst: true as const,
        },
      ],
    };

    expect(isParticipationResultFeedbackPublishable(feedback)).toBe(true);
    expect(isParticipationResultFeedbackPublic(feedback)).toBe(false);
  });

  it("blocks publishability for unverified input", () => {
    const feedback = {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-3",
        updatedAt: "2026-06-27T12:00:00.000Z",
      }),
      title: "Noch ungeprüft",
      summary: "Die Zusammenfassung ist noch nicht geprüft.",
      feedbackStatus: "approved_for_public_feedback" as const,
      sourceStatus: "unverified_input" as const,
      topicSummaries: [{ id: "topic-1", title: "Thema", summary: "Zusammenfassung" }],
    };

    expect(isParticipationResultFeedbackPublishable(feedback)).toBe(false);
  });

  it("blocks publishability for empty title or summary", () => {
    const missingTitle = {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-4",
        updatedAt: "2026-06-27T12:00:00.000Z",
      }),
      summary: "Zusammenfassung vorhanden.",
      feedbackStatus: "approved_for_public_feedback" as const,
      sourceStatus: "reviewed_summary" as const,
      topicSummaries: [{ id: "topic-1", title: "Thema", summary: "Zusammenfassung" }],
    };

    const missingSummary = {
      ...missingTitle,
      title: "Titel vorhanden",
      summary: "",
    };

    expect(isParticipationResultFeedbackPublishable(missingTitle)).toBe(false);
    expect(isParticipationResultFeedbackPublishable(missingSummary)).toBe(false);
  });

  it("requires at least a topic summary or next step for publishability", () => {
    const feedback = {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-5",
        updatedAt: "2026-06-27T12:00:00.000Z",
      }),
      title: "Leere Rückmeldung",
      summary: "Es gibt noch keinen tragfähigen Ergebnisstand.",
      feedbackStatus: "approved_for_public_feedback" as const,
      sourceStatus: "reviewed_summary" as const,
    };

    expect(isParticipationResultFeedbackPublishable(feedback)).toBe(false);
  });

  it("keeps minority positions and open questions as separate structures", () => {
    const feedback = {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-6",
        updatedAt: "2026-06-27T12:00:00.000Z",
      }),
      minorityPositions: [
        {
          id: "minority-1",
          title: "Minderheitenposition",
          summary: "Diese Sicht soll eigenständig sichtbar bleiben.",
          preserved: true as const,
        },
      ],
      openQuestions: [
        {
          id: "question-1",
          question: "Welche Daten fehlen noch?",
          stillOpen: true as const,
        },
      ],
    };

    expect(feedback.minorityPositions[0]?.preserved).toBe(true);
    expect(feedback.openQuestions[0]?.stillOpen).toBe(true);
  });

  it("keeps source/review labels explicit and non-authoritative", () => {
    expect(
      getParticipationResultFeedbackSourceStatusLabel("external_feedback_received"),
    ).toBe("Externe Rückmeldung eingegangen");
    expect(
      getParticipationResultFeedbackSourceStatusLabel("operator_reviewed"),
    ).toBe("Menschlich geprüft");
    expect(PARTICIPATION_RESULT_FEEDBACK_SOURCE_STATUSES).toEqual([
      "unverified_input",
      "reviewed_summary",
      "dossier_bound",
      "external_feedback_received",
      "operator_reviewed",
    ]);
  });

  it("keeps external_feedback_received free of approval claims and operator_reviewed free of political decision claims", () => {
    const externalLabel = getParticipationResultFeedbackSourceStatusLabel(
      "external_feedback_received",
    ).toLowerCase();
    const operatorLabel = getParticipationResultFeedbackSourceStatusLabel(
      "operator_reviewed",
    ).toLowerCase();

    expect(externalLabel).not.toContain("zustimmung");
    expect(operatorLabel).not.toContain("entschieden");
  });

  it("keeps helper output free of publish, dossier, anlassraum and graph automation", () => {
    const feedback = createEmptyParticipationResultFeedback({
      id: "feedback-7",
      updatedAt: "2026-06-27T12:00:00.000Z",
    });

    const readiness = summarizeParticipationResultFeedbackReadiness(feedback);

    expect(readiness.guardrails).toEqual({
      feedbackIsNotApproval: true,
      resultIsNotPoliticalResolution: true,
      topicSummaryIsNotVoiceDeletion: true,
      minorityPositionsMustRemainVisible: true,
      openQuestionsStayVisible: true,
      noAutoPublish: true,
      noAutoDossier: true,
      noAutoAnlassraum: true,
      noAutoGraph: true,
      noAutomaticOfficialAssessment: true,
    });
    expect(requiresParticipationResultFeedbackReview(feedback)).toBe(true);
  });
});
