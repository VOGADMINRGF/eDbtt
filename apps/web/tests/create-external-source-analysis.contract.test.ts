import { describe, expect, it } from "vitest";
import { buildCreateExternalAnalysisExcerpt } from "@/features/create/externalSourceAnalysis";

describe("Create external-source semantic excerpt", () => {
  it("preserves start, middle and end coverage within the provider input budget", () => {
    const text = `START_MARKER ${"a".repeat(44_000)} MIDDLE_MARKER ${"b".repeat(44_000)} END_MARKER`;
    const excerpt = buildCreateExternalAnalysisExcerpt(text);

    expect(excerpt.length).toBeLessThanOrEqual(24_000);
    expect(excerpt).toContain("START_MARKER");
    expect(excerpt).toContain("MIDDLE_MARKER");
    expect(excerpt).toContain("END_MARKER");
  });
});
