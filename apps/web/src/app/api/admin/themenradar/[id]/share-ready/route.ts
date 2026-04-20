import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { createShareReadyForThemenradarItem } from "@features/themenradar/store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: Context) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  try {
    const detail = await createShareReadyForThemenradarItem(id, {
      userId: String((gate as any)?._id ?? ""),
      email: typeof (gate as any)?.email === "string" ? (gate as any).email : null,
    });
    return NextResponse.json({
      ok: true,
      detail,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "themenradar_share_ready_failed";
    const status =
      message === "themenradar_item_not_found"
        ? 404
        : message === "themenradar_share_ready_locked" ||
            message === "themenradar_not_qualified_for_share_ready" ||
            message === "invalid_lifecycle_transition"
          ? 409
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
