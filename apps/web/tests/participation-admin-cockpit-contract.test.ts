import { describe, expect, it } from "vitest";

import {
  buildParticipationAdminCockpitSummary,
  createParticipationAdminCockpitItem,
  getParticipationAdminCockpitAllowedActions,
  getParticipationAdminCockpitQueueKey,
  hasParticipationAdminCockpitRisk,
  isParticipationAdminCockpitActionAllowed,
  PARTICIPATION_ADMIN_COCKPIT_ACTIONS,
  PARTICIPATION_ADMIN_COCKPIT_QUEUE_KEYS,
} from "@/features/participation/adminCockpit";

function baseItem() {
  return {
    id: "item-1",
    title: "Beteiligungssignal",
    summary: "Ein erster review-first Arbeitsstand liegt vor.",
    impactStatus: "submitted" as const,
    feedbackStatus: "draft" as const,
    sourceStatus: "reviewed_summary" as const,
    updatedAt: "2026-06-27T12:00:00.000Z",
  };
}

describe("participation admin cockpit contract", () => {
  it("defines all queue keys", () => {
    expect(PARTICIPATION_ADMIN_COCKPIT_QUEUE_KEYS).toEqual([
      "needs_clarification",
      "ready_for_review",
      "in_evaluation",
      "bundled_for_response",
      "addressed_waiting_feedback",
      "feedback_ready",
      "archive_candidates",
    ]);
  });

  it("defines all supported operator actions", () => {
    expect(PARTICIPATION_ADMIN_COCKPIT_ACTIONS).toEqual([
      "request_clarification",
      "mark_ready_for_review",
      "start_evaluation",
      "bundle_with_related",
      "mark_addressed",
      "prepare_feedback",
      "approve_feedback_for_public",
      "publish_feedback_manually",
      "archive_item",
    ]);
  });

  it("sorts items into the documented queues", () => {
    expect(
      getParticipationAdminCockpitQueueKey({
        ...baseItem(),
        impactStatus: "needs_clarification",
      }),
    ).toBe("needs_clarification");

    expect(
      getParticipationAdminCockpitQueueKey({
        ...baseItem(),
        impactStatus: "queued_for_review",
        topicSummaryCount: 1,
      }),
    ).toBe("ready_for_review");

    expect(
      getParticipationAdminCockpitQueueKey({
        ...baseItem(),
        impactStatus: "in_evaluation",
      }),
    ).toBe("in_evaluation");

    expect(
      getParticipationAdminCockpitQueueKey({
        ...baseItem(),
        impactStatus: "bundled",
      }),
    ).toBe("bundled_for_response");

    expect(
      getParticipationAdminCockpitQueueKey({
        ...baseItem(),
        impactStatus: "addressed",
      }),
    ).toBe("addressed_waiting_feedback");

    expect(
      getParticipationAdminCockpitQueueKey({
        ...baseItem(),
        impactStatus: "addressed",
        feedbackStatus: "approved_for_public_feedback",
        topicSummaryCount: 1,
      }),
    ).toBe("feedback_ready");

    expect(
      getParticipationAdminCockpitQueueKey({
        ...baseItem(),
        impactStatus: "feedback_available",
      }),
    ).toBe("archive_candidates");
  });

  it("derives allowed actions from impact and feedback status rules", () => {
    const queuedForReview = getParticipationAdminCockpitAllowedActions({
      ...baseItem(),
      impactStatus: "queued_for_review",
      topicSummaryCount: 1,
    });
    expect(queuedForReview).toContain("request_clarification");
    expect(queuedForReview).toContain("start_evaluation");
    expect(queuedForReview).toContain("mark_ready_for_review");
    expect(queuedForReview).toContain("approve_feedback_for_public");

    const inEvaluation = getParticipationAdminCockpitAllowedActions({
      ...baseItem(),
      impactStatus: "in_evaluation",
    });
    expect(inEvaluation).toContain("bundle_with_related");
    expect(inEvaluation).toContain("mark_addressed");

    const bundled = getParticipationAdminCockpitAllowedActions({
      ...baseItem(),
      impactStatus: "bundled",
    });
    expect(bundled).toContain("mark_addressed");
    expect(bundled).toContain("prepare_feedback");
  });

  it("only allows manual publish when feedback is publishable", () => {
    const draftItem = {
      ...baseItem(),
      impactStatus: "addressed" as const,
      topicSummaryCount: 1,
    };
    const publishableItem = {
      ...draftItem,
      feedbackStatus: "approved_for_public_feedback" as const,
    };

    expect(
      isParticipationAdminCockpitActionAllowed(
        draftItem,
        "publish_feedback_manually",
      ),
    ).toBe(false);
    expect(
      isParticipationAdminCockpitActionAllowed(
        publishableItem,
        "publish_feedback_manually",
      ),
    ).toBe(true);
  });

  it("keeps feedback_ready distinct from public visibility", () => {
    const item = createParticipationAdminCockpitItem({
      ...baseItem(),
      impactStatus: "addressed",
      feedbackStatus: "approved_for_public_feedback",
      topicSummaryCount: 1,
    });

    expect(item.queueKey).toBe("feedback_ready");
    expect(item.publicVisible).toBe(false);
  });

  it("keeps addressed_waiting_feedback distinct from political resolution", () => {
    const item = createParticipationAdminCockpitItem({
      ...baseItem(),
      impactStatus: "addressed",
    });

    expect(item.queueKey).toBe("addressed_waiting_feedback");
    expect(item.guardrails.addressedIsNotResolved).toBe(true);
    expect(item.publicVisible).toBe(false);
  });

  it("derives risk flags from source, minority, question and manual review state", () => {
    const item = createParticipationAdminCockpitItem({
      ...baseItem(),
      impactStatus: "addressed",
      sourceStatus: "unverified_input",
      minorityPositionCount: 1,
      openQuestionCount: 2,
      sensitiveClaimCount: 1,
    });

    expect(item.riskFlags).toEqual([
      "unverified_source",
      "sensitive_claim",
      "minority_position_present",
      "open_questions_present",
      "external_feedback_pending",
      "manual_review_required",
    ]);
    expect(hasParticipationAdminCockpitRisk(item)).toBe(true);
  });

  it("counts queue summaries correctly", () => {
    const summary = buildParticipationAdminCockpitSummary([
      {
        ...baseItem(),
        id: "item-1",
        impactStatus: "needs_clarification",
      },
      {
        ...baseItem(),
        id: "item-2",
        impactStatus: "queued_for_review",
        topicSummaryCount: 1,
      },
      {
        ...baseItem(),
        id: "item-3",
        impactStatus: "addressed",
      },
      {
        ...baseItem(),
        id: "item-4",
        impactStatus: "addressed",
        feedbackStatus: "approved_for_public_feedback",
        topicSummaryCount: 1,
      },
      {
        ...baseItem(),
        id: "item-5",
        impactStatus: "feedback_available",
      },
    ]);

    expect(summary.total).toBe(5);
    expect(summary.queues.find((queue) => queue.key === "needs_clarification")?.count).toBe(1);
    expect(summary.queues.find((queue) => queue.key === "ready_for_review")?.count).toBe(1);
    expect(summary.queues.find((queue) => queue.key === "addressed_waiting_feedback")?.count).toBe(1);
    expect(summary.queues.find((queue) => queue.key === "feedback_ready")?.count).toBe(1);
    expect(summary.queues.find((queue) => queue.key === "archive_candidates")?.count).toBe(1);
  });

  it("keeps guardrails explicit on items and summaries", () => {
    const item = createParticipationAdminCockpitItem({
      ...baseItem(),
      feedbackStatus: "published_feedback",
      impactStatus: "feedback_available",
      topicSummaryCount: 1,
    });
    const summary = buildParticipationAdminCockpitSummary([item]);

    expect(item.guardrails).toEqual({
      noAutoPublish: true,
      noAutoDossier: true,
      noAutoAnlassraum: true,
      noAutoGraph: true,
      noAutomaticOfficialAssessment: true,
      manualReviewRequiredForPublicFeedback: true,
      cockpitIsWorklistOnly: true,
      publishManualOnly: true,
      feedbackReadyIsNotPublic: true,
      addressedIsNotResolved: true,
      operatorReviewIsNotPoliticalDecision: true,
    });
    expect(summary.guardrails).toEqual(item.guardrails);
  });

  it("keeps helper outputs manual and free of automation triggers", () => {
    const item = createParticipationAdminCockpitItem({
      ...baseItem(),
      impactStatus: "addressed",
      feedbackStatus: "approved_for_public_feedback",
      topicSummaryCount: 1,
    });

    expect(item.allowedActions).toContain("publish_feedback_manually");
    expect(item.allowedActions).not.toContain("auto_publish" as never);
    expect(item.allowedActions).not.toContain("auto_dossier" as never);
    expect(item.allowedActions).not.toContain("auto_anlassraum" as never);
    expect(item.allowedActions).not.toContain("auto_graph" as never);
  });
});
