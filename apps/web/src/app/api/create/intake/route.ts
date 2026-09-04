import { NextRequest, NextResponse } from "next/server";
import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import { evaluateCreateInputSafety } from "@/features/create/safety/createInputSafety";
import { CREATE_MAX_TEXT_LENGTH } from "@/features/create/createMutationSecurityContract";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";
import type { CreateIntent } from "@/features/create/intentFlows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ANONYMOUS_INTAKE_MAX_TEXT_LENGTH = Math.min(CREATE_MAX_TEXT_LENGTH, 6_000);
const ANONYMOUS_INTAKE_WINDOW_MS = 10 * 60 * 1000;
const ANONYMOUS_INTAKE_MAX_REQUESTS = 12;
const ALLOWED_INTENTS = new Set<CreateIntent>(["contribute", "check", "draft"]);

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

function safeLocale(value: unknown): string {
  if (typeof value !== "string") return "de";
  const normalized = value.trim().toLowerCase().replace("_", "-");
  return /^[a-z]{2}(?:-[a-z]{2})?$/.test(normalized) ? normalized : "de";
}

function safeIntent(value: unknown): CreateIntent {
  if (typeof value !== "string") return "contribute";
  return ALLOWED_INTENTS.has(value as CreateIntent) ? (value as CreateIntent) : "contribute";
}

function requestIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "local";
}

function safeSafetySummary(safety: ReturnType<typeof evaluateCreateInputSafety>) {
  return {
    decision: safety.decision,
    severity: safety.severity,
    requiresHumanReview: safety.requiresHumanReview,
    nextActions: safety.nextActions.slice(0, 4),
    noAutoPublish: true as const,
    noSilentMerge: true as const,
  };
}

/**
 * Public, read-only citizen intake.
 *
 * This is intentionally NOT a second Create runtime. It projects the same
 * canonical AI planner used by authenticated `/create`, but without draft,
 * handoff, ticket or publication mutations. Durable ownership begins only
 * after authentication.
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false, errorCode: "INVALID_JSON", message: "Ungültige Eingabe." }, 400);
  }

  const body = raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const locale = safeLocale(body.locale);
  const intent = safeIntent(body.intent);

  if (!text) {
    return json({ ok: false, errorCode: "TEXT_REQUIRED", message: "Bitte beschreibe kurz dein Anliegen." }, 400);
  }
  if (text.length > ANONYMOUS_INTAKE_MAX_TEXT_LENGTH) {
    return json(
      {
        ok: false,
        errorCode: "TEXT_TOO_LONG",
        message: `Für die erste Einordnung sind maximal ${ANONYMOUS_INTAKE_MAX_TEXT_LENGTH} Zeichen möglich.`,
      },
      413,
    );
  }

  const limit = await rateLimitOrThrow(
    `create:intake:ip:${requestIp(req)}`,
    ANONYMOUS_INTAKE_MAX_REQUESTS,
    ANONYMOUS_INTAKE_WINDOW_MS,
    { salt: "create-public-intake" },
  );
  if (!limit.ok) {
    return json(
      {
        ok: false,
        errorCode: "RATE_LIMITED",
        message: "Zu viele Einordnungen in kurzer Zeit. Bitte versuche es später erneut.",
        retryInMs: limit.retryIn,
      },
      429,
    );
  }

  const requestId = crypto.randomUUID();
  const safety = evaluateCreateInputSafety({
    text,
    locale,
    uiLocale: locale,
    sourceLanguage: locale,
    contentLanguage: locale,
    routeStage: "analyze",
    runId: requestId,
    correlationId: requestId,
  });

  if (safety.decision === "blocked" || safety.decision === "moderation_required") {
    return json(
      {
        ok: false,
        errorCode: "INTAKE_REVIEW_REQUIRED",
        message:
          locale.startsWith("en")
            ? "This contribution needs a safer framing before AI classification."
            : "Dieser Beitrag braucht vor der KI-Einordnung eine sichere Überarbeitung.",
        safety: safeSafetySummary(safety),
      },
      422,
    );
  }

  // The original citizen text remains in the browser guest workstate. PII that
  // can be safely removed is not forwarded to the model unnecessarily.
  const modelText = safety.redactedText.trim() || text;

  try {
    const result = await buildCreateIntelligentFollowup({
      text: modelText,
      locale,
      intent,
      userId: null,
      requestId,
      operationId: requestId,
      operationType: "create_anonymous_ai_intake",
      organizationId: null,
      anlassraumId: null,
      dossierId: null,
      maxSuggestions: 6,
    });

    return json({
      ok: true,
      result,
      safety: safeSafetySummary(safety),
      meta: {
        mode: "anonymous_ai_micro_pass",
        requestId,
        persisted: false,
        accountRequired: false,
        inputRedactedForAi: modelText !== text,
        deepSearchUsed: false,
        researchUsed: "none",
        noAutoPublish: true,
        noSilentMerge: true,
        ownershipBoundary: "authenticate_before_durable_write",
      },
    });
  } catch {
    return json(
      {
        ok: false,
        errorCode: "AI_INTAKE_UNAVAILABLE",
        message:
          locale.startsWith("en")
            ? "I couldn’t complete the classification just now. Your text stays in this browser so you can try again."
            : "Ich konnte die Einordnung gerade nicht abschließen. Dein Text bleibt in diesem Browser erhalten und du kannst es erneut versuchen.",
        retryable: true,
        meta: {
          mode: "anonymous_ai_micro_pass",
          persisted: false,
          noAutoPublish: true,
          noSilentMerge: true,
        },
      },
      503,
    );
  }
}
