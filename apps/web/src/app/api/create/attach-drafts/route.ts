import type { NextRequest } from "next/server";
import { POST as handleAttachDraftSave } from "@/app/api/contributions/attach-drafts/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleAttachDraftSave(req);
}
