import { NextRequest, NextResponse } from "next/server";
import {
  isBerlinDigestHour,
  sendDailyOperatorDigest,
} from "@/features/operator/operatorNotifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = String(process.env.CRON_SECRET ?? "").trim();
  if (!secret || secret.length < 16) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  if (!isBerlinDigestHour(now)) {
    return NextResponse.json({ ok: true, skipped: "outside_berlin_18h_window" });
  }

  const result = await sendDailyOperatorDigest(now);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
