import { describe, expect, it } from "vitest";

import { deriveTruthGuardContract } from "@features/ai/e150/verificationContract";

describe("e150 truth guard contract", () => {
  it("keeps standard analysis without sources in analysiert with no truth promotion", () => {
    const guard = deriveTruthGuardContract({
      lane: "standard",
      verificationMode: "none",
      sealGranted: false,
      sourceGrounding: {
        sourceInventory: { total: 0 },
        synthesis: {
          documentGroundedClaims: 0,
          webGroundedClaims: 0,
          inferredClaims: 0,
          openClaims: 1,
        },
        noSourceBluffing: { passed: true },
        requiresManualReview: false,
      },
    });

    expect(guard.verificationLabel).toBe("analysiert");
    expect(guard.truthStatus).toBe("source_open");
    expect(guard.sourceSupport).toBe("open");
    expect(guard.sourceStatus).toBe("Keine Quellenprüfung gestartet");
    expect(guard.noTruthPromotion).toBe(true);
    expect(guard.noAutoGraphPromotion).toBe(true);
  });

  it("does not expose precheck without sources as geprueft", () => {
    const guard = deriveTruthGuardContract({
      lane: "standard",
      verificationMode: "precheck",
      sealGranted: false,
      sourceGrounding: {
        sourceInventory: { total: 0 },
        synthesis: {
          documentGroundedClaims: 0,
          webGroundedClaims: 0,
          inferredClaims: 0,
          openClaims: 1,
        },
        noSourceBluffing: { passed: true },
        requiresManualReview: false,
      },
    });

    expect(guard.verificationLabel).toBe("analysiert");
    expect(guard.truthStatus).toBe("source_open");
  });

  it("forces review when source bluffing fails or inferred claims remain", () => {
    const guard = deriveTruthGuardContract({
      lane: "standard",
      verificationMode: "precheck",
      sealGranted: false,
      sourceGrounding: {
        sourceInventory: { total: 1 },
        synthesis: {
          documentGroundedClaims: 0,
          webGroundedClaims: 0,
          inferredClaims: 2,
          openClaims: 0,
        },
        noSourceBluffing: { passed: false },
        requiresManualReview: true,
      },
    });

    expect(guard.reviewRecommended).toBe(true);
    expect(guard.verificationLabel).toBe("analysiert");
    expect(guard.truthStatus).toBe("review_required");
  });

  it("allows verifiziert only for sealed factcheck with granted seal", () => {
    const guard = deriveTruthGuardContract({
      lane: "sealed_factcheck",
      verificationMode: "sealed",
      sealGranted: true,
      sourceGrounding: {
        sourceInventory: { total: 2 },
        synthesis: {
          documentGroundedClaims: 2,
          webGroundedClaims: 0,
          inferredClaims: 0,
          openClaims: 0,
        },
        noSourceBluffing: { passed: true },
        requiresManualReview: false,
      },
    });

    expect(guard.verificationLabel).toBe("verifiziert");
    expect(guard.truthStatus).toBe("sealed_verified");
    expect(guard.sourceSupport).toBe("sealed");
  });

  it("does not allow standard lane to escalate sealed payloads to verifiziert", () => {
    const guard = deriveTruthGuardContract({
      lane: "standard",
      verificationMode: "sealed",
      sealGranted: true,
      sourceGrounding: {
        sourceInventory: { total: 2 },
        synthesis: {
          documentGroundedClaims: 2,
          webGroundedClaims: 0,
          inferredClaims: 0,
          openClaims: 0,
        },
        noSourceBluffing: { passed: true },
        requiresManualReview: false,
      },
    });

    expect(guard.verificationLabel).not.toBe("verifiziert");
    expect(guard.truthStatus).not.toBe("sealed_verified");
    expect(guard.reviewRecommended).toBe(true);
  });

  it("keeps sealed factcheck without granted seal below verifiziert", () => {
    const guard = deriveTruthGuardContract({
      lane: "sealed_factcheck",
      verificationMode: "sealed",
      sealGranted: false,
      sourceGrounding: {
        sourceInventory: { total: 2 },
        synthesis: {
          documentGroundedClaims: 2,
          webGroundedClaims: 0,
          inferredClaims: 0,
          openClaims: 0,
        },
        noSourceBluffing: { passed: true },
        requiresManualReview: false,
      },
    });

    expect(guard.verificationLabel).not.toBe("verifiziert");
    expect(guard.truthStatus).toBe("factcheck_passed");
  });

  it("blocks checked presentation when fallback or disagreement is present", () => {
    const guard = deriveTruthGuardContract({
      lane: "sealed_factcheck",
      verificationMode: "sealed",
      sealGranted: false,
      fallbackUsed: true,
      disagreement: {
        present: true,
        missingSpecialists: ["anthropic"],
      },
      sourceGrounding: {
        sourceInventory: { total: 2 },
        synthesis: {
          documentGroundedClaims: 2,
          webGroundedClaims: 0,
          inferredClaims: 0,
          openClaims: 0,
        },
        noSourceBluffing: { passed: true },
        requiresManualReview: false,
      },
    });

    expect(guard.verificationLabel).toBe("analysiert");
    expect(guard.reviewRecommended).toBe(true);
    expect(guard.truthStatus).toBe("factcheck_requested");
  });
});
