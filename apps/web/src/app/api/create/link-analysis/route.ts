import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenAIJson } from "@features/ai";
import {
  buildCreateTechnicalFollowup,
  buildCreateValidatedDocumentFollowup,
} from "@/features/create/intelligentFollowupResults";
import { resolveCreatePlannerModelCandidates } from "@/features/create/createPlanner";
import type { DocumentAnalysisSummary } from "@/features/create/intelligentFollowupContract";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import {
  enforceCreateMutationSecurity,
  verifyCreateDraftBinding,
} from "@/features/create/createRouteSecurity";
import {
  CREATE_MAX_CONTEXT_LENGTH,
  CREATE_MAX_TEXT_LENGTH,
  CREATE_MAX_URL_LENGTH,
} from "@/features/create/createMutationSecurityContract";
import {
  ensureCreateSupportTicket,
  type CreateSupportHandoffPublic,
} from "@/features/support/createSupportTickets";
import { loadCreateExternalSource } from "@/features/create/externalSourceIntake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  text: z.string().trim().min(1).max(CREATE_MAX_TEXT_LENGTH),
  url: z.string().trim().url().max(CREATE_MAX_URL_LENGTH),
  locale: z.string().trim().max(10).optional().nullable(),
  additionalContext: z.string().trim().max(CREATE_MAX_CONTEXT_LENGTH).optional().nullable(),
  correlationId: z.string().trim().min(8).max(160).optional().nullable(),
  draftId: z.string().trim().min(1).max(160),
});

const DocumentTopicSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  subtopicCount: z.number().int().nonnegative().nullable().optional(),
  keyStatementCount: z.number().int().nonnegative().nullable().optional(),
  verifiableClaimCount: z.number().int().nonnegative().nullable().optional(),
  policyProposalCount: z.number().int().nonnegative().nullable().optional(),
  summary: z.string().trim().nullable().optional(),
});

const DocumentAnalysisSchema = z.object({
  documentTitle: z.string().trim().nullable(),
  documentType: z.enum(["party_program", "law", "study", "report", "article", "unknown"]),
  pageCount: z.number().int().positive().nullable(),
  wordCount: z.number().int().positive().nullable(),
  topicCount: z.number().int().nonnegative(),
  subtopicCount: z.number().int().nonnegative(),
  keyStatementCount: z.number().int().nonnegative(),
  verifiableClaimCount: z.number().int().nonnegative(),
  policyProposalCount: z.number().int().nonnegative(),
  subjectBreadth: z.enum(["narrow", "medium", "broad", "very_broad"]),
  subjectDepth: z.enum(["low", "medium", "high", "mixed"]),
  balanceAssessment: z.enum(["balanced", "mostly_balanced", "programmatic", "one_sided", "unclear"]),
  sourceSpecificity: z.enum(["specific", "partly_specific", "mostly_unspecific", "none", "unclear"]),
  sourceVerificationStatus: z.enum(["not_started", "prepared", "in_review", "completed"]),
  counterpositionCoverage: z.enum(["strong", "partial", "weak", "none", "unclear"]),
  summary: z.string().trim().min(1),
  topics: z.array(DocumentTopicSchema).min(1),
});

function isModelNotFoundError(error: unknown): boolean {
  const errorObject = error as {
    status?: number;
    message?: string;
    meta?: { code?: string; status?: number };
  } | null;
  const message = error instanceof Error ? error.message : String(errorObject?.message ?? "");
  return (
    errorObject?.status === 404 ||
    errorObject?.meta?.status === 404 ||
    errorObject?.meta?.code === "MODEL_NOT_FOUND" ||
    (/model/i.test(message) && /404|not found/i.test(message))
  );
}

