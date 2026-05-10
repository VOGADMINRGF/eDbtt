import { describe, expect, it } from "vitest";

import { parseCreateAnalyzeEnvelope } from "@/features/create/analyzeEnvelope";

describe("create analyze envelope verification parsing", () => {
  it("parses verification contract fields from response root", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      verificationMode: "none",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
      verificationLabel: "analysiert",
    });

    expect(parsed.verification).toEqual({
      lane: "standard",
      verificationMode: "none",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
      verificationLabel: "analysiert",
    });
  });

  it("falls back to meta fields when root fields are absent", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      meta: {
        verificationMode: "precheck",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
      },
    });

    expect(parsed.verification?.verificationMode).toBe("precheck");
    expect(parsed.verification?.verificationLabel).toBe("geprueft");
    expect(parsed.verification?.lane).toBe("standard");
  });

  it("parses material-grounding verification and gemini research from meta", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      meta: {
        lane: "material_grounding",
        verificationMode: "precheck",
        researchUsed: "gemini",
        sealEligible: false,
        sealGranted: false,
      },
    });

    expect(parsed.verification).toEqual({
      lane: "material_grounding",
      verificationMode: "precheck",
      researchUsed: "gemini",
      sealEligible: false,
      sealGranted: false,
      verificationLabel: "geprueft",
    });
  });
});
