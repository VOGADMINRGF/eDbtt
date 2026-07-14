import { describe, expect, it } from "vitest";
import { buildParticipationModerationAgentRuntimeContract } from "@/features/agenticRuntime/participationModerationAgentRuntimeContract";

describe("participation moderation agent runtime contract", () => {
  it("keeps format fitness, clustering and moderation as review-first candidates", () => {
    const model = buildParticipationModerationAgentRuntimeContract({
      id: "participation-1",
      recommendation: "poll",
      title: "Schulwegfrage",
      prompt: "Welche Massnahme zuerst?",
      options: ["Zebrastreifen", "Tempo 30"],
      clusterHints: ["Morgendliche Schulwegsicherheit"],
      missingPerspectiveHints: ["Schuelerinnen und Schueler", "Anwohnende ohne Auto"],
    });

    expect(model.participationCandidate.candidateType).toBe("poll_candidate");
    expect(model.formatFitness.finalParticipationDecision).toBe(false);
    expect(model.clusteringCandidates[0]).toMatchObject({ merged: false });
    expect(model.missingPerspectiveCandidates[0]).toMatchObject({
      requiredUserPosition: false,
    });
    expect(model.moderationSuggestions[0]).toMatchObject({
      enforcementAction: false,
    });
    expect(model.noVotingForUser).toBe(true);
    expect(model.noPremiumVoteWeighting).toBe(true);
    expect(model.noExternalNotification).toBe(true);
    expect(model.safeTrace[0]).toMatchObject({
      roleId: "participation_moderation",
      status: "review_required",
    });
  });
});
