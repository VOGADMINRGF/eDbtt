import { describe, expect, it } from "vitest";
import { parseAnalyzeRequestBody } from "@/app/api/contributions/analyze/parseAnalyzeRequest";

describe("create mode analyze parse boundary", () => {
  it("accepts canonical create mode with selected anlassraum id", () => {
    const parsed = parseAnalyzeRequestBody({
      text: "Genug langer Analysetext fuer den Request.",
      createMode: "source",
      anlassraumId: "65f000000000000000000011",
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.createMode).toBe("source");
    expect(parsed.value.anlassraumId).toBe("65f000000000000000000011");
  });

  it("accepts preparedText alias and normalizes it into text", () => {
    const parsed = parseAnalyzeRequestBody({
      textOriginal: "Original text should not be primary here.",
      preparedText: "Prepared alias text for canonical analyze flow.",
      createMode: "source",
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.text).toBe("Prepared alias text for canonical analyze flow.");
  });

  it("rejects invalid anlassraum id explicitly", () => {
    const parsed = parseAnalyzeRequestBody({
      text: "Genug langer Analysetext fuer den Request.",
      createMode: "source",
      anlassraumId: "bad-id",
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.message).toBe("invalid_anlassraum_id");
  });

  it("keeps optional presentationPass flag for controlled non-mutative tone pass", () => {
    const parsed = parseAnalyzeRequestBody({
      text: "Genug langer Text fuer den Presentation-Pass Parse-Test.",
      analysisMode: "media",
      presentationPass: true,
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.presentationPass).toBe(true);
  });
});
