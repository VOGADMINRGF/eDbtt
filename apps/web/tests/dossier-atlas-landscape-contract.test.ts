import { describe, expect, it } from "vitest";
import {
  evaluateDossierAtlasLandscapeConsistency,
  parseDossierAtlasLandscapeContract,
  resolveDossierAtlasLandscapeContract,
} from "@features/anlassraum/dossierAtlasLandscapeContract";

describe("dossier atlas landscape contract", () => {
  it("builds atlas nodes/relations with separated topic and region axes", () => {
    const contract = resolveDossierAtlasLandscapeContract({
      generatedAt: "2026-04-04T15:30:00.000Z",
      items: [
        {
          title: "Waermewende Innenstadt",
          topicKey: "waermewende",
          topicLabel: "Waermewende",
          regionKey: "berlin",
          regionCode: "DE-BE",
          anlassId: "anlass-1",
          dossierId: "dossier-1",
          roundId: "round-1",
          resultId: "result-1",
          companionId: "companion-1",
          lifecycle: "closed",
          activityBand: "high",
          workState: "completed",
          contextGroups: ["association", "editorial_publisher", "expert_voice"],
        },
        {
          title: "Quartiersverkehr",
          topicKey: "mobilitaet",
          topicLabel: "Mobilitaet",
          regionKey: "hamburg",
          regionCode: "DE-HH",
          anlassId: "anlass-2",
          roundId: "round-2",
          lifecycle: "active",
          activityBand: "medium",
          workState: "in_progress",
          contextGroups: ["initiative", "civic_creator"],
        },
      ],
      weeklySnapshot: {
        openQuestions: 8,
      },
    });

    expect(contract.topicAxis.separatedFromRegionAxis).toBe(true);
    expect(contract.regionAxis.separatedFromTopicAxis).toBe(true);
    expect(contract.nodes.some((node) => node.nodeType === "topic_cluster")).toBe(true);
    expect(contract.nodes.some((node) => node.nodeType === "anlass_node")).toBe(true);
    expect(contract.nodes.some((node) => node.nodeType === "dossier_node")).toBe(true);
    expect(contract.nodes.some((node) => node.nodeType === "round_node")).toBe(true);
    expect(contract.nodes.some((node) => node.nodeType === "result_node")).toBe(true);
    expect(contract.nodes.some((node) => node.nodeType === "companion_node")).toBe(true);
    expect(
      contract.relationships.some(
        (edge) => edge.relationType === "context_marks_anlass",
      ),
    ).toBe(true);
    expect(contract.aggregates.weeklySnapshot.openQuestions).toBe(8);
  });

  it("keeps context visibility non-epistemic and non-priority", () => {
    const contract = resolveDossierAtlasLandscapeContract({
      items: [
        {
          title: "Schulwege",
          topicKey: "bildung",
          anlassId: "anlass-3",
          roundId: "round-3",
          lifecycle: "active",
          contextGroups: ["organization", "editorial_publisher"],
        },
      ],
    });

    expect(contract.guardrails.forbidsTruthPrivilegeFromContext).toBe(true);
    expect(contract.guardrails.forbidsPriorityPrivilegeFromContext).toBe(true);
    expect(contract.guardrails.forbidsVotingPrivilegeFromContext).toBe(true);
    expect(contract.guardrails.forbidsReputationScoring).toBe(true);
    expect(
      contract.relationships.every(
        (edge) => edge.nonEpistemic && edge.nonPriorityBoost,
      ),
    ).toBe(true);
  });

  it("validates parsing and consistency checks", () => {
    const contract = resolveDossierAtlasLandscapeContract({
      items: [
        {
          title: "Energiepreise",
          topicKey: "energie",
          anlassId: "anlass-4",
          roundId: "round-4",
          lifecycle: "active",
        },
      ],
    });

    const parsed = parseDossierAtlasLandscapeContract(contract);
    expect(parsed.ok).toBe(true);

    const consistency = evaluateDossierAtlasLandscapeConsistency(contract);
    expect(consistency.ok).toBe(true);
    expect(consistency.issues).toEqual([]);
  });
});
