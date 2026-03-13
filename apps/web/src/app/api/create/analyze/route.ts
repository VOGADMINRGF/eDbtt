import type { NextRequest } from "next/server";
import { POST as handleAnalyze } from "@/app/api/contributions/analyze/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handleAnalyze(req);
}
