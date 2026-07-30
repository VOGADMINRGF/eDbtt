import { NextRequest, NextResponse } from "next/server";
import { getCol, ObjectId } from "@core/db/triMongo";
import {
  createEmailVerificationToken,
  recordEmailVerificationDelivery,
} from "@core/auth/emailVerificationService";
import { sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import { buildVerificationMail } from "@/utils/emailTemplates";
import { mailLocaleFromUser } from "@/utils/mailRenderer";
import {
  beginPublicAuthMailControl,
  finishPublicAuthMailControl,
} from "@/utils/publicAuthMailControl";

const PUBLIC_VERIFY_RESPONSE = { ok: true } as const;

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email)
    return NextResponse.json({ error: "email_required" }, { status: 400 });

  const normalizedEmail = String(email).trim().toLowerCase();
  const control = await beginPublicAuthMailControl(
    req,
    "verify",
    normalizedEmail,
  );

  try {
    if (control.allowed) {
      const Users = await getCol("users");
      const user = await Users.findOne(
        { $or: [{ email: normalizedEmail }, { email_lc: normalizedEmail }] },
        { projection: { _id: 1, email: 1, name: 1, profile: 1, settings: 1 } },
      );

      if (user?._id instanceof ObjectId) {
        const { rawToken } = await createEmailVerificationToken(
          user._id,
          user.email,
        );

        const base = publicOrigin();
        const verifyUrl = new URL(
          `/register/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(rawToken)}`,
          base,
        ).toString();

        const mail = buildVerificationMail({
          verifyUrl,
          displayName: user.profile?.displayName ?? user.name ?? null,
          locale: mailLocaleFromUser(user),
        });

        const mailResult = await sendMail({
          to: user.email,
          mail,
          delivery: "required_delivery",
          tag: "verification_resend",
        });
        await recordEmailVerificationDelivery(user._id, rawToken, mailResult);
      }
    }
  } catch (error) {
    console.error("[auth.verify.resend] controlled_pipeline_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  }

  await finishPublicAuthMailControl(control);
  return NextResponse.json(PUBLIC_VERIFY_RESPONSE);
}
