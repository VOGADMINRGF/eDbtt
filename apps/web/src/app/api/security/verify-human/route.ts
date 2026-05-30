// E200: Backend verification for HumanCheck puzzle + heuristics with rate limits.
import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { signHumanToken } from "@/lib/security/human-token";
import { validatePuzzleAnswer } from "@/lib/security/human-puzzle";
import { parseHumanPuzzleAnswer } from "@/lib/security/humanCheckContract";
import { incrementRateLimit } from "@/lib/security/rate-limit";

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes

function hashedClientKey(request: NextRequest, formId?: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 80) || "ua";
  const base = `${ip}:${agent}:${formId ?? "public"}`;
  return createHash("sha256").update(base).digest("hex");
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  const { honeypotValue = "", puzzleAnswer, puzzleSeed, timeToSolve, formId } = body ?? {};
  const rateKey = hashedClientKey(request, formId);
  const attempts = await incrementRateLimit(`human:${rateKey}`, RATE_LIMIT_WINDOW);
  if (attempts > RATE_LIMIT_MAX) {
    return NextResponse.json({ ok: false, code: "ratelimit" }, { status: 429 });
  }

  if (honeypotValue) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[verify-human] honeypot tripped", {
        formId: formId ?? "unknown",
      });
    }
    return NextResponse.json({ ok: false, verified: false, code: "honeypot" }, { status: 400 });
  }

  if (typeof puzzleSeed !== "string" || puzzleSeed.length < 8) {
    return NextResponse.json({ ok: false, verified: false, code: "puzzle" }, { status: 400 });
  }

  const normalizedAnswer = parseHumanPuzzleAnswer(puzzleAnswer);
  if (normalizedAnswer === null || !validatePuzzleAnswer(puzzleSeed, normalizedAnswer)) {
    return NextResponse.json({ ok: false, verified: false, code: "puzzle" }, { status: 400 });
  }

  const normalizedTimeToSolve =
    typeof timeToSolve === "number" && Number.isFinite(timeToSolve) && timeToSolve >= 0
      ? Math.floor(timeToSolve)
      : 0;

  let humanToken: string;
  try {
    humanToken = await signHumanToken({
      formId,
      timeToSolve: normalizedTimeToSolve,
      puzzleSeed,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "human_token_secret_not_configured") {
      return NextResponse.json({ ok: false, verified: false, code: "human_token_secret_not_configured" }, { status: 503 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true, verified: true, humanToken });
}
