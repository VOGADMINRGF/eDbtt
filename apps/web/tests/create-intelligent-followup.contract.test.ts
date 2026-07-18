import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import {
  buildCreateStructureBranches,
  buildCreateVisualMap,
  buildCreateVisualSections,
} from "@/features/create/intelligentFollowupContract";
import {
  PART06_CATEGORY_KEYS,
  PART06_CATEGORY_LABEL_BY_KEY,
} from "@/features/create/part06TopicMapping";

function analyzeFixture() {
  return {
    mode: "E150",
    sourceText: null,
    language: "de",
    claims: [
      {
        id: "c1",
        text: "Die Stadt sollte mehr sichere Schulwege umsetzen.",
        topic: "Schulwege",
        domain: "verkehr",
        domains: ["verkehr", "bildung"],
        stance: "pro",
        statementType: "interpretation",
        importance: 4,
      },
    ],
    findings: [],
    notes: [{ id: "n1", text: "Hinweis aus der Nachbarschaft" }],
    questions: [{ id: "q1", text: "Welche Maßnahmen sind kurzfristig umsetzbar?" }],
    missingPerspectives: [],
    knots: [],
    consequences: { consequences: [], responsibilities: [] },
    responsibilityPaths: [],
    eventualities: [],
    decisionTrees: [],
    impactAndResponsibility: { impacts: [], responsibleActors: [] },
    participationCandidates: [],
    report: {
      summary: "Mehr Sicherheit auf Schulwegen wird als dringlich beschrieben.",
      keyConflicts: [],
      facts: { local: [], international: [] },
      openQuestions: [],
      takeaways: [],
    },
  };
}

