import { describe, expect, it } from "vitest";

import { validateCreatePlannerQuality } from "@/features/create/createPlanner";

const COMPLEX_INPUT =
  "Ich bin schon für die Würde des Menschen, aber stelle dessen Legitimation in Frage für all jene, die die Gesellschaft massiv und/oder wiederholt einem einzelnen irreparablen Schaden verursacht. Ich bin für eine offene Grenzpolitik, in meiner Welt gibt es diese nicht. Ich hätte eine einheitliche Energie- und Industriepolitik in Gesamt-Europa. Ich würde das Volk in seinen Regionen abstimmen lassen, insbesondere zu kleineren Fragestellungen. Ich würde das Budget anders verteilen und nicht nur pauschal, gäbe anderen Pflichten und Rechte, aber im Einklang des Grundgesetzes.";

describe("create planner quality gate contract", () => {
  it("marks generic planner outputs as insufficient for complex multi-topic input", () => {
    const quality = validateCreatePlannerQuality(
      {
        plannerCore: "Aussage",
        plannerTopic: "Öffentliches Anliegen mit Klärungsbedarf",
        plannerClusters: [],
        plannerScope: ["unclear"],
        graphSearchTerms: ["Öffentliches Anliegen"],
        topicCandidates: ["Öffentliches Anliegen mit Klärungsbedarf"],
        clusterCandidates: [],
        scopeCandidates: ["unclear"],
      },
      COMPLEX_INPUT,
    );

    expect(["generic", "needs_confirmation"]).toContain(quality.qualityStatus);
    expect(quality.qualityIssues).toEqual(
      expect.arrayContaining([
        "core_generic",
        "topic_generic",
        "clusters_too_few_for_complex_input",
      ]),
    );
  });

  it("rejects foreign fallback domains when they are not present in the source text", () => {
    const quality = validateCreatePlannerQuality(
      {
        plannerCore: "Aussage",
        plannerTopic: "Öffentliches Anliegen mit Klärungsbedarf",
        plannerClusters: ["Amtsträger", "Wohnen", "Verkehr", "Klima"],
        plannerScope: ["unclear"],
        graphSearchTerms: ["Amtsträger", "Wohnen", "Verkehr", "Klima"],
        topicCandidates: ["Amtsträger", "Wohnen", "Verkehr", "Klima"],
        clusterCandidates: ["Amtsträger", "Wohnen", "Verkehr", "Klima"],
        scopeCandidates: ["unclear"],
      },
      COMPLEX_INPUT,
    );

    expect(quality.qualityIssues).toEqual(
      expect.arrayContaining([
        "foreign_officeholder_domain",
        "foreign_housing_domain",
        "foreign_traffic_domain",
        "foreign_climate_domain",
      ]),
    );
  });
});
