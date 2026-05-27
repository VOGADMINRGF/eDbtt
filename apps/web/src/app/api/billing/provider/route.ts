import { NextResponse } from "next/server";
import { resolvePaymentProviderContract } from "@features/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: resolvePaymentProviderContract(),
  });
}
