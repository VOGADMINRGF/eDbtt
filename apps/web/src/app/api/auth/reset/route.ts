import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ResetSetSchema } from "@/utils/authSchemas";
import { consumeToken } from "@/utils/tokens";
import { coreCol } from "@core/db/triMongo";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { token, password } = ResetSetSchema.parse(body);

  const uid = await consumeToken(token, "reset");
  if (!uid)
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 400 });

  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(password, rounds);

  const users = await coreCol("users");
  await users.updateOne(
    { _id: (await import("mongodb")).ObjectId.createFromHexString(uid) },
    { $set: { passwordHash } },
  );

  return NextResponse.json({ ok: true });
}
