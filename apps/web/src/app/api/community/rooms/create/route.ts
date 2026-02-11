import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { saveCommunityRoom } from "@core/community";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["open", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  }

  try {
    const room = await saveCommunityRoom({
      id: parsed.data.id,
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      tags: parsed.data.tags ?? [],
    });
    logger.info({ msg: "community.room.saved", id: room.id, status: room.status });
    return NextResponse.json({ ok: true, room });
  } catch (err: any) {
    logger.error({ msg: "community.room.save_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
