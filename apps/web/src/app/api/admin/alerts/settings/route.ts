type SettingsDoc = { _id: "global"; alerts?: any; [k:string]: any }
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@core/db/triMongo";

async function isAdmin() {
  const c = await cookies();
  return c.get("u_role")?.value === "admin";
}

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = await getDb();
  const doc = await db.collection<SettingsDoc>("settings").findOne({ _id: "global" });
  const alerts = doc?.alerts ?? { enabled: true, recipients: [] };
  return NextResponse.json(alerts);
}

export async function POST(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const alerts = {
    enabled: !!body.enabled,
    recipients: Array.isArray(body.recipients)
      ? body.recipients.filter(
          (x: any) => typeof x === "string" && x.includes("@"),
        )
      : [],
  };
  const db = await getDb();
  await db
    .collection("settings")
    .updateOne({ _id: "global" } as any, { $set: { alerts } } as any, { upsert: true });
  return NextResponse.json({ ok: true });
}
