import type { NextRequest } from "next/server";
import { POST as finalizeHandler } from "@/app/api/contributions/finalize/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  return finalizeHandler(req);
}
