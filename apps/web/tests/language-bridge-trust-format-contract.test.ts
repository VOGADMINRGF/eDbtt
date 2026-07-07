import { describe, expect, it } from "vitest";
import {
  buildCanonicalLanguageBridgeRecord,
  resolveCanonicalFormatRecommendationDecision,
  resolveCanonicalTrustState,
  usesCanonicalRtlLayout,
} from "@/features/create/languageBridgeTrustFormatContract";

describe("language bridge trust format contract", () => {
  it("preserves original and keeps translation separate", () => {
    const record = buildCanonicalLanguageBridgeRecord({
      locale: "de-DE",
      contentLanguage: "de-DE",
      sourceLanguage: "tr-TR",
      translationLanguage: "de-DE",
      originalText: "Merhaba dunya",
      translationText: "Hallo Welt",
      trustState: "source_present",
    });

    expect(record.original).toEqual({
      language: "tr",
      text: "Merhaba dunya",
      preserved: true,
    });
    expect(record.translation.text).toBe("Hallo Welt");
    expect(record.translation.replacesOriginal).toBe(false);
    expect(record.reviewRequired).toBe(true);
    expect(record.autoPublish).toBe(false);
  });

  it("keeps summaries from replacing sources", () => {
    const record = buildCanonicalLanguageBridgeRecord({
      locale: "de-DE",
      sourceLanguage: "fr-FR",
      contentLanguage: "de-DE",
      originalText: "Texte source",
      summaryText: "Kurze Zusammenfassung",
      trustState: "source_present",
    });

    expect(record.summary.text).toBe("Kurze Zusammenfassung");
    expect(record.summary.replacesOriginal).toBe(false);
    expect(record.summary.replacesSource).toBe(false);
    expect(record.sourceGrounding.summaryReplacesSource).toBe(false);
  });

  it("keeps format recommendations as review-first suggestions", () => {
    const decision = resolveCanonicalFormatRecommendationDecision("poll");

    expect(decision).toEqual({
      recommendation: "poll",
      isSuggestion: true,
      reviewRequired: true,
      autoPublish: false,
    });
  });

  it("falls back to honest trust defaults and marks translation uncertainty", () => {
    const record = buildCanonicalLanguageBridgeRecord({
      locale: "de-DE",
      sourceLanguage: "ar",
      contentLanguage: "de",
      translationLanguage: "de",
      originalText: "نص أصلي",
      translationText: "Unsichere Übersetzung",
      trustState: "translation_uncertain",
      uncertaintyNotes: ["Nuance unklar", "Nuance unklar"],
    });

    expect(resolveCanonicalTrustState("unknown_state")).toBe("source_needed");
    expect(record.translation.state).toBe("uncertain");
    expect(record.translation.rtl).toBe(false);
    expect(record.sourceGrounding.trustState).toBe("translation_uncertain");
    expect(record.uncertaintyNotes).toEqual(["Nuance unklar"]);
  });

  it("recognizes rtl languages for the contract layer", () => {
    expect(usesCanonicalRtlLayout("ar-EG")).toBe(true);
    expect(usesCanonicalRtlLayout("de-DE")).toBe(false);
  });
});
