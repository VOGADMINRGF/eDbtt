import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getMediaProjectOptionById,
  incrementMediaProjectOptionVote,
} from "@core/mediaProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  optionId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const option = await getMediaProjectOptionById(parsed.data.optionId);
  if (!option || option.projectId !== projectId) {
    return NextResponse.json({ ok: false, error: "option_not_found" }, { status: 404 });
  }

  const updated = await incrementMediaProjectOptionVote(option.id);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "vote_rejected" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, option: updated });
}
