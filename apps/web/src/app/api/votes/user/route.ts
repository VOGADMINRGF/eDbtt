import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerUser } from "@/lib/auth/getServerUser";
import { VoteModel } from "@/models/votes/Vote";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hmacUserHash(userId: string) {
  const pep = process.env.VOTE_HASH_PEPPER || "dev-pepper-change-me";
  return crypto.createHmac("sha256", pep).update(userId).digest("hex");
}

export async function GET(req: Request) {
  const user = await getServerUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  const { searchParams } = new URL(req.url);
  const statementId = searchParams.get("statementId") || "";
  if (!Types.ObjectId.isValid(statementId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_statementId" },
      { status: 400 },
    );
  }

  const Vote = await VoteModel();
  const userHash = hmacUserHash(String(user.id));

  const doc = await Vote.findOne({
    statementId: new Types.ObjectId(statementId),
    userHash,
    deletedAt: { $exists: false },
  }).lean();

  return NextResponse.json({ ok: true, vote: doc?.choice ?? null });
}
