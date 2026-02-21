import type { NextRequest } from "next/server";
import { POST as finalizeContribution } from "@/app/api/contributions/finalize/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return finalizeContribution(req);
}
