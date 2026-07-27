import { describe, expect, it } from "vitest";
import {
  buildCreateAttachmentMaterialItems,
  resolveMaterialRouting,
} from "@/features/create/materialRouting";

describe("create material routing contract", () => {
  it("routes YouTube-only intake into material grounding without automatic notebook or gemini research", () => {
    const result = resolveMaterialRouting({
      text: "https://youtu.be/demo12345",
      researchMode: "auto",
    });

    expect(result.lane).toBe("material_grounding");
    expect(result.materialProvider).toBe("none");
    expect(result.researchUsed).toBe("none");
    expect(result.researchProvider).toBe("none");
    expect(result.materialItems[0]?.kind).toBe("youtube_url");
    expect(result.requiresHumanReview).toBe(true);
  });

  it("routes PDF uploads into material grounding", () => {
    const result = resolveMaterialRouting({
      uploadIds: ["upload-1"],
      materialItems: [{ uploadId: "upload-1", fileName: "bericht.pdf", kind: "upload_document" }],
    });

    expect(result.lane).toBe("material_grounding");
    expect(result.materialItems.some((item) => item.kind === "pdf_document" || item.kind === "upload_document")).toBe(true);
  });

  it("maps selected create attachments into material items before analyze/save", () => {
    const items = buildCreateAttachmentMaterialItems([
      { name: "tierwohl-bericht.pdf", type: "application/pdf" },
      { name: "protokoll.txt", type: "text/plain" },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      kind: "pdf_document",
      fileName: "tierwohl-bericht.pdf",
    });
    expect(items[1]).toMatchObject({
      kind: "upload_document",
      fileName: "protokoll.txt",
    });
  });

  it("keeps normal freetext out of research by default", () => {
    const result = resolveMaterialRouting({
      text: "Ich möchte den Schulweg vor Ort sicherer machen und bitte um bessere Querungen.",
    });

    expect(result.lane).toBe("standard");
    expect(result.researchUsed).toBe("none");
    expect(result.researchProvider).toBe("none");
  });

  it("keeps vague local phrasing on clarification path instead of research", () => {
    const result = resolveMaterialRouting({
      text: "Bei uns in unserer Stadt ist der Schulweg gefährlich.",
    });

    expect(result.lane).toBe("standard");
    expect(result.clarificationState).toBe("clarification_required");
    expect(result.researchUsed).toBe("none");
  });

  it("uses openai deep search only as gated fallback when explicitly enabled and confirmed", () => {
    process.env.OPENAI_API_KEY = "test-openai";
    process.env.E150_DEEPSEARCH_ENABLED = "true";
    process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION = "true";
    process.env.OPENAI_DEEP_RESEARCH_MODEL = "o4-deep-research-preview";
    process.env.DEEP_RESEARCH_CREDIT_AVAILABLE = "1";

    try {
      const result = resolveMaterialRouting({
        sourceUrls: ["https://www.youtube.com/watch?v=demo12345"],
        researchMode: "gpt_deepsearch",
        allowDeepSearch: true,
        researchConfirmed: true,
      });

      expect(result.lane).toBe("material_grounding");
      expect(result.researchUsed).toBe("deep_search");
      expect(result.researchProvider).toBe("openai_deep_research");
      expect(result.fallbackUsed).toBe(true);
    } finally {
      delete process.env.OPENAI_API_KEY;
      delete process.env.E150_DEEPSEARCH_ENABLED;
      delete process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION;
      delete process.env.OPENAI_DEEP_RESEARCH_MODEL;
      delete process.env.DEEP_RESEARCH_CREDIT_AVAILABLE;
    }
  });

  it("uses gemini only when material research is explicitly confirmed", () => {
    const result = resolveMaterialRouting({
      sourceUrls: ["https://example.org/bericht.pdf"],
      researchMode: "gemini",
      researchConfirmed: true,
    });

    expect(result.lane).toBe("material_grounding");
    expect(result.researchUsed).toBe("gemini");
    expect(result.researchProvider).toBe("gemini");
  });
});
