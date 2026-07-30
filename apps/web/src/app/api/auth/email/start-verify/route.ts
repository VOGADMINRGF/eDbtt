import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCol, ObjectId } from "@core/db/triMongo";
import {
  createEmailVerificationToken,
  recordEmailVerificationDelivery,
} from "@core/auth/emailVerificationService";
import { logIdentityEvent } from "@core/telemetry/identityEvents";
import { sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import { buildVerificationMail } from "@/utils/emailTemplates";
import { mailLocaleFromUser } from "@/utils/mailRenderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
});

const PUBLIC_VERIFY_RESPONSE = { ok: true } as const;

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const Users = await getCol("users");
  const user = await Users.findOne(
    { email },
    {
      projection: {
        _id: 1,
        emailVerified: 1,
        verifiedEmail: 1,
        name: 1,
        profile: 1,
        settings: 1,
      },
    },
  );

  if (user?._id instanceof ObjectId) {
    const { rawToken } = await createEmailVerificationToken(user._id, email);
    await logIdentityEvent("identity_email_verify_start", {
      userId: String(user._id),
      meta: { email },
    });
    const origin = publicOrigin();
    const verifyUrl = `${origin.replace(/\/$/, "")}/register/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;
    const mail = buildVerificationMail({
      verifyUrl,
      displayName: (user.profile?.displayName || user.name) ?? null,
      locale: mailLocaleFromUser(user),
    });
    const mailResult = await sendMail({
      to: email,
      mail,
      delivery: "required_delivery",
      tag: "verification_start",
    });
    await recordEmailVerificationDelivery(user._id, rawToken, mailResult);
  }

  return NextResponse.json(PUBLIC_VERIFY_RESPONSE);
}
