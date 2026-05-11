import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import { buildCreateHandoffDraft } from "@/features/create/createHandoff";

describe("create argument claim separation contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "";
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
  });

  it("separates normative and policy claims from arguments and open questions", async () => {
    const followup = await buildCreateIntelligentFollowup({
      text:
        "Ich bin für besseren Tierschutz und Tierhaltung. Das sollte Europa und weltweit einheitlich umgesetzt werden, mindestens in den Ländern, aus denen wir importieren oder in die wir exportieren. Es geht um Tierwohl, Agrar, Bio-Label und Haltungsstufen.",
      locale: "de",
      intent: "contribute",
    });
    const draft = buildCreateHandoffDraft({
      result: followup,
      selectedAction: "append_to_dossier",
      id: "separation-1",
    });

    expect(draft.claims.some((claim) => claim.kind === "policy_claim")).toBe(true);
    expect(draft.claims.some((claim) => claim.text.includes("Tierschutz"))).toBe(true);
    expect(draft.arguments.some((argument) => argument.stance === "pro")).toBe(true);
    expect(draft.openQuestions.some((question) => /Produkte|Länder|Standards|Kontrollmechanismen/.test(question.question))).toBe(true);
    expect(draft.openQuestions.some((question) => /Zuständigkeit|EU|Bund|internationalen Handelsregeln/.test(question.question))).toBe(true);
    expect(draft.plannerResult.plannerScope).toEqual(expect.arrayContaining(["eu", "federal", "international"]));
  });
});
