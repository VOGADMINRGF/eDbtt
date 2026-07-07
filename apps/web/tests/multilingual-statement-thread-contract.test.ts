import { describe, expect, it } from "vitest";

import { buildMultilingualStatementThreadEntry } from "@/features/create/multilingualStatementThreadContract";

describe("multilingual statement thread contract", () => {
  it("keeps original, translation and summary separated", () => {
    const entry = buildMultilingualStatementThreadEntry({
      entryId: "entry-1",
      kind: "comment",
      sourceLanguage: "de",
      contentLanguage: "de",
      uiLocale: "de",
      originalText: "Originaltext",
      translationText: "Translated text",
      translationLanguage: "en",
      summaryText: "Kurze Zusammenfassung",
    });

    expect(entry.bridge.original.text).toBe("Originaltext");
    expect(entry.bridge.translation.text).toBe("Translated text");
    expect(entry.bridge.summary.text).toBe("Kurze Zusammenfassung");
    expect(entry.translationReplacesOriginal).toBe(false);
    expect(entry.summaryReplacesSource).toBe(false);
  });

  it("flags rtl languages without replacing the original text", () => {
    const entry = buildMultilingualStatementThreadEntry({
      entryId: "entry-2",
      sourceLanguage: "ar",
      contentLanguage: "ar",
      uiLocale: "de",
      originalText: "نص عربي",
      translationText: "Arabischer Text",
      translationLanguage: "ar",
    });

    expect(entry.rtlHint).toBe(true);
    expect(entry.bridge.original.preserved).toBe(true);
  });
});
