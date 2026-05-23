import { describe, expect, it } from "vitest";

import { resolveVerificationPresentationView } from "@features/ai/e150/verificationPresentation";

describe("e150 verification presentation contract", () => {
  it("maps standard lane to analysiert with no research/seal", () => {
    const view = resolveVerificationPresentationView({
      lane: "standard",
      verificationMode: "none",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
    });

    expect(view.lane).toBe("standard");
    expect(view.verificationLabel).toBe("analysiert");
    expect(view.verificationLabelDisplay).toBe("analysiert");
    expect(view.researchUsed).toBe("none");
    expect(view.sealGranted).toBe(false);
    expect(view.sealLabel).toBe("kein Siegel");
    expect(view.isVerified).toBe(false);
  });

  it("never marks standard lane as verifiziert even with inconsistent sealed fields", () => {
    const view = resolveVerificationPresentationView({
      lane: "standard",
      verificationMode: "sealed",
      researchUsed: "deep_search",
      sealEligible: true,
      sealGranted: true,
    });

    expect(view.lane).toBe("standard");
    expect(view.verificationMode).toBe("none");
    expect(view.verificationLabel).toBe("analysiert");
    expect(view.researchUsed).toBe("deep_search");
    expect(view.sealGranted).toBe(false);
    expect(view.isVerified).toBe(false);
  });

  it("keeps sealed lane in geprueft while seal is pending", () => {
    const view = resolveVerificationPresentationView({
      lane: "sealed_factcheck",
      status: "queued",
      verificationMode: "sealed",
      researchUsed: "search",
      sealEligible: true,
      sealGranted: false,
    });

    expect(view.lane).toBe("sealed_factcheck");
    expect(view.verificationLabel).toBe("geprueft");
    expect(view.workflowStage).toBe("queued");
    expect(view.workflowLabel).toBe("in Warteschlange");
    expect(view.sealLabel).toBe("Siegel ausstehend");
    expect(view.isVerified).toBe(false);
  });

  it("labels material grounding separately without default research context", () => {
    const view = resolveVerificationPresentationView({
      lane: "material_grounding",
      verificationMode: "precheck",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
    });

    expect(view.lane).toBe("material_grounding");
    expect(view.laneLabel).toBe("Material-Grounding-Lane");
    expect(view.verificationLabel).toBe("geprueft");
    expect(view.researchUsed).toBe("none");
    expect(view.researchLabel).toBe("keine Recherche");
  });

  it("marks verifiziert only for sealed lane with seal granted", () => {
    const view = resolveVerificationPresentationView({
      lane: "sealed_factcheck",
      status: "completed",
      verificationMode: "sealed",
      researchUsed: "deep_search",
      sealEligible: true,
      sealGranted: true,
    });

    expect(view.verificationLabel).toBe("verifiziert");
    expect(view.verificationLabelDisplay).toBe("verifiziert");
    expect(view.workflowStage).toBe("completed");
    expect(view.sealLabel).toBe("Siegel erteilt");
    expect(view.isVerified).toBe(true);
  });

  it("falls back defensively for partial payloads", () => {
    const view = resolveVerificationPresentationView({});
    expect(view.lane).toBe("standard");
    expect(view.verificationMode).toBe("none");
    expect(view.verificationLabel).toBe("analysiert");
    expect(view.researchUsed).toBe("none");
  });
});
