import { NextRequest, NextResponse } from "next/server";
import { createDraft } from "@/server/draftStore";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const draft = createDraft(body);
  return NextResponse.json({ ok: true, id: draft.id, draft });
}
