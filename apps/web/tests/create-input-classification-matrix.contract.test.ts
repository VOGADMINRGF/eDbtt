import { describe, expect, it } from "vitest";
import { classifyCreateInput } from "@/features/create/inputClassification";
import { resolveMaterialRouting } from "@/features/create/materialRouting";
import {
  buildCreateTechnicalFollowup,
  buildCreateValidatedDocumentFollowup,
} from "@/features/create/intelligentFollowupResults";

describe("/create external input classification matrix", () => {
  it.each([
    {
      label: "normal HTML URL",
      text: "https://example.test/article",
      expected: "link",
    },
    {
      label: "direct PDF URL",
      text: "https://example.test/program.pdf",
      expected: "document_url",
    },
    {
      label: "YouTube URL",
      text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      expected: "youtube_video_url",
    },
  ])("preserves the specific $label class after material routing", ({ text, expected }) => {
    const routing = resolveMaterialRouting({ text });

    expect(routing.lane).toBe("material_grounding");
    expect(
      classifyCreateInput({
        text,
        sourceUrls: routing.sourceUrls,
        materialItems: routing.materialItems,
      }),
    ).toBe(expected);
  });

  it.each([
    {
      label: "short single-topic text",
      text: "Der Schulweg braucht eine sichere Querung.",
      expected: "claim",
    },
    {
      label: "multi-topic text",
      text: "Wir brauchen sichere Schulwege, bezahlbare Wohnungen und einen besseren Busverkehr.",
      expected: "free_text",
    },
    {
      label: "long programmatic text",
      text: `${"Das Programm soll Bildung, Wohnen, Klima und Mobilität gemeinsam verbessern. ".repeat(30)}`,
      expected: "claim",
    },
  ])("keeps $label on the text intake contract", ({ text, expected }) => {
    expect(classifyCreateInput({ text })).toBe(expected);
  });

  it("builds a source-referenced validated Create structure from a multi-topic document", () => {
    const sourceUrl = "https://example.test/study.pdf";
    const result = buildCreateValidatedDocumentFollowup({
      text: sourceUrl,
      sourceUrl,
      generatedAt: "2026-08-23T10:00:00.000Z",
      documentAnalysis: {
        sourceUrl,
        documentTitle: "Studie zu Wohnen und Mobilität",
        documentType: "study",
        pageCount: 12,
        wordCount: 4_200,
        topicCount: 2,
        subtopicCount: 4,
        keyStatementCount: 5,
        verifiableClaimCount: 3,
        policyProposalCount: 2,
        subjectBreadth: "broad",
        subjectDepth: "high",
        balanceAssessment: "mostly_balanced",
        sourceSpecificity: "specific",
        sourceVerificationStatus: "not_started",
        counterpositionCoverage: "partial",
        summary: "Die Studie trennt Wohnkosten und Verkehrszugang und weist methodische Grenzen aus.",
        topics: [
          { id: "wohnen", label: "Wohnkosten", summary: "Mietbelastung und Angebot." },
          { id: "mobilitaet", label: "Verkehrszugang", summary: "Erreichbarkeit und Taktung." },
        ],
      },
    });

    expect(result.meta?.analysis).toMatchObject({
      state: "result_ready",
      sourceType: "document",
      sourceUrl,
      sourceLoaded: true,
      validationStatus: "validated",
      evidenceReferences: [sourceUrl],
    });
    expect(result.understanding.topics).toHaveLength(2);
    expect(result.understanding.statements).toEqual([
      expect.objectContaining({
        id: "document-summary",
        text: expect.stringContaining("Wohnkosten und Verkehrszugang"),
      }),
    ]);
    expect(result.degraded).toBe(false);
    expect(result.degradedReason).toBeNull();
  });

  it("builds an honest non-semantic fallback when source extraction is missing", () => {
    const sourceUrl = "https://example.test/blocked";
    const result = buildCreateTechnicalFollowup({
      text: sourceUrl,
      analysisState: "fetch_failed",
      sourceType: "link",
      sourceUrl,
      sourceLoaded: false,
      userMessage: "Die Quelle konnte nicht geladen werden; bitte manuell prüfen.",
      generatedAt: "2026-08-23T10:00:00.000Z",
    });

    expect(result.meta?.analysis).toMatchObject({
      state: "fetch_failed",
      sourceType: "link",
      sourceUrl,
      sourceLoaded: false,
      validationStatus: "failed",
      evidenceReferences: [sourceUrl],
    });
    expect(result.understanding.topics).toEqual([]);
    expect(result.understanding.statements).toEqual([]);
    expect(result.degraded).toBe(true);
    expect(result.degradedReason).toBe("fetch_failed");
  });
});
