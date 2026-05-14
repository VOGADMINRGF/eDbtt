import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { coreCol, piiCol, ObjectId } from "@core/db/triMongo";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";
import { buildTwoFactorCodeMail } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/mailer";
import { isDemoUser } from "@/lib/demo/demoAccess";
import {
  CREDENTIAL_COLLECTION,
  CoreUserAuthSnapshot,
  PiiUserCredentials,
  TWO_FA_COLLECTION,
  TWO_FA_WINDOW_MS,
  TwoFactorChallengeDoc,
  clearPendingTwoFactorCookie,
  setPendingTwoFactorCookie,
  sha256,
} from "../../sharedAuth";

export const runtime = "nodejs";

function getDemoCode() {
  const raw = (process.env.VOG_DEMO_2FA_CODE || "").trim();
  if (/^\d{6}$/.test(raw)) return raw;
  return "123456";
}

export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
    const ipLimit = await rateLimitOrThrow(`2fa:email:ip:${ip}`, 8, TWO_FA_WINDOW_MS, {
      salt: "auth",
    });
    if (!ipLimit.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const pendingId = req.cookies.get("pending_2fa")?.value;
    if (!pendingId || !ObjectId.isValid(pendingId)) {
      return NextResponse.json({ error: "challenge_missing" }, { status: 400 });
    }

    const challenges = await piiCol<TwoFactorChallengeDoc>(TWO_FA_COLLECTION);
    const existing = await challenges.findOne({ _id: new ObjectId(pendingId) });
    if (!existing) {
      await clearPendingTwoFactorCookie();
      return NextResponse.json({ error: "challenge_missing" }, { status: 400 });
    }
    if (existing.method !== "email") {
      return NextResponse.json({ error: "email_fallback_disabled" }, { status: 409 });
    }

    const userLimit = await rateLimitOrThrow(
      `2fa:email:user:${String(existing.userId)}`,
      5,
      TWO_FA_WINDOW_MS,
      { salt: "auth-user" },
    );
    if (!userLimit.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const users = await coreCol<CoreUserAuthSnapshot>("users");
    const creds = await piiCol<PiiUserCredentials>(CREDENTIAL_COLLECTION);
    const user = await users.findOne({ _id: existing.userId });
    const credentials = await creds.findOne({ coreUserId: existing.userId });
    const email = credentials?.email || user?.email;

    if (!user) {
      await clearPendingTwoFactorCookie();
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (!email) {
      return NextResponse.json({ error: "email_missing" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TWO_FA_WINDOW_MS);
    const demo = isDemoUser({ _id: existing.userId, email });
    const code = demo ? getDemoCode() : crypto.randomInt(100000, 999999).toString();
    const challenge: TwoFactorChallengeDoc = {
      userId: existing.userId,
      method: "email",
      createdAt: now,
      expiresAt,
      attempts: 0,
      codeHash: sha256(code),
    };

    const { insertedId } = await challenges.insertOne(challenge);
    await setPendingTwoFactorCookie(String(insertedId));

    await challenges.updateOne(
      { _id: existing._id },
      { $set: { supersededAt: now, status: "superseded" } },
    );

    const mail = buildTwoFactorCodeMail({ code });
    await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });

    return NextResponse.json({
      ok: true,
      method: "email",
      expiresAt: expiresAt.toISOString(),
    });
  } catch {
    console.error("[2fa.request-email] failed");
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
