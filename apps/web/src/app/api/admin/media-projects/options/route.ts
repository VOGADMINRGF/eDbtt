import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { updateMediaProjectOptionStatus } from "@core/mediaProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  optionId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateMediaProjectOptionStatus(parsed.data.optionId, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "option_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, option: updated });
}
