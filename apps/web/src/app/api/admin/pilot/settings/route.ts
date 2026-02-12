import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPilotSettings, updatePilotSettings } from "@core/pilotSettings";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateSchema = z
  .object({
    checkLevel: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
    dailyBudget: z.number().finite().min(0).optional(),
    perTopicBudget: z.number().finite().min(0).optional(),
    autoRunEnabled: z.boolean().optional(),
    maxItemsPerFeed: z.number().int().min(1).max(50).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const settings = await getPilotSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const userId = (gate as any)?._id ? String((gate as any)._id) : null;
  const settings = await updatePilotSettings(parsed.data, { userId });
  return NextResponse.json({ ok: true, settings });
}
