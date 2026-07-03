import { describe, expect, it } from "vitest";
import {
  buildCreateAnalyzeResponse,
  inferCreateAnalyzeInputType,
  inferCreateAnalyzeLanguages,
} from "@/features/create/analyzeContract";

function analyzeResultFixture(params?: {
  claims?: Array<Record<string, unknown>>;
  notes?: Array<Record<string, unknown>>;
  questions?: Array<Record<string, unknown>>;
}) {
  return {
    claims: params?.claims ?? [],
    notes: params?.notes ?? [],
    questions: params?.questions ?? [],
  } as any;
}

describe("create analyze contract", () => {
  it("infers core input types from freistart text", () => {
    expect(inferCreateAnalyzeInputType("Das ist ein normaler Beitrag ohne Quelle.")).toBe("free_text");
    expect(inferCreateAnalyzeInputType('Zitat: "So wurde es gesagt"')).toBe("quote");
    expect(inferCreateAnalyzeInputType("https://example.org/quellenbericht")).toBe("source_url");
    expect(inferCreateAnalyzeInputType("Upload mit PDF-Anlage im Anhang")).toBe("upload");
  });

  it("marks mixed input when source and quote signals coexist", () => {
    expect(inferCreateAnalyzeInputType('Zitat "A" siehe https://example.org')).toBe("mixed");
  });

  it("captures mixed-language hints and keeps uncertainty signals for thin inputs", () => {
    const languages = inferCreateAnalyzeLanguages("This is a question und das ist relevant.", "de-DE");
    expect(languages).toContain("de");
    expect(languages).toContain("en");

    const response = buildCreateAnalyzeResponse({
      runId: "run-thin",
      text: "Kurztext",
      intent: "contribute",
      locale: "de-DE",
      result: analyzeResultFixture(),
    });

    expect(response.inputType).toBe("free_text");
    expect(response.intent).toBe("contribute");
    expect(response.matchStrength).toBe("none");
    expect(response.uncertaintyFlags).toContain("input_too_thin");
    expect(response.suggestedCtas.some((item) => item.id === "neu_anlegen")).toBe(true);
    expect(response.requiresHumanReview).toBe(true);
    expect(response.matchingLanguageMode).toBe("same_language_only");
  });

  it("emits typed match + CTA metadata and strict governance flags", () => {
    const response = buildCreateAnalyzeResponse({
      runId: "run-match",
      text: "Ausfuehrlicher Beitrag mit klaren Aussagen und Kontext fuer den bestehenden Arbeitsraum.",
      intent: "check",
      locale: "de-DE",
      result: analyzeResultFixture({
        claims: [{ id: "c1", text: "Pruefbarer Claim" }],
        notes: [{ id: "n1", text: "Quelle erforderlich" }],
        questions: [{ id: "q1", text: "Welche Evidenz liegt vor?" }],
      }),
      matchResult: {
        matches: [
          {
            id: "65f000000000000000000011",
            matchType: "same_anlassraum",
            matchEntityType: "anlassraum",
            strength: "high",
            label: "Anlassraum",
            reason: "Explizit gesetzter Anlassraum-Kontext.",
            reasons: ["Explizit gesetzter Anlassraum-Kontext."],
            entityId: "65f000000000000000000011",
            targetRef: "/create?anlassraumId=65f000000000000000000011",
          },
        ],
        matchStrength: "high",
        matchType: "same_anlassraum",
        matchEntityType: "anlassraum",
        reasons: ["Explizit gesetzter Anlassraum-Kontext."],
        suggestedCtas: [
          {
            id: "anlassraum_oeffnen",
            label: "Anlassraum oeffnen",
            reason: "Kontext erkannt.",
          },
        ],
        sourceState: "ok",
        sourceErrors: [],
      },
    });

    expect(response.matchStrength).toBe("high");
    expect(response.intent).toBe("check");
    expect(response.matchType).toBe("same_anlassraum");
    expect(response.matchEntityType).toBe("anlassraum");
    expect(response.suggestedCtas.length).toBeGreaterThan(0);
    expect(response.phases.intake.status).toBe("done");
    expect(response.phases.graph_matching.status).toBe("done");
    expect(response.phases.cta_suggestions.status).toBe("done");
    expect(response.matchSourceState).toBe("ok");
    expect(response.reasons.length).toBeGreaterThan(0);
    expect(response.questions).toEqual([{ id: "q1", text: "Welche Evidenz liegt vor?" }]);
    expect(response.missingPerspectives).toEqual([]);
    expect(response.participationCandidates).toEqual([]);
    expect(response.noAutoPublish).toBe(true);
    expect(response.noSilentMerge).toBe(true);
    expect(response.matchingLanguageMode).toBe("same_language_only");
    expect(response.sourceLanguage).toBe("de");
    expect(response.contentLanguage).toBe("de");
    expect(response.uiLocale).toBe("de");
  });

  it("respects explicit language triplet overrides", () => {
    const response = buildCreateAnalyzeResponse({
      runId: "run-language-override",
      text: "Das ist ein Beitrag mit deutschem Inhalt.",
      intent: "draft",
      locale: "en-US",
      languageContext: {
        uiLocale: "en-US",
        contentLanguage: "de-DE",
        sourceLanguage: "fr-FR",
      },
      result: analyzeResultFixture({
        claims: [{ id: "c2", text: "Pruefbarer Claim" }],
      }),
    });

    expect(response.uiLocale).toBe("en");
    expect(response.intent).toBe("draft");
    expect(response.contentLanguage).toBe("de");
    expect(response.sourceLanguage).toBe("fr");
  });
});
