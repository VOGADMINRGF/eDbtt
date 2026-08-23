import { PDFParse } from "pdf-parse";
import { fetchYoutubeTranscript } from "@features/ai/sources/youtube";
import type { DocumentAnalysisSummary } from "@/features/create/intelligentFollowupContract";

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
  const parser = new PDFParse({ data: Uint8Array.from(buffer) });
  try {
    const result = await parser.getText();
    return {
      text: result.text.replace(/\s+/g, " ").trim(),
      pageCount: result.total > 0 ? result.total : null,
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
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
      throw new Error("youtube_transcript_unavailable");
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
    };
  }

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "user-agent": "eDebatte Create Link Analysis",
      accept: "text/html,application/pdf,text/plain;q=0.9,*/*;q=0.2",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`link_fetch_failed_${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("link_fetch_failed_empty");
  }

  if (contentType.includes("pdf") || /\.pdf(?:$|[?#])/i.test(url)) {
    const extracted = await extractPdfText(buffer);
    return {
      sourceKind: "pdf",
      html: null,
      text: extracted.text,
      pageCount: extracted.pageCount,
      contentType,
      documentType: inferDocumentType(url, contentType),
      documentTitle: inferDocumentTitle(url),
      httpStatus: response.status,
    };
  }

  const html = buffer.toString("utf8");
  return {
    sourceKind: "html",
    html,
    text: stripHtmlToText(html),
    pageCount: null,
    contentType,
    documentType: inferDocumentType(url, contentType),
    documentTitle: inferDocumentTitle(url, html),
    httpStatus: response.status,
  };
}
