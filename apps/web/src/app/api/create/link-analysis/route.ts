import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCreateTechnicalFollowup,
  buildCreateValidatedDocumentFollowup,
} from "@/features/create/intelligentFollowupResults";
import {
  CreateExternalAnalysisError,
  runCreateExternalSourceAnalysis,
  type CreateExternalAnalysisRun,
} from "@/features/create/externalSourceAnalysis";
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
import {
  isCreateYoutubeUrl,
  loadCreateExternalSource,
} from "@/features/create/externalSourceIntake";

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
    providerAttempts?: CreateExternalAnalysisRun["attempts"];
    transcriptStatus?: string;
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
        attemptCount: input.providerAttempts?.length ?? 0,
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
      trace: {
        correlationId,
        source: {
          adapter: isCreateYoutubeUrl(body.url) ? "youtube_transcript" : "external_fetch",
          transcriptStatus:
            isCreateYoutubeUrl(body.url) && !input.sourceLoaded
              ? input.transcriptStatus ?? "unavailable"
              : "not_applicable",
          transcriptSegmentCount: isCreateYoutubeUrl(body.url) ? 0 : null,
        },
        providerAttempts: (input.providerAttempts ?? []).map((attempt) => ({
          provider: "openai" as const,
          model: attempt.model,
          resultCode: attempt.status,
          durationMs: attempt.durationMs,
        })),
      },
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
      const { analysis, attempts } = await runCreateExternalSourceAnalysis({
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
        trace: {
          correlationId,
          source: {
            adapter: source.sourceKind,
            httpStatus: source.httpStatus,
            transcriptStatus:
              source.sourceKind === "youtube_transcript" ? "available" : "not_applicable",
            transcriptSegmentCount: source.transcriptSegmentCount,
          },
          providerAttempts: attempts.map((attempt) => ({
            provider: "openai" as const,
            model: attempt.model,
            resultCode: attempt.status,
            durationMs: attempt.durationMs,
          })),
        },
      });
    } catch (error) {
      const providerAttempts =
        error instanceof CreateExternalAnalysisError ? error.attempts : [];
      return buildFailureResponse({
        analysisState: "ai_failed",
        sourceType: "document",
        sourceLoaded: true,
        technicalErrorCode: "CREATE_LINK_AI_FAILED",
        reason:
          error instanceof CreateExternalAnalysisError
            ? error.message
            : "document_analysis_failed",
        providerAttempts,
      });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "source_fetch_failed";
    const youtubeTranscriptFailure =
      isCreateYoutubeUrl(body.url) && reason.startsWith("youtube_transcript_");
    const transcriptStatus = youtubeTranscriptFailure
      ? reason.slice("youtube_transcript_".length)
      : undefined;
    const transcriptErrorCode = transcriptStatus?.toUpperCase() ?? "FETCH_FAILED";
    return buildFailureResponse({
      analysisState: "fetch_failed",
      sourceType: youtubeTranscriptFailure ? "document" : "link",
      sourceLoaded: false,
      technicalErrorCode: youtubeTranscriptFailure
        ? `CREATE_YOUTUBE_TRANSCRIPT_${transcriptErrorCode}`
        : "CREATE_LINK_FETCH_FAILED",
      reason: youtubeTranscriptFailure ? reason : "source_fetch_failed",
      transcriptStatus,
    });
  }
}
