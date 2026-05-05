import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import { parseCreateIntent } from "@/features/create/intentFlows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  text: z.string().trim().min(1),
  locale: z.string().trim().optional(),
  anlassraumId: z.string().trim().optional(),
  dossierId: z.string().trim().optional(),
  intent: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "BAD_INPUT",
          message: "text_missing_or_invalid",
        },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const normalizedIntent = parseCreateIntent(body.intent ?? undefined);
    const result = await buildCreateIntelligentFollowup({
      text: body.text,
      locale: body.locale ?? "de",
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
