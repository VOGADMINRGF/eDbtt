import type { NextRequest } from "next/server";
import { POST as handleSave } from "@/app/api/contributions/save/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleSave(req);
}
