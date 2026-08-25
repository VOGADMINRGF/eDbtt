import crypto from "node:crypto";
import { classifyCreateInput } from "../src/features/create/inputClassification";
import { loadCreateExternalSource } from "../src/features/create/externalSourceIntake";

const DEFAULT_SOURCES = [
  {
    matrixCase: "html",
    url: "https://www.w3.org/TR/WCAG22/",
  },
  {
    matrixCase: "pdf",
    url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  },
  {
    matrixCase: "youtube",
    url: "https://www.youtube.com/watch?v=iWO5N3n1DXU",
  },
] as const;

function safeErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "youtube_transcript_unavailable") return message;
  if (/^link_fetch_failed_(?:\d{3}|empty)$/.test(message)) return message;
  if (message.toLowerCase().includes("timeout")) return "source_fetch_timeout";
  return "source_fetch_failed";
}

async function run() {
  const rows = [];
  for (const entry of DEFAULT_SOURCES) {
    const startedAt = Date.now();
    try {
      const source = await loadCreateExternalSource(entry.url);
      const contentComplete = source.text.length >= 180;
      rows.push({
        matrixCase: entry.matrixCase,
        url: entry.url,
        inputType: classifyCreateInput({ text: entry.url }),
        route: "/api/create/link-analysis source loader",
        httpStatus: source.httpStatus,
        sourceType: source.sourceKind,
        sourceLoaded: contentComplete,
        analysisState: contentComplete ? "content_loaded" : "fetch_failed",
        validatedTopicCount: null,
        claimsOrStatements: null,
        evidenceReferences: [entry.url],
        degraded: !contentComplete,
        degradedReason: contentComplete ? null : "source_content_too_short",
        supportHandoff: false,
        routeWouldRequestSupportHandoff: !contentComplete,
        providerAttempts: [],
        contentLength: source.text.length,
        contentHash: crypto.createHash("sha256").update(source.text).digest("hex"),
        pageCount: source.pageCount,
        contentType: source.contentType,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const degradedReason = safeErrorCode(error);
      rows.push({
        matrixCase: entry.matrixCase,
        url: entry.url,
        inputType: classifyCreateInput({ text: entry.url }),
        route: "/api/create/link-analysis source loader",
        httpStatus: degradedReason.match(/_(\d{3})$/)?.[1]
          ? Number(degradedReason.match(/_(\d{3})$/)?.[1])
          : null,
        sourceType: entry.matrixCase,
        sourceLoaded: false,
        analysisState: "fetch_failed",
        validatedTopicCount: 0,
        claimsOrStatements: 0,
        evidenceReferences: [entry.url],
        degraded: true,
        degradedReason,
        supportHandoff: false,
        routeWouldRequestSupportHandoff: true,
        providerAttempts: [],
        contentLength: 0,
        contentHash: null,
        pageCount: null,
        contentType: null,
        durationMs: Date.now() - startedAt,
      });
    }
  }

  process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`);
}

void run();
