import { afterEach, describe, expect, it } from "vitest";

import { buildCreatePlanner } from "@/features/create/createPlanner";

const COMPLEX_INPUT =
  "Ich bin schon für die Würde des Menschen, aber stelle dessen Legitimation in Frage für all jene, die die Gesellschaft massiv und/oder wiederholt einem einzelnen irreparablen Schaden verursacht. Ich bin für eine offene Grenzpolitik, in meiner Welt gibt es diese nicht. Ich hätte eine einheitliche Energie- und Industriepolitik in Gesamt-Europa. Ich würde das Volk in seinen Regionen abstimmen lassen, insbesondere zu kleineren Fragestellungen. Ich würde das Budget anders verteilen und nicht nur pauschal, gäbe anderen Pflichten und Rechte, aber im Einklang des Grundgesetzes.";

describe("create planner complex civic input contract", () => {
  const originalOpenAiKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAiKey;
  });

  it("builds a concrete multi-cluster first-understanding result for complex civic texts", async () => {
    process.env.OPENAI_API_KEY = "";

    const planner = await buildCreatePlanner({
      text: COMPLEX_INPUT,
      locale: "de",
    });

    expect(planner.plannerRole).toBe("planner_only");
    expect(planner.qualityStatus).toBe("specific");
    expect(planner.plannerCore).toContain("Menschenwürde");
    expect(planner.plannerCore).toContain("Migration");
    expect(planner.plannerCore).toContain("Budget");
    expect(planner.plannerTopic).toContain("Grundrechte");
    expect(planner.plannerTopic).toContain("demokratische Priorisierung");
    expect(planner.plannerClusters).toEqual(
      expect.arrayContaining([
        "Menschenwürde, Grundrechte und Verantwortung",
        "Migration, offene Grenzen und gesellschaftliche Regeln",
        "Europäische Energie- und Industriepolitik",
        "Regionale Abstimmungen und Bürgerbeteiligung",
        "Budgetverteilung und öffentliche Prioritäten",
      ]),
    );
    expect(planner.plannerScope).toEqual(expect.arrayContaining(["federal", "eu", "local"]));
    expect(["mixed", "reform_oriented", "unclear"]).toContain(planner.plannerStance);
    expect(planner.plannerOpenQuestions[0]).toContain("Welcher Teil soll zuerst bearbeitet werden");
    expect(planner.graphSearchTerms).toEqual(
      expect.arrayContaining([
        "Menschenwürde",
        "Grundrechte",
        "Migration",
        "offene Grenzen",
        "EU Energiepolitik",
        "Industriepolitik Europa",
        "regionale Abstimmungen",
        "Bürgerbeteiligung",
        "Budgetpriorisierung",
      ]),
    );
  });
});
