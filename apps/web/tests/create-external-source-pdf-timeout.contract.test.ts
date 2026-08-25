import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  destroy: vi.fn().mockResolvedValue(undefined),
  safeExternalFetch: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    destroy = mocks.destroy;
    getText() {
      return new Promise(() => undefined);
    }
  },
}));
vi.mock("@/lib/net/safeExternalFetch", () => ({
  safeExternalFetch: (...args: unknown[]) => mocks.safeExternalFetch(...args),
}));

import {
  CREATE_EXTERNAL_PDF_PARSE_TIMEOUT_MS,
  loadCreateExternalSource,
} from "@/features/create/externalSourceIntake";

describe("Create PDF parser timeout", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("terminates a parser that exceeds the bounded extraction budget", async () => {
    vi.useFakeTimers();
    mocks.safeExternalFetch.mockResolvedValueOnce({
      buffer: Buffer.from("%PDF-1.7\nfixture"),
      contentType: "application/pdf",
      finalUrl: "https://public.example/study.pdf",
      headers: new Headers({ "content-type": "application/pdf" }),
      redirectCount: 0,
      status: 200,
    });

    const result = loadCreateExternalSource("https://public.example/study.pdf");
    const rejection = expect(result).rejects.toThrow("external_source_pdf_parse_timeout");
    await vi.advanceTimersByTimeAsync(CREATE_EXTERNAL_PDF_PARSE_TIMEOUT_MS);

    await rejection;
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
  });
});
