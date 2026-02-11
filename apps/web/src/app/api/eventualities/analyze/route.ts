import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@features/analyze/analyzeContribution";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";
import { parseAnalyzeRequestBody } from "../../contributions/analyze/parseAnalyzeRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MAX_CLAIMS = 10;

function sanitizeLocale(locale?: string): string {
  if (typeof locale === "string" && locale.trim()) {
    return locale.trim();
  }
  return "de";
}

function sanitizeMaxClaims(maxClaims?: number): number {
  if (typeof maxClaims === "number" && Number.isFinite(maxClaims) && maxClaims > 0) {
    return Math.min(50, Math.max(1, Math.floor(maxClaims)));
  }
  return DEFAULT_MAX_CLAIMS;
}

export async function POST(req: NextRequest): Promise<Response> {
  if (process.env.ANALYZE_ENABLED !== "true") {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "Analyse derzeit deaktiviert.",
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, errorCode: "INVALID_JSON", message: "Ungueltiger JSON-Body." },
      { status: 400 },
    );
  }

  const parsed = parseAnalyzeRequestBody(rawBody);
  if (parsed.ok === false) {
    return NextResponse.json(
      { ok: false, errorCode: "BAD_INPUT", message: parsed.error.message, issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const body = parsed.value;
  if (body.test === "ping") {
    return NextResponse.json({ ok: true, result: { ping: "pong" } });
  }

  const locale = sanitizeLocale(body.locale);
  const maxClaims = sanitizeMaxClaims(body.maxClaims);
  const text = body.text?.trim() || "";
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();

  const rl = await rateLimitOrThrow(`eventualities:ip:${ip}`, 10, 10 * 60 * 1000, {
    salt: "eventualities",
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, errorCode: "RATE_LIMITED", message: "Too many analyze requests. Please retry later." },
      { status: 429 },
    );
  }

  try {
    const result = await analyzeContribution({
      text,
      locale,
      maxClaims,
    });

    return NextResponse.json({
      ok: true,
      eventualities: result.eventualities ?? [],
      decisionTrees: result.decisionTrees ?? [],
      meta: {
        locale: result.language ?? locale,
        runReceipt: result.runReceipt ?? null,
      },
    });
  } catch (error: any) {
    const code = error?.code ?? "ANALYZE_FAILED";
    return NextResponse.json(
      { ok: false, errorCode: code, message: "Eventualities analyze failed." },
      { status: 500 },
    );
  }
}
