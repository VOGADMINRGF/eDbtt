import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import { parseCreateIntent } from "@/features/create/intentFlows";

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
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const userId = req.cookies.get("u_id")?.value ?? null;
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
    const normalizedIntent = parseCreateIntent(body.intent ?? undefined);
    const result = await buildCreateIntelligentFollowup({
      text: body.text,
      locale: body.locale ?? "de",
      requestId,
      operationId: requestId,
      operationType: "create_intelligent_followup_planner",
      userId,
      anlassraumId: body.anlassraumId ?? null,
      dossierId: body.dossierId ?? null,
      intent: normalizedIntent,
      maxSuggestions: 6,
    });

    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "CREATE_FOLLOWUP_FAILED",
        message: "create_intelligent_followup_failed",
      },
      { status: 500 },
    );
  }
}
