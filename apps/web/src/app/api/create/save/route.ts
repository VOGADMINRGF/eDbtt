import type { NextRequest } from "next/server";
import { POST as saveHandler } from "@/app/api/contributions/save/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  return saveHandler(req);
}
