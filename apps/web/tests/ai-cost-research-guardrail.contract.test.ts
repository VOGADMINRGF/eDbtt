import { describe, expect, it } from "vitest";
import {
  resolveAiFlowIntegration,
  resolveAiQualityGate,
  resolveAiSmokeStatusCopy,
} from "@/features/ai/v2OrchestrationPolicy";

describe("ai cost and research guardrail contract", () => {
  it("keeps feed, themenradar and material extraction off premium research by default", () => {
    for (const flow of ["feed_signal", "themenradar", "material_extraction", "dossier_update"] as const) {
      const integration = resolveAiFlowIntegration(flow);
      expect(integration.researchAllowed).toBe(false);
      expect(integration.costApprovalRequired).toBe(false);
      expect(integration.publicOutputAllowed).toBe(false);
      expect(integration.draftOnly).toBe(true);
    }
  });

  it("forces premium research lanes through explicit approval", () => {
    const factcheck = resolveAiFlowIntegration("sealed_factcheck");
    expect(factcheck.researchAllowed).toBe(true);
    expect(factcheck.costApprovalRequired).toBe(true);
    expect(factcheck.factcheckRequired).toBe(true);
  });

  it("classifies payment-required and missing config states as guarded, not green", () => {
    expect(
      resolveAiSmokeStatusCopy({
        status: "failed",
        providerErrorCode: "PAYMENT_REQUIRED",
      }),
    ).toMatchObject({
      code: "cost_blocked",
      label: "Kostenpfad blockiert",
    });

    expect(
      resolveAiSmokeStatusCopy({
        status: "config_missing",
        journeyDecision: "config_missing",
      }),
    ).toMatchObject({
      code: "missing_secret",
      label: "Konfiguration fehlt",
    });
  });

  it("keeps quality gates draft-first unless explicit factcheck says otherwise", () => {
    const materialGate = resolveAiQualityGate({
      lane: "material_extraction",
      schemaValid: true,
      safeEnough: true,
    });
    expect(materialGate.decision).toBe("draft_only");
    expect(materialGate.readyForReview).toBe(false);

    const factcheckGate = resolveAiQualityGate({
      lane: "sealed_factcheck",
      schemaValid: true,
      safeEnough: true,
      factcheckRequired: true,
    });
    expect(factcheckGate.decision).toBe("factcheck_required");
  });
});