async function runDocumentAnalysis(params: {
  sourceUrl: string;
  text: string;
  locale: string;
  pageCount: number | null;
  documentTitle: string | null;
  documentType: DocumentAnalysisSummary["documentType"];
  additionalContext: string;
}): Promise<DocumentAnalysisSummary> {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "documentTitle",
      "documentType",
      "pageCount",
      "wordCount",
      "topicCount",
      "subtopicCount",
      "keyStatementCount",
      "verifiableClaimCount",
      "policyProposalCount",
      "subjectBreadth",
      "subjectDepth",
      "balanceAssessment",
      "sourceSpecificity",
      "sourceVerificationStatus",
      "counterpositionCoverage",
      "summary",
      "topics",
    ],
    properties: {
      documentTitle: { type: ["string", "null"] },
      documentType: { type: "string", enum: ["party_program", "law", "study", "report", "article", "unknown"] },
      pageCount: { type: ["integer", "null"] },
      wordCount: { type: ["integer", "null"] },
      topicCount: { type: "integer" },
      subtopicCount: { type: "integer" },
      keyStatementCount: { type: "integer" },
      verifiableClaimCount: { type: "integer" },
      policyProposalCount: { type: "integer" },
      subjectBreadth: { type: "string", enum: ["narrow", "medium", "broad", "very_broad"] },
      subjectDepth: { type: "string", enum: ["low", "medium", "high", "mixed"] },
      balanceAssessment: { type: "string", enum: ["balanced", "mostly_balanced", "programmatic", "one_sided", "unclear"] },
      sourceSpecificity: { type: "string", enum: ["specific", "partly_specific", "mostly_unspecific", "none", "unclear"] },
      sourceVerificationStatus: { type: "string", enum: ["not_started", "prepared", "in_review", "completed"] },
      counterpositionCoverage: { type: "string", enum: ["strong", "partial", "weak", "none", "unclear"] },
      summary: { type: "string" },
      topics: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "label", "subtopicCount", "keyStatementCount", "verifiableClaimCount", "policyProposalCount", "summary"],
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            subtopicCount: { type: ["integer", "null"] },
            keyStatementCount: { type: ["integer", "null"] },
            verifiableClaimCount: { type: ["integer", "null"] },
            policyProposalCount: { type: ["integer", "null"] },
            summary: { type: ["string", "null"] },
          },
        },
      },
    },
  } as const;

  const system = [
    "Du analysierst verlinkte Dokumente oder Artikel für den nicht-mutativen /create-Linkpfad von eDebatte.",
    "Nutze nur den tatsächlich extrahierten Quellinhalt.",
    "Erfinde keine Zahlen, Themen oder Seiten.",
    "Wenn pageCount technisch vorgegeben ist, übernimm genau diesen Wert.",
    "sourceVerificationStatus ist hier immer not_started.",
    "Bewerte nur fachliche Ausarbeitung, Konkretheit, Quellenlage, Gegenpositionsabdeckung und Überprüfbarkeit.",
    "Gib strikt JSON zurück.",
  ].join("\n");

  const user = [
    `Locale: ${params.locale || "de"}`,
    `Source URL: ${params.sourceUrl}`,
    `Document title hint: ${params.documentTitle ?? "unknown"}`,
    `Document type hint: ${params.documentType}`,
    `Technically detected page count: ${params.pageCount ?? "null"}`,
    params.additionalContext ? `Additional user context: ${params.additionalContext}` : "",
    "",
    "Extrahierter Quellinhalt:",
    params.text.slice(0, 24_000),
  ]
    .filter(Boolean)
    .join("\n");
  const analysisModels = resolveCreatePlannerModelCandidates().slice(0, 2);
  if (analysisModels.length === 0) {
    throw new Error("create_link_analysis_model_missing");
  }

  let response: Awaited<ReturnType<typeof callOpenAIJson>> | null = null;
  let lastError: unknown = null;
  for (const analysisModel of analysisModels) {
    try {
      response = await callOpenAIJson({
        system,
        user,
        model: analysisModel,
        temperature: 0.1,
        max_tokens: 2_000,
        response_format: {
          name: "create_document_analysis",
          schema,
          strict: true,
        },
      });
      break;
    } catch (error) {
      lastError = error;
      if (!isModelNotFoundError(error) || analysisModel === analysisModels[analysisModels.length - 1]) {
        throw error;
      }
    }
  }
  if (!response) {
    throw lastError instanceof Error ? lastError : new Error("create_link_analysis_failed");
  }

  const parsed = DocumentAnalysisSchema.parse(JSON.parse(response.text));
  return {
    sourceUrl: params.sourceUrl,
    documentTitle: parsed.documentTitle ?? params.documentTitle,
    documentType: parsed.documentType,
    pageCount: params.pageCount ?? parsed.pageCount,
    wordCount: parsed.wordCount ?? params.text.split(/\s+/).filter(Boolean).length,
    topicCount: parsed.topicCount,
    subtopicCount: parsed.subtopicCount,
    keyStatementCount: parsed.keyStatementCount,
    verifiableClaimCount: parsed.verifiableClaimCount,
    policyProposalCount: parsed.policyProposalCount,
    subjectBreadth: parsed.subjectBreadth,
    subjectDepth: parsed.subjectDepth,
    balanceAssessment: parsed.balanceAssessment,
    sourceSpecificity: parsed.sourceSpecificity,
    sourceVerificationStatus: "not_started",
    counterpositionCoverage: parsed.counterpositionCoverage,
    summary: parsed.summary,
    topics: parsed.topics,
  };
}

