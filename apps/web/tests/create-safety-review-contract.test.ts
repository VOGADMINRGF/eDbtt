import { describe, expect, it } from "vitest";
import { evaluateCreateInputSafety } from "@/features/create/safety/createInputSafety";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

describe("create safety review contract", () => {
  it("builds review items with the review-contract core fields and no raw pii", () => {
    const result = evaluateCreateInputSafety({
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyPiiAccusation,
      locale: "de",
      routeStage: "save",
      draftId: "draft-123",
      runId: "run-123",
    });

    const item = result.reviewItems.find((entry) => entry.code === "third_party_pii_accusation");
    expect(item).toBeTruthy();
    expect(item?.draftId).toBe("draft-123");
    expect(item?.runId).toBe("run-123");
    expect(item?.decision).toBe(result.decision);
    expect(item?.redactedTextPreview).toContain("[TELEFON ENTFERNT]");
    expect(item?.findingKinds.length).toBeGreaterThan(0);
    expect(item?.status).toBe("open");
    expect(JSON.stringify(item)).not.toContain("9999999");
    expect(JSON.stringify(item)).not.toContain("Musterstraße");
  });

  it("marks safe verification questions as proceedable review items", () => {
    const result = evaluateCreateInputSafety({
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim,
      locale: "de",
      routeStage: "analyze",
      runId: "run-allow",
    });

    const item = result.reviewItems.find((entry) => entry.code === "safe_question_proceed");
    expect(item?.action).toBe("allow");
    expect(item?.factCheckCandidateCount).toBeGreaterThan(0);
    expect(result.decision).toBe("allow");
  });
});
