import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await req.json().catch(() => null);
  return NextResponse.json(
    { ok: false, error: "legacy_draft_write_retired" },
    { status: 410 },
  );
}
