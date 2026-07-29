import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import { buildCreateTechnicalFollowup } from "@/features/create/intelligentFollowupResults";
import { parseCreateIntent } from "@/features/create/intentFlows";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import {
  ensureCreateSupportTicket,
  type CreateSupportHandoffPublic,
} from "@/features/support/createSupportTickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readTextAlias(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const record = body as Record<string, unknown>;
  const value =
    typeof record.text === "string"
      ? record.text
      : typeof record.sourceText === "string"
        ? record.sourceText
        : typeof record.intakeText === "string"
          ? record.intakeText
          : typeof record.input === "string"
            ? record.input
            : "";
  return value.trim();
}

const RequestSchema = z.object({
  text: z.string().trim().min(1),
  locale: z.string().trim().optional().nullable(),
  anlassraumId: z.string().trim().optional().nullable(),
  dossierId: z.string().trim().optional().nullable(),
  intent: z.string().trim().optional().nullable(),
  correlationId: z.string().trim().min(8).max(160).optional().nullable(),
  draftId: z.string().trim().max(160).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const fallbackRequestId = crypto.randomUUID();
  const sessionUser = await getSessionUser(req).catch(() => null);
  const userId = sessionUser?._id?.toString() ?? null;
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "INVALID_JSON",
        message: "Die Anfrage konnte nicht gelesen werden.",
      },
      { status: 400 },
    );
  }

  try {
    const normalizedBody = {
      ...(rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>) : {}),
      text: readTextAlias(rawBody),
    };
    const parsed = RequestSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "TEXT_REQUIRED",
          message: "Bitte gib zuerst einen Text ein.",
        },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const requestId = body.correlationId ?? fallbackRequestId;
    const normalizedIntent = parseCreateIntent(body.intent ?? undefined);
    const operationType = "create_intelligent_followup_planner" as const;
    const operationId = requestId;
    const result = await buildCreateIntelligentFollowup({
      text: body.text,
      locale: body.locale ?? "de",
      requestId,
      operationId,
      operationType,
      userId,
      anlassraumId: body.anlassraumId ?? null,
      dossierId: body.dossierId ?? null,
      intent: normalizedIntent,
      maxSuggestions: 6,
    });
    const analysisState = result.meta?.analysis?.state ?? null;
    let supportHandoff: CreateSupportHandoffPublic | null = null;
    if (analysisState === "ai_failed" || analysisState === "fetch_failed") {
      const planner = result.meta?.planner ?? null;
      try {
        const ticket = await ensureCreateSupportTicket({
          affectedUserId: userId,
          orchestrationPhase: "intelligent_followup",
          correlationId: requestId,
          traceId: requestId,
          technicalErrorCode:
            analysisState === "fetch_failed"
              ? "CREATE_FETCH_FAILED"
              : "CREATE_AI_FAILED",
          provider: planner?.plannerDebug?.attemptedProvider ?? null,
          reason: planner?.degradedReason ?? analysisState,
          providerErrorCode: planner?.plannerDebug?.providerErrorCode ?? null,
          attemptCount: planner?.providerAttemptCount ?? 1,
          draftId: body.draftId ?? null,
          locale: body.locale ?? "de",
        });
        supportHandoff = {
          status: "created",
          ticket,
        };
      } catch {
        supportHandoff = {
          status: "failed",
          technicalReference: requestId,
          safeUserMessage:
            body.locale?.toLowerCase().startsWith("en")
              ? "Your contribution is saved. Please try again and use the technical reference if the problem persists."
              : "Dein Beitrag ist gespeichert. Bitte versuche es erneut und nutze die technische Fehlerreferenz, falls das Problem bestehen bleibt.",
        };
      }
    }

    return NextResponse.json({
      ok: true,
      result,
      supportHandoff,
      trace: {
        requestId,
        operationId,
        operationType,
        userScope: userId ? "present" : "missing_runtime_truth",
      },
    });
  } catch {
    const normalizedBody =
      rawBody && typeof rawBody === "object"
        ? (rawBody as Record<string, unknown>)
        : {};
    const sourceText = readTextAlias(rawBody);
    const locale =
      typeof normalizedBody.locale === "string" ? normalizedBody.locale : "de";
    const requestId =
      typeof normalizedBody.correlationId === "string" &&
      normalizedBody.correlationId.trim().length >= 8
        ? normalizedBody.correlationId.trim()
        : fallbackRequestId;
    let supportHandoff: CreateSupportHandoffPublic;
    try {
      const ticket = await ensureCreateSupportTicket({
        affectedUserId: userId,
        orchestrationPhase: "intelligent_followup",
        correlationId: requestId,
        traceId: requestId,
        technicalErrorCode: "CREATE_FOLLOWUP_FAILED",
        reason: "unhandled_orchestration_error",
        attemptCount: 1,
        draftId:
          typeof normalizedBody.draftId === "string"
            ? normalizedBody.draftId
            : null,
        locale,
      });
      supportHandoff = { status: "created", ticket };
    } catch {
      supportHandoff = {
        status: "failed",
        technicalReference: requestId,
        safeUserMessage: locale.toLowerCase().startsWith("en")
          ? "Your contribution is saved. Please try again and use the technical reference if the problem persists."
          : "Dein Beitrag ist gespeichert. Bitte versuche es erneut und nutze die technische Fehlerreferenz, falls das Problem bestehen bleibt.",
      };
    }
    return NextResponse.json({
      ok: true,
      result: buildCreateTechnicalFollowup({
        text: sourceText,
        analysisState: "ai_failed",
        sourceType: "text",
        sourceLoaded: true,
        userMessage:
          supportHandoff.status === "created"
            ? supportHandoff.ticket.safeUserMessage
            : supportHandoff.safeUserMessage,
      }),
      supportHandoff,
      trace: {
        requestId,
        operationId: requestId,
        operationType: "create_intelligent_followup_planner",
        userScope: userId ? "present" : "missing_runtime_truth",
      },
    });
  }
}
