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
      truthStatus: "draft_analysis",
      sourceSupport: "none",
      sourceStatus: "Analyseentwurf ohne Quellenpflicht",
      reviewRecommended: false,
    });

    expect(parsed.verification).toEqual({
      lane: "standard",
      verificationMode: "none",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
      verificationLabel: "analysiert",
      truthStatus: "draft_analysis",
      sourceSupport: "none",
      sourceStatus: "Analyseentwurf ohne Quellenpflicht",
      reviewRecommended: false,
      noTruthPromotion: true,
      noAutoGraphPromotion: true,
    });
  });

  it("falls back to meta fields when root fields are absent", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      meta: {
        verificationMode: "precheck",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
        sourceGrounding: {
          taskType: "analyze",
          sourceInventory: {
            total: 0,
            uploadDocuments: 0,
            webReferences: 0,
            freeNotes: 0,
            youtubeTranscripts: 0,
            pdfDocuments: 0,
            materialSummaries: 0,
          },
          materialExtraction: {
            total: 0,
            complete: 0,
            partial: 0,
            none: 0,
          },
          documentGroundingPass: {
            required: false,
            documentsWithText: 0,
            startCoverage: false,
            middleCoverage: false,
            endCoverage: false,
            contextRotRisk: "low",
          },
          externalContextPass: {
            webReferences: 0,
            policy: "supplement_only",
          },
          synthesis: {
            documentGroundedClaims: 0,
            webGroundedClaims: 0,
            inferredClaims: 0,
            openClaims: 1,
          },
          contradictionAudit: {
            contradictionSignals: [],
            hasSignal: false,
          },
          noSourceBluffing: {
            passed: true,
            reason: null,
          },
          requiresManualReview: false,
        },
      },
    });

    expect(parsed.verification?.verificationMode).toBe("precheck");
    expect(parsed.verification?.verificationLabel).toBe("analysiert");
    expect(parsed.verification?.sourceSupport).toBe("open");
    expect(parsed.verification?.sourceStatus).toBe("Keine Quellenprüfung gestartet");
    expect(parsed.verification?.lane).toBe("standard");
  });

  it("parses material-grounding verification without default research from meta", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      meta: {
        lane: "material_grounding",
        verificationMode: "precheck",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
        truthStatus: "source_open",
        sourceSupport: "open",
        sourceStatus: "Keine Quellenprüfung gestartet",
        reviewRecommended: true,
      },
    });

    expect(parsed.verification).toEqual({
      lane: "material_grounding",
      verificationMode: "precheck",
      researchUsed: "none",
      sealEligible: false,
      sealGranted: false,
      verificationLabel: "analysiert",
      truthStatus: "source_open",
      sourceSupport: "open",
      sourceStatus: "Keine Quellenprüfung gestartet",
      reviewRecommended: true,
      noTruthPromotion: true,
      noAutoGraphPromotion: true,
    });
  });
});
