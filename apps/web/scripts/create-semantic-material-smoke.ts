import crypto from "node:crypto";
import { classifyCreateInput } from "../src/features/create/inputClassification";
import { loadCreateExternalSource } from "../src/features/create/externalSourceIntake";
import { runCreateExternalSourceAnalysis } from "../src/features/create/externalSourceAnalysis";
import { buildCreateValidatedDocumentFollowup } from "../src/features/create/intelligentFollowupResults";

const sources = [
  {
    matrixCase: "political_program_html",
    locale: "de",
    minimumTopics: 3,
    url: "https://www.spd.de/leichte-sprache",
  },
  {
    matrixCase: "scientific_dossier_pdf",
    locale: "de",
    minimumTopics: 3,
    url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  },
  {
    matrixCase: "youtube_with_transcript",
    locale: "en",
    minimumTopics: 1,
    url: "https://www.youtube.com/watch?v=iWO5N3n1DXU",
  },
] as const;

const stopwords = new Set([
  "about",
  "andere",
  "document",
  "einer",
  "eines",
  "for",
  "from",
  "instrumente",
  "policy",
  "source",
  "the",
  "this",
  "und",
  "über",
]);

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function topicIsGrounded(sourceText: string, label: string, summary: string | null | undefined) {
  const source = normalize(sourceText);
  const tokens = normalize(`${label} ${summary ?? ""}`)
    .split(" ")
    .filter((token) => token.length >= 5 && !stopwords.has(token));
  return tokens.some((token) => source.includes(token) || source.includes(token.slice(0, 6)));
}

function safeErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/^[a-z0-9_]+$/i.test(message)) return message;
  const status = message.match(/\b(?:401|403|404|408|413|429|500|502|503|504)\b/)?.[0];
  return status ? `semantic_smoke_http_${status}` : "semantic_material_smoke_failed";
}

async function run() {
  const rows: Array<Record<string, unknown>> = [];
  let failed = false;

  for (const entry of sources) {
    const startedAt = Date.now();
    try {
      const source = await loadCreateExternalSource(entry.url);
      const analysisRun = await runCreateExternalSourceAnalysis({
        sourceUrl: entry.url,
        text: source.text,
        locale: entry.locale,
        pageCount: source.pageCount,
        documentTitle: source.documentTitle,
        documentType: source.documentType,
        additionalContext: "",
      });
      const result = buildCreateValidatedDocumentFollowup({
        text: entry.url,
        sourceUrl: entry.url,
        documentAnalysis: analysisRun.analysis,
      });
      const unsupportedTopics = analysisRun.analysis.topics
        .filter((topic) => !topicIsGrounded(source.text, topic.label, topic.summary))
        .map((topic) => topic.label);
      const evidenceReferences = result.meta?.analysis?.evidenceReferences ?? [];
      const passed =
        source.text.length >= 180 &&
        result.meta?.analysis?.sourceLoaded === true &&
        result.meta.analysis.state === "result_ready" &&
        analysisRun.analysis.topicCount >= entry.minimumTopics &&
        unsupportedTopics.length === 0 &&
        evidenceReferences.length === 1 &&
        evidenceReferences[0] === entry.url &&
        result.degraded === false;
      failed ||= !passed;

      rows.push({
        matrixCase: entry.matrixCase,
        url: entry.url,
        inputType: classifyCreateInput({ text: entry.url }),
        route: "/api/create/link-analysis shared source + semantic analysis contract",
        httpStatus: source.httpStatus,
        fetchOrTranscriptSucceeded: true,
        sourceType: result.meta?.analysis?.sourceType ?? null,
        sourceKind: source.sourceKind,
        sourceLoaded: result.meta?.analysis?.sourceLoaded ?? false,
        analysisState: result.meta?.analysis?.state ?? null,
        validatedTopicCount: analysisRun.analysis.topicCount,
        topics: analysisRun.analysis.topics.map((topic) => ({
          id: topic.id,
          label: topic.label,
          summary: topic.summary ?? null,
          keyStatementCount: topic.keyStatementCount ?? null,
          verifiableClaimCount: topic.verifiableClaimCount ?? null,
          policyProposalCount: topic.policyProposalCount ?? null,
        })),
        claimsOrStatements: result.understanding.statements.map((statement) => ({
          kind: statement.kind,
          stance: statement.stance,
          text: statement.text,
        })),
        evidenceReferences,
        originalSourcePreserved: analysisRun.analysis.sourceUrl === entry.url,
        unsupportedTopicLabels: unsupportedTopics,
        degraded: result.degraded,
        degradedReason: result.degradedReason,
        supportHandoff: false,
        providerAttempts: analysisRun.attempts,
        contentLength: source.text.length,
        contentHash: crypto.createHash("sha256").update(source.text).digest("hex"),
        semanticResultHash: crypto
          .createHash("sha256")
          .update(JSON.stringify(analysisRun.analysis))
          .digest("hex"),
        pageCount: source.pageCount,
        contentType: source.contentType,
        durationMs: Date.now() - startedAt,
        passed,
      });
    } catch (error) {
      failed = true;
      rows.push({
        matrixCase: entry.matrixCase,
        url: entry.url,
        inputType: classifyCreateInput({ text: entry.url }),
        route: "/api/create/link-analysis shared source + semantic analysis contract",
        fetchOrTranscriptSucceeded: false,
        sourceLoaded: false,
        analysisState: "fetch_failed",
        validatedTopicCount: 0,
        topics: [],
        claimsOrStatements: [],
        evidenceReferences: [entry.url],
        degraded: true,
        degradedReason: safeErrorCode(error),
        supportHandoff: false,
        providerAttempts: [],
        durationMs: Date.now() - startedAt,
        passed: false,
      });
    }
  }

  process.stdout.write(`${JSON.stringify({ exactHead: process.env.GIT_COMMIT ?? null, rows }, null, 2)}\n`);
  if (failed) process.exitCode = 1;
}

void run();
