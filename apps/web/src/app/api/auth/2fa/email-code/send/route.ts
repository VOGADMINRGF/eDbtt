import { NextRequest, NextResponse } from "next/server";
import { issueSetupEmailCode, type TwoFactorEmailCodeContext } from "../shared";

export const runtime = "nodejs";

type SendBody = {
  next?: string | null;
  context?: TwoFactorEmailCodeContext;
};

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("u_id")?.value ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const body = (await req.json().catch(() => ({}))) as SendBody;
  const context = body.context === "recovery" ? "recovery" : "setup";
  const result = await issueSetupEmailCode({
    userId,
    ip,
    context,
    next: body.next,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        retryAfterSeconds: result.retryAfterSeconds ?? null,
        message:
          result.error === "rate_limited"
            ? "Der Code konnte gerade nicht gesendet werden. Bitte versuche es gleich erneut."
            : undefined,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    expiresAt: result.expiresAt.toISOString(),
    retryAfterSeconds: 60,
    message: result.message,
  });
}
