import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCol } from "@core/db/triMongo";
import { piiCol } from "@core/db/triMongo";
import { mailFailureMetadata, sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import { buildVerificationMail } from "@/utils/emailTemplates";
import { mailLocaleFromUser } from "@/utils/mailRenderer";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email)
    return NextResponse.json({ error: "email_required" }, { status: 400 });

  const Users = await getCol("users");
  const user = await Users.findOne(
    { email: String(email).toLowerCase() },
    { projection: { _id: 1, email: 1, name: 1, profile: 1, settings: 1 } },
  );

  // Privacy: immer OK antworten
  if (!user) return NextResponse.json({ ok: true });

  const Tokens = await piiCol("tokens");
  const token = crypto.randomBytes(24).toString("base64url");
  const now = new Date();
  const exp = new Date(now.getTime() + 1000 * 60 * 60 * 48); // 48h

  await Tokens.insertOne({
    type: "verify_email",
    userId: user._id,
    email: user.email,
    token,
    createdAt: now,
    expiresAt: exp,
  });

  const base = publicOrigin();
  const verifyUrl = new URL(
    `/verify?email=${encodeURIComponent(user.email)}&token=${token}`,
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

  return NextResponse.json({
    ok: true,
    verifyUrl,
    delivery: { status: mailResult.status },
  });
}
