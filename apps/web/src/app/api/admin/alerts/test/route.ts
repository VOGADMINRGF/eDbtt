type SettingsDoc = { _id: "global"; alerts?: any; [k:string]: any }
// apps/web/src/app/api/admin/alerts/test/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@core/db/triMongo";
import { sendAlertEmail } from "@/utils/email";

async function isAdmin() {
  const c = await cookies();
  return c.get("u_role")?.value === "admin";
}

export async function POST() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = await getDb();
  const doc = await db.collection<SettingsDoc>("settings").findOne({ _id: "global" });
  const cfg = doc?.alerts ?? { enabled: true, recipients: [] };

  if (!cfg.enabled)
    return NextResponse.json({ skipped: true, reason: "alerts disabled" });
  if (!cfg.recipients?.length) {
    return NextResponse.json({ error: "no recipients" }, { status: 400 });
  }

  const res = await sendAlertEmail({
    to: cfg.recipients,
    title: "Monitoring – Test",
    severity: "info",
    items: [{ name: "system-matrix" }],
    linkHref: "/admin/system",
    linkLabel: "System öffnen",
    note: "Dies ist eine Testbenachrichtigung.",
  });

  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}
