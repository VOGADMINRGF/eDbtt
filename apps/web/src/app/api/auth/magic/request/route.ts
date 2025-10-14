import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCol } from "@core/db/triMongo";
import { piiCol } from "@core/db/triMongo";
import { sendMail } from "@/utils/mailer";

export async function POST(req: NextRequest) {
  const { email, next } = await req.json().catch(() => ({}));
  if (!email)
    return NextResponse.json({ error: "email_required" }, { status: 400 });

  const Users = await getCol("users");
  const u = await Users.findOne(
    { email: String(email).toLowerCase() },
    { projection: { _id: 1, email: 1 } },
  );

  // Privacy: immer OK
  if (!u) return NextResponse.json({ ok: true });

  const Tokens = await piiCol("tokens");
  const token = crypto.randomBytes(24).toString("base64url");
  const now = new Date();
  const exp = new Date(now.getTime() + 1000 * 60 * 15); // 15min

  await Tokens.insertOne({
    type: "magic_login",
    userId: u._id,
    email: u.email,
    token,
    createdAt: now,
    expiresAt: exp,
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const url = new URL(
    `/api/auth/magic/consume?email=${encodeURIComponent(u.email)}&token=${token}`,
    base,
  );
  if (typeof next === "string" && next) url.searchParams.set("next", next);

  await sendMail({
    to: u.email,
    subject: "Dein Magic-Login",
    html: `<p>Hallo,</p><p>klicke zum Einloggen:</p><p><a href="${url.toString()}">${url.toString()}</a></p><p>Der Link ist 15 Minuten gültig.</p>`,
  });

  return NextResponse.json({ ok: true });
}
