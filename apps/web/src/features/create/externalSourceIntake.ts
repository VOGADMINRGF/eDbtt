import { fetchYoutubeTranscript } from "@features/ai/sources/youtube";
import type { DocumentAnalysisSummary } from "@/features/create/intelligentFollowupContract";
import { safeExternalFetch } from "@/lib/net/safeExternalFetch";

export const CREATE_EXTERNAL_HTML_MAX_BYTES = 2 * 1024 * 1024;
export const CREATE_EXTERNAL_PDF_MAX_BYTES = 10 * 1024 * 1024;
export const CREATE_EXTERNAL_PDF_MAX_PAGES = 80;
export const CREATE_EXTERNAL_PDF_MAX_TEXT_LENGTH = 120_000;
export const CREATE_EXTERNAL_PDF_PARSE_TIMEOUT_MS = 8_000;
export const CREATE_EXTERNAL_FETCH_TIMEOUT_MS = 20_000;

export type CreateExternalSourceKind = "html" | "pdf" | "youtube_transcript";

export type CreateExternalSource = {
  sourceKind: CreateExternalSourceKind;
  html: string | null;
  text: string;
  pageCount: number | null;
  contentType: string;
  documentType: DocumentAnalysisSummary["documentType"];
  documentTitle: string | null;
  httpStatus: number;
  transcriptSegmentCount: number | null;
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number | null }> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({
    data: Uint8Array.from(buffer),
    isEvalSupported: false,
    maxImageSize: 4_000_000,
    stopAtErrors: true,
    useWasm: false,
  });
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    const result = await Promise.race([
      parser.getText({ first: CREATE_EXTERNAL_PDF_MAX_PAGES }),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("external_source_pdf_parse_timeout")),
          CREATE_EXTERNAL_PDF_PARSE_TIMEOUT_MS,
        );
      }),
    ]);
    return {
      text: result.text.replace(/\s+/g, " ").trim().slice(0, CREATE_EXTERNAL_PDF_MAX_TEXT_LENGTH),
      pageCount: result.total > 0 ? result.total : null,
    };
  } finally {
    if (timeout) clearTimeout(timeout);
    await parser.destroy().catch(() => undefined);
  }
}

function hasPdfSignature(buffer: Buffer): boolean {
  return buffer.subarray(0, 1_024).indexOf(Buffer.from("%PDF-")) >= 0;
}

function maxSourceBytes(input: { contentType: string; finalUrl: string }): number {
  return input.contentType.includes("pdf") || /\.pdf(?:$|[?#])/i.test(input.finalUrl)
    ? CREATE_EXTERNAL_PDF_MAX_BYTES
    : CREATE_EXTERNAL_HTML_MAX_BYTES;
}

function isSupportedTextContentType(contentType: string): boolean {
  if (!contentType) return true;
  return (
    contentType.includes("text/html") ||
    contentType.includes("text/plain") ||
    contentType.includes("application/xhtml+xml")
  );
}

function inferDocumentType(
  url: string,
  contentType: string,
): DocumentAnalysisSummary["documentType"] {
  const haystack = `${url} ${contentType}`.toLowerCase();
  if (/programm|manifest|grundsatz/.test(haystack)) return "party_program";
  if (/gesetz|law|bill|verordnung/.test(haystack)) return "law";
  if (/studie|study/.test(haystack)) return "study";
  if (/bericht|report|pdf/.test(haystack)) return "report";
  if (/html|article|news|blog/.test(haystack)) return "article";
  return "unknown";
}

function inferDocumentTitle(url: string, html?: string): string | null {
  const titleMatch = html?.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  if (titleMatch) return decodeHtmlEntities(titleMatch);
  try {
    const parsed = new URL(url);
    const slug = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    return slug ? decodeURIComponent(slug).replace(/[-_]+/g, " ") : null;
  } catch {
    return null;
  }
}

export function isCreateYoutubeUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return (
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

export async function loadCreateExternalSource(url: string): Promise<CreateExternalSource> {
  if (isCreateYoutubeUrl(url)) {
    const transcript = await fetchYoutubeTranscript(url);
    if (!transcript.text.trim()) {
      throw new Error(
        `youtube_transcript_${transcript.failureReason ?? "unavailable"}`,
      );
    }
    return {
      sourceKind: "youtube_transcript",
      html: null,
      text: transcript.text.replace(/\s+/g, " ").trim(),
      pageCount: null,
      contentType: "text/plain; source=youtube-transcript",
      documentType: "unknown",
      documentTitle: `YouTube ${transcript.id}`,
      httpStatus: 200,
      transcriptSegmentCount: transcript.segmentCount ?? null,
    };
  }

  const response = await safeExternalFetch(url, {
    accept: "text/html,application/pdf,text/plain;q=0.9,*/*;q=0.2",
    maxBytes: maxSourceBytes,
    timeoutMs: CREATE_EXTERNAL_FETCH_TIMEOUT_MS,
    userAgent: "eDebatte Create Link Analysis",
  });
  const { buffer, contentType } = response;
  const declaredPdf =
    contentType.includes("pdf") ||
    /\.pdf(?:$|[?#])/i.test(url) ||
    /\.pdf(?:$|[?#])/i.test(response.finalUrl);
  const actualPdf = hasPdfSignature(buffer);
  if (declaredPdf && !actualPdf) {
    throw new Error("external_source_pdf_signature_invalid");
  }

  if (actualPdf) {
    const extracted = await extractPdfText(buffer);
    return {
      sourceKind: "pdf",
      html: null,
      text: extracted.text,
      pageCount: extracted.pageCount,
      contentType,
      documentType: inferDocumentType(`${url} ${response.finalUrl}`, contentType),
      documentTitle: inferDocumentTitle(response.finalUrl),
      httpStatus: response.status,
      transcriptSegmentCount: null,
    };
  }

  if (!isSupportedTextContentType(contentType)) {
    throw new Error("external_source_content_type_unsupported");
  }
  if (buffer.includes(0)) {
    throw new Error("external_source_text_binary_invalid");
  }
  const html = buffer.toString("utf8");
  return {
    sourceKind: "html",
    html,
    text: stripHtmlToText(html),
    pageCount: null,
    contentType,
    documentType: inferDocumentType(`${url} ${response.finalUrl}`, contentType),
    documentTitle: inferDocumentTitle(response.finalUrl, html),
    httpStatus: response.status,
    transcriptSegmentCount: null,
  };
}
