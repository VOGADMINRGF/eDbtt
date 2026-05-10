import { describe, expect, it } from "vitest";
import { resolveMaterialRouting } from "@/features/create/materialRouting";

describe("create material routing contract", () => {
  it("routes YouTube-only intake into material grounding with notebooklm + gemini", () => {
    const result = resolveMaterialRouting({
      text: "https://youtu.be/demo12345",
      researchMode: "auto",
    });

    expect(result.lane).toBe("material_grounding");
    expect(result.materialProvider).toBe("notebooklm");
    expect(result.researchUsed).toBe("gemini");
    expect(result.researchProvider).toBe("gemini");
    expect(result.materialItems[0]?.kind).toBe("youtube_url");
  });

  it("routes PDF uploads into material grounding", () => {
    const result = resolveMaterialRouting({
      uploadIds: ["upload-1"],
      materialItems: [{ uploadId: "upload-1", fileName: "bericht.pdf", kind: "upload_document" }],
    });

    expect(result.lane).toBe("material_grounding");
    expect(result.materialItems.some((item) => item.kind === "pdf_document" || item.kind === "upload_document")).toBe(true);
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
    process.env.E150_DEEPSEARCH_ENABLED = "true";
    process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION = "true";

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
      delete process.env.E150_DEEPSEARCH_ENABLED;
      delete process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION;
    }
  });
});
