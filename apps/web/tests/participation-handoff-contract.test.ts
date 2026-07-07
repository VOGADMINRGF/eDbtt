import { describe, expect, it } from "vitest";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";

describe("participation handoff contract", () => {
  it("maps poll recommendations to draft-only poll candidates", () => {
    const candidate = buildParticipationHandoffCandidate({
      id: "p1",
      recommendation: "poll",
      title: "Parkraum",
      prompt: "Soll die Straße verkehrsberuhigt werden?",
      options: ["Ja", "Nein", "Ja"],
    });

    expect(candidate.candidateType).toBe("poll_candidate");
    expect(candidate.options).toHaveLength(2);
    expect(candidate.reviewRequired).toBe(true);
    expect(candidate.autoActivate).toBe(false);
    expect(candidate.neutralityHint).toContain("neutral");
  });

  it("keeps statement and participation candidates in draft-only state", () => {
    expect(
      buildParticipationHandoffCandidate({
        id: "p2",
        recommendation: "statement_review",
        title: "These",
        prompt: "Die Verwaltung sollte...",
      }).activationState,
    ).toBe("draft_only");
  });
});
