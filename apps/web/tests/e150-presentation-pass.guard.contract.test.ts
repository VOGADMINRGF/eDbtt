import { describe, expect, it } from "vitest";

import {
  normalizePresentationText,
  runNonMutativePresentationPass,
} from "@features/ai/e150/presentationPass";

type Payload = {
  summary: string;
  cards: string[];
  protected: {
    claims: unknown;
    evidence: unknown;
    trust: unknown;
    verificationMode: "none" | "precheck" | "sealed";
    researchUsed: "none" | "lite" | "search" | "deep_search";
    sealEligible: boolean;
    sealGranted: boolean;
  };
};

function snapshot(payload: Payload) {
  return {
    claims: payload.protected.claims,
    evidence: payload.protected.evidence,
    trust: payload.protected.trust,
    verificationMode: payload.protected.verificationMode,
    researchUsed: payload.protected.researchUsed,
    sealEligible: payload.protected.sealEligible,
    sealGranted: payload.protected.sealGranted,
  } as const;
}

describe("presentation pass non-mutation guard", () => {
  it("normalizes presentation texts and keeps protected fields untouched", () => {
    const payload: Payload = {
      summary: "  Kompakt   ;  neutral !!  ",
      cards: ["  Kontext ,  sauber  "],
      protected: {
        claims: [{ id: "c1", text: "Claim unveraendert" }],
        evidence: [{ id: "e1" }],
        trust: { score: 0.7 },
        verificationMode: "sealed",
        researchUsed: "search",
        sealEligible: true,
        sealGranted: false,
      },
    };

    const result = runNonMutativePresentationPass({
      provider: "openai",
      enabled: true,
      payload,
      snapshot,
      apply: (value) => ({
        payload: {
          ...value,
          summary: normalizePresentationText(value.summary),
          cards: value.cards.map((card) => normalizePresentationText(card)),
        },
        changed: true,
        changedFields: ["summary", "cards"],
      }),
    });

    expect(result.meta.applied).toBe(true);
    expect(result.meta.reason).toBe("applied");
    expect(result.payload.summary).toBe("Kompakt; neutral!");
    expect(result.payload.cards).toEqual(["Kontext, sauber"]);
    expect(result.payload.protected.claims).toEqual(payload.protected.claims);
    expect(result.payload.protected.verificationMode).toBe("sealed");
    expect(result.payload.protected.researchUsed).toBe("search");
    expect(result.payload.protected.sealEligible).toBe(true);
    expect(result.payload.protected.sealGranted).toBe(false);
  });

  it("reverts to original payload when guard detects protected-field mutation", () => {
    const payload: Payload = {
      summary: "Text",
      cards: [],
      protected: {
        claims: [{ id: "c1", text: "Original" }],
        evidence: [{ id: "e1" }],
        trust: { score: 0.6 },
        verificationMode: "none",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
      },
    };

    const result = runNonMutativePresentationPass({
      provider: "openai",
      enabled: true,
      payload,
      snapshot,
      apply: (value) => ({
        payload: {
          ...value,
          summary: "Text geglaettet",
          protected: {
            ...value.protected,
            claims: [{ id: "c2", text: "Mutiert" }],
          },
        },
        changed: true,
        changedFields: ["summary", "claims"],
      }),
    });

    expect(result.meta.applied).toBe(false);
    expect(result.meta.reason).toBe("guard_blocked");
    expect(result.meta.nonMutativeGuardPassed).toBe(false);
    expect(result.payload).toEqual(payload);
  });

  it("blocks mutation when lane/provider meta changes", () => {
    const payload: Payload = {
      summary: "Text",
      cards: [],
      protected: {
        claims: [{ id: "c1", text: "Original" }],
        evidence: [{ id: "e1" }],
        trust: { score: 0.6 },
        verificationMode: "precheck",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
      },
    };

    const result = runNonMutativePresentationPass({
      provider: "openai",
      enabled: true,
      payload,
      snapshot: (value) => ({
        ...snapshot(value),
        laneMeta: { lane: "standard", summaryHash: value.summary },
        providerMeta: { provider: "openai", role: "presentation_pass", summaryHash: value.summary },
      }),
      apply: (value) => ({
        payload: {
          ...value,
          summary: "Text geglättet",
        },
        changed: true,
        changedFields: ["summary"],
      }),
    });

    expect(result.meta.applied).toBe(false);
    expect(result.meta.reason).toBe("guard_blocked");
    expect(result.meta.nonMutativeGuardPassed).toBe(false);
    expect(result.payload).toEqual(payload);
  });

  it("falls back to original payload when presentation pass throws", () => {
    const payload: Payload = {
      summary: "Text",
      cards: [],
      protected: {
        claims: [{ id: "c1", text: "Claim" }],
        evidence: [{ id: "e1" }],
        trust: { score: 0.5 },
        verificationMode: "precheck",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
      },
    };

    const result = runNonMutativePresentationPass({
      provider: "openai",
      enabled: true,
      payload,
      snapshot,
      apply: () => {
        throw new Error("pass failed");
      },
    });

    expect(result.meta.applied).toBe(false);
    expect(result.meta.reason).toBe("failed");
    expect(result.meta.failure).toContain("pass failed");
    expect(result.payload).toEqual(payload);
  });

  it("does not run for non-openai providers", () => {
    const payload: Payload = {
      summary: "Text",
      cards: [],
      protected: {
        claims: [],
        evidence: [],
        trust: null,
        verificationMode: "none",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
      },
    };

    const result = runNonMutativePresentationPass({
      provider: "anthropic",
      enabled: true,
      payload,
      snapshot,
      apply: (value) => ({ payload: value, changed: false }),
    });

    expect(result.meta.reason).toBe("provider_not_allowed");
    expect(result.meta.applied).toBe(false);
    expect(result.payload).toEqual(payload);
  });
});
