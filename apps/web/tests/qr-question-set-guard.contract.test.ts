import { describe, expect, it } from "vitest";
import { evaluateQrQuestionSetQuestion } from "@/features/create/qrQuestionSetGuard";

describe("QR question set public-question guard", () => {
  it("fails closed without an independent staff review", () => {
    const result = evaluateQrQuestionSetQuestion({
      question: "Welche Maßnahmen sollten Kommunen gegen Hitze priorisieren?",
    });

    expect(result.outcome).toBe("actor_extraction_review_required");
    expect(result.releaseState).toBe("review_required");
  });

  it("does not treat staff identity alone as independent extraction evidence", () => {
    const result = evaluateQrQuestionSetQuestion({
      question: "Welche Maßnahmen sollten Kommunen gegen Hitze priorisieren?",
      staffReviewerId: "admin-1",
    });

    expect(result.releaseState).toBe("review_required");
    expect(result.reasons).toContain("actor_extraction_not_independently_complete");
  });

  it("allows a general decision question with independently complete extraction evidence", () => {
    const result = evaluateQrQuestionSetQuestion({
      question: "Welche Maßnahmen sollten Kommunen gegen Hitze priorisieren?",
      actorContexts: [],
      actorExtraction: {
        status: "complete",
        source: "actor_graph",
        independentFromCandidateProvider: true,
        evidenceRefs: ["actor-graph-run-1"],
      },
    });

    expect(result.releaseState).toBe("draft_allowed");
  });

  it.each([
    ["Stimmt es, dass die Emissionen seit 2020 gesunken sind?", "fact_or_truth_question_blocked"],
    ["Sollen wir diese Gruppe verprügeln?", "safety_blocked"],
  ])("keeps %s blocked before QR activation", (question, outcome) => {
    const result = evaluateQrQuestionSetQuestion({
      question,
    });

    expect(result.outcome).toBe(outcome);
    expect(result.releaseState).toBe("blocked");
  });
});
