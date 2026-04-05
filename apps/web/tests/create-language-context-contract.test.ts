import { describe, expect, it } from "vitest";
import { resolveCreateLanguageContext } from "@/features/create/languageContextContract";

describe("create language context contract", () => {
  it("normalizes locale triplet to short lowercase language tags", () => {
    const context = resolveCreateLanguageContext({
      locale: "EN-us",
      uiLocale: "FR-fr",
      contentLanguage: "DE-de",
      sourceLanguage: "es-ES",
    });

    expect(context).toEqual({
      uiLocale: "fr",
      contentLanguage: "de",
      sourceLanguage: "es",
    });
  });

  it("falls back defensively to stable defaults", () => {
    const context = resolveCreateLanguageContext({
      locale: "??",
      uiLocale: "",
      contentLanguage: " ",
      sourceLanguage: null,
      inferredSourceLanguage: "it-IT",
    });

    expect(context).toEqual({
      uiLocale: "de",
      contentLanguage: "de",
      sourceLanguage: "it",
    });
  });
});

