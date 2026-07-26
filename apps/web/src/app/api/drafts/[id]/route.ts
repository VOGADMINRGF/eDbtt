import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDraft } from "@/server/draftStore";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const draft = await getDraft(id);
  return NextResponse.json({ ok: !!draft, draft });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ctx.params;
  await req.json().catch(() => null);
  return NextResponse.json(
    { ok: false, error: "legacy_draft_write_retired" },
    { status: 410 },
  );
}
