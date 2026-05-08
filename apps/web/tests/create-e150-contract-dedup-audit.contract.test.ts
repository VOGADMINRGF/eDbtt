import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCreateStructureBranches,
  type CreateIntelligentFollowupResult,
} from "@/features/create/intelligentFollowupContract";
import {
  PART06_CATEGORY_KEYS,
  PART06_CATEGORY_LABEL_BY_KEY,
} from "@/features/create/part06TopicMapping";
import { resolveCreateLinkIntentE150Mapping } from "@/features/create/linkIntake";

describe("create E150 contract dedup audit", () => {
  it("keeps link intake explicitly scoped as a Part16 UI mirror without auto-evaluation", () => {
    const linkIntakeSource = readFileSync(
      resolve(process.cwd(), "src/features/create/linkIntake.ts"),
      "utf8",
    );

    expect(linkIntakeSource).toContain("UI mirror for E150 Part16 Intake-Orchestrierung");
    expect(linkIntakeSource).toContain("sourceHints");
    expect(linkIntakeSource).toContain("missingInfoQuestions");
    expect(linkIntakeSource).toContain("evidenceNeeds");
    expect(linkIntakeSource).toContain("questionCandidates");
    expect(linkIntakeSource).toContain("does not scrape, summarize or auto-evaluate linked content");

    expect(resolveCreateLinkIntentE150Mapping("prepare_factcheck")).toEqual({
      inputType: "url",
      mapsTo: ["sourceHints", "evidenceNeeds", "missingInfoQuestions"],
    });
    expect(resolveCreateLinkIntentE150Mapping("derive_vote_questions")).toEqual({
      inputType: "material_mix",
      mapsTo: ["questionCandidates", "missingInfoQuestions"],
    });
  });

  it("keeps the Part06 mirror at exactly 15 canonical categories", () => {
    const part06Source = readFileSync(
      resolve(process.cwd(), "src/features/create/part06TopicMapping.ts"),
      "utf8",
    );

    expect(part06Source).toContain("stable mirror for UI usage and contract tests only");
    expect(part06Source).toContain("not a parallel taxonomy");
    expect(PART06_CATEGORY_KEYS).toHaveLength(15);
    expect(PART06_CATEGORY_LABEL_BY_KEY.democracy_elections).toBe("Demokratie & Wahlen");
    expect(PART06_CATEGORY_LABEL_BY_KEY.digital_media).toBe("Digitalisierung & Medien");
    expect(PART06_CATEGORY_LABEL_BY_KEY.local_community).toBe("Kommunales & Lebensumfeld");
  });

  it("documents structure branches as UI-only view models and keeps branch rules heuristic", () => {
    const contractSource = readFileSync(
      resolve(process.cwd(), "src/features/create/intelligentFollowupContract.ts"),
      "utf8",
    );

    expect(contractSource).toContain("UI-only ViewModel for the active-branch workspace");
    expect(contractSource).toContain("Heuristische UI-Grouping-Regeln");
    expect(contractSource).toContain("part06CategoryKeys");
  });

  it("keeps hidden or unassigned topics visible as overflow for broad municipal input", () => {
    const result: CreateIntelligentFollowupResult = {
      sourceText:
        "Wir brauchen schnellere Genehmigungen fuer kommunalen Wohnungsbau. Verkehrspolitik muss Bus und Bahn, Radwege und Klimaziele ausbalancieren. Schulen brauchen Sprachfoerderung. Integration darf nicht gegen Sicherheit ausgespielt werden. Gesundheit, Pflege, kommunale Finanzen, Buergerbeteiligung und Energieversorgung muessen mitgedacht werden.",
      generatedAt: "2026-05-08T00:00:00.000Z",
      understanding: {
        summary: "Breiter kommunaler Prioritaetenkonflikt.",
        dossierContext: "Kommunale Prioritäten und Zielkonflikte",
        confidence: "medium",
        categories: [{ id: "cat-1", label: "Forderung", confidence: "medium" }],
        topics: [
          { id: "topic-1", label: "Wohnen", confidence: "high" },
          { id: "topic-2", label: "Verkehr", confidence: "high" },
          { id: "topic-3", label: "Klima", confidence: "medium" },
          { id: "topic-4", label: "Bildung", confidence: "high" },
          { id: "topic-5", label: "Integration", confidence: "medium" },
          { id: "topic-6", label: "Sicherheit", confidence: "medium" },
          { id: "topic-7", label: "Gesundheit/Pflege", confidence: "medium" },
          { id: "topic-8", label: "Kommunale Finanzen", confidence: "medium" },
          { id: "topic-9", label: "Bürgerbeteiligung", confidence: "medium" },
          { id: "topic-10", label: "Energieversorgung", confidence: "low" },
        ],
        statements: [
          {
            id: "stmt-1",
            text: "Kommunaler Wohnungsbau braucht schnellere Genehmigungen.",
            kind: "claim",
            stance: "pro",
            confidence: "medium",
          },
          {
            id: "stmt-2",
            text: "Bus und Bahn muessen alltagstauglich bleiben, ohne Klimaziele aufzugeben.",
            kind: "claim",
            stance: "mixed",
            confidence: "medium",
          },
          {
            id: "stmt-3",
            text: "Schulen brauchen Sprachfoerderung und Integration darf nicht gegen Sicherheit ausgespielt werden.",
            kind: "claim",
            stance: "open",
            confidence: "medium",
          },
          {
            id: "stmt-4",
            text: "Gesundheit und Pflege muessen mitgedacht werden.",
            kind: "claim",
            stance: "open",
            confidence: "low",
          },
          {
            id: "stmt-5",
            text: "Kommunale Finanzen und Buergerbeteiligung brauchen klare Prioritaeten.",
            kind: "claim",
            stance: "open",
            confidence: "medium",
          },
        ],
        scopes: ["municipal"],
        positionClusters: [{ id: "cluster-1", label: "pragmatisch/abwägend", confidence: "medium" }],
      },
      suggestions: [],
    };

    const branches = buildCreateStructureBranches(result, 3);

    expect(branches).toHaveLength(3);
    expect(branches[2]?.overflowTopics).toEqual(
      expect.arrayContaining([
        "Gesundheit/Pflege",
        "Kommunale Finanzen",
        "Bürgerbeteiligung",
        "Energieversorgung",
      ]),
    );
    expect(branches.flatMap((branch) => branch.topics)).toEqual(
      expect.arrayContaining(["Wohnen", "Verkehr", "Klima", "Bildung", "Integration", "Sicherheit"]),
    );
  });
});
