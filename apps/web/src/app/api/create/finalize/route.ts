import type { NextRequest } from "next/server";
import { POST as handleFinalize } from "@/app/api/contributions/finalize/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Keep one server-owned finalize decision path (including redirect target).
  return handleFinalize(req);
}
