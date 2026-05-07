import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import {
  buildCreateVisualMap,
  buildCreateVisualSections,
} from "@/features/create/intelligentFollowupContract";

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
  });

  it("builds understanding with categories, topics and statements for normal input", async () => {
    mocks.analyzeContribution.mockResolvedValue(analyzeFixture());
    const result = await buildCreateIntelligentFollowup({
      text: "Wir brauchen sichere Schulwege in unserem Bezirk.",
      locale: "de",
      intent: "contribute",
      anlassraumId: "65f000000000000000000001",
    });

    expect(result.degraded).toBe(false);
    expect(result.understanding.categories.length).toBeGreaterThan(0);
    expect(result.understanding.topics.length).toBeGreaterThan(0);
    expect(result.understanding.statements.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.every((suggestion) => suggestion.requiresConfirmation === true)).toBe(true);
    const visualMap = buildCreateVisualMap(result);
    expect(visualMap.center.label).toBe("Dein Beitrag");
    expect(visualMap.nodes.some((node) => node.kind === "statement")).toBe(true);
    expect(visualMap.nodes.some((node) => node.kind === "topic")).toBe(true);
    expect(visualMap.nodes.some((node) => node.kind === "stance")).toBe(true);
    expect(visualMap.nodes.some((node) => node.kind === "dossier" || node.kind === "anlassraum" || node.kind === "vote" || node.kind === "new_anlassraum")).toBe(true);
    const connectionKinds = visualMap.nodes
      .filter((node) => node.kind === "dossier" || node.kind === "vote" || node.kind === "anlassraum" || node.kind === "new_anlassraum")
      .map((node) => node.kind);
    expect(connectionKinds).toEqual(expect.arrayContaining(["dossier", "vote"]));
    expect(connectionKinds.some((kind) => kind === "anlassraum" || kind === "new_anlassraum")).toBe(true);
  });

  it("falls back to degraded mode when analyzeContribution fails", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
    const result = await buildCreateIntelligentFollowup({
      text: "Bitte prüft diese Aussage zur Energieversorgung.",
      locale: "de",
      intent: "check",
    });

    expect(result.degraded).toBe(true);
    expect(result.degradedReason).toContain("provider_failed");
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
    expect(result.understanding.openQuestion).toBeNull();
    expect(result.understanding.summary).toContain("Mindestanforderungen");
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
    expect(result.suggestions.some((item) => item.title.includes("Politische Verantwortung"))).toBe(true);
    const dossierSuggestion = result.suggestions.find((item) => item.kind === "dossier");
    const voteSuggestion = result.suggestions.find((item) => item.kind === "vote");
    const topicSuggestion = result.suggestions.find((item) => item.kind === "topic");
    expect(dossierSuggestion?.href).toContain("/dossier?");
    expect(dossierSuggestion?.href).toContain("topic=");
    expect(voteSuggestion?.href).toContain("/swipes?");
    expect(voteSuggestion?.href).toContain("topic=");
    expect(voteSuggestion?.href).toContain("claim=");
    expect(voteSuggestion?.href).toContain("from=create");
    expect(voteSuggestion?.title).toContain("Mindestanforderungen");
    expect(topicSuggestion?.href).toContain("/dossier?");
    expect(topicSuggestion?.href).not.toContain("/swipes?");
    expect(result.suggestions.every((item) => item.requiresConfirmation)).toBe(true);
    const visualMap = buildCreateVisualMap(result);
    expect(visualMap.nodes.map((node) => node.label)).toEqual(
      expect.arrayContaining([
        "Politische Verantwortung",
        "Amtsträger",
        "Qualifikation",
        "Sanktionen",
        "Gesetzgebung",
      ]),
    );
    const sections = buildCreateVisualSections(result, 4);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]?.label).toContain("Abschnitt");
    expect(sections[0]?.label).toMatch(/Forderung|Vorschlag|Aussage|Begründung|offene Frage/);
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
    expect(sections[0]?.label).toContain("Abschnitt");
  });

  it("extracts broad public policy topic map with position clusters for QA long text", async () => {
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
    const qaText = `
Ich möchte eine Debatte darüber starten, wie unsere Stadt in den nächsten Jahren Prioritäten setzen soll. Einerseits brauchen wir mehr bezahlbaren Wohnraum, strengere Regeln gegen Zweckentfremdung und schnellere Genehmigungen für kommunalen Wohnungsbau. Andererseits sagen viele Eigentümer und Bauunternehmen, dass zu viele Auflagen Neubau verteuern und private Investitionen verhindern.

Beim Verkehr bin ich dafür, Bus, Bahn und sichere Radwege auszubauen, aber Handwerker, Pflegedienste und Familien dürfen nicht so behandelt werden, als könnten sie komplett auf das Auto verzichten. Gleichzeitig müssen Klimaziele ernst genommen werden, sonst zahlen spätere Generationen den Preis.

In Schulen sollten digitale Ausstattung, Basiskompetenzen und politische Bildung verbessert werden. Dabei gibt es Streit: Einige wollen mehr Leistungsorientierung und verbindliche Sprachförderung, andere warnen vor zu frühem Druck und sozialer Ausgrenzung.

Außerdem geht es um Migration, Integration und Sicherheit: Wer hier lebt, soll faire Chancen bekommen, aber der Staat muss auch handlungsfähig bleiben, wenn Regeln dauerhaft missachtet werden. Ich sehe außerdem offene Fragen bei Gesundheit, Pflege, kommunalen Finanzen und Bürgerbeteiligung: Was kann die Kommune selbst entscheiden, was muss das Land oder der Bund lösen, und welche Maßnahmen sollten Bürger direkt priorisieren können?
`.trim();
    const result = await buildCreateIntelligentFollowup({
      text: qaText,
      locale: "de",
      intent: "contribute",
    });

    expect(result.degraded).toBe(true);
    expect(result.understanding.topics.length).toBeGreaterThanOrEqual(7);
    expect(result.understanding.topics.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Wohnen",
        "Verkehr",
        "Klima",
        "Bildung",
        "Migration / Integration",
        "Sicherheit / Rechtsstaat",
        "Gesundheit / Pflege / kommunale Finanzen / Beteiligung",
      ]),
    );
    expect(result.understanding.positionClusters?.map((cluster) => cluster.label)).toEqual(
      expect.arrayContaining([
        "sozial/ausgleichend",
        "ordnungs-/leistungsorientiert",
        "pragmatisch/abwägend",
      ]),
    );
  });

  it("marks vote suggestions as explicit confirmation only", async () => {
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

    const voteSuggestion = result.suggestions.find((suggestion) => suggestion.kind === "vote");
    expect(voteSuggestion).toBeTruthy();
    expect(voteSuggestion?.requiresConfirmation).toBe(true);
    expect(voteSuggestion?.suggestedStance).toBeDefined();
    expect(voteSuggestion?.href).toContain("/swipes?");
    expect(voteSuggestion?.href).toContain("claim=");
    expect(voteSuggestion?.href).toContain("from=create");
  });
});
