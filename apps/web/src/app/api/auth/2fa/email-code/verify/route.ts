import { NextRequest, NextResponse } from "next/server";
import {
  TWO_FACTOR_EMAIL_CODE_LENGTH,
  verifySetupEmailCode,
  type TwoFactorEmailCodeContext,
} from "../shared";

export const runtime = "nodejs";

type VerifyBody = {
  code?: string | number;
  next?: string | null;
  context?: TwoFactorEmailCodeContext;
};

export async function POST(req: NextRequest) {
  const userId = req.cookies.get("u_id")?.value ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const pendingId = req.cookies.get("pending_2fa")?.value ?? null;
  const body = (await req.json().catch(() => ({}))) as VerifyBody;
  const context = body.context === "recovery" ? "recovery" : "setup";
  const code =
    typeof body.code === "number" || typeof body.code === "string"
      ? String(body.code).replace(/\D+/g, "").slice(0, TWO_FACTOR_EMAIL_CODE_LENGTH)
      : "";

  if (code.length !== TWO_FACTOR_EMAIL_CODE_LENGTH) {
    return NextResponse.json({ ok: false, error: "code_required" }, { status: 400 });
  }

  const result = await verifySetupEmailCode({
    userId,
    ip,
    code,
    context,
    next: body.next,
    pendingId,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    redirectUrl: result.redirectUrl,
    message: "2fa_email_success",
  });
}
