import { NextResponse } from "next/server";
import { ResetRequestSchema } from "@/utils/authSchemas";
import { coreCol } from "@core/db/triMongo";
import { createToken, recordTokenDelivery } from "@/utils/tokens";
import { resetEmailLink } from "@/utils/email";
import { buildPasswordResetMail } from "@/utils/emailTemplates";
import { mailLocaleFromUser } from "@/utils/mailRenderer";
import { sendMail } from "@/utils/mailer";
import {
  beginPublicAuthMailControl,
  finishPublicAuthMailControl,
} from "@/utils/publicAuthMailControl";

export const runtime = "nodejs";

const PUBLIC_RESET_RESPONSE = { ok: true } as const;

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = ResetRequestSchema.parse(body);
  const email_lc = email.trim().toLowerCase();
  const control = await beginPublicAuthMailControl(req, "reset", email_lc);

  try {
    if (control.allowed) {
      const users = await coreCol("users");
      const user = await users.findOne({ $or: [{ email: email_lc }, { email_lc }] });
      if (user) {
        const token = await createToken(String(user._id), "reset", 60);
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
        await recordTokenDelivery(String(user._id), "reset", token, mailResult);
      }
    }
  } catch (error) {
    console.error("[auth.request-reset] controlled_pipeline_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  }

  await finishPublicAuthMailControl(control);
  return NextResponse.json(PUBLIC_RESET_RESPONSE);
}
