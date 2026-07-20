import { describe, expect, it } from "vitest";
import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import {
  buildCreateTechnicalFollowup,
  buildCreateValidatedDocumentFollowup,
} from "@/features/create/intelligentFollowupResults";

const TECHNICAL_STATES = [
  "idle",
  "input_ready",
  "link_detected",
  "entitlement_required",
  "fetching",
  "fetch_failed",
  "content_loaded",
  "ai_analyzing",
  "ai_failed",
  "analysis_validated",
  "result_ready",
] as const;

describe("create candidate preview without semantic meta", () => {
  it("stays on an honest technical status across all non-semantic analysis states", () => {
    TECHNICAL_STATES.forEach((state) => {
      const result = buildCreateTechnicalFollowup({
        text: "https://example.org/quelle",
        analysisState: state,
        sourceType: "link",
        sourceUrl: "https://example.org/quelle",
        sourceLoaded: state !== "link_detected" && state !== "entitlement_required",
        userMessage: "Noch keine validierte semantische Analyse vorhanden.",
        generatedAt: "2026-07-18T14:00:00.000Z",
      });

      expect(() =>
        buildCreateCandidatePreviewReadModel({
          followup: result,
          sourceUrls: ["https://example.org/quelle"],
          materialItems: [],
        }),
      ).not.toThrow();

      const model = buildCreateCandidatePreviewReadModel({
        followup: result,
        sourceUrls: ["https://example.org/quelle"],
        materialItems: [],
      });

      expect(model.availability).toEqual({
        kind: "analysis_unavailable",
        semanticOutputAvailable: false,
        handoffAvailable: false,
        reason: "validated_ai_result_required",
        analysisState: state,
      });
      expect(model.hasPreview).toBe(false);
      expect(model.totalCount).toBe(0);
      expect(model.reviewHandoff.hasPreparedHandoff).toBe(false);
      expect(model.claimToDossierPipeline.hasPreparedPipeline).toBe(false);
      expect(model.feedEnrichmentSuggestions.hasSuggestions).toBe(false);
      expect(model.voxyCocreationDialog).toBeNull();
    });
  });

  it("keeps validated document analysis out of semantic handoff preview without planner meta", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildCreateValidatedDocumentFollowup({
        text: "https://example.org/programm.pdf",
        sourceUrl: "https://example.org/programm.pdf",
        generatedAt: "2026-07-18T15:00:00.000Z",
        documentAnalysis: {
          sourceUrl: "https://example.org/programm.pdf",
          documentTitle: "Programm",
          documentType: "report",
          pageCount: 14,
          wordCount: 4200,
          topicCount: 4,
          subtopicCount: 11,
          keyStatementCount: 22,
          verifiableClaimCount: 9,
          policyProposalCount: 4,
          subjectBreadth: "medium",
          subjectDepth: "medium",
          balanceAssessment: "unclear",
          sourceSpecificity: "specific",
          sourceVerificationStatus: "not_started",
          counterpositionCoverage: "weak",
          summary: "Vier Themen wurden erkannt.",
          topics: [
            { id: "topic-1", label: "ÖPNV" },
            { id: "topic-2", label: "Radverkehr" },
            { id: "topic-3", label: "Parkraum" },
            { id: "topic-4", label: "Planung" },
          ],
        },
      }),
      sourceUrls: ["https://example.org/programm.pdf"],
      materialItems: [],
    });

    expect(model.availability).toMatchObject({
      kind: "analysis_unavailable",
      reason: "validated_ai_result_required",
      analysisState: "result_ready",
    });
    expect(model.hasPreview).toBe(false);
    expect(model.reviewHandoff.hasPreparedHandoff).toBe(false);
  });
});
