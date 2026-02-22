import { NextRequest, NextResponse } from "next/server";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const entitlements = await getCreateEntitlementsForRequest(req);
  return NextResponse.json({ ok: true, entitlements }, { status: 200 });
}