describe("create intelligent follow-up contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "";
  });

  it("builds understanding with categories, topics and statements for normal input", async () => {
    mocks.analyzeContribution.mockResolvedValue(analyzeFixture());
    const result = await buildCreateIntelligentFollowup({
      text: "Wir brauchen sichere Schulwege in unserem Bezirk.",
      locale: "de",
      intent: "contribute",
      anlassraumId: "65f000000000000000000001",
    });

    expect(result.understanding.categories.length).toBeGreaterThan(0);
    expect(result.understanding.topics.length).toBeGreaterThan(0);
    expect(result.understanding.statements.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.every((suggestion) => suggestion.requiresConfirmation === true)).toBe(true);
    expect(result.meta?.researchUsed).toBe("none");
    expect(result.meta?.deepSearchUsed).toBe(false);
    const maybeVoteSuggestion = result.suggestions.find((suggestion) => suggestion.kind === "vote");
    if (maybeVoteSuggestion) {
      expect(maybeVoteSuggestion.href).toContain("/swipes?");
      expect(maybeVoteSuggestion.href).toContain("claim=");
      expect(maybeVoteSuggestion.href).toContain("from=create");
    }
    const visualMap = buildCreateVisualMap(result);
    expect(visualMap.center.label).toBe("Dein Beitrag");
    expect(visualMap.nodes.some((node) => node.kind === "statement")).toBe(true);
    expect(visualMap.nodes.some((node) => node.kind === "topic")).toBe(true);
    expect(visualMap.nodes.some((node) => node.kind === "stance")).toBe(true);
    expect(visualMap.nodes.some((node) => node.kind === "dossier" || node.kind === "anlassraum" || node.kind === "vote" || node.kind === "new_anlassraum")).toBe(true);
    const connectionKinds = visualMap.nodes
      .filter((node) => node.kind === "dossier" || node.kind === "anlassraum" || node.kind === "new_anlassraum")
      .map((node) => node.kind);
    expect(connectionKinds).toEqual(expect.arrayContaining(["dossier"]));
    expect(connectionKinds.some((kind) => kind === "anlassraum" || kind === "new_anlassraum")).toBe(true);
  });

  it("keeps a degraded manual path when the fast planner stays provisional", async () => {
    const result = await buildCreateIntelligentFollowup({
      text: "Bitte prüft diese Aussage zur Energieversorgung.",
      locale: "de",
      intent: "check",
    });

    expect(result.degraded).toBe(true);
    expect(result.degradedReason).toBeTruthy();
    expect(result.understanding.categories[0]?.label).toBeTruthy();
    expect(result.suggestions[0]?.requiresConfirmation).toBe(true);
  });

  it("derives policy fallback topics/categories/stance for governance-heavy text", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
    const result = await buildCreateIntelligentFollowup({
      text:
        "Minister und gewählte Repräsentanten brauchen klare Qualifikation. Bei Verstößen sollten Sanktionen greifen. Option B und Option C sollen im Gesetzesentwurf geprüft werden.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.degraded).toBe(true);
    expect(result.understanding.openQuestion).toBe("Für welche Ämter sollen diese Regeln gelten?");
    expect(result.understanding.summary).toContain("politische Ämter");
    expect(result.understanding.scopes).toContain("federal");
    expect(result.understanding.categories.map((item) => item.label)).toEqual(
      expect.arrayContaining(["Forderung", "Kritik", "Vorschlag"]),
    );
    expect(result.understanding.topics.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Politische Verantwortung",
        "Amtsträger",
        "Qualifikation",
        "Sanktionen",
        "Gesetzgebung",
        "Abstimmungsoptionen",
      ]),
    );
    expect(result.understanding.statements[0]?.stance).toBe("pro");
    expect(result.suggestions.length).toBeGreaterThan(0);
    const dossierSuggestion = result.suggestions.find((item) => item.kind === "dossier");
    const voteSuggestion = result.suggestions.find((item) => item.kind === "vote");
    expect(dossierSuggestion?.href).toContain("/dossier?");
    expect(dossierSuggestion?.href).toContain("topic=");
    expect(voteSuggestion?.href).toContain("/swipes?");
    expect(voteSuggestion?.href).toContain("topic=");
    expect(voteSuggestion?.href).toContain("claim=");
    expect(voteSuggestion?.href).toContain("from=create");
    expect(voteSuggestion?.title).toContain("Qualifikation");
    expect(result.suggestions.every((item) => item.requiresConfirmation)).toBe(true);
    const visualMap = buildCreateVisualMap(result);
    expect(visualMap.nodes.map((node) => node.label)).toEqual(
      expect.arrayContaining([
        "Politische Ämter, Qualifikation und Verantwortung",
        "Amtsträger",
        "Qualifikation",
        "Sanktionen",
        "Gesetzgebung",
      ]),
    );
    const sections = buildCreateVisualSections(result, 4);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.label).not.toContain("Abschnitt");
    expect(sections[0]?.label).toMatch(/Teil|Wohnen|Verkehr|Bildung|Integration|Was du forderst|Welche Lösung du vorschlägst|Was noch offen ist/);
  });

  it("splits long source text into readable sections for visual follow-up", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
    const longText = [
      "Ich sehe ein Problem bei politischen Mandaten und fehlender Kontrolle.",
      "Ministerämter brauchen nachvollziehbare Mindestanforderungen.",
      "Bei Verstößen sollten Sanktionen greifen und transparent dokumentiert werden.",
      "Option B und C sollten in der Agenda bleiben, statt gelöscht zu werden.",
    ].join(" ");
    const result = await buildCreateIntelligentFollowup({
      text: longText,
      locale: "de",
      intent: "contribute",
    });
    const sections = buildCreateVisualSections(result, 4);
    expect(sections.length).toBeGreaterThan(1);
    expect(sections.every((section) => section.sourceText.length > 0)).toBe(true);
    expect(sections[0]?.label).not.toContain("Abschnitt");
  });

  it("gives long municipal sections individual passage-based titles", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
    const result = await buildCreateIntelligentFollowup({
      text: [
        "Wir brauchen schnellere Genehmigungen für kommunalen Wohnungsbau und bezahlbare Mieten.",
        "",
        "Der Verkehr muss mit Bus, Bahn, Radwegen und alltagstauglichen Wegen zum Klimaziel passen.",
        "",
        "Schulen, Sprachförderung und Bildung brauchen eine verlässliche Priorität.",
        "",
        "Migration, Sicherheit und Verwaltung müssen gleichzeitig handhabbar bleiben.",
      ].join("\n\n"),
      locale: "de",
      intent: "contribute",
    });

    const sections = buildCreateVisualSections(result, 4);
    expect(sections).toHaveLength(4);
    expect(new Set(sections.map((section) => section.label)).size).toBe(sections.length);
    expect(sections.every((section) => section.label.trim().length > 0)).toBe(true);
    expect(sections.some((section) => /Wohnen|Genehmigungen/.test(section.label))).toBe(true);
    expect(sections.some((section) => /Verkehr|Klima|Mobilität/.test(section.label))).toBe(true);
    expect(sections.some((section) => /Abschnitt|Teil|Schwerpunkt/.test(section.label))).toBe(false);
  });

  it("infers broad municipal dossier context and topic fields for wide civic texts", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
    const result = await buildCreateIntelligentFollowup({
      text:
        "Wir müssen Wohnen bezahlbar halten, den Verkehr alltagstauglich umbauen, Klimaziele erreichbar machen, Bildung und Sprachförderung verbessern, Integration verlässlich gestalten, Sicherheit und Rechtsstaat stärken, Pflege sichern, kommunale Finanzen stabilisieren und Bürgerbeteiligung ernsthaft priorisieren.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.degraded).toBe(true);
    expect(result.understanding.dossierContext).toBe("Kommunale Prioritäten und Zielkonflikte");
    expect(result.understanding.topics.length).toBeGreaterThanOrEqual(9);
    expect(result.understanding.topics.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Kommunale Prioritäten und Zielkonflikte",
        "Wohnen",
        "Verkehr",
        "Klima",
        "Bildung",
        "Migration/Integration",
        "Sicherheit/Rechtsstaat",
        "Gesundheit/Pflege",
        "Kommunale Finanzen",
        "Bürgerbeteiligung",
      ]),
    );
    expect(result.understanding.positionClusters?.map((item) => item.label)).toEqual(
      expect.arrayContaining(["sozial/ausgleichend", "ordnungs-/leistungsorientiert", "pragmatisch/abwägend"]),
    );
    expect(result.understanding.topics.map((item) => item.label)).not.toEqual(
      expect.arrayContaining(["Amtsträger", "Qualifikation", "Sanktionen"]),
    );

    const dossierSuggestion = result.suggestions.find((item) => item.kind === "dossier");
    expect(dossierSuggestion?.title).toContain("Kommunale Prioritäten und Zielkonflikte");
    expect(dossierSuggestion?.href).toContain("/dossier?");
    expect(dossierSuggestion?.href).not.toContain("/swipes?");

    const voteSuggestion = result.suggestions.find((item) => item.kind === "vote");
    if (voteSuggestion) {
      expect(voteSuggestion.title).toBe("Welche kommunalen Prioritäten sollen zuerst bearbeitet werden?");
    }
  });

  it("derives multi-topic structure branches for broad municipal input", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
    const result = await buildCreateIntelligentFollowup({
      text:
        "Wir brauchen schnellere Genehmigungen für kommunalen Wohnungsbau, aber Zweckentfremdung und Auflagen müssen fair bleiben. Verkehrspolitik muss Bus und Bahn, Radwege, Handwerker, Pflegekräfte und Familien berücksichtigen, ohne Klimaziele aufzugeben. Schulen brauchen digitale Ausstattung, verbindliche Sprachförderung und weniger Leistungsdruck. Migration und Integration dürfen nicht gegen Sicherheit und Rechtsstaat ausgespielt werden. Gesundheit, Pflege, kommunale Finanzen und Bürgerbeteiligung müssen mitgedacht werden.",
      locale: "de",
      intent: "contribute",
    });

    const branches = buildCreateStructureBranches(result, 5);
    expect(result.understanding.dossierContext).toBe("Kommunale Prioritäten und Zielkonflikte");
    expect(branches.length).toBeGreaterThanOrEqual(3);
    expect(branches[0]?.title).not.toMatch(/Teil \d/);
    expect(branches.flatMap((branch) => branch.voteQuestions).length).toBeGreaterThan(0);
    expect(branches.every((branch) => branch.summary.length > 0)).toBe(true);
    expect(branches.every((branch) => branch.subtopics.length > 0)).toBe(true);
    expect(branches.every((branch) => branch.evidenceSnippets.length > 0)).toBe(true);
    expect(branches.flatMap((branch) => branch.part06CategoryKeys).length).toBeGreaterThan(0);
    expect(branches.some((branch) => branch.relatedTopicIds.length > 0)).toBe(true);
    expect(branches.flatMap((branch) => branch.suggestedQuestions)).not.toHaveLength(0);
    expect(branches.every((branch) => branch.openReviewPoints.length > 0)).toBe(true);
  });

  it("keeps exactly the 15 Part06 categories as the create mapping baseline", () => {
    expect(PART06_CATEGORY_KEYS).toHaveLength(15);
    expect(PART06_CATEGORY_KEYS).toEqual([
      "democracy_elections",
      "budget_finance",
      "work_economy",
      "social_family",
      "education_research",
      "health_care",
      "climate_environment",
      "energy_infrastructure",
      "mobility_urban",
      "interior_security",
      "justice_law",
      "migration_integration",
      "digital_media",
      "europe_foreign",
      "local_community",
    ]);
    expect(PART06_CATEGORY_LABEL_BY_KEY.work_economy).toBe("Arbeit & Wirtschaft");
    expect(PART06_CATEGORY_LABEL_BY_KEY.mobility_urban).toBe("Mobilität & Stadtentwicklung");
    expect(PART06_CATEGORY_LABEL_BY_KEY.local_community).toBe("Kommunales & Lebensumfeld");
  });

  it("does not prepare a vote handoff from a generic planner result", async () => {
    mocks.analyzeContribution.mockResolvedValue({
      ...analyzeFixture(),
      claims: [
        {
          id: "c-vote",
          text: "Soll die Abstimmung im Bezirk neu aufgesetzt werden?",
          topic: "Abstimmung",
          domain: "verwaltung",
          domains: ["verwaltung"],
          stance: "contra",
          statementType: "question",
          importance: 5,
        },
      ],
    });

    const result = await buildCreateIntelligentFollowup({
      text: "Ich möchte zur Abstimmung im Bezirk eine klare Korrektur.",
      locale: "de",
      intent: "check",
    });

    expect(result.meta?.planner.qualityStatus).not.toBe("specific");
    expect(result.suggestions.find((suggestion) => suggestion.kind === "vote")).toBeUndefined();
  });
});
