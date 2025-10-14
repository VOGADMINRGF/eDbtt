
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now(), env: process.env.NEXT_PUBLIC_APP_ENV || "dev" });
}
