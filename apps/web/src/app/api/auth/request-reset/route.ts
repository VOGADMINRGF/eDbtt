import { NextResponse } from "next/server";
import { ResetRequestSchema } from "@/utils/authSchemas";
import { coreCol } from "@core/db/triMongo";
import { createToken } from "@/utils/tokens";
import { resetEmailLink } from "@/utils/email";
import { buildPasswordResetMail } from "@/utils/emailTemplates";
import { mailLocaleFromUser } from "@/utils/mailRenderer";
import { mailFailureMetadata, sendMail } from "@/utils/mailer";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = ResetRequestSchema.parse(body);
  const email_lc = email.trim().toLowerCase();

  const rl = await rateLimitOrThrow(`reset:${email_lc}`, 3, 10 * 60_000);
  if (!rl.ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const users = await coreCol("users");
  const user = await users.findOne({ $or: [{ email: email_lc }, { email_lc }] });
  // immer 200 zurückgeben, um User-Enumeration zu vermeiden
  if (!user) return NextResponse.json({ ok: true });

  const token = await createToken(String(user._id), "reset", 60); // 60 Minuten
  const link = resetEmailLink(token);
  const mail = buildPasswordResetMail({
    resetUrl: link,
    displayName: user.profile?.displayName ?? user.name ?? null,
    locale: mailLocaleFromUser(user),
  });

  const mailResult = await sendMail({
    to: email_lc,
    mail,
    delivery: "required_delivery",
    tag: "password_reset",
  });
  if (!mailResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "mail_delivery_failed",
        delivery: mailFailureMetadata(mailResult),
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
