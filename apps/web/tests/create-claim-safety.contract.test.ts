import { describe, expect, it } from "vitest";
import { evaluateCreateClaimSafety } from "@/features/create/safety/createClaimSafety";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

describe("create claim safety contract", () => {
  it("marks simple observations as publishable", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c1",
      text: "Bei uns fährt der Bus morgens oft zu spät.",
      locale: "de",
    });
    expect(result.kind).toBe("observation");
    expect(result.publicationStatus).toBe("publishable");
    expect(result.truthStatus).toBe("not_checked");
  });

  it("keeps opinions as opinion-only proposals", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c2",
      text: "Ich finde, das wirkt wie typisches Lagerdenken der Altparteien.",
      locale: "de",
    });
    expect(result.kind).toBe("opinion");
    expect(result.publicationStatus).toBe("publishable_as_opinion");
    expect(result.safetyDecision).toBe("revise_required");
  });

  it("keeps safe verification questions publishable as questions", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c3",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim,
      locale: "de",
    });
    expect(result.kind).toBe("question");
    expect(result.publicationStatus).toBe("publishable_as_question");
    expect(result.truthStatus).toBe("open");
  });

  it("flags unsupported allegations for factcheck", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c4",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.allegation,
      locale: "de",
    });
    expect(result.kind).toBe("allegation");
    expect(result.publicationStatus).toBe("factcheck_required");
    expect(result.factCheckCandidateIds.length).toBeGreaterThan(0);
  });

  it("flags unverified number claims for factcheck", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c5",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.unverifiedNumber,
      locale: "de",
    });
    expect(result.kind).toBe("factual_claim");
    expect(result.publicationStatus).toBe("factcheck_required");
  });

  it("does not block political framing by itself", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c6",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.politicalFraming,
      locale: "de",
    });
    expect(result.publicationStatus).toBe("publishable_as_opinion");
    expect(result.safetyDecision).not.toBe("blocked");
  });

  it("treats low readability as rewrite, not block", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c7",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.longRambling,
      locale: "de",
    });
    expect(result.publicationStatus).toBe("needs_rewrite");
    expect(result.safetyDecision).not.toBe("blocked");
  });

  it("blocks concrete danger signals", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c8",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.threat,
      locale: "de",
    });
    expect(result.kind).toBe("unsafe");
    expect(result.publicationStatus).toBe("blocked");
  });

  it("keeps third-party pii accusations out of publishable status", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c9",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyAddressAccusation,
      locale: "de",
    });
    expect(result.publicationStatus).toBe("moderation_required");
    expect(result.text).not.toContain("Musterstraße");
  });

  it("requires graph review for cross-lingual claims", () => {
    const result = evaluateCreateClaimSafety({
      claimId: "c10",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.crossLingual,
      locale: "de",
      sourceLanguage: "en",
      contentLanguage: "de",
    });
    expect(result.publicationStatus).toBe("graph_review_required");
    expect(result.graphReviewRequired).toBe(true);
    expect(result.noAutoPublish).toBe(true);
    expect(result.noSilentMerge).toBe(true);
  });
});