export async function POST(req: NextRequest) {
  const fallbackCorrelationId = crypto.randomUUID();
  const sessionUser = await getSessionUser(req).catch(() => null);
  const userId = sessionUser?._id?.toString() ?? null;
  if (!sessionUser?.sessionValid || !userId) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "CREATE_REQUEST_NOT_ALLOWED",
      },
      { status: 401 },
    );
  }
  const securityFailure = await enforceCreateMutationSecurity({
    req,
    scope: "create_link_analysis",
    actorKey: `user:${userId}`,
  });
  if (securityFailure) return securityFailure;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "INVALID_JSON",
      },
      { status: 400 },
    );
  }

  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "INVALID_INPUT",
      },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const draftBinding = await verifyCreateDraftBinding({
    draftId: body.draftId,
    userId,
    text: body.text,
    locale: body.locale,
  });
  if (!draftBinding) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "CREATE_REQUEST_NOT_ALLOWED",
      },
      { status: 403 },
    );
  }
  const correlationId = body.correlationId ?? fallbackCorrelationId;
  const buildFailureResponse = async (input: {
    analysisState: "ai_failed" | "fetch_failed";
    sourceType: "link" | "document";
    sourceLoaded: boolean;
    technicalErrorCode: string;
    reason: string;
  }) => {
    let supportHandoff: CreateSupportHandoffPublic;
    try {
      const ticket = await ensureCreateSupportTicket({
        affectedUserId: userId,
        orchestrationPhase: "link_analysis",
        correlationId,
        traceId: correlationId,
        technicalErrorCode: input.technicalErrorCode,
        provider: input.analysisState === "ai_failed" ? "openai" : null,
        reason: input.reason,
        attemptCount: 1,
        draftId: draftBinding.draftId,
        locale: body.locale ?? "de",
      });
      supportHandoff = { status: "created", ticket };
    } catch {
      supportHandoff = {
        status: "failed",
        technicalReference: correlationId,
        safeUserMessage:
          body.locale?.toLowerCase().startsWith("en")
            ? "Your contribution is saved. Please try again and use the technical reference if the problem persists."
            : "Dein Beitrag ist gespeichert. Bitte versuche es erneut und nutze die technische Fehlerreferenz, falls das Problem bestehen bleibt.",
      };
    }
    return NextResponse.json({
      ok: true,
      result: buildCreateTechnicalFollowup({
        text: body.text,
        analysisState: input.analysisState,
        sourceType: input.sourceType,
        sourceUrl: body.url,
        sourceLoaded: input.sourceLoaded,
        userMessage:
          supportHandoff.status === "created"
            ? supportHandoff.ticket.safeUserMessage
            : supportHandoff.safeUserMessage,
      }),
      supportHandoff,
      trace: { correlationId },
    });
  };

  try {
    const source = await loadCreateExternalSource(body.url);
    if (source.text.trim().length < 180) {
      return buildFailureResponse({
        analysisState: "fetch_failed",
        sourceType: source.sourceKind === "html" ? "link" : "document",
        sourceLoaded: false,
        technicalErrorCode: "CREATE_LINK_CONTENT_INCOMPLETE",
        reason: "source_content_too_short",
      });
    }

    try {
      const analysis = await runDocumentAnalysis({
        sourceUrl: body.url,
        text: source.text,
        locale: body.locale ?? "de",
        pageCount: source.pageCount,
        documentTitle: source.documentTitle,
        documentType: source.documentType,
        additionalContext: body.additionalContext ?? "",
      });

      return NextResponse.json({
        ok: true,
        result: buildCreateValidatedDocumentFollowup({
          text: body.text,
          sourceUrl: body.url,
          documentAnalysis: analysis,
        }),
        supportHandoff: null,
        trace: { correlationId },
      });
    } catch {
      return buildFailureResponse({
        analysisState: "ai_failed",
        sourceType: "document",
        sourceLoaded: true,
        technicalErrorCode: "CREATE_LINK_AI_FAILED",
        reason: "document_analysis_failed",
      });
    }
  } catch {
    return buildFailureResponse({
      analysisState: "fetch_failed",
      sourceType: "link",
      sourceLoaded: false,
      technicalErrorCode: "CREATE_LINK_FETCH_FAILED",
      reason: "source_fetch_failed",
    });
  }
}
