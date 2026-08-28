import { describe, expect, it } from "vitest";
import {
  extractUploadedFileText,
  isDirectTextUpload,
  requiresExternalDocumentExtraction,
} from "@/features/material/materialUploadedFileText";

describe("material uploaded file text", () => {
  it("extracts real text uploads server-side", async () => {
    const file = new File([
      "Mieten sollen bezahlbar bleiben. Welche Instrumente sollen priorisiert werden?",
    ], "programm.md", { type: "text/markdown" });

    expect(isDirectTextUpload(file)).toBe(true);
    const result = await extractUploadedFileText(file);

    expect(result.status).toBe("full");
    expect(result.extractedBy).toBe("server_file_text");
    expect(result.text).toContain("Welche Instrumente");
    expect(result.providerRequired).toBe(false);
  });

  it("does not pretend to parse PDF/DOCX without a productive provider", async () => {
    const pdf = new File(["%PDF-1.7 fake binary"], "studie.pdf", {
      type: "application/pdf",
    });
    const docx = new File(["PK fake zip"], "programm.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    expect(requiresExternalDocumentExtraction(pdf)).toBe(true);
    expect(requiresExternalDocumentExtraction(docx)).toBe(true);

    for (const file of [pdf, docx]) {
      const result = await extractUploadedFileText(file);
      expect(result.status).toBe("none");
      expect(result.text).toBeNull();
      expect(result.providerRequired).toBe(true);
      expect(result.blocker).toBe("external_extraction_required");
    }
  });
});
