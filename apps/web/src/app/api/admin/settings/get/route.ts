type SettingsDoc = { _id: "global"; alerts?: any; [k:string]: any }
// apps/web/src/app/api/admin/settings/get/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@core/db/triMongo";

async function isAdmin() {
  const c = await cookies();
  return c.get("u_role")?.value === "admin";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const doc = await db.collection<SettingsDoc>("settings").findOne({ _id: "global" });
  const settings = doc?.onboardingFlags ?? DEFAULTS;
  return NextResponse.json({ settings });
}
