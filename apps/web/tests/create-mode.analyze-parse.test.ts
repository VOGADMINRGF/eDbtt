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
});
