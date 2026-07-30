import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol, piiCol } from "@core/db/db/triMongo";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { mailFailureMetadata, sendMail } from "@/utils/mailer";
import { buildIdentityEmailCodeMail } from "@/utils/emailTemplates";
import { incrementRateLimit } from "@/lib/security/rate-limit";
import { CREDENTIAL_COLLECTION, sha256 } from "../../../sharedAuth";
import { mailLocaleFromUser } from "@/utils/mailRenderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 4;
const RATE_LIMIT_WINDOW = 15 * 60;
const CODE_TTL_MINUTES = 10;

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?._id || !user.email) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const attempts = await incrementRateLimit(`identity_email_code:${String(user._id)}`, RATE_LIMIT_WINDOW);
  if (attempts > RATE_LIMIT_MAX) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const Users = await coreCol("users");
  const dbUser = await Users.findOne(
    { _id: user._id },
    {
      projection: {
        verifiedEmail: 1,
        emailVerified: 1,
        email: 1,
        profile: 1,
        settings: 1,
      },
    },
  );
  if (!dbUser || !(dbUser.verifiedEmail || dbUser.emailVerified)) {
    return NextResponse.json({ ok: false, error: "email_not_verified" }, { status: 403 });
  }

  const credsCol = await piiCol(CREDENTIAL_COLLECTION);
  const creds = await credsCol.findOne({ coreUserId: user._id }, { projection: { _id: 1 } });
  if (!creds) {
    return NextResponse.json({ ok: false, error: "credentials_missing" }, { status: 400 });
  }

  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

  await credsCol.updateOne(
    { _id: creds._id },
    {
      $set: {
        identityEmailCodeHash: sha256(code),
        identityEmailCodeExpiresAt: expiresAt,
        identityEmailCodeAttempts: 0,
        identityEmailCodeSentAt: now,
        updatedAt: now,
      },
    },
  );

  const mail = buildIdentityEmailCodeMail({
    code,
    locale: mailLocaleFromUser(dbUser),
  });
  const mailResult = await sendMail({
    to: user.email,
    mail,
    delivery: "required_delivery",
    tag: "identity_email_code",
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
    expiresAt: expiresAt.toISOString(),
    delivery: { status: mailResult.status },
  });
}
