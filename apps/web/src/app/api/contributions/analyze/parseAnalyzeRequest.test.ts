import { describe, expect, it } from "vitest";
import { parseAnalyzeRequestBody } from "./parseAnalyzeRequest";

describe("parseAnalyzeRequestBody", () => {
  it("accepts legacy {text}", () => {
    const res = parseAnalyzeRequestBody({ text: "Das ist ein Testtext mit mehr als zehn Zeichen." });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.text.length).toBeGreaterThan(10);
  });

  it("accepts new {textOriginal,textPrepared} and prefers prepared", () => {
    const res = parseAnalyzeRequestBody({
      textOriginal: "Original Original Original",
      textPrepared: "Prepared Text der lang genug ist.",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.text).toContain("Prepared");
  });

  it("normalizes and keeps explicit language triplet fields", () => {
    const res = parseAnalyzeRequestBody({
      textOriginal: "Das ist ein ausreichend langer Text fuer den Analyze-Pfad.",
      locale: "EN-us",
      uiLocale: "FR-fr",
      contentLanguage: "DE-de",
      sourceLanguage: "es-ES",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.locale).toBe("fr");
      expect(res.value.uiLocale).toBe("fr");
      expect(res.value.contentLanguage).toBe("de");
      expect(res.value.sourceLanguage).toBe("es");
    }
  });

  it("accepts only textOriginal", () => {
    const res = parseAnalyzeRequestBody({ textOriginal: "Das ist ein ausreichend langer Text." });
    expect(res.ok).toBe(true);
  });

  it("rejects empty", () => {
    const res = parseAnalyzeRequestBody({ textOriginal: "   " });
    expect(res.ok).toBe(false);
  });

  it("rejects thin text below minimum length", () => {
    const res = parseAnalyzeRequestBody({ textOriginal: "zu kurz" });
    expect(res.ok).toBe(false);
    if (!("error" in res)) throw new Error("expected parse error for thin text");
    expect(res.error.message).toContain("min. 10 Zeichen");
  });

  it("rejects invalid anlassraumId instead of silently degrading context", () => {
    const res = parseAnalyzeRequestBody({
      textOriginal: "Das ist ein ausreichend langer Text fuer den Analyze-Pfad.",
      anlassraumId: "not-a-valid-object-id",
    });
    expect(res.ok).toBe(false);
    if (!("error" in res)) throw new Error("expected parse error for invalid anlassraumId");
    expect(res.error.message).toContain("invalid_anlassraum_id");
  });
});
