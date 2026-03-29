import { describe, expect, it } from "vitest";
import { resolveCreateCtaSuggestions } from "@/features/create/ctaResolver";

function ids(items: Array<{ id: string }>) {
  return items.map((item) => item.id);
}

describe("create CTA resolver", () => {
  it("returns deterministic CTA set for match context", () => {
    const out = resolveCreateCtaSuggestions({
      matchType: "same_anlassraum",
      matchEntityType: "anlassraum",
      matchStrength: "high",
    });

    expect(ids(out)).toEqual([
      "anlassraum_oeffnen",
      "perspektive_anhaengen",
      "anders_sehen",
      "neu_anlegen",
    ]);
  });

  it("returns safe fallback CTA set for no_match", () => {
    const out = resolveCreateCtaSuggestions({
      matchType: "no_match",
      matchEntityType: "question",
      matchStrength: "none",
    });

    expect(ids(out)).toEqual(["neu_anlegen", "perspektive_anhaengen"]);
    expect(out.some((item) => item.id === "neu_anlegen")).toBe(true);
  });

  it("keeps degraded no_match path on the same deterministic fallback CTAs", () => {
    const out = resolveCreateCtaSuggestions({
      matchType: "no_match",
      matchEntityType: "question",
      matchStrength: "none",
    });

    expect(ids(out)).toEqual(["neu_anlegen", "perspektive_anhaengen"]);
  });
});
