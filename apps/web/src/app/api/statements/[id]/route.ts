export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";
import { ObjectId } from "mongodb";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const doc = await db
    .collection("statements")
    .findOne({ _id: new ObjectId(params.id) });
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { _id, ...rest } = doc;
  return NextResponse.json({ id: String(_id), ...rest });
}
