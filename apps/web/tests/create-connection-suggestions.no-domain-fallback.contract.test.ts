import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";

describe("create connection suggestions no-domain fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "";
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
  });

  it("does not map 'mindestens in den Ländern, aus denen wir importieren' to officeholders", async () => {
    const result = await buildCreateIntelligentFollowup({
      text:
        "Das sollte Europa und weltweit einheitlich umgesetzt werden, mindestens in den Ländern, aus denen wir importieren.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.understanding.topics.map((topic) => topic.label)).not.toEqual(
      expect.arrayContaining(["Amtsträger"]),
    );
    expect(result.suggestions.some((suggestion) => /amtstr[aä]ger/i.test(suggestion.title))).toBe(false);
  });

  it("keeps explicit officeholder texts in the officeholder domain", async () => {
    const result = await buildCreateIntelligentFollowup({
      text: "Für Amtsträger sollten Mindestanforderungen gelten. Sanktionen für Amtsträger müssen klar geregelt sein.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.understanding.topics.map((topic) => topic.label)).toEqual(
      expect.arrayContaining(["Amtsträger", "Qualifikation", "Sanktionen"]),
    );
    expect(result.suggestions.some((suggestion) => /politische|mandate|[äa]mter|amtstr[aä]ger/i.test(suggestion.title))).toBe(true);
  });
});
