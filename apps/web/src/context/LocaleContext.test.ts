import { describe, expect, it } from "vitest";
import { normalizeStoredLocaleList, sanitizeLocaleList } from "./LocaleContext";

describe("LocaleContext language preference helpers", () => {
  it("keeps only supported locales and deduplicates output preferences", () => {
    expect(sanitizeLocaleList(["de", "ar", "de", "invalid"], "en")).toEqual(["de", "ar"]);
  });

  it("falls back to the provided locale when no valid output preference exists", () => {
    expect(sanitizeLocaleList(["invalid"], "fr")).toEqual(["fr"]);
  });

  it("parses stored locale lists and falls back on malformed storage", () => {
    expect(normalizeStoredLocaleList('["en","ar","en"]', "de")).toEqual(["en", "ar"]);
    expect(normalizeStoredLocaleList("not-json", "de")).toEqual(["de"]);
  });
});
