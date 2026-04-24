import { describe, expect, it } from "vitest";

import {
  buildSealedLaneContract,
  buildStandardLaneContract,
  deriveVerificationLabel,
} from "@features/ai/e150/verificationContract";

describe("verification label contract", () => {
  it("maps none to analysiert", () => {
    const contract = buildStandardLaneContract({ verificationMode: "none" });
    expect(deriveVerificationLabel(contract)).toBe("analysiert");
    expect(contract.researchUsed).toBe("none");
    expect(contract.sealEligible).toBe(false);
    expect(contract.sealGranted).toBe(false);
  });

  it("maps precheck to geprueft", () => {
    const contract = buildStandardLaneContract({ verificationMode: "precheck" });
    expect(deriveVerificationLabel(contract)).toBe("geprueft");
  });

  it("does not mark sealed without seal as verifiziert", () => {
    const contract = buildSealedLaneContract({
      researchUsed: "search",
      sealGranted: false,
    });
    expect(deriveVerificationLabel(contract)).toBe("geprueft");
  });

  it("maps sealed plus sealGranted to verifiziert", () => {
    const contract = buildSealedLaneContract({
      researchUsed: "deep_search",
      sealGranted: true,
    });
    expect(deriveVerificationLabel(contract)).toBe("verifiziert");
  });
});
