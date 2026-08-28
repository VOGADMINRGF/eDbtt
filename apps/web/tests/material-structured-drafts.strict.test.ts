import { describe, expect, it } from "vitest";
import { parseMaterialStructuredDraftPayload } from "@/features/material/materialStructuredDrafts";

const documentText = "Der Verein plant einen barrierefreien Umbau. Variante A bleibt im Budget. Die Mitglieder entscheiden im Oktober.";

function payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    themes: ["Vereinsheim"],
    decisionPoints: ["Umfang des Umbaus"],
    questions: [
      {
        id: "q-umbau",
        theme: "Vereinsheim",
        text: "Welcher Umfang des Umbaus soll priorisiert werden?",
        rationale: "Die Entscheidung steuert die weitere Planung.",
        sourceAnchors: ["barrierefreien Umbau"],
      },
    ],
    options: [
      { questionRef: "q-umbau", text: "Variante A", source: "document", needsReview: true },
      { questionRef: "q-umbau", text: "Weitere Variante prüfen", source: "ai_suggestion", needsReview: true },
    ],
    claimsOrSourceHints: [
      { text: "Die Mitglieder entscheiden im Oktober.", sourceAnchors: ["Die Mitglieder entscheiden im Oktober"] },
    ],
    uncertainties: ["Kosten weiterer Varianten fehlen."],
    ...overrides,
  });
}

describe("material structured draft validation", () => {
  it("accepts grounded drafts and adds trusted provenance outside provider control", () => {
    const parsed = parseMaterialStructuredDraftPayload({
      providerText: payload(),
      documentText,
      graphProvenance: ["topics:vereinsheim"],
    });

    expect(parsed.questions).toHaveLength(1);
    expect(parsed.options).toHaveLength(2);
    expect(parsed.provenance).toEqual(["material_full_text", "topics:vereinsheim"]);
    expect(parsed.questions[0].reviewState).toBe("draft");
  });

  it("rejects non-strict provider output", () => {
    expect(() =>
      parseMaterialStructuredDraftPayload({
        providerText: payload({ inventedField: true }),
        documentText,
      }),
    ).toThrow();
  });

  it("drops invented source anchors and options labelled as document truth", () => {
    const parsed = parseMaterialStructuredDraftPayload({
      providerText: payload({
        questions: [
          {
            id: "q-erfunden",
            theme: "Vereinsheim",
            text: "Soll eine erfundene Behauptung bestätigt werden?",
            rationale: "Nicht belegt.",
            sourceAnchors: ["Dieser Satz steht nicht im Dokument"],
          },
          {
            id: "q-umbau",
            theme: "Vereinsheim",
            text: "Welcher Umfang des Umbaus soll priorisiert werden?",
            rationale: "Entscheidungspunkt.",
            sourceAnchors: ["barrierefreien Umbau"],
          },
        ],
        options: [
          { questionRef: "q-umbau", text: "Erfundene Dokumentoption", source: "document", needsReview: true },
          { questionRef: "q-umbau", text: "Neue Option erwägen", source: "ai_suggestion", needsReview: true },
        ],
      }),
      documentText,
    });

    expect(parsed.questions.map((question) => question.id)).toEqual(["q-umbau"]);
    expect(parsed.options).toEqual([
      expect.objectContaining({ text: "Neue Option erwägen", source: "ai_suggestion" }),
    ]);
  });
});
