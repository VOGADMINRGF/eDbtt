import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsPDF } from "jspdf";

const mocks = vi.hoisted(() => ({
  safeExternalFetch: vi.fn(),
}));

vi.mock("@/lib/net/safeExternalFetch", () => ({
  safeExternalFetch: (...args: unknown[]) => mocks.safeExternalFetch(...args),
}));

import {
  CREATE_EXTERNAL_HTML_MAX_BYTES,
  CREATE_EXTERNAL_PDF_MAX_BYTES,
  CREATE_EXTERNAL_PDF_MAX_PAGES,
  loadCreateExternalSource,
} from "@/features/create/externalSourceIntake";

function compressedPdf(pages = 1): Buffer {
  const document = new jsPDF({ compress: true });
  for (let page = 1; page <= pages; page += 1) {
    if (page > 1) document.addPage();
    document.text(`LIMIT PAGE ${page} public study content`, 20, 20);
  }
  return Buffer.from(document.output("arraybuffer"));
}

function sourceResult(buffer: Buffer, contentType: string, finalUrl = "https://public.example/source") {
  return {
    buffer,
    contentType,
    finalUrl,
    headers: new Headers({ "content-type": contentType }),
    redirectCount: 0,
    status: 200,
  };
}

describe("Create external-source type and PDF resource safety", () => {
  beforeEach(() => vi.clearAllMocks());

  it("wires separate bounded ceilings for HTML and PDF responses", async () => {
    mocks.safeExternalFetch.mockResolvedValueOnce(
      sourceResult(Buffer.from("<html><body>public source</body></html>"), "text/html"),
    );
    await loadCreateExternalSource("https://public.example/source");

    const fetchOptions = mocks.safeExternalFetch.mock.calls[0]?.[1] as {
      maxBytes: (input: { contentType: string; finalUrl: string }) => number;
    };
    expect(fetchOptions.maxBytes({ contentType: "text/html", finalUrl: "https://public.example" })).toBe(
      CREATE_EXTERNAL_HTML_MAX_BYTES,
    );
    expect(fetchOptions.maxBytes({ contentType: "application/pdf", finalUrl: "https://public.example" })).toBe(
      CREATE_EXTERNAL_PDF_MAX_BYTES,
    );
  });

  it.each([
    ["application/pdf", "https://public.example/source"],
    ["text/html", "https://public.example/source.pdf"],
  ])("rejects PDF spoofing declared by MIME or suffix (%s)", async (contentType, finalUrl) => {
    mocks.safeExternalFetch.mockResolvedValueOnce(
      sourceResult(Buffer.from("<html><body>not a PDF</body></html>"), contentType, finalUrl),
    );
    await expect(loadCreateExternalSource(finalUrl)).rejects.toThrow(
      "external_source_pdf_signature_invalid",
    );
  });

  it("sniffs a real PDF despite a false text MIME and extracts document content", async () => {
    mocks.safeExternalFetch.mockResolvedValueOnce(
      sourceResult(compressedPdf(), "text/html", "https://public.example/download"),
    );
    const source = await loadCreateExternalSource("https://public.example/download");
    expect(source.sourceKind).toBe("pdf");
    expect(source.text).toContain("public study content");
    expect(source.pageCount).toBe(1);
  });

  it("rejects unsupported binary content that is not a real PDF", async () => {
    mocks.safeExternalFetch.mockResolvedValueOnce(
      sourceResult(Buffer.from([1, 2, 3, 4]), "application/octet-stream"),
    );
    await expect(loadCreateExternalSource("https://public.example/source")).rejects.toThrow(
      "external_source_content_type_unsupported",
    );
  });

  it("caps PDF text extraction to the configured page budget while retaining total pages", async () => {
    const totalPages = CREATE_EXTERNAL_PDF_MAX_PAGES + 1;
    mocks.safeExternalFetch.mockResolvedValueOnce(
      sourceResult(compressedPdf(totalPages), "application/pdf", "https://public.example/study.pdf"),
    );
    const source = await loadCreateExternalSource("https://public.example/study.pdf");

    expect(source.pageCount).toBe(totalPages);
    expect(source.text).toContain(`LIMIT PAGE ${CREATE_EXTERNAL_PDF_MAX_PAGES}`);
    expect(source.text).not.toContain(`LIMIT PAGE ${totalPages}`);
  });
});
