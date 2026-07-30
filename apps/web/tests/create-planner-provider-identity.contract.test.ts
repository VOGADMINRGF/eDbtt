import { describe, expect, it } from "vitest";

import { hasValidatedCreatePlannerProviderIdentity } from "@/features/create/createPlannerProviderContract";

function validIdentity() {
  return {
    source: "anthropic",
    plannerSource: "anthropic",
    plannerProvider: "anthropic",
    providerPlan: { plannerProvider: "anthropic" },
    providerAttemptCount: 2,
    providerAttempts: [
      {
        attempt: 1,
        provider: "openai",
        model: "gpt-4.1-mini",
        status: "failed",
        resultCode: "rate_limited",
        responseLength: null,
        responseHash: null,
      },
      {
        attempt: 2,
        provider: "anthropic",
        model: "claude-sonnet-actual",
        status: "succeeded",
        resultCode: "succeeded",
        responseLength: 480,
        responseHash: "a".repeat(64),
      },
    ],
    plannerDebug: {
      attemptedProvider: "anthropic",
      usedProvider: "anthropic",
      attemptedModel: "claude-sonnet-actual",
      usedModel: "claude-sonnet-actual",
      attemptNumber: 2,
    },
  } as const;
}

type MutableIdentity = {
  source: string;
  plannerSource: string;
  plannerProvider: string;
  providerPlan: { plannerProvider: string };
  providerAttemptCount: number;
  providerAttempts: Array<{
    attempt: number;
    provider: string;
    model: string;
    status: string;
    resultCode: string;
    responseLength: number | null;
    responseHash: string | null;
  }>;
  plannerDebug: {
    attemptedProvider: string;
    usedProvider: string;
    attemptedModel: string;
    usedModel: string;
    attemptNumber: number;
  };
};

function mutableIdentity() {
  return structuredClone(validIdentity()) as unknown as MutableIdentity;
}

describe("full create planner provider identity", () => {
  it("accepts a consistent allow-listed provider trace", () => {
    expect(hasValidatedCreatePlannerProviderIdentity(validIdentity())).toBe(true);
  });

  it.each([
    "source",
    "plannerSource",
    "plannerProvider",
    "providerPlan",
    "attemptedProvider",
    "usedProvider",
    "attemptedModel",
    "usedModel",
    "attemptNumber",
    "attemptProvider",
    "attemptModel",
    "attemptStatus",
    "attemptCount",
  ])("rejects a mismatch in %s", (field) => {
    const input = mutableIdentity();
    switch (field) {
      case "providerPlan":
        input.providerPlan.plannerProvider = "mistral";
        break;
      case "attemptedProvider":
      case "usedProvider":
        input.plannerDebug[field] = "mistral";
        break;
      case "attemptedModel":
      case "usedModel":
        input.plannerDebug[field] = "wrong-model";
        break;
      case "attemptNumber":
        input.plannerDebug.attemptNumber = 1;
        break;
      case "attemptProvider":
        input.providerAttempts[1].provider = "mistral";
        break;
      case "attemptModel":
        input.providerAttempts[1].model = "wrong-model";
        break;
      case "attemptStatus":
        input.providerAttempts[1].status = "failed";
        break;
      case "attemptCount":
        input.providerAttemptCount = 1;
        break;
      case "source":
      case "plannerSource":
      case "plannerProvider":
        input[field] = "unapproved-provider";
        break;
    }

    expect(hasValidatedCreatePlannerProviderIdentity(input)).toBe(false);
  });

  it("rejects non-contiguous, oversized, and prompt-bearing attempt traces", () => {
    const nonContiguous = mutableIdentity();
    nonContiguous.providerAttempts[1].attempt = 3;
    expect(hasValidatedCreatePlannerProviderIdentity(nonContiguous)).toBe(false);

    const oversized = mutableIdentity();
    oversized.providerAttemptCount = 3;
    oversized.providerAttempts.push({
      ...oversized.providerAttempts[1],
      attempt: 3,
    });
    expect(hasValidatedCreatePlannerProviderIdentity(oversized)).toBe(false);

    expect(JSON.stringify(validIdentity())).not.toMatch(
      /prompt|completion|rawText|providerErrorMessage|errorMessage/,
    );
  });
});
