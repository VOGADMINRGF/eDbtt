import { describe, expect, it } from "vitest";
import { evaluateCreateInputSafety } from "@/features/create/safety/createInputSafety";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

function evaluate(text: string, extra: Partial<Parameters<typeof evaluateCreateInputSafety>[0]> = {}) {
  return evaluateCreateInputSafety({
    text,
    locale: "de",
    routeStage: "analyze",
    ...extra,
  });
}

describe("create safety quality clarifications contract", () => {
  it("asks for place context on vague local street reports without blocking", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.vagueLocalStreet);
    expect(result.decision).toBe("revise_required");
    expect(result.qualityGate.missingPlace).toBe(true);
    expect(result.clarifications.some((entry) => entry.kind === "place")).toBe(true);
  });

  it("asks for institution place without demanding a private address", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.vagueSchool);
    expect(result.qualityGate.missingPlace).toBe(true);
    expect(result.clarifications.find((entry) => entry.kind === "place")?.privacyHint).toContain(
      "Private Wohnadressen",
    );
  });

  it("keeps vague district complaints reviewable while asking for place and timeframe context", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.vagueDistrict);
    expect(result.decision).toBe("revise_required");
    expect(result.qualityGate.missingPlace).toBe(true);
    expect(result.qualityGate.missingTimeframe).toBe(true);
  });

  it("asks for requested action or responsibility on generic administration complaints", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.vagueAdministration);
    expect(
      result.qualityGate.missingResponsibility || result.qualityGate.missingRequestedAction,
    ).toBe(true);
  });

  it("adds source clarification to unsupported allegations without removing factcheck gating", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.allegationWithoutSource);
    expect(result.decision).toBe("factcheck_required");
    expect(result.qualityGate.missingSource).toBe(true);
    expect(result.factCheckCandidates.length).toBeGreaterThan(0);
  });

  it("lets safe questions stay questions while source or place clarifications can remain", () => {
    const result = evaluate(CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionWithVaguePlace);
    expect(result.decision).toBe("revise_required");
    expect(result.qualityGate.missingPlace).toBe(true);
    expect(result.factCheckCandidates[0]?.truthStatus).toBe("open");
  });
});
