import { describe, expect, it } from "vitest";
import {
  normalizeGermanAscii,
  normalizeGermanSearchText,
  normalizeGermanSlug,
} from "@features/common/utils/textNormalization";

describe("text normalization helpers", () => {
  it("normalizes German umlauts and sharp-s for ascii matching", () => {
    expect(normalizeGermanAscii("Ärger über Ölpreise & Maßstäbe")).toBe("Aerger ueber Oelpreise & Massstaebe");
  });

  it("builds stable search text with whitespace normalization", () => {
    expect(normalizeGermanSearchText("  Für ÖPNV — in Städten!  ")).toBe("fuer oepnv in staedten");
  });

  it("builds slug keys with fallback handling", () => {
    expect(normalizeGermanSlug("Öffentlicher Nahverkehr", { maxLength: 64, fallback: "allgemein" })).toBe(
      "oeffentlicher-nahverkehr",
    );
    expect(normalizeGermanSlug("!!!", { fallback: "allgemein" })).toBe("allgemein");
  });
});
