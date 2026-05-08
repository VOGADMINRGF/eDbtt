import { describe, expect, it } from "vitest";
import {
  evaluateCreateInputSafety,
  type CreateInputSafetyResult,
} from "@/features/create/safety/createInputSafety";
import { CREATE_SAFETY_STRESS_INPUT_DE } from "./fixtures/createSafetyStressInput.de";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

function evaluate(
  text: string,
  extra: Partial<Parameters<typeof evaluateCreateInputSafety>[0]> = {},
): CreateInputSafetyResult {
  return evaluateCreateInputSafety({
    text,
    locale: "de",
    ...extra,
  });
}

describe("create input safety contract", () => {
  it("keeps broken civic german as allow or revise_required but not blocked", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.lowReadabilityCivic);
    expect(["allow", "revise_required"]).toContain(result.decision);
  });

  it("provides a safe rewrite for long rambling civic input", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.longRambling);
    expect(result.safeRewrite.length).toBeGreaterThan(20);
  });

  it("redacts self pii without necessarily blocking", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.selfPii);
    expect(result.redactedText).not.toContain("example.org");
    expect(result.redactedText).not.toContain("1234567");
    expect(result.decision).not.toBe("blocked");
  });

  it("blocks third-party phone plus call-to-action", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyPhoneCta);
    expect(result.decision).toBe("blocked");
  });

  it("treats third-party address plus accusation as moderation or block", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyAddressAccusation);
    expect(["moderation_required", "blocked"]).toContain(result.decision);
  });

  it("keeps third-party pii review data pii-free", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyPiiAccusation);
    expect(JSON.stringify(result.reviewItems)).not.toContain("9999999");
    expect(JSON.stringify(result.reviewItems)).not.toContain("Musterstraße");
  });

  it("classifies insult only as revise_required", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.insult);
    expect(result.decision).toBe("revise_required");
  });

  it("does not block political framing alone", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.politicalFraming);
    expect(["allow", "revise_required"]).toContain(result.decision);
  });

  it("blocks concrete violence", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.threat);
    expect(result.decision).toBe("blocked");
  });

  it("marks vague self-justice as moderation_required", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.selfJustice);
    expect(result.decision).toBe("moderation_required");
  });

  it("marks investor or corruption allegations as factcheck_required", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.allegation);
    expect(result.decision).toBe("factcheck_required");
    expect(result.factCheckCandidates[0]?.truthStatus).toBe("not_checked");
  });

  it("marks unverified numbers as factcheck_required", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.unverifiedNumber);
    expect(result.decision).toBe("factcheck_required");
  });

  it("does not block censorship counterclaims", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.censorshipCounterclaim);
    expect(result.decision).not.toBe("blocked");
  });

  it("marks source bluffing as factcheck_required", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.sourceBluffing);
    expect(result.decision).toBe("factcheck_required");
  });

  it("flags mixed language as graph review risk without blocking by itself", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.crossLingual, {
      contentLanguage: "de",
      sourceLanguage: "en",
    });
    expect(result.crossLingualRisk).toBe(true);
    expect(result.decision).toBe("graph_review_required");
    expect(result.noSilentMerge).toBe(true);
  });

  it("flags placeholder language samples safely for tr ar ru uk pl", () => {
    const fixtures = [
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.trPlaceholder,
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.arPlaceholder,
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.ruPlaceholder,
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.ukPlaceholder,
      CREATE_SAFETY_ADVERSARIAL_FIXTURES.plPlaceholder,
    ];

    for (const fixture of fixtures) {
      const result = evaluate(fixture);
      expect(result.crossLingualRisk).toBe(true);
      expect(result.decision).toBe("graph_review_required");
    }
  });

  it("lets safe verification questions proceed even when the original allegation was unsafe", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim);
    expect(result.decision).toBe("allow");
    expect(result.factCheckCandidates[0]?.truthStatus).toBe("open");
    expect(result.reviewItems.some((item) => item.code === "safe_question_proceed")).toBe(true);
  });

  it("keeps stress input reviewable without blocking by default", () => {
    const result = evaluate(CREATE_SAFETY_STRESS_INPUT_DE);
    expect(result.decision).not.toBe("blocked");
    expect(result.factCheckCandidates.length).toBeGreaterThan(0);
    expect(result.reviewItems.length).toBeGreaterThan(0);
  });
});
