import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { getPilotSettings, updatePilotSettings, type PilotSettings } from "@core/pilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  check_level: z.number().int().min(0).max(2).optional(),
  daily_budget: z.number().min(0).optional(),
  per_topic_budget: z.number().min(0).optional(),
  auto_run_enabled: z.boolean().optional(),
  max_items_per_feed: z.number().int().min(1).max(50).optional(),
});

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { settings, meta } = await getPilotSettings();
  return NextResponse.json({ ok: true, settings, meta });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const json = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = gate as any;
  const actorId = user?._id ? String(user._id) : null;
  const patch = parsed.data as Partial<PilotSettings>;
  const { settings, meta } = await updatePilotSettings(patch, actorId);
  return NextResponse.json({ ok: true, settings, meta });
}
