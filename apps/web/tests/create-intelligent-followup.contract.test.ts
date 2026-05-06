import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";

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
      ]),
    );
    expect(result.understanding.statements[0]?.stance).toBe("pro");
    expect(result.suggestions.some((item) => item.title.includes("Politische Verantwortung"))).toBe(true);
    expect(result.suggestions.every((item) => item.requiresConfirmation)).toBe(true);
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
  });
});
