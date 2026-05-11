import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import { buildCreateStructureBranches } from "@/features/create/intelligentFollowupContract";

const TIERWOHL_TEXT =
  "Ich bin für besseren Tierschutz und Tierhaltung und denke das ist moralisch schwierig. Das Ganze sollte Europa und weltweit einheitlich umgesetzt werden, mindestens in den Ländern, in denen wir unmittelbar importieren bzw. exportieren. Das sollte für alle gelten: Fleisch, Geflügel, Fisch. Tierhaltung Agrar, Tierwohl, ethische Frage, Stellung Bundes europaweit, Bio Label, Haltungsstufe etc.";

describe("create follow-up tierwohl mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "";
  });

  it("maps tierwohl, import-export and eu/international scope without officeholder drift", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));

    const result = await buildCreateIntelligentFollowup({
      text: TIERWOHL_TEXT,
      locale: "de",
      intent: "contribute",
    });
    const branches = buildCreateStructureBranches(result, 5);
    const topicLabels = result.understanding.topics.map((topic) => topic.label);
    const branchTitles = branches.map((branch) => branch.title);
    const suggestionTitles = result.suggestions.map((suggestion) => suggestion.title);

    expect(result.meta?.planner.plannerTopic).toBe("Tierschutz, Tierhaltung und Agrarstandards");
    expect(result.meta?.planner.providerPlan.plannerRole).toBe("planner_only");
    expect(result.meta?.researchUsed).toBe("none");
    expect(result.meta?.deepSearchUsed).toBe(false);
    expect(result.understanding.statements[0]?.text).toBe("Forderung nach besseren Tierschutz- und Tierhaltungsstandards");
    expect(result.understanding.scopes).toEqual(expect.arrayContaining(["eu", "federal", "international"]));
    expect(topicLabels).toEqual(
      expect.arrayContaining([
        "Tierschutz, Tierhaltung und Agrarstandards",
        "Tierwohl",
        "Import und Export",
      ]),
    );
    expect(topicLabels.join(" ")).toContain("Bio-Label");
    expect(topicLabels.join(" ")).toContain("Haltungsstufen");
    expect(branchTitles).toEqual(
      expect.arrayContaining([
        "Tierwohl und Haltungsstandards",
        "Import- und Exportregeln",
        "EU-/internationale Mindeststandards",
        "Verbraucherinformation / Kennzeichnung / Bio-Label / Haltungsstufen",
        "ethische Bewertung von Tierhaltung",
      ]),
    );
    expect(result.understanding.openQuestion).toBe("Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?");
    expect(suggestionTitles.some((title) => /amtstr[aä]ger|wohnen|verkehr|klima/i.test(title))).toBe(false);
    expect(topicLabels.some((label) => /amtstr[aä]ger|wohnen|verkehr|klima/i.test(label))).toBe(false);
    expect(topicLabels[0]).not.toBe("Öffentliches Anliegen");
  });
});
