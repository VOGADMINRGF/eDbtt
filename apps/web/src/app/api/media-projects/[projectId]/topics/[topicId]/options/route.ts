import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMediaProjectOption } from "@core/mediaProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  label: z.string().min(2).max(140),
  proposedBy: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; topicId: string }> },
) {
  const { projectId, topicId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await addMediaProjectOption({
    projectId,
    topicId,
    label: parsed.data.label,
    proposedBy: parsed.data.proposedBy ?? null,
  });

  if (!created) {
    return NextResponse.json({ ok: false, error: "topic_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, option: created });
}
